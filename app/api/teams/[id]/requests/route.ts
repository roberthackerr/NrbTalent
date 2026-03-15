// app/api/teams/[id]/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { Team } from "@/lib/models/team";

// GET - Récupérer toutes les demandes (pour le lead d'équipe)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id;
    const db = await getDatabase();
    const teamId = new ObjectId(id);

    // 2. Verify team lead permissions
    const team = await db.collection<Team>("teams").findOne({ 
      _id: teamId,
      "members.userId": new ObjectId(currentUserId),
      "members.isLead": true
    });

    if (!team) {
      return NextResponse.json({ 
        error: "Only team leads can view join requests" 
      }, { status: 403 });
    }

    // 3. Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    // 4. Build query
    const query: any = {
      teamId: teamId
    };

    if (status !== 'all') {
      query.status = status;
    }

    // 5. Get join requests with user details
    const skip = (page - 1) * limit;
    
    const joinRequests = await db.collection("team_join_requests")
      .aggregate([
        { $match: query },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        // Join with users collection
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails"
          }
        },
        { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
        // Format the response
        {
          $project: {
            _id: 1,
            userId: 1,
            teamId: 1,
            status: 1,
            message: 1,
            skills: 1,
            experience: 1,
            createdAt: 1,
            updatedAt: 1,
            acceptedAt: 1,
            rejectedAt: 1,
            processedBy: 1,
            userInfo: {
              name: "$userDetails.name",
              email: "$userDetails.email",
              avatar: "$userDetails.avatar",
              title: "$userDetails.title",
              rating: "$userDetails.rating",
              statistics: "$userDetails.statistics",
              skills: "$userDetails.skills",
              location: "$userDetails.location",
              role: "$userDetails.role"
            }
          }
        }
      ])
      .toArray();

    // 6. Get total count for pagination
    const totalCount = await db.collection("team_join_requests").countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        requests: joinRequests,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit)
        },
        filters: {
          status,
          teamId: id
        }
      }
    });

  } catch (error) {
    console.error("Error fetching join requests:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST - Créer une demande de rejoindre l'équipe
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id;
    const db = await getDatabase();
    const teamId = new ObjectId(id);

    // 2. Check if team exists and is joinable
    const team = await db.collection<Team>("teams").findOne({ 
      _id: teamId,
     // isActive: true
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.availability !== 'available') {
      return NextResponse.json({ 
        error: "This team is not currently accepting new members" 
      }, { status: 400 });
    }

    // 3. Check if user is already a member
    const isAlreadyMember = team.members.some(m => 
      m.userId.toString() === currentUserId
    );
    
    if (isAlreadyMember) {
      return NextResponse.json({ 
        error: "You are already a member of this team" 
      }, { status: 400 });
    }

    // 4. Check team capacity
    if (team.members.length >= (team.maxMembers || 5)) {
      return NextResponse.json({ 
        error: "Team is full. Cannot send join request." 
      }, { status: 400 });
    }

    // 5. Get request data
    const requestData = await request.json();
    const { message, skills, experience } = requestData;

    // 6. Check for existing pending request
    const existingRequest = await db.collection("team_join_requests").findOne({
      teamId: teamId,
      userId: new ObjectId(currentUserId),
      status: 'pending'
    });

    if (existingRequest) {
      return NextResponse.json({ 
        error: "You already have a pending request for this team" 
      }, { status: 400 });
    }

    // 7. Get user details
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(currentUserId) },
      { projection: { name: 1, email: 1, skills: 1, role: 1 } }
    );

    if (!user || user.role !== 'freelance') {
      return NextResponse.json({ 
        error: "Only freelancers can send join requests" 
      }, { status: 403 });
    }

    // 8. Create join request
    const joinRequest = {
      teamId: teamId,
      userId: new ObjectId(currentUserId),
      status: 'pending',
      message: message || `I'd like to join ${team.name}`,
      skills: skills || user.skills || [],
      experience: experience || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("team_join_requests").insertOne(joinRequest);

    // 9. Create notification for team lead(s)
    const teamLeads = team.members.filter(m => m.isLead);
    
    for (const lead of teamLeads) {
      await db.collection("notifications").insertOne({
        userId: lead.userId,
        type: "team_join_request_received",
        title: "New Join Request",
        message: `${user.name} wants to join "${team.name}"`,
        data: {
          teamId: teamId.toString(),
          teamName: team.name,
          requestId: result.insertedId.toString(),
          requesterId: currentUserId,
          requesterName: user.name
        },
        read: false,
        createdAt: new Date()
      });
    }

    // 10. Create notification for user
    await db.collection("notifications").insertOne({
      userId: new ObjectId(currentUserId),
      type: "team_join_request_sent",
      title: "Request Sent",
      message: `Your request to join "${team.name}" has been sent to the team lead`,
      data: {
        teamId: teamId.toString(),
        teamName: team.name
      },
      read: false,
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: "Join request sent successfully",
      data: {
        requestId: result.insertedId.toString(),
        teamName: team.name,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error("Error creating join request:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
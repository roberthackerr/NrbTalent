// app/api/teams/[id]/requests/[requestId]/accept/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { Team } from "@/lib/models/team";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const { id, requestId } = await params;
    
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id;
    const db = await getDatabase();
    const teamId = new ObjectId(id);
    const joinRequestId = new ObjectId(requestId);

    // 2. Verify team lead permissions
    const team = await db.collection<Team>("teams").findOne({ 
      _id: teamId,
      "members.userId": new ObjectId(currentUserId),
      "members.isLead": true
    });

    if (!team) {
      return NextResponse.json({ 
        error: "Only team leads can accept join requests" 
      }, { status: 403 });
    }

    // 3. Get join request
    const joinRequest = await db.collection("team_join_requests").findOne({
      _id: joinRequestId,
      teamId: teamId,
      status: 'pending'
    });

    if (!joinRequest) {
      return NextResponse.json({ 
        error: "Join request not found or already processed" 
      }, { status: 404 });
    }

    // 4. Check if user is already a member
    const isAlreadyMember = team.members.some(m => 
      m.userId.toString() === joinRequest.userId.toString()
    );
    
    if (isAlreadyMember) {
      // Archive the request since user is already a member
      await db.collection("team_join_requests").updateOne(
        { _id: joinRequestId },
        { 
          $set: { 
            status: 'archived',
            archivedReason: 'already_member',
            updatedAt: new Date()
          }
        }
      );
      
      return NextResponse.json({ 
        error: "User is already a member of this team" 
      }, { status: 400 });
    }

    // 5. Check team capacity
    if (team.members.length >= (team.maxMembers || 5)) {
      return NextResponse.json({ 
        error: "Team is full. Cannot accept more members." 
      }, { status: 400 });
    }

    // 6. Get user's details
    const user = await db.collection("users").findOne(
      { _id: joinRequest.userId },
      { projection: { 
        name: 1, 
        email: 1, 
        avatar: 1, 
        skills: 1, 
        role: 1,
        title: 1,
        rating: 1,
        statistics: 1
      }}
    );

    if (!user || user.role !== 'freelance') {
      return NextResponse.json({ 
        error: "Only freelancers can join teams" 
      }, { status: 400 });
    }

    // 7. Update join request status to 'accepted' (NOT 'joined' yet!)
    await db.collection("team_join_requests").updateOne(
      { _id: joinRequestId },
      { 
        $set: { 
          status: 'accepted',
          acceptedAt: new Date(),
          processedBy: new ObjectId(currentUserId),
          updatedAt: new Date()
        }
      }
    );

    // 8. Create notification for the requester
    await db.collection("notifications").insertOne({
      userId: joinRequest.userId,
      type: "team_join_request_accepted",
      title: "Request Accepted!",
      message: `Your request to join "${team.name}" has been accepted. You can now join the team.`,
      data: {
        teamId: teamId.toString(),
        teamName: team.name,
        acceptedBy: currentUserId,
        acceptedByName: session.user?.name || 'Team Lead'
      },
      read: false,
      createdAt: new Date()
    });

    // 9. Create notification for team lead
    await db.collection("notifications").insertOne({
      userId: new ObjectId(currentUserId),
      type: "team_join_request_approved",
      title: "Join Request Approved",
      message: `You approved ${user.name}'s request to join "${team.name}". They can now join the team.`,
      data: {
        teamId: teamId.toString(),
        teamName: team.name,
        requesterId: joinRequest.userId.toString(),
        requesterName: user.name
      },
      read: false,
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: "Join request accepted successfully. The user can now join the team.",
      data: {
        teamId: teamId.toString(),
        teamName: team.name,
        requester: {
          id: joinRequest.userId.toString(),
          name: user.name,
          email: user.email
        },
        nextStep: "The user must now use /api/teams/[id]/join to actually join the team"
      }
    });

  } catch (error) {
    console.error("Error accepting join request:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
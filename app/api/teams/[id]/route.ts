// app/api/teams/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { Team } from "@/lib/models/team";
import type { User } from "@/lib/models/user";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Optional authentication
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user ? (session.user as any).id : null;

    // 2. Validate team ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
    }

    const db = await getDatabase();
    const teamId = new ObjectId(id);

    // 3. Get team with member details
    const team = await db.collection<Team>("teams").findOne({ _id: teamId });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // 4. Get detailed member information - FIXED HERE
    let detailedMembers: any[] = [];
    let memberIds: ObjectId[] = [];

    // Check if team.members exists and is an array
    if (team.members && Array.isArray(team.members)) {
      // Safely extract member IDs
      memberIds = team.members
        .filter(member => member && member.userId && ObjectId.isValid(member.userId))
        .map(member => new ObjectId(member.userId));
    }

    // Only fetch users if we have valid member IDs
    if (memberIds.length > 0) {
      try {
        const members = await db.collection<User>("users")
          .find({ _id: { $in: memberIds } })
          .project({
            name: 1,
            avatar: 1,
            title: 1,
            skills: 1,
            rating: 1,
            statistics: 1,
            location: 1,
            timezone: 1
          })
          .toArray();

        // Map members with their team roles - SAFELY
        detailedMembers = team.members.map(teamMember => {
          if (!teamMember || !teamMember.userId) return null;
          
          const user = members.find(u => 
            u._id && teamMember.userId && 
            u._id.toString() === teamMember.userId.toString()
          );
          
          return {
            userId: teamMember.userId.toString(),
            role: teamMember.role || "member",
            isLead: teamMember.isLead || false,
            joinDate: teamMember.joinDate || new Date(),
            skills: teamMember.skills || [],
            userInfo: user ? {
              name: user.name,
              avatar: user.avatar,
              title: user.title,
              rating: user.rating,
              statistics: user.statistics,
              location: user.location,
              timezone: user.timezone
            } : null
          };
        }).filter(Boolean); // Remove null entries
      } catch (error) {
        console.error("Error fetching member details:", error);
        // Fallback to basic member info
        detailedMembers = team.members.map(member => ({
          userId: member.userId?.toString(),
          role: member.role,
          isLead: member.isLead,
          joinDate: member.joinDate,
          skills: member.skills,
          userInfo: null
        })).filter(Boolean);
      }
    }

    // 5. Check if current user can join - SAFELY
    const canJoin = currentUserId && team.members && Array.isArray(team.members)
      ? team.availability === 'available' &&
        team.members.length < (team.maxMembers || 5) &&
        !team.members.some(m => 
          m && m.userId && m.userId.toString() === currentUserId
        )
      : false;

    // 6. Prepare response with SAFE property access
    const response = {
      id: team._id?.toString(),
      name: team.name || 'Unnamed Team',
      tagline: team.tagline || '',
      description: team.description || '',
      
      // Team composition
      members: detailedMembers,
      memberCount: team.members?.length || 0,
      maxMembers: team.maxMembers || 5,
      availability: team.availability || 'available',
      
      // Skills & expertise
      skills: team.skills || [],
      specialties: team.specialties || [],
      
      // Performance stats
      completedProjects: team.completedProjects || 0,
      rating: team.rating || null,
      totalEarnings: team.totalEarnings || 0,
      hourlyRate: team.hourlyRate,
      
      // Preferences
      preferredProjectTypes: team.preferredProjectTypes || [],
      preferences: team.preferences || {
        minBudget: 1000,
        maxTeamSize: 5,
        workStyle: "mixed",
        communicationTools: ["chat", "video"]
      },
      
      // Metadata
      isPublic: team.isPublic !== false,
      isActive: team.isActive !== false,
      createdAt: team.createdAt || new Date(),
      updatedAt: team.updatedAt || new Date(),
      
      // Current user context
      currentUser: currentUserId ? {
        isMember: team.members?.some(m => 
          m && m.userId && m.userId.toString() === currentUserId
        ) || false,
        isLead: team.members?.some(m => 
          m && m.userId && m.userId.toString() === currentUserId && m.isLead
        ) || false,
        canJoin,
        canInvite: team.members?.some(m => 
          m && m.userId && m.userId.toString() === currentUserId && m.isLead
        ) || false
      } : null
    };

    return NextResponse.json({
      success: true,
      team: response
    });

  } catch (error) {
    console.error("Error fetching team:", error);
    
    // Add more debugging info
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : "Unknown error",
        hint: "Check if team members array exists and has proper structure"
      }, 
      { status: 500 }
    );
  }
}
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id;
    const db = await getDatabase();
    const teamId = new ObjectId(id);

    // Check if user is team lead
    const team = await db.collection<Team>("teams").findOne({ 
      _id: teamId,
      "members.userId": new ObjectId(currentUserId),
      "members.isLead": true
    });

    if (!team) {
      return NextResponse.json({ error: "Only team leads can update team" }, { status: 403 });
    }

    const updates = await request.json();
    
    // Remove restricted fields
    const restrictedFields = ['_id', 'members', 'createdAt', 'completedProjects', 'totalEarnings', 'rating'];
    restrictedFields.forEach(field => delete updates[field]);

    // Update team
    const result = await db.collection<Team>("teams").updateOne(
      { _id: teamId },
      { 
        $set: { 
          ...updates,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Team updated successfully"
    });

  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
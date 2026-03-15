import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { Team } from "@/lib/models/team";
import type { User } from "@/lib/models/user";

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

    // 2. Get team
    const team = await db.collection<Team>("teams").findOne({ 
      _id: teamId,
      "members.userId": new ObjectId(currentUserId)
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found or you're not a member" }, { status: 404 });
    }

    // 3. Check if user is team lead
    const userMember = team.members.find(m => m.userId.toString() === currentUserId);
    if (userMember?.isLead) {
      return NextResponse.json({ 
        error: "Team leads cannot leave the team. Transfer leadership first or delete the team.",
        code: "IS_TEAM_LEAD"
      }, { status: 403 });
    }

    // Start transaction
    const sessionMongo = await db.client.startSession();
    
    try {
      await sessionMongo.withTransaction(async () => {
        // 4. Remove user from team members
        const updateResult = await db.collection<Team>("teams").updateOne(
          { _id: teamId },
          { 
            $pull: { 
              members: { userId: new ObjectId(currentUserId) }
            },
            $set: { updatedAt: new Date() }
          },
          { session: sessionMongo }
        );

        if (updateResult.matchedCount === 0) {
          throw new Error("Team not found");
        }

        // 5. Remove team from user's teams array
        await db.collection<User>("users").updateOne(
          { _id: new ObjectId(currentUserId) },
          { 
            $pull: { teams: teamId }
          },
          { session: sessionMongo }
        );

        // 6. Create notification for team lead
        const teamLead = team.members.find(m => m.isLead);
        if (teamLead) {
          await db.collection("notifications").insertOne({
            userId: teamLead.userId,
            type: "team_member_left",
            title: "Team Member Left",
            message: `${session.user?.name} has left the team "${team.name}"`,
            data: {
              teamId: teamId.toString(),
              teamName: team.name,
              memberId: currentUserId,
              memberName: session.user?.name
            },
            read: false,
            createdAt: new Date()
          }, { session: sessionMongo });
        }

        // 7. Create activity log
        await db.collection("activities").insertOne({
          type: "member_left_team",
          teamId: teamId,
          userId: new ObjectId(currentUserId),
          data: {
            teamName: team.name,
            memberName: session.user?.name,
            memberCount: team.members.length - 1
          },
          createdAt: new Date()
        }, { session: sessionMongo });

        // 8. Archive any pending invitations for this user to this team
        await db.collection("team_invitations").updateMany(
          {
            teamId: teamId,
            freelancerId: new ObjectId(currentUserId),
            status: 'pending'
          },
          {
            $set: {
              status: 'archived',
              archivedReason: 'member_left_team',
              updatedAt: new Date()
            }
          },
          { session: sessionMongo }
        );
      });
    } finally {
      await sessionMongo.endSession();
    }

    return NextResponse.json({
      success: true,
      message: "Successfully left the team",
      team: {
        id: teamId.toString(),
        name: team.name,
        memberCount: team.members.length - 1
      }
    });

  } catch (error) {
    console.error("Error leaving team:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
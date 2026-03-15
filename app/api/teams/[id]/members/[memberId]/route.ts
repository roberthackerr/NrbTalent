import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { Team } from "@/lib/models/team";
import type { User } from "@/lib/models/user";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params;
    
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id;
    const db = await getDatabase();
    const teamId = new ObjectId(id);
    const memberToRemoveId = new ObjectId(memberId);

    // 2. Check if current user is team lead
    const team = await db.collection<Team>("teams").findOne({ 
      _id: teamId,
      "members.userId": new ObjectId(currentUserId),
      "members.isLead": true
    });

    if (!team) {
      return NextResponse.json({ 
        error: "Only team leads can remove members",
        code: "NOT_TEAM_LEAD"
      }, { status: 403 });
    }

    // 3. Check if member exists in team
    const memberToRemove = team.members.find(m => 
      m.userId.toString() === memberId
    );

    if (!memberToRemove) {
      return NextResponse.json({ 
        error: "Member not found in this team" 
      }, { status: 404 });
    }

    // 4. Check if trying to remove yourself (should use leave endpoint instead)
    if (memberId === currentUserId) {
      return NextResponse.json({ 
        error: "Team leads cannot remove themselves. Use the leave endpoint or transfer leadership first.",
        code: "CANNOT_REMOVE_SELF"
      }, { status: 400 });
    }

    // 5. Check if trying to remove another team lead
    if (memberToRemove.isLead) {
      return NextResponse.json({ 
        error: "Cannot remove another team lead. They must leave voluntarily or you must transfer leadership first.",
        code: "CANNOT_REMOVE_LEAD"
      }, { status: 400 });
    }

    // 6. Get member details for notifications
    const memberUser = await db.collection<User>("users").findOne(
      { _id: memberToRemoveId },
      { projection: { name: 1, email: 1 } }
    );

    // Start transaction
    const sessionMongo = await db.client.startSession();
    
    try {
      await sessionMongo.withTransaction(async () => {
        // 7. Remove member from team
        const updateResult = await db.collection<Team>("teams").updateOne(
          { _id: teamId },
          { 
            $pull: { 
              members: { userId: memberToRemoveId }
            },
            $set: { 
              updatedAt: new Date(),
              availability: team.members.length <= 1 ? 'available' : team.availability
            }
          },
          { session: sessionMongo }
        );

        if (updateResult.matchedCount === 0) {
          throw new Error("Team not found");
        }

        // 8. Remove team from user's teams array
        await db.collection<User>("users").updateOne(
          { _id: memberToRemoveId },
          { 
            $pull: { teams: teamId }
          },
          { session: sessionMongo }
        );

        // 9. Create notification for removed member
        if (memberUser) {
          await db.collection("notifications").insertOne({
            userId: memberToRemoveId,
            type: "removed_from_team",
            title: "Removed from Team",
            message: `You have been removed from the team "${team.name}" by ${session.user?.name}`,
            data: {
              teamId: teamId.toString(),
              teamName: team.name,
              removedBy: currentUserId,
              removedByName: session.user?.name,
              reason: "Removed by team lead"
            },
            read: false,
            createdAt: new Date()
          }, { session: sessionMongo });
        }

        // 10. Create notification for team lead
        await db.collection("notifications").insertOne({
          userId: new ObjectId(currentUserId),
          type: "member_removed",
          title: "Member Removed",
          message: `You have removed ${memberUser?.name || 'a member'} from "${team.name}"`,
          data: {
            teamId: teamId.toString(),
            teamName: team.name,
            removedMemberId: memberId,
            removedMemberName: memberUser?.name,
            remainingMembers: team.members.length - 1
          },
          read: false,
          createdAt: new Date()
        }, { session: sessionMongo });

        // 11. Create activity log
        await db.collection("activities").insertOne({
          type: "member_removed_by_lead",
          teamId: teamId,
          userId: new ObjectId(currentUserId),
          targetUserId: memberToRemoveId,
          data: {
            teamName: team.name,
            removedMemberName: memberUser?.name,
            removedBy: session.user?.name,
            memberCount: team.members.length - 1
          },
          createdAt: new Date()
        }, { session: sessionMongo });

        // 12. Archive any pending invitations for this user to this team
        await db.collection("team_invitations").updateMany(
          {
            teamId: teamId,
            freelancerId: memberToRemoveId,
            status: 'pending'
          },
          {
            $set: {
              status: 'archived',
              archivedReason: 'removed_by_lead',
              updatedAt: new Date()
            }
          },
          { session: sessionMongo }
        );

        // 13. If team becomes empty after removal, mark as inactive
        if (team.members.length <= 1) {
          await db.collection<Team>("teams").updateOne(
            { _id: teamId },
            {
              $set: {
                isActive: false,
                availability: 'full'
              }
            },
            { session: sessionMongo }
          );
        }
      });
    } finally {
      await sessionMongo.endSession();
    }

    return NextResponse.json({
      success: true,
      message: "Member removed successfully",
      team: {
        id: teamId.toString(),
        name: team.name,
        memberCount: team.members.length - 1,
        remainingMembers: team.members.filter(m => m.userId.toString() !== memberId).length
      },
      removedMember: {
        id: memberId,
        name: memberUser?.name
      }
    });

  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
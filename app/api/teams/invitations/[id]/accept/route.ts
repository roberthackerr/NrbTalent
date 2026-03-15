import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { Team, TeamMember } from "@/lib/models/team";
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
    const invitationId = new ObjectId(id);

    // 2. Get invitation
    const invitation = await db.collection("team_invitations").findOne({
      _id: invitationId,
      freelancerId: new ObjectId(currentUserId),
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (!invitation) {
      return NextResponse.json({ 
        error: "Invitation not found, expired, or already processed" 
      }, { status: 404 });
    }
const team = await db.collection<Team>("teams").findOne({ 
  _id: invitation.teamId,
  //"members.userId": new ObjectId(currentUserId)
});

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // 4. Check team capacity
    if (team.members.length >= (team.maxMembers || 5)) {
      return NextResponse.json({ error: "Team is now full" }, { status: 400 });
    }

    // 5. Check if user is already a member
    const isAlreadyMember = team.members.some(m => 
      m.userId.toString() === currentUserId
    );
    if (isAlreadyMember) {
      return NextResponse.json({ error: "You are already a member of this team" }, { status: 400 });
    }

    // 6. Get user's skills
    const user = await db.collection<User>("users").findOne(
      { _id: new ObjectId(currentUserId) },
      { projection: { skills: 1, role: 1, name: 1, avatar: 1 } }
    );

    if (!user || user.role !== 'freelance') {
      return NextResponse.json({ error: "Only freelancers can join teams" }, { status: 403 });
    }

    // 7. Convert user skills to team member skills
    const userSkills: TeamMember['skills'] = (user.skills || []).map((skill: any) => ({
      name: skill.name || "",
      category: skill.category || "Other",
      level: skill.level || "beginner",
      yearsOfExperience: skill.yearsOfExperience || 0,
      featured: skill.featured || false
    }));

    // 8. Create new team member
    const newMember: TeamMember = {
      userId: new ObjectId(currentUserId),
      role: "member",
      joinDate: new Date(),
      isLead: false,
      skills: userSkills
    };

    // Start transaction
    const sessionMongo = await db.client.startSession();
    
    try {
      await sessionMongo.withTransaction(async () => {
        // 9. Update team with new member
        const updateResult = await db.collection<Team>("teams").updateOne(
          { _id: invitation.teamId },
          { 
            $push: { members: newMember },
            $set: { updatedAt: new Date() }
          },
          { session: sessionMongo }
        );

        if (updateResult.matchedCount === 0) {
          throw new Error("Team not found");
        }

        // 10. Update invitation status
        await db.collection("team_invitations").updateOne(
          { _id: invitationId },
          { 
            $set: { 
              status: 'accepted',
              updatedAt: new Date()
            }
          },
          { session: sessionMongo }
        );

        // 11. Update user's teams array
        await db.collection<User>("users").updateOne(
          { _id: new ObjectId(currentUserId) },
          { 
            $addToSet: { teams: invitation.teamId }
          },
          { session: sessionMongo }
        );

        // 12. Create notification for team lead
        const teamLead = team.members.find(m => m.isLead);
        if (teamLead) {
          await db.collection("notifications").insertOne({
            userId: teamLead.userId,
            type: "team_invitation_accepted",
            title: "Invitation Accepted!",
            message: `${user.name} has accepted your invitation to join "${team.name}"`,
            data: {
              teamId: invitation.teamId.toString(),
              teamName: team.name,
              newMemberId: currentUserId,
              newMemberName: user.name
            },
            read: false,
            createdAt: new Date()
          }, { session: sessionMongo });
        }

        // 13. Create notification for user
        await db.collection("notifications").insertOne({
          userId: new ObjectId(currentUserId),
          type: "team_joined",
          title: "Welcome to the Team!",
          message: `You've successfully joined "${team.name}"`,
          data: {
            teamId: invitation.teamId.toString(),
            teamName: team.name,
            role: "member"
          },
          read: false,
          createdAt: new Date()
        }, { session: sessionMongo });
      });
    } finally {
      await sessionMongo.endSession();
    }

    return NextResponse.json({
      success: true,
      message: "Successfully joined the team!",
      team: {
        id: invitation.teamId.toString(),
        name: team.name,
        memberCount: team.members.length + 1,
        yourRole: "member"
      }
    });

  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }

  
}


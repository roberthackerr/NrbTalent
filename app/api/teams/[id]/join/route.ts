// app/api/teams/[id]/join/route.ts
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
    const teamId = new ObjectId(id);

    // 2. Vérifier si l'utilisateur a une demande ACCEPTÉE
    const acceptedRequest = await db.collection("team_join_requests").findOne({
      teamId: teamId,
      userId: new ObjectId(currentUserId),
      status: 'accepted'  // IMPORTANT: status doit être 'accepted' (pas 'pending')
    });

    // 3. Vérifier si l'utilisateur a une invitation directe (ancien système optionnel)
    const directInvitation = await db.collection("team_invitations").findOne({
      teamId: teamId,
      freelancerId: new ObjectId(currentUserId),
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    // 4. L'utilisateur doit avoir soit une demande acceptée, soit une invitation
    if (!acceptedRequest && !directInvitation) {
      return NextResponse.json({ 
        error: "You need an invitation or an approved join request to join this team",
        code: "AUTHORIZATION_REQUIRED",
        suggestion: "Submit a join request and wait for team lead approval"
      }, { status: 403 });
    }

    // 5. Get team
    const team = await db.collection<Team>("teams").findOne({ _id: teamId });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // 6. Check if user is already a member
    const isAlreadyMember = team.members.some(m => 
      m.userId.toString() === currentUserId
    );
    
    if (isAlreadyMember) {
      // Marquer la demande comme "joined" si elle existe
      if (acceptedRequest) {
        await db.collection("team_join_requests").updateOne(
          { _id: acceptedRequest._id },
          { $set: { status: 'joined', updatedAt: new Date() } }
        );
      }
      
      return NextResponse.json({ 
        error: "You are already a member of this team",
        code: "ALREADY_MEMBER"
      }, { status: 400 });
    }

    // 7. Check team capacity
    if (team.members.length >= (team.maxMembers || 5)) {
      return NextResponse.json({ error: "Team is full" }, { status: 400 });
    }

    // 8. Get user's details
    const user = await db.collection<User>("users").findOne(
      { _id: new ObjectId(currentUserId) },
      { projection: { 
        skills: 1, 
        role: 1, 
        name: 1, 
        avatar: 1,
        email: 1,
        title: 1,
        rating: 1,
        statistics: 1
      }}
    );

    if (!user || user.role !== 'freelance') {
      return NextResponse.json({ error: "Only freelancers can join teams" }, { status: 403 });
    }

    // 9. Convert user skills to team member skills
    const userSkills: TeamMember['skills'] = (user.skills || []).map((skill: any) => ({
      name: skill.name || "",
      category: skill.category || "Other",
      level: skill.level || "beginner",
      yearsOfExperience: skill.yearsOfExperience || 0,
      featured: skill.featured || false
    }));

    // 10. Create new team member
    const newMember: TeamMember = {
      userId: new ObjectId(currentUserId),
      role: "member",
      joinDate: new Date(),
      isLead: false,
      skills: userSkills,
      joinMethod: acceptedRequest ? 'request' : 'invitation',
      joinRequestId: acceptedRequest?._id,
      invitationId: directInvitation?._id
    };

    // 11. Start transaction
    const sessionMongo = await db.client.startSession();
    
    try {
      await sessionMongo.withTransaction(async () => {
        // Add user to team
        await db.collection<Team>("teams").updateOne(
          { _id: teamId },
          { 
            $push: { members: newMember },
            $set: { updatedAt: new Date() }
          },
          { session: sessionMongo }
        );

        // Update request status to 'joined' (si c'était une demande)
        if (acceptedRequest) {
          await db.collection("team_join_requests").updateOne(
            { _id: acceptedRequest._id },
            { 
              $set: { 
                status: 'joined',
                joinedAt: new Date(),
                updatedAt: new Date()
              }
            },
            { session: sessionMongo }
          );
        }

        // Update invitation status (si c'était une invitation)
        if (directInvitation) {
          await db.collection("team_invitations").updateOne(
            { _id: directInvitation._id },
            { 
              $set: { 
                status: 'accepted',
                acceptedAt: new Date(),
                updatedAt: new Date()
              }
            },
            { session: sessionMongo }
          );
        }

        // Add team to user's teams array
        await db.collection<User>("users").updateOne(
          { _id: new ObjectId(currentUserId) },
          { 
            $addToSet: { teams: teamId }
          },
          { session: sessionMongo }
        );

        // Notifications
        const teamLead = team.members.find(m => m.isLead);
        if (teamLead) {
          await db.collection("notifications").insertOne({
            userId: teamLead.userId,
            type: "team_member_joined",
            title: "New Member Joined",
            message: `${user.name} has joined "${team.name}"`,
            data: {
              teamId: teamId.toString(),
              teamName: team.name,
              newMemberId: currentUserId,
              newMemberName: user.name
            },
            read: false,
            createdAt: new Date()
          }, { session: sessionMongo });
        }

        // Notification for the user
        await db.collection("notifications").insertOne({
          userId: new ObjectId(currentUserId),
          type: "team_joined",
          title: "Welcome to the Team!",
          message: `You've successfully joined "${team.name}"`,
          data: {
            teamId: teamId.toString(),
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
      message: "Successfully joined the team",
      team: {
        id: teamId.toString(),
        name: team.name,
        memberCount: team.members.length + 1,
        yourRole: "member"
      }
    });

  } catch (error) {
    console.error("Error joining team:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
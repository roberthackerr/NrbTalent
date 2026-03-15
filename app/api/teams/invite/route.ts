// app/api/teams/invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { Team } from "@/lib/models/team";
import type { User } from "@/lib/models/user";

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id;
    const db = await getDatabase();
    const data = await request.json();

    // 2. Validate request
    const { teamId, freelancerIds, message } = data;
    
    if (!teamId || !freelancerIds || !Array.isArray(freelancerIds) || freelancerIds.length === 0) {
      return NextResponse.json({ 
        error: "Team ID and at least one freelancer ID are required" 
      }, { status: 400 });
    }

    // 3. Check if user is team lead
    const team = await db.collection<Team>("teams").findOne({ 
      _id: new ObjectId(teamId),
      "members.userId": new ObjectId(currentUserId),
      "members.isLead": true
    });

    if (!team) {
      return NextResponse.json({ 
        error: "Only team leads can invite members" 
      }, { status: 403 });
    }

    // 4. Check team capacity
    const availableSpots = (team.maxMembers || 5) - team.members.length;
    if (availableSpots < freelancerIds.length) {
      return NextResponse.json({ 
        error: `Team only has ${availableSpots} spot(s) available`,
        availableSpots 
      }, { status: 400 });
    }

    // 5. Get freelancer details
    const freelancerObjectIds = freelancerIds.map((id: string) => new ObjectId(id));
    const freelancers = await db.collection<User>("users")
      .find({ 
        _id: { $in: freelancerObjectIds },
        role: 'freelance'
      })
      .project({ name: 1, email: 1, avatar: 1, skills: 1 })
      .toArray();

    if (freelancers.length === 0) {
      return NextResponse.json({ error: "No valid freelancers found" }, { status: 400 });
    }

    // 6. Check if freelancers are already in team
    const existingMemberIds = team.members.map(m => m.userId.toString());
    const alreadyInTeam = freelancers.filter(f => 
      existingMemberIds.includes(f._id?.toString() || '')
    );
    
    if (alreadyInTeam.length > 0) {
      const names = alreadyInTeam.map(f => f.name).join(', ');
      return NextResponse.json({ 
        error: `Some freelancers are already in the team: ${names}` 
      }, { status: 400 });
    }

    // 7. Create invitations
    const invitations = freelancers.map(freelancer => ({
      teamId: new ObjectId(teamId),
      teamName: team.name,
      freelancerId: freelancer._id!,
      freelancerName: freelancer.name,
      invitedBy: new ObjectId(currentUserId),
      invitedByName: session.user?.name || "Team Lead",
      message: message || `You've been invited to join "${team.name}"`,
      status: 'pending', // pending, accepted, rejected, expired
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date()
    }));

    // 8. Save invitations to database
    await db.collection("team_invitations").insertMany(invitations);

    // 9. Send notifications to freelancers
    const notifications = freelancers.map(freelancer => ({
      userId: freelancer._id!,
      type: "team_invitation",
      title: "Team Invitation",
      message: `You've been invited to join "${team.name}"`,
      data: {
        teamId: teamId,
        teamName: team.name,
        invitedBy: currentUserId,
        invitedByName: session.user?.name,
        message: message,
        invitationId: invitations.find(i => i.freelancerId.toString() === freelancer._id?.toString())?._id
      },
      read: false,
      createdAt: new Date()
    }));

    await db.collection("notifications").insertMany(notifications);

    // 10. Return success
    return NextResponse.json({
      success: true,
      message: `Invitations sent to ${freelancers.length} freelancer(s)`,
      invitations: invitations.map(inv => ({
        freelancerId: inv.freelancerId.toString(),
        freelancerName: inv.freelancerName,
        status: inv.status,
        expiresAt: inv.expiresAt
      })),
      team: {
        id: teamId,
        name: team.name,
        currentMembers: team.members.length,
        availableSpots: availableSpots - freelancers.length
      }
    });

  } catch (error) {
    console.error("Error sending invitations:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to view pending invitations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id;
    const db = await getDatabase();

    // Get invitations for current user
    const invitations = await db.collection("team_invitations")
      .find({ 
        freelancerId: new ObjectId(currentUserId),
        status: 'pending',
        expiresAt: { $gt: new Date() }
      })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      invitations: invitations.map(inv => ({
        id: inv._id?.toString(),
        teamId: inv.teamId.toString(),
        teamName: inv.teamName,
        invitedBy: inv.invitedByName,
        message: inv.message,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt
      }))
    });

  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
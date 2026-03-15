import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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
      status: 'pending'
    });

    if (!invitation) {
      return NextResponse.json({ 
        error: "Invitation not found or already processed" 
      }, { status: 404 });
    }

    // 3. Update invitation status
    await db.collection("team_invitations").updateOne(
      { _id: invitationId },
      { 
        $set: { 
          status: 'rejected',
          updatedAt: new Date()
        }
      }
    );

    // 4. Create notification for team lead
    await db.collection("notifications").insertOne({
      userId: invitation.invitedBy,
      type: "team_invitation_rejected",
      title: "Invitation Declined",
      message: `${invitation.freelancerName} has declined your invitation to join "${invitation.teamName}"`,
      data: {
        teamId: invitation.teamId.toString(),
        teamName: invitation.teamName,
        freelancerId: invitation.freelancerId.toString(),
        freelancerName: invitation.freelancerName
      },
      read: false,
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: "Invitation declined successfully"
    });

  } catch (error) {
    console.error("Error rejecting invitation:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
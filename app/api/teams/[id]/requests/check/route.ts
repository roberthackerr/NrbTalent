import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({
        success: true,
        hasPendingRequest: false,
        hasApprovedRequest: false,
        isMember: false,
        isAuthenticated: false
      });
    }

    const currentUserId = (session.user as any).id;
    const db = await getDatabase();
    const teamId = new ObjectId(id);

    // Check for pending request
    const pendingRequest = await db.collection("team_join_requests").findOne({
      teamId: teamId,
      userId: new ObjectId(currentUserId),
      status: 'pending'
    });

    // Check for APPROVED request (not yet joined)
    const approvedRequest = await db.collection("team_join_requests").findOne({
      teamId: teamId,
      userId: new ObjectId(currentUserId),
      status: 'accepted'
    });

    // Check if already a member
    const team = await db.collection("teams").findOne({ _id: teamId });
    const isMember = team?.members?.some((m: any) => 
      m.userId?.toString() === currentUserId
    ) || false;

    return NextResponse.json({
      success: true,
      hasPendingRequest: !!pendingRequest,
      hasApprovedRequest: !!approvedRequest && !isMember,
      isMember: isMember,
      requestStatus: pendingRequest ? 'pending' : approvedRequest ? 'accepted' : 'none',
      requestDetails: pendingRequest || approvedRequest ? {
        id: (pendingRequest?._id || approvedRequest?._id).toString(),
        status: pendingRequest ? 'pending' : 'accepted',
        createdAt: pendingRequest?.createdAt || approvedRequest?.createdAt,
        approvedAt: approvedRequest?.acceptedAt,
        message: pendingRequest?.message || approvedRequest?.message
      } : null,
      canJoin: !!approvedRequest && !isMember,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error checking join request status:", error);
    return NextResponse.json({
      success: false,
      hasPendingRequest: false,
      hasApprovedRequest: false,
      canJoin: false,
      error: "Failed to check request status"
    }, { status: 500 });
  }
}
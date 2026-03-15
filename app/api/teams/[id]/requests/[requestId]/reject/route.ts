// app/api/teams/[id]/requests/[requestId]/reject/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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
    const team = await db.collection("teams").findOne({ 
      _id: teamId,
      "members.userId": new ObjectId(currentUserId),
      "members.isLead": true
    });

    if (!team) {
      return NextResponse.json({ 
        error: "Only team leads can reject join requests" 
      }, { status: 403 });
    }

    // 3. Get request data for rejection reason
    const requestData = await request.json();
    const { reason } = requestData;

    // 4. Update join request status
    const result = await db.collection("team_join_requests").updateOne(
      {
        _id: joinRequestId,
        teamId: teamId,
        status: 'pending'
      },
      { 
        $set: { 
          status: 'rejected',
          rejectedAt: new Date(),
          rejectedReason: reason || 'Not specified',
          processedBy: new ObjectId(currentUserId),
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        error: "Join request not found or already processed" 
      }, { status: 404 });
    }

    // 5. Get request details for notification
    const joinRequest = await db.collection("team_join_requests").findOne({
      _id: joinRequestId
    });

    if (joinRequest) {
      // Create notification for the requester
      await db.collection("notifications").insertOne({
        userId: joinRequest.userId,
        type: "team_join_request_rejected",
        title: "Request Not Accepted",
        message: `Your request to join "${team.name}" was not accepted${reason ? `: ${reason}` : ''}`,
        data: {
          teamId: teamId.toString(),
          teamName: team.name,
          rejectedBy: currentUserId,
          rejectedByName: session.user?.name || 'Team Lead',
          reason: reason
        },
        read: false,
        createdAt: new Date()
      });
    }

    return NextResponse.json({
      success: true,
      message: "Join request rejected successfully"
    });

  } catch (error) {
    console.error("Error rejecting join request:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
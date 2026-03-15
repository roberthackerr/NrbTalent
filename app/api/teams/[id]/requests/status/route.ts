// app/api/teams/[id]/requests/status/route.ts
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
    
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ 
        success: true, 
        data: { 
          isPending: false,
          reason: "Not authenticated"
        } 
      });
    }

    const currentUserId = (session.user as any).id;
    const db = await getDatabase();
    const teamId = new ObjectId(id);

    // 2. Check for pending request
    const pendingRequest = await db.collection("team_join_requests").findOne({
      teamId: teamId,
      userId: new ObjectId(currentUserId),
      status: 'pending'
    });

    // 3. Check if already a member
    const team = await db.collection("teams").findOne({ _id: teamId });
    const isMember = team?.members?.some((m: any) => 
      m.userId?.toString() === currentUserId
    ) || false;

    return NextResponse.json({
      success: true,
      data: {
        isPending: !!pendingRequest,
        isMember: isMember,
        requestId: pendingRequest?._id?.toString(),
        requestStatus: pendingRequest?.status,
        message: pendingRequest?.message,
        createdAt: pendingRequest?.createdAt
      }
    });

  } catch (error) {
    console.error("Error checking request status:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        data: { isPending: false, isMember: false }
      }, 
      { status: 500 }
    );
  }
}
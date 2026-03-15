import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ count: 0 });
    }

    const currentUserId = (session.user as any).id;
    const db = await getDatabase();

    const count = await db.collection("team_invitations").countDocuments({
      freelancerId: new ObjectId(currentUserId),
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    return NextResponse.json({
      success: true,
      count
    });

  } catch (error) {
    console.error("Error counting invitations:", error);
    return NextResponse.json({ success: false, count: 0 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { Team } from "@/lib/models/team";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id;
    const db = await getDatabase();

    // Get all invitations for current user
    const invitations = await db.collection("team_invitations")
      .aggregate([
        {
          $match: {
            freelancerId: new ObjectId(currentUserId),
            expiresAt: { $gt: new Date() }
          }
        },
        {
          $lookup: {
            from: "teams",
            localField: "teamId",
            foreignField: "_id",
            as: "teamDetails"
          }
        },
        {
          $unwind: {
            path: "$teamDetails",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "invitedBy",
            foreignField: "_id",
            as: "inviterDetails"
          }
        },
        {
          $unwind: {
            path: "$inviterDetails",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $project: {
            _id: 1,
            teamId: 1,
            teamName: 1,
            invitedBy: 1,
            invitedByName: { $ifNull: ["$inviterDetails.name", "$invitedByName"] },
            message: 1,
            status: 1,
            expiresAt: 1,
            createdAt: 1,
            teamAvatar: "$teamDetails.avatar",
            teamDescription: "$teamDetails.description",
            teamDetails: {
              memberCount: { $size: "$teamDetails.members" },
              completedProjects: "$teamDetails.completedProjects",
              rating: "$teamDetails.rating",
              skills: "$teamDetails.skills"
            }
          }
        }
      ])
      .toArray();

    // Also check for expired invitations and update their status
    const expiredInvitations = invitations.filter(inv => 
      new Date(inv.expiresAt) < new Date() && inv.status === 'pending'
    );

    if (expiredInvitations.length > 0) {
      await db.collection("team_invitations").updateMany(
        {
          _id: { $in: expiredInvitations.map(inv => new ObjectId(inv._id)) },
          status: 'pending'
        },
        {
          $set: { status: 'expired', updatedAt: new Date() }
        }
      );
    }

    // Refresh data after updating expired invitations
    const updatedInvitations = invitations.map(inv => {
      if (new Date(inv.expiresAt) < new Date() && inv.status === 'pending') {
        return { ...inv, status: 'expired' };
      }
      return inv;
    });

    return NextResponse.json({
      success: true,
      invitations: updatedInvitations.map(inv => ({
        id: inv._id.toString(),
        teamId: inv.teamId.toString(),
        teamName: inv.teamName,
        teamAvatar: inv.teamAvatar,
        teamDescription: inv.teamDescription,
        invitedBy: inv.invitedBy.toString(),
        invitedByName: inv.invitedByName,
        message: inv.message,
        status: inv.status,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
        teamDetails: inv.teamDetails
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
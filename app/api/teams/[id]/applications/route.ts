// app/api/teams/[id]/applications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { TeamApplication } from "@/lib/models/team-application";
import type { Team } from "@/lib/models/team";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params;
    
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id;
    const db = await getDatabase();

    // 2. Verify team membership (user must be team member)
    const team = await db.collection<Team>("teams").findOne({
      _id: new ObjectId(teamId),
      "members.userId": new ObjectId(currentUserId)
    });

    if (!team) {
      return NextResponse.json({ 
        error: "Team not found or you're not a member" 
      }, { status: 403 });
    }

    // 3. Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    // 4. Build query
    const query: any = { teamId: new ObjectId(teamId) };
    if (status && status !== 'all') {
      query.status = status;
    }

    // 5. Get applications
    const [applications, total] = await Promise.all([
      db.collection<TeamApplication>("team_applications")
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection<TeamApplication>("team_applications").countDocuments(query)
    ]);

    // 6. Get project details for each application
    const projectIds = applications.map(app => app.projectId);
    const projects = await db.collection("projects")
      .find({ _id: { $in: projectIds } })
      .project({ title: 1, budget: 1, category: 1, status: 1 })
      .toArray();

    // 7. Format response
    const formattedApplications = applications.map(app => {
      const project = projects.find(p => p._id.toString() === app.projectId.toString());
      
      return {
        id: app._id?.toString(),
        projectId: app.projectId.toString(),
        projectTitle: project?.title || "Unknown Project",
        projectBudget: project?.budget,
        projectCategory: project?.category,
        projectStatus: project?.status,
        
        // Application details
        coverLetter: app.coverLetter?.substring(0, 200) + (app.coverLetter?.length > 200 ? '...' : ''),
        proposedBudget: app.proposedBudget,
        estimatedTimeline: app.estimatedTimeline,
        status: app.status,
        
        // Metadata
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        
        // Client interaction
        clientViewed: app.clientViewed
      };
    });

    return NextResponse.json({
      success: true,
      team: {
        id: team._id?.toString(),
        name: team.name,
        memberCount: team.members.length
      },
      applications: formattedApplications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      statistics: {
        totalApplications: total,
        pending: await db.collection<TeamApplication>("team_applications")
          .countDocuments({ teamId: new ObjectId(teamId), status: 'pending' }),
        accepted: await db.collection<TeamApplication>("team_applications")
          .countDocuments({ teamId: new ObjectId(teamId), status: 'accepted' }),
        successRate: total > 0 
          ? (await db.collection<TeamApplication>("team_applications")
              .countDocuments({ teamId: new ObjectId(teamId), status: 'accepted' })) / total * 100 
          : 0
      }
    });

  } catch (error) {
    console.error("Error fetching team applications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
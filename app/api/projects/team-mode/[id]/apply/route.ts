// app/api/projects/team-mode/[id]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { TeamApplication } from "@/lib/models/team-application";
import type { Team } from "@/lib/models/team";
import type { Project } from "@/lib/models/project";
import type { User } from "@/lib/models/user";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id;
    const db = await getDatabase();
    const data = await request.json();

    // 2. Validate project
    const project = await db.collection<Project>("projects").findOne({
      _id: new ObjectId(projectId),
      "teamMode.enabled": true,
      status: "open"
    });

    if (!project) {
      return NextResponse.json({ 
        error: "Project not found or not accepting team applications" 
      }, { status: 404 });
    }

    // 3. Validate team and check if user is team lead
    const { teamId, coverLetter, proposedBudget, estimatedTimeline } = data;
    
    if (!teamId || !coverLetter || !proposedBudget || !estimatedTimeline) {
      return NextResponse.json({ 
        error: "Missing required fields: teamId, coverLetter, proposedBudget, estimatedTimeline" 
      }, { status: 400 });
    }

    const team = await db.collection<Team>("teams").findOne({
      _id: new ObjectId(teamId),
      "members.userId": new ObjectId(currentUserId),
      "members.isLead": true
    });

    if (!team) {
      return NextResponse.json({ 
        error: "Team not found or you're not the team lead" 
      }, { status: 403 });
    }

    // 4. Check if team has already applied
    const existingApplication = await db.collection<TeamApplication>("team_applications").findOne({
      projectId: new ObjectId(projectId),
      teamId: new ObjectId(teamId),
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingApplication) {
      return NextResponse.json({ 
        error: "Your team has already applied to this project" 
      }, { status: 400 });
    }

    // 5. Get team members details
    const memberIds = team.members.map(m => m.userId);
    const members = await db.collection<User>("users")
      .find({ _id: { $in: memberIds } })
      .project({ name: 1, skills: 1 })
      .toArray();

    // 6. Create application
    const applicationData: Omit<TeamApplication, "_id"> = {
      projectId: new ObjectId(projectId),
      teamId: new ObjectId(teamId),
      teamName: team.name,
      clientId: new ObjectId(project.clientId),
      
      // Proposal
      coverLetter: coverLetter.trim(),
      proposedBudget: Number(proposedBudget),
      estimatedTimeline: estimatedTimeline.trim(),
      
      // Team members
      teamMembers: team.members.map(member => {
        const user = members.find(u => u._id?.toString() === member.userId.toString());
        return {
          userId: member.userId,
          name: user?.name || "Team Member",
          role: member.role,
          skills: member.skills?.map(s => s.name) || []
        };
      }),
      
      // Status
      status: 'pending',
      clientViewed: false,
      
      // Metadata
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 7. Save application
    const result = await db.collection<TeamApplication>("team_applications").insertOne(applicationData);
    const applicationId = result.insertedId;

    // 8. Update project with application reference
    await db.collection<Project>("projects").updateOne(
      { _id: new ObjectId(projectId) },
      { 
        $addToSet: { 
          "teamMode.teamApplications": {
            teamId: new ObjectId(teamId),
            appliedAt: new Date(),
            status: 'pending',
            applicationId: applicationId
          }
        }
      }
    );

    // 9. Create notification for client
    await db.collection("notifications").insertOne({
      userId: new ObjectId(project.clientId),
      type: "team_application",
      title: "New Team Application",
      message: `Team "${team.name}" has applied to your project "${project.title}"`,
      data: {
        projectId: projectId,
        projectTitle: project.title,
        teamId: teamId,
        teamName: team.name,
        applicationId: applicationId.toString(),
        proposedBudget: proposedBudget
      },
      read: false,
      createdAt: new Date()
    });

    // 10. Return success
    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
      application: {
        id: applicationId.toString(),
        teamName: team.name,
        proposedBudget: proposedBudget,
        estimatedTimeline: estimatedTimeline,
        status: 'pending'
      },
      nextSteps: "The client will review your application and respond soon."
    });

  } catch (error) {
    console.error("Error submitting team application:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
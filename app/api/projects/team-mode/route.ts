// app/api/projects/team-mode/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { Project } from "@/lib/models/project";
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

    // 2. Validate client role
    const client = await db.collection<User>("users").findOne({
      _id: new ObjectId(currentUserId),
      role: 'client'
    });

    if (!client) {
      return NextResponse.json({ error: "Only clients can post projects" }, { status: 403 });
    }

    // 3. Validate required fields
    const { 
      title, 
      description, 
      requiredRoles,
      budget,
      timeline 
    } = data;

    if (!title || !description || !requiredRoles || !budget || !timeline) {
      return NextResponse.json({ 
        error: "Title, description, required roles, budget, and timeline are required" 
      }, { status: 400 });
    }

    if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) {
      return NextResponse.json({ 
        error: "At least one required role is needed" 
      }, { status: 400 });
    }

    // 4. Create team-mode project
    const projectData: Omit<Project, "_id"> = {
      clientId: new ObjectId(currentUserId),
      title: title.trim(),
      description: description.trim(),
      category: data.category || "Team Project",
      subcategory: data.subcategory,
      
      // Team mode specific fields
      teamMode: {
        enabled: true,
        requiredRoles: requiredRoles.map((role: any) => ({
          role: role.role || "team member",
          level: role.level || "intermediate",
          description: role.description || "",
          minExperience: role.minExperience || 1
        })),
        preferredTeamSize: data.preferredTeamSize || requiredRoles.length,
        maxTeamSize: data.maxTeamSize || requiredRoles.length + 2
      },
      
      // Budget for team (total project budget)
      budget: {
        min: budget.min || budget.total || 1000,
        max: budget.max || budget.total || 5000,
        type: "fixed", // Team projects are usually fixed price
        currency: budget.currency || "USD"
      },
      
      skills: data.skills || requiredRoles.map((r: any) => r.role).filter(Boolean),
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      
      // Project metadata
      status: "open",
      visibility: data.visibility || "public",
      applications: [],
      tags: data.tags || ["team-project", "collaboration"],
      attachments: data.attachments || [],
      
      // Milestones for team projects
      milestones: data.milestones || [
        {
          title: "Kickoff & Planning",
          amount: budget.total ? budget.total * 0.2 : 1000,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
          status: "pending"
        },
        {
          title: "Mid-project Review",
          amount: budget.total ? budget.total * 0.3 : 1500,
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks
          status: "pending"
        },
        {
          title: "Final Delivery",
          amount: budget.total ? budget.total * 0.5 : 2500,
          dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 5 weeks
          status: "pending"
        }
      ],
      
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 5. Save project to database
    const result = await db.collection<Project>("projects").insertOne(projectData);
    const projectId = result.insertedId;

    // 6. Find matching teams (optional - can be async)
    const matchingTeams = await findMatchingTeams(projectData, db);
    
    // 7. Notify relevant teams (async - don't block response)
    if (matchingTeams.length > 0) {
      notifyTeamsAboutProject(matchingTeams, projectData, projectId, db).catch(console.error);
    }

    // 8. Return success with project and matched teams
    return NextResponse.json({
      success: true,
      message: "Team project posted successfully",
      project: {
        id: projectId.toString(),
        title: projectData.title,
        description: projectData.description,
        budget: projectData.budget,
        timeline: timeline,
        requiredRoles: projectData.teamMode.requiredRoles,
        skills: projectData.skills,
        deadline: projectData.deadline,
        status: projectData.status
      },
      matching: {
        totalTeamsFound: matchingTeams.length,
        topMatches: matchingTeams.slice(0, 5).map(team => ({
          teamId: team._id?.toString(),
          teamName: team.name,
          matchScore: calculateTeamMatchScore(team, projectData),
          memberCount: team.members.length,
          skills: team.skills?.slice(0, 3).map(s => s.name) || []
        })),
        nextStep: "Teams will be notified and can apply"
      }
    });

  } catch (error) {
    console.error("Error posting team project:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Helper function to find matching teams
async function findMatchingTeams(project: any, db: any): Promise<Team[]> {
  try {
    const requiredSkills = project.skills || [];
    const requiredRoles = project.teamMode?.requiredRoles || [];
    
    // Build query based on project requirements
    const query: any = {
      isActive: true,
      availability: { $in: ['available', 'busy'] }
    };

    // Filter by skills if specified
    if (requiredSkills.length > 0) {
      query['skills.name'] = { $in: requiredSkills.map((s: string) => new RegExp(s, 'i')) };
    }

    // Filter by team size
    const preferredSize = project.teamMode?.preferredTeamSize || requiredRoles.length;
    query['members'] = { 
      $gte: Math.max(1, preferredSize - 2),
      $lte: project.teamMode?.maxTeamSize || preferredSize + 2
    };

    // Find matching teams
    const teams = await db.collection<Team>("teams")
      .find(query)
      .limit(20) // Limit initial search
      .toArray();

    // Calculate match scores and sort
    const teamsWithScores = teams.map(team => ({
      team,
      score: calculateTeamMatchScore(team, project)
    }));

    // Return top matches (score > 50)
    return teamsWithScores
      .filter(item => item.score >= 50)
      .sort((a, b) => b.score - a.score)
      .map(item => item.team);

  } catch (error) {
    console.error("Error finding matching teams:", error);
    return [];
  }
}

// Calculate how well a team matches the project
function calculateTeamMatchScore(team: Team, project: any): number {
  let score = 50; // Base score

  // 1. Skill match (40% weight)
  const projectSkills = project.skills || [];
  const teamSkills = team.skills?.map(s => s.name) || [];
  
  const skillMatch = projectSkills.length > 0
    ? (projectSkills.filter(ps => 
        teamSkills.some(ts => ts.toLowerCase().includes(ps.toLowerCase()) || 
                             ps.toLowerCase().includes(ts.toLowerCase()))
      ).length / projectSkills.length) * 100
    : 100;

  score += skillMatch * 0.4;

  // 2. Team size match (20% weight)
  const preferredSize = project.teamMode?.preferredTeamSize || 3;
  const sizeDiff = Math.abs(team.members.length - preferredSize);
  const sizeMatch = Math.max(0, 100 - (sizeDiff * 20)); // -20% per member difference
  score += sizeMatch * 0.2;

  // 3. Budget compatibility (20% weight)
  const teamRate = team.hourlyRate || 50;
  const projectBudget = project.budget?.max || project.budget?.total || 5000;
  const estimatedHours = project.timeline * 20; // Approx 20 days per month
  const estimatedCost = teamRate * estimatedHours * team.members.length;
  
  const budgetMatch = estimatedCost <= projectBudget 
    ? 100 
    : Math.max(0, 100 - ((estimatedCost - projectBudget) / projectBudget * 100));
  score += budgetMatch * 0.2;

  // 4. Experience bonus (10% weight)
  const teamExperience = team.completedProjects || 0;
  const experienceBonus = Math.min(teamExperience * 2, 100); // 2% per completed project
  score += experienceBonus * 0.1;

  // 5. Availability penalty (-10% if busy)
  if (team.availability === 'busy') {
    score -= 10;
  }

  return Math.min(Math.max(score, 0), 100);
}

// Async function to notify teams
async function notifyTeamsAboutProject(teams: Team[], project: any, projectId: ObjectId, db: any) {
  try {
    const notifications = [];
    
    for (const team of teams) {
      // Get team lead
      const teamLead = team.members.find(m => m.isLead);
      if (!teamLead) continue;

      // Create notification for team lead
      notifications.push({
        userId: teamLead.userId,
        type: "team_project_match",
        title: "New Project Match",
        message: `Your team "${team.name}" matches a new project: "${project.title}"`,
        data: {
          projectId: projectId.toString(),
          projectTitle: project.title,
          teamId: team._id?.toString(),
          teamName: team.name,
          matchScore: calculateTeamMatchScore(team, project),
          budget: project.budget,
          deadline: project.deadline
        },
        read: false,
        createdAt: new Date()
      });

      // Also create a team notification
      await db.collection("team_notifications").insertOne({
        teamId: team._id,
        type: "project_opportunity",
        title: "Project Opportunity",
        message: `New project matching your team's skills: "${project.title}"`,
        data: {
          projectId: projectId.toString(),
          projectTitle: project.title,
          requiredRoles: project.teamMode?.requiredRoles,
          budget: project.budget
        },
        createdAt: new Date()
      });
    }

    // Batch insert notifications
    if (notifications.length > 0) {
      await db.collection("notifications").insertMany(notifications);
    }

  } catch (error) {
    console.error("Error notifying teams:", error);
  }
}

// Optional: GET endpoint to browse team projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const minBudget = searchParams.get('minBudget');
    const maxBudget = searchParams.get('maxBudget');
    const skills = searchParams.get('skills')?.split(',').filter(Boolean) || [];

    const db = await getDatabase();
    const skip = (page - 1) * limit;

    // Build query for team projects
    const query: any = {
      status: "open",
      "teamMode.enabled": true
    };

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    if (minBudget || maxBudget) {
      query['budget.max'] = {};
      if (minBudget) query['budget.max'].$gte = parseInt(minBudget);
      if (maxBudget) query['budget.max'].$lte = parseInt(maxBudget);
    }

    if (skills.length > 0) {
      query.skills = { $in: skills.map(s => new RegExp(s, 'i')) };
    }

    const [projects, total] = await Promise.all([
      db.collection<Project>("projects")
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection<Project>("projects").countDocuments(query)
    ]);

    // Format response
    const formattedProjects = projects.map(project => ({
      id: project._id?.toString(),
      title: project.title,
      description: project.description?.substring(0, 200) + '...',
      category: project.category,
      budget: project.budget,
      skills: project.skills,
      deadline: project.deadline,
      requiredRoles: project.teamMode?.requiredRoles || [],
      teamSize: project.teamMode?.preferredTeamSize,
      createdAt: project.createdAt,
      client: {
        // In real app, you'd fetch client details
        hasVerifiedBadge: true
      }
    }));

    return NextResponse.json({
      success: true,
      projects: formattedProjects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching team projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
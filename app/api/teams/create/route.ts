import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { z } from "zod";
import type { Team, TeamMember, TeamMemberSkill } from "@/lib/models/team";
import type { User } from "@/lib/models/user";

// Validation schema
const CreateTeamSchema = z.object({
  name: z.string()
    .min(3, "Team name must be at least 3 characters")
    .max(50, "Team name must be less than 50 characters")
    .regex(/^[a-zA-Z0-9\s\-&]+$/, "Team name can only contain letters, numbers, spaces, hyphens, and ampersands"),
  tagline: z.string()
    .min(10, "Tagline must be at least 10 characters")
    .max(100, "Tagline must be less than 100 characters"),
  description: z.string()
    .min(50, "Description must be at least 50 characters")
    .max(500, "Description must be less than 500 characters"),
  maxMembers: z.number()
    .min(2, "Team must have at least 2 members")
    .max(20, "Team cannot exceed 20 members")
    .default(5),
  teamType: z.enum(['agency', 'startup', 'freelance', 'specialized', 'hybrid']),
  visibility: z.enum(['public', 'private', 'unlisted']).default('public'),
  requireApproval: z.boolean().default(true),
  hourlyRate: z.number().min(0).max(1000).optional(),
  currency: z.string().length(3).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to create a team." },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const db = await getDatabase();

    // 2. Check if user can create more teams
    const userTeams = await db.collection("teams").countDocuments({
      "members.userId": new ObjectId(userId),
      "members.isLead": true
    });

    const maxTeamsPerUser = 3; // Configurable limit
    if (userTeams >= maxTeamsPerUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: `You can only create up to ${maxTeamsPerUser} teams. Consider joining existing teams instead.` 
        },
        { status: 403 }
      );
    }

    // 3. Validate request data
    const rawData = await request.json();
    const validationResult = CreateTeamSchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Validation failed",
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 4. Check for duplicate team name
    const existingTeam = await db.collection<Team>("teams").findOne({
      name: { $regex: new RegExp(`^${data.name}$`, 'i') },
    });

    if (existingTeam) {
      return NextResponse.json(
        { 
          success: false, 
          error: "A team with this name already exists. Please choose a different name." 
        },
        { status: 409 }
      );
    }

    // 5. Get current user with skills
    const currentUser = await db.collection<User>("users").findOne({
      _id: new ObjectId(userId),
      role: "freelance"
    });

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Freelancer profile not found. Complete your profile first." },
        { status: 404 }
      );
    }

    // 6. Convert user skills to team member skills
    const userSkills: TeamMemberSkill[] = (currentUser.skills || []).map((skill: any) => ({
      name: skill.name || "",
      category: skill.category || "Other",
      level: skill.level || "beginner",
      yearsOfExperience: skill.yearsOfExperience || 0,
      featured: skill.featured || false,
      verified: skill.verified || false
    }));

    // 7. Create team member (creator)
    const creatorMember: TeamMember = {
      userId: new ObjectId(userId),
      role: "lead",
      joinDate: new Date(),
      isLead: true,
      isActive: true,
      skills: userSkills,
      permissions: ['admin', 'invite', 'manage_projects', 'manage_finances']
    };

    // 8. Generate unique join code
    const joinCode = generateJoinCode();

    // 9. Create team document
    const teamData: Omit<Team, "_id"> = {
      name: data.name.trim(),
      tagline: data.tagline.trim(),
      description: data.description.trim(),
      members: [creatorMember],
      maxMembers: data.maxMembers,
      skills: calculateCombinedSkills([creatorMember]),
      completedProjects: 0,
      totalEarnings: 0,
      availability: "available",
      visibility: data.visibility,
      requireApproval: data.requireApproval,
      joinCode: joinCode,
      settings: {
        allowPublicJoin: data.visibility === 'public',
        autoAcceptRequests: !data.requireApproval,
        showInRecommendations: true,
        allowProjectBidding: true,
        paymentTerms: data.hourlyRate ? {
          hourlyRate: data.hourlyRate,
          currency: data.currency || 'USD',
          minProjectBudget: 100
        } : undefined
      },
      stats: {
        responseTime: 24, // hours
        completionRate: 0,
        clientSatisfaction: 0,
        activeProjects: 0
      },
      metadata: {
        teamType: data.teamType,
        industries: currentUser.industries || [],
        tools: currentUser.tools || []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 10. Save to database (with transaction for data consistency)
    const result = await db.collection<Team>("teams").insertOne(teamData);

    // 11. Update user profile
    await db.collection<User>("users").updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          updatedAt: new Date(),
          "profile.hasCreatedTeam": true
        },
        $addToSet: {
          teams: result.insertedId
        },
        $inc: {
          "stats.teamsCreated": 1
        }
      }
    );

    // 12. Create activity log
    await db.collection("activities").insertOne({
      type: "team_created",
      teamId: result.insertedId,
      userId: new ObjectId(userId),
      data: {
        teamName: teamData.name,
        teamType: teamData.metadata.teamType
      },
      createdAt: new Date()
    });

    // 13. Return success with all necessary data
    return NextResponse.json({
      success: true,
      message: "Team created successfully!",
      team: {
        id: result.insertedId,
        name: teamData.name,
        tagline: teamData.tagline,
        memberCount: 1,
        maxMembers: teamData.maxMembers,
        joinCode: joinCode,
        joinLink: `/teams/join/${joinCode}`,
        settingsLink: `/teams/${result.insertedId}/settings`,
        skills: teamData.skills.map(s => ({ name: s.name, category: s.category })),
        createdAt: teamData.createdAt
      },
      nextSteps: [
        "Invite team members using the join link",
        "Set up your team's payment preferences",
        "Complete your team profile to appear in search results",
        "Start bidding on team projects"
      ]
    });

  } catch (error) {
    console.error("Error creating team:", error);
    
    // Log error for monitoring
    await logError(error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create team",
        message: error instanceof Error ? error.message : "Internal server error"
      },
      { status: 500 }
    );
  }
}

// Helper function to generate unique join code
function generateJoinCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// Helper function to combine skills from all members
function calculateCombinedSkills(members: TeamMember[]): Team['skills'] {
  const skillMap = new Map<string, {
    name: string;
    category: string;
    levels: string[];
    totalYears: number;
    memberCount: number;
    isFeatured: boolean;
  }>();

  members.forEach(member => {
    member.skills.forEach(skill => {
      if (!skill.name) return;

      const key = `${skill.name.toLowerCase()}-${skill.category.toLowerCase()}`;
      
      if (!skillMap.has(key)) {
        skillMap.set(key, {
          name: skill.name,
          category: skill.category,
          levels: [],
          totalYears: 0,
          memberCount: 0,
          isFeatured: skill.featured || false
        });
      }

      const existing = skillMap.get(key)!;
      existing.levels.push(skill.level);
      existing.totalYears += skill.yearsOfExperience || 0;
      existing.memberCount++;
      existing.isFeatured = existing.isFeatured || skill.featured;
    });
  });

  return Array.from(skillMap.values()).map(skill => ({
    ...skill,
    averageLevel: calculateAverageLevel(skill.levels),
    averageExperience: skill.totalYears / skill.memberCount
  }));
}

function calculateAverageLevel(levels: string[]): string {
  const levelWeights = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
    expert: 4
  };
  
  const avg = levels.reduce((sum, level) => sum + (levelWeights[level as keyof typeof levelWeights] || 1), 0) / levels.length;
  
  if (avg >= 3.5) return 'expert';
  if (avg >= 2.5) return 'advanced';
  if (avg >= 1.5) return 'intermediate';
  return 'beginner';
}

async function logError(error: any) {
  // Implement your error logging service here
  console.error('Team Creation Error:', error);
}
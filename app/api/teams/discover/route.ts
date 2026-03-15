// app/api/teams/discover/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { Team } from "@/lib/models/team";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Teams discover API called');
    
    // 1. Optional authentication
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user ? (session.user as any).id : null;

    // 2. Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const db = await getDatabase();
    const skip = (page - 1) * limit;

    // 3. Build query filter - FIXED: Handle missing fields
    const query: any = {};
    
    // Only filter by isActive if it exists AND is false
    // If field doesn't exist, assume team is active
    query.$or = [
      { isActive: { $ne: false } }, // Not explicitly false
      { isActive: { $exists: false } } // Or doesn't exist
    ];
    
    // Search by team name or tagline
    if (search) {
      query.$and = [
        query.$and || {},
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { tagline: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    console.log('🔍 Query filter:', JSON.stringify(query, null, 2));

    // 4. Execute query
    const [teams, total] = await Promise.all([
      db.collection<Team>("teams")
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection<Team>("teams").countDocuments(query)
    ]);

    console.log(`✅ Found ${teams.length} teams after query`);

    // 5. Format teams for response
    const formattedTeams = teams.map(team => ({
      id: team._id?.toString(),
      name: team.name || 'Unnamed Team',
      tagline: team.tagline || '',
      description: team.description?.substring(0, 150) + (team.description && team.description.length > 150 ? '...' : ''),
      
      // Team stats
      memberCount: team.members?.length || 0,
      maxMembers: team.maxMembers || 5,
      completedProjects: team.completedProjects || 0,
      rating: team.rating || null,
      totalEarnings: team.totalEarnings || 0,
      availability: team.availability || 'available',
      
      // Skills - match frontend interface
      skills: (team.skills || []).slice(0, 5).map(skill => ({
        name: skill.name || '',
        category: skill.category || 'Other'
      })),
      
      // Members preview
      membersPreview: (team.members || [])
        .slice(0, 3)
        .map(member => ({
          role: member.role || 'member',
          isLead: member.isLead || false
        })),
      
      // Metadata
      createdAt: team.createdAt || new Date(),
      
      // Current user relationship
      currentUser: currentUserId ? {
        isMember: (team.members || []).some(m => 
          m.userId && m.userId.toString() === currentUserId
        ) || false,
        canJoin: team.availability === 'available' && 
                 (team.members?.length || 0) < (team.maxMembers || 5) &&
                 !(team.members || []).some(m => 
                   m.userId && m.userId.toString() === currentUserId
                 )
      } : null
    }));

    console.log(`📦 Formatted ${formattedTeams.length} teams for response`);

    // 6. Return response
    return NextResponse.json({
      success: true,
      teams: formattedTeams,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      statistics: {
        totalTeams: total,
        availableTeams: teams.filter(t => t.availability === 'available').length,
        averageMembers: teams.length > 0 
          ? Math.round(teams.reduce((sum, t) => sum + (t.members?.length || 0), 0) / teams.length * 10) / 10 
          : 0
      },
      debug: {
        queryUsed: query,
        rawTeamsCount: teams.length,
        formattedTeamsCount: formattedTeams.length
      }
    });

  } catch (error) {
    console.error("Error discovering teams:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
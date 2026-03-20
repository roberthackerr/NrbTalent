// app/api/ai/matching/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiMatchingService } from '@/services/aiMatchingService';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { ProjectRequirements } from '@/types/ai-matching';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const testMode = searchParams.get('testMode') === 'true';
    const limit = parseInt(searchParams.get('limit') || '15'); // 🔧 LIMITE AUGMENTÉE

    const db = await getDatabase();

    if (projectId) {
      // Get matches for specific project
      const project = await db.collection('projects').findOne({ 
        _id: new ObjectId(projectId) 
      });

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      // Get available freelancers with their complete profiles
      const freelancers = await db.collection('users')
        .find({ 
          role: 'freelancer',
          isActive: true 
        })
        .limit(testMode ? 20 : 50)
        .toArray();

      console.log(`🔍 Found ${freelancers.length} freelancers for matching`);

      // Prepare project requirements for AI matching service
      const projectRequirements: ProjectRequirements = {
        requiredSkills: project.skills || [],
        preferredSkills: project.preferredSkills || [],
        niceToHave: project.niceToHave || [],
        experienceLevel: determineExperienceLevel(project),
        budgetRange: project.budget || { min: 0, max: 10000 },
        timeline: calculateTimeline(project),
        complexity: project.complexity || 'moderate',
        teamSize: 1
      };

      console.log('🎯 Project requirements:', projectRequirements);

      // Use AI matching service to find best matches
      const matches = await aiMatchingService.findBestMatches(
        projectId,
        projectRequirements,
        freelancers,
        limit
      );

      // Enhance matches with freelancer data
      const enhancedMatches = matches.map(match => ({
        ...match,
        freelancer: freelancers.find(f => f._id.toString() === match.freelancerId)
      }));

      // 🔧 STATISTIQUES AMÉLIORÉES AVEC MATCH GRADE
      const matchDistribution = {
        excellent: matches.filter(m => m.matchGrade === 'excellent').length,
        good: matches.filter(m => m.matchGrade === 'good').length,
        potential: matches.filter(m => m.matchGrade === 'potential').length,
        low: matches.filter(m => m.matchGrade === 'low').length
      };

      return NextResponse.json({
        success: true,
        matches: enhancedMatches,
        project: {
          _id: project._id,
          title: project.title,
          description: project.description,
          skills: project.skills,
          budget: project.budget,
          complexity: project.complexity
        },
        statistics: {
          totalFreelancers: freelancers.length,
          matchedFreelancers: matches.length,
          matchDistribution, // 🔧 NOUVELLE STATISTIQUE
          matchRate: freelancers.length > 0 ? (matches.length / freelancers.length * 100).toFixed(1) : 0,
          averageMatchScore: matches.length > 0 ? 
            matches.reduce((acc, match) => acc + match.matchScore, 0) / matches.length : 0
        },
        matchingEngine: 'ai-enhanced-optimized-v3', // 🔧 VERSION MISE À JOUR
        timestamp: new Date().toISOString()
      });

    } else {
      // Get personalized recommendations for logged-in user
      const user = await db.collection('users').findOne({ 
        _id: new ObjectId(session.user.id) 
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Determine if user is freelancer or client
      if (user.role === 'freelancer') {
        return await getFreelancerRecommendations(user, db, limit);
      } else {
        return await getClientRecommendations(user, db, limit);
      }
    }

  } catch (error) {
    console.error('AI Matching error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// Get recommendations for freelancers
async function getFreelancerRecommendations(freelancer: any, db: any, limit: number) {
  try {
    // Find projects that match freelancer's skills and preferences
    const projects = await db.collection('projects')
      .find({ 
        status: 'open',
        $or: [
          { skills: { $in: freelancer.skills || [] } },
          { category: getFreelancerCategory(freelancer) }
        ]
      })
      .limit(25)
      .toArray();

    console.log(`🎯 Found ${projects.length} potential projects for freelancer`);

    const recommendations = [];

    for (const project of projects) {
      const projectRequirements: ProjectRequirements = {
        requiredSkills: project.skills || [],
        preferredSkills: [],
        niceToHave: [],
        experienceLevel: determineExperienceLevel(project),
        budgetRange: project.budget || { min: 0, max: 10000 },
        timeline: calculateTimeline(project),
        complexity: project.complexity || 'moderate',
        teamSize: 1
      };

      const match = await aiMatchingService.calculateMatch(
        freelancer,
        project._id.toString(),
        projectRequirements
      );

      // 🔧 CRITÈRES MIS À JOUR POUR MATCH GRADE
      if (match.matchGrade === 'excellent' || match.matchGrade === 'good' || 
          (match.matchGrade === 'potential' && match.learningPotential >= 70)) {
        recommendations.push({
          project: {
            _id: project._id,
            title: project.title,
            description: project.description,
            budget: project.budget,
            timeline: project.timeline,
            category: project.category,
            skills: project.skills,
            complexity: project.complexity,
            createdAt: project.createdAt
          },
          match: match,
          matchType: match.matchGrade // 🔧 UTILISATION DIRECTE DU MATCH GRADE
        });
      }
    }

    // Sort by match score
    recommendations.sort((a, b) => b.match.matchScore - a.match.matchScore);

    const topRecommendations = recommendations.slice(0, limit);

    // 🔧 STATISTIQUES AVEC MATCH GRADE
    const gradeDistribution = {
      excellent: recommendations.filter(r => r.match.matchGrade === 'excellent').length,
      good: recommendations.filter(r => r.match.matchGrade === 'good').length,
      potential: recommendations.filter(r => r.match.matchGrade === 'potential').length
    };

    return NextResponse.json({
      success: true,
      recommendations: topRecommendations,
      freelancerProfile: {
        skills: freelancer.skills || [],
        experience: getTotalExperience(freelancer),
        rating: freelancer.rating,
        completedProjects: freelancer.statistics?.completedProjects || 0
      },
      matchInsights: {
        totalProjectsAnalyzed: projects.length,
        matchesFound: recommendations.length,
        gradeDistribution, // 🔧 NOUVELLE STATISTIQUE
        averageMatchScore: recommendations.length > 0 ? 
          recommendations.reduce((acc, rec) => acc + rec.match.matchScore, 0) / recommendations.length : 0,
        skillGaps: analyzeFreelancerSkillGaps(freelancer, recommendations),
        improvementSuggestions: generateFreelancerImprovementSuggestions(freelancer, recommendations)
      },
      matchingEngine: 'ai-freelancer-optimized-v3', // 🔧 VERSION MISE À JOUR
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Freelancer recommendations error:', error);
    throw error;
  }
}

// Get recommendations for clients
async function getClientRecommendations(client: any, db: any, limit: number) {
  try {
    // Get client's previous projects to understand their preferences
    const clientProjects = await db.collection('projects')
      .find({ clientId: new ObjectId(client._id) })
      .limit(10)
      .toArray();

    // Find similar freelancers based on client's project history
    const allFreelancers = await db.collection('users')
      .find({ 
        role: 'freelancer',
        isActive: true 
      })
      .limit(30)
      .toArray();

    const recommendations = [];

    // Create a mock project based on client's preferences
    const mockProject: ProjectRequirements = createMockProjectFromHistory(clientProjects);

    for (const freelancer of allFreelancers) {
      const match = await aiMatchingService.calculateMatch(
        freelancer,
        'client-recommendation',
        mockProject
      );

      // 🔧 CRITÈRES MIS À JOUR
      if (match.matchGrade === 'excellent' || match.matchGrade === 'good') {
        recommendations.push({
          freelancer: {
            _id: freelancer._id,
            name: freelancer.name,
            skills: freelancer.skills,
            rating: freelancer.rating,
            completedProjects: freelancer.statistics?.completedProjects || 0,
            successRate: freelancer.statistics?.successRate || 0,
            currentWorkload: freelancer.currentWorkload || 0 // 🔧 AJOUTÉ POUR LE TRI
          },
          match: match,
          reasoning: generateClientRecommendationReasoning(match, freelancer, clientProjects)
        });
      }
    }

    // 🔧 TRI OPTIMISÉ AVEC MATCH GRADE
    recommendations.sort((a, b) => {
      // Priorité aux excellent matches, puis score
      if (a.match.matchGrade === 'excellent' && b.match.matchGrade !== 'excellent') return -1;
      if (b.match.matchGrade === 'excellent' && a.match.matchGrade !== 'excellent') return 1;
      return b.match.matchScore - a.match.matchScore;
    });

    return NextResponse.json({
      success: true,
      recommendations: recommendations.slice(0, limit),
      clientProfile: {
        previousProjects: clientProjects.length,
        preferredCategories: getClientPreferredCategories(clientProjects),
        averageBudget: getAverageBudget(clientProjects)
      },
      matchingEngine: 'ai-client-optimized-v3', // 🔧 VERSION MISE À JOUR
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Client recommendations error:', error);
    throw error;
  }
}

// Helper functions avec les bons types
function determineExperienceLevel(project: any): 'junior' | 'mid' | 'senior' | 'expert' {
  const budget = project.budget?.max || 0;
  const complexity = project.complexity;

  if (budget > 5000 || complexity === 'very-complex') return 'expert';
  if (budget > 2000 || complexity === 'complex') return 'senior';
  if (budget > 500 || complexity === 'moderate') return 'mid';
  return 'junior';
}

function calculateTimeline(project: any): number {
  if (project.deadline) {
    const now = new Date();
    const deadline = new Date(project.deadline);
    const diffTime = Math.abs(deadline.getTime() - now.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 30;
}

function getFreelancerCategory(freelancer: any): string {
  const skills = freelancer.skills || [];
  
  if (skills.some((skill: string) => 
    ['react', 'javascript', 'node', 'python', 'java'].includes(skill.toLowerCase())
  )) {
    return 'Web Development';
  }
  
  if (skills.some((skill: string) => 
    ['design', 'ui', 'ux', 'figma', 'photoshop'].includes(skill.toLowerCase())
  )) {
    return 'Design';
  }
  
  return 'Other';
}

function getTotalExperience(user: any): number {
  if (!user.experience || user.experience.length === 0) {
    return user.statistics?.completedProjects ? Math.min(user.statistics.completedProjects / 10, 5) : 1;
  }
  
  return user.experience.reduce((total: number, exp: any) => {
    const start = new Date(exp.startDate);
    const end = exp.current ? new Date() : new Date(exp.endDate);
    const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return total + years;
  }, 0);
}

function analyzeFreelancerSkillGaps(freelancer: any, recommendations: any[]) {
  const missingSkills: { [key: string]: number } = {};
  
  recommendations.forEach(rec => {
    rec.match.skillGapAnalysis.missing.forEach((skill: string) => {
      missingSkills[skill] = (missingSkills[skill] || 0) + 1;
    });
  });

  return Object.entries(missingSkills)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([skill, demand]) => ({ 
      skill, 
      demand,
      priority: demand > 3 ? 'high' : demand > 1 ? 'medium' : 'low'
    }));
}

function generateFreelancerImprovementSuggestions(freelancer: any, recommendations: any[]) {
  const suggestions = [];
  const skillGaps = analyzeFreelancerSkillGaps(freelancer, recommendations);
  
  if (skillGaps.length > 0) {
    suggestions.push(`Apprenez ${skillGaps[0].skill} pour augmenter vos chances de 30%`);
  }
  
  const avgScore = recommendations.reduce((acc, rec) => acc + rec.match.matchScore, 0) / recommendations.length;
  if (avgScore < 70) {
    suggestions.push("Améliorez votre profil avec plus de détails sur vos expériences");
  }

  // 🔧 SUGGESTIONS BASÉES SUR LE MATCH GRADE
  const excellentMatches = recommendations.filter(r => r.match.matchGrade === 'excellent').length;
  if (excellentMatches === 0) {
    suggestions.push("Concentrez-vous sur les compétences les plus demandées pour obtenir des matches excellents");
  }
  
  return suggestions;
}

function createMockProjectFromHistory(projects: any[]): ProjectRequirements {
  if (projects.length === 0) {
    return {
      requiredSkills: ['JavaScript', 'React', 'Node.js'],
      preferredSkills: [],
      niceToHave: [],
      experienceLevel: 'mid',
      budgetRange: { min: 1000, max: 5000 },
      timeline: 30,
      complexity: 'moderate',
      teamSize: 1
    };
  }
  
  const allSkills = projects.flatMap((p: any) => p.skills || []);
  const skillFrequency = allSkills.reduce((acc: any, skill: string) => {
    acc[skill] = (acc[skill] || 0) + 1;
    return acc;
  }, {});
  
  const commonSkills = Object.entries(skillFrequency)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 5)
    .map(([skill]) => skill);
  
  return {
    requiredSkills: commonSkills.slice(0, 3),
    preferredSkills: commonSkills.slice(3),
    niceToHave: [],
    experienceLevel: 'mid',
    budgetRange: getAverageBudget(projects),
    timeline: 30,
    complexity: 'moderate',
    teamSize: 1
  };
}

function getClientPreferredCategories(projects: any[]) {
  const categories = projects.reduce((acc: any, project: any) => {
    acc[project.category] = (acc[project.category] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(categories)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 3)
    .map(([category]) => category);
}

function getAverageBudget(projects: any[]): { min: number; max: number } {
  if (projects.length === 0) return { min: 1000, max: 5000 };
  
  const budgets = projects.filter((p: any) => p.budget).map((p: any) => p.budget);
  const avgMin = budgets.reduce((acc: number, b: any) => acc + b.min, 0) / budgets.length;
  const avgMax = budgets.reduce((acc: number, b: any) => acc + b.max, 0) / budgets.length;
  
  return { 
    min: Math.round(avgMin / 100) * 100, 
    max: Math.round(avgMax / 100) * 100 
  };
}

function generateClientRecommendationReasoning(match: any, freelancer: any, clientProjects: any[]) {
  const reasons = [];
  
  if (match.matchGrade === 'excellent') {
    reasons.push('Match exceptionnel avec le projet');
  } else if (match.matchGrade === 'good') {
    reasons.push('Bon alignement avec les besoins');
  }
  
  if (match.skillGapAnalysis.strong.length > 0) {
    reasons.push(`Expert en ${match.skillGapAnalysis.strong.slice(0, 2).join(', ')}`);
  }
  
  if (freelancer.rating >= 4.5) {
    reasons.push(`Excellent historique d'évaluations (${freelancer.rating}/5)`);
  }
  
  if (freelancer.statistics?.successRate >= 90) {
    reasons.push(`Taux de réussite de ${freelancer.statistics.successRate}%`);
  }

  if (freelancer.currentWorkload < 50) {
    reasons.push('Disponibilité immédiate');
  }
  
  return reasons;
}

// Export the helper functions for testing
export const MatchingHelpers = {
  determineExperienceLevel,
  calculateTimeline,
  getFreelancerCategory,
  getTotalExperience,
  analyzeFreelancerSkillGaps,
  generateFreelancerImprovementSuggestions,
  createMockProjectFromHistory,
  getClientPreferredCategories,
  getAverageBudget,
  generateClientRecommendationReasoning
};
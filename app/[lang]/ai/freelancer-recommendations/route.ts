// app/api/ai/freelancer-recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { freelancerMatchingService } from '@/services/freelancerMatchingService';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const freelancerId = searchParams.get('freelancerId') || session.user.id;
    const limit = parseInt(searchParams.get('limit') || '15');
    const testMode = searchParams.get('testMode') === 'true';

    const db = await getDatabase();

    // Récupérer le profil freelancer complet
    const freelancer = await db.collection('users').findOne({ 
      _id: new ObjectId(freelancerId),
      $or: [
        { role: 'freelancer' },
        { role: 'freelance' }
      ]
    });

    if (!freelancer) {
      return NextResponse.json({ error: 'Freelancer not found' }, { status: 404 });
    }

    // Normaliser les compétences (gérer les deux formats)
    const normalizedSkills = normalizeSkills(freelancer.skills);
    
    console.log(`🛠️ Freelancer skills normalized:`, {
      original: freelancer.skills,
      normalized: normalizedSkills
    });

    // Récupérer les projets ouverts avec filtres intelligents
    const projects = await db.collection('projects')
      .find({ 
        status: 'open',
        $or: [
          { skills: { $in: normalizedSkills } },
          { category: { $in: getFreelancerCategories(normalizedSkills) } },
          { 'budget.max': { $gte: (freelancer.hourlyRate || 25) * 20 } } // Budget minimum réaliste avec valeur par défaut
        ]
      })
      .sort({ createdAt: -1 }) // Plus récents d'abord
      .limit(testMode ? 50 : 100)
      .toArray();

    console.log(`🎯 Found ${projects.length} potential projects for ${freelancer.name}`);

    // Utiliser le service de matching freelancer
    const recommendations = await freelancerMatchingService.findBestProjectsForFreelancer(
      {
        ...freelancer,
        skills: normalizedSkills // Utiliser les compétences normalisées
      },
      projects,
      limit
    );

    return NextResponse.json({
      success: true,
      freelancer: {
        _id: freelancer._id,
        name: freelancer.name,
        skills: normalizedSkills,
        hourlyRate: freelancer.hourlyRate,
        experience: getTotalExperience(freelancer)
      },
      recommendations,
      insights: {
        totalProjectsAnalyzed: projects.length,
        recommendedProjects: recommendations.length,
        matchRate: projects.length > 0 ? (recommendations.length / projects.length * 100).toFixed(1) : '0',
        priorityBreakdown: {
          high: recommendations.filter(r => r.freelancerPerspective?.urgency === 'high').length,
          medium: recommendations.filter(r => r.freelancerPerspective?.urgency === 'medium').length,
          low: recommendations.filter(r => r.freelancerPerspective?.urgency === 'low').length
        },
        recommendationTypes: {
          excellent: recommendations.filter(r => r.matchGrade === 'excellent').length,
          good: recommendations.filter(r => r.matchGrade === 'good').length,
          potential: recommendations.filter(r => r.matchGrade === 'potential').length
        }
      },
      matchingEngine: 'freelancer-ai-ultra-v1',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Freelancer recommendations API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// 🆕 FONCTION POUR NORMALISER LES COMPÉTENCES
function normalizeSkills(skills: any[] | null | undefined): string[] {
  if (!skills || !Array.isArray(skills)) {
    return [];
  }

  return skills.map(skill => {
    if (typeof skill === 'string') {
      // Format string: "React"
      return skill;
    } else if (skill && typeof skill === 'object' && skill.name) {
      // Format objet: {name: "React", category: "...", ...}
      return skill.name;
    } else {
      // Format inattendu, retourner une chaîne vide
      console.warn('Unexpected skill format:', skill);
      return '';
    }
  }).filter(skill => skill && skill.trim() !== ''); // Filtrer les chaînes vides
}

// Helper functions mises à jour
function getFreelancerCategories(skills: string[]): string[] {
  const categories = [];
  
  if (skills.some(skill => 
    ['react', 'javascript', 'node', 'python', 'java', 'typescript', 'html', 'css']
    .includes(skill.toLowerCase())
  )) {
    categories.push('Web Development');
  }
  
  if (skills.some(skill => 
    ['design', 'ui', 'ux', 'figma', 'photoshop', 'illustrator', 'sketch', 'adobe xd']
    .includes(skill.toLowerCase())
  )) {
    categories.push('Design');
  }
  
  if (skills.some(skill => 
    ['seo', 'marketing', 'content', 'social media', 'digital marketing', 'google analytics']
    .includes(skill.toLowerCase())
  )) {
    categories.push('Marketing');
  }

  if (skills.some(skill => 
    ['mobile', 'android', 'ios', 'swift', 'kotlin', 'flutter', 'react native']
    .includes(skill.toLowerCase())
  )) {
    categories.push('Mobile Development');
  }
  
  return categories.length > 0 ? categories : ['Other'];
}

function getTotalExperience(user: any): number {
  if (!user.experience || user.experience.length === 0) {
    return user.statistics?.completedProjects ? Math.min(user.statistics.completedProjects / 10, 5) : 1;
  }
  
  return user.experience.reduce((total: number, exp: any) => {
    try {
      const start = new Date(exp.startDate);
      const end = exp.current ? new Date() : new Date(exp.endDate);
      const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
      return total + Math.max(0, years); // Éviter les valeurs négatives
    } catch (error) {
      console.warn('Error calculating experience for:', exp);
      return total;
    }
  }, 0);
}

// 🆕 FONCTION UTILITAIRE POUR EXTRACTION DES COMPÉTENCES (peut être utilisée ailleurs)
export function extractSkillNames(skills: any[]): string[] {
  return normalizeSkills(skills);
}
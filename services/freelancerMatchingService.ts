// services/freelancerMatchingService.ts
import { aiMatchingService } from './aiMatchingService';

export interface ProjectMatch {
  projectId: string;
  project: any;
  matchScore: number;
  matchGrade: 'excellent' | 'good' | 'potential' | 'low';
  freelancerPerspective: {
    earningsPotential: number; // 0-100
    learningValue: number; // 0-100  
    careerBoost: number; // 0-100
    applicationPriority: number; // 0-100 - Score composite
    urgency: 'high' | 'medium' | 'low';
  };
  whyPerfectForYou: string[];
  potentialConcerns: string[];
  recommendedBid?: {
    min: number;
    max: number;
    strategy: string;
  };
}

class FreelancerMatchingService {
  private static instance: FreelancerMatchingService;

  public static getInstance(): FreelancerMatchingService {
    if (!FreelancerMatchingService.instance) {
      FreelancerMatchingService.instance = new FreelancerMatchingService();
    }
    return FreelancerMatchingService.instance;
  }

  async findBestProjectsForFreelancer(
    freelancer: any,
    projects: any[],
    limit: number = 15
  ): Promise<ProjectMatch[]> {
    
    console.log(`🎯 Analyzing ${projects.length} projects for freelancer ${freelancer.name}`);
    
    // 🔥 ÉTAPE 1: Matching de base avec l'algo existant
    const baseMatches = await this.getBaseMatches(freelancer, projects);
    
    // 🔥 ÉTAPE 2: Enrichissement perspective freelancer
    const enhancedMatches = baseMatches.map(match => 
      this.enhanceWithFreelancerPerspective(match, freelancer)
    );
    
    // 🔥 ÉTAPE 3: Filtrage intelligent
    const filteredMatches = enhancedMatches.filter(match => 
      this.shouldRecommendProject(match, freelancer)
    );
    
    // 🔥 ÉTAPE 4: Tri par priorité de candidature
    const sortedMatches = filteredMatches.sort((a, b) => 
      b.freelancerPerspective.applicationPriority - a.freelancerPerspective.applicationPriority
    );
    
    console.log(`✅ Found ${sortedMatches.length} recommended projects out of ${projects.length}`);
    
    return sortedMatches.slice(0, limit);
  }

  private async getBaseMatches(freelancer: any, projects: any[]): Promise<any[]> {
    const matches = [];
    
    for (const project of projects) {
      try {
        const projectRequirements = this.mapProjectToRequirements(project);
        const match = await aiMatchingService.calculateMatch(
          freelancer,
          project._id.toString(),
          projectRequirements
        );
        
        matches.push({
          ...match,
          project: project
        });
      } catch (error) {
        console.error(`Error matching project ${project._id}:`, error);
        continue;
      }
    }
    
    return matches;
  }

  private enhanceWithFreelancerPerspective(match: any, freelancer: any): ProjectMatch {
    const project = match.project;
    
    return {
      projectId: match.projectId,
      project: project,
      matchScore: match.matchScore,
      matchGrade: match.matchGrade,
      freelancerPerspective: {
        earningsPotential: this.calculateEarningsPotential(freelancer, project),
        learningValue: this.calculateLearningValue(freelancer, project, match),
        careerBoost: this.calculateCareerBoost(freelancer, project),
        applicationPriority: this.calculateApplicationPriority(freelancer, project, match),
        urgency: this.calculateUrgency(project)
      },
      whyPerfectForYou: this.generateWhyPerfectForYou(freelancer, project, match),
      potentialConcerns: this.generatePotentialConcerns(freelancer, project, match),
      recommendedBid: this.generateRecommendedBid(freelancer, project)
    };
  }

  private calculateEarningsPotential(freelancer: any, project: any): number {
    const freelancerRate = freelancer.hourlyRate || 50;
    const projectBudget = project.budget?.max || 5000;
    const estimatedHours = project.timeline * 8; // Jours → heures
    
    const potentialEarnings = freelancerRate * estimatedHours;
    const budgetRatio = Math.min(potentialEarnings / projectBudget, 1);
    
    if (budgetRatio >= 0.9) return 90; // Excellent
    if (budgetRatio >= 0.7) return 70; // Bon
    if (budgetRatio >= 0.5) return 50; // Moyen
    return 30; // Faible
  }

  private calculateLearningValue(freelancer: any, project: any, match: any): number {
    let score = 50;
    
    // 🔥 NOUVELLES TECHNOS
    const newTechnologies = project.skills?.filter((skill: string) => 
      !freelancer.skills?.includes(skill)
    ) || [];
    
    if (newTechnologies.length > 0) {
      score += Math.min(newTechnologies.length * 10, 30);
    }
    
    // 🔥 COMPLEXITÉ CROISSANTE
    const experienceLevel = this.getExperienceLevel(freelancer);
    const projectComplexity = project.complexity || 'moderate';
    
    if ((experienceLevel === 'junior' && projectComplexity === 'moderate') ||
        (experienceLevel === 'mid' && projectComplexity === 'complex')) {
      score += 15;
    }
    
    // 🔥 DOMAINE NOUVEAU
    const projectCategory = project.category;
    const freelancerCategories = this.getFreelancerCategories(freelancer);
    
    if (!freelancerCategories.includes(projectCategory)) {
      score += 10;
    }
    
    return Math.min(score, 100);
  }

  private calculateCareerBoost(freelancer: any, project: any): number {
    let score = 50;
    
    // 🏆 PRESTIGE CLIENT
    if (project.client?.premium) score += 20;
    
    // 📈 VISIBILITÉ
    if (project.scope === 'large' || project.visibility === 'high') {
      score += 15;
    }
    
    // 💼 PORTEFEUILLE
    const portfolioGap = this.analyzePortfolioGap(freelancer, project);
    score += portfolioGap * 10;
    
    return Math.min(score, 100);
  }

  private calculateApplicationPriority(freelancer: any, project: any, match: any): number {
    const weights = {
      matchQuality: 0.35,
      earnings: 0.25,
      learning: 0.20,
      career: 0.15,
      urgency: 0.05
    };
    
    return (
      (match.matchScore / 100) * weights.matchQuality * 100 +
      this.calculateEarningsPotential(freelancer, project) * weights.earnings +
      this.calculateLearningValue(freelancer, project, match) * weights.learning +
      this.calculateCareerBoost(freelancer, project) * weights.career +
      (this.calculateUrgency(project) === 'high' ? 100 : 50) * weights.urgency
    );
  }

  private calculateUrgency(project: any): 'high' | 'medium' | 'low' {
    const daysSincePosted = this.getDaysSince(new Date(project.createdAt));
    
    if (daysSincePosted < 2) return 'high';
    if (daysSincePosted < 7) return 'medium';
    return 'low';
  }

  private generateWhyPerfectForYou(freelancer: any, project: any, match: any): string[] {
    const reasons = [];
    
    // 🎯 COMPÉTENCES FORTES
    if (match.skillGapAnalysis.strong.length > 0) {
      reasons.push(`Expertise en ${match.skillGapAnalysis.strong.slice(0, 2).join(', ')}`);
    }
    
    // 💰 BUDGET AVANTAGEUX
    const earningsScore = this.calculateEarningsPotential(freelancer, project);
    if (earningsScore >= 70) {
      reasons.push('Budget très intéressant pour votre profil');
    }
    
    // 📚 APPRENTISSAGE
    const learningScore = this.calculateLearningValue(freelancer, project, match);
    if (learningScore >= 70) {
      reasons.push('Excellente opportunité de développement');
    }
    
    // ⏱️ DISPONIBILITÉ
    if (freelancer.availability === 'full-time' && project.timeline <= 30) {
      reasons.push('Délai parfait pour votre disponibilité');
    }
    
    return reasons.slice(0, 3);
  }

  private generatePotentialConcerns(freelancer: any, project: any, match: any): string[] {
    const concerns = [];
    
    // ⚠️ COMPÉTENCES MANQUANTES
    if (match.skillGapAnalysis.missing.length > 0) {
      concerns.push(`Compétences à acquérir: ${match.skillGapAnalysis.missing.slice(0, 2).join(', ')}`);
    }
    
    // ⚠️ BUDGET TROP BAS
    const earningsScore = this.calculateEarningsPotential(freelancer, project);
    if (earningsScore < 50) {
      concerns.push('Budget potentiellement bas pour votre taux');
    }
    
    // ⚠️ DÉLAIS SERBÉS
    if (project.timeline < 14 && freelancer.currentWorkload > 50) {
      concerns.push('Délais serrés compte tenu de votre charge actuelle');
    }
    
    return concerns.slice(0, 2);
  }

  private generateRecommendedBid(freelancer: any, project: any) {
    const freelancerRate = freelancer.hourlyRate || 50;
    const projectBudget = project.budget;
    
    if (!projectBudget) return undefined;
    
    const estimatedHours = project.timeline * 8;
    const minBid = Math.max(freelancerRate * estimatedHours * 0.8, projectBudget.min);
    const maxBid = Math.min(freelancerRate * estimatedHours * 1.2, projectBudget.max);
    
    let strategy = 'standard';
    if (maxBid > projectBudget.max * 0.9) strategy = 'premium';
    if (minBid < projectBudget.min * 1.1) strategy = 'competitive';
    
    return {
      min: Math.round(minBid),
      max: Math.round(maxBid),
      strategy
    };
  }

  private shouldRecommendProject(match: ProjectMatch, freelancer: any): boolean {
    // 🎯 TOUJOURS recommander les matches excellents
    if (match.matchGrade === 'excellent') return true;
    
    // 🎯 Recommander les bons matches avec perspective positive
    if (match.matchGrade === 'good' && match.freelancerPerspective.applicationPriority >= 60) {
      return true;
    }
    
    // 🎯 Recommander les potentiels si forte valeur d'apprentissage
    if (match.matchGrade === 'potential' && 
        match.freelancerPerspective.learningValue >= 70 &&
        match.freelancerPerspective.applicationPriority >= 50) {
      return true;
    }
    
    return false;
  }

  // Helper methods
  private mapProjectToRequirements(project: any) {
    return {
      requiredSkills: project.skills || [],
      preferredSkills: project.preferredSkills || [],
      niceToHave: project.niceToHave || [],
      experienceLevel: this.getExperienceLevel(project),
      budgetRange: project.budget || { min: 0, max: 10000 },
      timeline: project.timeline || 30,
      complexity: project.complexity || 'moderate',
      teamSize: 1
    };
  }

  private getExperienceLevel(user: any): 'junior' | 'mid' | 'senior' | 'expert' {
    const experience = user.experience?.length || 0;
    if (experience > 5) return 'expert';
    if (experience > 3) return 'senior';
    if (experience > 1) return 'mid';
    return 'junior';
  }

  private getFreelancerCategories(freelancer: any): string[] {
    // Implémentation simplifiée
    return ['Web Development', 'Design', 'Marketing']; // À adapter
  }

  private analyzePortfolioGap(freelancer: any, project: any): number {
    // Analyse si ce projet comble un gap dans le portfolio
    return Math.random(); // À implémenter
  }

  private getDaysSince(date: Date): number {
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  }
}

export const freelancerMatchingService = FreelancerMatchingService.getInstance();
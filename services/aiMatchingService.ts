// services/aiMatchingService.ts
import { AITalentMatch, SkillProfile, ProjectRequirements, CulturalFit, WorkStylePreference } from '@/types/ai-matching';

class AIMatchingService {
  private static instance: AIMatchingService;

  // 🔧 CONFIGURATION OPTIMISÉE
  private readonly MATCH_THRESHOLDS = {
    EXCELLENT: 65,
    GOOD: 50,
    MINIMAL: 35
  };

  private readonly SKILL_SIMILARITY_THRESHOLD = 0.5; // 🔧 SEUIL ABAISSÉ

  public static getInstance(): AIMatchingService {
    if (!AIMatchingService.instance) {
      AIMatchingService.instance = new AIMatchingService();
    }
    return AIMatchingService.instance;
  }

  // 🔧 CALCUL DE MATCH OPTIMISÉ
  private calculateSkillMatch(freelancerSkills: SkillProfile[], requirements: ProjectRequirements): number {
    if (requirements.requiredSkills.length === 0) return 100;
    
    let totalScore = 0;
    let matchedSkills = 0;

    requirements.requiredSkills.forEach(requiredSkill => {
      let bestMatch = 0;

      // 🔧 RECHERCHE MEILLEURE CORRESPONDANCE PARMI TOUTES LES COMPÉTENCES
      freelancerSkills.forEach(freelancerSkill => {
        const similarity = this.skillSimilarityOptimized(freelancerSkill.name, requiredSkill);
        
        if (similarity > this.SKILL_SIMILARITY_THRESHOLD) {
          const levelScore = this.skillLevelToScore(freelancerSkill.level);
          const skillScore = similarity * levelScore;
          
          if (skillScore > bestMatch) {
            bestMatch = skillScore;
          }
        }
      });

      if (bestMatch > 0) {
        totalScore += bestMatch * 100;
        matchedSkills++;
      }
    });

    if (matchedSkills === 0) return 0;
    
    // 🔧 FORMULE PLUS ÉQUILIBRÉE
    const coverageRatio = matchedSkills / requirements.requiredSkills.length;
    const averageScore = totalScore / matchedSkills;
    
    return (coverageRatio * 60) + (averageScore * 0.4);
  }

  // 🔧 VÉRIFICATION MINIMALE OPTIMISÉE
  private hasMinimumRequiredSkills(freelancerSkills: SkillProfile[], requirements: ProjectRequirements): boolean {
    if (!requirements.requiredSkills || requirements.requiredSkills.length === 0) {
      return true;
    }

    // 🔧 SEUIL VARIABLE BASÉ SUR LA COMPLEXITÉ
    const complexityThresholds = {
      'simple': 0.2,
      'moderate': 0.3,
      'complex': 0.4,
      'very-complex': 0.5
    };

    const threshold = complexityThresholds[requirements.complexity] || 0.3;
    const requiredMatchCount = Math.ceil(requirements.requiredSkills.length * threshold);
    
    let matchCount = 0;

    requirements.requiredSkills.forEach(requiredSkill => {
      const hasSkill = freelancerSkills.some(fs => 
        fs.name && this.skillSimilarityOptimized(fs.name, requiredSkill) > this.SKILL_SIMILARITY_THRESHOLD
      );
      if (hasSkill) matchCount++;
    });

    return matchCount >= requiredMatchCount;
  }

  // 🔧 SIMILARITÉ DES COMPÉTENCES OPTIMISÉE
  private skillSimilarityOptimized(skill1: string, skill2: string): number {
    if (!skill1 || !skill2) return 0;
    
    const normalizeSkill = (skill: string): string => {
      return skill.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const norm1 = normalizeSkill(skill1);
    const norm2 = normalizeSkill(skill2);
    
    // Match exact
    if (norm1 === norm2) return 1.0;
    
    // Contient l'autre compétence
    if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.85;
    
    // 🔧 MAPPING ÉTENDU DES COMPÉTENCES
    const similarSkills: { [key: string]: string[] } = {
      'react': ['reactjs', 'react.js', 'react native', 'next.js', 'nextjs'],
      'node': ['nodejs', 'node.js', 'express', 'nest.js'],
      'typescript': ['ts', 'type script'],
      'javascript': ['js', 'ecmascript', 'es6'],
      'ui/ux': ['ui', 'ux', 'design', 'user interface', 'user experience'],
      'rest api': ['api', 'rest', 'restful', 'graphql', 'web api'],
      'wordpress': ['wp', 'woocommerce', 'elementor'],
      'mongodb': ['mongo', 'nosql'],
      'photoshop': ['adobe photoshop', 'ps'],
      'figma': ['prototyping', 'ui design'],
      'aws': ['amazon web services', 'cloud'],
      'docker': ['container', 'kubernetes'],
      'python': ['django', 'flask'],
      'java': ['spring', 'j2ee']
    };

    for (const [base, variants] of Object.entries(similarSkills)) {
      if ((variants.includes(norm1) && norm2 === base) || 
          (variants.includes(norm2) && norm1 === base)) {
        return 0.75;
      }
    }

    // 🔧 SIMILARITÉ SÉMANTIQUE AMÉLIORÉE
    const words1 = norm1.split(' ');
    const words2 = norm2.split(' ');
    
    const commonWords = words1.filter(word => 
      words2.some(w2 => this.wordSimilarity(word, w2) > 0.7)
    ).length;
    
    const totalWords = new Set([...words1, ...words2]).size;
    
    return totalWords > 0 ? commonWords / totalWords : 0;
  }

  private wordSimilarity(word1: string, word2: string): number {
    if (word1 === word2) return 1.0;
    if (word1.includes(word2) || word2.includes(word1)) return 0.8;
    
    if (word1.length <= 3 || word2.length <= 3) return 0;
    
    // Distance de Levenshtein simplifiée
    const maxLength = Math.max(word1.length, word2.length);
    let distance = 0;
    
    for (let i = 0; i < maxLength; i++) {
      if (word1[i] !== word2[i]) distance++;
    }
    
    return 1 - (distance / maxLength);
  }

  // 🔧 ALGORITHME PRINCIPAL OPTIMISÉ
async findBestMatches(
  projectId: string,
  projectRequirements: ProjectRequirements,
  freelancers: any[],
  limit: number = 15
): Promise<AITalentMatch[]> {
  const matches: AITalentMatch[] = [];

  // 🔧 FILTRAGE PRÉLIMINAIRE POUR PERFORMANCE
  const preFilteredFreelancers = freelancers.filter(freelancer => {
    const freelancerSkills = this.mapUserSkillsToSkillProfile(freelancer);
    return this.hasMinimumRequiredSkills(freelancerSkills, projectRequirements);
  });

  console.log(`🔍 ${preFilteredFreelancers.length}/${freelancers.length} freelancers passent le filtre initial`);

  // 🔧 CRÉATION D'UNE MAP POUR STOCKER LES DONNÉES DES FREELANCERS
  const freelancerDataMap = new Map();
  preFilteredFreelancers.forEach(freelancer => {
    freelancerDataMap.set(freelancer._id.toString(), freelancer);
  });

  for (const freelancer of preFilteredFreelancers) {
    try {
      const match = await this.calculateMatch(
        freelancer,
        projectId,
        projectRequirements
      );
      
      // 🔧 SEUILS MULTIPLES POUR PLUS DE FLEXIBILITÉ
      if (match.matchScore >= this.MATCH_THRESHOLDS.EXCELLENT) {
        matches.push({ ...match, matchGrade: 'excellent' });
      } else if (match.matchScore >= this.MATCH_THRESHOLDS.GOOD) {
        matches.push({ ...match, matchGrade: 'good' });
      } else if (match.matchScore >= this.MATCH_THRESHOLDS.MINIMAL) {
        matches.push({ ...match, matchGrade: 'potential' });
      }
    } catch (error) {
      console.error(`Error calculating match for freelancer ${freelancer._id}:`, error);
      continue;
    }
  }

  // 🔧 TRI INTELLIGENT AVEC BONUS - CORRIGÉ
  return matches
    .sort((a, b) => {
      let scoreA = a.matchScore;
      let scoreB = b.matchScore;

      // 🔧 RÉCUPÉRATION DES DONNÉES FREELANCER DEPUIS LA MAP
      const freelancerA = freelancerDataMap.get(a.freelancerId);
      const freelancerB = freelancerDataMap.get(b.freelancerId);

      // Bonus pour haute satisfaction client
      if (a.clientSatisfactionPrediction > 90) scoreA += 5;
      if (b.clientSatisfactionPrediction > 90) scoreB += 5;

      // 🔧 CORRECTION : Bonus pour faible charge de travail
      if (freelancerA?.currentWorkload < 50) scoreA += 3;
      if (freelancerB?.currentWorkload < 50) scoreB += 3;

      // 🔧 BONUS SUPPLÉMENTAIRES POUR AMÉLIORER LE TRI
      if (a.confidence > 80) scoreA += 2;
      if (b.confidence > 80) scoreB += 2;

      if (a.culturalFit > 85) scoreA += 2;
      if (b.culturalFit > 85) scoreB += 2;

      return scoreB - scoreA;
    })
    .slice(0, limit);
}
  private skillLevelToScore(level: string): number {
    const levels = {
      'beginner': 0.4,  // 🔧 LÉGÈREMENT AUGMENTÉ
      'intermediate': 0.7,
      'advanced': 0.85,
      'expert': 1.0
    };
    return levels[level as keyof typeof levels] || 0.3;
  }

  private experienceLevelToYears(level: string): number {
    const levels = {
      'junior': 1,
      'mid': 3,
      'senior': 5,
      'expert': 8
    };
    return levels[level as keyof typeof levels] || 1;
  }

  private analyzeLearningPotential(freelancer: any, requirements: ProjectRequirements): number {
    let potential = 60;

    // 🔧 CRITÈRES AMÉLIORÉS
    if (freelancer.skillsLearnedLastYear > 2) {
      potential += 15;
    }

    const skillGaps = this.analyzeSkillGapsOptimized(freelancer.skills, requirements);
    if (skillGaps.missing.length > 0 && skillGaps.missing.length < 4) {
      potential += 10;
    }

    if (freelancer.careerProgression === 'rapid') {
      potential += 5;
    }

    // Bonus pour certifications ou formations
    if (freelancer.certifications && freelancer.certifications.length > 0) {
      potential += 5;
    }

    return Math.min(potential, 100);
  }

  // 🔧 ANALYSE DES ÉCARTS OPTIMISÉE
  private analyzeSkillGapsOptimized(freelancerSkills: SkillProfile[], requirements: ProjectRequirements) {
    const missing: string[] = [];
    const strong: string[] = [];
    const learningOpportunities: string[] = [];

    requirements.requiredSkills.forEach(skill => {
      const freelancerSkill = freelancerSkills.find((fs: SkillProfile) => {
        if (!fs.name || !skill) return false;
        return this.skillSimilarityOptimized(fs.name, skill) > this.SKILL_SIMILARITY_THRESHOLD;
      });
      
      if (!freelancerSkill) {
        missing.push(skill);
      } else if (freelancerSkill.level === 'expert' || freelancerSkill.level === 'advanced') {
        strong.push(skill);
      } else {
        learningOpportunities.push(skill);
      }
    });

    return { missing, strong, learningOpportunities };
  }

  private predictClientSatisfaction(freelancer: any): number {
    let satisfaction = 70;

    if (freelancer.rating) {
      satisfaction = (freelancer.rating / 5) * 100;
    }

    if (freelancer.communicationScore) {
      satisfaction = (satisfaction + freelancer.communicationScore) / 2;
    }

    if (freelancer.onTimeDeliveryRate) {
      satisfaction = (satisfaction + freelancer.onTimeDeliveryRate) / 2;
    }

    // 🔧 BONUS POUR BONS ANTÉCÉDENTS
    if (freelancer.statistics?.repeatClientRate > 80) {
      satisfaction += 5;
    }

    return Math.min(satisfaction, 100);
  }

  private identifyRiskFactors(freelancer: any, requirements: ProjectRequirements): string[] {
    const risks: string[] = [];

    const skillGaps = this.analyzeSkillGapsOptimized(freelancer.skills, requirements);
    
    // 🔧 RISQUES PLUS NUANCÉS
    if (skillGaps.missing.length > requirements.requiredSkills.length * 0.6) {
      risks.push(`Compétences critiques manquantes: ${skillGaps.missing.slice(0, 3).join(', ')}`);
    } else if (skillGaps.missing.length > 0) {
      risks.push(`Compétences à renforcer: ${skillGaps.missing.slice(0, 2).join(', ')}`);
    }

    const experienceMatch = this.calculateExperienceMatch(freelancer, requirements);
    if (experienceMatch < 40) {
      risks.push('Expérience limitée pour ce type de projet');
    }

    if (freelancer.currentWorkload > 85) {
      risks.push('Charge de travail actuellement élevée');
    }

    if (requirements.complexity === 'very-complex' && freelancer.communicationScore < 75) {
      risks.push('Communication à surveiller pour projets complexes');
    }

    return risks;
  }

  private generateRecommendations(freelancer: any, requirements: ProjectRequirements): string[] {
    const recommendations: string[] = [];

    const skillGaps = this.analyzeSkillGapsOptimized(freelancer.skills, requirements);
    
    if (skillGaps.missing.length > 0) {
      recommendations.push(`Compétences complémentaires recommandées: ${skillGaps.missing.slice(0, 2).join(', ')}`);
    }

    if (skillGaps.learningOpportunities.length > 0) {
      recommendations.push(`Domaines de développement: ${skillGaps.learningOpportunities.slice(0, 2).join(', ')}`);
    }

    if (requirements.complexity === 'very-complex' && freelancer.complexProjects < 3) {
      recommendations.push('Support senior recommandé pour ce niveau de complexité');
    }

    if (freelancer.currentWorkload > 70) {
      recommendations.push('Prévoir une marge dans les délais de livraison');
    }

    // 🔧 RECOMMANDATIONS POSITIVES
    if (skillGaps.strong.length > 0) {
      recommendations.push(`Points forts: ${skillGaps.strong.slice(0, 2).join(', ')}`);
    }

    return recommendations;
  }

  private estimateTimeline(freelancer: any, requirements: ProjectRequirements): number {
    const baseTimeline = requirements.timeline;
    
    let efficiencyMultiplier = 1.0;
    
    if (freelancer.averageDeliverySpeed === 'fast') {
      efficiencyMultiplier = 0.8;
    } else if (freelancer.averageDeliverySpeed === 'slow') {
      efficiencyMultiplier = 1.2;
    }

    // 🔧 CALCUL PLUS PRÉCIS
    if (freelancer.currentWorkload > 80) {
      efficiencyMultiplier *= 1.25;
    } else if (freelancer.currentWorkload > 60) {
      efficiencyMultiplier *= 1.1;
    } else if (freelancer.currentWorkload < 30) {
      efficiencyMultiplier *= 0.9; // Bonus pour disponibilité
    }

    return Math.ceil(baseTimeline * efficiencyMultiplier);
  }

  private calculateConfidence(freelancer: any): number {
    let confidence = 70;

    if (freelancer.projectsCompleted > 10) {
      confidence += 15;
    } else if (freelancer.projectsCompleted > 5) {
      confidence += 10;
    } else if (freelancer.projectsCompleted > 2) {
      confidence += 5;
    }

    const verifiedSkills = freelancer.skills?.filter((s: SkillProfile) => s.verified).length || 0;
    if (verifiedSkills > 5) {
      confidence += 10;
    } else if (verifiedSkills > 2) {
      confidence += 5;
    }

    if (freelancer.ratingConsistency === 'high') {
      confidence += 5;
    }

    // 🔧 BONUS POUR ANCIENNETÉ
    const totalExperience = this.getTotalExperience(freelancer);
    if (totalExperience > 3) {
      confidence += 5;
    }

    return Math.min(confidence, 100);
  }

  // 🔧 CALCUL DE SCORE GLOBAL OPTIMISÉ
  private calculateOverallScore(components: {
    skillMatch: number;
    experienceMatch: number;
    culturalFit: number;
    successPrediction: number;
    learningPotential: number;
  }): number {
    const weights = {
      skillMatch: 0.45,      // 🔧 LÉGÈREMENT RÉDUIT
      experienceMatch: 0.25,  // 🔧 AUGMENTÉ
      culturalFit: 0.15,
      successPrediction: 0.10,
      learningPotential: 0.05
    };

    const baseScore = (
      components.skillMatch * weights.skillMatch +
      components.experienceMatch * weights.experienceMatch +
      components.culturalFit * weights.culturalFit +
      components.successPrediction * weights.successPrediction +
      components.learningPotential * weights.learningPotential
    );

    // 🔧 BONUS POUR BONNE COUVERTURE DES COMPÉTENCES
    const skillCoverageBonus = Math.min(components.skillMatch / 25, 8);
    return Math.min(baseScore + skillCoverageBonus, 100);
  }

  public async calculateMatch(
    freelancer: any,
    projectId: string,
    requirements: ProjectRequirements
  ): Promise<AITalentMatch> {
    try {
      const freelancerSkills: SkillProfile[] = this.mapUserSkillsToSkillProfile(freelancer);
      
      if (!this.hasMinimumRequiredSkills(freelancerSkills, requirements)) {
        return this.createLowMatchScore(freelancer, projectId, requirements, freelancerSkills);
      }

      const skillMatch = this.calculateSkillMatch(freelancerSkills, requirements);
      const experienceMatch = this.calculateExperienceMatch(freelancer, requirements);
      const culturalFit = this.analyzeCulturalFit(freelancer, requirements);
      const successPrediction = this.predictSuccessProbability(freelancer, requirements);
      const learningPotential = this.analyzeLearningPotential(freelancer, requirements);

      const matchScore = this.calculateOverallScore({
        skillMatch,
        experienceMatch,
        culturalFit,
        successPrediction,
        learningPotential
      });
return {
  freelancerId: freelancer._id.toString(),
  projectId,
  matchScore,
  matchGrade: this.determineMatchGrade(matchScore, skillMatch), // 🔧 AJOUT DU MATCH GRADE
  skillGapAnalysis: this.analyzeSkillGapsOptimized(freelancerSkills, requirements),
  projectSuccessScore: successPrediction,
  culturalFit,
  learningPotential,
  clientSatisfactionPrediction: this.predictClientSatisfaction(freelancer),
  riskFactors: this.identifyRiskFactors(freelancer, requirements),
  recommendedActions: this.generateRecommendations(freelancer, requirements),
  estimatedTimeline: this.estimateTimeline(freelancer, requirements),
  confidence: this.calculateConfidence(freelancer)
};
    } catch (error) {
      console.error('Error in calculateMatch:', error);
      throw error;
    }
  }
// 🔧 MÉTHODE POUR DÉTERMINER LE GRADE DU MATCH
private determineMatchGrade(matchScore: number, skillMatch: number): 'excellent' | 'good' | 'potential' | 'low' {
  if (matchScore >= 75 && skillMatch >= 70) return 'excellent';
  if (matchScore >= 60 && skillMatch >= 50) return 'good';
  if (matchScore >= 40) return 'potential';
  return 'low';
}

  private createLowMatchScore(
  freelancer: any, 
  projectId: string, 
  requirements: ProjectRequirements,
  freelancerSkills: SkillProfile[]
): AITalentMatch {
  const skillGaps = this.analyzeSkillGapsOptimized(freelancerSkills, requirements);
  
  return {
    freelancerId: freelancer._id.toString(),
    projectId,
    matchScore: 25,
    matchGrade: 'low', // 🔧 DIRECTEMENT 'low' POUR LES MATCHS FAIBLES
    skillGapAnalysis: skillGaps,
    projectSuccessScore: 15,
    culturalFit: this.analyzeCulturalFit(freelancer, requirements),
    learningPotential: this.analyzeLearningPotential(freelancer, requirements),
    clientSatisfactionPrediction: this.predictClientSatisfaction(freelancer),
    riskFactors: ['Compétences principales manquantes', ...this.identifyRiskFactors(freelancer, requirements)],
    recommendedActions: ['Rechercher un profil plus adapté', ...this.generateRecommendations(freelancer, requirements)],
    estimatedTimeline: this.estimateTimeline(freelancer, requirements),
    confidence: 25
  };
}

  private mapUserSkillsToSkillProfile(user: any): SkillProfile[] {
    return (user.skills || []).map((skill: string, index: number) => ({
      id: `skill-${index}`,
      name: skill,
      category: this.detectSkillCategory(skill),
      level: this.determineSkillLevel(user, skill),
      yearsOfExperience: this.getSkillExperience(user, skill),
      verified: user.verified || false,
      lastUsed: new Date(),
      projectsCompleted: user.statistics?.completedProjects || 0,
      successRate: user.statistics?.successRate || 0,
      featured: false
    }));
  }

  private detectSkillCategory(skill: string): string {
    const categories: { [key: string]: string[] } = {
      'Web Development': ['react', 'javascript', 'typescript', 'html', 'css', 'node', 'next', 'vue', 'angular'],
      'Mobile Development': ['react native', 'flutter', 'ios', 'android', 'swift', 'kotlin'],
      'Design': ['ui/ux', 'figma', 'photoshop', 'illustrator', 'adobe xd', 'sketch'],
      'Marketing': ['seo', 'social media', 'content marketing', 'digital marketing', 'google analytics'],
      'Data Science': ['python', 'machine learning', 'data science', 'tensorflow', 'pytorch', 'r'],
      'DevOps': ['docker', 'kubernetes', 'aws', 'azure', 'ci/cd', 'jenkins', 'terraform']
    };

    for (const [category, skills] of Object.entries(categories)) {
      if (skills.some(s => skill.toLowerCase().includes(s))) {
        return category;
      }
    }
    return 'Other';
  }

  private determineSkillLevel(user: any, skill: string): SkillProfile['level'] {
    const experience = user.experience?.length || 0;
    const successRate = user.statistics?.successRate || 0;
    
    if (experience > 5 && successRate > 90) return 'expert';
    if (experience > 3 && successRate > 80) return 'advanced';
    if (experience > 1 && successRate > 70) return 'intermediate';
    return 'beginner';
  }

  private getSkillExperience(user: any, skill: string): number {
    const userExperience = user.experience || [];
    const relevantExperience = userExperience.filter((exp: any) => 
      exp.technologies?.some((tech: string) => 
        tech.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    if (relevantExperience.length === 0) return 1;
    
    return relevantExperience.reduce((total: number, exp: any) => {
      const start = new Date(exp.startDate);
      const end = exp.current ? new Date() : new Date(exp.endDate);
      const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
      return total + years;
    }, 0);
  }

  private calculateExperienceMatch(freelancer: any, requirements: ProjectRequirements): number {
    const totalExperience = this.getTotalExperience(freelancer);
    const requiredExperience = this.experienceLevelToYears(requirements.experienceLevel);
    
    if (totalExperience >= requiredExperience) return 100;
    if (totalExperience >= requiredExperience * 0.8) return 80;
    if (totalExperience >= requiredExperience * 0.6) return 60;
    if (totalExperience >= requiredExperience * 0.4) return 40;
    return 20;
  }

  private getTotalExperience(user: any): number {
    if (!user.experience || user.experience.length === 0) return 1;
    
    return user.experience.reduce((total: number, exp: any) => {
      const start = new Date(exp.startDate);
      const end = exp.current ? new Date() : new Date(exp.endDate);
      const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
      return total + years;
    }, 0);
  }

  private analyzeCulturalFit(freelancer: any, requirements: ProjectRequirements): number {
    let score = 70;

    if (freelancer.rating && freelancer.rating >= 4.5) {
      score += 15;
    } else if (freelancer.rating && freelancer.rating >= 4.0) {
      score += 10;
    }

    if (freelancer.statistics?.responseRate > 90) {
      score += 10;
    } else if (freelancer.statistics?.responseRate > 80) {
      score += 5;
    }

    if (freelancer.statistics?.successRate > 90) {
      score += 5;
    }

    return Math.min(score, 100);
  }

  private predictSuccessProbability(freelancer: any, requirements: ProjectRequirements): number {
    let score = 50;

    if (freelancer.statistics?.successRate) {
      score += freelancer.statistics.successRate * 0.3;
    }

    if (freelancer.rating) {
      score += (freelancer.rating / 5) * 100 * 0.2;
    }

    const totalExperience = this.getTotalExperience(freelancer);
    score += Math.min(totalExperience * 5, 20);

    if (requirements.complexity === 'very-complex' && freelancer.statistics?.completedProjects < 10) {
      score -= 10; // 🔧 PÉNALITÉ RÉDUITE
    }

    return Math.min(Math.max(score, 0), 100);
  }
}

export const aiMatchingService = AIMatchingService.getInstance();
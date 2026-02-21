// types/ai-matching.ts
export interface SkillProfile {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience: number;
  verified: boolean;
  lastUsed: Date;
  projectsCompleted: number;
  successRate: number;
}

export interface WorkStylePreference {
  communication: 'async' | 'sync' | 'mixed';
  availability: 'part-time' | 'full-time' | 'flexible';
  timezone: string;
  responseTime: 'immediate' | 'few-hours' | 'daily';
  projectSize: 'small' | 'medium' | 'large' | 'enterprise';
}

export interface CulturalFit {
  workEthic: number; // 1-10
  communicationStyle: 'direct' | 'diplomatic' | 'detailed' | 'concise';
  feedbackPreference: 'continuous' | 'milestone' | 'end';
  conflictResolution: 'collaborative' | 'compromising' | 'avoiding';
}

export interface AITalentMatch {
  freelancerId: string;
  projectId: string;
  matchScore: number; // 0-100
  matchGrade: 'excellent' | 'good' | 'potential' | 'low'; // 🔧 NOUVEAU CHAMP
  skillGapAnalysis: {
    missing: string[];
    strong: string[];
    learningOpportunities: string[];
  };
  projectSuccessScore: number; // 0-100
  culturalFit: number; // 0-100
  learningPotential: number; // 0-100
  clientSatisfactionPrediction: number; // 0-100
  riskFactors: string[];
  recommendedActions: string[];
  estimatedTimeline: number; // days
  confidence: number; // 0-100
}

export interface ProjectRequirements {
  requiredSkills: string[];
  preferredSkills: string[];
  niceToHave: string[];
  experienceLevel: 'junior' | 'mid' | 'senior' | 'expert';
  budgetRange: { min: number; max: number };
  timeline: number; // days
  complexity: 'simple' | 'moderate' | 'complex' | 'very-complex';
  teamSize: number;
}
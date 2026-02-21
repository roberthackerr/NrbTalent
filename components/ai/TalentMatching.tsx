// components/ai/TalentMatching.tsx
"use client"

import { useAIMatching } from '@/hooks/matching/useAIMatching';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Users, Target, TrendingUp, AlertTriangle, Lightbulb, Clock, DollarSign, MapPin, Star, Briefcase, User } from 'lucide-react';

interface TalentMatchingProps {
  recommendations?: any[];
  loading?: boolean;
  user?: any;
  projectId?: string;
  limit?: number;
  showDetails?: boolean;
}

interface ProjectRecommendation {
  project: {
    _id: string;
    title: string;
    description: string;
    budget: any;
    timeline?: string;
    category?: string;
    skills: string[];
    complexity?: string;
    createdAt: string;
  };
  match: {
    matchScore: number;
    matchGrade: 'excellent' | 'good' | 'potential' | 'low';
    skillGapAnalysis: {
      strong: string[];
      partial: string[];
      missing: string[];
    };
    learningPotential: number;
    culturalFit: number;
    projectSuccessScore: number;
    riskFactors: string[];
    recommendedActions: string[];
  };
  matchType?: string;
}

interface FreelancerMatch {
  freelancerId: string;
  freelancer?: {
    _id: string;
    name: string;
    skills: string[];
    rating?: number;
    completedProjects?: number;
    successRate?: number;
    currentWorkload?: number;
  };
  matchScore: number;
  matchGrade?: 'excellent' | 'good' | 'potential' | 'low';
  skillGapAnalysis: {
    strong: string[];
    partial?: string[];
    missing: string[];
  };
  projectSuccessScore: number;
  culturalFit: number;
  learningPotential: number;
  riskFactors: string[];
  recommendedActions: string[];
}

export function TalentMatching({ 
  recommendations = [], 
  loading = false, 
  user,
  projectId, 
  limit = 15, 
  showDetails = true 
}: TalentMatchingProps) {
  const { 
    matches, 
    recommendations: aiRecommendations, 
    loading: aiLoading, 
    error,
    findProjectMatches,
    getPersonalizedRecommendations,
    hasMatches,
    hasRecommendations
  } = useAIMatching();

  // Use props or hook state
  const currentLoading = loading || aiLoading;
  const currentRecommendations: ProjectRecommendation[] = recommendations.length > 0 ? recommendations : aiRecommendations;
  const currentMatches: FreelancerMatch[] = matches;

  const handleFindMatches = async () => {
    if (projectId) {
      await findProjectMatches(projectId, limit);
    } else {
      await getPersonalizedRecommendations(limit);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'potential': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Safe data access functions for project recommendations
  const getProjectTitle = (rec: ProjectRecommendation): string => {
    return rec?.project?.title || 'Projet sans titre';
  };

  const getProjectDescription = (rec: ProjectRecommendation): string => {
    return rec?.project?.description || 'Aucune description disponible';
  };

  const getProjectBudget = (rec: ProjectRecommendation) => {
    return rec?.project?.budget || { min: 0, max: 0, currency: 'EUR' };
  };

  // Safe data access functions for freelancer matches
  const getFreelancerName = (match: FreelancerMatch): string => {
    return match?.freelancer?.name || 'Freelancer';
  };

  const getFreelancerRating = (match: FreelancerMatch): number => {
    return match?.freelancer?.rating || 0;
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Erreur: {error}</p>
            <Button 
              onClick={handleFindMatches} 
              variant="outline" 
              className="mt-4"
            >
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            AI Talent Matching
          </CardTitle>
          <CardDescription>
            {projectId 
              ? "Trouvez les freelancers parfaits pour votre projet" 
              : "Découvrez les projets qui correspondent à vos compétences"
            }
            {user && (
              <span className="block text-sm mt-1">
                Connecté en tant que: {user.name || user.email} • Rôle: {user.role}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleFindMatches}
            disabled={currentLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {currentLoading ? (
              <>🔄 Analyse IA en cours...</>
            ) : (
              <>🎯 {projectId ? 'Trouver des Talents' : 'Trouver des Projets Recommandés'}</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Project Recommendations (for freelancers) */}
      {currentRecommendations.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Projets Recommandés ({currentRecommendations.length})
            </h3>
            <Badge variant="outline" className="text-xs">
              ai-freelancer-optimized-v3
            </Badge>
          </div>
          
          {currentRecommendations.map((recommendation, index) => {
            const projectTitle = getProjectTitle(recommendation);
            const projectDescription = getProjectDescription(recommendation);
            const projectBudget = getProjectBudget(recommendation);
            
            return (
              <Card key={recommendation.project?._id || index} className="relative border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg">{projectTitle}</CardTitle>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant={getScoreVariant(recommendation.match.matchScore)} className="text-sm">
                            {recommendation.match.matchScore?.toFixed(0) || '0'}% match
                          </Badge>
                          <Badge variant="outline" className={getGradeColor(recommendation.match.matchGrade)}>
                            {recommendation.match.matchGrade || 'potential'}
                          </Badge>
                        </div>
                      </div>
                      
                      <CardDescription className="line-clamp-2 mb-3">
                        {projectDescription}
                      </CardDescription>

                      {/* Project Metadata */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>
                            {formatCurrency(projectBudget.min)} - {formatCurrency(projectBudget.max)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{recommendation.project?.timeline || 'Flexible'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          <span>{recommendation.project?.complexity || 'Modéré'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                {showDetails && (
                  <CardContent className="space-y-6 pt-4">
                    {/* Match Analysis */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Skill Match Analysis */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-green-600" />
                          Analyse des Compétences
                        </h4>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-green-600">Points forts:</span>
                              <span className="text-xs text-muted-foreground">
                                {(recommendation.match.skillGapAnalysis?.strong?.length || 0)} compétences
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {recommendation.match.skillGapAnalysis?.strong?.slice(0, 4).map((skill: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-yellow-600">Compétences partielles:</span>
                              <span className="text-xs text-muted-foreground">
                                {(recommendation.match.skillGapAnalysis?.partial?.length || 0)} compétences
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {recommendation.match.skillGapAnalysis?.partial?.slice(0, 3).map((skill: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Score Breakdown */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          Analyse de Match
                        </h4>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">Potentiel d'apprentissage:</span>
                              <span className="text-sm font-medium">{recommendation.match.learningPotential || 0}%</span>
                            </div>
                            <Progress value={recommendation.match.learningPotential || 0} />
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">Fit culturel:</span>
                              <span className="text-sm font-medium">{recommendation.match.culturalFit || 0}%</span>
                            </div>
                            <Progress value={recommendation.match.culturalFit || 0} />
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">Réussite projet:</span>
                              <span className="text-sm font-medium">{recommendation.match.projectSuccessScore || 0}%</span>
                            </div>
                            <Progress value={recommendation.match.projectSuccessScore || 0} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recommendations and Risks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Recommendations */}
                      {(recommendation.match.recommendedActions?.length > 0) && (
                        <div>
                          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <Target className="h-4 w-4 text-blue-600" />
                            Recommandations
                          </h4>
                          <ul className="text-sm space-y-2">
                            {recommendation.match.recommendedActions.slice(0, 3).map((action: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Risk Factors */}
                      {(recommendation.match.riskFactors?.length > 0) && (
                        <div>
                          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            Facteurs de Risque
                          </h4>
                          <ul className="text-sm space-y-2">
                            {recommendation.match.riskFactors.slice(0, 2).map((risk: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-red-600">
                                <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                                <span>{risk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Project Footer */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-xs text-muted-foreground">
                        {recommendation.project?.createdAt && `Publié le ${formatDate(recommendation.project.createdAt)}`}
                      </div>
                      <Button size="sm" variant="outline">
                        Voir le projet
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Freelancer Matches (for clients) */}
      {currentMatches.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Freelancers Recommandés ({currentMatches.length})
            </h3>
            <Badge variant="outline" className="text-xs">
              ai-enhanced-optimized-v3
            </Badge>
          </div>
          
          {currentMatches.map((match, index) => (
            <Card key={match.freelancerId || index} className="relative border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                        {getFreelancerName(match).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{getFreelancerName(match)}</CardTitle>
                        <CardDescription>
                          {match.freelancer?.completedProjects || 0} projets • {getFreelancerRating(match)}/5 ⭐
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant={getScoreVariant(match.matchScore)} className="text-sm">
                      {match.matchScore?.toFixed(0) || '0'}% match
                    </Badge>
                    <Badge variant="outline" className={getGradeColor(match.matchGrade!)}>
                      {match.matchGrade || 'potential'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              {showDetails && (
                <CardContent className="space-y-6 pt-4">
                  {/* Similar detailed analysis for freelancers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm">Compétences Maîtrisées</h4>
                      <div className="flex flex-wrap gap-1">
                        {match.skillGapAnalysis?.strong?.slice(0, 6).map((skill: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm">Scores de Performance</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Réussite projet:</span>
                            <span className="text-sm font-medium">{match.projectSuccessScore || 0}%</span>
                          </div>
                          <Progress value={match.projectSuccessScore || 0} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Fit culturel:</span>
                            <span className="text-sm font-medium">{match.culturalFit || 0}%</span>
                          </div>
                          <Progress value={match.culturalFit || 0} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button size="sm" className="w-full">
                    <User className="h-4 w-4 mr-2" />
                    Contacter le freelancer
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!currentLoading && currentRecommendations.length === 0 && currentMatches.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-purple-200" />
              <h3 className="text-lg font-semibold mb-2">Découvrez vos recommandations IA</h3>
              <p className="mb-4">
                Notre algorithme analysera vos compétences, expérience et préférences 
                pour vous recommander les {projectId ? 'meilleurs freelancers' : 'projets les plus adaptés'}.
              </p>
              <Button onClick={handleFindMatches} className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Sparkles className="h-4 w-4 mr-2" />
                Lancer l'analyse IA
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
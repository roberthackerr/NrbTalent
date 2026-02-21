// components/ai/TalentMatching.tsx
"use client"

import { useAIMatching } from '@/hooks/useAIMatching';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Users, Target, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';

interface TalentMatchingProps {
  recommendations?: any[];
  loading?: boolean;
  user?: any;
  projectId?: string;
  limit?: number;
  showDetails?: boolean;
}

export function TalentMatching({ 
  recommendations = [], 
  loading = false, 
  user,
  projectId, 
  limit = 10, 
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
  const currentRecommendations = recommendations.length > 0 ? recommendations : aiRecommendations;

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

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Erreur: {error}</p>
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
            AI Talent Matching 2.0
          </CardTitle>
          <CardDescription>
            {projectId 
              ? "Trouvez les freelancers parfaits pour votre projet" 
              : "Découvrez les projets qui correspondent à vos compétences"
            }
            {user && (
              <span className="block text-sm mt-1">
                Connecté en tant que: {user.name || user.email}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleFindMatches}
            disabled={currentLoading}
            className="w-full"
          >
            {currentLoading ? (
              <>🔄 Analyse en cours...</>
            ) : (
              <>🎯 {projectId ? 'Trouver des Talents' : 'Trouver des Projets'}</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {hasMatches && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Meilleurs correspondances ({matches.length})
          </h3>
          
          {matches.map((match, index) => (
            <Card key={match.freelancerId} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Correspondance #{index + 1}
                    </CardTitle>
                    <CardDescription>
                      Score global: {match.matchScore.toFixed(1)}%
                    </CardDescription>
                  </div>
                  <Badge variant={getScoreVariant(match.matchScore)}>
                    {match.matchScore.toFixed(0)}%
                  </Badge>
                </div>
              </CardHeader>
              
              {showDetails && (
                <CardContent className="space-y-4">
                  {/* Score Breakdown */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Compétences</span>
                        <span className={getScoreColor(match.skillGapAnalysis.strong.length * 20)}>
                          {match.skillGapAnalysis.strong.length * 20}%
                        </span>
                      </div>
                      <Progress value={match.skillGapAnalysis.strong.length * 20} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Réussite projet</span>
                        <span className={getScoreColor(match.projectSuccessScore)}>
                          {match.projectSuccessScore.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={match.projectSuccessScore} />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Fit culturel</span>
                        <span className={getScoreColor(match.culturalFit)}>
                          {match.culturalFit.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={match.culturalFit} />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Potentiel d'apprentissage</span>
                        <span className={getScoreColor(match.learningPotential)}>
                          {match.learningPotential.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={match.learningPotential} />
                    </div>
                  </div>

                  {/* Skill Analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-green-600 flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        Points forts
                      </h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {match.skillGapAnalysis.strong.slice(0, 3).map((skill, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-yellow-600 flex items-center gap-1">
                        <Lightbulb className="h-4 w-4" />
                        Opportunités
                      </h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {match.skillGapAnalysis.learningOpportunities.slice(0, 3).map((skill, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        Risques
                      </h4>
                      <div className="space-y-1 mt-1">
                        {match.riskFactors.slice(0, 2).map((risk, i) => (
                          <p key={i} className="text-xs text-red-600">{risk}</p>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {match.recommendedActions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Recommandations</h4>
                      <ul className="text-sm space-y-1">
                        {match.recommendedActions.slice(0, 2).map((action, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Target className="h-3 w-3 mt-0.5 text-blue-600 flex-shrink-0" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Recommendations from props or API */}
      {(currentRecommendations.length > 0 || hasRecommendations) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recommandations personnalisées</h3>
          {(currentRecommendations.length > 0 ? currentRecommendations : aiRecommendations).map((rec, index) => (
            <Card key={rec.project?._id || index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{rec.project?.title || 'Projet recommandé'}</CardTitle>
                    <CardDescription>
                      {rec.project?.budgetRange ? (
                        `Budget: ${rec.project.budgetRange.min} - ${rec.project.budgetRange.max}€`
                      ) : (
                        'Projet correspondant à vos compétences'
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant={getScoreVariant(rec.match?.matchScore || 70)}>
                    {(rec.match?.matchScore || 70).toFixed(0)}% match
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {!currentLoading && !hasMatches && currentRecommendations.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Sparkles className="h-8 w-8 mx-auto mb-2" />
              <p>Cliquez pour découvrir des correspondances IA</p>
              <p className="text-sm mt-1">
                Notre algorithme analysera vos compétences et préférences
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
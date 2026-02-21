// hooks/useAIMatching.ts
import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface AIMatch {
  freelancerId: string;
  projectId: string;
  matchScore: number;
  skillGapAnalysis: {
    missing: string[];
    strong: string[];
    learningOpportunities: string[];
  };
  projectSuccessScore: number;
  culturalFit: number;
  learningPotential: number;
  clientSatisfactionPrediction: number;
  riskFactors: string[];
  recommendedActions: string[];
  estimatedTimeline: number;
  confidence: number;
}

export interface ProjectRecommendation {
  project: {
    _id: string;
    title: string;
    description: string;
    budgetRange: { min: number; max: number };
    timeline: number;
    category: string;
  };
  match: AIMatch;
}

export function useAIMatching() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<AIMatch[]>([]);
  const [recommendations, setRecommendations] = useState<ProjectRecommendation[]>([]);
  const { data: session } = useSession();

  const findProjectMatches = useCallback(async (projectId: string, limit: number = 10) => {
    if (!session) {
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ai/matching?projectId=${projectId}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }

      const data = await response.json();
      
      if (data.success) {
        setMatches(data.matches);
        return data.matches;
      } else {
        throw new Error(data.error || 'Failed to get matches');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('AI Matching error:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  const getPersonalizedRecommendations = useCallback(async (limit: number = 10) => {
    if (!session) {
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ai/matching?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.recommendations);
        return data.recommendations;
      } else {
        throw new Error(data.error || 'Failed to get recommendations');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('AI Recommendations error:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  const refreshMatches = useCallback(() => {
    setMatches([]);
    setRecommendations([]);
  }, []);

  return {
    // State
    matches,
    recommendations,
    loading,
    error,
    
    // Actions
    findProjectMatches,
    getPersonalizedRecommendations,
    refreshMatches,
    
    // Derived state
    hasMatches: matches.length > 0,
    hasRecommendations: recommendations.length > 0,
    topMatch: matches[0],
    topRecommendation: recommendations[0]
  };
}
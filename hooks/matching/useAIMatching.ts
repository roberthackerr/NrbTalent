// hooks/useAIMatching.ts
"use client"

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export function useAIMatching() {
  const { data: session } = useSession();
  const [matches, setMatches] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPersonalizedRecommendations = useCallback(async (limit: number = 15) => {
    if (!session?.user?.id) {
      setError('Utilisateur non connecté');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ✅ CORRECTION: Appeler la bonne API pour les freelancers
      const response = await fetch(`/api/ai/matching?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // ✅ CORRECTION: Votre API retourne des recommendations avec structure différente
        setRecommendations(data.recommendations || []);
        setMatches(data.matches || []);
      } else {
        throw new Error(data.error || 'Erreur lors de la récupération des recommandations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      console.error('AI Matching error:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  const findProjectMatches = useCallback(async (projectId: string, limit: number = 10) => {
    setLoading(true);
    setError(null);
    
    try {
      // ✅ CORRECTION: Appeler l'API avec projectId
      const response = await fetch(`/api/ai/matching?projectId=${projectId}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setMatches(data.matches || []);
        setRecommendations([]);
      } else {
        throw new Error(data.error || 'Erreur lors de la recherche de matches');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, []);

  const hasMatches = matches.length > 0;
  const hasRecommendations = recommendations.length > 0;

  return {
    matches,
    recommendations,
    loading,
    error,
    findProjectMatches,
    getPersonalizedRecommendations,
    hasMatches,
    hasRecommendations,
  };
}
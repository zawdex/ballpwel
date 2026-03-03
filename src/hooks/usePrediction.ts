import { useQuery } from '@tanstack/react-query';

export interface MatchPrediction {
  winner: 'home' | 'away' | 'draw';
  confidence: number;
  predicted_score: string;
  tips: {
    tip: string;
    confidence: 'high' | 'medium' | 'low';
    description: string;
  }[];
  analysis: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const usePrediction = (
  home_name: string,
  away_name: string,
  competition: string,
  score: string,
  time: string,
  enabled = true
) => {
  return useQuery<MatchPrediction>({
    queryKey: ['prediction', home_name, away_name],
    queryFn: async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/match-prediction`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ home_name, away_name, competition, score, time }),
      });

      if (!response.ok) {
        throw new Error('Failed to get prediction');
      }

      return response.json();
    },
    enabled: enabled && !!home_name && !!away_name,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: 1,
  });
};

import { Match } from '@/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const footballAPI = {
  getMatches: async (): Promise<Match[]> => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/matches-proxy`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      const data = await response.json();
      
      // Add unique IDs to matches if not present
      return (data || []).map((match: Match, index: number) => ({
        ...match,
        id: `match-${index}`,
      }));
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
};

import { Match } from '@/types';

const API_BASE = 'https://yalatt.playstoreapp.sbs/api';

export const footballAPI = {
  getMatches: async (): Promise<Match[]> => {
    try {
      const response = await fetch(`${API_BASE}/matches.php`);
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      const data = await response.json();
      
      // Add unique IDs to matches if not present
      return (data || []).map((match: Match, index: number) => ({
        ...match,
        id: match.view_url || `match-${index}`,
      }));
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
};

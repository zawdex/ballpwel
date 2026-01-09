import { useQuery } from '@tanstack/react-query';
import { footballAPI } from '@/services/api';
import { Match, MatchStatus, MatchFilters } from '@/types';

export const getMatchStatus = (score: string, time: string): MatchStatus => {
  const scoreTrimmed = score?.trim() || '';
  const timeLower = time?.toLowerCase() || '';
  
  // "vs" or empty/dash means upcoming
  if (!scoreTrimmed || scoreTrimmed === '-' || scoreTrimmed.toLowerCase() === 'vs') {
    return 'upcoming';
  }
  
  // Check if match is live - time contains live indicators
  if (timeLower.includes('live') || timeLower.includes("'") || timeLower.includes('ht') || timeLower.includes('half')) {
    return 'live';
  }
  
  // Score pattern like "0-1", "2-3", "0 - 1", "2 - 3" etc. means finished
  const scorePattern = /^\d+\s*-\s*\d+$/;
  if (scorePattern.test(scoreTrimmed)) {
    return 'finished';
  }
  
  return 'upcoming';
};

export const useMatches = (filters?: Partial<MatchFilters>) => {
  return useQuery({
    queryKey: ['matches'],
    queryFn: footballAPI.getMatches,
    refetchInterval: 60 * 1000, // Auto-refresh every 60 seconds
    select: (data: Match[]) => {
      let filtered = [...data];
      
      if (filters?.status && filters.status !== 'all') {
        filtered = filtered.filter(
          (match) => getMatchStatus(match.score, match.time) === filters.status
        );
      }
      
      if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filtered = filtered.filter(
          (match) =>
            match.home_name.toLowerCase().includes(query) ||
            match.away_name.toLowerCase().includes(query) ||
            match.label.toLowerCase().includes(query)
        );
      }
      
      if (filters?.competition && filters.competition !== 'all') {
        filtered = filtered.filter(
          (match) => match.label === filters.competition
        );
      }
      
      return filtered;
    },
  });
};

export const useMatch = (matchId: string | undefined) => {
  const { data: matches } = useMatches();
  
  return matches?.find((match) => match.id === matchId);
};

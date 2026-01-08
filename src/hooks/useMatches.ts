import { useQuery } from '@tanstack/react-query';
import { footballAPI } from '@/services/api';
import { Match, MatchStatus, MatchFilters } from '@/types';

export const getMatchStatus = (score: string, time: string): MatchStatus => {
  if (!score || score === '-' || score === 'vs') {
    return 'upcoming';
  }
  
  // Check if match contains live indicators
  const timeLower = time.toLowerCase();
  if (timeLower.includes('live') || timeLower.includes("'") || timeLower.includes('ht')) {
    return 'live';
  }
  
  // Check if score exists and match is finished
  const scorePattern = /^\d+-\d+$/;
  if (scorePattern.test(score.trim())) {
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

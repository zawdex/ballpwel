import { useQuery } from '@tanstack/react-query';
import { footballAPI } from '@/services/api';
import { Match, MatchStatus, MatchFilters } from '@/types';

export const getMatchStatus = (score: string, time: string): MatchStatus => {
  // Check for explicit live indicators first
  const timeLower = time.toLowerCase().trim();
  if (timeLower.includes('live') || timeLower.includes("'") || timeLower.includes('ht') || timeLower.includes('half')) {
    return 'live';
  }

  // Parse match time in format "HH:MM DD/MM/YYYY"
  const timeMatch = time.trim().match(/^(\d{1,2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (timeMatch) {
    const [, hours, minutes, day, month, year] = timeMatch;
    const matchDate = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    );
    const now = new Date();
    const diffMs = now.getTime() - matchDate.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    // Match hasn't started yet
    if (diffMinutes < 0) {
      return 'upcoming';
    }

    // Match is within ~120 minutes of start time (normal match duration)
    if (diffMinutes >= 0 && diffMinutes <= 120) {
      return 'live';
    }

    // Match ended (more than 120 minutes since start)
    return 'finished';
  }

  // Fallback: if there's a score with numbers, consider it based on whether score exists
  if (!score || score === '-' || score === 'vs') {
    return 'upcoming';
  }

  return 'finished';
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

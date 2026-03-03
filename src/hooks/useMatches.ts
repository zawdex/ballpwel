import { useQuery } from '@tanstack/react-query';
import { footballAPI } from '@/services/api';
import { Match, MatchStatus, MatchFilters } from '@/types';

export const getMatchStatus = (score: string, time: string): MatchStatus => {
  // Check for explicit live indicators first
  const timeLower = time.toLowerCase().trim();
  if (timeLower.includes('live') || timeLower.includes("'") || timeLower.includes('ht') || timeLower.includes('half')) {
    return 'live';
  }

  // Check if there's a real score (e.g. "2 - 0", "1 - 1") vs placeholder "vs"
  const hasRealScore = score && score !== 'vs' && score !== '-' && /\d+\s*-\s*\d+/.test(score);

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

    // If there's a real score, the match is either live or finished
    if (hasRealScore) {
      // If more than 150 minutes since start, it's finished
      if (diffMinutes > 150) {
        return 'finished';
      }
      // Otherwise it's live (score exists = match has started)
      return 'live';
    }

    // No real score - use time-based logic
    if (diffMinutes < 0) {
      return 'upcoming';
    }
    if (diffMinutes >= 0 && diffMinutes <= 120) {
      return 'live';
    }
    return 'finished';
  }

  // Fallback: if there's a real score, it's live; otherwise upcoming
  if (hasRealScore) {
    return 'live';
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

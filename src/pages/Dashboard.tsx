import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { footballAPI } from '@/services/api';
import { Match, MatchFilters } from '@/types';
import { getMatchStatus } from '@/hooks/useMatches';
import MatchList from '@/components/matches/MatchList';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardProps {
  filters: MatchFilters;
  onFilterChange: (filters: Partial<MatchFilters>) => void;
}

// Popular leagues keywords to match against labels
const POPULAR_LEAGUES = [
  { key: 'all', label: 'All' },
  { key: 'premier', label: 'EPL' },
  { key: 'spanish|la liga', label: 'La Liga' },
  { key: 'german|bundesliga', label: 'Bundesliga' },
  { key: 'italian|serie a', label: 'Serie A' },
  { key: 'french|ligue 1', label: 'Ligue 1' },
  { key: 'champion', label: 'UCL' },
  { key: 'europa', label: 'Europa' },
  { key: 'asian elite|afc', label: 'AFC' },
  { key: 'argentin', label: 'Argentina' },
  { key: 'mexican', label: 'Mexico' },
  { key: 'indonesian', label: 'Indonesia' },
  { key: 'australian', label: 'Australia' },
];

const matchesLeague = (label: string, key: string): boolean => {
  if (key === 'all') return true;
  return key.split('|').some(k => label.toLowerCase().includes(k));
};

const Dashboard = ({ filters, onFilterChange }: DashboardProps) => {
  const [activeLeague, setActiveLeague] = useState('all');

  const { data: allMatches, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['matches'],
    queryFn: footballAPI.getMatches,
    refetchInterval: 60 * 1000,
  });

  // Filter to popular leagues only, then by active tab
  const filteredMatches = useMemo(() => {
    if (!allMatches) return [];

    // First: only show matches from popular leagues
    let popular = allMatches.filter(match =>
      POPULAR_LEAGUES.some(l => l.key !== 'all' && matchesLeague(match.label, l.key))
    );

    // Then filter by selected league tab
    if (activeLeague !== 'all') {
      popular = popular.filter(match => matchesLeague(match.label, activeLeague));
    }

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      popular = popular.filter(
        match =>
          match.home_name.toLowerCase().includes(query) ||
          match.away_name.toLowerCase().includes(query) ||
          match.label.toLowerCase().includes(query)
      );
    }

    // Sort: live first, then upcoming, then finished
    return popular.sort((a, b) => {
      const order = { live: 0, upcoming: 1, finished: 2 };
      const sa = order[getMatchStatus(a.score, a.time)] ?? 2;
      const sb = order[getMatchStatus(b.score, b.time)] ?? 2;
      return sa - sb;
    });
  }, [allMatches, activeLeague, filters.searchQuery]);

  // Count available leagues for tabs
  const availableLeagues = useMemo(() => {
    if (!allMatches) return POPULAR_LEAGUES.slice(0, 1);
    return POPULAR_LEAGUES.filter(league => {
      if (league.key === 'all') return true;
      return allMatches.some(match => matchesLeague(match.label, league.key));
    });
  }, [allMatches]);

  const liveCount = useMemo(() => {
    return filteredMatches.filter(m => getMatchStatus(m.score, m.time) === 'live').length;
  }, [filteredMatches]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-2xl md:text-3xl font-bold animate-slide-up">
            <span className="text-gradient inline-block animate-[gradient-shift_3s_ease_infinite] bg-[length:200%_200%]">
              Live Arena
            </span>
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-xl h-9 w-9 text-muted-foreground animate-fade-in"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-muted-foreground text-sm animate-slide-up [animation-delay:100ms] [animation-fill-mode:backwards]">
          Watch the current fixtures and kickoff flow.
          {liveCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1.5 text-xs font-bold text-destructive animate-scale-in [animation-delay:300ms] [animation-fill-mode:backwards]">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-count-pulse" />
              {liveCount} LIVE
            </span>
          )}
        </p>
      </div>

      {/* League Tabs - horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {availableLeagues.map(league => (
          <button
            key={league.key}
            onClick={() => setActiveLeague(league.key)}
            className={`league-tab ${activeLeague === league.key ? 'active' : ''}`}
          >
            {league.label}
          </button>
        ))}
      </div>

      {/* Match List */}
      <MatchList
        matches={filteredMatches}
        isLoading={isLoading}
        error={error as Error}
      />
    </div>
  );
};

export default Dashboard;

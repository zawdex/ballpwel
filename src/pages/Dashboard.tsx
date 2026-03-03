import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { footballAPI } from '@/services/api';
import { MatchFilters } from '@/types';
import { getMatchStatus } from '@/hooks/useMatches';
import MatchList from '@/components/matches/MatchList';
import MatchFiltersComponent from '@/components/matches/MatchFilters';
import { RefreshCw, Zap, Trophy, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardProps {
  filters: MatchFilters;
  onFilterChange: (filters: Partial<MatchFilters>) => void;
}

const Dashboard = ({ filters, onFilterChange }: DashboardProps) => {
  const { data: allMatches, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['matches'],
    queryFn: footballAPI.getMatches,
    refetchInterval: 60 * 1000,
  });

  const filteredMatches = useMemo(() => {
    if (!allMatches) return [];
    let filtered = [...allMatches];
    if (filters.status !== 'all') {
      filtered = filtered.filter(
        (match) => getMatchStatus(match.score, match.time) === filters.status
      );
    }
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (match) =>
          match.home_name.toLowerCase().includes(query) ||
          match.away_name.toLowerCase().includes(query) ||
          match.label.toLowerCase().includes(query)
      );
    }
    if (filters.competition !== 'all') {
      filtered = filtered.filter(
        (match) => match.label === filters.competition
      );
    }
    return filtered;
  }, [allMatches, filters]);

  const competitions = useMemo(() => {
    if (!allMatches) return [];
    return [...new Set(allMatches.map((match) => match.label))];
  }, [allMatches]);

  const liveCount = useMemo(() => {
    if (!allMatches) return 0;
    return allMatches.filter((match) => getMatchStatus(match.score, match.time) === 'live').length;
  }, [allMatches]);

  const upcomingCount = useMemo(() => {
    if (!allMatches) return 0;
    return allMatches.filter((match) => getMatchStatus(match.score, match.time) === 'upcoming').length;
  }, [allMatches]);

  const streamCount = useMemo(() => {
    if (!allMatches) return 0;
    return allMatches.filter((match) => match.authors && match.authors.length > 0).length;
  }, [allMatches]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl hero-gradient p-8 md:p-10 border border-border/50">
        {/* Animated orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/8 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-live/6 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4">
                <Trophy className="w-3.5 h-3.5" />
                LIVE FOOTBALL
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-3 tracking-tight">
                <span className="text-gradient">Live</span> Football Streams
              </h1>
              <p className="text-muted-foreground text-base max-w-md">
                Watch live matches from leagues around the world with real-time AI predictions
              </p>
            </div>

            {/* Stats pills */}
            <div className="flex flex-wrap items-center gap-3 animate-slide-up" style={{ animationDelay: '0.15s' }}>
              {liveCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-live/10 border border-live/30 animate-count-pulse">
                  <Zap className="w-4 h-4 text-live" />
                  <span className="text-sm font-bold text-live">{liveCount}</span>
                  <span className="text-xs text-live/80">LIVE</span>
                </div>
              )}
              {upcomingCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-upcoming/10 border border-upcoming/30">
                  <span className="text-sm font-bold text-upcoming">{upcomingCount}</span>
                  <span className="text-xs text-upcoming/80">Upcoming</span>
                </div>
              )}
              {streamCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary/10 border border-primary/30">
                  <Radio className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-primary">{streamCount}</span>
                  <span className="text-xs text-primary/80">Streams</span>
                </div>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
                className="border-border/50 hover:border-primary rounded-xl h-10 w-10 transition-all duration-300"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <MatchFiltersComponent
          filters={filters}
          onFilterChange={onFilterChange}
          competitions={competitions}
        />
      </div>

      {/* Results count */}
      {!isLoading && filteredMatches && (
        <div className="flex items-center gap-2 animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredMatches.length}</span> match{filteredMatches.length !== 1 ? 'es' : ''}
          </p>
        </div>
      )}

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

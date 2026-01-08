import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { footballAPI } from '@/services/api';
import { MatchFilters } from '@/types';
import { getMatchStatus } from '@/hooks/useMatches';
import MatchList from '@/components/matches/MatchList';
import MatchFiltersComponent from '@/components/matches/MatchFilters';
import { RefreshCw, Zap } from 'lucide-react';
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary via-card to-secondary p-6 md:p-8 border border-border">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
                Live Football Streams
              </h1>
              <p className="text-muted-foreground">
                Watch live matches from leagues around the world
              </p>
            </div>
            <div className="flex items-center gap-3">
              {liveCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-live/20 border border-live/30">
                  <Zap className="w-4 h-4 text-live animate-pulse" />
                  <span className="text-sm font-bold text-live">{liveCount} LIVE NOW</span>
                </div>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
                className="border-border hover:border-primary"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Filters */}
      <MatchFiltersComponent
        filters={filters}
        onFilterChange={onFilterChange}
        competitions={competitions}
      />

      {/* Results count */}
      {!isLoading && filteredMatches && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredMatches.length} match{filteredMatches.length !== 1 ? 'es' : ''}
        </p>
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

import { Match } from '@/types';
import MatchCard from './MatchCard';
import LoadingSkeleton from '../ui/LoadingSkeleton';

interface MatchListProps {
  matches: Match[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

const MatchList = ({ matches, isLoading, error }: MatchListProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <LoadingSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-destructive/10 border border-destructive/20 mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">Failed to load matches</h3>
        <p className="text-muted-foreground text-sm">Please try again later</p>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-muted border border-border/50 mb-4">
          <span className="text-3xl">⚽</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">No matches found</h3>
        <p className="text-muted-foreground text-sm">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
};

export default MatchList;

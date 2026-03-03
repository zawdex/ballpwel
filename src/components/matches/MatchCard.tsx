import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Play, Radio } from 'lucide-react';
import { Match } from '@/types';
import { getMatchStatus } from '@/hooks/useMatches';
import { usePrediction } from '@/hooks/usePrediction';
import StatusBadge from './StatusBadge';
import PredictionBadge from '@/components/predictions/PredictionBadge';
import { Button } from '@/components/ui/button';

interface MatchCardProps {
  match: Match;
}

const MatchCard = memo(({ match }: MatchCardProps) => {
  const status = getMatchStatus(match.score, match.time);
  const hasStreams = match.authors && match.authors.length > 0;
  const encodedId = encodeURIComponent(match.id);
  const { data: prediction, isLoading: predLoading } = usePrediction(
    match.home_name, match.away_name, match.label, match.score, match.time
  );

  return (
    <Link to={`/matches/${encodedId}`} className="block">
      <div className="match-card group">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            {hasStreams && (
              <span className="stream-badge">
                <Radio className="w-3 h-3" />
                {match.authors.length} streams
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <PredictionBadge prediction={prediction} isLoading={predLoading} homeName={match.home_name} awayName={match.away_name} />
            <span className="text-xs text-muted-foreground font-medium">
              {match.time}
            </span>
          </div>
        </div>

        {/* Competition Label */}
        <p className="text-xs text-primary font-medium mb-4 truncate">
          {match.label}
        </p>

        {/* Teams */}
        <div className="flex items-center justify-between gap-4">
          {/* Home Team */}
          <div className="flex-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
              {match.home_logo ? (
                <img
                  src={match.home_logo}
                  alt={match.home_name}
                  className="w-8 h-8 object-contain"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-xs font-bold text-muted-foreground">
                  {match.home_name.charAt(0)}
                </span>
              )}
            </div>
            <span className="text-sm font-semibold truncate">
              {match.home_name}
            </span>
          </div>

          {/* Score */}
          <div className="flex-shrink-0 text-center">
            <div className={`font-display text-2xl font-bold ${status === 'live' ? 'text-live' : ''}`}>
              {match.score || 'vs'}
            </div>
          </div>

          {/* Away Team */}
          <div className="flex-1 flex items-center gap-3 justify-end">
            <span className="text-sm font-semibold truncate text-right">
              {match.away_name}
            </span>
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
              {match.away_logo ? (
                <img
                  src={match.away_logo}
                  alt={match.away_name}
                  className="w-8 h-8 object-contain"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-xs font-bold text-muted-foreground">
                  {match.away_name.charAt(0)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Watch Button */}
        {hasStreams && (
          <Button
            className="w-full mt-4 gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/30 transition-all"
            variant="ghost"
          >
            <Play className="w-4 h-4" />
            Watch Now
          </Button>
        )}
      </div>
    </Link>
  );
});

MatchCard.displayName = 'MatchCard';

export default MatchCard;

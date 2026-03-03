import { memo, useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Radio, ArrowRight } from 'lucide-react';
import { Match, MatchStatus } from '@/types';
import { getMatchStatus } from '@/hooks/useMatches';
import { usePrediction } from '@/hooks/usePrediction';
import StatusBadge from './StatusBadge';
import PredictionBadge from '@/components/predictions/PredictionBadge';
import CountdownTimer from './CountdownTimer';
import ElapsedTime from './ElapsedTime';

interface MatchCardProps {
  match: Match;
}

const MatchCard = memo(({ match }: MatchCardProps) => {
  const status = getMatchStatus(match.score, match.time);
  const prevStatusRef = useRef<MatchStatus>(status);
  const [justWentLive, setJustWentLive] = useState(false);

  useEffect(() => {
    if (prevStatusRef.current === 'upcoming' && status === 'live') {
      setJustWentLive(true);
      const timer = setTimeout(() => setJustWentLive(false), 3000);
      return () => clearTimeout(timer);
    }
    prevStatusRef.current = status;
  }, [status]);

  const hasStreams = match.authors && match.authors.length > 0;
  const encodedId = encodeURIComponent(match.id);
  const { data: prediction, isLoading: predLoading } = usePrediction(
    match.home_name, match.away_name, match.label, match.score, match.time
  );

  return (
    <Link to={`/matches/${encodedId}`} className="block group">
      <div className={`match-card transition-all duration-500 ${justWentLive ? 'animate-scale-in ring-2 ring-live ring-offset-2 ring-offset-background' : ''} ${status === 'live' ? 'border-live/30' : ''}`}>
        {/* Live glow effect */}
        {status === 'live' && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-live/5 to-transparent pointer-events-none" />
        )}

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <StatusBadge status={status} />
              {hasStreams && (
                <span className="stream-badge">
                  <Radio className="w-3 h-3" />
                  {match.authors.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <PredictionBadge prediction={prediction} isLoading={predLoading} homeName={match.home_name} awayName={match.away_name} />
              {status === 'live' ? (
                <ElapsedTime time={match.time} />
              ) : (
                <span className="text-xs text-muted-foreground font-medium">
                  {match.time}
                </span>
              )}
            </div>
          </div>

          {/* Competition */}
          <p className="text-[11px] text-primary/80 font-semibold mb-5 truncate uppercase tracking-wider">
            {match.label}
          </p>

          {/* Teams & Score */}
          <div className="flex items-center gap-3">
            {/* Home */}
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-secondary/80 flex items-center justify-center overflow-hidden flex-shrink-0 border border-border/50 transition-transform duration-300 group-hover:scale-110">
                {match.home_logo ? (
                  <img
                    src={match.home_logo}
                    alt={match.home_name}
                    className="w-8 h-8 object-contain"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">{match.home_name.charAt(0)}</span>
                )}
              </div>
              <span className="text-sm font-semibold truncate">{match.home_name}</span>
            </div>

            {/* Score */}
            <div className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-secondary/60 border border-border/50">
              {(() => {
                const scoreParts = match.score?.trim().match(/^(\d+)\s*-\s*(\d+)$/);
                if (scoreParts) {
                  return (
                    <div className={`font-display text-xl font-bold tracking-wider flex items-center gap-2 ${status === 'live' ? 'text-live' : 'text-foreground'}`}>
                      <span>{scoreParts[2]}</span>
                      <span className="text-muted-foreground text-sm">-</span>
                      <span>{scoreParts[1]}</span>
                    </div>
                  );
                }
                return (
                  <div className={`font-display text-xl font-bold tracking-wider ${status === 'live' ? 'text-live' : 'text-foreground'}`}>
                    vs
                  </div>
                );
              })()}
            </div>

            {/* Away */}
            <div className="flex-1 flex items-center gap-3 justify-end min-w-0">
              <span className="text-sm font-semibold truncate text-right">{match.away_name}</span>
              <div className="w-11 h-11 rounded-xl bg-secondary/80 flex items-center justify-center overflow-hidden flex-shrink-0 border border-border/50 transition-transform duration-300 group-hover:scale-110">
                {match.away_logo ? (
                  <img
                    src={match.away_logo}
                    alt={match.away_name}
                    className="w-8 h-8 object-contain"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">{match.away_name.charAt(0)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Countdown */}
          {status === 'upcoming' && <CountdownTimer time={match.time} />}

          {/* Action row */}
          {hasStreams && (
            <div className="mt-4 flex items-center justify-between px-4 py-2.5 rounded-xl bg-primary/8 border border-primary/20 transition-all duration-300 group-hover:bg-primary/15 group-hover:border-primary/40">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Watch Now</span>
              </div>
              <ArrowRight className="w-4 h-4 text-primary transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
});

MatchCard.displayName = 'MatchCard';

export default MatchCard;

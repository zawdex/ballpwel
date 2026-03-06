import { memo, useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Radio, ArrowRight, Star, Share2, MessageCircle, Send, Link2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Match, MatchStatus } from '@/types';
import { getMatchStatus } from '@/hooks/useMatches';
import { usePrediction } from '@/hooks/usePrediction';
import StatusBadge from './StatusBadge';
import PredictionBadge from '@/components/predictions/PredictionBadge';
import CountdownTimer from './CountdownTimer';
import ElapsedTime from './ElapsedTime';
import TeamLogo from '@/components/ui/TeamLogo';

interface MatchCardProps {
  match: Match;
  index?: number;
  isFavoriteHome?: boolean;
  isFavoriteAway?: boolean;
  onToggleFavorite?: (teamName: string) => void;
}

const MatchCard = memo(({ match, index = 0, isFavoriteHome, isFavoriteAway, onToggleFavorite }: MatchCardProps) => {
  const status = getMatchStatus(match.score, match.time, match.match_status);
  const prevStatusRef = useRef<MatchStatus>(status);
  const [justWentLive, setJustWentLive] = useState(false);
  const [enablePrediction, setEnablePrediction] = useState(false);

  useEffect(() => {
    if (prevStatusRef.current === 'upcoming' && status === 'live') {
      setJustWentLive(true);
      const timer = setTimeout(() => setJustWentLive(false), 3000);
      return () => clearTimeout(timer);
    }
    prevStatusRef.current = status;
  }, [status]);

  useEffect(() => {
    const timer = setTimeout(() => setEnablePrediction(true), index * 5000);
    return () => clearTimeout(timer);
  }, [index]);

  const hasStreams = match.authors && match.authors.length > 0;
  const encodedId = encodeURIComponent(match.id);

  const { data: prediction, isLoading: predLoading } = usePrediction(
    match.home_name,
    match.away_name,
    match.label || '',
    match.score || '',
    match.time || '',
    enablePrediction
  );

  const scoreParts = match.score?.trim().match(/^(\d+)\s*-\s*(\d+)$/);

  return (
    <Link to={`/matches/${encodedId}`} className="block group">
      <div
        className={`relative rounded-2xl border border-border/50 overflow-hidden transition-all duration-500 hover:border-primary/40 ${
          justWentLive ? 'animate-scale-in ring-2 ring-live ring-offset-2 ring-offset-background' : ''
        } ${status === 'live' ? 'border-live/30' : ''}`}
        style={{ background: 'hsl(var(--card))' }}
      >
        {/* Ambient glow for live */}
        {status === 'live' && (
          <div className="absolute inset-0 bg-gradient-to-br from-live/8 via-transparent to-live/3 pointer-events-none animate-pulse" />
        )}

        {/* Top accent line */}
        <div className={`h-0.5 w-full ${
          status === 'live' ? 'bg-gradient-to-r from-transparent via-live to-transparent' :
          status === 'upcoming' ? 'bg-gradient-to-r from-transparent via-upcoming/60 to-transparent' :
          'bg-gradient-to-r from-transparent via-border to-transparent'
        }`} />

        <div className="relative z-10 p-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <StatusBadge status={status} />
              {hasStreams && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold">
                  <Radio className="w-2.5 h-2.5" />
                  {match.authors.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <PredictionBadge prediction={prediction} isLoading={predLoading} homeName={match.home_name} awayName={match.away_name} />
              {status === 'live' ? (
                <ElapsedTime time={match.time} />
              ) : (
                <span className="text-[11px] text-muted-foreground font-medium tabular-nums">
                  {match.time}
                </span>
              )}
            </div>
          </div>

          {/* Competition label */}
          <p className="text-[10px] text-primary/70 font-bold mb-4 truncate uppercase tracking-[0.15em]">
            {match.label}
          </p>

          {/* Teams vs Score — centered layout */}
          <div className="flex items-center gap-2">
            {/* Home team */}
            <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-secondary/60 flex items-center justify-center overflow-hidden border border-border/40 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/10">
                  <TeamLogo src={match.home_logo} name={match.home_name} size="sm" />
                </div>
                {onToggleFavorite && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(match.home_name); }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-background/90 border border-border/50 flex items-center justify-center transition-all hover:scale-110"
                  >
                    <Star className={`w-3 h-3 ${isFavoriteHome ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                  </button>
                )}
              </div>
              <span className="text-xs font-semibold text-center truncate w-full leading-tight">{match.home_name}</span>
            </div>

            {/* Score / VS */}
            <div className="flex-shrink-0 flex flex-col items-center gap-1">
              {scoreParts ? (
                <div className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl border ${
                  status === 'live'
                    ? 'bg-live/10 border-live/30 shadow-lg shadow-live/10'
                    : 'bg-secondary/50 border-border/40'
                }`}>
                  <span className={`font-display text-2xl font-black tabular-nums ${status === 'live' ? 'text-live' : 'text-foreground'}`}>
                    {scoreParts[1]}
                  </span>
                  <span className="text-muted-foreground text-xs font-bold mx-0.5">:</span>
                  <span className={`font-display text-2xl font-black tabular-nums ${status === 'live' ? 'text-live' : 'text-foreground'}`}>
                    {scoreParts[2]}
                  </span>
                </div>
              ) : (
                <div className="px-4 py-2 rounded-2xl bg-secondary/50 border border-border/40">
                  <span className="font-display text-lg font-bold text-muted-foreground">VS</span>
                </div>
              )}
            </div>

            {/* Away team */}
            <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-secondary/60 flex items-center justify-center overflow-hidden border border-border/40 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/10">
                  <TeamLogo src={match.away_logo} name={match.away_name} size="sm" />
                </div>
                {onToggleFavorite && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(match.away_name); }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-background/90 border border-border/50 flex items-center justify-center transition-all hover:scale-110"
                  >
                    <Star className={`w-3 h-3 ${isFavoriteAway ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                  </button>
                )}
              </div>
              <span className="text-xs font-semibold text-center truncate w-full leading-tight">{match.away_name}</span>
            </div>
          </div>

          {/* Countdown */}
          {status === 'upcoming' && <div className="mt-3"><CountdownTimer timestamp={match.match_timestamp} /></div>}

          {/* Action row */}
          {hasStreams && (
            <div className="mt-4 flex items-center justify-between px-3 py-2 rounded-xl bg-primary/8 border border-primary/15 transition-all duration-300 group-hover:bg-primary/15 group-hover:border-primary/30 group-hover:shadow-md group-hover:shadow-primary/5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Play className="w-3 h-3 text-primary fill-primary" />
                </div>
                <span className="text-xs font-bold text-primary">Watch Now</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-primary transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          )}
        </div>

        {/* Hover shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>
    </Link>
  );
});

MatchCard.displayName = 'MatchCard';

export default MatchCard;

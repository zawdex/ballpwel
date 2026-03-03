import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, Trophy } from 'lucide-react';
import { footballAPI } from '@/services/api';
import { Author, Match } from '@/types';
import { getMatchStatus } from '@/hooks/useMatches';
import { usePrediction } from '@/hooks/usePrediction';
import StatusBadge from '@/components/matches/StatusBadge';
import VideoPlayer from '@/components/streaming/VideoPlayer';
import StreamSelector from '@/components/streaming/StreamSelector';
import PredictionPanel from '@/components/predictions/PredictionPanel';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const MatchDetail = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const [selectedStream, setSelectedStream] = useState<Author | null>(null);
  
  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: footballAPI.getMatches,
    refetchInterval: 30000,
  });

  const match = useMemo(() => {
    if (!matches || !matchId) return null;
    return matches.find((m: Match) => m.id === matchId);
  }, [matches, matchId]);

  const status = match ? getMatchStatus(match.score, match.time) : 'upcoming';
  const { data: prediction, isLoading: predLoading, error: predError, refetch: retryPrediction } = usePrediction(
    match?.home_name || '', match?.away_name || '', match?.label || '', match?.score || '', match?.time || ''
  );

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
          <span className="text-4xl">⚽</span>
        </div>
        <h2 className="text-2xl font-bold mb-4">Match not found</h2>
        <p className="text-muted-foreground mb-6">The match you're looking for doesn't exist</p>
        <Link to="/">
          <Button className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to matches
          </Button>
        </Link>
      </div>
    );
  }

  const scoreParts = match.score?.trim().match(/^(\d+)\s*-\s*(\d+)$/);
  const homeScore = scoreParts ? scoreParts[1] : null;
  const awayScore = scoreParts ? scoreParts[2] : null;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </Link>

      {/* Match Header Card */}
      <div className="relative rounded-2xl border border-border/60 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-card to-live/5" />
        {status === 'live' && (
          <div className="absolute inset-0 bg-gradient-to-t from-live/5 to-transparent" />
        )}

        <div className="relative p-5">
          {/* Top info bar */}
          <div className="flex items-center justify-between mb-5">
            <StatusBadge status={status} />
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">{match.time}</span>
            </div>
          </div>

          {/* Competition */}
          <div className="flex items-center gap-1.5 mb-5">
            <Trophy className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-primary font-semibold uppercase tracking-wider truncate">{match.label}</span>
          </div>

          {/* Teams & Score - Horizontal Layout */}
          <div className="flex items-center justify-between gap-3">
            {/* Home Team */}
            <div className="flex-1 flex flex-col items-center text-center min-w-0">
              <div className="w-16 h-16 rounded-2xl bg-secondary/80 border border-border/50 flex items-center justify-center overflow-hidden mb-2">
                {match.home_logo ? (
                  <img src={match.home_logo} alt={match.home_name} className="w-12 h-12 object-contain" />
                ) : (
                  <span className="text-lg font-bold text-muted-foreground">{match.home_name.charAt(0)}</span>
                )}
              </div>
              <h2 className="font-display text-sm font-bold truncate w-full">{match.home_name}</h2>
              <span className="text-[10px] text-primary/70 font-medium uppercase tracking-wider">Home</span>
            </div>

            {/* Score Center */}
            <div className="flex flex-col items-center flex-shrink-0 px-2">
              {homeScore !== null ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className={`font-display text-4xl font-black ${status === 'live' ? 'text-primary' : 'text-foreground'}`}>
                      {homeScore}
                    </span>
                    {/* Spinning ball */}
                    <div className="relative w-8 h-8">
                      <span className="absolute inset-0 flex items-center justify-center text-2xl animate-spin-ball">⚽</span>
                    </div>
                    <span className={`font-display text-4xl font-black ${status === 'live' ? 'text-primary' : 'text-foreground'}`}>
                      {awayScore}
                    </span>
                  </div>
                  {status === 'live' && (
                    <span className="mt-2 px-3 py-0.5 rounded-full bg-live/20 text-live text-[10px] font-bold animate-pulse tracking-wider">
                      ● LIVE
                    </span>
                  )}
                </>
              ) : (
                <>
                  {/* Spinning ball for VS */}
                  <div className="relative w-10 h-10 mb-1">
                    <span className="absolute inset-0 flex items-center justify-center text-3xl animate-spin-ball">⚽</span>
                  </div>
                  <span className="font-display text-lg font-bold text-muted-foreground">VS</span>
                  {status === 'live' && (
                    <span className="mt-1 px-3 py-0.5 rounded-full bg-live/20 text-live text-[10px] font-bold animate-pulse tracking-wider">
                      ● LIVE
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Away Team */}
            <div className="flex-1 flex flex-col items-center text-center min-w-0">
              <div className="w-16 h-16 rounded-2xl bg-secondary/80 border border-border/50 flex items-center justify-center overflow-hidden mb-2">
                {match.away_logo ? (
                  <img src={match.away_logo} alt={match.away_name} className="w-12 h-12 object-contain" />
                ) : (
                  <span className="text-lg font-bold text-muted-foreground">{match.away_name.charAt(0)}</span>
                )}
              </div>
              <h2 className="font-display text-sm font-bold truncate w-full">{match.away_name}</h2>
              <span className="text-[10px] text-live/70 font-medium uppercase tracking-wider">Away</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction Panel */}
      <PredictionPanel
        prediction={prediction}
        isLoading={predLoading}
        error={predError}
        homeName={match.home_name}
        awayName={match.away_name}
        onRetry={() => retryPrediction()}
      />

      {/* Video Player */}
      <VideoPlayer stream={selectedStream} matchTitle={`${match.home_name} vs ${match.away_name}`} isLive={status === 'live'} />

      {/* Stream Selector */}
      <StreamSelector
        streams={match.authors}
        selectedStream={selectedStream}
        onSelectStream={setSelectedStream}
        isLive={status === 'live'}
      />
    </div>
  );
};

export default MatchDetail;

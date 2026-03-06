import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, Trophy, Radio, Sparkles } from 'lucide-react';
import { footballAPI } from '@/services/api';
import { Author, Match } from '@/types';
import { getMatchStatus } from '@/hooks/useMatches';
import { usePrediction } from '@/hooks/usePrediction';
import StatusBadge from '@/components/matches/StatusBadge';
import ElapsedTime from '@/components/matches/ElapsedTime';
import CountdownTimer from '@/components/matches/CountdownTimer';
import VideoPlayer from '@/components/streaming/VideoPlayer';
import StreamSelector from '@/components/streaming/StreamSelector';
import PredictionPanel from '@/components/predictions/PredictionPanel';
import { Button } from '@/components/ui/button';
import TeamLogo from '@/components/ui/TeamLogo';
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

  const status = match ? getMatchStatus(match.score, match.time, match.match_status) : 'upcoming';
  const { data: prediction, isLoading: predLoading, error: predError, refetch: retryPrediction } = usePrediction(
    match?.home_name || '', match?.away_name || '', match?.label || '', match?.score || '', match?.time || ''
  );

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in max-w-3xl mx-auto">
        <Skeleton className="h-8 w-24 rounded-xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-muted/50 border border-border mb-6">
          <span className="text-4xl">⚽</span>
        </div>
        <h2 className="text-2xl font-bold mb-3">Match not found</h2>
        <p className="text-muted-foreground mb-6 text-sm">The match you're looking for doesn't exist</p>
        <Link to="/">
          <Button className="gap-2 rounded-xl">
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
  const hasStreams = match.authors && match.authors.length > 0;

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl mx-auto">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all text-sm group animate-slide-up"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span className="font-medium">Back</span>
      </Link>

      {/* Match Header Card */}
      <div className="relative rounded-2xl border border-border/50 overflow-hidden animate-slide-up [animation-delay:50ms] [animation-fill-mode:backwards]">
        {/* Gradient background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-card to-card" />
        {status === 'live' && (
          <div className="absolute inset-0 bg-gradient-to-t from-live/5 via-transparent to-live/3 animate-pulse" />
        )}

        {/* Top accent line */}
        <div className={`h-0.5 w-full ${
          status === 'live' ? 'bg-gradient-to-r from-transparent via-live to-transparent' :
          status === 'upcoming' ? 'bg-gradient-to-r from-transparent via-upcoming/60 to-transparent' :
          'bg-gradient-to-r from-transparent via-primary/40 to-transparent'
        }`} />

        <div className="relative z-10 p-5 pb-6">
          {/* Top row: status + time */}
          <div className="flex items-center justify-between mb-4 animate-fade-in [animation-delay:150ms] [animation-fill-mode:backwards]">
            <div className="flex items-center gap-2">
              <StatusBadge status={status} />
              {hasStreams && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold">
                  <Radio className="w-2.5 h-2.5" />
                  {match.authors.length} streams
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {status === 'live' ? (
                <ElapsedTime time={match.time} />
              ) : (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium tabular-nums">{match.time}</span>
                </div>
              )}
            </div>
          </div>

          {/* Competition label */}
          <div className="flex items-center gap-1.5 mb-6 animate-fade-in [animation-delay:200ms] [animation-fill-mode:backwards]">
            <Trophy className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] text-primary/80 font-bold uppercase tracking-[0.15em] truncate">{match.label}</span>
          </div>

          {/* Teams & Score — centered */}
          <div className="flex items-center gap-3 animate-scale-in [animation-delay:250ms] [animation-fill-mode:backwards]">
            {/* Home Team */}
            <div className="flex-1 flex flex-col items-center text-center min-w-0 gap-2.5">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-secondary/60 border border-border/40 flex items-center justify-center overflow-hidden transition-transform duration-300 hover:scale-105">
                <TeamLogo src={match.home_logo} name={match.home_name} size="md" />
              </div>
              <div>
                <h2 className="font-display text-sm md:text-base font-bold truncate w-full leading-tight">{match.home_name}</h2>
                <span className="text-[10px] text-primary/60 font-semibold uppercase tracking-wider">Home</span>
              </div>
            </div>

            {/* Score Center */}
            <div className="flex flex-col items-center flex-shrink-0 px-1">
              {homeScore !== null ? (
                <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl border ${
                  status === 'live'
                    ? 'bg-live/10 border-live/30 shadow-lg shadow-live/10'
                    : 'bg-secondary/50 border-border/40'
                }`}>
                  <span className={`font-display text-3xl md:text-4xl font-black tabular-nums ${status === 'live' ? 'text-live' : 'text-foreground'}`}>
                    {homeScore}
                  </span>
                  <div className="relative w-6 h-6 md:w-8 md:h-8">
                    <span className="absolute inset-0 flex items-center justify-center text-lg md:text-2xl animate-spin-ball">⚽</span>
                  </div>
                  <span className={`font-display text-3xl md:text-4xl font-black tabular-nums ${status === 'live' ? 'text-live' : 'text-foreground'}`}>
                    {awayScore}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 px-5 py-3 rounded-2xl bg-secondary/50 border border-border/40">
                  <div className="relative w-8 h-8">
                    <span className="absolute inset-0 flex items-center justify-center text-2xl animate-spin-ball">⚽</span>
                  </div>
                  <span className="font-display text-base font-bold text-muted-foreground">VS</span>
                </div>
              )}

              {status === 'live' && (
                <span className="mt-2.5 px-3 py-0.5 rounded-full bg-live/15 text-live text-[9px] font-bold animate-pulse tracking-widest border border-live/20">
                  ● LIVE
                </span>
              )}
            </div>

            {/* Away Team */}
            <div className="flex-1 flex flex-col items-center text-center min-w-0 gap-2.5">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-secondary/60 border border-border/40 flex items-center justify-center overflow-hidden transition-transform duration-300 hover:scale-105">
                <TeamLogo src={match.away_logo} name={match.away_name} size="md" />
              </div>
              <div>
                <h2 className="font-display text-sm md:text-base font-bold truncate w-full leading-tight">{match.away_name}</h2>
                <span className="text-[10px] text-live/60 font-semibold uppercase tracking-wider">Away</span>
              </div>
            </div>
          </div>

          {/* Countdown for upcoming */}
          {status === 'upcoming' && (
            <div className="mt-5 animate-fade-in [animation-delay:400ms] [animation-fill-mode:backwards]">
              <CountdownTimer time={match.time} />
            </div>
          )}
        </div>
      </div>

      {/* Prediction Panel */}
      <div className="animate-slide-up [animation-delay:150ms] [animation-fill-mode:backwards]">
        <PredictionPanel
          prediction={prediction}
          isLoading={predLoading}
          error={predError}
          homeName={match.home_name}
          awayName={match.away_name}
          onRetry={() => retryPrediction()}
        />
      </div>

      {/* Video Player */}
      <div className="animate-slide-up [animation-delay:200ms] [animation-fill-mode:backwards]">
        <VideoPlayer stream={selectedStream} matchTitle={`${match.home_name} vs ${match.away_name}`} isLive={status === 'live'} />
      </div>

      {/* Stream Selector */}
      <div className="animate-slide-up [animation-delay:250ms] [animation-fill-mode:backwards]">
        <StreamSelector
          streams={match.authors}
          selectedStream={selectedStream}
          onSelectStream={setSelectedStream}
          isLive={status === 'live'}
        />
      </div>
    </div>
  );
};

export default MatchDetail;

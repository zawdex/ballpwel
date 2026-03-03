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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to matches</span>
      </Link>

      {/* Match Header */}
      <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <StatusBadge status={status} />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Trophy className="w-4 h-4" />
            <span className="text-sm">{match.label}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{match.time}</span>
          </div>
        </div>

        {/* Teams Display */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
          {/* Home Team */}
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden mb-3">
              {match.home_logo ? (
                <img src={match.home_logo} alt={match.home_name} className="w-16 h-16 md:w-20 md:h-20 object-contain" />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">{match.home_name.charAt(0)}</span>
              )}
            </div>
            <h2 className="font-display text-xl md:text-2xl font-bold">{match.home_name}</h2>
            <span className="text-sm text-muted-foreground">Home</span>
          </div>

          {/* Score */}
          <div className="text-center">
            {(() => {
              const scoreParts = match.score?.trim().match(/^(\d+)\s*-\s*(\d+)$/);
              if (scoreParts) {
                return (
                  <div className={`font-display text-5xl md:text-6xl font-bold flex items-center gap-4 ${status === 'live' ? 'text-live' : ''}`}>
                    <span>{scoreParts[1]}</span>
                    <span className="text-2xl text-muted-foreground">-</span>
                    <span>{scoreParts[2]}</span>
                  </div>
                );
              }
              return (
                <div className="font-display text-5xl md:text-6xl font-bold">vs</div>
              );
            })()}
            {status === 'live' && (
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-live/20 text-live text-sm font-medium animate-pulse">
                ● LIVE
              </span>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden mb-3">
              {match.away_logo ? (
                <img src={match.away_logo} alt={match.away_name} className="w-16 h-16 md:w-20 md:h-20 object-contain" />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">{match.away_name.charAt(0)}</span>
              )}
            </div>
            <h2 className="font-display text-xl md:text-2xl font-bold">{match.away_name}</h2>
            <span className="text-sm text-muted-foreground">Away</span>
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

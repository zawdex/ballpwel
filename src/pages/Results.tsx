import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfDay, isToday, isYesterday, subDays } from 'date-fns';
import { CalendarIcon, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { footballAPI } from '@/services/api';
import { getMatchStatus } from '@/hooks/useMatches';
import MatchList from '@/components/matches/MatchList';
import { Button } from '@/components/ui/button';

const Results = () => {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));

  const { data: allMatches, isLoading, error } = useQuery({
    queryKey: ['matches'],
    queryFn: footballAPI.getMatches,
    refetchInterval: 60 * 1000,
  });

  const finishedMatches = useMemo(() => {
    if (!allMatches) return [];
    return allMatches.filter(m => getMatchStatus(m.score, m.time, m.match_status) === 'finished');
  }, [allMatches]);

  // Date navigation
  const goToPreviousDay = () => setSelectedDate(prev => subDays(prev, 1));
  const goToNextDay = () => {
    const tomorrow = subDays(new Date(), -1);
    if (selectedDate < startOfDay(tomorrow)) {
      setSelectedDate(prev => subDays(prev, -1));
    }
  };
  const goToToday = () => setSelectedDate(startOfDay(new Date()));

  const canGoNext = selectedDate < startOfDay(new Date());

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'dd MMM yyyy');
  };

  // Filter by selected date using match timestamp
  const filteredByDate = useMemo(() => {
    return finishedMatches.filter(m => {
      if (!m.match_timestamp) return isToday(selectedDate);
      const matchDate = startOfDay(new Date(m.match_timestamp * 1000));
      return matchDate.getTime() === selectedDate.getTime();
    });
  }, [finishedMatches, selectedDate]);

  const totalFinished = finishedMatches.length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="pt-2">
        <h1 className="font-display text-2xl md:text-3xl font-bold animate-slide-up text-foreground">
          Results
        </h1>
        <p className="text-muted-foreground text-sm animate-slide-up [animation-delay:100ms] [animation-fill-mode:backwards]">
          Match results and final scores
          {totalFinished > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
              <Trophy className="w-3 h-3" />
              {totalFinished} finished
            </span>
          )}
        </p>
      </div>

      {/* Date Navigator */}
      <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-card border border-border/50 animate-slide-up [animation-delay:200ms] [animation-fill-mode:backwards]">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPreviousDay}
          className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <button
          onClick={goToToday}
          className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-secondary/60 border border-border/40 hover:bg-secondary transition-colors"
        >
          <CalendarIcon className="w-3.5 h-3.5 text-primary" />
          <span className="text-sm font-semibold">{getDateLabel(selectedDate)}</span>
        </button>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextDay}
          disabled={!canGoNext}
          className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Match count */}
      {!isLoading && (
        <p className="text-xs text-muted-foreground font-medium px-1">
          {filteredByDate.length} match{filteredByDate.length !== 1 ? 'es' : ''} on {getDateLabel(selectedDate)}
        </p>
      )}

      {/* Match List */}
      <MatchList
        matches={filteredByDate}
        isLoading={isLoading}
        error={error as Error}
      />
    </div>
  );
};

export default Results;

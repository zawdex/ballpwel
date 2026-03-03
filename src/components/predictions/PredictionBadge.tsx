import { memo } from 'react';
import { Brain } from 'lucide-react';
import { MatchPrediction } from '@/hooks/usePrediction';

interface PredictionBadgeProps {
  prediction: MatchPrediction | undefined;
  isLoading: boolean;
  homeName: string;
  awayName: string;
}

const PredictionBadge = memo(({ prediction, isLoading, homeName, awayName }: PredictionBadgeProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 animate-pulse">
        <Brain className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] font-medium text-primary">AI...</span>
      </div>
    );
  }

  if (!prediction) return null;

  const winnerName = prediction.winner === 'home' ? homeName : prediction.winner === 'away' ? awayName : 'Draw';
  const confidenceColor = prediction.confidence >= 70 ? 'text-green-500' : prediction.confidence >= 50 ? 'text-yellow-500' : 'text-muted-foreground';

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20">
      <Brain className="w-3.5 h-3.5 text-primary" />
      <span className="text-[10px] font-semibold truncate max-w-[80px]">{winnerName}</span>
      <span className={`text-[10px] font-bold ${confidenceColor}`}>{prediction.confidence}%</span>
    </div>
  );
});

PredictionBadge.displayName = 'PredictionBadge';

export default PredictionBadge;

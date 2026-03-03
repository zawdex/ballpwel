import { Brain, TrendingUp, Target, Loader2 } from 'lucide-react';
import { MatchPrediction } from '@/hooks/usePrediction';

interface PredictionPanelProps {
  prediction: MatchPrediction | undefined;
  isLoading: boolean;
  error: Error | null;
  homeName: string;
  awayName: string;
  onRetry?: () => void;
}

const confidenceColors = {
  high: 'bg-green-500/15 text-green-500 border-green-500/30',
  medium: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30',
  low: 'bg-muted text-muted-foreground border-border',
};

const PredictionPanel = ({ prediction, isLoading, error, homeName, awayName, onRetry }: PredictionPanelProps) => {
  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
          <div>
            <h3 className="font-bold text-sm">AI Prediction</h3>
            <p className="text-xs text-muted-foreground">Analyzing match...</p>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center">
            <Brain className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-bold text-sm">AI Prediction</h3>
            <p className="text-xs text-muted-foreground">Could not generate prediction</p>
          </div>
        </div>
        {onRetry && (
          <button onClick={onRetry} className="text-xs text-primary hover:underline mt-2">
            Try again
          </button>
        )}
      </div>
    );
  }

  if (!prediction) return null;

  const winnerLabel = prediction.winner === 'home' ? homeName : prediction.winner === 'away' ? awayName : 'Draw';
  const confidenceBar = prediction.confidence;

  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-sm">AI Prediction</h3>
          <p className="text-xs text-muted-foreground">Powered by AI analysis</p>
        </div>
      </div>

      {/* Prediction Result */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Predicted Winner</p>
            <p className="font-bold text-lg">{winnerLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">Score</p>
            <p className="font-display font-bold text-lg text-primary">{prediction.predicted_score}</p>
          </div>
        </div>
        {/* Confidence bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-bold text-primary">{confidenceBar}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${confidenceBar}%` }}
            />
          </div>
        </div>
      </div>

      {/* Analysis */}
      <p className="text-sm text-muted-foreground leading-relaxed">{prediction.analysis}</p>

      {/* Betting Tips */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-sm">Betting Tips</h4>
        </div>
        <div className="space-y-2">
          {prediction.tips.map((tip, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border"
            >
              <div className="mt-0.5">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm">{tip.tip}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${confidenceColors[tip.confidence]}`}>
                    {tip.confidence.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground/60 text-center">
        ⚠️ AI predictions are for entertainment only. Not financial advice.
      </p>
    </div>
  );
};

export default PredictionPanel;

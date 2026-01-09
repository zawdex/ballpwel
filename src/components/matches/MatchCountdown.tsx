import { memo } from 'react';
import { Clock } from 'lucide-react';
import { useCountdown } from '@/hooks/useCountdown';

interface MatchCountdownProps {
  time: string;
}

const MatchCountdown = memo(({ time }: MatchCountdownProps) => {
  const { hours, minutes, seconds, isExpired, formatted } = useCountdown(time);

  if (isExpired) {
    return (
      <div className="text-xs text-muted-foreground font-medium">
        {time}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-upcoming">
      <Clock className="w-3.5 h-3.5" />
      <div className="flex items-center gap-0.5 font-mono text-xs font-semibold">
        <span className="bg-upcoming/20 px-1.5 py-0.5 rounded">
          {hours.toString().padStart(2, '0')}
        </span>
        <span className="text-muted-foreground">:</span>
        <span className="bg-upcoming/20 px-1.5 py-0.5 rounded">
          {minutes.toString().padStart(2, '0')}
        </span>
        <span className="text-muted-foreground">:</span>
        <span className="bg-upcoming/20 px-1.5 py-0.5 rounded">
          {seconds.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  );
});

MatchCountdown.displayName = 'MatchCountdown';

export default MatchCountdown;

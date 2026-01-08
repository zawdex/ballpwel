import { MatchStatus } from '@/types';
import { Circle } from 'lucide-react';

interface StatusBadgeProps {
  status: MatchStatus;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusConfig = {
    live: {
      label: 'LIVE',
      className: 'status-live',
      showDot: true,
    },
    upcoming: {
      label: 'UPCOMING',
      className: 'status-upcoming',
      showDot: false,
    },
    finished: {
      label: 'FINISHED',
      className: 'status-finished',
      showDot: false,
    },
  };

  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.className}`}>
      {config.showDot && (
        <Circle className="w-2 h-2 fill-current animate-pulse" />
      )}
      {config.label}
    </span>
  );
};

export default StatusBadge;

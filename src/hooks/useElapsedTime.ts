import { useState, useEffect } from 'react';
import { parseMatchTime } from './useCountdown';

export const useElapsedTime = (time: string): string | null => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const matchDate = parseMatchTime(time);
  if (!matchDate) return null;

  const diffMs = now - matchDate.getTime();
  if (diffMs < 0) return null;

  const totalMinutes = Math.floor(diffMs / (1000 * 60));

  // First half: 0-45 min
  if (totalMinutes <= 45) return `${totalMinutes}'`;
  // Half-time break: 45-60 min elapsed (~15 min break)
  if (totalMinutes <= 60) return 'HT';
  // Second half: offset by 15 min break, so 61 elapsed = 46'
  const secondHalfMin = totalMinutes - 15;
  if (secondHalfMin <= 90) return `${secondHalfMin}'`;
  // Extra time
  if (secondHalfMin <= 120) return `${secondHalfMin}'`;
  
  return 'FT';
};

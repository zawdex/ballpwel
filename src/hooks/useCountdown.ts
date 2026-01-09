import { useState, useEffect, useMemo } from 'react';

interface CountdownResult {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  formatted: string;
}

export const useCountdown = (targetTime: string): CountdownResult => {
  const [now, setNow] = useState(Date.now());

  // Parse the target time - expecting format like "19:00" or "15:30"
  const targetDate = useMemo(() => {
    if (!targetTime) return null;
    
    // Try to parse time in HH:MM format
    const timeMatch = targetTime.match(/^(\d{1,2}):(\d{2})$/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      
      const target = new Date();
      target.setHours(hours, minutes, 0, 0);
      
      // If the time has already passed today, assume it's tomorrow
      if (target.getTime() < Date.now()) {
        target.setDate(target.getDate() + 1);
      }
      
      return target;
    }
    
    return null;
  }, [targetTime]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const countdown = useMemo((): CountdownResult => {
    if (!targetDate) {
      return { hours: 0, minutes: 0, seconds: 0, isExpired: true, formatted: '--:--:--' };
    }

    const diff = targetDate.getTime() - now;
    
    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, isExpired: true, formatted: '00:00:00' };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return { hours, minutes, seconds, isExpired: false, formatted };
  }, [targetDate, now]);

  return countdown;
};

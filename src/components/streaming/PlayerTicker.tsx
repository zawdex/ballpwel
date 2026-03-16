import { useAppSettings } from '@/contexts/AppSettingsContext';

const PlayerTicker = () => {
  const { settings } = useAppSettings();

  if (!settings.tickerText) return null;

  return (
    <div className="absolute bottom-[88px] sm:bottom-[96px] left-0 right-0 z-20 bg-black/70 backdrop-blur-sm overflow-hidden pointer-events-none">
      <div className="animate-marquee whitespace-nowrap py-1.5 text-xs sm:text-sm font-medium text-yellow-400">
        <span className="inline-block px-8">{settings.tickerText}</span>
        <span className="inline-block px-8">{settings.tickerText}</span>
        <span className="inline-block px-8">{settings.tickerText}</span>
      </div>
    </div>
  );
};

export default PlayerTicker;

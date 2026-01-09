import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OverlayAdData {
  id: string;
  name: string;
  image_url: string;
  link_url: string | null;
  position: string;
  display_duration: number;
}

interface OverlayAdProps {
  onClose?: () => void;
}

const OverlayAd = ({ onClose }: OverlayAdProps) => {
  const [ad, setAd] = useState<OverlayAdData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const fetchAd = async () => {
      const { data, error } = await supabase
        .from('overlay_ads')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (!error && data) {
        setAd(data);
        setCountdown(data.display_duration);
        // Small delay before showing
        setTimeout(() => setIsVisible(true), 1000);
      }
    };

    fetchAd();
  }, []);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev && prev > 1) return prev - 1;
        return 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setAd(null);
      onClose?.();
    }, 300);
  };

  const handleAdClick = () => {
    if (ad?.link_url) {
      window.open(ad.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!ad || !isVisible) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  const position = positionClasses[ad.position as keyof typeof positionClasses] || positionClasses['bottom-right'];

  return (
    <div
      className={`absolute ${position} z-50 transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      <div className="relative group">
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={countdown !== null && countdown > 0}
          className={`absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
            countdown !== null && countdown > 0
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
          }`}
        >
          {countdown !== null && countdown > 0 ? (
            <span className="text-xs font-bold">{countdown}</span>
          ) : (
            <X className="w-3 h-3" />
          )}
        </button>

        {/* Ad content */}
        <div
          onClick={handleAdClick}
          className={`overflow-hidden rounded-lg shadow-lg border border-border/50 bg-background/80 backdrop-blur-sm ${
            ad.link_url ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''
          }`}
        >
          <img
            src={ad.image_url}
            alt={ad.name}
            className="max-w-[200px] max-h-[150px] sm:max-w-[280px] sm:max-h-[180px] object-contain"
          />
        </div>

        {/* Ad label */}
        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white/80 font-medium">
          Ad
        </div>
      </div>
    </div>
  );
};

export default OverlayAd;

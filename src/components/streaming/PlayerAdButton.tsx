import { useState, useEffect } from 'react';
import { Megaphone, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OverlayAdData {
  id: string;
  name: string;
  image_url: string;
  link_url: string | null;
  position: string;
  display_duration: number;
}

const PlayerAdButton = () => {
  const [ad, setAd] = useState<OverlayAdData | null>(null);
  const [showCard, setShowCard] = useState(false);

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
      }
    };
    fetchAd();
  }, []);

  if (!ad) return null;

  const handleAdClick = () => {
    if (ad.link_url) {
      window.open(ad.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      {/* Ad icon button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowCard(!showCard);
        }}
        className="absolute top-3 left-3 z-40 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/80 transition-all"
      >
        <Megaphone className="w-4 h-4 text-yellow-400" />
      </button>

      {/* Ad card popup */}
      {showCard && (
        <div
          className="absolute top-3 left-14 z-50 w-56 rounded-xl bg-card/95 backdrop-blur-md border border-border/60 shadow-2xl overflow-hidden animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCard(false);
            }}
            className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>

          {/* Ad label */}
          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/50 rounded text-[9px] text-white/70 font-bold uppercase tracking-wider">
            Ad
          </div>

          {/* Ad image */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleAdClick();
            }}
            className={`${ad.link_url ? 'cursor-pointer' : ''}`}
          >
            <img
              src={ad.image_url}
              alt={ad.name}
              className="w-full aspect-video object-cover"
            />
            <div className="p-2.5">
              <p className="text-xs font-semibold text-foreground truncate">{ad.name}</p>
              {ad.link_url && (
                <p className="text-[10px] text-primary mt-0.5">Tap to learn more →</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlayerAdButton;

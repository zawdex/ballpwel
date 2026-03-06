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
        className="absolute top-14 left-3 z-40 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/80 transition-all"
      >
        <Megaphone className="w-4 h-4 text-yellow-400" />
      </button>

      {/* Full-screen ad overlay */}
      {showCard && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            e.stopPropagation();
            setShowCard(false);
          }}
        >
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCard(false);
            }}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Ad label */}
          <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md text-[10px] text-white/80 font-bold uppercase tracking-wider">
            Ad
          </div>

          {/* Ad content - fills video area */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleAdClick();
            }}
            className={`w-full h-full flex flex-col items-center justify-center p-4 ${ad.link_url ? 'cursor-pointer' : ''}`}
          >
            <img
              src={ad.image_url}
              alt={ad.name}
              className="max-w-full max-h-[75%] object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-3 text-center">
              <p className="text-sm font-semibold text-white">{ad.name}</p>
              {ad.link_url && (
                <p className="text-xs text-primary mt-1">Tap to learn more →</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlayerAdButton;

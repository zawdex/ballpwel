import { useState } from 'react';
import { Play, ExternalLink, AlertTriangle, Tv, Signal, Wifi, ShieldAlert } from 'lucide-react';
import { Author } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { isValidStreamUrl } from '@/lib/urlValidation';
import HLSPlayer from './HLSPlayer';
import OverlayAd from './OverlayAd';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  stream: Author | null;
  matchTitle?: string;
}

const VideoPlayer = ({ stream, matchTitle }: VideoPlayerProps) => {
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [useEmbedded, setUseEmbedded] = useState(true);
  const { t } = useLanguage();
  const { settings } = useAppSettings();

  if (!stream) {
    return (
      <div className="aspect-video bg-gradient-to-br from-card via-card to-secondary/30 rounded-2xl border border-border overflow-hidden relative">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-pulse delay-700" />
        </div>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center backdrop-blur-sm overflow-hidden">
              {settings.streamDialogLogoUrl ? (
                <img src={settings.streamDialogLogoUrl} alt="Stream Logo" className="w-16 h-16 object-contain" />
              ) : (
                <Tv className="w-10 h-10 text-primary" />
              )}
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center animate-ping">
              <Signal className="w-3 h-3 text-primary" />
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2 text-foreground">{t('selectStream')}</h3>
          <p className="text-muted-foreground text-sm text-center max-w-xs">{t('selectStreamDesc')}</p>
        </div>
      </div>
    );
  }

  // Validate stream URL before rendering
  if (!isValidStreamUrl(stream.url)) {
    return (
      <div className="aspect-video bg-gradient-to-br from-destructive/10 via-card to-secondary/30 rounded-2xl border border-destructive/30 overflow-hidden relative">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 rounded-2xl bg-destructive/20 flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-bold mb-2 text-foreground">Invalid Stream URL</h3>
          <p className="text-muted-foreground text-sm text-center max-w-xs">
            This stream URL could not be validated. Please select a different stream.
          </p>
        </div>
      </div>
    );
  }

  const isHLSStream = stream.url?.includes('.m3u8');
  const isEmbeddable = stream.url?.includes('embed') || isHLSStream;

  const handlePlayerError = (error: string) => {
    setPlayerError(error);
    console.error('Player error:', error);
  };

  const handleExternalClick = () => {
    // Validate URL before opening
    if (isValidStreamUrl(stream.url)) {
      window.open(stream.url, '_blank', 'noopener,noreferrer');
    }
  };

  // If HLS stream and embedded mode is enabled
  if (isHLSStream && useEmbedded && !playerError) {
    return (
      <div className="space-y-4">
        <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl shadow-primary/5">
          <HLSPlayer
            src={stream.url}
            title={matchTitle || `${stream.name} Stream`}
            onError={handlePlayerError}
          />
          <OverlayAd />
        </div>
        <StreamInfo stream={stream} onExternalClick={handleExternalClick} />
      </div>
    );
  }

  // If it's an embeddable stream (iframe)
  if (isEmbeddable && useEmbedded && !playerError) {
    return (
      <div className="space-y-4">
        <div className="aspect-video bg-black rounded-2xl overflow-hidden relative border border-border shadow-2xl shadow-primary/5">
          <iframe
            src={stream.url}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            title={`${stream.name} Stream`}
            sandbox="allow-scripts allow-same-origin allow-presentation allow-fullscreen"
            referrerPolicy="no-referrer"
          />
          <OverlayAd />
        </div>
        <StreamInfo stream={stream} onExternalClick={handleExternalClick} />
      </div>
    );
  }

  // Fallback: External link with preview
  return (
    <div className="space-y-4">
      <div className="aspect-video bg-gradient-to-br from-card via-card to-secondary/30 rounded-2xl border border-border overflow-hidden relative group">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/3 left-1/3 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-destructive/20 rounded-full blur-3xl" />
        </div>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
          {playerError && (
            <div className="flex items-center gap-2 text-yellow-500 mb-6 bg-yellow-500/10 px-4 py-2 rounded-xl border border-yellow-500/20">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">{t('embeddedUnavailable')}</span>
            </div>
          )}
          
          <button
            onClick={handleExternalClick}
            className="flex flex-col items-center gap-4 group-hover:scale-105 transition-transform duration-300"
          >
            <div className="relative">
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 backdrop-blur-xl flex items-center justify-center border border-primary/30 group-hover:border-primary/50 transition-all shadow-lg shadow-primary/20">
                <Play className="w-12 h-12 text-primary fill-primary ml-1" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-bounce">
                <Wifi className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">{t('watchOn')} {stream.name}</p>
              <p className="text-muted-foreground text-sm">{t('clickToOpen')}</p>
            </div>
          </button>

          {playerError && (
            <Button
              variant="outline"
              className="mt-6 gap-2"
              onClick={() => {
                setPlayerError(null);
                setUseEmbedded(true);
              }}
            >
              {t('tryEmbeddedAgain')}
            </Button>
          )}
        </div>
      </div>

      <StreamInfo stream={stream} onExternalClick={handleExternalClick} />
    </div>
  );
};

interface StreamInfoProps {
  stream: Author;
  onExternalClick: () => void;
}

const StreamInfo = ({ stream, onExternalClick }: StreamInfoProps) => {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-between gap-3 p-4 bg-gradient-to-r from-card to-card/80 rounded-xl border border-border backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center overflow-hidden border border-primary/20">
            {stream.logo ? (
              <img src={stream.logo} alt={stream.name} className="w-9 h-9 object-contain" />
            ) : (
              <Play className="w-5 h-5 text-primary" />
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-live flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          </div>
        </div>
        <div>
          <p className="font-semibold">{stream.name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {t('currentlyStreaming')}
          </p>
        </div>
      </div>
      
      <Button variant="outline" size="sm" onClick={onExternalClick} className="gap-2 hover:bg-primary hover:text-primary-foreground transition-all">
        <ExternalLink className="w-4 h-4" />
        <span className="hidden sm:inline">{t('openExternal')}</span>
      </Button>
    </div>
  );
};

export default VideoPlayer;

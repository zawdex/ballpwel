import { useState } from 'react';
import { Play, ExternalLink, AlertTriangle } from 'lucide-react';
import { Author } from '@/types';
import HLSPlayer from './HLSPlayer';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  stream: Author | null;
  matchTitle?: string;
}

const VideoPlayer = ({ stream, matchTitle }: VideoPlayerProps) => {
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [useEmbedded, setUseEmbedded] = useState(true);

  if (!stream) {
    return (
      <div className="aspect-video bg-card rounded-xl border border-border flex items-center justify-center">
        <div className="text-center p-6">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Select a Stream</h3>
          <p className="text-muted-foreground text-sm">Choose a stream from the list below to start watching</p>
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

  // If HLS stream and embedded mode is enabled
  if (isHLSStream && useEmbedded && !playerError) {
    return (
      <div className="space-y-4">
        <HLSPlayer
          src={stream.url}
          title={matchTitle || `${stream.name} Stream`}
          onError={handlePlayerError}
        />
        
        <StreamInfo stream={stream} onExternalClick={() => window.open(stream.url, '_blank')} />
      </div>
    );
  }

  // If it's an embeddable stream (iframe)
  if (isEmbeddable && useEmbedded && !playerError) {
    return (
      <div className="space-y-4">
        <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
          <iframe
            src={stream.url}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            title={`${stream.name} Stream`}
          />
        </div>
        
        <StreamInfo stream={stream} onExternalClick={() => window.open(stream.url, '_blank')} />
      </div>
    );
  }

  // Fallback: External link with preview
  return (
    <div className="space-y-4">
      <div className="aspect-video bg-card rounded-xl border border-border overflow-hidden relative group">
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-card/50 to-card p-6">
          {playerError && (
            <div className="flex items-center gap-2 text-yellow-500 mb-4 bg-yellow-500/10 px-4 py-2 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm">Embedded player unavailable</span>
            </div>
          )}
          
          <a
            href={stream.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-4 group-hover:scale-105 transition-transform"
          >
            <div className="w-24 h-24 rounded-full bg-primary/20 backdrop-blur-xl flex items-center justify-center border-2 border-primary/30 hover:bg-primary/30 transition-all hover:border-primary/50">
              <Play className="w-10 h-10 text-primary fill-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">Watch on {stream.name}</p>
              <p className="text-muted-foreground text-sm">Click to open stream in new tab</p>
            </div>
          </a>

          {playerError && (
            <Button
              variant="outline"
              className="mt-6 gap-2"
              onClick={() => {
                setPlayerError(null);
                setUseEmbedded(true);
              }}
            >
              Try Embedded Player Again
            </Button>
          )}
        </div>
      </div>

      <StreamInfo stream={stream} onExternalClick={() => window.open(stream.url, '_blank')} />
    </div>
  );
};

interface StreamInfoProps {
  stream: Author;
  onExternalClick: () => void;
}

const StreamInfo = ({ stream, onExternalClick }: StreamInfoProps) => (
  <div className="flex items-center justify-between gap-3 p-4 bg-card rounded-xl border border-border">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
        {stream.logo ? (
          <img src={stream.logo} alt={stream.name} className="w-8 h-8 object-contain" />
        ) : (
          <Play className="w-5 h-5 text-primary" />
        )}
      </div>
      <div>
        <p className="font-medium">{stream.name}</p>
        <p className="text-xs text-muted-foreground">Currently streaming</p>
      </div>
    </div>
    
    <Button variant="ghost" size="sm" onClick={onExternalClick} className="gap-2">
      <ExternalLink className="w-4 h-4" />
      <span className="hidden sm:inline">Open External</span>
    </Button>
  </div>
);

export default VideoPlayer;

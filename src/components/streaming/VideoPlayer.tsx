import { Play, Maximize, Volume2 } from 'lucide-react';
import { Author } from '@/types';

interface VideoPlayerProps {
  stream: Author | null;
}

const VideoPlayer = ({ stream }: VideoPlayerProps) => {
  if (!stream) {
    return (
      <div className="aspect-video bg-card rounded-xl border border-border flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Select a Stream</h3>
          <p className="text-muted-foreground text-sm">Choose a stream from the list below to start watching</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="aspect-video bg-card rounded-xl border border-border overflow-hidden relative group">
        {/* Video placeholder - in production, integrate with Video.js for HLS */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent to-black/50">
          <a
            href={stream.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-4 group-hover:scale-105 transition-transform"
          >
            <div className="w-20 h-20 rounded-full bg-primary/20 backdrop-blur-xl flex items-center justify-center border border-primary/30 hover:bg-primary/30 transition-colors">
              <Play className="w-8 h-8 text-primary fill-primary" />
            </div>
            <span className="text-sm font-medium">Click to watch on {stream.name}</span>
          </a>
        </div>

        {/* Video Controls (placeholder) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                <Play className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
            <button className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
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
    </div>
  );
};

export default VideoPlayer;

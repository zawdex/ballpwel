import { Author } from '@/types';
import { Play, Radio, ExternalLink, Check, Globe, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StreamQualityBadge from './StreamQualityBadge';

interface StreamSelectorProps {
  streams: Author[];
  selectedStream: Author | null;
  onSelectStream: (stream: Author) => void;
}

const StreamSelector = ({ streams, selectedStream, onSelectStream }: StreamSelectorProps) => {
  if (!streams || streams.length === 0) {
    return (
      <div className="text-center py-8 bg-card rounded-xl border border-border">
        <Radio className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No streams available</h3>
        <p className="text-muted-foreground text-sm">Check back later for live streams</p>
      </div>
    );
  }

  const getStreamType = (url: string) => {
    if (url?.includes('.m3u8')) return { label: 'HLS', icon: Zap };
    if (url?.includes('embed')) return { label: 'Embed', icon: Globe };
    return { label: 'External', icon: ExternalLink };
  };

  const estimateQuality = (stream: Author): 'HD' | 'SD' | 'LOW' => {
    const name = stream.name?.toLowerCase() || '';
    const url = stream.url?.toLowerCase() || '';
    
    if (name.includes('hd') || name.includes('1080') || name.includes('720') || url.includes('hd')) {
      return 'HD';
    }
    if (name.includes('sd') || name.includes('480') || name.includes('360')) {
      return 'SD';
    }
    if (name.includes('low') || name.includes('240')) {
      return 'LOW';
    }
    return 'SD'; // Default
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Radio className="w-5 h-5 text-primary" />
          Available Streams
        </h3>
        <span className="text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full">
          {streams.length} source{streams.length > 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {streams.map((stream, index) => {
          const isSelected = selectedStream === stream;
          const streamType = getStreamType(stream.url);
          const StreamIcon = streamType.icon;
          const quality = estimateQuality(stream);

          return (
            <button
              key={index}
              onClick={() => onSelectStream(stream)}
              className={`relative flex items-start gap-3 p-4 rounded-xl border transition-all text-left group ${
                isSelected
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-card/80'
              }`}
            >
              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}

              {/* Stream Logo */}
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                {stream.logo ? (
                  <img
                    src={stream.logo}
                    alt={stream.name}
                    className="w-10 h-10 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Play className="w-6 h-6 text-primary" />
                )}
              </div>

              {/* Stream Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate pr-6">{stream.name || `Stream ${index + 1}`}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <StreamQualityBadge quality={quality} showIcon={false} />
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <StreamIcon className="w-3 h-3" />
                    {streamType.label}
                  </span>
                </div>
                {stream.url && (
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {(() => {
                      try {
                        return new URL(stream.url).hostname;
                      } catch {
                        return 'External link';
                      }
                    })()}
                  </p>
                )}
              </div>

              {/* Live indicator for selected */}
              {isSelected && (
                <div className="absolute bottom-2 right-2">
                  <span className="flex items-center gap-1 text-xs text-primary">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Active
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedStream && (
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            className="flex-1 gap-2"
            onClick={() => window.open(selectedStream.url, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
            Open in New Tab
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => onSelectStream(selectedStream)}
          >
            <Play className="w-4 h-4" />
            Play in Embedded Player
          </Button>
        </div>
      )}
    </div>
  );
};

export default StreamSelector;

import { Author } from '@/types';
import { Play, Radio, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Radio className="w-5 h-5 text-primary" />
        Available Streams ({streams.length})
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {streams.map((stream, index) => (
          <button
            key={index}
            onClick={() => onSelectStream(stream)}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
              selectedStream === stream
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
              {stream.logo ? (
                <img
                  src={stream.logo}
                  alt={stream.name}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <Play className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{stream.name || `Stream ${index + 1}`}</p>
              <p className="text-xs text-muted-foreground truncate">
                {stream.url ? new URL(stream.url).hostname : 'External link'}
              </p>
            </div>
            {selectedStream === stream && (
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {selectedStream && (
        <Button
          className="w-full gap-2"
          onClick={() => window.open(selectedStream.url, '_blank')}
        >
          <ExternalLink className="w-4 h-4" />
          Open Stream in New Tab
        </Button>
      )}
    </div>
  );
};

export default StreamSelector;

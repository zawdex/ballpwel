import { Author } from '@/types';
import { Play, Radio, ExternalLink, Check, Globe, Zap, Tv, Signal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import StreamQualityBadge from './StreamQualityBadge';

interface StreamSelectorProps {
  streams: Author[];
  selectedStream: Author | null;
  onSelectStream: (stream: Author) => void;
  isLive?: boolean;
}

const StreamSelector = ({ streams, selectedStream, onSelectStream, isLive = true }: StreamSelectorProps) => {
  const { t } = useLanguage();

  // Show unavailable state when match is not live
  if (!isLive) {
    return (
      <div className="text-center py-12 bg-gradient-to-br from-card via-card to-secondary/20 rounded-2xl border border-border relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-muted-foreground/20 rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center border border-border">
            <Radio className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold mb-2 text-muted-foreground">{t('streamsUnavailableTitle')}</h3>
          <p className="text-muted-foreground/70 text-sm">{t('streamsUnavailableDesc')}</p>
        </div>
      </div>
    );
  }

  if (!streams || streams.length === 0) {
    return (
      <div className="text-center py-12 bg-gradient-to-br from-card via-card to-secondary/20 rounded-2xl border border-border relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-muted-foreground/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center border border-border">
            <Radio className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold mb-2">{t('noStreams')}</h3>
          <p className="text-muted-foreground text-sm">{t('noStreamsDesc')}</p>
        </div>
      </div>
    );
  }

  const getStreamType = (url: string) => {
    if (url?.includes('.m3u8')) return { label: t('streamTypeHLS'), icon: Zap, color: 'text-green-400' };
    if (url?.includes('embed')) return { label: t('streamTypeEmbed'), icon: Globe, color: 'text-blue-400' };
    return { label: t('streamTypeExternal'), icon: ExternalLink, color: 'text-orange-400' };
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
    return 'SD';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <Signal className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">{t('availableStreams')}</h3>
            <p className="text-xs text-muted-foreground">
              {streams.length} {streams.length > 1 ? t('sources') : t('source')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full border border-border">
            {streams.length} {streams.length > 1 ? t('streams') : t('stream')}
          </span>
        </div>
      </div>
      
      {/* Stream Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {streams.map((stream, index) => {
          const isSelected = selectedStream === stream;
          const streamType = getStreamType(stream.url);
          const StreamIcon = streamType.icon;
          const quality = estimateQuality(stream);

          return (
            <button
              key={index}
              onClick={() => onSelectStream(stream)}
              className={`relative flex flex-col p-4 rounded-2xl border transition-all duration-300 text-left group overflow-hidden ${
                isSelected
                  ? 'border-primary bg-gradient-to-br from-primary/15 to-primary/5 ring-2 ring-primary/30 shadow-lg shadow-primary/10'
                  : 'border-border bg-gradient-to-br from-card to-card/80 hover:border-primary/40 hover:bg-card/90 hover:shadow-lg hover:shadow-primary/5'
              }`}
            >
              {/* Selected glow effect */}
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
              )}

              {/* Top section */}
              <div className="flex items-start gap-3 relative">
                {/* Stream Logo */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 transition-all duration-300 ${
                  isSelected 
                    ? 'bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/40' 
                    : 'bg-gradient-to-br from-secondary to-secondary/50 border border-border group-hover:border-primary/30'
                }`}>
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
                    <Tv className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'} transition-colors`} />
                  )}
                </div>

                {/* Stream Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate pr-6 text-foreground">{stream.name || `Stream ${index + 1}`}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <StreamQualityBadge quality={quality} showIcon={false} />
                    <span className={`inline-flex items-center gap-1 text-xs ${streamType.color} bg-secondary/50 px-2 py-0.5 rounded-full`}>
                      <StreamIcon className="w-3 h-3" />
                      {streamType.label}
                    </span>
                  </div>
                </div>

                {/* Selected Check */}
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Bottom section */}
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between">
                  {stream.url && (
                    <p className="text-xs text-muted-foreground truncate max-w-[70%]">
                      {(() => {
                        try {
                          return new URL(stream.url).hostname;
                        } catch {
                          return t('externalLink');
                        }
                      })()}
                    </p>
                  )}
                  
                  {/* Status indicator */}
                  {isSelected ? (
                    <span className="flex items-center gap-1.5 text-xs text-primary font-medium">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      {t('active')}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to select
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      {selectedStream && (
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            className="flex-1 gap-2 h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20"
            onClick={() => window.open(selectedStream.url, '_blank')}
          >
            <ExternalLink className="w-5 h-5" />
            {t('openInNewTab')}
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2 h-12 text-base font-semibold border-2 hover:bg-primary/10 hover:border-primary"
            onClick={() => onSelectStream(selectedStream)}
          >
            <Play className="w-5 h-5" />
            {t('playEmbedded')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default StreamSelector;

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  Settings,
  Loader2,
  AlertCircle,
  RefreshCw,
  Tv,
  Check
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HLSPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  onError?: (error: string) => void;
}

interface QualityLevel {
  height: number;
  bitrate: number;
  index: number;
}

const HLSPlayer = ({ src, poster, title, onError }: HLSPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { t } = useLanguage();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [isBuffering, setIsBuffering] = useState(false);

  const initializePlayer = useCallback(() => {
    if (!videoRef.current || !src) return;

    setError(null);
    setIsLoading(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    if (src.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
        });

        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(videoRef.current);

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          setIsLoading(false);
          const levels = data.levels.map((level, index) => ({
            height: level.height,
            bitrate: level.bitrate,
            index,
          }));
          setQualityLevels(levels);
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          setCurrentQuality(data.level);
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setError(t('networkError'));
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setError(t('mediaError'));
                hls.recoverMediaError();
                break;
              default:
                setError(t('streamUnavailable'));
                hls.destroy();
                onError?.('Fatal streaming error');
                break;
            }
          }
        });
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = src;
        setIsLoading(false);
      } else {
        setError(t('hlsNotSupported'));
        onError?.('HLS not supported');
      }
    } else {
      videoRef.current.src = src;
      setIsLoading(false);
    }
  }, [src, onError, t]);

  useEffect(() => {
    initializePlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [initializePlayer]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setError(t('failedToLoad'));
      setIsLoading(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [t]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const setQuality = (levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      setCurrentQuality(levelIndex);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getQualityLabel = (level: QualityLevel) => {
    if (level.height >= 1080) return '1080p';
    if (level.height >= 720) return '720p';
    if (level.height >= 480) return '480p';
    if (level.height >= 360) return '360p';
    return `${level.height}p`;
  };

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-gradient-to-br from-black via-zinc-900 to-black rounded-xl overflow-hidden group"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster}
        playsInline
        onClick={togglePlay}
      />

      {/* Loading Overlay */}
      {(isLoading || isBuffering) && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{t('loading')}</p>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-black/90 to-black/80 text-center p-6 backdrop-blur-sm">
          <div className="w-16 h-16 rounded-2xl bg-destructive/20 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-lg font-bold mb-2">{error}</p>
          <Button onClick={initializePlayer} variant="outline" className="gap-2 mt-2">
            <RefreshCw className="w-4 h-4" />
            {t('retry')}
          </Button>
        </div>
      )}

      {/* Play Button Overlay (when paused) */}
      {!isPlaying && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <button
            onClick={togglePlay}
            className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-2xl shadow-primary/30"
          >
            <Play className="w-12 h-12 text-primary-foreground fill-primary-foreground ml-1" />
          </button>
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 pt-16 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Title Bar */}
        {title && showControls && (
          <div className="absolute top-4 left-4 right-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center backdrop-blur-sm border border-primary/20">
              <Tv className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-white/90 truncate">{title}</span>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-4">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-white/60 mt-1.5 font-medium">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/10"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/10"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>
              <div className="w-24 hidden sm:block">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quality Selector */}
            {qualityLevels.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1.5 backdrop-blur-sm border border-white/10">
                    <Settings className="w-5 h-5 text-white" />
                    <span className="text-xs text-white font-medium hidden sm:inline">
                      {currentQuality === -1 ? t('auto') : getQualityLabel(qualityLevels[currentQuality])}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-border">
                  <DropdownMenuItem onClick={() => setQuality(-1)} className="gap-2">
                    {t('auto')} {currentQuality === -1 && <Check className="w-4 h-4 text-primary ml-auto" />}
                  </DropdownMenuItem>
                  {qualityLevels.map((level) => (
                    <DropdownMenuItem key={level.index} onClick={() => setQuality(level.index)} className="gap-2">
                      {getQualityLabel(level)} {currentQuality === level.index && <Check className="w-4 h-4 text-primary ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/10"
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5 text-white" />
              ) : (
                <Maximize className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HLSPlayer;

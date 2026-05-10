// components/Editorial.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { Pause, Play, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Settings, Clock } from 'lucide-react';

interface EditorialProps {
  secureUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
}

const Editorial: React.FC<EditorialProps> = ({ secureUrl, thumbnailUrl, duration: initialDuration = 0 }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const hasVideo = secureUrl && secureUrl.trim() !== '' && !secureUrl.includes('placeholder');

  // Coming Soon UI
  if (!hasVideo) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden shadow-2xl bg-secondary border border-primary">
        <div className="w-full aspect-video flex items-center justify-center">
          <div className="text-center p-8 animate-fade-in">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg bg-brand">
              <Clock className="text-white" size={40} />
            </div>
            
            <h2 className="text-4xl font-bold mb-4 text-primary">
              Video Editorial <span className="text-brand">Coming Soon</span>
            </h2>
            
            <p className="text-xl mb-6 max-w-md mx-auto leading-relaxed text-secondary">
              We&apos;re preparing an amazing video editorial for this problem. Stay tuned for detailed explanations and solutions!
            </p>
            
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-300 dark:border-primary-700 rounded-xl p-4 max-w-sm mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full animate-pulse bg-brand"></div>
                <span className="font-semibold text-brand">In Development</span>
              </div>
              <p className="text-sm text-secondary">
                Check back soon for step-by-step video solutions
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSettings(false);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Keyboard controls
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipTime(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipTime(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(prev => Math.min(1, prev + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(prev => Math.max(0, prev - 0.1));
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, duration]);

  // Video event handlers
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handleLoadedData = () => setIsLoading(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, []);

  // Fullscreen change handler
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-hide controls
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && !isHovering) {
      timer = setTimeout(() => {
        setIsHovering(false);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, isHovering]);

  return (
    <div 
      className="relative w-full rounded-xl overflow-hidden shadow-2xl border bg-secondary border-primary"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={() => setIsHovering(true)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={secureUrl}
        poster={thumbnailUrl}
        onClick={togglePlayPause}
        className="w-full aspect-video cursor-pointer bg-gray-900 dark:bg-gray-950"
        preload="metadata"
      />
      
      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 dark:bg-gray-950/90">
          <div className="w-12 h-12 border-4 rounded-full animate-spin border-primary-500 border-t-transparent"></div>
        </div>
      )}

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="absolute top-4 right-4 text-sm px-3 py-1.5 rounded-lg border text-primary bg-elevated border-primary shadow-sm">
          Buffering...
        </div>
      )}

      {/* Play Button Overlay */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlayPause}
            className="w-20 h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-110 shadow-2xl bg-brand hover:bg-brand-hover"
          >
            <Play className="w-10 h-10 text-white ml-1" />
          </button>
        </div>
      )}
      
      {/* Video Controls Overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/95 via-gray-900/80 to-transparent dark:from-gray-950/95 dark:via-gray-950/80 p-4 transition-opacity duration-300 ${
          isHovering || !isPlaying || showSettings ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleProgressChange}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-700 dark:bg-gray-800"
            style={{
              background: `linear-gradient(to right, var(--primary-500) 0%, var(--primary-500) ${(currentTime / duration) * 100}%, var(--gray-700) ${(currentTime / duration) * 100}%, var(--gray-700) 100%)`
            }}
          />
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={togglePlayPause}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-white/10 hover:bg-white/20 dark:bg-gray-800/50 dark:hover:bg-gray-700/70"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" />
              )}
            </button>
            
            <button
              onClick={() => skipTime(-10)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white/10 hover:bg-white/20 dark:bg-gray-800/50 dark:hover:bg-gray-700/70"
              aria-label="Skip back 10 seconds"
            >
              <SkipBack className="w-4 h-4 text-white" />
            </button>
            
            <button
              onClick={() => skipTime(10)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white/10 hover:bg-white/20 dark:bg-gray-800/50 dark:hover:bg-gray-700/70"
              aria-label="Skip forward 10 seconds"
            >
              <SkipForward className="w-4 h-4 text-white" />
            </button>

            {/* Volume Controls */}
            <div 
              className="flex items-center space-x-2"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                onClick={toggleMute}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white/10 hover:bg-white/20 dark:bg-gray-800/50 dark:hover:bg-gray-700/70"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-white" />
                ) : (
                  <Volume2 className="w-4 h-4 text-white" />
                )}
              </button>
              
              {showVolumeSlider && (
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-2 rounded-lg appearance-none cursor-pointer bg-gray-700 dark:bg-gray-800"
                  style={{
                    background: `linear-gradient(to right, var(--primary-500) 0%, var(--primary-500) ${volume * 100}%, var(--gray-700) ${volume * 100}%, var(--gray-700) 100%)`
                  }}
                />
              )}
            </div>

            {/* Time Display */}
            <span className="text-sm font-mono text-white">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            {/* Settings Menu */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white/10 hover:bg-white/20 dark:bg-gray-800/50 dark:hover:bg-gray-700/70"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4 text-white" />
              </button>
              
              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 p-2 min-w-32 rounded-lg border shadow-xl bg-elevated border-primary">
                  <div className="text-sm font-medium mb-2 text-primary">Playback Speed</div>
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handlePlaybackRateChange(rate)}
                      className={`block w-full text-left px-2 py-1 text-sm rounded transition-colors hover:bg-secondary ${
                        playbackRate === rate ? 'font-semibold text-brand' : 'text-primary'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white/10 hover:bg-white/20 dark:bg-gray-800/50 dark:hover:bg-gray-700/70"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              <Maximize className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editorial;

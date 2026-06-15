import { useState, useEffect, useMemo, useRef } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, Mic, AlertCircle } from 'lucide-react'

export default function AudioPlayer({ recording }) {
  const recordingId = recording?.recordingId || '';

  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(recording?.duration || 0);
  const [speed, setSpeed] = useState('1x');
  const [volume, setVolume] = useState(80);
  const [audioError, setAudioError] = useState(false);

  // Seeded waveform bar heights based on recordingId
  const waveHeights = useMemo(() => {
    return Array.from({ length: 80 }, (_, i) => {
      const seed = recordingId.charCodeAt(i % recordingId.length) || 65;
      return 20 + (seed % 60); // alternate heights between 20% and 80%
    });
  }, [recordingId]);

  // Sync settings and state on recording shift
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
    setAudioError(false);
    setDuration(recording?.duration || 0);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.volume = volume / 100;
      audioRef.current.playbackRate = parseFloat(speed);
    }
  }, [recordingId, recording?.duration]);

  function formatPlayerTime(seconds) {
    if (isNaN(seconds) || seconds === undefined || seconds === null) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const playedFraction = duration > 0 ? currentTime / duration : 0;
  const playedBars = Math.min(80, Math.floor(playedFraction * 80));
  const playedPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio playback failed:', err);
        setAudioError(true);
        setIsPlaying(false);
      });
    }
  };

  const skip = (seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, 
        Math.min(duration, audioRef.current.currentTime + seconds)
      );
    }
  };

  const handleVolumeChange = (value) => {
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value / 100;
    }
  };

  const handleSpeedChange = (value) => {
    setSpeed(value);
    if (audioRef.current) {
      audioRef.current.playbackRate = parseFloat(value);
    }
  };

  const handleScrubberClick = (e) => {
    if (!audioRef.current || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const targetTime = percent * duration;
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  return (
    <div className="bg-gray-900 rounded-xl p-5 text-gray-300 shadow-lg">
      {/* Hidden native audio element */}
      {recording?.cloudinaryUrl && (
        <audio 
          ref={audioRef} 
          src={recording.cloudinaryUrl} 
          preload="metadata"
          onTimeUpdate={() => setCurrentTime(audioRef.current ? audioRef.current.currentTime : 0)}
          onLoadedMetadata={() => setDuration(audioRef.current ? audioRef.current.duration : recording.duration)}
          onEnded={() => setIsPlaying(false)}
          onError={() => setAudioError(true)}
          className="hidden"
        />
      )}

      {/* Top info row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-gray-400">
          <Mic size={14} />
          <span className="font-mono text-xs ml-1.5">{recordingId}</span>
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <span>Audio Player</span>
          <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded font-mono ml-2 uppercase">
            {recording?.fileFormat || 'AUDIO'}
          </span>
        </div>
      </div>

      {/* Waveform Visualization Grid (80 bars) */}
      <div 
        onClick={handleTogglePlay}
        className="w-full h-16 flex items-end gap-[2px] mb-4 cursor-pointer select-none"
      >
        {waveHeights.map((h, i) => {
          let barBg = 'bg-gray-600';
          if (i < playedBars) {
            barBg = 'bg-indigo-400';
          } else if (i === playedBars) {
            barBg = 'bg-indigo-300';
          }
          return (
            <div 
              key={i}
              className={`flex-1 rounded-sm ${barBg} transition-all duration-300`}
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>

      {/* Time scrubber progress bar */}
      <div 
        onClick={handleScrubberClick}
        className="w-full h-1 bg-gray-700 rounded-full mb-4 cursor-pointer relative"
      >
        <div 
          className="bg-indigo-500 h-full rounded-full transition-all duration-200" 
          style={{ width: `${playedPct}%` }}
        />
        <div 
          className="absolute w-3 h-3 bg-white rounded-full shadow transition-all duration-200"
          style={{ 
            left: `calc(${playedPct}% - 6px)`,
            top: '-4px'
          }}
        />
      </div>

      {/* Control Actions Row */}
      <div className="flex items-center gap-4 text-xs font-semibold">
        <div className="flex items-center gap-3">
          {/* Skip Back */}
          <button 
            onClick={() => skip(-10)}
            className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <SkipBack size={16} />
          </button>

          {/* Main Play/Pause Button */}
          <button 
            onClick={handleTogglePlay}
            disabled={audioError}
            className={`w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-all shadow-md active:scale-95 ${
              audioError ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>

          {/* Skip Forward */}
          <button 
            onClick={() => skip(10)}
            className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <SkipForward size={16} />
          </button>

          {/* Timer text display */}
          <span className="font-mono text-sm text-gray-300 ml-2">
            {formatPlayerTime(currentTime)} / {formatPlayerTime(duration)}
          </span>
        </div>

        {/* Speed & Volume adjustments */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Speed Selector */}
          <select
            value={speed}
            onChange={(e) => handleSpeedChange(e.target.value)}
            disabled={audioError}
            className="bg-gray-800 text-gray-300 text-xs px-2.5 py-1 rounded-lg border border-gray-700 outline-none disabled:opacity-50"
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <Volume2 size={15} className="text-gray-400" />
            <input 
              type="range" 
              min={0} 
              max={100} 
              value={volume} 
              disabled={audioError}
              onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
              className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Error Fallback Banner */}
      {audioError && (
        <div className="text-xs text-red-400 mt-3 flex items-center gap-1.5 bg-red-950/40 p-2 rounded-lg border border-red-900/50">
          <AlertCircle size={14} />
          <span>Audio preview unavailable for this recording</span>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, Mic } from 'lucide-react'

export default function AudioPlayer({ recording }) {
  const recordingId = recording?.recordingId || '';

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState('1x');
  const [volume, setVolume] = useState(80);

  // Seeded waveform bar heights based on recordingId
  const waveHeights = useMemo(() => {
    return Array.from({ length: 80 }, (_, i) => {
      const seed = recordingId.charCodeAt(i % recordingId.length) || 65;
      return 20 + (seed % 60); // alternate heights between 20% and 80%
    });
  }, [recordingId]);

  // Playback timer simulation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= recording.duration) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, recording.duration]);

  // Reset timeline when recording selection shifts
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
  }, [recordingId]);

  function formatPlayerTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const playedFraction = currentTime / recording.duration;
  const playedBars = Math.floor(playedFraction * 80);
  const playedPct = (currentTime / recording.duration) * 100;

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleScrubberClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = clickX / rect.width;
    setCurrentTime(Math.min(recording.duration, Math.max(0, Math.floor(pct * recording.duration))));
  };

  return (
    <div className="bg-gray-900 rounded-xl p-5 text-gray-300 shadow-lg">
      {/* Top info row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-gray-400">
          <Mic size={14} />
          <span className="font-mono text-xs ml-1.5">{recordingId}</span>
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <span>Audio Player</span>
          <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded font-mono ml-2 uppercase">MP3</span>
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
            onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
            className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <SkipBack size={16} />
          </button>

          {/* Main Play/Pause Button */}
          <button 
            onClick={handleTogglePlay}
            className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-all shadow-md active:scale-95"
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>

          {/* Skip Forward */}
          <button 
            onClick={() => setCurrentTime(Math.min(recording.duration, currentTime + 10))}
            className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <SkipForward size={16} />
          </button>

          {/* Timer text display */}
          <span className="font-mono text-sm text-gray-300 ml-2">
            {formatPlayerTime(currentTime)} / {formatPlayerTime(recording.duration)}
          </span>
        </div>

        {/* Speed & Volume adjustments */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Speed Selector */}
          <select
            value={speed}
            onChange={(e) => setSpeed(e.target.value)}
            className="bg-gray-800 text-gray-300 text-xs px-2.5 py-1 rounded-lg border border-gray-700 outline-none"
          >
            <option value="0.5x">0.5x</option>
            <option value="0.75x">0.75x</option>
            <option value="1x">1x</option>
            <option value="1.25x">1.25x</option>
            <option value="1.5x">1.5x</option>
            <option value="2x">2x</option>
          </select>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <Volume2 size={15} className="text-gray-400" />
            <input 
              type="range" 
              min={0} 
              max={100} 
              value={volume} 
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, Maximize2, Minimize2, Music, Sparkles } from 'lucide-react';

export default function PomodoroTimer() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [customWork, setCustomWork] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioUrlRef = useRef<HTMLAudioElement | null>(null);

  // Sound generator using Web Audio API (No dependencies!)
  const playAlertSound = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      
      // Play a lovely double-tone chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      osc2.frequency.setValueAtTime(783.99, ctx.currentTime); // G5
      osc2.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.15); // C6

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.6);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.error('Audio Context chime failed:', e);
    }
  };

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            // Timer complete!
            playAlertSound();
            setIsActive(false);
            if (mode === 'work') {
              setMode('break');
              setMinutes(customBreak);
            } else {
              setMode('work');
              setMinutes(customWork);
            }
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, minutes, seconds, mode, customWork, customBreak]);

  const handleToggle = () => {
    // Unlock AudioContext for mobile browsers
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setMinutes(mode === 'work' ? customWork : customBreak);
    setSeconds(0);
  };

  const handlePreset = (workMins: number, breakMins: number) => {
    setIsActive(false);
    setCustomWork(workMins);
    setCustomBreak(breakMins);
    setMode('work');
    setMinutes(workMins);
    setSeconds(0);
  };

  // Music stream integration (curated royalty-free study/lo-fi audio stream)
  const toggleMusic = () => {
    if (!audioUrlRef.current) {
      // Free royalty free lofi music streams
      audioUrlRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
      audioUrlRef.current.loop = true;
      audioUrlRef.current.volume = 0.4;
    }

    if (isPlayingMusic) {
      audioUrlRef.current.pause();
    } else {
      audioUrlRef.current.play().catch(e => console.warn("Audio autoplay blocked, needs click"));
    }
    setIsPlayingMusic(!isPlayingMusic);
  };

  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        audioUrlRef.current.pause();
      }
    };
  }, []);

  const progressPercent = mode === 'work' 
    ? ((customWork * 60 - (minutes * 60 + seconds)) / (customWork * 60)) * 100 
    : ((customBreak * 60 - (minutes * 60 + seconds)) / (customBreak * 60)) * 100;

  return (
    <div className={`transition-all duration-500 ${isFocusMode ? 'fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-50 flex items-center justify-center p-6' : 'bg-[#0e1726]/40 backdrop-blur-md border border-white/5 rounded-2xl p-8 shadow-xl max-w-xl mx-auto'}`}>
      
      {/* Focus Mode Exit */}
      {isFocusMode && (
        <button
          onClick={() => setIsFocusMode(false)}
          className="absolute top-6 right-6 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-semibold text-slate-300 transition flex items-center gap-1.5 cursor-pointer"
        >
          <Minimize2 className="w-4 h-4" /> Exit Focus
        </button>
      )}

      <div className="space-y-6 text-center w-full max-w-sm mx-auto">
        
        {/* Mode titles */}
        <div className="space-y-1">
          <h2 className={`text-xl font-bold tracking-tight font-display ${mode === 'work' ? 'text-indigo-400' : 'text-emerald-400'}`}>
            {mode === 'work' ? 'Deep Work Session' : 'Relaxing Break'}
          </h2>
          <p className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
            {isActive ? 'Concentrating...' : 'Ready to start'}
          </p>
        </div>

        {/* Circular Display Layout */}
        <div className="relative w-56 h-56 mx-auto flex items-center justify-center">
          {/* Radial progress track */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="112"
              cy="112"
              r="95"
              stroke="rgba(255,255,255,0.02)"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="112"
              cy="112"
              r="95"
              stroke={mode === 'work' ? '#6366f1' : '#10b981'}
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={596.9}
              strokeDashoffset={596.9 - (596.9 * progressPercent) / 100}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>

          {/* Time digits */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black font-mono text-slate-100 tracking-tight">
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              Remaining
            </span>
          </div>
        </div>

        {/* Play/Control panel */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleReset}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 rounded-2xl transition cursor-pointer"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            id="timer-play-btn"
            onClick={handleToggle}
            className={`p-5 text-white rounded-3xl transition shadow-lg cursor-pointer active:scale-95 ${
              isActive 
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/10' 
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/15'
            }`}
          >
            {isActive ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 fill-white" />}
          </button>

          {!isFocusMode ? (
            <button
              onClick={() => setIsFocusMode(true)}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 rounded-2xl transition cursor-pointer"
              title="Full Focus Mode"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-11" /> // empty spacer
          )}
        </div>

        {/* Presets and Custom Inputs */}
        {!isFocusMode && (
          <div className="space-y-4 pt-4 border-t border-white/[0.06] font-display">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handlePreset(25, 5)}
                className="px-3 py-1.5 bg-slate-950/40 hover:bg-slate-900 border border-white/5 rounded-xl text-[10px] font-bold text-slate-300 transition cursor-pointer"
              >
                25/5 Standard
              </button>
              <button
                onClick={() => handlePreset(50, 10)}
                className="px-3 py-1.5 bg-slate-950/40 hover:bg-slate-900 border border-white/5 rounded-xl text-[10px] font-bold text-slate-300 transition cursor-pointer"
              >
                50/10 Deep Work
              </button>
            </div>

            {/* Custom Mode sliders */}
            <div className="grid grid-cols-2 gap-4 text-left font-mono">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 text-center">Work Length</label>
                <input
                  type="number"
                  value={customWork}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCustomWork(val);
                    if (mode === 'work') setMinutes(val);
                  }}
                  className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-center text-slate-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 text-center">Break Length</label>
                <input
                  type="number"
                  value={customBreak}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCustomBreak(val);
                    if (mode === 'break') setMinutes(val);
                  }}
                  className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-center text-slate-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Music Player widget */}
        <div className="p-3.5 rounded-2xl bg-indigo-950/10 border border-indigo-500/10 hover:border-indigo-500/20 transition flex items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400 shrink-0 ${isPlayingMusic ? 'animate-pulse' : ''}`}>
              <Music className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate font-display">Ambient Study Lofi</p>
              <p className="text-[10px] text-slate-400 font-sans">Royalty-free focus stream</p>
            </div>
          </div>

          <button
            onClick={toggleMusic}
            className={`px-3 py-1.5 border rounded-lg text-[9px] font-bold font-mono uppercase tracking-wider transition shrink-0 cursor-pointer ${
              isPlayingMusic 
                ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-600/20' 
                : 'bg-slate-850 text-slate-300 border-white/5 hover:bg-slate-800'
            }`}
          >
            {isPlayingMusic ? 'Mute' : 'Play Radio'}
          </button>
        </div>

      </div>
    </div>
  );
}

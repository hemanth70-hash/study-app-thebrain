import React, { useState, useEffect, useRef } from 'react';
import { Zap, Volume2, VolumeX, Coffee, X, Play, Pause, RotateCcw, Trash2 } from 'lucide-react';

// 🔥 FIX: Audio objects created OUTSIDE the component.
// This prevents them from being re-created on every render/drag event.
const AUDIO_TICK = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
const AUDIO_ALARM = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
const AUDIO_BELL = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

export default function GoalTracker({ isDarkMode }) {
  // --- CORE STATE ---
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('FOCUS'); // 'FOCUS' or 'BREAK'

  // --- BREAK SYSTEM ---
  const [breaks, setBreaks] = useState([]); 
  const [showBreakForm, setShowBreakForm] = useState(false);
  const [breakConfig, setBreakConfig] = useState({ afterMins: 30, durationMins: 5 });
  const [activeBreak, setActiveBreak] = useState(null);
  const [breakTimeLeft, setBreakTimeLeft] = useState(0);

  // --- AUDIO ENGINE ---
  const [soundEnabled, setSoundEnabled] = useState(true);
  const lastSoundTime = useRef(0); 

  // Max Scale: 24 Hours
  const MAX_SCALE_SECONDS = 24 * 3600; 

  // --- 1. MAIN TIMER ENGINE ---
  useEffect(() => {
    let interval = null;

    if (isActive && mode === 'FOCUS' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;

          // 🔥 BREAK INTERCEPTION
          const hitBreak = breaks.find(b => Math.abs(b.triggerAt - next) < 1 && !b.completed);
          
          if (hitBreak) {
            setIsActive(false); 
            setMode('BREAK');
            setActiveBreak(hitBreak);
            setBreakTimeLeft(hitBreak.duration);
            
            // 🔊 BREAK START: "TING TING"
            if (soundEnabled) {
              AUDIO_BELL.currentTime = 0;
              AUDIO_BELL.play().catch(() => {});
              setTimeout(() => {
                 AUDIO_BELL.currentTime = 0;
                 AUDIO_BELL.play().catch(() => {});
              }, 250);
            }
          }

          // 🔊 NORMAL TICK (Last 60s of Focus)
          if (soundEnabled && next <= 60 && next > 0) {
            AUDIO_TICK.currentTime = 0;
            AUDIO_TICK.play().catch(() => {});
          }

          return next;
        });
      }, 1000);

    } else if (timeLeft === 0 && isActive && mode === 'FOCUS') {
      setIsActive(false); 
      if (soundEnabled) AUDIO_ALARM.play().catch(() => {});
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, breaks, soundEnabled]);

  // --- 2. BREAK TIMER ENGINE (Silent until last 10s) ---
  useEffect(() => {
    let breakInterval = null;

    if (mode === 'BREAK' && breakTimeLeft > 0) {
      breakInterval = setInterval(() => {
        setBreakTimeLeft((prev) => {
          const next = prev - 1;

          // 🔊 WARNING: LAST 10 SECONDS "TING... TING..."
          if (soundEnabled && next <= 10 && next > 0) {
             AUDIO_BELL.currentTime = 0;
             AUDIO_BELL.play().catch(() => {});
          }
          
          return next;
        });
      }, 1000);
    } else if (mode === 'BREAK' && breakTimeLeft === 0) {
      // 🏁 BREAK OVER
      setMode('FOCUS');
      setIsActive(true);
      if (activeBreak) {
        setBreaks(prev => prev.map(b => b.id === activeBreak.id ? { ...b, completed: true } : b));
      }
      setActiveBreak(null);
      // Resume sound
      if (soundEnabled) AUDIO_ALARM.play().catch(() => {});
    }

    return () => clearInterval(breakInterval);
  }, [mode, breakTimeLeft, activeBreak, soundEnabled]);

  // --- ACTIONS ---
  const handleEditTime = (field, value) => {
    const val = parseInt(value) || 0;
    const current = formatTime(timeLeft);
    let newSeconds = 0;

    if (field === 'h') newSeconds = (val * 3600) + (current.m * 60) + current.s;
    if (field === 'm') newSeconds = (current.h * 3600) + (val * 60) + current.s;
    if (field === 's') newSeconds = (current.h * 3600) + (current.m * 60) + val;

    if (newSeconds > MAX_SCALE_SECONDS) newSeconds = MAX_SCALE_SECONDS;
    setTimeLeft(newSeconds);
  };

  const handleDrag = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = x / rect.width;
    
    // Scale: 24 Hours
    const newSeconds = Math.round(percent * MAX_SCALE_SECONDS);

    // 🔊 RAPID TICK SOUND (Zipper Effect)
    if (soundEnabled && Math.abs(newSeconds - timeLeft) > 60) {
      const now = Date.now();
      if (now - lastSoundTime.current > 40) { 
        AUDIO_TICK.currentTime = 0;
        AUDIO_TICK.play().catch(() => {});
        lastSoundTime.current = now;
      }
    }

    setTimeLeft(newSeconds);
  };

  const addBreak = () => {
    const startAfterSeconds = breakConfig.afterMins * 60;
    const triggerAt = timeLeft - startAfterSeconds;

    if (triggerAt <= 0) {
      alert("Error: Break must be within the current timer range.");
      return;
    }

    const newBreak = {
      id: Date.now(),
      triggerAt: triggerAt, 
      duration: breakConfig.durationMins * 60,
      completed: false
    };

    setBreaks([...breaks, newBreak]);
    setShowBreakForm(false);
  };

  const deleteBreak = (id) => {
    setBreaks(breaks.filter(b => b.id !== id));
  };

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return { h, m, s: sec };
  };

  const t = formatTime(timeLeft);
  const bt = formatTime(breakTimeLeft);

  // --- STYLES ---
  const theme = {
    bg: isDarkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-900',
    scaleBg: isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200',
    input: isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-200'
  };

  return (
    <div className={`p-6 rounded-[2rem] shadow-xl border-b-4 border-blue-600 h-full flex flex-col relative overflow-hidden transition-all duration-500 ${theme.bg}`}>
      
      {/* 🔥 FULL SCREEN REST OVERLAY */}
      {mode === 'BREAK' && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="p-6 bg-orange-500 rounded-full mb-6 shadow-[0_0_50px_orange] animate-pulse">
            <Coffee size={60} className="text-white" />
          </div>
          
          <h2 className="text-4xl font-black text-white uppercase tracking-[0.2em] mb-2">Rest Protocol Active</h2>
          <p className="text-orange-400 font-bold text-sm uppercase mb-10 tracking-widest">System Cooling Down...</p>
          
          {/* BIG BREAK TIMER */}
          <div className="text-8xl font-black text-white tabular-nums tracking-tighter mb-12 drop-shadow-2xl">
            {String(bt.m).padStart(2,'0')}:{String(bt.s).padStart(2,'0')}
          </div>

          <button 
            onClick={() => { setMode('FOCUS'); setIsActive(true); }}
            className="px-10 py-4 bg-white text-black font-black uppercase rounded-2xl hover:scale-105 hover:bg-orange-100 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          >
            Skip Break & Resume
          </button>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-blue-500">
          <Zap size={16} className={isActive ? "animate-pulse" : ""} />
          <span className="font-black uppercase tracking-widest text-[10px]">Study⌛Timer</span>
        </div>
        <button onClick={() => setSoundEnabled(!soundEnabled)} className="opacity-50 hover:opacity-100">
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      {/* ⏰ DIGITAL CLOCK (24H - Editable) */}
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="flex items-baseline gap-1 text-blue-600">
          {/* HOURS */}
          <div className="flex flex-col items-center">
            <input 
              type="number" 
              className={`w-20 text-center text-5xl font-black bg-transparent outline-none focus:text-blue-400 appearance-none m-0 p-0 leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
              value={String(t.h).padStart(2, '0')}
              onChange={(e) => handleEditTime('h', e.target.value)}
            />
            <span className="text-[9px] font-black opacity-30 uppercase">HRS</span>
          </div>
          <span className="text-3xl font-black opacity-20 relative -top-3">:</span>
          {/* MINUTES */}
          <div className="flex flex-col items-center">
            <input 
              type="number" 
              className={`w-20 text-center text-5xl font-black bg-transparent outline-none focus:text-blue-400 appearance-none m-0 p-0 leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
              value={String(t.m).padStart(2, '0')}
              onChange={(e) => handleEditTime('m', e.target.value)}
            />
            <span className="text-[9px] font-black opacity-30 uppercase">MIN</span>
          </div>
          <span className="text-3xl font-black opacity-20 relative -top-3">:</span>
          {/* SECONDS */}
          <div className="flex flex-col items-center">
            <input 
              type="number" 
              className={`w-20 text-center text-5xl font-black bg-transparent outline-none focus:text-blue-400 appearance-none m-0 p-0 leading-none ${isActive ? 'text-red-500' : 'text-slate-400'}`}
              value={String(t.s).padStart(2, '0')}
              onChange={(e) => handleEditTime('s', e.target.value)}
            />
            <span className="text-[9px] font-black opacity-30 uppercase">SEC</span>
          </div>
        </div>
      </div>

      {/* 📏 MECHANICAL SCALE (24H) */}
      <div className="py-4 relative group select-none">
        <div 
          className={`h-5 w-full rounded-full relative cursor-crosshair border overflow-hidden ${theme.scaleBg}`}
          onMouseDown={handleDrag}
          onMouseMove={(e) => e.buttons === 1 && handleDrag(e)}
        >
          {/* Ticks */}
          <div className="absolute inset-0 flex justify-between px-1 pointer-events-none z-0">
             {[...Array(24)].map((_, i) => <div key={i} className="w-[1px] h-full bg-slate-400/20" />)}
          </div>

          {/* Liquid Fill */}
          <div 
            className="h-full bg-gradient-to-r from-blue-700 to-cyan-500 transition-all duration-75 ease-out"
            style={{ width: `${(timeLeft / MAX_SCALE_SECONDS) * 100}%` }}
          />

          {/* 🟠 ORANGE BREAK MARKERS */}
          {breaks.map(b => {
             const pos = (b.triggerAt / MAX_SCALE_SECONDS) * 100;
             return (
               <div 
                 key={b.id}
                 className={`absolute top-0 bottom-0 w-1.5 ${b.completed ? 'bg-green-500' : 'bg-orange-500'} z-20 shadow-[0_0_10px_orange]`}
                 style={{ left: `${pos}%` }}
               />
             );
          })}

          {/* Handle */}
          <div 
             className="absolute top-0 bottom-0 w-1 bg-white border-x border-slate-300 z-30 shadow-[0_0_10px_white]"
             style={{ left: `${(timeLeft / MAX_SCALE_SECONDS) * 100}%` }}
          />
        </div>
      </div>

      {/* CONTROLS */}
      <div className="space-y-3 relative z-20">
        <div className="flex gap-2">
          <button 
            onClick={() => setIsActive(!isActive)}
            className={`flex-1 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 ${
              isActive ? 'bg-red-600 text-white shadow-red-500/30 shadow-lg' : 'bg-blue-600 text-white shadow-blue-500/30 shadow-lg'
            }`}
          >
            {isActive ? <><Pause size={16} fill="currentColor" /> PAUSE</> : <><Play size={16} fill="currentColor" /> START</>}
          </button>
          
          <button 
             onClick={() => setShowBreakForm(!showBreakForm)}
             className={`px-4 rounded-xl border-2 font-bold transition-colors ${showBreakForm ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-200 text-slate-400 hover:border-orange-400 hover:text-orange-500'}`}
          >
            <Coffee size={20} />
          </button>
          
          <button 
             onClick={() => { setTimeLeft(0); setIsActive(false); }}
             className="px-4 rounded-xl border-2 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-red-500 transition-colors"
          >
            <RotateCcw size={20} />
          </button>
        </div>

        {/* 🟠 BREAK CONFIG FORM */}
        {showBreakForm && (
          <div className={`p-4 rounded-xl border animate-in slide-in-from-bottom-2 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-orange-50 border-orange-200'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-[10px] font-black uppercase ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>Add Break Node</span>
              <button onClick={() => setShowBreakForm(false)}><X size={14} /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
               <div>
                 <label className="text-[9px] font-bold uppercase opacity-50 block mb-1">Start After (Mins)</label>
                 <input 
                   type="number" 
                   value={breakConfig.afterMins}
                   onChange={e => setBreakConfig({...breakConfig, afterMins: parseInt(e.target.value)})}
                   className={`w-full p-2 rounded-lg text-xs font-bold outline-none border ${theme.input}`}
                 />
               </div>
               <div>
                 <label className="text-[9px] font-bold uppercase opacity-50 block mb-1">Duration (Mins)</label>
                 <input 
                   type="number" 
                   value={breakConfig.durationMins}
                   onChange={e => setBreakConfig({...breakConfig, durationMins: parseInt(e.target.value)})}
                   className={`w-full p-2 rounded-lg text-xs font-bold outline-none border ${theme.input}`}
                 />
               </div>
            </div>
            
            <button 
              onClick={addBreak}
              className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              Insert Break
            </button>
          </div>
        )}

        {/* 🗑️ BREAK LIST */}
        {breaks.length > 0 && (
           <div className="flex flex-wrap gap-2 mt-1 max-h-16 overflow-y-auto custom-scrollbar">
             {breaks.map(b => (
               <div key={b.id} className="bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase px-2 py-1 rounded border border-slate-300 dark:border-slate-700 flex items-center gap-1 group">
                 <span className={b.completed ? "text-green-500 line-through opacity-50" : "text-orange-500"}>
                   {b.duration / 60}m Break
                 </span>
                 <button 
                  onClick={() => deleteBreak(b.id)} 
                  className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                  title="Delete Break"
                 >
                   <Trash2 size={10} />
                 </button>
               </div>
             ))}
           </div>
        )}
      </div>

    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { Zap, Volume2, VolumeX, Coffee, X, Play, Pause, RotateCcw, Trash2 } from 'lucide-react';

// --- 🔊 AUDIO CONFIGURATION ---
const AUDIO_TICK = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
const AUDIO_ALARM = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
const AUDIO_BELL = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
const AUDIO_RESET = new Audio('/sounds/reset%20sound.mp3'); 

const MAX_SCALE_SECONDS = 24 * 3600; 

// ============================================================================
// 🌍 GLOBAL BACKGROUND ENGINE (User-Isolated)
// ============================================================================
let bgInterval = null;
let currentUserId = null; // Dynamically set when component mounts
const subscribers = new Set();

const defaultState = {
  timeLeft: 0,
  isActive: false,
  mode: 'FOCUS',
  breaks: [],
  activeBreak: null,
  breakTimeLeft: 0,
  soundEnabled: true
};

// 1. Catch up missed time for the specific user
const catchUpTime = () => {
  if (!currentUserId) return;
  const prefix = `gt_${currentUserId}_`;
  const now = Date.now();
  const lastTick = parseInt(localStorage.getItem(prefix + 'lastTick') || now.toString());
  const wasActive = localStorage.getItem(prefix + 'isActive') === 'true';
  const mode = localStorage.getItem(prefix + 'mode') || 'FOCUS';
  
  if (wasActive && mode === 'FOCUS') {
    const savedTime = parseInt(localStorage.getItem(prefix + 'timeLeft') || '0');
    const passed = Math.floor((now - lastTick) / 1000);
    localStorage.setItem(prefix + 'timeLeft', Math.max(0, savedTime - passed).toString());
  } else if (mode === 'BREAK') {
    const savedBreakTime = parseInt(localStorage.getItem(prefix + 'breakTimeLeft') || '0');
    const passed = Math.floor((now - lastTick) / 1000);
    localStorage.setItem(prefix + 'breakTimeLeft', Math.max(0, savedBreakTime - passed).toString());
  }
  localStorage.setItem(prefix + 'lastTick', now.toString());
};

// 2. State Management Helpers (User-Isolated)
const getGlobalState = () => {
  if (!currentUserId) return defaultState;
  const prefix = `gt_${currentUserId}_`;
  
  return {
    timeLeft: parseInt(localStorage.getItem(prefix + 'timeLeft') || '0'),
    isActive: localStorage.getItem(prefix + 'isActive') === 'true',
    mode: localStorage.getItem(prefix + 'mode') || 'FOCUS',
    breaks: JSON.parse(localStorage.getItem(prefix + 'breaks') || '[]'),
    activeBreak: JSON.parse(localStorage.getItem(prefix + 'activeBreak') || 'null'),
    breakTimeLeft: parseInt(localStorage.getItem(prefix + 'breakTimeLeft') || '0'),
    soundEnabled: localStorage.getItem(prefix + 'soundEnabled') !== 'false'
  };
};

const setGlobalState = (updates) => {
  if (!currentUserId) return;
  const prefix = `gt_${currentUserId}_`;
  const next = { ...getGlobalState(), ...updates };
  
  localStorage.setItem(prefix + 'timeLeft', next.timeLeft.toString());
  localStorage.setItem(prefix + 'isActive', next.isActive.toString());
  localStorage.setItem(prefix + 'mode', next.mode);
  localStorage.setItem(prefix + 'breaks', JSON.stringify(next.breaks));
  localStorage.setItem(prefix + 'activeBreak', JSON.stringify(next.activeBreak));
  localStorage.setItem(prefix + 'breakTimeLeft', next.breakTimeLeft.toString());
  localStorage.setItem(prefix + 'soundEnabled', next.soundEnabled.toString());
  localStorage.setItem(prefix + 'lastTick', Date.now().toString());

  subscribers.forEach(cb => cb(next));
};

// 3. Background Engine Loop
const startBackgroundEngine = () => {
  if (bgInterval) return;
  
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }

  bgInterval = setInterval(() => {
    if (!currentUserId) return; // Do nothing if no user is set
    
    const state = getGlobalState();
    const isMockActive = localStorage.getItem('isMockActive') === 'true'; 
    const prefix = `gt_${currentUserId}_`;
    
    localStorage.setItem(prefix + 'lastTick', Date.now().toString());

    if (state.isActive && state.mode === 'FOCUS' && state.timeLeft > 0) {
      const nextTime = state.timeLeft - 1;
      const hitBreak = state.breaks.find(b => Math.abs(b.triggerAt - nextTime) < 1 && !b.completed);

      if (hitBreak) {
        if (state.soundEnabled) {
          AUDIO_BELL.currentTime = 0; AUDIO_BELL.play().catch(()=>{});
        }
        
        if (Notification.permission === 'granted') {
           if (isMockActive) {
             new Notification("Background Break Started", { body: "Your scheduled break hit, but you're in a Mock. Keep pushing!", icon: '/favicon.ico' });
           } else if (document.visibilityState === 'hidden') {
             new Notification("Rest Protocol Active", { body: "Time for a short rest. System cooling down.", icon: '/favicon.ico' });
           }
        }

        setGlobalState({
          isActive: false,
          mode: 'BREAK',
          activeBreak: hitBreak,
          breakTimeLeft: hitBreak.duration,
          timeLeft: nextTime
        });
      } else {
        if (state.soundEnabled && nextTime <= 60 && nextTime > 0) {
          AUDIO_TICK.currentTime = 0; AUDIO_TICK.play().catch(()=>{});
        }
        setGlobalState({ timeLeft: nextTime });
      }

    } else if (state.timeLeft <= 0 && state.isActive && state.mode === 'FOCUS') {
      setGlobalState({ isActive: false, timeLeft: 0 });
      if (state.soundEnabled) AUDIO_ALARM.play().catch(()=>{});
      if (Notification.permission === 'granted') {
         new Notification("Study Complete!", { body: "Neural Focus session ended." });
      }
    } 
    
    else if (state.mode === 'BREAK' && state.breakTimeLeft > 0) {
      const nextBreakTime = state.breakTimeLeft - 1;
      if (state.soundEnabled && nextBreakTime <= 10 && nextBreakTime > 0) {
        AUDIO_BELL.currentTime = 0; AUDIO_BELL.play().catch(()=>{});
      }
      setGlobalState({ breakTimeLeft: nextBreakTime });
    } 
    
    else if (state.mode === 'BREAK' && state.breakTimeLeft <= 0) {
      let updatedBreaks = state.breaks;
      if (state.activeBreak) {
        updatedBreaks = state.breaks.map(b => b.id === state.activeBreak.id ? { ...b, completed: true } : b);
      }
      if (state.soundEnabled) AUDIO_ALARM.play().catch(()=>{});
      if (Notification.permission === 'granted') {
         new Notification("Break Over", { body: "Time to get back to focus." });
      }
      setGlobalState({
        mode: 'FOCUS',
        isActive: true,
        breaks: updatedBreaks,
        activeBreak: null
      });
    }
  }, 1000);
};

// ============================================================================
// 🎨 REACT VIEW COMPONENT
// ============================================================================
export default function GoalTracker({ user, isDarkMode }) {
  
  // 🔥 Bind the background engine to the current user instantly on render
  if (user && user.id && user.id !== currentUserId) {
    currentUserId = user.id;
    catchUpTime();
    startBackgroundEngine();
  }

  const [state, setState] = useState(() => getGlobalState());
  const [showBreakForm, setShowBreakForm] = useState(false);
  const [breakConfig, setBreakConfig] = useState({ afterMins: 30, durationMins: 5 });
  const [showCelebration, setShowCelebration] = useState(false);
  
  const prevTimeRef = useRef(state.timeLeft);
  const lastSoundTime = useRef(0); 

  useEffect(() => {
    // Sync UI with global engine
    const handleUpdate = (newState) => {
      setState(newState);
      if (prevTimeRef.current > 0 && newState.timeLeft === 0 && newState.mode === 'FOCUS') {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 5000);
      }
      prevTimeRef.current = newState.timeLeft;
    };
    
    // Initial sync in case engine ticked before mount finished
    setState(getGlobalState());
    
    subscribers.add(handleUpdate);
    return () => subscribers.delete(handleUpdate);
  }, [user?.id]); // Re-sync if user changes

  const isMockActive = localStorage.getItem('isMockActive') === 'true';

  // --- ACTIONS ---
  const handleReset = () => {
    setGlobalState({
      timeLeft: 0,
      isActive: false,
      mode: 'FOCUS',
      activeBreak: null,
      breakTimeLeft: 0
    });
    
    if (state.soundEnabled) {
        AUDIO_RESET.currentTime = 0;
        AUDIO_RESET.play().catch(e => console.log("Reset sound error:", e));
    }
  };

  const handleEditTime = (field, value) => {
    let val = parseInt(value);
    if (isNaN(val)) val = 0;

    const current = formatTime(state.timeLeft);
    let newSeconds = 0;

    if (field === 'h') newSeconds = (val * 3600) + (current.m * 60) + current.s;
    if (field === 'm') newSeconds = (current.h * 3600) + (val * 60) + current.s;
    if (field === 's') newSeconds = (current.h * 3600) + (current.m * 60) + val;

    if (newSeconds > MAX_SCALE_SECONDS) newSeconds = MAX_SCALE_SECONDS;
    setGlobalState({ timeLeft: newSeconds });
  };

  const handleDrag = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = x / rect.width;
    const newSeconds = Math.round(percent * MAX_SCALE_SECONDS);

    if (state.soundEnabled && Math.abs(newSeconds - state.timeLeft) > 60) {
      const now = Date.now();
      if (now - lastSoundTime.current > 40) { 
        AUDIO_TICK.currentTime = 0;
        AUDIO_TICK.play().catch(() => {});
        lastSoundTime.current = now;
      }
    }
    setGlobalState({ timeLeft: newSeconds });
  };

  const addBreak = () => {
    const startAfterSeconds = (parseInt(breakConfig.afterMins) || 0) * 60;
    const triggerAt = state.timeLeft - startAfterSeconds;

    if (triggerAt <= 0) {
      alert("Error: Break must be within the current timer range.");
      return;
    }

    const newBreak = {
      id: Date.now(),
      triggerAt: triggerAt, 
      duration: (parseInt(breakConfig.durationMins) || 5) * 60,
      completed: false
    };

    setGlobalState({ breaks: [...state.breaks, newBreak] });
    setShowBreakForm(false);
  };

  const deleteBreak = (id) => {
    setGlobalState({ breaks: state.breaks.filter(b => b.id !== id) });
  };

  const formatTime = (s) => {
    if (isNaN(s)) return { h: 0, m: 0, s: 0 };
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return { h, m, s: sec };
  };

  const t = formatTime(state.timeLeft);
  const bt = formatTime(state.breakTimeLeft);

  const theme = {
    bg: isDarkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-900',
    scaleBg: isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200',
    input: isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-200'
  };

  return (
    <div className={`p-6 rounded-[2rem] shadow-xl border-b-4 border-blue-600 h-full flex flex-col relative overflow-hidden transition-all duration-500 ${theme.bg}`}>
      
      {/* 🎉 CELEBRATION POPUP */}
      {showCelebration && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in zoom-in duration-300">
           <div className="text-6xl mb-4 animate-bounce">🎉</div>
           <h2 className="text-3xl font-black text-white uppercase tracking-tighter text-center">Study Complete!</h2>
           <p className="text-green-400 font-bold uppercase tracking-widest text-xs mt-2">Neural Focus Updated</p>
           <button 
             onClick={() => setShowCelebration(false)}
             className="mt-8 bg-white text-black px-8 py-3 rounded-xl font-black uppercase text-xs hover:scale-105 transition-transform"
           >
             Continue
           </button>
        </div>
      )}

      {/* 🔥 FULL SCREEN REST OVERLAY (Hides if Mock is active) */}
      {state.mode === 'BREAK' && !isMockActive && (
        <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-500 rounded-[2rem]">
          <div className="p-6 bg-orange-500 rounded-full mb-6 shadow-[0_0_50px_orange] animate-pulse">
            <Coffee size={60} className="text-white" />
          </div>
          
          <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em] mb-2 text-center">Rest Protocol Active</h2>
          <p className="text-orange-400 font-bold text-xs uppercase mb-8 tracking-widest">System Cooling Down...</p>
          
          {/* BIG BREAK TIMER */}
          <div className="text-7xl font-black text-white tabular-nums tracking-tighter mb-10 drop-shadow-2xl">
            {String(bt.m).padStart(2,'0')}:{String(bt.s).padStart(2,'0')}
          </div>

          <button 
            onClick={() => setGlobalState({ mode: 'FOCUS', isActive: true })}
            className="px-8 py-3 bg-white text-black font-black uppercase text-xs rounded-xl hover:scale-105 hover:bg-orange-100 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          >
            Skip Break
          </button>
        </div>
      )}

      {/* 🚀 MOCK ENGINE BREAK NOTIFICATION TOAST */}
      {state.mode === 'BREAK' && isMockActive && (
        <div className="absolute top-2 left-2 right-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-3 shadow-xl z-50 flex justify-between items-center animate-in slide-in-from-top-2">
          <div>
            <p className="text-white text-[10px] font-black uppercase tracking-widest opacity-80">Background Break Active</p>
            <p className="text-white font-bold text-xs">Don't lose focus on your mock.</p>
          </div>
          <div className="text-white text-xl font-black tabular-nums">
            {String(bt.m).padStart(2,'0')}:{String(bt.s).padStart(2,'0')}
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-blue-500">
          <Zap size={16} className={state.isActive ? "animate-pulse" : ""} />
          <span className="font-black uppercase tracking-widest text-[10px]">Study⌛Timer</span>
        </div>
        <button onClick={() => setGlobalState({ soundEnabled: !state.soundEnabled })} className="opacity-50 hover:opacity-100 transition-opacity">
          {state.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
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
              className={`w-20 text-center text-5xl font-black bg-transparent outline-none focus:text-blue-400 appearance-none m-0 p-0 leading-none ${state.isActive ? 'text-red-500' : 'text-slate-400'}`}
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
            style={{ width: `${MAX_SCALE_SECONDS > 0 ? (state.timeLeft / MAX_SCALE_SECONDS) * 100 : 0}%` }}
          />

          {/* 🟠 ORANGE BREAK MARKERS */}
          {state.breaks.map(b => {
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
              style={{ left: `${MAX_SCALE_SECONDS > 0 ? (state.timeLeft / MAX_SCALE_SECONDS) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* CONTROLS */}
      <div className="space-y-3 relative z-20">
        <div className="flex gap-2">
          <button 
            onClick={() => setGlobalState({ isActive: !state.isActive })}
            className={`flex-1 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 ${
              state.isActive ? 'bg-red-600 text-white shadow-red-500/30 shadow-lg' : 'bg-blue-600 text-white shadow-blue-500/30 shadow-lg'
            }`}
          >
            {state.isActive ? <><Pause size={16} fill="currentColor" /> PAUSE</> : <><Play size={16} fill="currentColor" /> START</>}
          </button>
          
          <button 
              onClick={() => setShowBreakForm(!showBreakForm)}
              className={`px-4 rounded-xl border-2 font-bold transition-colors ${showBreakForm ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-200 text-slate-400 hover:border-orange-400 hover:text-orange-500'}`}
          >
            <Coffee size={20} />
          </button>
          
          <button 
              onClick={handleReset}
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
                   onChange={e => setBreakConfig({...breakConfig, afterMins: parseInt(e.target.value) || 0})}
                   className={`w-full p-2 rounded-lg text-xs font-bold outline-none border ${theme.input}`}
                 />
               </div>
               <div>
                 <label className="text-[9px] font-bold uppercase opacity-50 block mb-1">Duration (Mins)</label>
                 <input 
                   type="number" 
                   value={breakConfig.durationMins}
                   onChange={e => setBreakConfig({...breakConfig, durationMins: parseInt(e.target.value) || 0})}
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
        {state.breaks.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1 max-h-16 overflow-y-auto custom-scrollbar">
              {state.breaks.map(b => (
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
import React, { useState, useRef, useEffect } from 'react';

// --- ICONS (Raw SVG to avoid dependencies) ---
const ClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);
const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);
const PauseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <rect x="6" y="4" width="4" height="16"></rect>
    <rect x="14" y="4" width="4" height="16"></rect>
  </svg>
);
const CoffeeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
    <line x1="6" y1="1" x2="6" y2="4"></line>
    <line x1="10" y1="1" x2="10" y2="4"></line>
    <line x1="14" y1="1" x2="14" y2="4"></line>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

export default function PixelGarden({ isMockActive = false }) { 
  // --- STATE ---
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  
  const [isActive, setIsActive] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Break System State
  const [breakAt, setBreakAt] = useState(null); // Triggers when TOTAL remaining minutes == this
  const [breakDuration, setBreakDuration] = useState(5); 
  const [showBreakInput, setShowBreakInput] = useState(false);
  const [isBreakActive, setIsBreakActive] = useState(false); 
  const [breakTimeLeft, setBreakTimeLeft] = useState(0); 

  // Refs
  const trackRef = useRef(null);
  const timerRef = useRef(null);
  const breakTimerRef = useRef(null);
  const audioCtx = useRef(null);
  const lastTickX = useRef(0);

  // --- AUDIO ENGINE ---
  const playSound = (type) => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtx.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'tick') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start(); osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'alarm') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
      osc.start(); osc.stop(ctx.currentTime + 1);
    }
    osc.connect(gain); gain.connect(ctx.destination);
  };

  // --- DRAG HANDLERS ---
  const updatePosition = (clientX) => {
    if (!trackRef.current || isMockActive) return;
    const rect = trackRef.current.getBoundingClientRect();
    const width = rect.width;
    const offsetX = Math.max(0, Math.min(clientX - rect.left, width));
    
    setDragX(offsetX);
    
    // Scale: Full Width = 240 Minutes (4 Hours)
    const totalMinutes = Math.round((offsetX / width) * 240);
    
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    
    setHours(h);
    setMinutes(m);
    setSeconds(0);

    // Tick Sound every ~10px
    if (Math.abs(offsetX - lastTickX.current) > 10) {
      playSound('tick');
      lastTickX.current = offsetX;
    }
  };

  const handleMouseDown = (e) => { if(!isActive && !isMockActive) { setIsDragging(true); updatePosition(e.clientX); } };
  
  useEffect(() => {
    const onMove = (e) => isDragging && updatePosition(e.clientX);
    const onUp = () => {
       if(isDragging) {
         setIsDragging(false);
         const totalSec = (hours * 3600) + (minutes * 60);
         if(totalSec > 0) setIsActive(false); 
       }
    };
    if(isDragging) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, hours, minutes]);


  // --- MAIN TIMER LOGIC ---
  useEffect(() => {
    if (isActive && !isBreakActive && !isMockActive) {
      timerRef.current = setInterval(() => {
        // Calculate Total Remaining Seconds
        let totalSeconds = (hours * 3600) + (minutes * 60) + seconds;

        if (totalSeconds > 0) {
           // CHECK BREAK TRIGGER
           // Calculate total remaining minutes for break check
           const totalRemainingMins = (hours * 60) + minutes;
           
           // Only trigger if we are exactly at the start of that minute (seconds == 0) 
           // and we haven't already triggered it this minute.
           if (breakAt && totalRemainingMins === parseInt(breakAt) && seconds === 0) {
              triggerBreak();
           } else {
              totalSeconds--;
              
              // Convert back to H:M:S
              const h = Math.floor(totalSeconds / 3600);
              const m = Math.floor((totalSeconds % 3600) / 60);
              const s = totalSeconds % 60;
              
              setHours(h);
              setMinutes(m);
              setSeconds(s);
           }
        } else {
           clearInterval(timerRef.current);
           finishMainTimer();
        }
      }, 1000); 
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, isBreakActive, hours, minutes, seconds, breakAt, isMockActive]);

  // Sync Drag Bar Position with Timer
  useEffect(() => {
    if (isActive && trackRef.current) {
        const totalSecs = (hours * 3600) + (minutes * 60) + seconds;
        const maxSecs = 240 * 60; // 4 Hours Max
        const pct = Math.min(1, totalSecs / maxSecs);
        setDragX(pct * trackRef.current.offsetWidth);
    }
  }, [hours, minutes, seconds, isActive]);


  // --- BREAK LOGIC ---
  const triggerBreak = () => {
     setIsActive(false); 
     setIsBreakActive(true);
     setBreakTimeLeft(breakDuration * 60);
     playSound('alarm');
  };

  useEffect(() => {
    if (isBreakActive && breakTimeLeft > 0) {
       breakTimerRef.current = setInterval(() => {
          setBreakTimeLeft((prev) => prev - 1);
       }, 1000);
    } else if (isBreakActive && breakTimeLeft === 0) {
       clearInterval(breakTimerRef.current);
       playSound('alarm');
       setIsBreakActive(false);
       setBreakAt(null); 
       setIsActive(true); 
    }
    return () => clearInterval(breakTimerRef.current);
  }, [isBreakActive, breakTimeLeft]);


  // --- HELPERS ---
  const toggleTimer = () => {
    const totalSec = (hours * 3600) + (minutes * 60) + seconds;
    if (totalSec > 0) setIsActive(!isActive);
  };
  
  const finishMainTimer = () => {
     setIsActive(false);
     playSound('alarm');
     alert("SESSION COMPLETE! GREAT JOB!");
  };

  const saveBreak = () => {
     setShowBreakInput(false);
  };

  const clearBreaks = () => {
    setBreakAt(null);
    setShowBreakInput(false);
  };

  // --- RENDER ---
  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative select-none">
      
      {/* HEADER ROW */}
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-xl font-bold text-white flex items-center gap-2">
           <span className="text-cyan-400">⚡</span> CHRONOS CONTROL
         </h2>
         
         {/* Break Settings */}
         {!isActive && !isMockActive && (
           <div className="relative">
             <button 
               onClick={() => setShowBreakInput(!showBreakInput)}
               className={`text-xs font-bold px-3 py-1 rounded border transition flex items-center gap-2
                 ${breakAt ? 'bg-amber-600 text-white border-amber-500' : 'text-amber-500 bg-amber-900/30 border-amber-800 hover:bg-amber-900/50'}
               `}
             >
               {breakAt ? `BREAK @ ${breakAt}m LEFT` : '+ ADD BREAK'}
             </button>
             
             {showBreakInput && (
               <div className="absolute right-0 top-8 w-48 bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl z-50">
                  <div className="text-xs text-slate-400 mb-1">Pause when time left is (mins):</div>
                  <input type="number" className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 mb-2 text-sm" 
                    placeholder="e.g. 15" 
                    onChange={(e) => setBreakAt(e.target.value)}
                    value={breakAt || ''}
                  />
                  <div className="text-xs text-slate-400 mb-1">Duration (mins):</div>
                  <input type="number" className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 mb-2 text-sm" 
                    defaultValue={5}
                    onChange={(e) => setBreakDuration(e.target.value)}
                  />
                  
                  {/* BUTTON GROUP */}
                  <div className="flex gap-2 mt-2">
                    <button onClick={saveBreak} className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs py-1 rounded font-bold">
                      SET
                    </button>
                    <button onClick={clearBreaks} className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs py-1 rounded font-bold flex items-center justify-center gap-1">
                      <TrashIcon /> CLEAR
                    </button>
                  </div>
               </div>
             )}
           </div>
         )}
      </div>

      {/* MOCK MODE BLOCKER */}
      {isMockActive ? (
        <div className="absolute inset-0 z-40 bg-slate-900/90 flex flex-col items-center justify-center rounded-2xl">
           <div className="text-4xl animate-pulse mb-2">🔒</div>
           <div className="text-slate-400 font-mono tracking-widest text-sm uppercase">Timer Idle</div>
           <div className="text-cyan-500 font-bold text-lg mt-1">MOCK TEST ACTIVE</div>
        </div>
      ) : null}


      {/* MAIN CONTROL AREA */}
      <div className="flex flex-col md:flex-row gap-6 items-center">
        
        {/* 1. SLIDER (0 - 4 Hours) */}
        <div className="flex-1 w-full relative h-12 flex items-center group" ref={trackRef}>
            {/* Background */}
            <div className="absolute w-full h-3 bg-slate-600 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-cyan-500 transition-all duration-100 ease-linear"
                 style={{ width: `${dragX}px` }}
               />
            </div>
            
            {/* Hour Markers (Ticks every hour) */}
            <div className="absolute w-full h-full pointer-events-none flex justify-between px-1">
               {[0, 1, 2, 3, 4].map(h => (
                 <div key={h} className="relative h-full flex flex-col items-center justify-center pt-8 opacity-50">
                    <div className="w-0.5 h-2 bg-slate-400"></div>
                    <span className="text-[10px] text-slate-400 font-mono mt-1">{h}h</span>
                 </div>
               ))}
            </div>

            {/* Break Marker */}
            {breakAt && (
               <div 
                 className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-amber-500 z-10 rounded-full"
                 // Calculate percentage based on 240 mins max
                 style={{ left: `${(parseInt(breakAt) / 240) * 100}%` }}
                 title={`Break at ${breakAt}m remaining`}
               />
            )}

            {/* Knob */}
            <div 
              onMouseDown={handleMouseDown}
              className={`absolute top-1/2 -translate-y-1/2 -ml-5 w-10 h-10 bg-slate-800 border-2 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg z-20 transition-colors
                ${isActive ? 'border-cyan-400' : 'border-white hover:border-cyan-300'}
              `}
              style={{ left: `${dragX}px` }}
            >
               <ClockIcon />
            </div>
        </div>

        {/* 2. DIGITAL DISPLAY (HH:MM:SS) */}
        <div className="w-full md:w-48 h-24 bg-gradient-to-br from-amber-900/40 to-orange-900/20 border border-amber-800/50 rounded-xl flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="text-xs font-bold text-amber-500/80 uppercase tracking-widest mb-1">Time Remaining</div>
            <div className="text-3xl font-black text-white font-mono tracking-tighter">
              {hours < 10 ? `0${hours}` : hours}:{minutes < 10 ? `0${minutes}` : minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </div>
            
            {!isMockActive && (hours > 0 || minutes > 0 || seconds > 0) && (
              <button 
                onClick={toggleTimer}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                {isActive ? <PauseIcon /> : <PlayIcon />}
              </button>
            )}
        </div>
      </div>

      {/* BREAK POPUP */}
      {isBreakActive && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 border-4 border-amber-600 animate-in zoom-in duration-300">
           <CoffeeIcon />
           <h2 className="text-2xl font-black text-amber-500 mt-2">BREAK TIME</h2>
           <p className="text-slate-400 text-sm mb-4">Recharge your neurons!</p>
           <div className="text-5xl font-mono text-white mb-6">
              {Math.floor(breakTimeLeft / 60)}:{breakTimeLeft % 60 < 10 ? '0' : ''}{breakTimeLeft % 60}
           </div>
           <button 
             onClick={() => { setIsBreakActive(false); setIsActive(true); }}
             className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-600 text-xs font-bold uppercase tracking-widest"
           >
             Skip Break
           </button>
        </div>
      )}

    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';

// --- ICONS (Raw SVG to avoid installing lucide-react) ---
const ClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const ZapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

export default function PixelGarden() {
  const [minutes, setMinutes] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [cheer, setCheer] = useState(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const trackRef = useRef(null);
  const audioCtx = useRef(null);
  const lastTickX = useRef(0);
  const timerRef = useRef(null);

  // --- AUDIO ENGINE ---
  const playSound = (type) => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtx.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'tick') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }
    osc.connect(gain);
    gain.connect(ctx.destination);
  };

  // --- MOUSE/TOUCH HANDLERS ---
  const handleStart = (clientX) => {
    if (isActive) return;
    setIsDragging(true);
    updatePosition(clientX);
  };

  const handleMove = (clientX) => {
    if (!isDragging) return;
    updatePosition(clientX);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (minutes > 0) {
      startTimer();
    } else {
      setDragX(0); // Snap back
    }
  };

  const updatePosition = (clientX) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const width = rect.width;
    
    // Clamp between 0 and width
    let newX = Math.max(0, Math.min(offsetX, width));
    setDragX(newX);
    
    // Calculate minutes (0 to 60)
    const pct = newX / width;
    setMinutes(Math.round(pct * 60));

    // Tick Sound
    if (Math.abs(newX - lastTickX.current) > 10) {
      playSound('tick');
      lastTickX.current = newX;
    }
  };

  // --- TIMER LOGIC ---
  const startTimer = () => {
    setIsActive(true);
    // DEMO SPEED: 1 second = 1 minute.
    // TO FIX: Change `minutes * 1000` to `minutes * 60000` for real minutes.
    const totalDuration = minutes * 1000; 
    const startTime = Date.now();
    const startX = dragX;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = 1 - (elapsed / totalDuration);
      
      if (remainingPct <= 0) {
        clearInterval(timerRef.current);
        finishTimer();
      } else {
        setDragX(Math.max(0, startX * remainingPct));
        // Update minute display based on visual position
        if(trackRef.current) {
             const currentMins = Math.ceil((startX * remainingPct / trackRef.current.offsetWidth) * 60);
             setMinutes(currentMins);
        }
      }
    }, 16); // ~60 FPS
  };

  const finishTimer = () => {
    setDragX(0);
    setMinutes(0);
    setIsActive(false);
    playSound('success');
    setCheer("FOCUS COMPLETE! 🚀");
    setTimeout(() => setCheer(null), 3000);
  };

  // Global event listeners for drag release outside component
  useEffect(() => {
    const onUp = () => handleEnd();
    const onMove = (e) => isDragging && handleMove(e.clientX);
    const onTouchMove = (e) => isDragging && handleMove(e.touches[0].clientX);

    if (isDragging) {
      window.addEventListener('mouseup', onUp);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('touchend', onUp);
      window.addEventListener('touchmove', onTouchMove);
    }
    return () => {
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchend', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      clearInterval(timerRef.current);
    };
  }, [isDragging]);

  return (
    <div 
      className="relative w-full h-48 bg-slate-900 rounded-xl overflow-hidden border-4 border-slate-800 mt-6 select-none shadow-[0_0_40px_rgba(14,165,233,0.15)] flex flex-col items-center justify-center p-6"
      style={{ fontFamily: 'monospace' }}
    >
      
      {/* GLOW BACKGROUND */}
      <div className={`absolute inset-0 bg-cyan-900/20 pointer-events-none transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`} />

      {/* INSTRUCTIONS */}
      {!isActive && minutes === 0 && (
        <div className="absolute top-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">
          Drag to Set Timer
        </div>
      )}

      {/* TRACK */}
      <div 
        ref={trackRef}
        className="relative w-full h-16 flex items-center z-10 cursor-pointer"
        onMouseDown={(e) => handleStart(e.clientX)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      >
        {/* Gray Line */}
        <div className="absolute w-full h-3 bg-slate-700 rounded-full overflow-hidden">
           {/* Colored Fill */}
           <div 
             className={`h-full transition-colors duration-300 ${isActive ? 'bg-green-500' : 'bg-cyan-500'}`} 
             style={{ width: `${dragX}px` }} 
           />
        </div>

        {/* Ticks */}
        <div className="absolute w-full flex justify-between px-2 pointer-events-none">
           {[0, 15, 30, 45, 60].map((m) => (
             <div key={m} className="flex flex-col items-center gap-2">
                <div className="w-0.5 h-4 bg-slate-500"></div>
                <span className="text-[9px] text-slate-500 font-bold">{m}</span>
             </div>
           ))}
        </div>

        {/* DRAGGABLE KNOB */}
        <div 
          className={`absolute top-1/2 -ml-6 w-12 h-12 rounded-full border-4 shadow-xl flex items-center justify-center z-20 transition-transform duration-75
            ${isActive ? 'bg-green-500 border-green-300 scale-100' : 'bg-cyan-500 border-cyan-200 hover:scale-110'}
          `}
          style={{ left: `${dragX}px`, transform: 'translateY(-50%)' }}
        >
          {isActive ? (
             <div className="animate-spin duration-1000"><ZapIcon /></div>
          ) : (
             <ClockIcon />
          )}
        </div>
      </div>

      {/* DIGITAL DISPLAY */}
      <div className="mt-6 flex flex-col items-center z-10">
        <div className={`text-5xl font-black tracking-tighter transition-colors duration-300 ${isActive ? 'text-green-400' : 'text-white'}`}>
           {minutes < 10 ? `0${minutes}` : minutes}:00
        </div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
           {isActive ? 'Unwinding...' : 'Minutes'}
        </div>
      </div>

      {/* CHEER POPUP */}
      {cheer && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
           <div className="mb-4"><CheckIcon /></div>
           <h2 className="text-3xl font-black text-white italic">{cheer}</h2>
        </div>
      )}

    </div>
  );
}
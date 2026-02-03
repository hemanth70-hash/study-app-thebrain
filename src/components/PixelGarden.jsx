import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { Clock, Zap, CheckCircle2 } from 'lucide-react';

export default function PixelGarden() {
  const [minutes, setMinutes] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [cheer, setCheer] = useState(null);
  
  // Motion Values
  const x = useMotionValue(0);
  const constraintsRef = useRef(null);
  const lastTickX = useRef(0);
  const audioCtx = useRef(null);

  // --- 1. AUDIO ENGINE (The "Tick" Sound) ---
  const playSound = (type) => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtx.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'tick') {
      // Mechanical Click
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else {
      // Success Chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }
    
    osc.connect(gain);
    gain.connect(ctx.destination);
  };

  // --- 2. DRAG HANDLER ---
  const handleDrag = () => {
    const currentX = x.get();
    const width = constraintsRef.current ? constraintsRef.current.offsetWidth : 300;
    
    // Map position to minutes (0px = 0min, Full Width = 60min)
    const progress = Math.max(0, Math.min(currentX / width, 1));
    const newMinutes = Math.round(progress * 60);
    setMinutes(newMinutes);

    // Play tick sound every 10 pixels
    if (Math.abs(currentX - lastTickX.current) > 10) {
      playSound('tick');
      lastTickX.current = currentX;
    }
  };

  const handleDragEnd = () => {
    if (minutes > 0) {
      startTimer();
    } else {
      // Snap back if 0
      animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  };

  // --- 3. TIMER LOGIC (Unwinding) ---
  const startTimer = () => {
    setIsActive(true);
    
    // For demo: 1 real second = 1 timer minute. 
    // To make it real time, change (minutes * 1) to (minutes * 60)
    const duration = minutes * 1; 

    animate(x, 0, {
      duration: duration,
      ease: "linear",
      onUpdate: (latest) => {
        const width = constraintsRef.current ? constraintsRef.current.offsetWidth : 1;
        setMinutes(Math.ceil((latest / width) * 60));
      },
      onComplete: () => {
        setIsActive(false);
        setMinutes(0);
        finishTimer();
      }
    });
  };

  const finishTimer = () => {
    playSound('success');
    setCheer("FOCUS COMPLETE! 🚀");
    setTimeout(() => setCheer(null), 3000);
  };

  // --- VISUAL TRANSFORMS ---
  const bg = useTransform(x, [0, 300], ["#1e293b", "#0f172a"]);
  const barColor = useTransform(x, [0, 300], ["#334155", "#0ea5e9"]);
  const glow = useTransform(x, [0, 300], [0, 1]);

  return (
    <motion.div 
      style={{ backgroundColor: bg }}
      className="relative w-full h-48 rounded-xl overflow-hidden border-4 border-slate-800 mt-6 select-none shadow-2xl flex flex-col items-center justify-center p-6"
    >
      {/* GLOW EFFECT */}
      <motion.div style={{ opacity: glow }} className="absolute inset-0 bg-cyan-900/20 z-0 pointer-events-none" />

      {/* INSTRUCTIONS */}
      {!isActive && minutes === 0 && (
        <div className="absolute top-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">
          Drag to Set Timer
        </div>
      )}

      {/* TRACK */}
      <div className="relative w-full h-16 flex items-center z-10" ref={constraintsRef}>
        {/* Gray Line */}
        <div className="absolute w-full h-3 bg-slate-700 rounded-full overflow-hidden">
           {/* Colored Fill */}
           <motion.div style={{ width: x, backgroundColor: barColor }} className="h-full" />
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

        {/* DRAGGABLE HANDLE */}
        <motion.div
          drag={isActive ? false : "x"} // No dragging while running
          dragConstraints={constraintsRef}
          dragElastic={0.05}
          dragMomentum={false}
          style={{ x }}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          whileHover={{ scale: 1.1, cursor: "grab" }}
          whileTap={{ scale: 0.95, cursor: "grabbing" }}
          className={`absolute top-1/2 -translate-y-1/2 -ml-6 w-12 h-12 rounded-full border-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center z-20 transition-colors
            ${isActive ? 'bg-green-500 border-green-300' : 'bg-cyan-500 border-cyan-200'}
          `}
        >
          {isActive ? (
             <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                <Zap size={20} className="text-white fill-white" />
             </motion.div>
          ) : (
             <Clock size={24} className="text-white" />
          )}
        </motion.div>
      </div>

      {/* DIGITAL DISPLAY */}
      <div className="mt-6 flex flex-col items-center z-10">
        <div className={`text-5xl font-black font-mono tracking-tighter ${isActive ? 'text-green-400' : 'text-white'}`}>
           {minutes < 10 ? `0${minutes}` : minutes}:00
        </div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
           {isActive ? 'Unwinding...' : 'Minutes'}
        </div>
      </div>

      {/* CHEER POPUP */}
      <AnimatePresence>
        {cheer && (
          <motion.div 
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-center"
          >
             <CheckCircle2 size={60} className="text-green-400 mb-4" />
             <h2 className="text-3xl font-black text-white italic">{cheer}</h2>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
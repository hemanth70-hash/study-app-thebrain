import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Clock, CheckCircle2, Zap, Trophy, Sparkles } from 'lucide-react';

// =======================================================
// 1. AUDIO ENGINE (Synthetic Tick)
// =======================================================
// Short, crisp mechanical click sound (Base64 to avoid file issues)
const TICK_SOUND = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; // Placeholder, using Web Audio API below for better control

const CHEERS = [
  "You crushed it! 🚀",
  "Focus Master! 🧠",
  "Time well spent! ⏳",
  "Victory is yours! 🏆",
  "Brain gains! 💪",
  "Zone Unlocked! 🔓"
];

export default function PixelGarden() {
  const [isDragging, setIsDragging] = useState(false);
  const [minutes, setMinutes] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [showCheer, setShowCheer] = useState(null);
  
  // Motion Values for smooth dragging
  const x = useMotionValue(0);
  const widthRef = useRef(null);
  const constraintsRef = useRef(null);
  
  // Audio Refs
  const audioContextRef = useRef(null);
  const lastTickPos = useRef(0);

  // --- 1. SOUND ENGINE (Web Audio API) ---
  const playTick = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  };

  const playSuccess = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  // --- 2. DRAG LOGIC ---
  const handleDrag = (_, info) => {
    const currentX = x.get();
    
    // Calculate 1-60 minutes based on width (approx 300px = 60mins)
    const maxW = constraintsRef.current?.offsetWidth || 300;
    const progress = Math.max(0, Math.min(currentX / maxW, 1));
    const mins = Math.round(progress * 60);
    setMinutes(mins);

    // TICK SOUND LOGIC: Play tick every 10 pixels moved
    if (Math.abs(currentX - lastTickPos.current) > 10) {
      playTick();
      lastTickPos.current = currentX;
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (minutes > 0) {
      setIsActive(true);
      startTimer();
    } else {
      // Snap back if 0
      animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  };

  // --- 3. TIMER LOGIC (The "Resting Back") ---
  const startTimer = () => {
    // We animate the 'x' value back to 0 over the duration of 'minutes'
    // For demo purposes, I'll speed it up (1 second = 1 real minute) so you can test it.
    // CHANGE 'minutes * 1' to 'minutes * 60' for real-time minutes.
    const durationInSeconds = minutes * 1; // currently 1 sec per minute for testing
    
    animate(x, 0, {
      duration: durationInSeconds,
      ease: "linear",
      onUpdate: (latest) => {
        const maxW = constraintsRef.current?.offsetWidth || 1;
        const progress = Math.max(0, Math.min(latest / maxW, 1));
        setMinutes(Math.ceil(progress * 60));
      },
      onComplete: () => {
        setIsActive(false);
        setMinutes(0);
        handleCompletion();
      }
    });
  };

  const handleCompletion = () => {
    playSuccess();
    const randomMsg = CHEERS[Math.floor(Math.random() * CHEERS.length)];
    setShowCheer(randomMsg);
    setTimeout(() => setShowCheer(null), 3000);
  };

  // --- VISUAL TRANSFORMS ---
  const glowOpacity = useTransform(x, [0, 300], [0.2, 1]);
  const lineColor = useTransform(x, [0, 300], ["#334155", "#0ea5e9"]);

  return (
    <div className="relative w-full h-48 bg-slate-900 rounded-xl overflow-hidden border-4 border-slate-800 mt-6 select-none shadow-[0_0_40px_rgba(14,165,233,0.15)] flex flex-col items-center justify-center p-6 group">
      
      {/* 1. BACKGROUND HIGHLIGHT */}
      <motion.div 
        style={{ opacity: glowOpacity }}
        className="absolute inset-0 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 z-0 pointer-events-none"
      />

      {/* 2. INSTRUCTIONS */}
      {!isActive && !isDragging && minutes === 0 && (
        <div className="absolute top-4 text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">
          Drag Clock to Set Focus
        </div>
      )}

      {/* 3. THE TIMELINE TRACK */}
      <div className="relative w-full h-12 flex items-center z-10" ref={constraintsRef}>
        {/* The Line */}
        <div className="absolute w-full h-2 bg-slate-700 rounded-full overflow-hidden">
           <motion.div 
             style={{ width: x, backgroundColor: lineColor }} 
             className="h-full shadow-[0_0_15px_rgba(14,165,233,0.8)]"
           />
        </div>

        {/* Ticks on the line */}
        <div className="absolute w-full flex justify-between px-1 pointer-events-none opacity-30">
           {[...Array(13)].map((_, i) => (
             <div key={i} className={`w-0.5 h-4 bg-white ${i % 3 === 0 ? 'h-6' : 'h-3'}`} />
           ))}
        </div>

        {/* 4. THE DRAGGABLE CLOCK */}
        <motion.div
          drag={isActive ? false : "x"} // Disable drag while timer is running
          dragConstraints={constraintsRef}
          dragElastic={0.05}
          dragMomentum={false}
          style={{ x }}
          onDragStart={() => setIsDragging(true)}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95, cursor: "grabbing" }}
          className={`absolute top-1/2 -translate-y-1/2 -ml-6 w-12 h-12 rounded-full border-4 shadow-2xl flex items-center justify-center z-20 transition-colors
            ${isActive ? 'bg-green-500 border-green-300 shadow-[0_0_30px_rgba(34,197,94,0.6)] cursor-not-allowed' : 'bg-cyan-500 border-cyan-200 shadow-[0_0_30px_rgba(6,182,212,0.6)] cursor-grab'}
          `}
        >
          {isActive ? (
             <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
               <Zap className="text-white fill-white" size={20} />
             </motion.div>
          ) : (
             <Clock className="text-white" size={24} />
          )}
        </motion.div>
      </div>

      {/* 5. TIME DISPLAY */}
      <div className="mt-8 text-4xl font-black text-white font-mono flex items-center gap-3 z-10">
         <span className={isActive ? "text-green-400" : "text-cyan-400"}>
            {minutes < 10 ? `0${minutes}` : minutes}:00
         </span>
         <span className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-3">
            {isActive ? "Remaining" : "Minutes"}
         </span>
      </div>

      {/* 6. CHEERING POPUP */}
      <AnimatePresence>
        {showCheer && (
          <motion.div 
            initial={{ scale: 0, rotate: -10 }} 
            animate={{ scale: 1, rotate: 0 }} 
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
               animate={{ y: [0, -20, 0] }} 
               transition={{ repeat: Infinity, duration: 1 }}
               className="text-6xl mb-4"
            >
               🏆
            </motion.div>
            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
               {showCheer}
            </div>
            <div className="text-white/50 text-sm mt-2">Ready for the next round?</div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
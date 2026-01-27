import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronUp, Coffee, Zap, TrainFront, Home, Users, Ticket, Shield, BookOpen, Activity 
} from 'lucide-react';
import StudyChat from './StudyChat';

export default function RailwayDreamTunnel({ user, globalMsg }) {
  const [visorDown, setVisorDown] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [progress, setProgress] = useState(0);
  
  // 🧠 DATA SYNC
  const targetScore = Math.min(user?.total_percentage_points || 0, 100);
  const streakFill = Math.min((user.streak_count / 365) * 100, 100);

  // 🚂 PHYSICS LOOP
  useEffect(() => {
    // Ramp up Progress
    const pInterval = setInterval(() => {
      setProgress(prev => (prev < targetScore ? prev + 1 : targetScore));
    }, 50);

    // Ramp up Speed (Visual Only)
    const targetSpeed = Math.floor(targetScore * 1.8) + 60; // Base speed 60, Max 240
    const sInterval = setInterval(() => {
      setSpeed(prev => (prev < targetSpeed ? prev + 2 : targetSpeed));
    }, 30);

    return () => { clearInterval(pInterval); clearInterval(sInterval); };
  }, [targetScore]);

  // 🌟 DREAM WAYPOINTS
  const dreams = [
    { id: 1, val: 10, icon: <BookOpen size={60} />, label: "SYLLABUS", color: "text-white", border: "border-white" },
    { id: 2, val: 30, icon: <Ticket size={60} />, label: "RAIL PASS", color: "text-green-400", border: "border-green-500" },
    { id: 3, val: 55, icon: <Home size={60} />, label: "QUARTERS", color: "text-yellow-400", border: "border-yellow-500" },
    { id: 4, val: 80, icon: <Users size={60} />, label: "RESPECT", color: "text-pink-400", border: "border-pink-500" },
    { id: 5, val: 98, icon: <Shield size={60} />, label: "OFFICER", color: "text-cyan-400", border: "border-cyan-500" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col font-mono overflow-hidden select-none">
      
      {/* ==============================
          1. THE 3D TUNNEL (VIEWPORT)
      ============================== */}
      <div className="relative flex-1 overflow-hidden perspective-[1000px]">
        
        {/* A. SKY GRADIENT */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#1a1a1a] to-[#0a0a0a]"></div>

        {/* B. THE TRACK (MOVING FLOOR) */}
        <div 
          className="absolute inset-0 flex items-end justify-center"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div 
            className="w-[200vw] h-[200vh] origin-bottom bg-[#0a0a0a] relative"
            style={{ transform: 'rotateX(70deg) translateY(200px)' }}
          >
            {/* Moving Texture */}
            <motion.div 
              animate={{ translateY: [0, 200] }}
              transition={{ repeat: Infinity, duration: 0.15, ease: "linear" }}
              className="absolute inset-0 w-full h-full opacity-100"
              style={{
                backgroundImage: `
                  linear-gradient(90deg, 
                    transparent 45%, 
                    #0ea5e9 45%, #0ea5e9 46%, /* Left Neon Rail */
                    #222 46%, #222 54%,       /* Concrete Sleepers */
                    #0ea5e9 54%, #0ea5e9 55%, /* Right Neon Rail */
                    transparent 55%
                  ),
                  repeating-linear-gradient(180deg, 
                    transparent 0px, 
                    transparent 90px, 
                    rgba(255,255,255,0.05) 90px, 
                    rgba(255,255,255,0.05) 100px
                  )
                `,
                backgroundSize: '100% 200px'
              }}
            />
            {/* Speed Fog */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
          </div>
        </div>

        {/* C. THE DREAM OBJECTS (LOGIC: Stationary -> Flyby) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {dreams.map((d) => {
            const isUnlocked = progress >= d.val;
            return (
              <motion.div
                key={d.id}
                initial={{ scale: 0, opacity: 0, y: 50 }}
                animate={
                  isUnlocked 
                  ? { 
                      scale: [0.1, 15], 
                      opacity: [1, 0], 
                      y: [50, 1000] // Fly towards camera and down
                    } 
                  : { 
                      scale: 0.2, 
                      opacity: 0.6, 
                      y: 50 // Hover in distance
                    }
                }
                transition={isUnlocked ? { duration: 1.5, ease: "easeIn" } : { duration: 0 }}
                className="absolute flex flex-col items-center"
              >
                <div className={`p-6 rounded-full border-4 bg-black/80 backdrop-blur-md ${d.color} ${d.border} shadow-[0_0_50px_currentColor]`}>
                  {d.icon}
                </div>
                <div className="mt-4 bg-black/80 text-white text-xs font-black px-3 py-1 border border-white/20 tracking-widest">
                  {d.label} {isUnlocked && '✅'}
                </div>
              </motion.div>
            )
          })}
        </div>

      </div>

      {/* ==============================
          2. THE COCKPIT FRAME (UI)
      ============================== */}
      <div className="absolute inset-0 pointer-events-none z-40">
        
        {/* WINDSHIELD PILLARS (Creates the curve) */}
        <div className="absolute top-0 bottom-0 left-0 w-16 bg-[#000] border-r-4 border-[#222]"></div>
        <div className="absolute top-0 bottom-0 right-0 w-16 bg-[#000] border-l-4 border-[#222]"></div>
        <div className="absolute top-0 w-full h-12 bg-[#000] border-b-4 border-[#222] flex items-center justify-center">
           <div className="w-1/3 h-2 bg-gray-800 rounded-full"></div>
        </div>

        {/* --- DASHBOARD CONSOLE (VANDE BHARAT WHITE/ORANGE) --- */}
        <div className="absolute bottom-0 w-full h-64 bg-slate-200 border-t-[12px] border-orange-500 rounded-t-[4rem] shadow-2xl flex items-center justify-between px-10 pb-6 pointer-events-auto">
           
           {/* LEFT: COFFEE STREAK RESERVOIR */}
           <div className="relative w-32 h-40 bg-[#111] rounded-2xl border-4 border-slate-400 overflow-hidden shadow-inner flex flex-col justify-end">
              {/* Glass Reflection */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent z-20 pointer-events-none"></div>
              {/* Liquid */}
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${streakFill}%` }}
                className="w-full bg-gradient-to-t from-orange-700 to-yellow-500 relative z-10"
              >
                <div className="w-full h-1 bg-white/50 animate-pulse"></div>
              </motion.div>
              <div className="absolute top-2 left-0 w-full text-center z-30">
                 <Coffee className="w-6 h-6 text-white/50 mx-auto" />
                 <p className="text-[10px] text-white font-bold mt-1">{user.streak_count} DAYS</p>
              </div>
           </div>

           {/* CENTER: DIGITAL SPEEDOMETER */}
           <div className="flex flex-col items-center -mt-20">
              <div className="relative w-56 h-56 bg-black rounded-full border-[10px] border-slate-300 shadow-2xl flex items-center justify-center overflow-hidden">
                 {/* Glowing Ring */}
                 <div className="absolute inset-0 rounded-full border-t-8 border-cyan-400 animate-spin duration-[4s]"></div>
                 
                 <div className="text-center z-10">
                    <span className="text-8xl font-black text-white font-mono tracking-tighter drop-shadow-[0_0_15px_cyan]">
                      {speed}
                    </span>
                    <p className="text-sm font-bold text-cyan-500 mt-1">KM/H</p>
                 </div>
                 
                 {/* Progress Arc */}
                 <svg className="absolute inset-0 w-full h-full rotate-90 pointer-events-none">
                    <circle cx="50%" cy="50%" r="45%" fill="none" stroke="#222" strokeWidth="10" />
                    <motion.circle 
                      cx="50%" cy="50%" r="45%" fill="none" stroke="#ef4444" strokeWidth="10"
                      strokeDasharray="283"
                      strokeDashoffset={283 - (283 * progress) / 100}
                      strokeLinecap="round"
                    />
                 </svg>
              </div>
              <div className="mt-4 bg-black px-6 py-2 rounded-lg border-2 border-slate-400">
                 <p className="text-orange-500 font-bold font-mono tracking-widest text-xs animate-pulse">
                   EFFICIENCY: {progress}%
                 </p>
              </div>
           </div>

           {/* RIGHT: LED BROADCAST & CONTROLS */}
           <div className="w-64 flex flex-col gap-4">
              {/* LED SCROLLER */}
              <div className="h-12 bg-black border-2 border-slate-400 rounded-lg overflow-hidden relative flex items-center">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-30 z-20"></div>
                 <motion.div 
                   animate={{ x: ["100%", "-100%"] }} 
                   transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                   className="whitespace-nowrap text-red-500 font-bold text-lg tracking-widest pl-4"
                 >
                   {globalMsg || "TARGET LOCKED: RRB NTPC /// MAINTAIN SPEED"}
                 </motion.div>
              </div>

              {/* TOGGLES */}
              <div className="flex gap-4 justify-end">
                 <button className="flex flex-col items-center gap-1 group">
                    <div className="w-12 h-12 bg-slate-800 rounded-full border-2 border-slate-400 flex items-center justify-center shadow-lg group-active:scale-95 transition-all">
                       <Zap className="text-yellow-400" />
                    </div>
                    <span className="text-[8px] font-black text-slate-600 uppercase">Power</span>
                 </button>
                 {/* VISOR TOGGLE BUTTON */}
                 <button 
                   onClick={() => setVisorDown(!visorDown)}
                   className={`flex flex-col items-center gap-1 group ${visorDown ? 'opacity-100' : 'opacity-80'}`}
                 >
                    <div className="w-12 h-12 bg-cyan-700 rounded-full border-2 border-cyan-400 flex items-center justify-center shadow-lg group-active:scale-95 transition-all">
                       {visorDown ? <ChevronUp className="text-white" /> : <ChevronDown className="text-white" />}
                    </div>
                    <span className="text-[8px] font-black text-cyan-800 uppercase">Comms</span>
                 </button>
              </div>
           </div>

        </div>
      </div>

      {/* ==============================
          3. THE SUNSHIELD (CHAT VISOR)
      ============================== */}
      <AnimatePresence>
        {visorDown && (
          <motion.div 
            initial={{ y: "-120%" }}
            animate={{ y: 0 }}
            exit={{ y: "-120%" }}
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
            className="absolute top-0 right-10 w-[400px] h-[70%] bg-[#0f172a] border-x-[6px] border-b-[6px] border-slate-700 rounded-b-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[60] flex flex-col pointer-events-auto"
          >
             {/* Visor Grip */}
             <div className="h-8 bg-slate-800 w-full flex justify-center items-center cursor-pointer" onClick={() => setVisorDown(false)}>
                <div className="w-16 h-1.5 bg-slate-500 rounded-full"></div>
             </div>

             <div className="flex-1 overflow-hidden relative bg-black/50">
                <StudyChat user={user} isTunnel={true} />
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
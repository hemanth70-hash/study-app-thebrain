import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronUp, Coffee, Zap, TrainFront, Home, Users, Briefcase, Ticket, Shield 
} from 'lucide-react';
import StudyChat from './StudyChat';

export default function RailwayDreamTunnel({ user, globalMsg, isDarkMode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Cap progress at 100%
  const actualScore = Math.min(user?.total_percentage_points || 0, 100);

  // 🚂 ACCELERATION LOGIC: Animates the speedometer on load
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= actualScore) {
          clearInterval(interval);
          return actualScore;
        }
        return p + 1;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [actualScore]);

  // 🛤️ DREAM MILESTONES (The Shadows in the Tunnel)
  // These objects appear on the track. If you haven't reached the %, they stay foggy/distant.
  const dreams = [
    { id: 1, val: 20, icon: <Ticket size={64} />, label: "FREE TRAVEL" },
    { id: 2, val: 40, icon: <Home size={64} />, label: "QUARTERS" },
    { id: 3, val: 60, icon: <Shield size={64} />, label: "SECURITY" },
    { id: 4, val: 80, icon: <Users size={64} />, label: "RESPECT" },
    { id: 5, val: 95, icon: <TrainFront size={64} />, label: "OFFICER" },
  ];

  // ☕ STREAK LIQUID PHYSICS
  // 365 Days = 100% Full Cup
  const liquidHeight = Math.min((user.streak_count / 365) * 100, 100);

  return (
    <div className={`relative w-full h-[85vh] rounded-[2rem] overflow-hidden border-4 shadow-2xl flex flex-col transition-colors duration-500 font-mono select-none ${isDarkMode ? 'bg-[#050505] border-cyan-900/30' : 'bg-slate-900 border-slate-700'}`}>
      
      {/* ==============================
          1. TOP LED BROADCAST BAR
      ============================== */}
      <div className="z-50 bg-black border-b-4 border-gray-800 p-2 flex items-center justify-between shadow-xl relative">
        
        {/* LEFT: COFFEE CAPACITOR */}
        <div className="flex items-center gap-4 pl-2">
           <div className="relative w-12 h-12 flex-shrink-0 group cursor-help" title={`${user.streak_count}/365 Days`}>
              {/* Cup Shell */}
              <Coffee className="w-full h-full text-gray-600 relative z-20" strokeWidth={1.5} />
              
              {/* The Liquid (Fills up) */}
              <div className="absolute bottom-[5px] left-[3px] right-[14px] bg-orange-500/90 rounded-b-md transition-all duration-1000 z-10 overflow-hidden" 
                   style={{ height: `${liquidHeight}%`, maxHeight: '65%' }}>
                 <div className="w-full h-full bg-yellow-400/20 animate-pulse"></div>
              </div>
              
              {/* Steam & Badge */}
              <div className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md border border-red-400 z-30 shadow-lg shadow-red-500/50">
                {user.streak_count}d
              </div>
           </div>
        </div>

        {/* CENTER: LED TICKER */}
        <div className="flex-1 mx-4 bg-[#1a0505] rounded-lg border-4 border-gray-800 h-12 flex items-center overflow-hidden relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
           {/* Dot Matrix Mesh Overlay */}
           <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0)_1px,rgba(0,0,0,0.9)_1px)] bg-[length:4px_4px] z-20 pointer-events-none opacity-50"></div>
           
           <motion.div 
             animate={{ x: ["100%", "-100%"] }} 
             transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
             className="whitespace-nowrap text-orange-500 font-black text-xl tracking-[0.2em] drop-shadow-[0_0_8px_orange] z-10"
           >
             {globalMsg || `/// SYSTEM ONLINE /// TARGET: RRB NTPC 2026 /// CURRENT VELOCITY: ${progress}% /// MAINTAIN MOMENTUM ///`}
           </motion.div>
        </div>

        {/* RIGHT: SUNSHIELD TRIGGER */}
        <div className="pr-2">
           <button 
             onClick={() => setIsChatOpen(!isChatOpen)}
             className={`p-2 rounded-full border-2 transition-all ${isChatOpen ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-transparent text-cyan-500 border-cyan-900 hover:bg-cyan-900/50'}`}
           >
             {isChatOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
           </button>
        </div>
      </div>

      {/* ==============================
          2. THE 3D TUNNEL ENGINE
      ============================== */}
      <div className="absolute inset-0 flex items-center justify-center perspective-[800px] overflow-hidden bg-black">
         
         {/* Moving Gradient Walls */}
         <div className={`absolute inset-0 opacity-30 ${isDarkMode ? 'bg-gradient-to-b from-black via-cyan-900/10 to-black' : 'bg-gradient-to-b from-slate-900 via-purple-900/10 to-slate-900'}`}></div>
         
         {/* INFINITE TRACK ANIMATION */}
         <div className="relative w-full h-full max-w-6xl transform-style-3d rotate-x-[30deg]">
            
            {/* The Tunnel Ribs (Moving towards viewer) */}
            <motion.div 
               animate={{ z: [0, 500], opacity: [0, 1, 0] }}
               transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
               className="absolute top-1/2 left-1/2 w-[150vw] h-[150vh] -translate-x-1/2 -translate-y-1/2 border-[50px] border-slate-800/50 rounded-[40%] opacity-20"
            />
            <motion.div 
               animate={{ z: [0, 500], opacity: [0, 1, 0] }}
               transition={{ repeat: Infinity, duration: 1.5, delay: 0.75, ease: "linear" }}
               className="absolute top-1/2 left-1/2 w-[150vw] h-[150vh] -translate-x-1/2 -translate-y-1/2 border-[50px] border-slate-800/50 rounded-[40%] opacity-20"
            />

            {/* The Rails */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[2000px] bg-gradient-to-b from-transparent to-slate-900/80 transform-style-3d rotate-x-[90deg] origin-top">
                {/* Center Line */}
                <motion.div 
                  animate={{ translateY: [0, 200] }}
                  transition={{ repeat: Infinity, duration: 0.2, ease: "linear" }}
                  className="absolute left-1/2 w-4 h-full bg-dashed-line"
                  style={{ background: 'repeating-linear-gradient(to bottom, transparent 0, transparent 50px, #06b6d4 50px, #06b6d4 100px)' }}
                />
            </div>
         </div>

         {/* 3. DREAM OBJECTS (Passing By) */}
         <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {dreams.map((item, i) => (
               // Logic: Only show animation if we hit the target score.
               progress >= item.val ? (
                 <motion.div
                   key={item.id}
                   initial={{ scale: 0, opacity: 0, y: 0 }}
                   animate={{ 
                     scale: [0, 5], 
                     opacity: [0, 1, 0],
                     x: i % 2 === 0 ? -800 : 800, // Fly off to sides
                     y: 200
                   }}
                   transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: i * 2, ease: "easeIn" }}
                   className="absolute flex flex-col items-center"
                 >
                    <div className={`p-4 rounded-full border-4 bg-black ${item.val <= progress ? 'border-cyan-500 text-cyan-400 shadow-[0_0_50px_cyan]' : 'border-gray-700 text-gray-700'}`}>
                      {item.icon}
                    </div>
                    <span className="text-4xl font-black uppercase text-white mt-2 bg-black/50 px-4">{item.label}</span>
                 </motion.div>
               ) : null
            ))}
         </div>
      </div>

      {/* ==============================
          3. THE SUNSHIELD (CHAT)
      ============================== */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="absolute top-0 right-0 w-full md:w-1/3 h-[90%] bg-slate-900/95 backdrop-blur-xl border-b-4 border-l-4 border-cyan-500/50 rounded-bl-[3rem] shadow-2xl z-40 flex flex-col overflow-hidden"
          >
             {/* Visor Header */}
             <div className="bg-black/50 p-4 border-b border-white/10 flex items-center gap-3">
               <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
               <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Live Comm Link</span>
             </div>

             {/* The Chat Itself */}
             <div className="flex-1 relative overflow-hidden">
                <StudyChat user={user} isTunnel={true} />
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==============================
          4. THE DASHBOARD (Bottom)
      ============================== */}
      <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-black via-black/80 to-transparent z-30 flex items-end justify-between px-8 pb-6 pointer-events-none">
         
         {/* Speedometer */}
         <div className="text-left">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Thrust</p>
            <div className="flex items-end gap-2">
               <span className="text-6xl font-black text-white tracking-tighter italic">{progress}</span>
               <span className="text-xl font-bold text-cyan-500 mb-2">%</span>
            </div>
            <div className="w-48 h-2 bg-slate-800 rounded-full mt-2 overflow-hidden">
               <motion.div animate={{ width: `${progress}%` }} className="h-full bg-cyan-500 shadow-[0_0_10px_cyan]" />
            </div>
         </div>

         {/* Status Indicators */}
         <div className="flex gap-6">
            <div className="flex flex-col items-center opacity-80">
               <Zap className="text-yellow-400 animate-pulse" size={24} />
               <span className="text-[8px] text-yellow-400 font-bold mt-1">POWER OK</span>
            </div>
            <div className="flex flex-col items-center opacity-80">
               <Shield className="text-green-400" size={24} />
               <span className="text-[8px] text-green-400 font-bold mt-1">HULL OK</span>
            </div>
         </div>

      </div>

    </div>
  );
}
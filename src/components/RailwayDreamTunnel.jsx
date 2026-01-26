import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronUp, Coffee, Zap, TrainFront, Home, Users, Briefcase, Ticket, Shield, BookOpen 
} from 'lucide-react';
import StudyChat from './StudyChat';

export default function RailwayDreamTunnel({ user, globalMsg, isDarkMode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Cap progress at 100%
  const actualScore = Math.min(user?.total_percentage_points || 0, 100);

  // 🚂 ACCELERATION LOGIC (Simulates the journey start)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= actualScore) {
          clearInterval(interval);
          return actualScore;
        }
        return p + 1;
      });
    }, 50); // Speed of the progress bar fill
    return () => clearInterval(interval);
  }, [actualScore]);

  // 🛤️ DREAM MILESTONES
  // status: 'waiting' (in distance), 'passing' (zooming by), 'passed' (gone)
  const dreams = [
    { id: 1, val: 5, icon: <BookOpen size={80} />, label: "SYLLABUS", color: "text-white" },
    { id: 2, val: 25, icon: <Ticket size={80} />, label: "FREE TRAVEL", color: "text-green-400" },
    { id: 3, val: 50, icon: <Home size={80} />, label: "GOVT QUARTERS", color: "text-yellow-400" },
    { id: 4, val: 75, icon: <Users size={80} />, label: "PARENTS' PRIDE", color: "text-pink-400" },
    { id: 5, val: 100, icon: <Shield size={80} />, label: "JOB SECURITY", color: "text-cyan-400" },
  ];

  // ☕ STREAK LIQUID PHYSICS
  const liquidHeight = Math.min((user.streak_count / 365) * 100, 100);

  return (
    <div className="relative w-full h-[85vh] rounded-[2rem] overflow-hidden border-8 border-[#1a1a1a] shadow-2xl flex flex-col bg-black font-mono select-none">
      
      {/* ==============================
          1. TOP LED BROADCAST BAR
      ============================== */}
      <div className="z-50 bg-[#0a0a0a] border-b-4 border-[#333] p-2 flex items-center justify-between shadow-xl relative">
        <div className="flex items-center gap-4 pl-2">
           {/* COFFEE STREAK GAUGE */}
           <div className="relative w-10 h-10 bg-[#222] rounded-md border border-[#444] overflow-hidden flex items-end">
              <div 
                className="w-full bg-gradient-to-t from-orange-600 to-orange-400 transition-all duration-1000" 
                style={{ height: `${liquidHeight}%` }}
              >
                <div className="w-full h-1 bg-yellow-300/50 animate-pulse"></div>
              </div>
              <Coffee className="absolute inset-0 w-full h-full text-white/20 p-2" />
              <div className="absolute top-0 right-0 text-[9px] font-bold text-white bg-red-600 px-1">{user.streak_count}</div>
           </div>
        </div>

        {/* LED TICKER */}
        <div className="flex-1 mx-4 bg-[#110505] rounded-sm border-2 border-[#331111] h-10 flex items-center overflow-hidden relative shadow-[inset_0_0_10px_black]">
           {/* Grid Mesh */}
           <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.5)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-20 pointer-events-none"></div>
           <motion.div 
             animate={{ x: ["100%", "-100%"] }} 
             transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
             className="whitespace-nowrap text-orange-500 font-bold text-lg tracking-[0.2em] drop-shadow-[0_0_5px_orange]"
           >
             {globalMsg || `/// RRB EXPRESS ONLINE /// NEXT STATION: NTPC 2026 /// SPEED: ${progress} KMPH ///`}
           </motion.div>
        </div>

        {/* SUNSHIELD TOGGLE */}
        <div className="pr-2">
           <button 
             onClick={() => setIsChatOpen(!isChatOpen)}
             className={`p-2 rounded-full border-2 transition-all ${isChatOpen ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-[#111] text-cyan-600 border-[#333] hover:border-cyan-600'}`}
           >
             {isChatOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
           </button>
        </div>
      </div>

      {/* ==============================
          2. THE 3D RAILWAY WORLD
      ============================== */}
      <div className="absolute inset-0 flex items-center justify-center perspective-[600px] overflow-hidden bg-[#050505] z-0">
         
         {/* SKY / DARKNESS */}
         <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-[#020202] to-[#0a0a0a]"></div>

         {/* 3D TRACK CONTAINER */}
         <div className="relative w-full h-full max-w-4xl transform-style-3d rotate-x-[60deg] origin-bottom scale-[2]">
            
            {/* THE TRACK BED (Ballast) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300vh] -translate-y-1/2 bg-[#1a1a1a] overflow-hidden border-x-[40px] border-[#0a0a0a]">
                
                {/* MOVING SLEEPERS (Concrete Ties) */}
                <motion.div 
                  animate={{ translateY: [0, 100] }}
                  transition={{ repeat: Infinity, duration: 0.15, ease: "linear" }} // Fast speed
                  className="absolute inset-0 w-full h-full opacity-60"
                  style={{
                    backgroundImage: `repeating-linear-gradient(to bottom, 
                      #0a0a0a 0px, 
                      #0a0a0a 10px, 
                      transparent 10px, 
                      transparent 60px
                    )` 
                  }}
                />

                {/* LEFT RAIL */}
                <div className="absolute left-[40px] w-4 h-full bg-gradient-to-r from-gray-400 to-gray-600 shadow-[0_0_15px_cyan]"></div>
                
                {/* RIGHT RAIL */}
                <div className="absolute right-[40px] w-4 h-full bg-gradient-to-r from-gray-400 to-gray-600 shadow-[0_0_15px_cyan]"></div>

                {/* TUNNEL LIGHTS (Passing Overhead Reflection) */}
                <motion.div 
                   animate={{ opacity: [0, 0.5, 0], translateY: [-500, 500] }}
                   transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                   className="absolute top-0 left-0 w-full h-20 bg-cyan-500/20 blur-xl"
                />
            </div>
         </div>

         {/* DREAM OBJECTS LOGIC */}
         {/* They stay stuck in Z-space until progress hits their value, then they fly past */}
         <div className="absolute inset-0 pointer-events-none flex items-center justify-center perspective-[600px]">
            {dreams.map((item, i) => {
               const isReached = progress >= item.val;
               const isPassed = progress > item.val + 5; // A buffer to let it fly off screen

               return (
                 <motion.div
                   key={item.id}
                   initial={{ scale: 0.2, y: -20, opacity: 0.6, filter: "blur(2px)" }}
                   animate={
                     isReached 
                       ? { 
                           scale: [0.2, 8], // Zoom in massively
                           y: [ -20, 600 ], // Move down/past camera
                           opacity: [1, 0],
                           filter: "blur(0px)"
                         }
                       : { 
                           scale: 0.2, // Stay small in distance
                           y: -20,
                           opacity: 0.4 
                         }
                   }
                   transition={
                     isReached 
                       ? { duration: 1.5, ease: "easeIn" } // Fast flyby
                       : { duration: 0 } // Static
                   }
                   className={`absolute flex flex-col items-center z-10 ${isPassed ? 'hidden' : 'block'}`}
                 >
                    {/* The Neon Hologram */}
                    <div className={`p-4 rounded-xl border-4 bg-black/80 backdrop-blur-sm ${item.color} border-current shadow-[0_0_50px_currentColor]`}>
                      {item.icon}
                    </div>
                    <span className={`text-4xl font-black uppercase mt-4 bg-black px-4 text-white border border-white/20 tracking-widest shadow-xl`}>
                      {item.label}
                    </span>
                 </motion.div>
               );
            })}
         </div>
      </div>

      {/* ==============================
          3. THE COCKPIT OVERLAY (Frame)
      ============================== */}
      <div className="absolute inset-0 z-20 pointer-events-none">
         {/* Left Window Pillar */}
         <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-[#0a0a0a] to-[#1a1a1a] border-r-4 border-[#333]"></div>
         {/* Right Window Pillar */}
         <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-[#0a0a0a] to-[#1a1a1a] border-l-4 border-[#333]"></div>
         {/* Bottom Dashboard */}
         <div className="absolute bottom-0 left-0 w-full h-32 bg-[#111] border-t-8 border-[#222] flex items-center justify-between px-20">
            
            {/* Speedometer */}
            <div className="relative w-24 h-24 bg-black rounded-full border-4 border-gray-700 flex items-center justify-center shadow-[0_0_20px_black]">
               <div className="text-center">
                  <span className="text-3xl font-black text-cyan-400 font-mono">{progress}</span>
                  <p className="text-[8px] text-gray-500">KM/H</p>
               </div>
               {/* Needle */}
               <motion.div 
                 className="absolute w-1 h-10 bg-red-500 origin-bottom bottom-1/2 left-1/2 -translate-x-1/2"
                 animate={{ rotate: (progress / 100) * 240 - 120 }} // -120deg to +120deg
               />
            </div>

            {/* Controls */}
            <div className="flex gap-4">
               <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-4 bg-green-500 shadow-[0_0_10px_lime] rounded-sm animate-pulse"></div>
                  <span className="text-[8px] text-gray-400">POWER</span>
               </div>
               <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-4 bg-yellow-500/20 border border-yellow-500 rounded-sm"></div>
                  <span className="text-[8px] text-gray-400">BRAKE</span>
               </div>
            </div>

         </div>
      </div>

      {/* ==============================
          4. THE SUNSHIELD (Chat)
      ============================== */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ y: "-120%" }}
            animate={{ y: 0 }}
            exit={{ y: "-120%" }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="absolute top-0 right-16 w-[350px] h-[60%] bg-[#0f172a] border-x-4 border-b-4 border-cyan-700 rounded-b-3xl shadow-[0_0_50px_black] z-40 flex flex-col pointer-events-auto"
          >
             {/* Visor Hinge Visual */}
             <div className="h-4 bg-gray-800 w-full flex gap-2 justify-center items-center">
                <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                <div className="w-2 h-2 rounded-full bg-gray-600"></div>
             </div>

             {/* Chat Component */}
             <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0 bg-blue-900/10 pointer-events-none z-10 mix-blend-overlay"></div>
                <StudyChat user={user} isTunnel={true} />
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
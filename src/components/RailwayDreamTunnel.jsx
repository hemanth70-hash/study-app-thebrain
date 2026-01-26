import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronUp, ChevronDown, Coffee, Zap, Activity, TrainFront, Shield, Briefcase, Home 
} from 'lucide-react';
import StudyChat from './StudyChat';

export default function RailwayDreamTunnel({ user, globalMsg, isDarkMode }) {
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Cap progress at 100
  const actualScore = Math.min(user?.total_percentage_points || 0, 100);

  // Animation Loop for Progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= actualScore) {
          clearInterval(interval);
          return actualScore;
        }
        return p + 1;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [actualScore]);

  // --- 🛤️ 3D SHADOW OBJECTS ---
  // These appear on the side of the tracks based on progress
  const shadows = [
    { id: 1, label: "BOOKS", trigger: 0, icon: "📚" },
    { id: 2, label: "FIRST DREAM", trigger: 25, icon: "🏠" },
    { id: 3, label: "GOVT QUARTERS", trigger: 50, icon: "🏢" },
    { id: 4, label: "PARENTS PRIDE", trigger: 75, icon: "👨‍👩‍👦" },
    { id: 5, label: "RRB OFFICER", trigger: 95, icon: "🚆" },
  ];

  // --- ☕ COFFEE CUP CALCULATION ---
  // Assuming 365 days is full cup
  const streakFillHeight = Math.min((user.streak_count / 365) * 100, 100);

  return (
    <div className={`relative w-full h-[85vh] rounded-[3rem] overflow-hidden border-4 shadow-2xl flex flex-col transition-colors duration-500 ${isDarkMode ? 'bg-[#020617] border-cyan-900/50' : 'bg-slate-900 border-slate-700'}`}>
      
      {/* 1. TOP LED BROADCAST BAR (Bus Style) */}
      <div className="bg-black border-b-4 border-gray-800 p-2 overflow-hidden flex items-center justify-between z-50 shadow-lg">
        <div className="flex items-center gap-4 w-full">
           {/* Coffee Streak */}
           <div className="relative w-10 h-10 flex-shrink-0 group" title={`${user.streak_count} Day Streak`}>
              <Coffee className={`w-full h-full z-20 relative ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
              {/* Liquid Fill */}
              <div className="absolute bottom-[2px] left-[2px] right-[2px] bg-orange-500/80 rounded-b-md transition-all duration-1000 z-10" style={{ height: `${streakFillHeight}%`, maxHeight: '70%' }}></div>
              <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black px-1.5 rounded-full z-30">{user.streak_count}</div>
           </div>

           {/* LED Ticker */}
           <div className="flex-1 bg-[#1a0505] rounded-md border-2 border-gray-800 h-10 flex items-center overflow-hidden relative">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_2px,3px_100%]"></div>
              <motion.div 
                animate={{ x: ["100%", "-100%"] }} 
                transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                className="whitespace-nowrap text-orange-500 font-mono font-bold text-lg tracking-widest drop-shadow-[0_0_5px_orange]"
              >
                {globalMsg || "SYSTEM ONLINE... WAITING FOR INSTRUCTIONS... TARGET: RRB NTPC 2026... KEEP MOVING..."}
              </motion.div>
           </div>
        </div>
      </div>

      {/* 2. 3D TUNNEL ENGINE (Background) */}
      <div className="absolute inset-0 flex items-center justify-center perspective-[500px] overflow-hidden z-0">
         {/* Moving Walls */}
         <div className={`absolute inset-0 opacity-40 ${isDarkMode ? 'bg-gradient-to-b from-black via-cyan-900/20 to-black' : 'bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900'}`}></div>
         
         {/* Infinite Track Animation */}
         <div className="relative w-full h-full max-w-4xl transform-style-3d rotate-x-[20deg]">
            <motion.div 
               animate={{ scale: [0.1, 1.5], opacity: [0, 1, 0], z: [-500, 500] }}
               transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
               className="absolute top-1/2 left-1/2 w-[200vw] h-[200vh] -translate-x-1/2 -translate-y-1/2 border-[100px] border-slate-800 rounded-full opacity-20"
            />
            
            {/* Speed Lines */}
            <motion.div 
               animate={{ opacity: [0, 0.8, 0], scale: [0.5, 2] }}
               transition={{ repeat: Infinity, duration: 0.5 }}
               className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_50px_white]"
            />
         </div>

         {/* 3. MOVING SHADOWS (The Books & Dreams) */}
         <div className="absolute inset-0 pointer-events-none">
            {shadows.map((item, i) => (
               progress >= item.trigger && (
                 <motion.div
                   key={item.id}
                   initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                   animate={{ 
                     x: i % 2 === 0 ? -600 : 600, // Move Left or Right
                     y: 200, 
                     scale: 4, 
                     opacity: [0, 1, 0] 
                   }}
                   transition={{ duration: 3, repeat: Infinity, delay: i * 2, ease: "easeIn" }}
                   className="absolute top-1/2 left-1/2 flex flex-col items-center"
                 >
                    <span className="text-6xl filter drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] grayscale brightness-50">{item.icon}</span>
                    <span className={`text-4xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-cyan-500' : 'text-purple-500'} opacity-50`}>{item.label}</span>
                 </motion.div>
               )
            ))}
         </div>
      </div>

      {/* 4. THE COCKPIT (Foreground Split) */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 h-full">
        
        {/* LEFT: Study Chat (The Pilot Seat) */}
        <div className="lg:col-span-2 relative border-r-4 border-gray-800 bg-black/40 backdrop-blur-sm">
           <StudyChat user={user} isTunnel={true} />
        </div>

        {/* RIGHT: The Sunshield Chart */}
        <div className="relative lg:col-span-1 bg-black/20 backdrop-blur-md flex flex-col overflow-hidden">
           
           {/* The Glass Overlay Effect */}
           <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none z-20 border-l border-white/10"></div>

           {/* RETRACTABLE CHART PANEL (Sunshield) */}
           <AnimatePresence>
             {isChartOpen && (
               <motion.div 
                 initial={{ y: "-100%" }}
                 animate={{ y: 0 }}
                 exit={{ y: "-100%" }}
                 transition={{ type: "spring", stiffness: 100, damping: 20 }}
                 className="absolute top-0 left-0 w-full h-[90%] bg-slate-900/95 border-b-4 border-cyan-500 z-30 p-6 shadow-2xl flex flex-col gap-6"
               >
                  <h3 className="text-cyan-400 font-black uppercase tracking-widest flex items-center gap-2">
                    <Activity /> Performance Metrics
                  </h3>
                  
                  {/* Progress Bars */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 uppercase font-bold mb-1">
                        <span>Preparation</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div animate={{ width: `${progress}%` }} className="h-full bg-cyan-500 shadow-[0_0_10px_cyan]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 uppercase font-bold mb-1">
                        <span>Consistency</span>
                        <span>{Math.min(user.streak_count * 2, 100)}%</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div animate={{ width: `${Math.min(user.streak_count * 2, 100)}%` }} className="h-full bg-orange-500 shadow-[0_0_10px_orange]" />
                      </div>
                    </div>
                  </div>

                  {/* Dream Checkbox */}
                  <div className="grid grid-cols-2 gap-2 mt-auto">
                     <div className={`p-3 rounded-lg border ${progress > 20 ? 'border-green-500 bg-green-500/10' : 'border-slate-700 opacity-50'}`}>
                        <Home size={16} className="text-white mb-1" />
                        <span className="text-[10px] text-gray-300 font-bold">QUARTERS</span>
                     </div>
                     <div className={`p-3 rounded-lg border ${progress > 50 ? 'border-yellow-500 bg-yellow-500/10' : 'border-slate-700 opacity-50'}`}>
                        <Briefcase size={16} className="text-white mb-1" />
                        <span className="text-[10px] text-gray-300 font-bold">SECURITY</span>
                     </div>
                     <div className={`p-3 rounded-lg border ${progress > 80 ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 opacity-50'}`}>
                        <Shield size={16} className="text-white mb-1" />
                        <span className="text-[10px] text-gray-300 font-bold">RESPECT</span>
                     </div>
                     <div className={`p-3 rounded-lg border ${progress > 95 ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-700 opacity-50'}`}>
                        <TrainFront size={16} className="text-white mb-1" />
                        <span className="text-[10px] text-gray-300 font-bold">LOCO PILOT</span>
                     </div>
                  </div>
               </motion.div>
             )}
           </AnimatePresence>

           {/* TOGGLE BUTTON (Neon Arrow) */}
           <button 
             onClick={() => setIsChartOpen(!isChartOpen)}
             className="absolute top-4 right-4 z-40 p-2 bg-black/50 hover:bg-cyan-500/20 rounded-full border border-cyan-500/50 text-cyan-400 transition-all shadow-[0_0_15px_cyan] hover:scale-110"
           >
             {isChartOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
           </button>

           {/* Glass Content (Visible when chart closed) */}
           {!isChartOpen && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center opacity-50">
                   <p className="text-[10px] text-cyan-500 font-mono">SYSTEM READY</p>
                   <p className="text-4xl font-black text-white/20 font-mono">{progress}%</p>
                </div>
             </div>
           )}
        </div>

      </div>
    </div>
  );
}
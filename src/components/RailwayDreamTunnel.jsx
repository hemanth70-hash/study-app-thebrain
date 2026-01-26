import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronUp, Coffee, Zap, TrainFront, Home, Users, Ticket, Shield, BookOpen, Activity 
} from 'lucide-react';
import StudyChat from './StudyChat';

export default function RailwayDreamTunnel({ user, globalMsg, isDarkMode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [displayedSpeed, setDisplayedSpeed] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const gpa = user?.total_percentage_points || 0;
  const actualScore = Math.min(gpa, 100);

  // 🚂 PHYSICS ENGINE: LINK SPEED TO GPA
  useEffect(() => {
    // Progress Bar Sync
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= actualScore) {
          clearInterval(interval);
          return actualScore;
        }
        return p + 1;
      });
    }, 50);

    // Speedometer (Max ~350 km/h)
    const speedTarget = Math.floor(actualScore * 3.5); 
    const speedInterval = setInterval(() => {
      setDisplayedSpeed(s => {
        if (s >= speedTarget) {
          clearInterval(speedInterval);
          return speedTarget;
        }
        return s + 5;
      });
    }, 30);

    return () => { clearInterval(interval); clearInterval(speedInterval); };
  }, [actualScore]);

  // 🛤️ DREAM MILESTONES (The Passable Shadows)
  const dreams = [
    { id: 1, val: 10, icon: <BookOpen size={80} />, label: "SYLLABUS", color: "text-white" },
    { id: 2, val: 30, icon: <Ticket size={80} />, label: "RAIL PASS", color: "text-green-400" },
    { id: 3, val: 55, icon: <Home size={80} />, label: "QUARTERS", color: "text-yellow-400" },
    { id: 4, val: 80, icon: <Users size={80} />, label: "PARENTS' PRIDE", color: "text-pink-400" },
    { id: 5, val: 98, icon: <Shield size={80} />, label: "OFFICER STATUS", color: "text-cyan-400" },
  ];

  const liquidHeight = Math.min((user.streak_count / 365) * 100, 100);

  return (
    <div className={`relative w-full h-[88vh] rounded-[3rem] overflow-hidden border-8 border-slate-900 shadow-2xl flex flex-col bg-black font-mono select-none`}>
      
      {/* ==============================
          1. TOP LED BROADCAST (Bus Style)
      ============================== */}
      <div className="z-50 bg-black border-b-2 border-white/10 h-14 flex items-center justify-between relative shadow-2xl">
        <div className="flex-1 mx-10 h-9 bg-[#100202] border-2 border-red-900/50 rounded flex items-center overflow-hidden relative">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-40 z-20 pointer-events-none"></div>
           <motion.div 
             animate={{ x: ["100%", "-100%"] }} 
             transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
             className="whitespace-nowrap text-red-600 font-bold text-xl tracking-[0.4em] drop-shadow-[0_0_8px_red]"
           >
             {globalMsg || `LOCO PILOT: ${user.username} /// STATUS: EN ROUTE TO RRB 2026 /// SPEED: ${displayedSpeed} KM/H ///`}
           </motion.div>
        </div>

        {/* Retractable Sunshield Trigger */}
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="mr-10 p-2 bg-cyan-500/20 border border-cyan-500/50 rounded-full text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:scale-110 transition-all"
        >
          {isChatOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
      </div>

      {/* ==============================
          2. THE 3D TUNNEL ENGINE
      ============================== */}
      <div className="flex-1 relative overflow-hidden bg-[#020202] perspective-[1000px]">
         
         {/* THE TURNING TRACK MECHANISM */}
         <div 
            className="absolute inset-0 w-full h-full flex items-end justify-center"
            style={{ animation: 'sway 10s ease-in-out infinite' }}
         >
            <style>{`
              @keyframes sway {
                0%, 100% { perspective-origin: 50% 50%; }
                25% { perspective-origin: 40% 50%; } /* Turning Left */
                75% { perspective-origin: 60% 50%; } /* Turning Right */
              }
            `}</style>

            {/* THE TRACK PLANE */}
            <div 
               className="relative w-[1500px] h-[300%] origin-bottom transform-style-3d"
               style={{ transform: 'rotateX(80deg) translateY(0px)' }}
            >
               {/* Headlight Cone */}
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(6,182,212,0.2)_0%,transparent_70%)] z-10"></div>

               {/* MOVING NEON RAILS */}
               <motion.div 
                 animate={{ translateY: [0, 400] }} 
                 transition={{ repeat: Infinity, duration: 0.1, ease: "linear" }}
                 className="absolute inset-0 w-full h-full"
                 style={{
                   backgroundImage: `
                     linear-gradient(90deg, 
                       transparent 25%, 
                       #22d3ee 25%, #22d3ee 26%, /* Left Neon Rail */
                       transparent 26%, transparent 74%, 
                       #22d3ee 74%, #22d3ee 75%, /* Right Neon Rail */
                       transparent 75%
                     ),
                     repeating-linear-gradient(180deg, 
                       rgba(255,255,255,0.03) 0px, 
                       rgba(255,255,255,0.03) 90px, 
                       #222 90px, 
                       #111 110px /* Concrete Sleepers */
                     )
                   `,
                   backgroundSize: '100% 400px'
                 }}
               />
            </div>
         </div>

         {/* DREAM STATIONARY TARGETS (ZOOM ON UNLOCK) */}
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            {dreams.map((item, i) => {
               const isReached = progress >= item.val;
               return (
                 <motion.div
                   key={item.id}
                   initial={{ scale: 0.1, opacity: 0, y: 0 }}
                   animate={
                     isReached 
                       ? { scale: [0.1, 25], opacity: [1, 0], y: [0, 1000] }
                       : { scale: 0.15, opacity: 0.6, y: -20 }
                   }
                   transition={isReached ? { duration: 1.2, ease: "easeIn" } : { duration: 0 }}
                   className="absolute flex flex-col items-center"
                 >
                    <div className={`p-10 rounded-3xl border-8 bg-black/90 ${item.color} border-current shadow-[0_0_80px_currentColor]`}>
                      {item.icon}
                    </div>
                    <div className="mt-6 px-8 py-2 bg-black/80 border-2 border-white/20 text-white text-2xl font-black italic tracking-[0.3em] uppercase">
                      {item.label}
                    </div>
                 </motion.div>
               );
            })}
         </div>
      </div>

      {/* ==============================
          3. THE VANDE BHARAT COCKPIT
      ============================== */}
      <div className="absolute inset-0 z-30 pointer-events-none">
         
         {/* Windshield pillars and frame */}
         <div className="absolute inset-0 border-[60px] border-black rounded-[3rem] shadow-[inset_0_0_150px_black] opacity-90"></div>

         {/* DASHBOARD CONSOLE */}
         <div className="absolute bottom-0 w-full h-64 bg-[#f8f9fa] border-t-[10px] border-blue-700 flex items-center justify-between px-20 pb-8 shadow-[0_-30px_100px_rgba(0,0,0,0.9)] rounded-t-[15rem]">
            
            {/* LEFT: COFFEE STREAK CUP */}
            <div className="relative w-32 h-40 flex flex-col items-center justify-end">
               <div className="relative w-20 h-24 bg-white/20 border-4 border-slate-300 rounded-b-2xl overflow-hidden shadow-inner backdrop-blur-sm">
                  {/* The Liquid */}
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${liquidHeight}%` }}
                    className="absolute bottom-0 w-full bg-gradient-to-t from-orange-800 to-orange-400 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]"
                  />
                  {/* 365 markings */}
                  <div className="absolute inset-0 flex flex-col justify-between p-2 opacity-10">
                     {[...Array(6)].map((_,i) => <div key={i} className="w-full h-[2px] bg-black"></div>)}
                  </div>
               </div>
               <div className="mt-3 text-center">
                  <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">Streak Fuel</p>
                  <span className="text-lg font-black text-blue-700">{user.streak_count} Days</span>
               </div>
            </div>

            {/* CENTER: SPEED CLUSTER */}
            <div className="relative w-64 h-64 -mt-32 bg-[#080808] rounded-full border-[15px] border-slate-300 shadow-[0_0_50px_black] flex items-center justify-center overflow-hidden">
               {/* Digital Halo */}
               <div className="absolute inset-0 rounded-full border-t-4 border-cyan-400 animate-spin duration-[2s]"></div>
               
               <div className="text-center z-10">
                  <p className="text-[11px] text-cyan-500/60 font-bold tracking-[0.4em] mb-2 uppercase">Neural Velocity</p>
                  <span className="text-8xl font-black text-white font-mono tracking-tighter drop-shadow-[0_0_20px_cyan]">{displayedSpeed}</span>
                  <div className="flex items-center justify-center gap-3 mt-3">
                     <span className="text-sm text-cyan-400 font-bold">KM/H</span>
                     <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div animate={{ width: `${progress}%` }} className="h-full bg-red-600 shadow-[0_0_10px_red]" />
                     </div>
                  </div>
               </div>
            </div>

            {/* RIGHT: SYSTEMS TELEMETRY */}
            <div className="flex flex-col items-end gap-6">
               <div className="flex items-center gap-4">
                  <div className="text-right">
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Efficiency</p>
                     <p className="text-4xl font-black text-blue-800 italic">{progress}%</p>
                  </div>
                  <div className="p-4 bg-blue-700 rounded-3xl text-white shadow-lg shadow-blue-500/40">
                     <Zap size={32} className="animate-pulse" />
                  </div>
               </div>
               
               <div className="flex gap-3">
                  <div className="w-12 h-12 bg-slate-200 rounded-2xl border-2 border-slate-300 flex items-center justify-center shadow-inner">
                     <Shield size={24} className="text-blue-600" />
                  </div>
                  <div className="w-12 h-12 bg-slate-200 rounded-2xl border-2 border-slate-300 flex items-center justify-center shadow-inner">
                     <Activity size={24} className="text-green-600" />
                  </div>
               </div>
            </div>

         </div>
      </div>

      {/* ==============================
          4. RETRACTABLE CHAT VISOR (Top Right)
      ============================== */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ type: "spring", stiffness: 90, damping: 15 }}
            className="absolute top-0 right-14 w-[450px] h-[75%] bg-[#080b12] border-x-4 border-b-8 border-cyan-600 rounded-b-[3rem] shadow-[0_0_150px_black] z-[60] flex flex-col pointer-events-auto"
          >
             {/* Visor Hinge Visual */}
             <div className="h-10 bg-[#111] w-full border-b border-white/10 flex items-center justify-center gap-24">
                <div className="w-3 h-full bg-black/60 shadow-inner"></div>
                <div className="w-24 h-1 bg-cyan-900/50 rounded-full"></div>
                <div className="w-3 h-full bg-black/60 shadow-inner"></div>
             </div>

             <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none z-10 mix-blend-overlay"></div>
                {/* Live Convo Protocol */}
                <StudyChat user={user} isTunnel={true} />
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
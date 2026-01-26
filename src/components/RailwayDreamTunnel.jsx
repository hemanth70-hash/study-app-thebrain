import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronUp, Coffee, Zap, TrainFront, Home, Users, Ticket, Shield, BookOpen, Gauge, Activity 
} from 'lucide-react';
import StudyChat from './StudyChat';

export default function RailwayDreamTunnel({ user, globalMsg, isDarkMode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [displayedSpeed, setDisplayedSpeed] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const gpa = user?.total_percentage_points || 0;
  const actualScore = Math.min(gpa, 100);

  // 🚂 COCKPIT PHYSICS ENGINE
  useEffect(() => {
    // 1. Progress Bar Sync
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= actualScore) {
          clearInterval(interval);
          return actualScore;
        }
        return p + 1;
      });
    }, 50);

    // 2. Speedometer (Vande Bharat Max 180-350 range)
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

  // 🛤️ DREAM MILESTONES (The Targets)
  const dreams = [
    { id: 1, val: 10, icon: <BookOpen size={60} />, label: "SYLLABUS", color: "text-white", glow: "shadow-white" },
    { id: 2, val: 30, icon: <Ticket size={60} />, label: "RAILWAY PASS", color: "text-green-400", glow: "shadow-green-500" },
    { id: 3, val: 55, icon: <Home size={60} />, label: "GOVT QUARTERS", color: "text-yellow-400", glow: "shadow-yellow-500" },
    { id: 4, val: 80, icon: <Users size={60} />, label: "PARENTS' PRIDE", color: "text-pink-400", glow: "shadow-pink-500" },
    { id: 5, val: 98, icon: <TrainFront size={60} />, label: "OFFICER STATUS", color: "text-cyan-400", glow: "shadow-cyan-500" },
  ];

  const liquidHeight = Math.min((user.streak_count / 365) * 100, 100);

  return (
    <div className="relative w-full h-[88vh] rounded-[3rem] overflow-hidden border-4 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,1)] flex flex-col bg-black font-mono select-none">
      
      {/* ==============================
          1. TOP LED BROADCAST (Bus Style)
      ============================== */}
      <div className="z-50 bg-[#050505] border-b-2 border-white/5 h-14 flex items-center justify-between relative">
        <div className="flex-1 mx-10 h-8 bg-[#100202] border border-red-900/30 rounded flex items-center overflow-hidden relative">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-20 z-20"></div>
           <motion.div 
             animate={{ x: ["100%", "-100%"] }} 
             transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
             className="whitespace-nowrap text-red-600 font-bold text-lg tracking-[0.4em] drop-shadow-[0_0_5px_red]"
           >
             {globalMsg || `LOCO PILOT: ${user.username} /// STATUS: EN ROUTE TO RRB 2026 /// SPEED: ${displayedSpeed} KM/H ///`}
           </motion.div>
        </div>

        {/* Retractable Sunshield Trigger */}
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="mr-10 p-2 bg-cyan-500/10 border border-cyan-500/50 rounded-full text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:scale-110 transition-all"
        >
          {isChatOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
      </div>

      {/* ==============================
          2. THE 3D TUNNEL (Vande Bharat View)
      ============================== */}
      <div className="flex-1 relative overflow-hidden bg-[#020202] perspective-[1000px]">
         
         {/* TRACK PLANE */}
         <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
            <div 
               className="relative w-[1200px] h-[300%] origin-bottom transform-style-3d bg-[#050505]"
               style={{ transform: 'rotateX(80deg) translateY(50px)' }}
            >
               {/* HEADLIGHT BEAM */}
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(6,182,212,0.15)_0%,transparent_70%)] z-10"></div>

               {/* MOVING RAILS & SLEEPERS */}
               <motion.div 
                 animate={{ translateY: [0, 200] }} 
                 transition={{ repeat: Infinity, duration: 0.1, ease: "linear" }}
                 className="absolute inset-0 w-full h-full"
                 style={{
                   backgroundImage: `
                     linear-gradient(90deg, 
                       transparent 20%, 
                       #22d3ee 20%, #22d3ee 21%, /* Rail Neon */
                       transparent 21%, transparent 79%, 
                       #22d3ee 79%, #22d3ee 80%, /* Rail Neon */
                       transparent 80%
                     ),
                     repeating-linear-gradient(180deg, 
                       rgba(255,255,255,0.02) 0px, 
                       rgba(255,255,255,0.02) 90px, 
                       #111 90px, 
                       #111 110px
                     )
                   `,
                   backgroundSize: '100% 200px'
                 }}
               />
               
               {/* THE NEON GLOW ON TRACK */}
               <div className="absolute left-[20%] right-[20%] top-0 bottom-0 shadow-[0_0_100px_rgba(6,182,212,0.2)]"></div>
            </div>
         </div>

         {/* DREAM STATIONARY TARGETS */}
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            {dreams.map((item, i) => {
               const isReached = progress >= item.val;
               return (
                 <motion.div
                   key={item.id}
                   initial={{ scale: 0.1, z: -100, opacity: 0, y: 0 }}
                   animate={
                     isReached 
                       ? { scale: [0.1, 20], opacity: [1, 0], y: [0, 800], z: [0, 500] }
                       : { scale: 0.15, opacity: 0.5, y: 0, z: 0 }
                   }
                   transition={isReached ? { duration: 1, ease: "easeIn" } : { duration: 0 }}
                   className="absolute flex flex-col items-center"
                 >
                    <div className={`p-8 rounded-2xl border-4 bg-black/90 ${item.color} border-current shadow-[0_0_50px_currentColor] transition-all`}>
                      {item.icon}
                    </div>
                    <div className="mt-4 px-6 py-1 bg-black/80 border border-white/20 text-white text-xl font-black italic tracking-widest uppercase">
                      {item.label}
                    </div>
                 </motion.div>
               );
            })}
         </div>

         {/* OVERHEAD CABLE LIGHTS */}
         <div className="absolute inset-0 pointer-events-none">
            <motion.div 
               animate={{ y: [-100, 1000], opacity: [0, 1, 0] }}
               transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
               className="absolute top-0 left-1/4 w-1 h-40 bg-cyan-500/20 blur-md" 
            />
            <motion.div 
               animate={{ y: [-100, 1000], opacity: [0, 1, 0] }}
               transition={{ repeat: Infinity, duration: 0.8, delay: 0.4, ease: "linear" }}
               className="absolute top-0 right-1/4 w-1 h-40 bg-cyan-500/20 blur-md" 
            />
         </div>
      </div>

      {/* ==============================
          3. THE VANDE BHARAT DASHBOARD
      ============================== */}
      <div className="absolute inset-0 z-30 pointer-events-none">
         
         {/* Panoramic Windshield Curve */}
         <div className="absolute inset-0 border-[60px] border-black rounded-[3rem] shadow-[inset_0_0_100px_black] opacity-90"></div>
         <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-black to-transparent"></div>

         {/* MAIN DASH CONSOLE */}
         <div className="absolute bottom-0 w-full h-56 bg-slate-100 border-t-8 border-blue-600 flex items-center justify-between px-16 pb-6 shadow-[0_-20px_60px_rgba(0,0,0,0.8)] rounded-t-[10rem]">
            
            {/* LEFT: COFFEE STREAK CUP (Physical object on dash) */}
            <div className="relative w-28 h-32 flex flex-col items-center justify-end">
               <div className="relative w-16 h-20 bg-white/10 border-2 border-slate-300 rounded-b-xl overflow-hidden shadow-inner">
                  {/* The Liquid */}
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${liquidHeight}%` }}
                    className="absolute bottom-0 w-full bg-gradient-to-t from-orange-800 to-orange-500 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
                  />
                  {/* 365 Markings */}
                  <div className="absolute inset-0 flex flex-col justify-between p-1 opacity-20">
                     {[...Array(5)].map((_,i) => <div key={i} className="w-full h-[1px] bg-black"></div>)}
                  </div>
               </div>
               <div className="mt-2 text-center">
                  <p className="text-[10px] text-slate-500 font-black tracking-widest">STREAK FUEL</p>
                  <span className="text-sm font-black text-blue-600">{user.streak_count}d</span>
               </div>
               <Coffee className="absolute top-0 text-slate-200 opacity-20" size={48} />
            </div>

            {/* CENTER: SPEED CLUSTER */}
            <div className="relative w-56 h-56 -mt-28 bg-[#0a0a0a] rounded-full border-[12px] border-slate-200 shadow-2xl flex items-center justify-center overflow-hidden">
               {/* Digital Ring */}
               <div className="absolute inset-0 rounded-full border-t-4 border-cyan-400 animate-spin duration-[3s]"></div>
               
               <div className="text-center z-10">
                  <p className="text-[10px] text-cyan-500/50 font-bold tracking-[0.3em] mb-1">NEURAL VELOCITY</p>
                  <span className="text-7xl font-black text-white font-mono tracking-tighter drop-shadow-[0_0_15px_cyan]">{displayedSpeed}</span>
                  <div className="flex items-center justify-center gap-2 mt-2">
                     <span className="text-xs text-cyan-400 font-bold">KM/H</span>
                     <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div animate={{ width: `${progress}%` }} className="h-full bg-red-500 shadow-[0_0_5px_red]" />
                     </div>
                  </div>
               </div>
            </div>

            {/* RIGHT: SYSTEM TELEMETRY */}
            <div className="flex flex-col items-end gap-4 pr-4">
               <div className="flex items-center gap-3">
                  <div className="text-right">
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Efficiency</p>
                     <p className="text-3xl font-black text-blue-700 italic">{progress}%</p>
                  </div>
                  <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/30">
                     <Zap size={24} className="animate-pulse" />
                  </div>
               </div>
               
               <div className="flex gap-2">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl border border-slate-300 flex items-center justify-center shadow-inner">
                     <Shield size={20} className="text-blue-500" />
                  </div>
                  <div className="w-10 h-10 bg-slate-200 rounded-xl border border-slate-300 flex items-center justify-center shadow-inner">
                     <Activity size={20} className="text-green-500" />
                  </div>
               </div>
            </div>

         </div>
      </div>

      {/* ==============================
          4. RETRACTABLE CHAT VISOR
      ============================== */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ type: "spring", stiffness: 100, damping: 18 }}
            className="absolute top-0 right-10 w-[420px] h-[75%] bg-[#080b12] border-x-4 border-b-4 border-cyan-600 rounded-b-[2rem] shadow-[0_0_100px_black] z-[60] flex flex-col pointer-events-auto"
          >
             {/* Visor Hinge Visual */}
             <div className="h-10 bg-[#1a1a1a] w-full border-b border-white/10 flex items-center justify-center gap-20">
                <div className="w-2 h-full bg-black/50"></div>
                <div className="w-20 h-1.5 bg-cyan-900/50 rounded-full"></div>
                <div className="w-2 h-full bg-black/50"></div>
             </div>

             <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none z-10 mix-blend-overlay"></div>
                <StudyChat user={user} isTunnel={true} />
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
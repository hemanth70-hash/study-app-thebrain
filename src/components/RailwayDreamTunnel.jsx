import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Home, Ticket, UserCheck, Briefcase, Zap, TrainFront, Activity 
} from 'lucide-react';
import StudyChat from './StudyChat'; 

export default function RailwayDreamTunnel({ user, onClose }) {
  const [progress, setProgress] = useState(0);
  // Cap progress at 100
  const actualScore = Math.min(user?.total_percentage_points || 0, 100);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= actualScore) {
          clearInterval(interval);
          return actualScore;
        }
        return p + 1;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [actualScore]);

  // Dream Metrics for the Chart
  const dreams = [
    { label: "Govt Quarters", val: 30, color: "bg-yellow-400" },
    { label: "Financial Power", val: 55, color: "bg-green-400" },
    { label: "Parents' Pride", val: 80, color: "bg-pink-400" },
    { label: "World Travel", val: 95, color: "bg-cyan-400" },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-[#020617] text-white flex flex-col overflow-hidden font-mono select-none">
      
      {/* 1. MOVING TRACK BACKGROUND (The Tunnel) */}
      <div className="absolute inset-0 flex items-end justify-center perspective-[600px] pointer-events-none opacity-60">
        <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-transparent to-[#020617]" />
        <div className="relative w-full max-w-5xl h-full flex justify-center transform-style-3d rotate-x-[70deg] origin-bottom scale-150">
          <div className="w-[600px] h-[200%] bg-[#0f172a] border-x-[16px] border-slate-800 relative overflow-hidden flex justify-center">
            {/* Moving Ties */}
            <motion.div 
              animate={{ translateY: [0, 100] }} 
              transition={{ repeat: Infinity, duration: 0.2, ease: "linear" }} 
              className="absolute inset-0 w-full h-full"
              style={{ backgroundImage: `linear-gradient(to bottom, transparent 50%, #1e293b 50%)`, backgroundSize: "100% 100px" }}
            />
            {/* Rails */}
            <div className="absolute left-[10%] w-2 h-full bg-cyan-500/50 shadow-[0_0_20px_cyan]"></div>
            <div className="absolute right-[10%] w-2 h-full bg-cyan-500/50 shadow-[0_0_20px_cyan]"></div>
          </div>
        </div>
      </div>

      {/* 2. HEADER HUD */}
      <div className="relative z-50 p-4 flex justify-between items-center bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <TrainFront className="text-cyan-400" />
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-cyan-400">RRB Express</h2>
            <p className="text-[10px] text-slate-400">Loco Pilot: {user.username}</p>
          </div>
        </div>
        <button onClick={onClose} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-full transition-all border border-red-500/30">
          <span className="text-xs font-bold uppercase">Emergency Brake</span>
          <X size={16} />
        </button>
      </div>

      {/* 3. MAIN COCKPIT (Split Screen) */}
      <div className="relative z-40 flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
        
        {/* LEFT: THE STUDY CHAT (2/3 Width) */}
        <div className="lg:col-span-2 bg-black/60 backdrop-blur-xl rounded-[2rem] border border-cyan-500/20 shadow-2xl overflow-hidden flex flex-col relative group">
           <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_2px,3px_100%] opacity-20"></div>
           <div className="relative z-10 flex-1 h-full">
              {/* Pass isTunnel=true to strip sidebar/padding */}
              <StudyChat user={user} isTunnel={true} />
           </div>
        </div>

        {/* RIGHT: THE BOGEY CHART (1/3 Width) */}
        <div className="hidden lg:flex flex-col bg-slate-900/80 backdrop-blur-xl rounded-[2rem] border border-slate-700 shadow-2xl p-6 relative overflow-hidden">
           {/* Scanline */}
           <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/30 animate-[scan_3s_linear_infinite]"></div>
           
           <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-300 mb-6">
             <Activity size={16} className="text-green-400" /> Engine Diagnostics
           </h3>

           {/* The Dream Bars */}
           <div className="flex-1 flex flex-col justify-center gap-6">
             {dreams.map((d, i) => (
               <div key={i} className="space-y-2">
                 <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                   <span className="text-slate-400">{d.label}</span>
                   <span className={progress >= d.val ? 'text-white' : 'text-slate-600'}>{d.val}% Req</span>
                 </div>
                 <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${Math.min(progress, d.val)}%` }}
                     transition={{ duration: 1 }}
                     className={`h-full ${d.color} shadow-[0_0_10px_currentColor]`}
                   />
                 </div>
               </div>
             ))}
           </div>

           {/* Current Speedometer */}
           <div className="mt-auto pt-6 border-t border-slate-700 text-center">
             <p className="text-[10px] text-slate-500 uppercase tracking-widest">Current Velocity</p>
             <div className="text-5xl font-black text-white mt-1 font-mono tracking-tighter">
               {progress}<span className="text-lg text-cyan-500">%</span>
             </div>
             <p className="text-xs text-cyan-400 font-bold mt-2 animate-pulse">OPTIMAL TRACTION</p>
           </div>
        </div>

      </div>
    </div>
  );
}
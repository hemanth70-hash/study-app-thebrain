import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronUp, Coffee, Zap, TrainFront, Home, Users, Ticket, Shield, BookOpen 
} from 'lucide-react';
import StudyChat from './StudyChat';

export default function RailwayDreamTunnel({ user, globalMsg }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const gpa = user?.total_percentage_points || 0;
  const targetScore = Math.min(gpa, 100);
  const streakFill = Math.min((user.streak_count / 365) * 100, 100);

  // 🚂 PHYSICS ENGINE
  useEffect(() => {
    const pInt = setInterval(() => setProgress(p => (p < targetScore ? p + 1 : targetScore)), 50);
    // Top speed ~320 km/h based on GPA
    const targetSpeed = Math.floor(targetScore * 3.2); 
    const sInt = setInterval(() => setSpeed(s => (s < targetSpeed ? s + 3 : targetSpeed)), 30);
    return () => { clearInterval(pInt); clearInterval(sInt); };
  }, [targetScore]);

  // 🌟 HOLOGRAPHIC DREAM STRUCTURES
  const dreams = [
    { id: 1, val: 10, icon: <BookOpen size={140} />, label: "SYLLABUS TOWER", color: "text-blue-400", neon: "shadow-blue-500" },
    { id: 2, val: 30, icon: <Ticket size={140} />, label: "PASS GATEWAY", color: "text-green-400", neon: "shadow-green-500" },
    { id: 3, val: 55, icon: <Home size={140} />, label: "QUARTERS HUB", color: "text-yellow-400", neon: "shadow-yellow-500" },
    { id: 4, val: 80, icon: <Users size={140} />, label: "PRIDE MONUMENT", color: "text-pink-400", neon: "shadow-pink-500" },
    { id: 5, val: 98, icon: <Shield size={140} />, label: "OFFICER HQ", color: "text-cyan-400", neon: "shadow-cyan-500" },
  ];

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-mono select-none">
      
      {/* ==============================
          1. THE 3D WORLD & TRACK
      ============================== */}
      <div className="absolute inset-0 perspective-[1500px]">
        
        {/* Sky/Atmosphere */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a1a2e_0%,_#000_70%)]"></div>
        
        {/* The Moving Track Floor */}
        <div 
          className="absolute inset-0 flex items-end justify-center transform-style-3d"
        >
           <div 
             className="relative w-[2000px] h-[400%] origin-bottom"
             style={{ transform: 'rotateX(85deg) translateZ(0px)' }}
           >
              {/* HEADLIGHT BEAM */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[150%] bg-gradient-to-t from-cyan-500/30 via-transparent to-transparent blur-3xl pointer-events-none"></div>

              {/* MOVING NEON TEXTURE */}
              <motion.div 
                animate={{ translateY: [0, 400] }}
                transition={{ repeat: Infinity, duration: 0.1, ease: "linear" }}
                className="absolute inset-0 w-full h-full"
                style={{
                  backgroundImage: `
                    linear-gradient(90deg, 
                      transparent 35%, 
                      #0ea5e9 35%, #22d3ee 37%, /* Cyan Rail L */
                      #111 37%, #111 63%,       /* Dark Path */
                      #22d3ee 63%, #0ea5e9 65%, /* Cyan Rail R */
                      transparent 65%
                    ),
                    repeating-linear-gradient(180deg, 
                      transparent 0px, transparent 95px,
                      rgba(249, 115, 22, 0.4) 95px, rgba(249, 115, 22, 0.6) 100px /* Orange Neon Sleepers */
                    )
                  `,
                  backgroundSize: '100% 400px',
                  backgroundBlendMode: 'screen'
                }}
              />
           </div>
        </div>

        {/* THE PASSING DREAM STRUCTURES */}
        <div className="absolute inset-0 pointer-events-none transform-style-3d">
           {dreams.map((d, i) => {
             const isUnlocked = progress >= d.val;
             const side = i % 2 === 0 ? -600 : 600; // Alternate left/right sides of track
             
             return (
               <motion.div
                 key={d.id}
                 initial={{ z: -2000, opacity: 0, scale: 0.5 }}
                 animate={
                   isUnlocked
                   ? { z: [ -2000, 500 ], opacity: [0, 1, 0], scale: [0.5, 1.5], x: side } // Fly past
                   : { z: -2000, opacity: 0.4, scale: 0.5, x: side } // Stay distant
                 }
                 transition={isUnlocked ? { duration: 2, ease: "easeIn", repeat: Infinity, repeatDelay: i } : { duration: 0 }}
                 className={`absolute top-1/2 left-1/2 flex flex-col items-center`}
                 style={{ x: side, y: -300 }}
               >
                  {/* Neon Structure */}
                  <div className={`p-8 border-4 ${d.color} ${d.neon} bg-black/80 shadow-[0_0_100px_currentColor] backdrop-blur-lg rounded-xl`}>
                    {d.icon}
                  </div>
                  <div className={`mt-4 text-2xl font-black ${d.color} drop-shadow-[0_0_10px_currentColor] tracking-widest`}>
                    {d.label}
                  </div>
               </motion.div>
             )
           })}
        </div>
      </div>

      {/* ==============================
          2. THE VANDE BHARAT NOSE (Bottom Center)
      ============================== */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] z-20 pointer-events-none">
         {/* The tapering nose cone */}
         <div className="w-full h-full bg-gradient-to-b from-white via-slate-200 to-slate-400 rounded-t-[100%] shadow-[0_-10px_50px_rgba(0,0,0,0.5)] relative overflow-hidden border-t-4 border-blue-600">
            {/* Blue Vande Bharat Stripes */}
            <div className="absolute top-0 left-[20%] w-[60%] h-full bg-blue-700/20 transform -skew-x-12 blur-sm"></div>
            {/* Orange Nose Accent */}
            <div className="absolute bottom-0 left-[35%] w-[30%] h-10 bg-orange-500 blur-md opacity-80"></div>
            {/* Windshield reflection */}
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-cyan-500/10 to-transparent opacity-50"></div>
         </div>
      </div>


      {/* ==============================
          3. HOLOGRAPHIC HUD LAYERS
      ============================== */}
      
      {/* TOP LEFT: Coffee Streak Holo */}
      <div className="absolute top-6 left-6 z-30 flex items-center gap-3 p-3 bg-black/40 backdrop-blur-md border border-orange-500/30 rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.2)]">
         <div className="relative w-10 h-12 bg-white/5 border border-white/20 rounded-lg overflow-hidden flex items-end">
            <motion.div animate={{ height: `${streakFill}%` }} className="w-full bg-gradient-to-t from-orange-600 to-yellow-400" />
            <Coffee className="absolute inset-0 w-full h-full p-2 text-white/40" />
         </div>
         <div>
            <p className="text-[10px] text-orange-400 tracking-widest">STREAK FUEL</p>
            <p className="text-xl font-black text-white drop-shadow-[0_0_5px_orange]">{user.streak_count} DAYS</p>
         </div>
      </div>

      {/* TOP CENTER: Broadcast Ticker Holo */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[40%] h-10 bg-black/40 backdrop-blur-md border border-red-500/30 rounded overflow-hidden flex items-center z-30">
         <motion.div 
           animate={{ x: ["100%", "-100%"] }} 
           transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
           className="whitespace-nowrap text-red-400 font-bold tracking-[0.2em] drop-shadow-[0_0_5px_red]"
         >
           {globalMsg || `VANDE BHARAT EXPRESS /// PILOT: ${user.username} /// EN ROUTE TO SUCCESS ///`}
         </motion.div>
      </div>

      {/* TOP RIGHT: Sunshield Toggle Holo */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="absolute top-6 right-6 z-50 p-3 bg-cyan-950/50 border border-cyan-400/50 rounded-full text-cyan-400 hover:bg-cyan-900 transition-all shadow-[0_0_20px_cyan]"
      >
        {isChatOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
      </button>

      {/* BOTTOM RIGHT: Speed & Efficiency Holo */}
      <div className="absolute bottom-6 right-6 z-30 flex flex-col items-end gap-4">
         {/* Speedometer */}
         <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full animate-spin-slow opacity-50">
               <circle cx="50%" cy="50%" r="45%" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeDasharray="10,10" />
            </svg>
            <div className="text-center">
               <p className="text-6xl font-black text-white drop-shadow-[0_0_15px_cyan]">{speed}</p>
               <p className="text-sm text-cyan-400 font-bold">KM/H</p>
            </div>
         </div>
         {/* Efficiency Bar */}
         <div className="flex items-center gap-3 p-3 bg-black/40 backdrop-blur-md border border-blue-500/30 rounded-xl">
            <div>
               <p className="text-[10px] text-blue-400 tracking-widest text-right">NEURAL LOAD</p>
               <p className="text-2xl font-black text-white text-right drop-shadow-[0_0_5px_blue]">{progress}%</p>
            </div>
            <Zap className="text-yellow-400 animate-pulse fill-current" size={28} />
         </div>
      </div>

      {/* ==============================
          4. THE CHAT VISOR OVERLAY
      ============================== */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ type: "spring", stiffness: 90, damping: 15 }}
            className="absolute top-0 inset-x-0 h-[70vh] bg-black/90 backdrop-blur-xl border-b-4 border-cyan-500 z-40 flex flex-col"
          >
             <div className="h-8 w-full flex justify-center items-center border-b border-white/10">
                <div className="w-24 h-1 bg-cyan-500/50 rounded-full"></div>
             </div>
             <div className="flex-1 overflow-hidden relative p-4">
                <StudyChat user={user} isTunnel={true} />
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronUp, Coffee, Zap, TrainFront, Home, Users, Ticket, Shield, BookOpen, Gauge 
} from 'lucide-react';
import StudyChat from './StudyChat';

export default function RailwayDreamTunnel({ user, globalMsg, isDarkMode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [displayedSpeed, setDisplayedSpeed] = useState(0);
  const [progress, setProgress] = useState(0);
  
  // Cap progress at 100%
  const actualScore = Math.min(user?.total_percentage_points || 0, 100);

  // 🚂 ACCELERATION PHYSICS
  useEffect(() => {
    // 1. Progress Bar
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= actualScore) {
          clearInterval(interval);
          return actualScore;
        }
        return p + 1;
      });
    }, 50);

    // 2. Speedometer Needle (Simulated lag)
    const speedTarget = Math.floor(actualScore * 3.5); // Max 350 km/h
    const speedInterval = setInterval(() => {
      setDisplayedSpeed(s => {
        if (s >= speedTarget) {
          clearInterval(speedInterval);
          return speedTarget;
        }
        return s + 4; // Accelerate
      });
    }, 30);

    return () => { clearInterval(interval); clearInterval(speedInterval); };
  }, [actualScore]);

  // 🛤️ NEON DREAM MILESTONES
  const dreams = [
    { id: 1, val: 5, icon: <BookOpen size={90} />, label: "SYLLABUS", color: "text-white", border: "border-white", glow: "shadow-white" },
    { id: 2, val: 25, icon: <Ticket size={90} />, label: "FREE PASS", color: "text-green-400", border: "border-green-500", glow: "shadow-green-500" },
    { id: 3, val: 50, icon: <Home size={90} />, label: "QUARTERS", color: "text-yellow-400", border: "border-yellow-500", glow: "shadow-yellow-500" },
    { id: 4, val: 75, icon: <Users size={90} />, label: "RESPECT", color: "text-pink-400", border: "border-pink-500", glow: "shadow-pink-500" },
    { id: 5, val: 95, icon: <TrainFront size={90} />, label: "OFFICER", color: "text-cyan-400", border: "border-cyan-500", glow: "shadow-cyan-500" },
  ];

  // ☕ STREAK LIQUID
  const liquidHeight = Math.min((user.streak_count / 365) * 100, 100);

  return (
    <div className="relative w-full h-[90vh] rounded-[2rem] overflow-hidden border-4 border-[#111] shadow-[0_0_50px_rgba(0,255,255,0.1)] flex flex-col bg-black font-mono select-none">
      
      {/* ==============================
          1. TOP LED BROADCAST BAR
      ============================== */}
      <div className="z-50 bg-[#080808] border-b-2 border-[#333] h-16 flex items-center justify-between relative shadow-2xl">
        {/* Coffee Capacitor */}
        <div className="pl-6 flex items-center">
           <div className="relative w-10 h-10 bg-[#1a1a1a] rounded border border-[#333] overflow-hidden flex items-end shadow-[0_0_15px_rgba(255,100,0,0.4)]">
              <div className="w-full bg-gradient-to-t from-orange-600 to-yellow-500 transition-all duration-1000" style={{ height: `${liquidHeight}%` }}>
                <div className="w-full h-1 bg-white/50 animate-pulse"></div>
              </div>
              <Coffee className="absolute inset-0 w-full h-full text-white/40 p-2" />
              <div className="absolute -top-1 -right-1 bg-red-600 text-[9px] px-1.5 py-0.5 rounded-bl-lg font-black text-white">{user.streak_count}</div>
           </div>
        </div>

        {/* Scrolling LED Matrix */}
        <div className="flex-1 mx-6 h-10 bg-[#1a0505] border-2 border-[#521] rounded-sm overflow-hidden relative flex items-center shadow-[inset_0_0_20px_rgba(255,0,0,0.2)]">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-20 pointer-events-none"></div>
           {/* Scanline */}
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/10 to-transparent h-[5px] w-full animate-[scan_2s_linear_infinite] pointer-events-none"></div>
           <motion.div 
             animate={{ x: ["100%", "-100%"] }} 
             transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
             className="whitespace-nowrap text-red-500 font-bold text-xl tracking-[0.2em] drop-shadow-[0_0_10px_red]"
           >
             {globalMsg || `/// NEURAL EXPRESS /// SPEED: ${displayedSpeed} KM/H /// NEXT STATION: NTPC 2026 /// FOCUS MODE ACTIVE ///`}
           </motion.div>
        </div>

        {/* Sunshield Toggle */}
        <div className="pr-6">
           <button 
             onClick={() => setIsChatOpen(!isChatOpen)}
             className={`p-2 rounded-full border-2 transition-all hover:scale-110 active:scale-95 ${isChatOpen ? 'bg-cyan-900/80 text-cyan-400 border-cyan-400 shadow-[0_0_20px_cyan]' : 'bg-[#111] text-gray-500 border-[#333]'}`}
           >
             {isChatOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
           </button>
        </div>
      </div>

      {/* ==============================
          2. THE NEON 3D ENGINE
      ============================== */}
      <div className="flex-1 relative overflow-hidden bg-black perspective-[800px]">
         
         {/* THE TRACK (Moving Floor) */}
         <div 
            className="absolute inset-0 w-full h-full flex items-end justify-center"
            style={{ perspective: '500px' }} // Tighter FOV = Faster Speed Feeling
         >
            {/* HEADLIGHT BEAM (Brighter) */}
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[50vw] h-[100vh] bg-gradient-to-b from-cyan-500/10 via-cyan-900/5 to-transparent blur-2xl pointer-events-none"></div>

            {/* THE MOVING NEON TRACK */}
            <div 
               className="relative w-[800px] h-[200%] origin-bottom transform-style-3d bg-[#020202]"
               style={{ transform: 'rotateX(60deg) translateY(0px)' }}
            >
               {/* ANIMATED TEXTURE */}
               <motion.div 
                 animate={{ translateY: [0, 200] }} 
                 transition={{ repeat: Infinity, duration: 0.12, ease: "linear" }}
                 className="absolute inset-0 w-full h-full opacity-100"
                 style={{
                   // 🔥 NEON GRADIENT LOGIC
                   backgroundImage: `
                     linear-gradient(90deg, 
                       #000 15%, 
                       #0891b2 15%, #22d3ee 17%, #0891b2 19%, /* LEFT NEON RAIL */
                       #0a0a0a 19%, #0a0a0a 81%,             /* Dark Ballast */
                       #0891b2 81%, #22d3ee 83%, #0891b2 85%, /* RIGHT NEON RAIL */
                       #000 85%
                     ),
                     repeating-linear-gradient(180deg, 
                       transparent 0px, 
                       transparent 80px, 
                       rgba(6, 182, 212, 0.1) 80px,  /* Faint Neon Sleeper Glow */
                       rgba(6, 182, 212, 0.1) 120px
                     )
                   `,
                   backgroundBlendMode: 'screen',
                   backgroundSize: '100% 200px'
                 }}
               />
               
               {/* CENTER ELECTRIC LINE (Pulse) */}
               <motion.div 
                 animate={{ opacity: [0.5, 1, 0.5] }}
                 transition={{ repeat: Infinity, duration: 0.5 }}
                 className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 bg-cyan-400 shadow-[0_0_30px_cyan]" 
               />
            </div>

            {/* TUNNEL WALL LIGHTS (Passing Brighter) */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div 
                  animate={{ scale: [0.1, 1.5], opacity: [0, 0.8, 0], x: [-100, -600], y: [0, 200] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  className="absolute top-[40%] left-1/2 w-4 h-64 bg-cyan-400 blur-xl rounded-full mix-blend-screen" 
                />
                <motion.div 
                  animate={{ scale: [0.1, 1.5], opacity: [0, 0.8, 0], x: [100, 600], y: [0, 200] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: 0.6, ease: "linear" }}
                  className="absolute top-[40%] left-1/2 w-4 h-64 bg-purple-400 blur-xl rounded-full mix-blend-screen" 
                />
            </div>
         </div>

         {/* 3. DREAM OBJECTS (Stationary Logic with Neon Borders) */}
         <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {dreams.map((item, i) => {
               const isUnlocked = progress >= item.val;
               
               return (
                 <motion.div
                   key={item.id}
                   initial={{ scale: 0.1, y: -50, opacity: 0.2 }} 
                   animate={
                     isUnlocked 
                       ? { 
                           scale: [0.1, 15], 
                           y: [-50, 1500],   
                           opacity: [1, 0],
                           filter: ["blur(0px)", "blur(10px)"]
                         }
                       : { 
                           scale: 0.15, 
                           y: -50,
                           opacity: 0.8, // Brighter when locked so you can see it
                           filter: "blur(0px)"
                         }
                   }
                   transition={
                     isUnlocked
                       ? { duration: 1.2, ease: "easeIn" } // Flyby
                       : { duration: 0 } // Static
                   }
                   className={`absolute flex flex-col items-center z-10`}
                 >
                    {/* 🔥 THE NEON BORDER CONTAINER */}
                    <div className={`
                      p-8 rounded-full border-[6px] bg-black 
                      ${item.color} ${item.border} ${item.glow} 
                      shadow-[0_0_80px_currentColor] 
                      relative
                    `}>
                      <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse"></div>
                      {item.icon}
                    </div>
                    
                    {/* LABEL */}
                    <div className={`
                      mt-6 px-6 py-2 bg-black border-2 ${item.border} text-white 
                      text-lg font-black tracking-widest uppercase shadow-2xl
                      ${!isUnlocked ? 'opacity-70 scale-90' : 'opacity-100 scale-110'}
                    `}>
                      {item.label} <span className="text-xs ml-2 text-gray-400">{item.val}%</span>
                    </div>
                 </motion.div>
               );
            })}
         </div>

      </div>

      {/* ==============================
          4. THE COCKPIT (Bullet Train Frame)
      ============================== */}
      <div className="absolute inset-0 z-30 pointer-events-none">
         
         {/* WINDSHIELD FRAME */}
         <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <defs>
               <linearGradient id="frameGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#111" />
                  <stop offset="100%" stopColor="#000" />
               </linearGradient>
            </defs>
            <path 
               fill="url(#frameGrad)"
               d="M0,0 L1000,0 L1000,1000 L0,1000 Z M50,50 Q500,-50 950,50 L950,600 Q500,650 50,600 Z" 
               transform="scale(1, 1)"
               className="opacity-95"
            />
         </svg>
         
         {/* CSS Bezel Glow */}
         <div className="absolute inset-0 border-[50px] border-transparent rounded-[3rem] shadow-[inset_0_0_50px_rgba(0,255,255,0.05)]"></div>
         
         {/* DASHBOARD CONSOLE */}
         <div className="absolute bottom-0 w-full h-48 bg-[#050505] border-t-4 border-[#222] flex items-center justify-between px-12 pb-4 shadow-[0_-10px_50px_black] rounded-t-[40%]">
            
            {/* Left Diagnostics */}
            <div className="hidden md:flex flex-col gap-2 opacity-80">
               <div className="flex gap-1">
                  <div className="w-10 h-2 bg-cyan-500 rounded-sm animate-pulse shadow-[0_0_10px_cyan]"></div>
                  <div className="w-4 h-2 bg-cyan-800 rounded-sm"></div>
                  <div className="w-4 h-2 bg-cyan-800 rounded-sm"></div>
               </div>
               <p className="text-[9px] text-cyan-600 font-bold uppercase tracking-widest">Hydraulics</p>
            </div>

            {/* CENTER SPEEDOMETER */}
            <div className="relative w-44 h-44 -mt-16 bg-[#080808] rounded-full border-8 border-[#1a1a1a] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex items-center justify-center">
               <div className="absolute inset-0 rounded-full border-[2px] border-cyan-500/30"></div>
               {/* Tick Marks */}
               {[...Array(12)].map((_,i) => (
                  <div key={i} className="absolute w-1 h-3 bg-gray-600 top-2" style={{ transform: `rotate(${i * 30}deg)`, transformOrigin: '50% 78px' }}></div>
               ))}
               
               <div className="text-center z-10 mt-6">
                  <span className="text-6xl font-black text-cyan-400 font-mono tracking-tighter drop-shadow-[0_0_15px_cyan]">{displayedSpeed}</span>
                  <div className="text-[10px] text-gray-500 font-bold mt-1">KM/H</div>
               </div>
               
               {/* RPM Ring */}
               <div 
                 className="absolute inset-3 rounded-full border-b-[6px] border-cyan-500 opacity-80 blur-[1px]"
                 style={{ transform: `rotate(${progress * 2.4}deg)`, transition: 'transform 0.1s linear' }}
               ></div>
            </div>

            {/* Right Diagnostics */}
            <div className="hidden md:flex flex-col text-right">
               <div className="flex items-center justify-end gap-3 text-yellow-400">
                  <Zap size={24} className="fill-current animate-bounce" />
                  <span className="text-3xl font-black">{progress}%</span>
               </div>
               <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Neural Load</p>
            </div>

         </div>
      </div>

      {/* ==============================
          5. THE SUNSHIELD (Chat)
      ============================== */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="absolute top-0 right-4 md:right-20 w-[90%] md:w-[400px] h-[70%] bg-[#0a0f18] border-x-4 border-b-4 border-cyan-800 rounded-b-3xl shadow-[0_0_100px_black] z-40 flex flex-col pointer-events-auto"
          >
             {/* Hinge */}
             <div className="h-8 bg-[#111] w-full border-b border-[#333] flex items-center justify-center gap-2">
                <div className="w-16 h-1.5 bg-[#333] rounded-full"></div>
             </div>

             <div className="flex-1 overflow-hidden relative">
                {/* Chat Interface */}
                <StudyChat user={user} isTunnel={true} />
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
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

  // 🚂 ACCELERATION LOGIC
  useEffect(() => {
    // Animate progress bar fill
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= actualScore) {
          clearInterval(interval);
          return actualScore;
        }
        return p + 1;
      });
    }, 50);

    // Animate Speedometer
    const speedTarget = Math.floor(actualScore * 3.2); // Max ~320 km/h
    const speedInterval = setInterval(() => {
      setDisplayedSpeed(s => {
        if (s >= speedTarget) {
          clearInterval(speedInterval);
          return speedTarget;
        }
        return s + 4;
      });
    }, 50);

    return () => { clearInterval(interval); clearInterval(speedInterval); };
  }, [actualScore]);

  // 🛤️ DREAM MILESTONES
  const dreams = [
    { id: 1, val: 10, icon: <BookOpen size={100} />, label: "SYLLABUS", color: "text-white" },
    { id: 2, val: 30, icon: <Ticket size={100} />, label: "FREE TRAVEL", color: "text-green-400" },
    { id: 3, val: 50, icon: <Home size={100} />, label: "QUARTERS", color: "text-yellow-400" },
    { id: 4, val: 75, icon: <Users size={100} />, label: "PARENTS' PRIDE", color: "text-pink-400" },
    { id: 5, val: 95, icon: <TrainFront size={100} />, label: "LOCO PILOT", color: "text-cyan-400" },
  ];

  // ☕ STREAK LIQUID
  const liquidHeight = Math.min((user.streak_count / 365) * 100, 100);

  return (
    <div className="relative w-full h-[90vh] rounded-[3rem] overflow-hidden border-8 border-[#0a0a0a] shadow-2xl flex flex-col bg-black font-mono select-none">
      
      {/* ==============================
          1. TOP LED BROADCAST BAR
      ============================== */}
      <div className="z-50 bg-[#050505] border-b-4 border-[#1a1a1a] p-2 flex items-center justify-between shadow-xl relative">
        <div className="flex items-center gap-4 pl-4">
           {/* COFFEE GAUGE */}
           <div className="relative w-12 h-12 bg-[#111] rounded-lg border border-[#333] overflow-hidden flex items-end">
              <div 
                className="w-full bg-gradient-to-t from-orange-800 to-orange-500 transition-all duration-1000" 
                style={{ height: `${liquidHeight}%` }}
              >
                <div className="w-full h-1 bg-yellow-200/50 animate-pulse"></div>
              </div>
              <Coffee className="absolute inset-0 w-full h-full text-white/20 p-2 z-10" />
              <span className="absolute top-0 right-1 text-[9px] font-black text-white drop-shadow-md">{user.streak_count}d</span>
           </div>
        </div>

        {/* LED TICKER */}
        <div className="flex-1 mx-6 bg-[#0f0202] rounded border border-[#331111] h-10 flex items-center overflow-hidden relative shadow-[inset_0_0_15px_black]">
           <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.8)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_3px,3px_100%] z-20 pointer-events-none"></div>
           <motion.div 
             animate={{ x: ["100%", "-100%"] }} 
             transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
             className="whitespace-nowrap text-red-500 font-bold text-xl tracking-[0.3em] drop-shadow-[0_0_5px_red]"
           >
             {globalMsg || `/// NEURAL EXPRESS /// SPEED: ${displayedSpeed} KM/H /// NEXT STOP: EXAM HALL /// STAY FOCUSED ///`}
           </motion.div>
        </div>

        {/* SUNSHIELD TOGGLE */}
        <div className="pr-4">
           <button 
             onClick={() => setIsChatOpen(!isChatOpen)}
             className={`p-2 rounded-full border-2 transition-all ${isChatOpen ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_15px_cyan]' : 'bg-[#111] text-cyan-600 border-[#333] hover:border-cyan-600'}`}
           >
             {isChatOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
           </button>
        </div>
      </div>

      {/* ==============================
          2. THE 3D ENGINE (Tunnel)
      ============================== */}
      <div className="flex-1 relative overflow-hidden perspective-[1200px] bg-black">
         
         {/* THE TRACK (Floor Plane) */}
         {/* Fixed "Flat Floor" by lowering translate-y and adjusting rotation */}
         <div 
            className="absolute bottom-[-100px] left-[-50%] w-[200%] h-[150%] bg-[#050505] origin-bottom transform-style-3d"
            style={{ 
              transform: 'rotateX(75deg)', // Less extreme angle for better visibility
            }}
         >
            {/* HEADLIGHT CONE (Illuminates the track ahead) */}
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[600px] h-[100%] bg-gradient-to-t from-transparent via-cyan-900/10 to-transparent pointer-events-none blur-3xl"></div>

            {/* MOVING TRACK TEXTURE */}
            <motion.div 
               className="absolute inset-0 w-full h-full opacity-100"
               animate={{ translateY: [0, 400] }} // Move towards camera
               transition={{ repeat: Infinity, duration: 0.15, ease: "linear" }}
               style={{
                 background: `
                   linear-gradient(90deg, 
                     #000 35%, 
                     #444 35%, #444 37%, /* Left Rail */
                     #1a1a1a 37%, #1a1a1a 63%, /* Ballast */
                     #444 63%, #444 65%, /* Right Rail */
                     #000 65%
                   ),
                   repeating-linear-gradient(180deg, 
                     transparent 0px, 
                     transparent 100px, 
                     #0f0f0f 100px, 
                     #0f0f0f 140px /* Concrete Sleepers */
                   )
                 `,
                 backgroundSize: '100% 400px',
                 backgroundBlendMode: 'overlay'
               }}
            />
            
            {/* Glowing Rails Overlay */}
            <div className="absolute left-[35%] w-2 h-full bg-cyan-500/20 blur-sm"></div>
            <div className="absolute right-[35%] w-2 h-full bg-cyan-500/20 blur-sm"></div>
         </div>

         {/* 3. DREAM OBJECTS (Stationary Logic) */}
         {/* Objects sit at Z=0 (Horizon) and ONLY move when unlocked */}
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none perspective-[1200px]">
            {dreams.map((item, i) => {
               const isUnlocked = progress >= item.val;
               const hasPassed = progress > item.val + 5; 

               return (
                 <motion.div
                   key={item.id}
                   initial={{ scale: 0.1, y: 50, opacity: 0.2 }} // Initial State: Tiny dot in distance
                   animate={
                     isUnlocked 
                       ? { 
                           scale: [0.1, 15], // Zoom HUGE past screen
                           y: [50, 1000],    // Move down/past
                           opacity: [1, 0],
                           filter: ["blur(0px)", "blur(10px)"]
                         }
                       : { 
                           scale: 0.15, // Waiting State: Visible but small
                           opacity: 0.5,
                           y: 50
                         }
                   }
                   transition={
                     isUnlocked
                       ? { duration: 1.2, ease: "easeIn" } // Fast Flyby
                       : { duration: 0 } // Static
                   }
                   className={`absolute flex flex-col items-center z-10 ${hasPassed ? 'hidden' : 'block'}`}
                 >
                    <div className={`p-6 rounded-full border-4 bg-black/90 backdrop-blur-md ${item.color} border-current shadow-[0_0_100px_currentColor]`}>
                      {item.icon}
                    </div>
                    {/* Only show label if unlocked/approaching */}
                    <AnimatePresence>
                      {!isUnlocked && (
                        <motion.span 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }}
                          className="text-xs font-black uppercase text-gray-500 mt-2 bg-black px-2 tracking-[0.5em]"
                        >
                          LOCKED
                        </motion.span>
                      )}
                    </AnimatePresence>
                 </motion.div>
               );
            })}
         </div>

      </div>

      {/* ==============================
          3. THE BULLET TRAIN COCKPIT
      ============================== */}
      <div className="absolute inset-0 z-30 pointer-events-none">
         
         {/* WINDSHIELD SHAPE (SVG CLIP PATH) */}
         <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(0,255,255,0.05)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </linearGradient>
            </defs>
            {/* The Frame - Dark areas outside the glass */}
            <path 
              d="M0,0 L10000,0 L10000,10000 L0,10000 Z M150,50 Q500,0 850,50 L900,600 L100,600 Z" // Adjusted for bullet shape
              fill="#080808" // Frame Color
              transform="scale(1, 1)" // Responsive scaling handled by CSS w/h
              className="w-full h-full"
            />
         </svg>

         {/* Center Pillar */}
         <div className="absolute top-0 bottom-[150px] left-1/2 w-2 -translate-x-1/2 bg-gradient-to-b from-[#111] to-[#222] border-x border-[#333]"></div>

         {/* DASHBOARD CONSOLE (Bottom) */}
         <div className="absolute bottom-0 w-full h-48 bg-[#0a0a0a] border-t-8 border-[#1a1a1a] flex items-center justify-between px-16 shadow-2xl rounded-t-[3rem]">
            
            {/* Speedometer Gauge */}
            <div className="relative w-36 h-36 bg-black rounded-full border-4 border-[#333] flex items-center justify-center shadow-[0_0_40px_black] overflow-hidden">
               <div className="absolute inset-0 rounded-full border-[10px] border-cyan-900/30 border-t-cyan-500/50 rotate-[-45deg]"></div>
               
               <div className="text-center z-10">
                  <span className="text-5xl font-black text-cyan-400 font-mono tracking-tighter">{displayedSpeed}</span>
                  <p className="text-[10px] text-gray-500 font-bold mt-1">KM/H</p>
               </div>
               
               {/* Digital RPM Bar */}
               <div className="absolute bottom-4 w-20 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${progress}%` }} className="h-full bg-red-500" />
               </div>
            </div>

            {/* Center Diagnostics */}
            <div className="flex flex-col items-center gap-2">
               <div className="flex gap-2">
                  <div className={`w-16 h-2 rounded-full ${progress > 0 ? 'bg-green-500 shadow-[0_0_10px_lime]' : 'bg-red-900'}`}></div>
                  <div className={`w-16 h-2 rounded-full ${progress > 50 ? 'bg-green-500 shadow-[0_0_10px_lime]' : 'bg-red-900'}`}></div>
                  <div className={`w-16 h-2 rounded-full ${progress > 90 ? 'bg-green-500 shadow-[0_0_10px_lime]' : 'bg-red-900'}`}></div>
               </div>
               <span className="text-xs text-cyan-600 font-black tracking-[0.5em] mt-2">NEURAL SYNC</span>
            </div>

            {/* Right Controls */}
            <div className="text-right">
               <div className="flex items-center gap-3 justify-end mb-2">
                  <Zap size={24} className="text-yellow-500 animate-pulse" />
                  <span className="text-3xl font-black text-white">{progress}%</span>
               </div>
               <p className="text-[8px] text-gray-500 uppercase tracking-widest">Efficiency Output</p>
            </div>

         </div>
      </div>

      {/* ==============================
          4. THE SUNSHIELD (Chat)
      ============================== */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="absolute top-0 right-10 w-[400px] h-[65%] bg-[#0f172a] border-x-4 border-b-4 border-cyan-800 rounded-b-3xl shadow-[0_0_80px_black] z-40 flex flex-col pointer-events-auto"
          >
             {/* Hinge Graphic */}
             <div className="h-8 bg-[#111] w-full border-b border-[#333] flex items-center justify-center gap-2">
                <div className="w-16 h-2 bg-[#222] rounded-full"></div>
             </div>

             <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0 bg-blue-900/10 pointer-events-none z-10 mix-blend-overlay"></div>
                {/* Clean Chat Interface */}
                <StudyChat user={user} isTunnel={true} />
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
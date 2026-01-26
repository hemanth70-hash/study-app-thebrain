import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronUp, Coffee, Zap, TrainFront, Home, Users, Briefcase, Ticket, Shield, BookOpen, Gauge 
} from 'lucide-react';
import StudyChat from './StudyChat';

export default function RailwayDreamTunnel({ user, globalMsg, isDarkMode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [displayedSpeed, setDisplayedSpeed] = useState(0);
  
  // 🧠 CORE LOGIC: GPA = SPEED
  // We assume 'total_percentage_points' is the GPA proxy (0-100).
  const rawScore = user?.total_percentage_points || 0;
  // Calculate Animation Duration (Lower is Faster)
  // 0 GPA = 2s duration (Crawling)
  // 100 GPA = 0.2s duration (Bullet Train)
  const trackSpeedDuration = Math.max(0.2, 2 - (rawScore / 55)); 
  
  // Simulating Speedometer Ramp-up
  useEffect(() => {
    const targetSpeed = Math.floor(rawScore * 3.5); // Convert GPA to KM/H (approx 350km/h max)
    const interval = setInterval(() => {
      setDisplayedSpeed(prev => {
        if (prev >= targetSpeed) {
          clearInterval(interval);
          return targetSpeed;
        }
        return prev + 2;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [rawScore]);

  // 🛤️ DREAM MILESTONES (Stationary Targets)
  // They stay distant until you hit the %, then they fly past "crossing" you.
  const dreams = [
    { id: 1, val: 10, icon: <BookOpen size={120} />, label: "SYLLABUS COMPLETE", color: "text-white" },
    { id: 2, val: 30, icon: <Ticket size={120} />, label: "PASS ISSUED", color: "text-green-400" },
    { id: 3, val: 50, icon: <Home size={120} />, label: "QUARTERS ALLOTTED", color: "text-yellow-400" },
    { id: 4, val: 75, icon: <Users size={120} />, label: "FAMILY SECURED", color: "text-pink-400" },
    { id: 5, val: 95, icon: <TrainFront size={120} />, label: "LOCO PILOT", color: "text-cyan-400" },
  ];

  // ☕ STREAK LIQUID
  const liquidHeight = Math.min((user.streak_count / 365) * 100, 100);

  return (
    <div className="relative w-full h-[90vh] rounded-[2rem] overflow-hidden border-8 border-[#0a0a0a] shadow-2xl flex flex-col bg-black font-mono select-none">
      
      {/* ==============================
          1. TOP BROADCAST BAR (The Ceiling)
      ============================== */}
      <div className="z-50 bg-[#050505] border-b-4 border-[#222] p-2 flex items-center justify-between shadow-xl relative">
        {/* COFFEE GAUGE */}
        <div className="flex items-center gap-4 pl-4">
           <div className="relative w-12 h-12 bg-[#1a1a1a] rounded-lg border-2 border-[#333] overflow-hidden flex items-end shadow-[0_0_15px_rgba(255,165,0,0.2)]">
              <div 
                className="w-full bg-gradient-to-t from-orange-700 to-orange-500 transition-all duration-1000" 
                style={{ height: `${liquidHeight}%` }}
              >
                <div className="w-full h-1 bg-yellow-200/30 animate-pulse"></div>
              </div>
              <Coffee className="absolute inset-0 w-full h-full text-white/10 p-2 z-10" />
              <span className="absolute top-0 right-1 text-[10px] font-black text-white drop-shadow-md">{user.streak_count}d</span>
           </div>
        </div>

        {/* LED TICKER */}
        <div className="flex-1 mx-6 bg-[#100505] rounded border border-[#331111] h-10 flex items-center overflow-hidden relative shadow-[inset_0_0_20px_black]">
           <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.8)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_3px,3px_100%] z-20 pointer-events-none"></div>
           <motion.div 
             animate={{ x: ["100%", "-100%"] }} 
             transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
             className="whitespace-nowrap text-red-500 font-bold text-xl tracking-[0.3em] drop-shadow-[0_0_8px_red]"
           >
             {globalMsg || `/// RRB EXPRESS /// SPEED: ${displayedSpeed} KM/H /// NEXT STOP: EXAM HALL /// STAY FOCUSED ///`}
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
          2. THE 3D ENGINE (The Tunnel)
      ============================== */}
      <div className="flex-1 relative overflow-hidden perspective-[1000px] bg-black">
         
         {/* THE TURNING MECHANISM: perspective-origin simulates turning */}
         <div 
            className="absolute inset-0 w-full h-full"
            style={{
               perspective: '600px',
               perspectiveOrigin: '50% 50%', // Center vanish point
               animation: 'sway 8s ease-in-out infinite' // SIMULATES TURNING LEFT/RIGHT
            }}
         >
            <style>{`
              @keyframes sway {
                0% { perspective-origin: 50% 50%; }
                25% { perspective-origin: 30% 50%; } /* Left Turn */
                75% { perspective-origin: 70% 50%; } /* Right Turn */
                100% { perspective-origin: 50% 50%; }
              }
              @keyframes trackMove {
                from { background-position: 0 0; }
                to { background-position: 0 400px; } /* Move Towards Player */
              }
            `}</style>

            {/* TUNNEL WALLS (Radial Gradient trick for depth) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_10%,_#000_90%)] z-10 pointer-events-none"></div>
            
            {/* THE TRACK (Floor Plane) */}
            <div 
               className="absolute bottom-0 left-[-50%] w-[200%] h-[100%] bg-[#0a0a0a] origin-bottom transform-style-3d"
               style={{ 
                 transform: 'rotateX(85deg)', // Flat floor looking deep
                 background: `
                   linear-gradient(90deg, transparent 40%, #333 40%, #333 42%, #1a1a1a 42%, #1a1a1a 58%, #333 58%, #333 60%, transparent 60%),
                   repeating-linear-gradient(180deg, #0a0a0a 0px, #0a0a0a 40px, #151515 40px, #151515 80px)
                 `, // Draws rails and sleepers
                 backgroundSize: '100% 100%',
                 animation: `trackMove ${trackSpeedDuration}s linear infinite` // SPEED LINKED TO GPA
               }}
            >
               {/* Glowing Third Rail */}
               <div className="absolute left-1/2 top-0 bottom-0 w-2 -translate-x-1/2 bg-cyan-500/50 shadow-[0_0_20px_cyan] blur-sm"></div>
            </div>

            {/* TUNNEL LIGHTS (Passing Overhead) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-full pointer-events-none">
               <motion.div 
                 animate={{ y: [ -500, 1000 ], opacity: [0, 1, 0], scale: [0.1, 1.5] }}
                 transition={{ repeat: Infinity, duration: trackSpeedDuration * 2, ease: "linear" }}
                 className="absolute top-0 left-1/2 w-40 h-2 bg-yellow-200/20 blur-xl rounded-full"
               />
            </div>
         </div>

         {/* 3. DREAM OBJECTS (The "Why") */}
         {/* Objects sit in center (distance) and fly at camera only when unlocked */}
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            {dreams.map((item, i) => {
               const isUnlocked = rawScore >= item.val;
               const speed = trackSpeedDuration * 4; // Flyby speed

               return (
                 <motion.div
                   key={item.id}
                   initial={{ scale: 0, opacity: 0, y: 50 }} // Start tiny in distance
                   animate={
                     isUnlocked 
                       ? { 
                           scale: [0.1, 10], // Grow huge
                           y: [50, 800], // Move down (past train)
                           x: i % 2 === 0 ? [0, -1500] : [0, 1500], // Fly left/right
                           opacity: [0, 1, 0]
                         }
                       : { 
                           scale: 0.2, // Locked: Stay small in distance
                           opacity: 0.3,
                           y: 50
                         }
                   }
                   transition={
                     isUnlocked
                       ? { duration: speed, repeat: Infinity, repeatDelay: i + 1, ease: "easeIn" }
                       : { duration: 0 }
                   }
                   className="absolute flex flex-col items-center"
                 >
                    <div className={`p-6 rounded-xl border-4 bg-black/80 backdrop-blur ${item.color} border-current shadow-[0_0_80px_currentColor]`}>
                      {item.icon}
                    </div>
                    {isUnlocked && (
                      <span className="text-6xl font-black uppercase text-white mt-4 bg-black/60 px-6 border-2 border-white/20">
                        {item.label}
                      </span>
                    )}
                 </motion.div>
               );
            })}
         </div>

      </div>

      {/* ==============================
          4. THE COCKPIT OVERLAY (Foreground)
      ============================== */}
      <div className="absolute inset-0 z-30 pointer-events-none">
         
         {/* Windshield Frame */}
         <div className="absolute inset-0 border-[40px] border-[#111] rounded-[2rem] shadow-[inset_0_0_100px_black]"></div>
         
         {/* Center Pillar */}
         <div className="absolute top-0 bottom-0 left-1/2 w-4 bg-[#1a1a1a] border-x border-[#333]"></div>

         {/* Dashboard (Bottom) */}
         <div className="absolute bottom-0 w-full h-40 bg-[#0a0a0a] border-t-8 border-[#222] flex items-center justify-between px-10 shadow-2xl">
            
            {/* Speedometer Gauge */}
            <div className="relative w-32 h-32 bg-black rounded-full border-4 border-gray-700 flex items-center justify-center shadow-[0_0_30px_black]">
               <Gauge size={80} className="text-gray-800" />
               <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
                  <span className="text-4xl font-black text-cyan-400 font-mono tracking-tighter">{displayedSpeed}</span>
                  <span className="text-[10px] text-gray-500 font-bold">KM/H</span>
               </div>
               {/* Needle */}
               <motion.div 
                 className="absolute bottom-1/2 left-1/2 w-1 h-14 bg-red-600 origin-bottom"
                 animate={{ rotate: -90 + (rawScore * 1.8) }} // -90deg to +90deg
                 style={{ x: '-50%' }}
               />
            </div>

            {/* Center Console */}
            <div className="flex flex-col items-center">
               <div className="flex gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${rawScore > 0 ? 'bg-green-500 shadow-[0_0_10px_lime]' : 'bg-red-900'}`}></div>
                  <div className={`w-3 h-3 rounded-full ${rawScore > 50 ? 'bg-green-500 shadow-[0_0_10px_lime]' : 'bg-red-900'}`}></div>
                  <div className={`w-3 h-3 rounded-full ${rawScore > 90 ? 'bg-green-500 shadow-[0_0_10px_lime]' : 'bg-red-900'}`}></div>
               </div>
               <span className="text-xs text-gray-600 font-bold tracking-[0.3em]">ENGINE STATUS</span>
            </div>

            {/* Right Controls */}
            <div className="text-right">
               <div className="flex items-center gap-2 justify-end mb-1">
                  <Zap size={16} className="text-yellow-500 animate-pulse" />
                  <span className="text-xl font-black text-white">{rawScore}%</span>
               </div>
               <div className="w-40 h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                  <motion.div 
                    animate={{ width: `${rawScore}%` }} 
                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_15px_cyan]" 
                  />
               </div>
               <p className="text-[8px] text-gray-500 mt-1 uppercase">Neural Output</p>
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
            transition={{ type: "spring", bounce: 0.1 }}
            className="absolute top-0 right-10 w-[400px] h-[65%] bg-[#080808] border-x-4 border-b-4 border-cyan-800 rounded-b-2xl shadow-[0_0_100px_black] z-40 flex flex-col pointer-events-auto"
          >
             {/* Hinge */}
             <div className="h-6 bg-[#1a1a1a] w-full border-b border-[#333] flex justify-center gap-10">
                <div className="w-2 h-full bg-[#333]"></div>
                <div className="w-2 h-full bg-[#333]"></div>
             </div>

             <div className="flex-1 overflow-hidden relative">
                <StudyChat user={user} isTunnel={true} />
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
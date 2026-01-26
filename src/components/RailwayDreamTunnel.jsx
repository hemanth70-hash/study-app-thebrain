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
  
  // Cap progress at 100%
  const actualScore = Math.min(user?.total_percentage_points || 0, 100);

  // 🚂 ACCELERATION PHYSICS
  useEffect(() => {
    // 1. Bar Progress
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= actualScore) {
          clearInterval(interval);
          return actualScore;
        }
        return p + 1;
      });
    }, 50);

    // 2. Speedometer Needle (Simulated lag/physics)
    const speedTarget = Math.floor(actualScore * 3.5); // Max 350 km/h
    const speedInterval = setInterval(() => {
      setDisplayedSpeed(s => {
        if (s >= speedTarget) {
          clearInterval(speedInterval);
          return speedTarget;
        }
        return s + 3; // Accelerate
      });
    }, 30);

    return () => { clearInterval(interval); clearInterval(speedInterval); };
  }, [actualScore]);

  // 🛤️ DREAM MILESTONES
  const dreams = [
    { id: 1, val: 5, icon: <BookOpen size={80} />, label: "SYLLABUS", color: "text-white", glow: "shadow-white" },
    { id: 2, val: 25, icon: <Ticket size={80} />, label: "FREE TRAVEL", color: "text-green-400", glow: "shadow-green-500" },
    { id: 3, val: 50, icon: <Home size={80} />, label: "QUARTERS", color: "text-yellow-400", glow: "shadow-yellow-500" },
    { id: 4, val: 75, icon: <Users size={80} />, label: "PARENTS' PRIDE", color: "text-pink-400", glow: "shadow-pink-500" },
    { id: 5, val: 95, icon: <TrainFront size={80} />, label: "LOCO PILOT", color: "text-cyan-400", glow: "shadow-cyan-500" },
  ];

  // ☕ STREAK LIQUID
  const liquidHeight = Math.min((user.streak_count / 365) * 100, 100);

  return (
    <div className="relative w-full h-[90vh] rounded-[2rem] overflow-hidden border-4 border-[#111] shadow-2xl flex flex-col bg-black font-mono select-none">
      
      {/* ==============================
          1. TOP LED BROADCAST BAR
      ============================== */}
      <div className="z-50 bg-[#080808] border-b-2 border-[#222] h-14 flex items-center justify-between relative shadow-2xl">
        {/* Coffee Capacitor */}
        <div className="pl-4 flex items-center">
           <div className="relative w-10 h-10 bg-[#1a1a1a] rounded border border-[#333] overflow-hidden flex items-end shadow-[0_0_10px_rgba(255,100,0,0.2)]">
              <div className="w-full bg-orange-600 transition-all duration-1000" style={{ height: `${liquidHeight}%` }}>
                <div className="w-full h-1 bg-yellow-400 animate-pulse"></div>
              </div>
              <Coffee className="absolute inset-0 w-full h-full text-white/30 p-2" />
              <div className="absolute top-0 right-0 bg-red-600 text-[8px] px-1 font-bold text-white">{user.streak_count}</div>
           </div>
        </div>

        {/* Scrolling LED Matrix */}
        <div className="flex-1 mx-4 h-8 bg-[#150505] border border-[#421] rounded overflow-hidden relative flex items-center">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-30 pointer-events-none"></div>
           <motion.div 
             animate={{ x: ["100%", "-100%"] }} 
             transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
             className="whitespace-nowrap text-red-500 font-bold text-lg tracking-[0.2em] drop-shadow-[0_0_8px_red]"
           >
             {globalMsg || `/// NEURAL EXPRESS /// SPEED: ${displayedSpeed} KM/H /// NEXT STOP: EXAM HALL /// STAY FOCUSED ///`}
           </motion.div>
        </div>

        {/* Sunshield Toggle */}
        <div className="pr-4">
           <button 
             onClick={() => setIsChatOpen(!isChatOpen)}
             className={`p-2 rounded-full border transition-all ${isChatOpen ? 'bg-cyan-900/50 text-cyan-400 border-cyan-500 shadow-[0_0_10px_cyan]' : 'bg-[#111] text-gray-500 border-[#333]'}`}
           >
             {isChatOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
           </button>
        </div>
      </div>

      {/* ==============================
          2. THE 3D ENGINE (The Tunnel)
      ============================== */}
      <div className="flex-1 relative overflow-hidden bg-black perspective-[800px]">
         
         {/* THE TRACK (Moving Floor) */}
         <div 
            className="absolute inset-0 w-full h-full flex items-end justify-center"
            style={{ perspective: '600px' }} // Tight FOV for speed feeling
         >
            {/* HEADLIGHT BEAM */}
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[60vw] h-[100vh] bg-gradient-to-b from-cyan-900/10 to-transparent blur-3xl pointer-events-none"></div>

            {/* THE MOVING TRACK PLANE */}
            <div 
               className="relative w-[800px] h-[200%] origin-bottom transform-style-3d bg-[#050505]"
               style={{ 
                 transform: 'rotateX(60deg) translateY(0px)', // Angles the floor up
               }}
            >
               {/* ANIMATED SLEEPERS (The Ties) */}
               <motion.div 
                 animate={{ translateY: [0, 200] }} 
                 transition={{ repeat: Infinity, duration: 0.15, ease: "linear" }}
                 className="absolute inset-0 w-full h-full opacity-100"
                 style={{
                   // High Contrast Gradients for VISIBILITY
                   backgroundImage: `
                     linear-gradient(90deg, 
                       #000 15%, 
                       #333 15%, #555 18%, #333 21%, /* Left Rail */
                       #111 21%, #1a1a1a 79%,           /* Dark Ballast */
                       #333 79%, #555 82%, #333 85%, /* Right Rail */
                       #000 85%
                     ),
                     repeating-linear-gradient(180deg, 
                       transparent 0px, 
                       transparent 80px, 
                       #2a2a2a 80px, 
                       #1a1a1a 120px /* The Concrete Sleeper */
                     )
                   `,
                   backgroundBlendMode: 'normal',
                   backgroundSize: '100% 200px'
                 }}
               />
               
               {/* CENTER ELECTRIC LINE (Glowing) */}
               <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 bg-cyan-500/20 shadow-[0_0_20px_cyan]"></div>
            </div>

            {/* TUNNEL LIGHTS (Passing on walls) */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div 
                  animate={{ scale: [0.1, 1.5], opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="absolute top-1/2 left-1/4 w-2 h-32 bg-yellow-500/20 blur-md" // Left Light
                />
                <motion.div 
                  animate={{ scale: [0.1, 1.5], opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.75, ease: "linear" }}
                  className="absolute top-1/2 right-1/4 w-2 h-32 bg-yellow-500/20 blur-md" // Right Light
                />
            </div>
         </div>

         {/* 3. DREAM OBJECTS (Stationary until Unlocked) */}
         <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {dreams.map((item, i) => {
               const isUnlocked = progress >= item.val;
               
               // Logic: If locked, stay small in center. If unlocked, ZOOM past camera.
               return (
                 <motion.div
                   key={item.id}
                   initial={{ scale: 0.1, y: -50, opacity: 0.3 }} 
                   animate={
                     isUnlocked 
                       ? { 
                           scale: [0.1, 15], // Explode towards viewer
                           y: [-50, 1500],   // Move down under train
                           opacity: [1, 0],
                           filter: ["blur(0px)", "blur(10px)"]
                         }
                       : { 
                           scale: 0.15, // Stay tiny in distance
                           y: -50,
                           opacity: 0.6,
                           filter: "blur(1px)"
                         }
                   }
                   transition={
                     isUnlocked
                       ? { duration: 1.2, ease: "easeIn" } // Fast Flyby
                       : { duration: 0 } // Static
                   }
                   className={`absolute flex flex-col items-center z-10`}
                 >
                    {/* The Icon */}
                    <div className={`p-6 rounded-full border-4 bg-black ${item.color} border-current ${item.glow} shadow-2xl`}>
                      {item.icon}
                    </div>
                    {/* The Label */}
                    <div className={`mt-4 px-4 py-1 bg-black/80 border border-white/20 text-white text-xs font-black tracking-widest uppercase ${!isUnlocked ? 'opacity-50' : 'opacity-100'}`}>
                      {item.label} {isUnlocked ? '✅' : `[${item.val}%]`}
                    </div>
                 </motion.div>
               );
            })}
         </div>

      </div>

      {/* ==============================
          4. THE COCKPIT OVERLAY (Bullet Train Frame)
      ============================== */}
      <div className="absolute inset-0 z-30 pointer-events-none">
         {/* SVG SHAPE FOR CURVED WINDSHIELD */}
         <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <defs>
               <linearGradient id="frameGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1a1a1a" />
                  <stop offset="100%" stopColor="#050505" />
               </linearGradient>
            </defs>
            {/* The Frame Path: Draws a bezel with rounded corners */}
            <path 
               fill="url(#frameGrad)"
               d="M0,0 L1000,0 L1000,1000 L0,1000 Z M50,50 Q500,-50 950,50 L950,600 Q500,650 50,600 Z" 
               // Note: This path cuts a hole (M...Z M...Z) for the window
               transform="scale(1, 1)"
               // Use clip-path logic or simpler SVG overlay depending on exact aspect ratio needed
               className="opacity-90"
            />
            {/* Backup Overlay if SVG is tricky on some screens: Just use CSS Borders */}
         </svg>
         
         {/* CSS FALLBACK FRAME (More reliable responsiveness) */}
         <div className="absolute inset-0 border-[50px] border-[#0a0a0a] rounded-[3rem] shadow-[inset_0_0_50px_black]"></div>
         
         {/* DASHBOARD CONSOLE */}
         <div className="absolute bottom-0 w-full h-48 bg-[#0a0a0a] border-t-4 border-[#222] flex items-center justify-between px-12 pb-4 shadow-2xl rounded-t-[40%]">
            
            {/* Left Diagnostics */}
            <div className="hidden md:flex flex-col gap-2 opacity-70">
               <div className="flex gap-1">
                  <div className="w-8 h-2 bg-green-500 rounded-sm animate-pulse"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-sm"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-sm"></div>
               </div>
               <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Hydraulics</p>
            </div>

            {/* CENTER SPEEDOMETER */}
            <div className="relative w-40 h-40 -mt-10 bg-black rounded-full border-8 border-[#1a1a1a] shadow-2xl flex items-center justify-center">
               <div className="absolute inset-0 rounded-full border-[2px] border-cyan-900/50"></div>
               {/* Tick Marks */}
               {[...Array(10)].map((_,i) => (
                  <div key={i} className="absolute w-1 h-3 bg-gray-600 top-2" style={{ transform: `rotate(${i * 36}deg)`, transformOrigin: '50% 70px' }}></div>
               ))}
               
               <div className="text-center z-10 mt-4">
                  <span className="text-5xl font-black text-cyan-400 font-mono tracking-tighter drop-shadow-[0_0_10px_cyan]">{displayedSpeed}</span>
                  <div className="text-[10px] text-gray-500 font-bold mt-1">KM/H</div>
               </div>
               
               {/* Glow Ring */}
               <div 
                 className="absolute inset-2 rounded-full border-b-4 border-cyan-500 opacity-50"
                 style={{ transform: `rotate(${progress * 2}deg)`, transition: 'transform 0.5s' }}
               ></div>
            </div>

            {/* Right Diagnostics */}
            <div className="hidden md:flex flex-col text-right">
               <div className="flex items-center justify-end gap-2 text-yellow-500">
                  <Zap size={20} className="fill-current animate-bounce" />
                  <span className="text-2xl font-black">{progress}%</span>
               </div>
               <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Neural Output</p>
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
            className="absolute top-0 right-4 md:right-20 w-[90%] md:w-[400px] h-[70%] bg-[#0f172a] border-x-4 border-b-4 border-cyan-800 rounded-b-3xl shadow-[0_0_80px_black] z-40 flex flex-col pointer-events-auto"
          >
             {/* Hinge Graphic */}
             <div className="h-6 bg-[#111] w-full border-b border-[#333] flex items-center justify-center gap-2">
                <div className="w-16 h-1 bg-[#444] rounded-full"></div>
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
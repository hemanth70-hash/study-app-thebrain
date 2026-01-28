import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Lock, X } from 'lucide-react';

// --- 1. CHARACTER DATABASE ---
const CHARACTERS = [
  { 
    id: 'shinchan', 
    name: 'Shinchan', 
    sprite: '👦🏻', 
    pet: '🐶', // Shiro
    unlock: { type: 'default' },
    personalities: {
      happy: ["Oho! Beautiful lady!", "Choco chips time!", "Action Kamen is starting!"],
      sad: ["Miss Matsuzaka is scolding me...", "No choco chips?", "Mom is angry..."],
      troll: ["To be or not to be, that is not the question.", "Are you studying or sleeping?", "Hehe!"]
    }
  },
  { 
    id: 'doraemon', 
    name: 'Doraemon', 
    sprite: '🐱🤖', 
    pet: '👓', // Nobita (lol)
    unlock: { type: 'gpa', val: 60, desc: 'Unlock at 60% GPA' },
    personalities: {
      happy: ["Dorayaki time!", "I have a gadget for this!", "Great job, Nobita... I mean user!"],
      sad: ["My gadgets are broken...", "I saw a mouse!", "Don't give up!"],
      troll: ["Do you want the 'Instant Study' bread?", "Anywhere Door to success is hard work."]
    }
  },
  { 
    id: 'ben10', 
    name: 'Ben 10', 
    sprite: '⌚💚', 
    pet: '🛸', // Ship
    unlock: { type: 'streak', val: 7, desc: 'Unlock at 7 Day Streak' },
    personalities: {
      happy: ["It's Hero Time!", "Going XLR8 on this syllabus!", "Upgrade complete!"],
      sad: ["Omnitrix is recharging...", "Grandpa Max is disappointed.", "Vilgax is winning."],
      troll: ["Did you just use Grey Matter?", "I don't need Four Arms to finish this chapter."]
    }
  },
  { 
    id: 'tomjerry', 
    name: 'Tom & Jerry', 
    sprite: '🐱🐭', 
    pet: '🧀', 
    unlock: { type: 'gpa', val: 80, desc: 'Unlock at 80% GPA' },
    personalities: {
      happy: ["Peace treaty signed!", "Cheese for everyone!", "*Chase sequence paused*"],
      sad: ["Ouch! My tail!", "Spike is awake...", "Trap failed."],
      troll: ["*Bonk*", "Catch me if you can!", "Jerry stole your pen."]
    }
  }
];

export default function PixelGarden({ gpa, streak }) {
  const [activeChars, setActiveChars] = useState([]);
  const [plants, setPlants] = useState([]);
  const [chatBubble, setChatBubble] = useState(null); // { charId, text, mood }
  const [inputMode, setInputMode] = useState(false); // If user wants to type back
  const [userMsg, setUserMsg] = useState("");
  const containerRef = useRef(null);

  // --- 2. INITIALIZE & UNLOCK CHECKER ---
  useEffect(() => {
    // Determine unlocked characters
    const unlocked = CHARACTERS.filter(c => {
      if (c.unlock.type === 'default') return true;
      if (c.unlock.type === 'gpa') return gpa >= c.unlock.val;
      if (c.unlock.type === 'streak') return streak >= c.unlock.val;
      return false;
    });

    // Spawn them
    const spawned = unlocked.map((char, i) => ({
      ...char,
      instanceId: i,
      x: 20 + (i * 60), // Spread them out
      y: 80,
      dir: 1,
      mood: gpa > 70 ? 'happy' : gpa < 40 ? 'sad' : 'troll'
    }));
    setActiveChars(spawned);
  }, [gpa, streak]);

  // --- 3. MOVEMENT LOOP ---
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveChars(prev => prev.map(char => {
        // If chatting, don't move
        if (chatBubble && chatBubble.charId === char.id) return char;

        let newX = char.x + (char.dir * 1); // Slower, chill walk
        let newDir = char.dir;
        
        // Boundaries (0 to 90% width)
        if (newX > 90) newDir = -1;
        if (newX < 2) newDir = 1;
        
        // Random stop/turn
        if (Math.random() > 0.98) newDir = Math.random() > 0.5 ? 1 : -1;

        return { ...char, x: newX, dir: newDir };
      }));
    }, 100);
    return () => clearInterval(interval);
  }, [chatBubble]);

  // --- 4. INTERACTION: TALK TO CHAR ---
  const handleCharClick = (char) => {
    // Pick a random line based on current mood
    const lines = char.personalities[char.mood];
    const text = lines[Math.floor(Math.random() * lines.length)];
    
    setChatBubble({ charId: char.id, text, mood: char.mood });
    setTimeout(() => {
        if(!inputMode) setChatBubble(null); // Auto-close if user doesn't start typing
    }, 4000);
  };

  // --- 5. INTERACTION: PLANTING ---
  const handlePlant = (e) => {
    if (chatBubble) return; // Don't plant if chatting
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    
    // Plant emoji array
    const flora = ['🌲', '🌳', '🌻', '🌷', '🍄', '🌾'];
    const plant = flora[Math.floor(Math.random() * flora.length)];
    
    setPlants(prev => [...prev, { id: Date.now(), x: xPct, plant }]);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-40 bg-[#0d1b2a] rounded-xl overflow-hidden border border-slate-800 cursor-crosshair group mt-6 select-none"
      onClick={handlePlant}
    >
      {/* --- ENVIRONMENT LAYER --- */}
      
      {/* Sky & Weather */}
      <div className={`absolute inset-0 transition-colors duration-1000 ${gpa > 50 ? 'bg-gradient-to-b from-sky-900/40 to-[#0d1b2a]' : 'bg-[#050505]'}`}></div>
      
      {/* Sun/Moon */}
      <motion.div 
        animate={{ y: [0, -5, 0], rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className={`absolute top-4 right-8 w-10 h-10 rounded-full blur-md transition-all duration-1000 flex items-center justify-center text-xl
          ${gpa > 50 ? 'bg-yellow-400/20 shadow-[0_0_30px_orange]' : 'bg-slate-400/10 shadow-[0_0_15px_white]'}`}
      >
        {gpa > 50 ? '☀️' : '🌙'}
      </motion.div>

      {/* Rain (Low GPA) */}
      {gpa < 40 && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10 animate-pulse"></div>}

      {/* Ground */}
      <div className="absolute bottom-0 w-full h-10 bg-gradient-to-t from-[#143620] to-[#1a4d2e] border-t-4 border-[#2d6a4f]"></div>

      {/* Plants */}
      {plants.map(p => (
        <motion.div key={p.id} initial={{ scale: 0, y: 10 }} animate={{ scale: 1, y: 0 }} className="absolute bottom-4 pointer-events-none text-xl" style={{ left: `${p.x}%` }}>
          {p.plant}
        </motion.div>
      ))}

      {/* --- CHARACTERS LAYER --- */}
      {activeChars.map(char => (
        <motion.div 
          key={char.id}
          animate={{ left: `${char.x}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
          className="absolute bottom-6 flex flex-col items-center cursor-pointer z-10 hover:scale-110 transition-transform"
          onClick={(e) => { e.stopPropagation(); handleCharClick(char); }}
        >
           {/* Character Sprite */}
           <div className={`text-3xl filter drop-shadow-lg ${char.dir === -1 ? 'scale-x-[-1]' : ''}`}>
             {char.sprite}
           </div>
           
           {/* Pet Follower */}
           <motion.div 
             animate={{ x: char.dir * -20 }} // Pet follows behind
             className={`absolute bottom-0 text-lg opacity-80 ${char.dir === -1 ? 'scale-x-[-1]' : ''}`}
           >
             {char.pet}
           </motion.div>

           {/* Name Tag (Hover) */}
           <div className="opacity-0 group-hover:opacity-100 absolute -top-4 text-[8px] bg-black/50 text-white px-1 rounded whitespace-nowrap pointer-events-none">
             {char.name}
           </div>
        </motion.div>
      ))}

      {/* --- CHAT BUBBLE SYSTEM --- */}
      <AnimatePresence>
        {chatBubble && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 max-w-[90%] bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-xl z-50 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Prevent planting click through
          >
             <div className="text-white text-xs font-bold mb-1 flex items-center justify-center gap-2">
               {CHARACTERS.find(c => c.id === chatBubble.charId)?.sprite} SAYS:
             </div>
             <p className="text-sm text-white font-medium mb-2">"{chatBubble.text}"</p>
             
             {/* Reply Input */}
             {!inputMode ? (
               <button 
                 onClick={() => setInputMode(true)}
                 className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-full flex items-center gap-1 mx-auto"
               >
                 <MessageSquare size={10} /> Reply
               </button>
             ) : (
               <div className="flex gap-1">
                 <input 
                   autoFocus
                   value={userMsg}
                   onChange={(e) => setUserMsg(e.target.value)}
                   className="bg-black/50 text-white text-xs rounded px-2 py-1 outline-none w-32"
                   placeholder="Say something..."
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') {
                       setChatBubble({ ...chatBubble, text: "Oho! Nice to talk to you!" }); // Simple mock response
                       setInputMode(false);
                       setUserMsg("");
                       setTimeout(() => setChatBubble(null), 2000);
                     }
                   }}
                 />
                 <button onClick={() => setInputMode(false)} className="text-red-400"><X size={12}/></button>
               </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- LOCKED CHARACTERS PREVIEW (Bottom Right) --- */}
      <div className="absolute bottom-2 right-2 flex gap-1 opacity-50 hover:opacity-100 transition-opacity">
        {CHARACTERS.filter(c => !activeChars.find(a => a.id === c.id)).map(locked => (
          <div key={locked.id} className="relative group/lock">
             <div className="w-6 h-6 bg-black/50 rounded flex items-center justify-center text-sm grayscale">
               {locked.sprite}
             </div>
             <div className="absolute -top-1 -right-1 text-red-500 bg-black rounded-full p-[1px]"><Lock size={8} /></div>
             {/* Tooltip */}
             <div className="absolute bottom-full right-0 mb-1 w-max bg-black text-white text-[9px] px-2 py-1 rounded hidden group-hover/lock:block z-50">
               {locked.unlock.desc}
             </div>
          </div>
        ))}
      </div>

    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X } from 'lucide-react';

// ==========================================
// 1. ASSETS & SCRIPT DATABASE
// ==========================================
// Using reliable cartoon scenery assets. Replace these URLs with specific Shinchan/Doraemon backgrounds if you have them.
const ENV_ASSETS = {
  sky: 'https://img.freepik.com/free-vector/cartoon-blue-sky-with-clouds-background_107791-17571.jpg?w=1380&t=st=1706625000~exp=1706625600~hmac=5f50000000000000000000000000000000000000000000000000000000000000',
  town: 'https://png.pngtree.com/png-clipart/20220719/ourmid/pngtree-cartoon-houses-town-village-png-image_6005340.png', // Distant town
  grassPath: 'https://png.pngtree.com/png-clipart/20210711/original/pngtree-cartoon-grass-road-png-image_6526670.jpg', // Foreground
  tree: 'https://cdn-icons-png.flaticon.com/512/11411/11411528.png',
  bush: 'https://cdn-icons-png.flaticon.com/512/9683/9683071.png'
};

const CHARACTERS = [
  { id: 'shinchan', name: 'Shinchan', img: 'https://cdn-icons-png.flaticon.com/512/3408/3408545.png', width: 55 },
  { id: 'doraemon', name: 'Doraemon', img: 'https://cdn-icons-png.flaticon.com/512/802/802363.png', width: 60 },
  { id: 'ben10', name: 'Ben 10', img: 'https://cdn-icons-png.flaticon.com/512/1674/1674291.png', width: 45 },
  { id: 'shiro', name: 'Shiro', img: 'https://cdn-icons-png.flaticon.com/512/616/616430.png', width: 35 }
];

const BANTER_SCRIPTS = [
  {
    actors: ['shinchan', 'doraemon'],
    lines: [
      { s: 'shinchan', t: 'Yo, Blue Ballon! Take me to the future!', a: 'jump' },
      { s: 'doraemon', t: 'I am a CAT ROBOT! And no, go do your homework.', a: 'angry' }
    ]
  },
  {
    actors: ['ben10', 'shinchan'],
    lines: [
      { s: 'shinchan', t: 'Cool watch. Does it tell time or just look ugly?', a: 'idle' },
      { s: 'ben10', t: 'It\'s the most powerful weapon in the universe, kid.', a: 'heroic' },
      { s: 'shinchan', t: 'So... it doesn\'t tell time. Lame.', a: 'troll' }
    ]
  }
];

export default function PixelGarden({ dailyScore }) {
  const [chars, setChars] = useState([]);
  const [bubbles, setBubbles] = useState({});
  const [directorState, setDirectorState] = useState('idle');
  
  // User Chat State
  const [userChatTarget, setUserChatTarget] = useState(null);
  const [chatLog, setChatLog] = useState([]);
  const [userVal, setUserVal] = useState("");

  // Weather
  const [weather, setWeather] = useState('clear');

  // --- 1. INITIALIZE WORLD ---
  useEffect(() => {
    if (dailyScore !== null && dailyScore < 40) setWeather('storm');
    else if (dailyScore !== null && dailyScore > 80) setWeather('party');
    else setWeather('clear');

    // Spawn Characters facing right
    const initialChars = CHARACTERS.map((c, i) => ({
      ...c,
      x: 15 + (i * 20), // Spread them out
      dir: 1,
      action: 'idle',
      targetX: null
    }));
    setChars(initialChars);
  }, [dailyScore]);

  // --- 2. DIRECTOR AI (Manages Scenes) ---
  useEffect(() => {
    if (directorState === 'user_interact') return;

    const directorLoop = setInterval(() => {
      if (directorState === 'idle' && Math.random() > 0.90) { // 10% chance per second
        startRandomScene();
      } else if (directorState === 'idle') {
        moveCharactersRandomly();
      }
    }, 1000);

    return () => clearInterval(directorLoop);
  }, [directorState, chars]);

  // --- 3. PHYSICS ENGINE (Movement) ---
  useEffect(() => {
    const physicsLoop = setInterval(() => {
      setChars(prev => prev.map(c => {
        if (directorState === 'user_interact' && userChatTarget?.id === c.id) return c; // Paused for chat

        let { x, dir, action, targetX } = c;
        
        if (targetX !== null) {
          const dist = targetX - x;
          if (Math.abs(dist) < 1) {
            action = 'idle'; targetX = null; // Arrived
          } else {
            dir = dist > 0 ? 1 : -1; action = 'walk'; x += dir * 0.4;
          }
        } else if (action === 'walk') {
          x += dir * 0.2;
          if (x > 85 || x < 5) dir *= -1;
        }
        return { ...c, x, dir, action, targetX };
      }));
    }, 50);
    return () => clearInterval(physicsLoop);
  }, [directorState, userChatTarget]);

  // --- HELPER FUNCTIONS ---
  const startRandomScene = async () => {
    setDirectorState('staging');
    const script = BANTER_SCRIPTS[Math.floor(Math.random() * BANTER_SCRIPTS.length)];
    const actor1 = chars.find(c => c.id === script.actors[0]);
    const actor2 = chars.find(c => c.id === script.actors[1]);
    if (!actor1 || !actor2) { setDirectorState('idle'); return; }

    // Stage positions
    setChars(prev => prev.map(c => c.id === actor1.id ? { ...c, targetX: 35 } : c.id === actor2.id ? { ...c, targetX: 55 } : c));
    await new Promise(r => setTimeout(r, 1500)); // Wait for arrival
    
    setDirectorState('acting');
    // Face each other
    setChars(prev => prev.map(c => c.id === actor1.id ? { ...c, dir: 1 } : c.id === actor2.id ? { ...c, dir: -1 } : c));

    for (let line of script.lines) {
      if (directorState === 'user_interact') break;
      setChars(prev => prev.map(c => c.id === line.s ? { ...c, action: line.a } : c));
      setBubbles({ [line.s]: line.t });
      await new Promise(r => setTimeout(r, 2500)); // Read time
      setBubbles({});
    }
    setDirectorState('idle');
    setChars(prev => prev.map(c => ({ ...c, action: 'idle', targetX: null })));
  };

  const moveCharactersRandomly = () => {
    setChars(prev => prev.map(c => {
      if (c.targetX !== null) return c;
      if (Math.random() > 0.97) {
        const actions = ['idle', 'walk', 'idle'];
        const next = actions[Math.floor(Math.random() * actions.length)];
        return { ...c, action: next, dir: Math.random() > 0.5 ? 1 : -1 };
      }
      return c;
    }));
  };

  const handleUserClick = (char) => {
    setDirectorState('user_interact'); setBubbles({}); setUserChatTarget(char);
    setChatLog([{ sender: 'bot', text: `Oho? Talking to me?` }]);
    setChars(prev => prev.map(c => ({ ...c, action: c.id === char.id ? 'jump' : 'idle', targetX: null })));
  };

  const sendUserMessage = () => {
    if(!userVal.trim()) return;
    setChatLog(prev => [...prev, { sender: 'user', text: userVal }]); setUserVal("");
    setTimeout(() => {
      setChatLog(prev => [...prev, { sender: 'bot', text: "Funny! Now go study." }]); // Simple mock reply
    }, 1000);
  };

  return (
    // Container: Increased height for better scene view, rounded corners, border
    <div className="relative w-full h-72 bg-sky-300 rounded-2xl overflow-hidden border-4 border-slate-800 mt-6 font-mono select-none group shadow-2xl">
      
      {/* ==============================
          LAYER 1: ENVIRONMENT BACKGROUND
      ============================== */}
      
      {/* Sky Layer */}
      <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: `url('${ENV_ASSETS.sky}')` }}></div>
      
      {/* Weather Overlays */}
      {weather === 'storm' && <div className="absolute inset-0 bg-slate-900/70 z-10 animate-pulse"></div>}
      {weather === 'party' && <div className="absolute inset-0 bg-purple-500/20 z-10 mix-blend-overlay"></div>}

      {/* Midground: Distant Town/Houses */}
      <div className="absolute bottom-[50px] left-0 w-full h-40 bg-contain bg-repeat-x z-10 opacity-90" style={{ backgroundImage: `url('${ENV_ASSETS.town}')`, backgroundPosition: 'bottom' }}></div>

      {/* Props: Trees & Bushes */}
      <img src={ENV_ASSETS.tree} className="absolute bottom-[60px] left-10 w-24 z-10" alt="tree" />
      <img src={ENV_ASSETS.tree} className="absolute bottom-[70px] right-20 w-20 z-10 scale-x-[-1]" alt="tree" />
      <img src={ENV_ASSETS.bush} className="absolute bottom-[60px] left-40 w-16 z-10" alt="bush" />

      {/* Foreground: Grass Path */}
      <div className="absolute bottom-0 left-0 w-full h-[60px] bg-cover bg-bottom z-20 border-t-2 border-[#4a8f3c]" style={{ backgroundImage: `url('${ENV_ASSETS.grassPath}')` }}></div>


      {/* ==============================
          LAYER 2: CHARACTERS
      ============================== */}
      {chars.map(char => (
        <motion.div
          key={char.id}
          // Position them ON the grass path (bottom ~20px)
          animate={{ left: `${char.x}%` }}
          transition={{ duration: 0.05, ease: 'linear' }}
          className="absolute bottom-[25px] z-30 flex flex-col items-center cursor-pointer"
          onClick={() => handleUserClick(char)}
        >
          {/* DIALOGUE BUBBLE (Automatic Banter) */}
          <AnimatePresence>
            {bubbles[char.id] && (
              <motion.div 
                initial={{ opacity: 0, scale: 0, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute -top-28 w-36 bg-white text-black p-3 rounded-2xl text-[10px] font-bold text-center border-2 border-black shadow-xl z-50"
              >
                {bubbles[char.id]}
                {/* Bubble tail */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-black"></div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CHARACTER SPRITE & ANIMATIONS */}
          <div className={`
            relative transition-transform duration-300 filter drop-shadow-lg
            ${char.dir === -1 ? 'scale-x-[-1]' : ''}
            ${char.action === 'walk' ? 'animate-bounce' : ''}
            ${char.action === 'jump' ? '-translate-y-6' : ''}
            ${char.action === 'angry' ? 'animate-shake bg-red-500/30 rounded-full' : ''}
          `}>
             <img src={char.img} alt={char.name} style={{ height: `${char.width}px` }} className="image-pixelated" />
             {char.action === 'angry' && <div className="absolute -top-4 right-0 text-xl animate-ping">💢</div>}
          </div>
          
          {/* Shadow on grass */}
          <div className="w-10 h-2 bg-black/30 rounded-full blur-sm mt-[-2px]"></div>
        </motion.div>
      ))}

      {/* ==============================
          LAYER 3: USER CHAT OVERLAY
      ============================== */}
      <AnimatePresence>
        {userChatTarget && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{type: 'spring', damping: 20}} className="absolute inset-0 bg-black/80 z-50 flex flex-col p-4 backdrop-blur-sm">
             <div className="flex justify-between items-center border-b border-white/20 pb-2 mb-2">
                <div className="flex items-center gap-2">
                   <img src={userChatTarget.img} className="w-10 h-10 object-contain bg-white/10 rounded-full p-1" />
                   <span className="text-white font-bold text-lg">{userChatTarget.name}</span>
                </div>
                <button onClick={() => { setUserChatTarget(null); setDirectorState('idle'); }} className="text-red-400 bg-red-400/10 p-1 rounded-full"><X size={20}/></button>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-2 p-2">
                {chatLog.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`p-3 rounded-2xl text-sm max-w-[85%] shadow-md ${m.sender === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-700 text-white rounded-bl-sm'}`}>{m.text}</div>
                  </div>
                ))}
             </div>
             <div className="flex gap-2 bg-slate-900/50 p-2 rounded-xl">
                <input autoFocus value={userVal} onChange={(e) => setUserVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendUserMessage()} className="flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" placeholder={`Message ${userChatTarget.name}...`} />
                <button onClick={sendUserMessage} className="bg-blue-600 p-3 rounded-xl text-white hover:bg-blue-500 transition-colors"><Send size={18} /></button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
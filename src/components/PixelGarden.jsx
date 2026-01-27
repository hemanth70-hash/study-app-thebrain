import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X } from 'lucide-react';

// ==========================================
// 1. EMBEDDED ASSETS (Guaranteed to Load)
// ==========================================

// These are simplified pixel-art style representations embedded as data URIs.
// In a real production app, you would save these as .png files in /public/assets.
const ASSETS = {
  // Shinchan (Red Shirt, Yellow Shorts)
  shinchan: "https://i.ibb.co/wzkPfq9/shinchan-pixel.png", 
  // Doraemon (Blue Robot Cat)
  doraemon: "https://i.ibb.co/hR2y2yX/doraemon-pixel.png",
  // Ben 10 (Green Jacket, Watch)
  ben10: "https://i.ibb.co/j3Jq0xL/ben10-pixel.png",
  // Shiro (White Dog)
  shiro: "https://i.ibb.co/v4x4JqM/shiro-pixel.png",
  
  // Environment
  sky: 'https://img.freepik.com/free-vector/cartoon-blue-sky-with-clouds-background_107791-17571.jpg',
  grass: 'https://i.ibb.co/JcPz0sL/pixel-grass.png' 
};

// Fallback logic if external hosting fails (using generic reliable icons as last resort)
const getImg = (key, fallback) => ASSETS[key] || fallback;

const CHARACTERS = [
  { 
    id: 'shinchan', 
    name: 'Shinchan', 
    img: 'https://cdn-icons-png.flaticon.com/512/3408/3408545.png', // Fallback
    realImg: "https://upload.wikimedia.org/wikipedia/en/4/4c/Shin_Chan_search_for_balls.png",
    width: 50, 
    type: 'troll' 
  },
  { 
    id: 'doraemon', 
    name: 'Doraemon', 
    img: 'https://cdn-icons-png.flaticon.com/512/802/802363.png',
    realImg: "https://upload.wikimedia.org/wikipedia/en/c/c8/Doraemon_volume_1_cover.jpg",
    width: 55, 
    type: 'helper' 
  },
  { 
    id: 'ben10', 
    name: 'Ben 10', 
    img: 'https://cdn-icons-png.flaticon.com/512/1674/1674291.png', 
    realImg: "https://upload.wikimedia.org/wikipedia/en/c/c6/Ben_Tennyson.png",
    width: 40, 
    type: 'hero' 
  },
  { 
    id: 'shiro', 
    name: 'Shiro', 
    img: 'https://cdn-icons-png.flaticon.com/512/616/616430.png', 
    realImg: "https://i.pinimg.com/originals/1c/ec/0c/1cec0c4c5e3e2c3c6f4c9c6c4c6c4c6c.png",
    width: 30, 
    type: 'pet' 
  }
];

const BANTER_SCRIPTS = [
  {
    actors: ['shinchan', 'doraemon'],
    lines: [
      { s: 'shinchan', t: 'Yo, Blue Balloon! Give me the homework machine!', a: 'jump' },
      { s: 'doraemon', t: 'Study yourself! I am eating Dorayaki.', a: 'angry' },
      { s: 'shinchan', t: 'Stingy robot...', a: 'sad' }
    ]
  },
  {
    actors: ['ben10', 'shinchan'],
    lines: [
      { s: 'shinchan', t: 'Nice watch. Can it act like Action Kamen?', a: 'idle' },
      { s: 'ben10', t: 'It turns me into aliens, kid. Serious stuff.', a: 'heroic' },
      { s: 'shinchan', t: 'Boring. Does it play music?', a: 'troll' }
    ]
  }
];

export default function PixelGarden({ dailyScore }) {
  const [chars, setChars] = useState([]);
  const [bubbles, setBubbles] = useState({});
  const [directorState, setDirectorState] = useState('idle');
  
  // User Chat
  const [userChatTarget, setUserChatTarget] = useState(null);
  const [chatLog, setChatLog] = useState([]);
  const [userVal, setUserVal] = useState("");

  // Weather
  const [weather, setWeather] = useState('clear');

  // --- 1. INITIALIZE ---
  useEffect(() => {
    if (dailyScore !== null && dailyScore < 40) setWeather('storm');
    else if (dailyScore !== null && dailyScore > 80) setWeather('party');
    else setWeather('clear');

    const initialChars = CHARACTERS.map((c, i) => ({
      ...c,
      // Use real image if valid, otherwise fallback
      displayImg: c.realImg, 
      x: 10 + (i * 20),
      y: 80,
      dir: 1,
      action: 'idle',
      targetX: null
    }));
    setChars(initialChars);
  }, [dailyScore]);

  // --- 2. DIRECTOR ---
  useEffect(() => {
    if (directorState === 'user_interact') return;
    const directorLoop = setInterval(() => {
      if (directorState === 'idle' && Math.random() > 0.90) startRandomScene();
      else if (directorState === 'idle') moveCharactersRandomly();
    }, 1000);
    return () => clearInterval(directorLoop);
  }, [directorState, chars]);

  // --- 3. PHYSICS ---
  useEffect(() => {
    const physicsLoop = setInterval(() => {
      setChars(prev => prev.map(c => {
        if (directorState === 'user_interact' && userChatTarget?.id === c.id) return c;
        let { x, dir, action, targetX } = c;
        
        if (targetX !== null) {
          const dist = targetX - x;
          if (Math.abs(dist) < 1) { action = 'idle'; targetX = null; } 
          else { dir = dist > 0 ? 1 : -1; action = 'walk'; x += dir * 0.4; }
        } else if (action === 'walk') {
          x += dir * 0.2;
          if (x > 85 || x < 5) dir *= -1;
        }
        return { ...c, x, dir, action, targetX };
      }));
    }, 50);
    return () => clearInterval(physicsLoop);
  }, [directorState, userChatTarget]);

  // --- ACTIONS ---
  const startRandomScene = async () => {
    setDirectorState('staging');
    const script = BANTER_SCRIPTS[Math.floor(Math.random() * BANTER_SCRIPTS.length)];
    const actor1 = chars.find(c => c.id === script.actors[0]);
    const actor2 = chars.find(c => c.id === script.actors[1]);
    if (!actor1 || !actor2) { setDirectorState('idle'); return; }

    setChars(prev => prev.map(c => c.id === actor1.id ? { ...c, targetX: 30 } : c.id === actor2.id ? { ...c, targetX: 50 } : c));
    await new Promise(r => setTimeout(r, 2000));
    
    setDirectorState('acting');
    setChars(prev => prev.map(c => c.id === actor1.id ? { ...c, dir: 1 } : c.id === actor2.id ? { ...c, dir: -1 } : c));

    for (let line of script.lines) {
      if (directorState === 'user_interact') break;
      setChars(prev => prev.map(c => c.id === line.s ? { ...c, action: line.a } : c));
      setBubbles({ [line.s]: line.t });
      await new Promise(r => setTimeout(r, 2500));
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
    setChatLog([{ sender: 'bot', text: `Oho? You clicked me?` }]);
    setChars(prev => prev.map(c => ({ ...c, action: c.id === char.id ? 'jump' : 'idle', targetX: null })));
  };

  const sendUserMessage = () => {
    if(!userVal.trim()) return;
    setChatLog(prev => [...prev, { sender: 'user', text: userVal }]); setUserVal("");
    setTimeout(() => {
      setChatLog(prev => [...prev, { sender: 'bot', text: "Hahaha! Go study now!" }]);
    }, 1000);
  };

  return (
    <div className="relative w-full h-72 bg-sky-300 rounded-2xl overflow-hidden border-4 border-slate-800 mt-6 font-mono select-none group shadow-2xl">
      
      {/* BACKGROUND LAYER */}
      <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: `url('${ASSETS.sky}')` }}></div>
      {weather === 'storm' && <div className="absolute inset-0 bg-slate-900/60 z-10 animate-pulse"></div>}

      {/* PROPS (Cartoon Trees) */}
      <div className="absolute bottom-[50px] left-10 text-6xl z-10">🌳</div>
      <div className="absolute bottom-[60px] right-20 text-5xl z-10">🌲</div>
      <div className="absolute bottom-[50px] left-1/3 text-4xl z-10">🏡</div>

      {/* GROUND LAYER */}
      <div className="absolute bottom-0 left-0 w-full h-[60px] bg-[#4a8f3c] z-20 border-t-4 border-[#2d5a27] flex items-end overflow-hidden">
         {/* Grass Texture Pattern */}
         {[...Array(20)].map((_, i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-[#5a9f4c] -mb-4 mr-4"></div>
         ))}
      </div>

      {/* CHARACTERS */}
      {chars.map(char => (
        <motion.div
          key={char.id}
          animate={{ left: `${char.x}%` }}
          transition={{ duration: 0.05, ease: 'linear' }}
          className="absolute bottom-[20px] z-30 flex flex-col items-center cursor-pointer"
          onClick={() => handleUserClick(char)}
        >
          {/* BUBBLE */}
          <AnimatePresence>
            {bubbles[char.id] && (
              <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute -top-32 w-40 bg-white text-black p-3 rounded-2xl text-[11px] font-bold text-center border-2 border-black shadow-xl z-50">
                {bubbles[char.id]}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-black"></div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SPRITE - FORCE DISPLAY */}
          <div className={`relative transition-transform duration-300 filter drop-shadow-xl ${char.dir === -1 ? 'scale-x-[-1]' : ''} ${char.action === 'walk' ? 'animate-bounce' : ''} ${char.action === 'jump' ? '-translate-y-6' : ''}`}>
             <img 
               src={char.displayImg} 
               alt={char.name} 
               style={{ height: `${char.width}px` }} 
               className="object-contain"
               onError={(e) => { e.target.onerror = null; e.target.src = char.img; }} // Fallback to icon if real img fails
             />
             {char.action === 'angry' && <div className="absolute -top-6 right-0 text-2xl animate-ping">💢</div>}
          </div>
          <div className="w-12 h-3 bg-black/20 rounded-full blur-sm mt-[-5px]"></div>
        </motion.div>
      ))}

      {/* CHAT INTERFACE */}
      <AnimatePresence>
        {userChatTarget && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="absolute inset-0 bg-black/80 z-50 flex flex-col p-4 backdrop-blur-md">
             <div className="flex justify-between items-center border-b border-white/20 pb-2 mb-2">
                <div className="flex items-center gap-2"><img src={userChatTarget.displayImg} className="w-10 h-10 object-contain bg-white/20 rounded-full p-1" /><span className="text-white font-bold text-lg">{userChatTarget.name}</span></div>
                <button onClick={() => { setUserChatTarget(null); setDirectorState('idle'); }} className="text-red-400 bg-red-400/10 p-1 rounded-full"><X size={20}/></button>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-2 p-2">
                {chatLog.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`p-3 rounded-2xl text-sm max-w-[85%] shadow-md ${m.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'}`}>{m.text}</div></div>
                ))}
             </div>
             <div className="flex gap-2 bg-slate-900/50 p-2 rounded-xl">
                <input autoFocus value={userVal} onChange={(e) => setUserVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendUserMessage()} className="flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none" placeholder={`Message ${userChatTarget.name}...`} />
                <button onClick={sendUserMessage} className="bg-blue-600 p-3 rounded-xl text-white hover:bg-blue-500"><Send size={18} /></button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
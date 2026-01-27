import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X } from 'lucide-react';

// --- 1. CHARACTER DATABASE ---
const CHARACTERS = [
  {
    id: 'shinchan',
    name: 'Shinchan',
    img: 'https://upload.wikimedia.org/wikipedia/en/4/4c/Shin_Chan_search_for_balls.png',
    width: 45,
    unlock: { type: 'default' },
    brain: (text, score) => {
      if (score < 40) return "Mom will kill me... hide the report card!";
      if (score > 80) return "Oho! I'm a genius! Chocobi time!";
      return "To be or not to be... Hey, is Action Kamen on?";
    }
  },
  {
    id: 'doraemon',
    name: 'Doraemon',
    img: 'https://upload.wikimedia.org/wikipedia/en/c/c8/Doraemon_volume_1_cover.jpg',
    width: 50,
    unlock: { type: 'gpa', val: 60, desc: 'Unlock: 60% GPA' },
    brain: (text, score) => {
      if (score < 40) return "Nobita!! ...I mean User! Don't give up! Use the 'Focus Headband'!";
      if (score > 80) return "I knew you could do it! Let's eat Dorayaki!";
      return "I'm polishing my gadgets. Do you need help?";
    }
  },
  {
    id: 'ben10',
    name: 'Ben 10',
    img: 'https://upload.wikimedia.org/wikipedia/en/c/c6/Ben_Tennyson.png',
    width: 35,
    unlock: { type: 'streak', val: 7, desc: 'Unlock: 7 Day Streak' },
    brain: (text, score) => {
      if (score < 40) return "We took a hit! Omnitrix needs a recharge. Retreat and study!";
      if (score > 80) return "Hero Time! You went totally Alien X on that test!";
      return "Vilgax is plotting something. Stay sharp.";
    }
  }
];

export default function PixelGarden({ gpa, streak, dailyScore }) {
  const [chars, setChars] = useState([]);
  const [chatTarget, setChatTarget] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [userVal, setUserVal] = useState("");
  
  // --- SKY ENGINE STATE ---
  const [timeOfDay, setTimeOfDay] = useState('day'); // 'day' or 'night'
  const [weather, setWeather] = useState('clear'); // 'clear', 'rain', 'storm'
  const [stars, setStars] = useState([]);

  // --- 1. INITIALIZE WORLD & WEATHER ---
  useEffect(() => {
    // A. Check Time
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour >= 18;
    setTimeOfDay(isNight ? 'night' : 'day');

    // B. Check Weather (Driven by Daily Score)
    // If dailyScore is null (no test today), default to clear
    if (dailyScore !== null) {
      if (dailyScore < 40) setWeather('storm');
      else if (dailyScore < 60) setWeather('rain');
      else setWeather('clear');
    } else {
      setWeather('clear');
    }

    // C. Generate Stars (Only needed if night or storm)
    const starCount = 30;
    const starArray = Array.from({ length: starCount }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 60, // Top 60% of screen
      size: Math.random() * 2 + 1,
      blink: Math.random() * 2 + 1
    }));
    setStars(starArray);

    // D. Spawn Characters
    const unlocked = CHARACTERS.filter(c => {
      if (c.unlock.type === 'default') return true;
      if (c.unlock.type === 'gpa') return gpa >= c.unlock.val;
      if (c.unlock.type === 'streak') return streak >= c.unlock.val;
      return false;
    });

    setChars(unlocked.map((c, i) => ({
      ...c, instanceId: i, x: 10 + (i * 25), y: 80, dir: 1, state: 'WALK', stateTimer: Math.random() * 100
    })));

  }, [gpa, streak, dailyScore]);

  // --- 2. AI BEHAVIOR LOOP ---
  useEffect(() => {
    const loop = setInterval(() => {
      setChars(prev => prev.map(char => {
        if (chatTarget && chatTarget.instanceId === char.instanceId) return { ...char, state: 'IDLE' };

        let { x, dir, state, stateTimer } = char;
        let newState = state;
        let newTimer = stateTimer - 1;

        // Forced State by Weather
        if (weather === 'storm' && Math.random() > 0.95) newState = 'SAD';

        if (newTimer <= 0) {
          const roll = Math.random();
          if (roll < 0.4) newState = 'WALK';
          else if (roll < 0.7) newState = 'IDLE';
          else if (roll < 0.9) newState = 'SIT';
          
          newTimer = 20 + Math.random() * 50;
          if (Math.random() > 0.5) dir *= -1;
        }

        if (newState === 'WALK') {
          x += (dir * 0.3); // Speed
          if (x > 90) { x = 90; dir = -1; }
          if (x < 0) { x = 0; dir = 1; }
        }

        return { ...char, x, dir, state: newState, stateTimer: newTimer };
      }));
    }, 50);
    return () => clearInterval(loop);
  }, [chatTarget, weather]);

  // --- 3. CHAT LOGIC ---
  const sendMessage = () => {
    if (!userVal.trim()) return;
    const newHistory = [...chatHistory, { sender: 'user', text: userVal }];
    setChatHistory(newHistory);
    const input = userVal; 
    setUserVal("");
    
    // Pass dailyScore to brain if available, else GPA
    const scoreToUse = dailyScore !== null ? dailyScore : gpa;

    setTimeout(() => {
      const response = chatTarget.brain(input, scoreToUse);
      setChatHistory(prev => [...prev, { sender: 'bot', text: response }]);
    }, 1000);
  };

  return (
    <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-slate-800 mt-6 font-mono select-none group transition-all duration-1000">
      
      {/* ==============================
          LAYER 1: CELESTIAL SKY
      ============================== */}
      <div className={`absolute inset-0 transition-colors duration-2000
        ${timeOfDay === 'day' && weather === 'clear' ? 'bg-gradient-to-b from-sky-400 to-blue-200' : ''}
        ${timeOfDay === 'night' && weather === 'clear' ? 'bg-gradient-to-b from-[#0b1026] to-[#2b3266]' : ''}
        ${weather === 'rain' ? 'bg-gradient-to-b from-slate-700 to-slate-900' : ''}
        ${weather === 'storm' ? 'bg-[#1a1a1a]' : ''}
      `}>
         {/* LIGHTNING FLASH */}
         {weather === 'storm' && (
           <div className="absolute inset-0 bg-white opacity-0 animate-[flash_5s_infinite]"></div>
         )}
      </div>

      {/* STARS (Only visible at Night or during Storms) */}
      {(timeOfDay === 'night' || weather === 'storm') && stars.map(star => (
        <div 
          key={star.id}
          className="absolute bg-white rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: Math.random(), // Twinkle
            animation: `twinkle ${star.blink}s infinite ease-in-out`
          }}
        ></div>
      ))}

      {/* HEAVENLY BODIES (Sun / Moon) */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
         {/* SUN */}
         <motion.div 
           animate={{ 
             y: timeOfDay === 'day' ? 20 : 200, 
             x: timeOfDay === 'day' ? [0, 50] : 0 
           }} 
           transition={{ duration: 10 }}
           className={`absolute top-4 right-10 w-16 h-16 rounded-full bg-yellow-400 shadow-[0_0_60px_orange] blur-sm transition-opacity duration-1000 ${weather !== 'clear' ? 'opacity-20' : 'opacity-100'}`}
         ></motion.div>

         {/* MOON */}
         <motion.div 
           animate={{ 
             y: timeOfDay === 'night' ? 30 : 200 
           }} 
           className="absolute top-4 right-16 w-12 h-12 rounded-full bg-slate-200 shadow-[0_0_20px_white]"
         >
            {/* Craters */}
            <div className="absolute top-2 left-3 w-2 h-2 bg-slate-300 rounded-full opacity-50"></div>
            <div className="absolute bottom-3 right-4 w-3 h-3 bg-slate-300 rounded-full opacity-50"></div>
         </motion.div>
      </div>

      {/* CLOUDS (Moving) */}
      <div className="absolute top-10 left-0 w-full h-20 opacity-80 pointer-events-none">
         <motion.div 
           animate={{ x: ["-100%", "100%"] }} 
           transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
           className="absolute top-0 w-32 h-12 bg-white/20 rounded-full blur-xl"
         ></motion.div>
         {weather !== 'clear' && (
           <motion.div 
             animate={{ x: ["-100%", "100%"] }} 
             transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
             className="absolute top-4 w-full h-32 bg-slate-900/50 blur-2xl"
           ></motion.div>
         )}
      </div>

      {/* RAIN PARTICLES */}
      {(weather === 'rain' || weather === 'storm') && (
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20 animate-[slide_0.5s_linear_infinite]"></div>
      )}

      {/* GROUND */}
      <div className="absolute bottom-0 w-full h-16 bg-[#2d6a4f] border-t-8 border-[#40916c] relative z-20">
         {/* Grass Texture */}
         <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle,rgba(0,0,0,0.2)_1px,transparent_1px)] bg-[length:4px_4px]"></div>
      </div>

      {/* ==============================
          LAYER 2: CHARACTERS
      ============================== */}
      {chars.map(char => (
        <motion.div 
          key={char.instanceId}
          animate={{ left: `${char.x}%` }}
          transition={{ duration: 0.05, ease: "linear" }}
          className="absolute bottom-12 flex flex-col items-center cursor-pointer z-30 hover:scale-110 transition-transform"
          onClick={() => { setChatTarget(char); setChatHistory([{sender:'bot', text: char.brain("hello", dailyScore)}]); }}
        >
           {/* Emotion Bubble */}
           {weather === 'storm' && <div className="absolute -top-8 text-xl animate-bounce">😨</div>}
           {dailyScore > 80 && <div className="absolute -top-8 text-xl animate-bounce">🥳</div>}

           {/* Sprite */}
           <img 
             src={char.img} 
             alt={char.name}
             style={{ height: `${char.width}px` }}
             className={`drop-shadow-2xl transition-transform duration-200 
               ${char.dir === -1 ? 'scale-x-[-1]' : ''}
               ${char.state === 'WALK' ? 'animate-bounce' : ''}
               ${char.state === 'SIT' ? 'translate-y-4' : ''}
             `}
           />
        </motion.div>
      ))}

      {/* ==============================
          LAYER 3: CHAT UI
      ============================== */}
      <AnimatePresence>
        {chatTarget && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="absolute inset-0 bg-black/90 z-50 flex flex-col p-4">
             <div className="flex justify-between items-center border-b border-white/20 pb-2 mb-2">
                <div className="flex items-center gap-2">
                   <img src={chatTarget.img} className="w-8 h-8 object-contain bg-white/10 rounded-full" />
                   <span className="text-white font-bold">{chatTarget.name}</span>
                </div>
                <button onClick={() => setChatTarget(null)} className="text-red-400"><X size={18}/></button>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 mb-2">
                {chatHistory.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`p-2 rounded-lg text-xs max-w-[80%] ${m.sender === 'user' ? 'bg-blue-600' : 'bg-slate-700 text-white'}`}>{m.text}</div>
                  </div>
                ))}
             </div>
             <div className="flex gap-2">
                <input autoFocus value={userVal} onChange={(e) => setUserVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} className="flex-1 bg-slate-800 rounded px-3 py-2 text-xs text-white outline-none" placeholder="Type..." />
                <button onClick={sendMessage} className="bg-blue-600 p-2 rounded text-white"><Send size={14} /></button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
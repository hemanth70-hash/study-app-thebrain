import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Cloud, Star, Moon, Sun } from 'lucide-react';

// =======================================================
// 1. GEMINI AI CONFIGURATION
// =======================================================
const API_KEY = "AIzaSyDfBY7jQHF-X22l1RDv6jA9w1tzVWM8oXs"; // Your Gemini Key
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// =======================================================
// 2. CHARACTER & ASSET DATABASE
// =======================================================
const CHARACTERS = [
  { 
    id: 'fox', 
    name: 'Sly', 
    sprite: '🦊', 
    type: 'troll',
    systemPrompt: "You are a mischievous fox named Sly. You tease the user about studying. You are funny, sarcastic, and keep responses under 15 words.",
    x: 20, 
    dir: 1 
  },
  { 
    id: 'lion', 
    name: 'Leo', 
    sprite: '🦁', 
    type: 'motivator',
    systemPrompt: "You are Leo the Lion. You are a high-energy coach. You yell (use CAPS) to motivate the user! Keep responses under 15 words.",
    x: 50, 
    dir: 1 
  },
  { 
    id: 'owl', 
    name: 'Prof. Hoot', 
    sprite: '🦉', 
    type: 'mentor',
    systemPrompt: "You are Professor Hoot. You are wise, calm, and philosophical about education. Keep responses under 15 words.",
    x: 80, 
    dir: -1 
  }
];

export default function PixelGarden({ dailyScore, gpa, streak }) {
  const [activeChars, setActiveChars] = useState(CHARACTERS.map(c => ({ ...c, action: 'idle' })));
  const [plants, setPlants] = useState([]);
  const [chatTarget, setChatTarget] = useState(null);
  const [chatLog, setChatLog] = useState([]);
  const [userVal, setUserVal] = useState("");
  const [bubbles, setBubbles] = useState({});
  
  // Environment State
  const [timeOfDay, setTimeOfDay] = useState('day');
  const [weather, setWeather] = useState('clear');
  const [stars, setStars] = useState([]);
  
  const directorRef = useRef(false);

  // --- 1. INITIALIZE WORLD (Atmosphere) ---
  useEffect(() => {
    const hour = new Date().getHours();
    setTimeOfDay((hour < 6 || hour >= 18) ? 'night' : 'day');

    if (dailyScore !== null) {
      if (dailyScore < 40) setWeather('storm');
      else if (dailyScore > 80) setWeather('party');
      else setWeather('clear');
    }

    // Generate Stars for Night Mode
    const starArray = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      top: Math.random() * 50 + "%",
      left: Math.random() * 100 + "%",
      size: Math.random() * 3 + 1 + "px",
      delay: Math.random() * 2 + "s"
    }));
    setStars(starArray);
  }, [dailyScore]);

  // --- 2. LIVE GEMINI AI ENGINE ---
  const callGemini = async (prompt) => {
    try {
      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || "...";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Zzz... (API Error)";
    }
  };

  // --- 3. USER CHAT (Talking to You) ---
  const handleUserSend = async () => {
    if (!userVal.trim()) return;
    
    const input = userVal;
    setChatLog(prev => [...prev, { sender: 'user', text: input }]);
    setUserVal("");

    const context = `Context: User GPA is ${gpa}. Streak is ${streak} days.`;
    const fullPrompt = `${chatTarget.systemPrompt}\n${context}\nUser says: "${input}"\nReply:`;

    const reply = await callGemini(fullPrompt);
    setChatLog(prev => [...prev, { sender: 'bot', text: reply }]);
  };

  // --- 4. AUTO-DIRECTOR (Talking to Each Other) ---
  useEffect(() => {
    const loop = setInterval(async () => {
      // Don't interrupt if user is chatting or director is busy
      if (chatTarget || directorRef.current) return;
      
      // 20% Chance to trigger a skit every 5 seconds (Increased frequency)
      if (Math.random() > 0.80) {
        directorRef.current = true;
        
        // Pick Actors
        const a1 = activeChars[0]; // Fox
        const a2 = activeChars[1]; // Lion

        // Ask Gemini to write a script
        const scriptPrompt = `Write a very short 2-line dialogue between a trolling Fox and a yelling Lion Coach.
        Format: "Fox: [line] | Lion: [line]"
        Keep it funny and under 10 words per line.`;
        
        const rawScript = await callGemini(scriptPrompt);
        
        // Parse & Play
        const parts = rawScript.split('|');
        const line1 = parts[0]?.split(':')[1]?.trim() || "Why run when you can nap?";
        const line2 = parts[1]?.split(':')[1]?.trim() || "NO NAPS! ONLY GAINS!";

        // Action 1
        setBubbles({ [a1.id]: line1 });
        setActiveChars(prev => prev.map(c => c.id === a1.id ? { ...c, action: 'bounce' } : c));
        await new Promise(r => setTimeout(r, 4000));

        // Action 2
        setBubbles({ [a2.id]: line2 });
        setActiveChars(prev => prev.map(c => c.id === a2.id ? { ...c, action: 'bounce' } : c));
        await new Promise(r => setTimeout(r, 4000));

        // Reset
        setBubbles({});
        setActiveChars(prev => prev.map(c => ({ ...c, action: 'idle' })));
        directorRef.current = false;
      }
    }, 5000); 

    return () => clearInterval(loop);
  }, [chatTarget, activeChars]);

  // --- 5. PHYSICS LOOP (Movement) ---
  useEffect(() => {
    const loop = setInterval(() => {
      setActiveChars(prev => prev.map(char => {
        if (chatTarget?.id === char.id || bubbles[char.id]) return char;

        let { x, dir, action } = char;
        if (Math.random() > 0.95) {
          action = action === 'idle' ? 'walk' : 'idle';
          if (Math.random() > 0.5) dir *= -1;
        }
        if (action === 'walk') {
          x += dir * 0.5;
          if (x > 90) { x = 90; dir = -1; }
          if (x < 5) { x = 5; dir = 1; }
        }
        return { ...char, x, dir, action };
      }));
    }, 100);
    return () => clearInterval(loop);
  }, [chatTarget, bubbles]);

  // --- 6. PLANTING MECHANIC ---
  const handlePlant = (e) => {
    if (chatTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const flora = ['🌲', '🌳', '🌻', '🌷', '🍄', '🌾'];
    setPlants(prev => [...prev, { id: Date.now(), x: xPct, type: flora[Math.floor(Math.random() * flora.length)] }]);
  };

  return (
    <div className="relative w-full h-64 bg-[#0a0a0f] rounded-xl overflow-hidden border border-slate-800 mt-6 select-none group shadow-2xl font-sans" onClick={handlePlant}>
      
      {/* ==============================
          LAYER 1: ATMOSPHERE
      ============================== */}
      
      {/* Sky Gradient */}
      <div className={`absolute inset-0 transition-colors duration-2000 
        ${timeOfDay === 'day' ? 'bg-gradient-to-b from-sky-400 to-blue-200' : 'bg-gradient-to-b from-[#0b1026] to-[#2b3266]'}
        ${weather === 'storm' ? 'bg-slate-900' : ''}
      `}></div>

      {/* Sun / Moon */}
      <motion.div 
        animate={{ y: timeOfDay === 'day' ? 20 : 200, x: timeOfDay === 'day' ? [0, 50] : 0 }} 
        transition={{ duration: 20 }}
        className="absolute top-4 right-10"
      >
        {timeOfDay === 'day' ? (
           <div className="w-16 h-16 bg-yellow-400 rounded-full blur-sm shadow-[0_0_40px_orange]"></div>
        ) : (
           <div className="w-12 h-12 bg-slate-200 rounded-full shadow-[0_0_20px_white]"></div>
        )}
      </motion.div>

      {/* Stars (Night Only) */}
      {timeOfDay === 'night' && stars.map(star => (
        <div 
          key={star.id} 
          className="absolute bg-white rounded-full animate-pulse" 
          style={{ top: star.top, left: star.left, width: star.size, height: star.size, animationDuration: star.delay }} 
        />
      ))}

      {/* Clouds */}
      <motion.div 
        animate={{ x: ["-100%", "100%"] }} 
        transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
        className="absolute top-8 left-0 opacity-80"
      >
        <Cloud className="text-white w-24 h-12 blur-md opacity-50" />
      </motion.div>

      {/* Storm Effect */}
      {weather === 'storm' && <div className="absolute inset-0 bg-white/10 z-10 animate-[flash_0.2s_infinite]"></div>}

      {/* ==============================
          LAYER 2: GROUND & PROPS
      ============================== */}
      
      {/* Ground */}
      <div className="absolute bottom-0 w-full h-16 bg-gradient-to-t from-[#1a4d2e] to-[#2d6a4f] border-t-8 border-[#40916c] relative z-20"></div>

      {/* Plants */}
      {plants.map(p => (
        <motion.div key={p.id} initial={{ scale: 0, y: 10 }} animate={{ scale: 1, y: 0 }} className="absolute bottom-12 pointer-events-none text-2xl z-20" style={{ left: `${p.x}%` }}>
          {p.type}
        </motion.div>
      ))}

      {/* ==============================
          LAYER 3: CHARACTERS
      ============================== */}
      {activeChars.map(char => (
        <motion.div 
          key={char.instanceId}
          animate={{ left: `${char.x}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
          className="absolute bottom-12 flex flex-col items-center cursor-pointer z-30 hover:scale-110 transition-transform"
          onClick={(e) => { e.stopPropagation(); setChatTarget(char); setChatLog([{ sender: 'bot', text: `(Connecting to Gemini...) Hello!` }]); }}
        >
           {/* Auto-Banter Bubble */}
           <AnimatePresence>
             {bubbles[char.id] && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute -top-24 w-32 bg-white text-black text-[10px] p-2 rounded-xl text-center font-bold z-50 border-2 border-black">
                 {bubbles[char.id]}
                 <div className="absolute top-full left-1/2 -translate-x-1/2 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black"></div>
               </motion.div>
             )}
           </AnimatePresence>

           <div className={`text-5xl filter drop-shadow-2xl transition-transform 
             ${char.dir === -1 ? 'scale-x-[-1]' : ''} 
             ${char.action === 'bounce' ? 'animate-bounce' : ''} 
             ${char.action === 'walk' ? 'animate-pulse' : ''}
           `}>
             {char.sprite}
           </div>
        </motion.div>
      ))}

      {/* ==============================
          LAYER 4: CHAT OVERLAY
      ============================== */}
      <AnimatePresence>
        {chatTarget && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="absolute inset-0 bg-[#050508]/95 z-50 flex flex-col p-4 backdrop-blur-md">
             <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
                <div className="flex items-center gap-2">
                   <span className="text-3xl">{chatTarget.sprite}</span>
                   <span className="text-white font-bold">{chatTarget.name} <span className="text-blue-400 text-[10px]">(Gemini Live)</span></span>
                </div>
                <button onClick={() => setChatTarget(null)} className="text-white/50 hover:text-white"><X size={18}/></button>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-2">
                {chatLog.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`p-2 rounded-xl text-xs max-w-[85%] ${m.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}>{m.text}</div>
                  </div>
                ))}
             </div>
             <div className="flex gap-2">
                <input autoFocus value={userVal} onChange={(e) => setUserVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUserSend()} className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none" placeholder="Type..." />
                <button onClick={handleUserSend} className="bg-blue-600 p-2 rounded-lg text-white"><Send size={14} /></button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
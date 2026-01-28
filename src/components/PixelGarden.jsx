import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Zap } from 'lucide-react';

// =======================================================
// 1. GEMINI AI CONFIGURATION
// =======================================================
const API_KEY = "AIzaSyDfBY7jQHF-X22l1RDv6jA9w1tzVWM8oXs"; // Your Gemini Key
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// =======================================================
// 2. CHARACTER DATABASE (Animal Emojis)
// =======================================================
const CHARACTERS = [
  { 
    id: 'fox', 
    name: 'Sly', 
    sprite: '🦊', 
    type: 'troll',
    systemPrompt: "You are a mischievous fox named Sly. You love to troll and tease the user about their study habits. You are funny but slightly rude. Keep responses very short (under 15 words).",
    x: 20, 
    dir: 1 
  },
  { 
    id: 'owl', 
    name: 'Prof. Hoot', 
    sprite: '🦉', 
    type: 'mentor',
    systemPrompt: "You are a wise old owl. You give serious, philosophical advice about studying and focus. You are calm and polite. Keep responses short (under 15 words).",
    x: 50, 
    dir: 1 
  },
  { 
    id: 'lion', 
    name: 'Leo', 
    sprite: '🦁', 
    type: 'motivator',
    systemPrompt: "You are a high-energy lion coach. You yell (use caps) and motivate the user to crush their goals! You are intense. Keep responses short (under 15 words).",
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
  const [weather, setWeather] = useState('clear');
  const [timeOfDay, setTimeOfDay] = useState('day');
  
  const directorRef = useRef(false);

  // --- 1. INITIALIZE WORLD (Time/Weather) ---
  useEffect(() => {
    const hour = new Date().getHours();
    setTimeOfDay((hour < 6 || hour >= 18) ? 'night' : 'day');

    if (dailyScore !== null) {
      if (dailyScore < 40) setWeather('storm');
      else if (dailyScore > 80) setWeather('party');
      else setWeather('clear');
    }
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
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm thinking...";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "My brain is offline (API Error).";
    }
  };

  // --- 3. USER CHAT (You talk to them) ---
  const handleUserSend = async () => {
    if (!userVal.trim()) return;
    
    const input = userVal;
    setChatLog(prev => [...prev, { sender: 'user', text: input }]);
    setUserVal("");

    // Construct Prompt with Context
    const context = `Context: User GPA is ${gpa}. Streak is ${streak} days.`;
    const fullPrompt = `${chatTarget.systemPrompt}\n${context}\nUser says: "${input}"\nYour reply:`;

    // Call Gemini
    const reply = await callGemini(fullPrompt);
    setChatLog(prev => [...prev, { sender: 'bot', text: reply }]);
  };

  // --- 4. AUTO-DIRECTOR (They talk to EACH OTHER) ---
  useEffect(() => {
    const loop = setInterval(async () => {
      if (chatTarget || directorRef.current) return;
      
      // 15% chance to start a skit
      if (Math.random() > 0.85) {
        directorRef.current = true;
        
        // Pick Actors
        const a1 = activeChars[0]; // Fox
        const a2 = activeChars[1]; // Owl

        // Ask Gemini to write a script
        const scriptPrompt = `Write a 2-line dialogue between a trolling Fox and a wise Owl.
        Format: "Fox: [line] | Owl: [line]"
        Keep it funny and short.`;
        
        const rawScript = await callGemini(scriptPrompt);
        
        // Parse & Play
        const parts = rawScript.split('|');
        const line1 = parts[0]?.split(':')[1]?.trim() || "Hey Owl!";
        const line2 = parts[1]?.split(':')[1]?.trim() || "Quiet, Fox.";

        setBubbles({ [a1.id]: line1 });
        setActiveChars(prev => prev.map(c => c.id === a1.id ? { ...c, action: 'bounce' } : c));
        await new Promise(r => setTimeout(r, 4000));

        setBubbles({ [a2.id]: line2 });
        setActiveChars(prev => prev.map(c => c.id === a2.id ? { ...c, action: 'bounce' } : c));
        await new Promise(r => setTimeout(r, 4000));

        setBubbles({});
        setActiveChars(prev => prev.map(c => ({ ...c, action: 'idle' })));
        directorRef.current = false;
      }
    }, 8000); 

    return () => clearInterval(loop);
  }, [chatTarget, activeChars]);

  // --- 5. PHYSICS LOOP (Walking) ---
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

  // --- 6. PLANTING ---
  const handlePlant = (e) => {
    if (chatTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const flora = ['🌲', '🌳', '🌻', '🌷', '🍄'];
    setPlants(prev => [...prev, { id: Date.now(), x: xPct, type: flora[Math.floor(Math.random() * flora.length)] }]);
  };

  return (
    <div className="relative w-full h-56 bg-[#0a0a0f] rounded-xl overflow-hidden border border-slate-800 mt-6 select-none group shadow-2xl font-sans" onClick={handlePlant}>
      
      {/* SKY & WEATHER */}
      <div className={`absolute inset-0 transition-colors duration-1000 
        ${timeOfDay === 'day' ? 'bg-gradient-to-b from-sky-400/40 to-[#0a0a0f]' : 'bg-gradient-to-b from-indigo-900/40 to-[#0a0a0f]'}
      `}></div>
      
      {/* Sun/Moon */}
      <motion.div 
        animate={{ y: [0, -5, 0], rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className={`absolute top-4 right-8 w-10 h-10 rounded-full blur-md flex items-center justify-center text-xl
          ${timeOfDay === 'day' ? 'bg-yellow-400/20 shadow-[0_0_30px_orange]' : 'bg-slate-400/10 shadow-[0_0_15px_white]'}`}
      >
        {timeOfDay === 'day' ? '☀️' : '🌙'}
      </motion.div>

      {/* Stars (Night) */}
      {timeOfDay === 'night' && [...Array(15)].map((_, i) => (
        <div key={i} className="absolute bg-white/60 rounded-full w-1 h-1 animate-pulse" style={{ top: `${Math.random()*60}%`, left: `${Math.random()*100}%` }} />
      ))}

      {/* Rain (Storm) */}
      {weather === 'storm' && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20 animate-pulse pointer-events-none"></div>}

      {/* Ground */}
      <div className="absolute bottom-0 w-full h-10 bg-gradient-to-r from-emerald-900/40 to-emerald-800/20 border-t border-white/5 backdrop-blur-sm"></div>

      {/* Plants */}
      {plants.map(p => (
        <motion.div key={p.id} initial={{ scale: 0, y: 10 }} animate={{ scale: 1, y: 0 }} className="absolute bottom-4 pointer-events-none text-xl" style={{ left: `${p.x}%` }}>
          {p.type}
        </motion.div>
      ))}

      {/* CHARACTERS */}
      {activeChars.map(char => (
        <motion.div 
          key={char.id}
          animate={{ left: `${char.x}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
          className="absolute bottom-6 flex flex-col items-center cursor-pointer z-10 hover:scale-110 transition-transform"
          onClick={(e) => { e.stopPropagation(); setChatTarget(char); setChatLog([{ sender: 'bot', text: `(AI Connected) Hey, I'm ${char.name}.` }]); }}
        >
           {/* Auto-Banter Bubble */}
           <AnimatePresence>
             {bubbles[char.id] && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute -top-20 w-32 bg-white text-black text-[9px] p-2 rounded-xl text-center font-bold z-50">
                 {bubbles[char.id]}
                 <div className="absolute top-full left-1/2 -translate-x-1/2 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white"></div>
               </motion.div>
             )}
           </AnimatePresence>

           <div className={`text-4xl filter drop-shadow-lg transition-transform 
             ${char.dir === -1 ? 'scale-x-[-1]' : ''} 
             ${char.action === 'bounce' ? 'animate-bounce' : ''} 
             ${char.action === 'walk' ? 'animate-pulse' : ''}
           `}>
             {char.sprite}
           </div>
        </motion.div>
      ))}

      {/* CHAT OVERLAY */}
      <AnimatePresence>
        {chatTarget && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="absolute inset-0 bg-[#050508]/95 z-50 flex flex-col p-4 backdrop-blur-md">
             <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
                <div className="flex items-center gap-2">
                   <span className="text-2xl">{chatTarget.sprite}</span>
                   <span className="text-white font-bold">{chatTarget.name} <span className="text-blue-400 text-[10px]">(Gemini AI)</span></span>
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
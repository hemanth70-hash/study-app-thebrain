import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Waves, Droplets } from 'lucide-react';

// =======================================================
// 1. CONFIGURATION (CHANGE API KEY HERE)
// =======================================================
const API_KEY = "AIzaSyDfBY7jQHF-X22l1RDv6jA9w1tzVWM8oXs"; // 🔴 YOUR KEY
const MODEL = "gemini-1.5-flash"; // Stable model
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

// =======================================================
// 2. AQUATIC CHARACTERS
// =======================================================
const FISH = [
  { 
    id: 'shark', 
    name: 'Boss Shark', 
    sprite: '🦈', 
    type: 'motivator',
    systemPrompt: "You are a tough Shark CEO. You shout short motivational quotes. You smell fear (laziness). Keep it under 15 words.",
    y: 30, speed: 0.8
  },
  { 
    id: 'clown', 
    name: 'Nemo', 
    sprite: '🐠', 
    type: 'troll',
    systemPrompt: "You are a lost Clownfish. You tell bad jokes about the ocean and the user's grades. Keep it under 15 words.",
    y: 60, speed: 0.5
  },
  { 
    id: 'octo', 
    name: 'Dr. Octo', 
    sprite: '🐙', 
    type: 'mentor',
    systemPrompt: "You are a genius Octopus with 8 brains. You give multi-tasking advice and wisdom. Keep it under 15 words.",
    y: 80, speed: 0.3
  },
  { 
    id: 'crab', 
    name: 'Mr. Krabs', 
    sprite: '🦀', 
    type: 'greedy',
    systemPrompt: "You love money and efficiency. Tell the user time is money! Get back to work! Keep it under 15 words.",
    y: 90, speed: 0.2
  }
];

export default function PixelAquarium({ dailyScore, gpa, streak }) {
  const [swimmers, setSwimmers] = useState(FISH.map(f => ({ ...f, x: Math.random() * 80, dir: 1, action: 'swim' })));
  const [bubbles, setBubbles] = useState([]);
  const [chatTarget, setChatTarget] = useState(null);
  const [chatLog, setChatLog] = useState([]);
  const [userVal, setUserVal] = useState("");
  const [dialogues, setDialogues] = useState({});
  const directorRef = useRef(false);

  // --- 1. ENVIRONMENT ENGINE (Bubbles) ---
  useEffect(() => {
    const interval = setInterval(() => {
      setBubbles(prev => {
        const newBubbles = prev.map(b => ({ ...b, y: b.y - 2 })).filter(b => b.y > -10);
        if (Math.random() > 0.7) {
          newBubbles.push({ 
            id: Date.now(), 
            x: Math.random() * 100, 
            y: 100, 
            size: Math.random() * 10 + 5 
          });
        }
        return newBubbles;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // --- 2. GEMINI AI ENGINE ---
  const callGemini = async (prompt, contextOverride = "") => {
    try {
      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Blub blub... (Thinking)";
    } catch (e) {
      return "My gills are clogged (API Error)";
    }
  };

  // --- 3. USER CHAT ---
  const handleSend = async () => {
    if (!userVal.trim()) return;
    const input = userVal;
    setChatLog(prev => [...prev, { sender: 'user', text: input }]);
    setUserVal("");

    const context = `User GPA: ${gpa}. Streak: ${streak}.`;
    const prompt = `System: ${chatTarget.systemPrompt}\n${context}\nUser: "${input}"\nReply:`;
    
    const reply = await callGemini(prompt);
    setChatLog(prev => [...prev, { sender: 'bot', text: reply }]);
  };

  // --- 4. AUTO-DIRECTOR (Fish Talk to Fish) ---
  useEffect(() => {
    const loop = setInterval(async () => {
      if (chatTarget || directorRef.current) return;

      if (Math.random() > 0.80) { // 20% Chance every 5s
        directorRef.current = true;
        
        // Pick 2 random fish
        const f1 = swimmers[Math.floor(Math.random() * swimmers.length)];
        let f2 = swimmers[Math.floor(Math.random() * swimmers.length)];
        while(f2.id === f1.id) f2 = swimmers[Math.floor(Math.random() * swimmers.length)];

        // Get Script
        const scriptPrompt = `Write a funny 2-line conversation between a ${f1.name} and ${f2.name} in an aquarium.
        Format: "${f1.name}: [text] | ${f2.name}: [text]"
        Keep it very short (max 8 words).`;

        const raw = await callGemini(scriptPrompt);
        const parts = raw.split('|');
        const line1 = parts[0]?.split(':')[1]?.trim() || "Glub glub.";
        const line2 = parts[1]?.split(':')[1]?.trim() || "Swim away!";

        // Act it out
        setDialogues({ [f1.id]: line1 });
        await new Promise(r => setTimeout(r, 3000));
        
        setDialogues({ [f2.id]: line2 });
        await new Promise(r => setTimeout(r, 3000));

        setDialogues({});
        directorRef.current = false;
      }
    }, 5000);
    return () => clearInterval(loop);
  }, [chatTarget, swimmers]);

  // --- 5. PHYSICS (Swimming) ---
  useEffect(() => {
    const loop = setInterval(() => {
      setSwimmers(prev => prev.map(s => {
        if (chatTarget?.id === s.id) return s; // Freeze if chatting

        let { x, dir, speed } = s;
        // Swim movement
        x += dir * speed;
        
        // Turn around at edges
        if (x > 90) dir = -1;
        if (x < 5) dir = 1;

        // Randomly pause or change depth
        let y = s.y;
        if (Math.random() > 0.98) y += (Math.random() * 10 - 5);

        return { ...s, x, dir, y };
      }));
    }, 50);
    return () => clearInterval(loop);
  }, [chatTarget]);

  return (
    <div className="relative w-full h-64 bg-blue-900 rounded-xl overflow-hidden border-4 border-slate-800 mt-6 select-none group shadow-[0_0_30px_rgba(0,100,255,0.2)] font-sans">
      
      {/* WATER BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/30 to-blue-950 z-0"></div>
      
      {/* BUBBLES */}
      {bubbles.map(b => (
        <div key={b.id} className="absolute rounded-full border border-white/30 bg-white/10 backdrop-blur-sm" 
             style={{ left: `${b.x}%`, bottom: `${b.y}%`, width: b.size, height: b.size }} />
      ))}

      {/* LIGHT RAYS */}
      <div className="absolute top-0 left-10 w-20 h-full bg-white/5 skew-x-12 blur-xl"></div>
      <div className="absolute top-0 right-20 w-32 h-full bg-white/5 -skew-x-12 blur-xl"></div>

      {/* DECOR (Seaweed) */}
      <div className="absolute bottom-0 left-5 text-4xl opacity-60 animate-pulse">🌿</div>
      <div className="absolute bottom-0 left-20 text-5xl opacity-50">🪸</div>
      <div className="absolute bottom-0 right-10 text-6xl opacity-60 animate-pulse">🌿</div>
      <div className="absolute bottom-0 w-full h-8 bg-[#c2b280] opacity-80 blur-sm"></div>

      {/* FISH */}
      {swimmers.map(s => (
        <motion.div 
          key={s.id}
          animate={{ left: `${s.x}%`, top: `${s.y}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
          className="absolute z-20 flex flex-col items-center cursor-pointer hover:scale-125 transition-transform"
          onClick={() => { setChatTarget(s); setChatLog([{sender: 'bot', text: `Glub... I am ${s.name}.`}]); }}
        >
           {/* Speech Bubble */}
           <AnimatePresence>
             {dialogues[s.id] && (
               <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} 
                           className="absolute -top-16 w-32 bg-white text-blue-900 text-[10px] font-bold p-2 rounded-xl text-center z-50 border-2 border-blue-200">
                 {dialogues[s.id]}
               </motion.div>
             )}
           </AnimatePresence>

           {/* Sprite */}
           <div className={`text-5xl filter drop-shadow-lg ${s.dir === -1 ? 'scale-x-[-1]' : ''}`}>
             {s.sprite}
           </div>
        </motion.div>
      ))}

      {/* CHAT OVERLAY */}
      <AnimatePresence>
        {chatTarget && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="absolute inset-0 bg-blue-950/90 z-50 flex flex-col p-4 backdrop-blur-md">
             <div className="flex justify-between items-center border-b border-white/20 pb-2 mb-2">
                <div className="flex items-center gap-2">
                   <span className="text-3xl">{chatTarget.sprite}</span>
                   <div>
                     <div className="text-white font-bold">{chatTarget.name}</div>
                     {/* 🔴 CHANGE 'Gemini AI' TEXT HERE IF YOU WANT */}
                     <div className="text-cyan-400 text-[9px] uppercase tracking-widest">Live Uplink</div>
                   </div>
                </div>
                <button onClick={() => setChatTarget(null)} className="text-white/50 hover:text-white"><X size={18}/></button>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-2">
                {chatLog.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`p-2 rounded-xl text-xs max-w-[85%] ${m.sender === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-cyan-100 border border-cyan-900'}`}>{m.text}</div>
                  </div>
                ))}
             </div>
             <div className="flex gap-2">
                <input autoFocus value={userVal} onChange={(e) => setUserVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} className="flex-1 bg-slate-900 border border-cyan-900 rounded-lg px-3 py-2 text-xs text-white outline-none" placeholder="Bubble something..." />
                <button onClick={handleSend} className="bg-cyan-600 p-2 rounded-lg text-white"><Send size={14} /></button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
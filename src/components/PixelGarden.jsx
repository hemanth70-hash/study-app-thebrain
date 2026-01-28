import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X } from 'lucide-react';

// =======================================================
// 1. GEMINI CONFIGURATION (STABLE MODEL)
// =======================================================
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 
// Switched to 'gemini-pro' which is the most stable free model endpoint
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

// =======================================================
// 2. AQUATIC CHARACTERS
// =======================================================
const FISH = [
  { 
    id: 'octo', 
    name: 'Dr. Octo', 
    sprite: '🐙', 
    type: 'mentor',
    systemPrompt: "You are a genius Octopus. Give study advice. Max 10 words.",
    y: 40, speed: 0.2
  },
  { 
    id: 'crab', 
    name: 'Mr. Krabs', 
    sprite: '🦀', 
    type: 'greedy',
    systemPrompt: "You love efficiency. Tell the user to work harder! Max 10 words.",
    y: 85, speed: 0.15
  },
  { 
    id: 'turtle', 
    name: 'Crush', 
    sprite: '🐢', 
    type: 'chill',
    systemPrompt: "You are a chill sea turtle. Tell the user to relax. Max 10 words.",
    y: 60, speed: 0.1
  },
  { 
    id: 'puffer', 
    name: 'Bloat', 
    sprite: '🐡', 
    type: 'nervous',
    systemPrompt: "You are a nervous Pufferfish. Panic about deadlines! Max 10 words.",
    y: 20, speed: 0.3
  }
];

export default function PixelAquarium({ dailyScore, gpa, streak }) {
  const [swimmers, setSwimmers] = useState(FISH.map(f => ({ ...f, x: Math.random() * 80, dir: 1 })));
  const [bubbles, setBubbles] = useState([]);
  const [chatTarget, setChatTarget] = useState(null);
  const [chatLog, setChatLog] = useState([]);
  const [userVal, setUserVal] = useState("");
  const [dialogues, setDialogues] = useState({});
  const directorRef = useRef(false);
  // Ref to auto-scroll chat
  const chatEndRef = useRef(null);

  // --- 1. ENVIRONMENT (Bubbles) ---
  useEffect(() => {
    const interval = setInterval(() => {
      setBubbles(prev => {
        const newBubbles = prev.map(b => ({ ...b, y: b.y + 1.5 })).filter(b => b.y < 110);
        if (Math.random() > 0.8) {
          newBubbles.push({ id: Date.now(), x: Math.random() * 95, y: -10, size: Math.random() * 8 + 4 });
        }
        return newBubbles;
      });

      setSwimmers(prev => prev.map(s => {
        if (chatTarget?.id === s.id) return s;
        let { x, dir, speed } = s;
        x += dir * speed;
        if (x > 90) dir = -1;
        if (x < 5) dir = 1;
        let y = s.y + Math.sin(Date.now() / 800) * 0.15;
        return { ...s, x, dir, y };
      }));
    }, 50);
    return () => clearInterval(interval);
  }, [chatTarget]);

  // Scroll to bottom when chat updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog]);

  // --- 2. GEMINI ENGINE ---
  const callGemini = async (prompt) => {
    if (!API_KEY) return "Error: API Key missing in .env";
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      if (!data.candidates || data.error) return "Blub... (Thinking)";
      return data.candidates[0].content.parts[0].text;
    } catch (e) {
      return "Connection lost.";
    }
  };

  // --- 3. USER CHAT ---
  const handleSend = async () => {
    if (!userVal.trim()) return;
    const input = userVal;
    setChatLog(prev => [...prev, { sender: 'user', text: input }]);
    setUserVal("");

    const context = `User GPA: ${gpa}%. Streak: ${streak}.`;
    const fullPrompt = `${chatTarget.systemPrompt}\n${context}\nUser says: "${input}"\nReply:`;
    
    const reply = await callGemini(fullPrompt);
    setChatLog(prev => [...prev, { sender: 'bot', text: reply }]);
  };

  // --- 4. AUTO-DIRECTOR ---
  useEffect(() => {
    const loop = setInterval(async () => {
      if (chatTarget || directorRef.current) return;
      if (Math.random() > 0.80) { 
        directorRef.current = true;
        const f1 = swimmers[0]; 
        const f2 = swimmers[1]; 
        const scriptPrompt = `Write a 2-line dialogue between a wise Octopus and a greedy Crab. Format: "Octopus: [text] | Crab: [text]"`;
        const raw = await callGemini(scriptPrompt);
        const parts = raw.split('|');
        const line1 = parts[0]?.split(':')[1]?.trim() || "Work smarter.";
        const line2 = parts[1]?.split(':')[1]?.trim() || "Work harder!";
        setDialogues({ [f1.id]: line1 });
        await new Promise(r => setTimeout(r, 3500));
        setDialogues({ [f2.id]: line2 });
        await new Promise(r => setTimeout(r, 3500));
        setDialogues({});
        directorRef.current = false;
      }
    }, 10000); 
    return () => clearInterval(loop);
  }, [chatTarget, swimmers]);

  return (
    <div className="relative w-full h-64 bg-blue-900 rounded-xl overflow-hidden border-4 border-slate-800 mt-6 select-none group shadow-[0_0_30px_rgba(0,100,255,0.2)] font-sans isolate transform-gpu">
      
      {/* VISUALS */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/20 to-blue-950 z-0"></div>
      <div className="absolute bottom-0 w-full h-12 bg-gradient-to-t from-[#e6d5ac] to-[#c2b280] border-t-4 border-[#a69260] z-10 flex items-center justify-around">
         {[...Array(20)].map((_, i) => (<div key={i} className="w-1 h-1 bg-yellow-900/20 rounded-full" style={{ marginTop: Math.random() * 20 }}></div>))}
      </div>
      <div className="absolute bottom-4 left-5 text-4xl opacity-80 animate-pulse z-10 origin-bottom swing">🌿</div>
      <div className="absolute bottom-8 left-16 text-2xl opacity-60 z-10">🪸</div>
      <div className="absolute bottom-4 right-10 text-5xl opacity-80 animate-pulse z-10 origin-bottom swing">🌿</div>
      <div className="absolute bottom-6 right-24 text-3xl opacity-70 z-10">🐚</div>

      {bubbles.map(b => (
        <div key={b.id} className="absolute rounded-full border border-white/40 bg-white/10 backdrop-blur-sm z-0 will-change-transform" style={{ left: `${b.x}%`, bottom: `${b.y}%`, width: b.size, height: b.size }} />
      ))}

      {swimmers.map(s => (
        <motion.div key={s.id} animate={{ left: `${s.x}%`, top: `${s.y}%` }} transition={{ duration: 0.1, ease: 'linear' }} className="absolute z-20 flex flex-col items-center cursor-pointer hover:scale-125 transition-transform will-change-transform" onClick={() => { setChatTarget(s); setChatLog([{sender: 'bot', text: `Glub... I am ${s.name}.`}]); }}>
           <AnimatePresence>
             {dialogues[s.id] && (<motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute -top-16 w-32 bg-white text-blue-900 text-[10px] font-bold p-2 rounded-xl text-center z-50 border-2 border-blue-200 shadow-lg">{dialogues[s.id]}<div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white"></div></motion.div>)}
           </AnimatePresence>
           <div className={`text-5xl filter drop-shadow-xl ${s.dir === 1 ? 'scale-x-[-1]' : ''}`}>{s.sprite}</div>
        </motion.div>
      ))}

      {/* CHAT OVERLAY - FIXED SHAKING */}
      <AnimatePresence>
        {chatTarget && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="absolute inset-0 bg-blue-950/95 z-50 flex flex-col p-4 backdrop-blur-md">
             <div className="flex justify-between items-center border-b border-white/20 pb-2 mb-2 shrink-0">
                <div className="flex items-center gap-2">
                   <span className="text-3xl">{chatTarget.sprite}</span>
                   <div>
                     <div className="text-white font-bold">{chatTarget.name}</div>
                     <div className="text-cyan-400 text-[9px] uppercase tracking-widest flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> AquaLink</div>
                   </div>
                </div>
                <button onClick={() => setChatTarget(null)} className="text-white/50 hover:text-white"><X size={18}/></button>
             </div>
             {/* ADDED: overflow-y-scroll prevents width jumps when scrollbar appears */}
             <div className="flex-1 overflow-y-scroll custom-scrollbar space-y-3 mb-2 pr-2">
                {chatLog.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`p-2 rounded-xl text-xs max-w-[85%] ${m.sender === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-cyan-100 border border-cyan-900'}`}>{m.text}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
             </div>
             <div className="flex gap-2 shrink-0">
                <input autoFocus value={userVal} onChange={(e) => setUserVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} className="flex-1 bg-slate-900 border border-cyan-900 rounded-lg px-3 py-2 text-xs text-white outline-none" placeholder="Ask..." />
                <button onClick={handleSend} className="bg-cyan-600 p-2 rounded-lg text-white"><Send size={14} /></button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
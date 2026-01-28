import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Zap, Heart, Frown } from 'lucide-react';

// ==========================================
// 1. THE "LIVE" AI BRAIN (Simulated LLM)
// ==========================================
const CHARACTERS = [
  { 
    id: 'shinchan', 
    name: 'Shinchan', 
    sprite: '👦🏻', 
    pet: '🐶', 
    type: 'troll',
    unlock: { type: 'default' },
    // The "Brain" processes your text live
    brain: (input, context) => {
      const txt = input.toLowerCase();
      if (txt.includes('hello') || txt.includes('hi')) return { text: "Oho! Beautiful lady? Oh wait, it's just you.", mood: 'troll' };
      if (txt.includes('study') || txt.includes('work')) return { text: "Studying is for people who don't have Chocobi! Let's watch Action Kamen!", mood: 'happy' };
      if (txt.includes('tired') || txt.includes('bored')) return { text: "Me too... Mom is making me clean my room. Save me!", mood: 'sad' };
      if (txt.includes('joke')) return { text: "Do you like capsicum? Because I HATE IT!", mood: 'angry' };
      return { text: "To be or not to be... Hey, where is my Chocobi?", mood: 'troll' };
    }
  },
  { 
    id: 'doraemon', 
    name: 'Doraemon', 
    sprite: '🐱🤖', 
    pet: '👓', 
    type: 'helper',
    unlock: { type: 'gpa', val: 60, desc: 'Unlock: 60% GPA' },
    brain: (input, context) => {
      const txt = input.toLowerCase();
      if (txt.includes('help') || txt.includes('stuck')) return { text: "Nobita!! ...I mean User! Take this: 'Memory Bread'!", mood: 'happy' };
      if (txt.includes('fail') || txt.includes('hard')) return { text: "Don't give up! Even Nobita passes sometimes!", mood: 'happy' };
      if (txt.includes('mouse')) return { text: "EEEK!! A MOUSE?! WHERE?!", mood: 'scared' };
      return { text: "I'm polishing my gadgets. Do you need the Anywhere Door?", mood: 'idle' };
    }
  },
  { 
    id: 'ben10', 
    name: 'Ben 10', 
    sprite: '⌚💚', 
    pet: '🛸', 
    type: 'hero',
    unlock: { type: 'streak', val: 7, desc: 'Unlock: 7 Day Streak' },
    brain: (input, context) => {
      const txt = input.toLowerCase();
      if (txt.includes('fight') || txt.includes('exam')) return { text: "It's Hero Time! Let's go XLR8 on this syllabus!", mood: 'heroic' };
      if (txt.includes('tired')) return { text: "The Omnitrix needs a recharge. Take a 5 min break.", mood: 'idle' };
      return { text: "Vilgax is plotting something... Stay sharp, hero.", mood: 'heroic' };
    }
  },
  { 
    id: 'tomjerry', 
    name: 'Tom', 
    sprite: '🐱', 
    pet: '🐭', 
    type: 'silent',
    unlock: { type: 'gpa', val: 80, desc: 'Unlock: 80% GPA' },
    brain: (input) => {
      return { text: "*Bonk* (Chasing Jerry)", mood: 'angry' };
    }
  }
];

// Scripts for when they talk to EACH OTHER
const AUTO_BANTER = [
  { actors: ['shinchan', 'doraemon'], text: ["Hey Blue Raccoon!", "I AM NOT A RACCOON!"] },
  { actors: ['ben10', 'shinchan'], text: ["Is that watch a toy?", "It's the Omnitrix!"] },
  { actors: ['doraemon', 'ben10'], text: ["Do you have a mouse trap gadget?", "I can turn into Rath!"] }
];

export default function PixelGarden({ gpa, streak }) {
  const [activeChars, setActiveChars] = useState([]);
  const [chatTarget, setChatTarget] = useState(null); // Who are we talking to?
  const [chatLog, setChatLog] = useState([]);
  const [userVal, setUserVal] = useState("");
  const [autoDirector, setAutoDirector] = useState(null); // Controls auto-conversations
  const containerRef = useRef(null);

  // --- 1. SPAWN LOGIC ---
  useEffect(() => {
    const unlocked = CHARACTERS.filter(c => {
      if (c.unlock.type === 'default') return true;
      if (c.unlock.type === 'gpa') return gpa >= c.unlock.val;
      if (c.unlock.type === 'streak') return streak >= c.unlock.val;
      return false;
    });

    setActiveChars(unlocked.map((c, i) => ({
      ...c, instanceId: i, x: 20 + (i * 25), y: 80, dir: 1, action: 'idle'
    })));
  }, [gpa, streak]);

  // --- 2. PHYSICS LOOP (Walking) ---
  useEffect(() => {
    const loop = setInterval(() => {
      setActiveChars(prev => prev.map(char => {
        // If chatting or acting in a skit, freeze movement
        if (chatTarget?.id === char.id || autoDirector?.actors.includes(char.id)) return char;

        let { x, dir, action } = char;
        
        // Randomly decide to walk or idle
        if (Math.random() > 0.95) {
          action = action === 'idle' ? 'walk' : 'idle';
          if (Math.random() > 0.5) dir *= -1;
        }

        // Walk logic
        if (action === 'walk') {
          x += dir * 0.5;
          if (x > 90) { x = 90; dir = -1; } // Turn at walls
          if (x < 5) { x = 5; dir = 1; }
        }

        return { ...char, x, dir, action };
      }));
    }, 100);
    return () => clearInterval(loop);
  }, [chatTarget, autoDirector]);

  // --- 3. AUTO-DIRECTOR (They talk to themselves) ---
  useEffect(() => {
    const loop = setInterval(() => {
      if (chatTarget || autoDirector) return; // Don't interrupt

      // 10% Chance to start a skit
      if (Math.random() > 0.9 && activeChars.length > 1) {
        const script = AUTO_BANTER[Math.floor(Math.random() * AUTO_BANTER.length)];
        const actor1 = activeChars.find(c => c.id === script.actors[0]);
        const actor2 = activeChars.find(c => c.id === script.actors[1]);

        if (actor1 && actor2) {
          playSkit(actor1, actor2, script.text);
        }
      }
    }, 2000);
    return () => clearInterval(loop);
  }, [activeChars, chatTarget, autoDirector]);

  const playSkit = async (a1, a2, lines) => {
    setAutoDirector({ actors: [a1.id, a2.id], line: "", speaker: null });
    
    // Line 1
    setAutoDirector({ actors: [a1.id, a2.id], line: lines[0], speaker: a1.id });
    await new Promise(r => setTimeout(r, 3000));
    
    // Line 2
    setAutoDirector({ actors: [a1.id, a2.id], line: lines[1], speaker: a2.id });
    await new Promise(r => setTimeout(r, 3000));

    // End
    setAutoDirector(null);
  };

  // --- 4. USER CHAT LOGIC ---
  const startUserChat = (char) => {
    setChatTarget(char);
    setChatLog([{ sender: 'bot', text: `Oho? You want to talk to ${char.name}?` }]);
  };

  const sendUserMessage = () => {
    if (!userVal.trim()) return;
    
    const input = userVal;
    setChatLog(prev => [...prev, { sender: 'user', text: input }]);
    setUserVal("");

    // SIMULATE AI THINKING DELAY
    setTimeout(() => {
      const response = chatTarget.brain(input, { gpa, streak });
      setChatLog(prev => [...prev, { sender: 'bot', text: response.text }]);
      
      // Trigger Emotion Animation
      setActiveChars(prev => prev.map(c => c.id === chatTarget.id ? { ...c, action: response.mood } : c));
      
      // Reset animation after 2s
      setTimeout(() => {
        setActiveChars(prev => prev.map(c => c.id === chatTarget.id ? { ...c, action: 'idle' } : c));
      }, 2000);

    }, 800);
  };

  return (
    <div ref={containerRef} className="relative w-full h-56 bg-[#0a0a0f] rounded-xl overflow-hidden border border-slate-800 mt-6 select-none group shadow-2xl font-sans">
      
      {/* BACKGROUND */}
      <div className={`absolute inset-0 transition-colors duration-1000 ${gpa > 80 ? 'bg-gradient-to-b from-purple-900/30 to-[#0a0a0f]' : 'bg-gradient-to-b from-blue-900/20 to-[#0a0a0f]'}`}></div>
      
      {/* Stars */}
      {[...Array(20)].map((_, i) => (
        <div key={i} className="absolute bg-white/40 rounded-full w-1 h-1 animate-pulse" style={{ top: `${Math.random()*60}%`, left: `${Math.random()*100}%` }} />
      ))}

      {/* Ground */}
      <div className="absolute bottom-0 w-full h-10 bg-gradient-to-r from-emerald-900/40 to-emerald-800/20 border-t border-white/5 backdrop-blur-sm"></div>

      {/* CHARACTERS */}
      {activeChars.map(char => (
        <motion.div 
          key={char.instanceId}
          animate={{ left: `${char.x}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
          className="absolute bottom-6 flex flex-col items-center cursor-pointer z-10 hover:scale-110 transition-transform"
          onClick={() => startUserChat(char)}
        >
           {/* Auto-Director Bubble */}
           <AnimatePresence>
             {autoDirector?.speaker === char.id && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute -top-16 w-32 bg-white text-black text-[10px] font-bold p-2 rounded-xl text-center shadow-lg z-50">
                 {autoDirector.line}
                 <div className="absolute top-full left-1/2 -translate-x-1/2 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white"></div>
               </motion.div>
             )}
           </AnimatePresence>

           {/* Sprite */}
           <div className={`text-4xl filter drop-shadow-lg transition-transform 
             ${char.dir === -1 ? 'scale-x-[-1]' : ''} 
             ${char.action === 'walk' ? 'animate-bounce' : ''}
             ${char.action === 'happy' ? 'animate-bounce' : ''}
             ${char.action === 'angry' ? 'animate-shake' : ''}
           `}>
             {char.sprite}
           </div>
           
           {/* Shadow */}
           <div className="w-8 h-1.5 bg-black/50 rounded-full blur-[2px] mt-[-2px]"></div>
        </motion.div>
      ))}

      {/* CHAT OVERLAY (When Talking to User) */}
      <AnimatePresence>
        {chatTarget && (
          <motion.div 
            initial={{ y: '100%' }} 
            animate={{ y: 0 }} 
            exit={{ y: '100%' }} 
            className="absolute inset-0 bg-[#050508]/95 z-50 flex flex-col p-4 backdrop-blur-md"
          >
             {/* Header */}
             <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
                <div className="flex items-center gap-2">
                   <span className="text-2xl">{chatTarget.sprite}</span>
                   <div>
                      <div className="text-sm font-bold text-white">{chatTarget.name}</div>
                      <div className="text-[9px] text-green-400 uppercase tracking-wider flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online</div>
                   </div>
                </div>
                <button onClick={() => setChatTarget(null)} className="text-white/50 hover:text-white bg-white/5 p-1 rounded-full"><X size={16}/></button>
             </div>

             {/* Log */}
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-2 p-1">
                {chatLog.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`p-2.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${m.sender === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700'}`}>
                        {m.text}
                     </div>
                  </div>
                ))}
             </div>

             {/* Input */}
             <div className="flex gap-2">
                <input 
                  autoFocus
                  value={userVal} 
                  onChange={(e) => setUserVal(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && sendUserMessage()} 
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-600" 
                  placeholder={`Chat with ${chatTarget.name}...`} 
                />
                <button onClick={sendUserMessage} className="bg-blue-600 p-2.5 rounded-xl text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all"><Send size={16} /></button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
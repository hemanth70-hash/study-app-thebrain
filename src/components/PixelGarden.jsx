import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function PixelGarden({ gpa, streak }) {
  const canvasRef = useRef(null);
  const [characters, setCharacters] = useState([]);
  const [plants, setPlants] = useState([]);

  // --- 1. INITIALIZE WORLD ---
  useEffect(() => {
    // Spawn initial characters based on streak (Max 5)
    const count = Math.min(Math.max(1, Math.floor(streak / 5)), 5);
    const initialChars = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: 50 + i * 40,
      y: 80,
      dir: 1, // 1 = right, -1 = left
      type: i % 2 === 0 ? 'blue-cat' : 'red-kid' // Doraemon / Shinchan style placeholders
    }));
    setCharacters(initialChars);
  }, [streak]);

  // --- 2. GAME LOOP (Animation) ---
  useEffect(() => {
    const interval = setInterval(() => {
      setCharacters(prev => prev.map(char => {
        let newX = char.x + (char.dir * 2);
        let newDir = char.dir;
        
        // Bounce off walls
        if (newX > 300) newDir = -1;
        if (newX < 10) newDir = 1;
        
        // Randomly stop or change direction
        if (Math.random() > 0.95) newDir = Math.random() > 0.5 ? 1 : -1;

        return { ...char, x: newX, dir: newDir };
      }));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // --- 3. PLANTING MECHANIC ---
  const handlePlant = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Plant a tree/flower at click location
    setPlants(prev => [...prev, { id: Date.now(), x, y, type: Math.random() > 0.7 ? 'tree' : 'flower' }]);
  };

  return (
    <div 
      className="relative w-full h-32 bg-[#0d1b2a] rounded-xl overflow-hidden border border-slate-800 cursor-crosshair group"
      onClick={handlePlant}
    >
      {/* SKY & WEATHER */}
      <div className={`absolute inset-0 transition-colors duration-1000 ${gpa > 50 ? 'bg-gradient-to-b from-sky-900/30 to-transparent' : 'bg-slate-900'}`}></div>
      
      {/* SUN / MOON */}
      <div className={`absolute top-4 right-8 w-8 h-8 rounded-full blur-sm transition-all duration-1000 ${gpa > 50 ? 'bg-yellow-400 shadow-[0_0_20px_orange]' : 'bg-slate-400 shadow-[0_0_10px_white]'}`}></div>

      {/* RAIN (If GPA Low) */}
      {gpa < 40 && (
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10 animate-slide-down"></div>
      )}

      {/* GROUND */}
      <div className="absolute bottom-0 w-full h-8 bg-[#1a4d2e] border-t-4 border-[#2d6a4f]"></div>

      {/* PLANTS */}
      {plants.map(p => (
        <motion.div
          key={p.id}
          initial={{ scale: 0, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          className="absolute bottom-6 pointer-events-none"
          style={{ left: p.x - 10 }}
        >
          {p.type === 'tree' ? (
            <div className="text-xl">🌲</div>
          ) : (
            <div className="text-sm">🌻</div>
          )}
        </motion.div>
      ))}

      {/* CHARACTERS (PIXEL ART STYLE) */}
      {characters.map(char => (
        <motion.div
          key={char.id}
          animate={{ x: char.x }}
          transition={{ duration: 0.1, ease: "linear" }}
          className="absolute bottom-6 pointer-events-none flex flex-col items-center"
        >
           {/* Chat Bubble Randomly */}
           {Math.random() > 0.98 && (
             <motion.div 
               initial={{ opacity: 0, y: 5 }} 
               animate={{ opacity: 1, y: -10 }} 
               exit={{ opacity: 0 }}
               className="absolute -top-6 bg-white text-black text-[8px] px-1 rounded font-bold whitespace-nowrap"
             >
               {gpa > 80 ? "Ez!" : "Work!"}
             </motion.div>
           )}

           {/* AVATAR */}
           <div className={`w-6 h-6 ${char.type === 'blue-cat' ? 'bg-blue-500 rounded-full border-2 border-white' : 'bg-red-500 rounded-lg border-2 border-yellow-300'} relative shadow-lg`}>
              <div className={`absolute top-1 right-1 w-1 h-1 bg-black rounded-full ${char.dir === -1 ? 'left-1' : 'right-1'}`}></div>
           </div>
           {/* Shadow */}
           <div className="w-4 h-1 bg-black/50 rounded-full mt-1 blur-[1px]"></div>
        </motion.div>
      ))}

      {/* INSTRUCTION OVERLAY */}
      <div className="absolute top-2 left-2 text-[8px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
        CLICK TO PLANT • GPA CONTROLS WEATHER
      </div>
    </div>
  );
}
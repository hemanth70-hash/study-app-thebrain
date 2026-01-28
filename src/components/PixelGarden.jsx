import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =======================================================
// 1. AQUATIC CHARACTERS
// =======================================================
const FISH_TYPES = [
  { id: 'octo', sprite: '🐙', speed: 0.2, y: 40 },
  { id: 'crab', sprite: '🦀', speed: 0.15, y: 85 },
  { id: 'turtle', sprite: '🐢', speed: 0.1, y: 60 },
  { id: 'puffer', sprite: '🐡', speed: 0.3, y: 20 },
  { id: 'fish1', sprite: '🐠', speed: 0.4, y: 30 },
  { id: 'fish2', sprite: '🐟', speed: 0.25, y: 70 }
];

export default function PixelAquarium({ dailyScore }) {
  // State for fish, food, and bubbles
  const [swimmers, setSwimmers] = useState(FISH_TYPES.map(f => ({ 
    ...f, 
    x: Math.random() * 80 + 10, 
    vx: (Math.random() - 0.5) * f.speed, // Velocity X
    vy: 0, // Velocity Y
    scale: 1,
    reaction: null // Emoji reaction (❤️, 💨, etc)
  })));
  
  const [food, setFood] = useState([]);
  const [bubbles, setBubbles] = useState([]);

  // --- PHYSICS ENGINE ---
  useEffect(() => {
    const loop = setInterval(() => {
      // 1. Update Food (Sink down)
      setFood(prev => prev.map(f => ({ ...f, y: f.y + 0.5 })).filter(f => f.y < 95));

      // 2. Update Bubbles (Float up)
      setBubbles(prev => {
        const newBubbles = prev.map(b => ({ ...b, y: b.y - 0.5 })).filter(b => b.y > -10);
        if (Math.random() > 0.9) { // Random spawn
           newBubbles.push({ id: Date.now(), x: Math.random() * 95, y: 110, size: Math.random() * 8 + 4 });
        }
        return newBubbles;
      });

      // 3. Update Swimmers (The Brains)
      setSwimmers(prevSwimmers => {
        return prevSwimmers.map(fish => {
          let { x, y, vx, vy, speed, id } = fish;
          let newReaction = fish.reaction;

          // -- A. HUNGER LOGIC (Find nearest food) --
          const nearestFood = food.reduce((closest, f) => {
            const dist = Math.hypot(f.x - x, f.y - y);
            return (dist < 30 && (!closest || dist < closest.dist)) ? { ...f, dist } : closest;
          }, null);

          if (nearestFood) {
            // Swim towards food
            const dx = nearestFood.x - x;
            const dy = nearestFood.y - y;
            vx = (dx / nearestFood.dist) * (speed * 2); // Swim faster to food
            vy = (dy / nearestFood.dist) * (speed * 2);

            // Eat Food?
            if (nearestFood.dist < 5) {
              setFood(currentFood => currentFood.filter(f => f.id !== nearestFood.id));
              newReaction = '❤️'; // Yummy!
              setTimeout(() => setSwimmers(s => s.map(sf => sf.id === id ? { ...sf, reaction: null } : sf)), 1000);
            }
          } else {
            // -- B. IDLE SWIMMING --
            // Drift back to original Y level
            vy = (fish.y - y) * 0.05; 
            
            // Randomly change direction rarely
            if (Math.random() > 0.99) vx = -vx;
            
            // Wall bouncing
            if (x < 5) vx = Math.abs(vx) || speed;
            if (x > 90) vx = -Math.abs(vx) || -speed;
          }

          // Apply Movement
          x += vx;
          y += vy;

          return { ...fish, x, y, vx, vy, reaction: newReaction };
        });
      });

    }, 30); // 30ms tick for smooth animation
    return () => clearInterval(loop);
  }, [food]);

  // --- INTERACTION: POKE ---
  const handlePoke = (id) => {
    setSwimmers(prev => prev.map(s => {
      if (s.id !== id) return s;
      return { 
        ...s, 
        vx: s.vx * 5, // Speed burst!
        reaction: '💨', // Dash effect
        scale: 1.5 // Pop effect
      };
    }));

    // Reset scale after animation
    setTimeout(() => {
       setSwimmers(prev => prev.map(s => s.id === id ? { ...s, scale: 1, reaction: null } : s));
    }, 500);
  };

  // --- INTERACTION: FEED ---
  const handleWaterClick = (e) => {
    // Only drop food if not clicking a fish
    if (e.target.closest('.fish-sprite')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setFood(prev => [...prev, { id: Date.now(), x, y }]);
  };

  return (
    <div 
      className="relative w-full h-64 bg-blue-900 rounded-xl overflow-hidden border-4 border-slate-800 mt-6 select-none shadow-[0_0_30px_rgba(0,100,255,0.2)] font-sans cursor-crosshair active:cursor-grabbing"
      onClick={handleWaterClick}
    >
      
      {/* 1. BACKGROUND GRADIENTS */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/20 to-blue-950 z-0 pointer-events-none"></div>
      
      {/* 2. SAND BED */}
      <div className="absolute bottom-0 w-full h-12 bg-gradient-to-t from-[#e6d5ac] to-[#c2b280] border-t-4 border-[#a69260] z-10 flex items-center justify-around pointer-events-none">
         {[...Array(20)].map((_, i) => (<div key={i} className="w-1 h-1 bg-yellow-900/20 rounded-full" style={{ marginTop: Math.random() * 20 }}></div>))}
      </div>

      {/* 3. PLANTS */}
      <div className="absolute bottom-4 left-5 text-4xl opacity-80 animate-pulse z-10 origin-bottom swing pointer-events-none">🌿</div>
      <div className="absolute bottom-8 left-16 text-2xl opacity-60 z-10 pointer-events-none">🪸</div>
      <div className="absolute bottom-4 right-10 text-5xl opacity-80 animate-pulse z-10 origin-bottom swing pointer-events-none">🌿</div>
      <div className="absolute bottom-6 right-24 text-3xl opacity-70 z-10 pointer-events-none">🐚</div>

      {/* 4. FOOD PELLETS */}
      {food.map(f => (
        <div key={f.id} className="absolute w-2 h-2 bg-yellow-600 rounded-full border border-yellow-800 z-10 animate-spin" 
             style={{ left: `${f.x}%`, top: `${f.y}%` }} />
      ))}

      {/* 5. BUBBLES */}
      {bubbles.map(b => (
        <div key={b.id} className="absolute rounded-full border border-white/40 bg-white/10 backdrop-blur-sm z-0 pointer-events-none" 
             style={{ left: `${b.x}%`, top: `${b.y}%`, width: b.size, height: b.size }} />
      ))}

      {/* 6. INTERACTIVE FISH */}
      {swimmers.map(s => (
        <motion.div 
          key={s.id}
          animate={{ 
             left: `${s.x}%`, 
             top: `${s.y}%`,
             scale: s.scale,
             rotate: s.reaction === '💨' ? 360 : 0 
          }}
          transition={{ duration: 0.1, ease: 'linear', rotate: { duration: 0.5 } }}
          className="fish-sprite absolute z-20 flex flex-col items-center cursor-pointer hover:brightness-125 will-change-transform"
          onClick={(e) => { e.stopPropagation(); handlePoke(s.id); }}
        >
           {/* Reaction Emoji */}
           <AnimatePresence>
             {s.reaction && (
               <motion.div initial={{ y: 0, opacity: 1 }} animate={{ y: -20, opacity: 0 }} exit={{ opacity: 0 }} 
                           className="absolute -top-8 text-xl font-bold z-50 pointer-events-none">
                 {s.reaction}
               </motion.div>
             )}
           </AnimatePresence>

           {/* Sprite with Flip Logic (Face velocity direction) */}
           <div className={`text-5xl filter drop-shadow-xl transition-transform duration-300 ${s.vx > 0 ? 'scale-x-[-1]' : ''}`}>
             {s.sprite}
           </div>
        </motion.div>
      ))}

      {/* 7. OVERLAY TEXT (Instruction) */}
      <div className="absolute top-2 left-0 w-full text-center text-white/30 text-[10px] uppercase tracking-widest pointer-events-none font-bold">
         Tap to Feed • Tap Fish to Poke
      </div>

    </div>
  );
}
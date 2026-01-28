import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Anchor, FishSymbol, Skull } from 'lucide-react';

// =======================================================
// 1. THE CREATURE CATALOG (No bending shapes)
// =======================================================
const PREY = [
  { sprite: '🐟', name: 'Guppy', size: 30 },
  { sprite: '🐠', name: 'Tropical', size: 35 },
  { sprite: '🦐', name: 'Shrimp', size: 20 },
  { sprite: '🐚', name: 'Shell', size: 25 },
  { sprite: '🦪', name: 'Oyster', size: 25 },
  { sprite: '🦀', name: 'Crab', size: 35 },
  { sprite: '🦞', name: 'Lobster', size: 40 },
];

const PREDATORS = [
  { sprite: '🐙', name: 'Octopus', size: 60 },
  { sprite: '🦑', name: 'Squid', size: 55 },
  { sprite: '🐡', name: 'Puffer', size: 45 }, // Puffer is aggro
  { sprite: '🐢', name: 'Turtle', size: 50 },
  { sprite: '🐋', name: 'Whale', size: 80 },
  { sprite: '🐳', name: 'Blue Whale', size: 85 },
  { sprite: '🦭', name: 'Seal', size: 65 },
  { sprite: '🦦', name: 'Otter', size: 50 },
  { sprite: '🪼', name: 'Jelly', size: 45 },
];

export default function PixelAquarium({ dailyScore }) {
  const [swimmers, setSwimmers] = useState([]);
  const [food, setFood] = useState([]);
  const [bubbles, setBubbles] = useState([]);
  const [mode, setMode] = useState('feed'); // 'feed' | 'kill'
  
  // Initial Population
  useEffect(() => {
    spawnCreature('predator');
    spawnCreature('predator');
    spawnCreature('prey');
    spawnCreature('prey');
    spawnCreature('prey');
  }, []);

  // --- SPAWNER ---
  const spawnCreature = (forceType = null) => {
    const isPredator = forceType ? forceType === 'predator' : Math.random() > 0.7;
    const pool = isPredator ? PREDATORS : PREY;
    const template = pool[Math.floor(Math.random() * pool.length)];
    
    const newFish = {
      id: Date.now() + Math.random(),
      ...template,
      x: Math.random() * 80 + 10,
      y: -10, // Drop from top
      vx: (Math.random() - 0.5) * 0.5,
      vy: 1, // Falling speed
      type: isPredator ? 'predator' : 'prey',
      reaction: '✨' // Spawn sparkle
    };
    
    setSwimmers(prev => [...prev, newFish]);
    setTimeout(() => clearReaction(newFish.id), 1000);
  };

  const clearReaction = (id) => {
    setSwimmers(prev => prev.map(s => s.id === id ? { ...s, reaction: null } : s));
  };

  // --- PHYSICS ENGINE ---
  useEffect(() => {
    const loop = setInterval(() => {
      // 1. Food Gravity
      setFood(prev => prev.map(f => ({ ...f, y: f.y + 0.5 })).filter(f => f.y < 95));

      // 2. Bubble Physics
      setBubbles(prev => {
        const newBubbles = prev.map(b => ({ ...b, y: b.y - 0.5 })).filter(b => b.y > -10);
        if (Math.random() > 0.9) newBubbles.push({ id: Date.now(), x: Math.random() * 95, y: 110, size: Math.random() * 8 + 4 });
        return newBubbles;
      });

      // 3. Creature Logic
      setSwimmers(prevSwimmers => {
        // We need a fresh copy to handle eating logic
        let nextSwimmers = [...prevSwimmers];
        const eatenIds = new Set();

        nextSwimmers = nextSwimmers.map(fish => {
          if (eatenIds.has(fish.id)) return fish; // Skip if already dead

          let { x, y, vx, vy, type, id, size } = fish;
          let reaction = fish.reaction;

          // --- A. PREDATION LOGIC ---
          // If I am a Predator, look for Prey
          if (type === 'predator') {
            const nearbyPrey = nextSwimmers.find(other => 
              other.type === 'prey' && 
              !eatenIds.has(other.id) &&
              Math.hypot(other.x - x, other.y - y) < 8 // Hitbox range
            );

            if (nearbyPrey) {
              eatenIds.add(nearbyPrey.id); // Mark prey as eaten
              reaction = '😋'; // Yummy
              setTimeout(() => clearReaction(id), 1000);
            }
          }

          // --- B. MOVEMENT LOGIC ---
          // Move towards food if it exists
          const nearestFood = food.reduce((closest, f) => {
            const dist = Math.hypot(f.x - x, f.y - y);
            return (dist < 30 && (!closest || dist < closest.dist)) ? { ...f, dist } : closest;
          }, null);

          if (nearestFood) {
            vx += (nearestFood.x - x) * 0.005;
            vy += (nearestFood.y - y) * 0.005;
            // Eat Food
            if (nearestFood.dist < 5) {
              setFood(current => current.filter(f => f.id !== nearestFood.id));
              reaction = '❤️';
              setTimeout(() => clearReaction(id), 1000);
            }
          } else {
            // Natural drifting
            if (y < 10) vy += 0.05; // Stay in water
            if (y > 90) vy -= 0.05; // Stay off bottom
            
            // Random direction change
            if (Math.random() > 0.98) vx += (Math.random() - 0.5) * 0.5;
            if (Math.random() > 0.98) vy += (Math.random() - 0.5) * 0.2;
            
            // Friction
            vx *= 0.99;
            vy *= 0.99;

            // Wall bounce
            if (x < 2 || x > 95) vx = -vx;
          }

          x += vx;
          y += vy;

          return { ...fish, x, y, vx, vy, reaction };
        });

        // Filter out eaten prey
        return nextSwimmers.filter(s => !eatenIds.has(s.id));
      });

    }, 30);
    return () => clearInterval(loop);
  }, [food]);

  // --- INTERACTIONS ---
  const handleInteraction = (e, fishId) => {
    e.stopPropagation();
    
    if (mode === 'kill') {
      // KILL MODE
      setSwimmers(prev => prev.filter(s => s.id !== fishId));
      // Optional: Add a ghost effect or sound here
    } else {
      // POKE MODE
      setSwimmers(prev => prev.map(s => {
        if (s.id !== fishId) return s;
        return { 
          ...s, 
          vx: (Math.random() - 0.5) * 4, // Panic speed
          vy: (Math.random() - 0.5) * 4,
          reaction: '💨' 
        };
      }));
      setTimeout(() => clearReaction(fishId), 1000);
    }
  };

  const handleWaterTap = (e) => {
    if (e.target.closest('.fish-sprite') || e.target.closest('.ui-btn')) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setFood(prev => [...prev, { id: Date.now(), x, y }]);
  };

  return (
    <div className="relative w-full h-80 bg-blue-900 rounded-xl overflow-hidden border-4 border-slate-800 mt-6 select-none shadow-[0_0_30px_rgba(0,100,255,0.2)] font-sans isolate group">
      
      {/* 1. LAYER: WATER & POND */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/20 to-blue-950 z-0 pointer-events-none"></div>
      {/* The Deep Pond */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-blue-950/80 rounded-t-full blur-xl z-0"></div>

      {/* 2. LAYER: SAND BED */}
      <div className="absolute bottom-0 w-full h-12 bg-gradient-to-t from-[#e6d5ac] to-[#c2b280] border-t-4 border-[#a69260] z-10 flex items-center justify-around pointer-events-none">
         {[...Array(20)].map((_, i) => (<div key={i} className="w-1 h-1 bg-yellow-900/20 rounded-full" style={{ marginTop: Math.random() * 20 }}></div>))}
      </div>

      {/* 3. LAYER: PLANTS & ROCKS */}
      <div className="absolute bottom-4 left-2 text-4xl opacity-80 animate-pulse z-10 origin-bottom swing pointer-events-none">🌿</div>
      <div className="absolute bottom-3 left-12 text-3xl opacity-90 z-10 pointer-events-none">🪸</div>
      <div className="absolute bottom-6 left-24 text-2xl opacity-70 z-10 pointer-events-none">🐚</div>
      <div className="absolute bottom-4 right-5 text-5xl opacity-80 animate-pulse z-10 origin-bottom swing pointer-events-none">🌿</div>
      <div className="absolute bottom-2 right-20 text-4xl opacity-80 z-10 pointer-events-none">🪸</div>
      <div className="absolute bottom-8 right-32 text-2xl opacity-60 z-10 pointer-events-none">🪼</div>

      {/* 4. FOOD */}
      {food.map(f => (
        <div key={f.id} className="absolute w-2 h-2 bg-yellow-600 rounded-full border border-yellow-800 z-10 animate-spin" style={{ left: `${f.x}%`, top: `${f.y}%` }} />
      ))}

      {/* 5. BUBBLES */}
      {bubbles.map(b => (
        <div key={b.id} className="absolute rounded-full border border-white/40 bg-white/10 backdrop-blur-sm z-0 pointer-events-none" style={{ left: `${b.x}%`, top: `${b.y}%`, width: b.size, height: b.size }} />
      ))}

      {/* 6. CREATURES */}
      <div className="absolute inset-0 z-20" onClick={handleWaterTap}>
        {swimmers.map(s => (
          <motion.div 
            key={s.id}
            animate={{ 
               left: `${s.x}%`, 
               top: `${s.y}%`,
               scale: s.type === 'predator' ? 1.5 : 1 // Predators are bigger
            }}
            transition={{ duration: 0.05, ease: 'linear' }}
            className="fish-sprite absolute flex flex-col items-center cursor-pointer hover:scale-110 active:scale-95 transition-transform"
            onClick={(e) => handleInteraction(e, s.id)}
          >
             {/* Reaction Bubble */}
             <AnimatePresence>
               {s.reaction && (
                 <motion.div initial={{ y: 0, opacity: 1 }} animate={{ y: -20, opacity: 0 }} exit={{ opacity: 0 }} 
                             className="absolute -top-8 text-xl z-50 pointer-events-none drop-shadow-md">
                   {s.reaction}
                 </motion.div>
               )}
             </AnimatePresence>
  
             {/* Sprite */}
             <div className={`filter drop-shadow-xl transition-transform duration-300 ${s.vx > 0 ? 'scale-x-[-1]' : ''}`}
                  style={{ fontSize: `${s.size}px` }}>
               {s.sprite}
             </div>
          </motion.div>
        ))}
      </div>

      {/* 7. GOD MODE UI TOOLBAR */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
         {/* Fish Spawner */}
         <button onClick={() => spawnCreature()} className="ui-btn w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-cyan-500 hover:scale-110 transition-all border-2 border-cyan-300" title="Cast Line">
            <Anchor size={20} />
         </button>

         {/* Kill Mode Toggle */}
         <button onClick={() => setMode(m => m === 'kill' ? 'feed' : 'kill')} 
                 className={`ui-btn w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-all border-2 ${mode === 'kill' ? 'bg-red-600 border-red-300 animate-pulse' : 'bg-slate-700 border-slate-500'}`} 
                 title="Kill Mode">
            <Skull size={20} />
         </button>

         {/* Count Badge */}
         <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white text-[10px] font-bold border border-white/20 backdrop-blur-sm">
            {swimmers.length}
         </div>
      </div>
      
      {/* Mode Indicator */}
      {mode === 'kill' && (
         <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-red-600/90 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest pointer-events-none animate-bounce z-50 border border-red-400">
            ☠️ Kill Mode Active ☠️
         </div>
      )}

    </div>
  );
}
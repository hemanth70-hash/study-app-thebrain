import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Anchor, Skull } from 'lucide-react';

// --- CONFIGURATION ---
const PREY = [
  { sprite: '🐟', size: 30 }, { sprite: '🐠', size: 35 },
  { sprite: '🦐', size: 20 }, { sprite: '🦀', size: 30 },
  { sprite: '🦞', size: 35 }, { sprite: '🐚', size: 25 }
];
const PREDATORS = [
  { sprite: '🐙', size: 60 }, { sprite: '🦑', size: 55 },
  { sprite: '🐋', size: 80 }, { sprite: '🦈', size: 70 },
  { sprite: '🐡', size: 45 }, { sprite: '🐢', size: 50 }
];

export default function PixelAquarium({ dailyScore }) {
  // THE "WORLD" STATE (Everything lives here)
  const [world, setWorld] = useState({
    fish: [],
    food: [],
    bubbles: [],
    mode: 'feed' // 'feed' or 'kill'
  });

  // --- INITIAL SPAWN ---
  useEffect(() => {
    const initialFish = [];
    for (let i = 0; i < 5; i++) initialFish.push(createFish('prey'));
    for (let i = 0; i < 2; i++) initialFish.push(createFish('predator'));
    
    setWorld(prev => ({ ...prev, fish: initialFish }));
  }, []);

  // --- HELPER: CREATE FISH ---
  const createFish = (type) => {
    const isPredator = type === 'predator';
    const pool = isPredator ? PREDATORS : PREY;
    const template = pool[Math.floor(Math.random() * pool.length)];
    return {
      id: Math.random(),
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.2,
      type: isPredator ? 'predator' : 'prey',
      ...template,
      reaction: null
    };
  };

  // --- THE GAME LOOP (The Heartbeat) ---
  useEffect(() => {
    const loop = setInterval(() => {
      setWorld(prev => {
        let { fish, food, bubbles, mode } = prev;
        
        // 1. UPDATE BUBBLES
        let newBubbles = bubbles.map(b => ({ ...b, y: b.y - 0.5 })).filter(b => b.y > -10);
        if (Math.random() > 0.9) newBubbles.push({ id: Math.random(), x: Math.random() * 100, y: 110, size: Math.random() * 10 + 5 });

        // 2. UPDATE FOOD
        let newFood = food.map(f => ({ ...f, y: f.y + 0.5 })).filter(f => f.y < 100);

        // 3. UPDATE FISH (Movement & Logic)
        let eatenFoodIds = new Set();
        let deadFishIds = new Set();

        let newFish = fish.map(f => {
          let { x, y, vx, vy, type, id } = f;

          // -- PREDATION (Eating Logic) --
          if (type === 'predator') {
            const victim = fish.find(other => 
              other.type === 'prey' && 
              !deadFishIds.has(other.id) &&
              Math.abs(other.x - x) < 5 && Math.abs(other.y - y) < 5
            );
            if (victim) {
              deadFishIds.add(victim.id);
              f.reaction = '😋'; // Yummy
            }
          }

          // -- FOOD SEEKING --
          const targetFood = newFood.find(pellet => 
            !eatenFoodIds.has(pellet.id) && Math.abs(pellet.x - x) < 20 && Math.abs(pellet.y - y) < 20
          );

          if (targetFood) {
            vx += (targetFood.x - x) * 0.01;
            vy += (targetFood.y - y) * 0.01;
            if (Math.abs(targetFood.x - x) < 2 && Math.abs(targetFood.y - y) < 2) {
              eatenFoodIds.add(targetFood.id);
              f.reaction = '❤️';
            }
          } else {
            // Natural Idle Movement
            if (Math.random() > 0.98) vx += (Math.random() - 0.5) * 0.2;
            if (Math.random() > 0.98) vy += (Math.random() - 0.5) * 0.2;
          }

          // Physics Boundaries
          if (x < 2 || x > 95) vx = -vx;
          if (y < 2 || y > 90) vy = -vy;
          
          // Apply Speed Limit
          vx = Math.max(-1, Math.min(1, vx));
          vy = Math.max(-0.5, Math.min(0.5, vy));

          return { ...f, x: x + vx, y: y + vy, vx, vy };
        });

        // 4. CLEANUP (Remove dead/eaten items)
        newFish = newFish.filter(f => !deadFishIds.has(f.id));
        newFood = newFood.filter(f => !eatenFoodIds.has(f.id));

        return { ...prev, fish: newFish, food: newFood, bubbles: newBubbles };
      });
    }, 50); // 50ms Tick

    return () => clearInterval(loop);
  }, []);

  // --- INTERACTIONS ---
  const handleTap = (e) => {
    // Prevent interaction if clicking buttons
    if (e.target.closest('button')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Check if clicked a fish
    const clickedFish = world.fish.find(f => Math.abs(f.x - x) < 5 && Math.abs(f.y - y) < 5);

    if (clickedFish) {
      if (world.mode === 'kill') {
        // KILL FISH
        setWorld(prev => ({ ...prev, fish: prev.fish.filter(f => f.id !== clickedFish.id) }));
      } else {
        // POKE FISH
        setWorld(prev => ({
          ...prev,
          fish: prev.fish.map(f => f.id === clickedFish.id ? { ...f, vx: f.vx * 5, reaction: '💨' } : f)
        }));
        setTimeout(() => clearReaction(clickedFish.id), 1000);
      }
    } else {
      // DROP FOOD
      setWorld(prev => ({ ...prev, food: [...prev.food, { id: Math.random(), x, y }] }));
    }
  };

  const spawnNew = () => {
    setWorld(prev => ({ 
      ...prev, 
      fish: [...prev.fish, { ...createFish(Math.random() > 0.7 ? 'predator' : 'prey'), y: 0, vy: 1 }] 
    }));
  };

  const clearReaction = (id) => {
    setWorld(prev => ({
      ...prev,
      fish: prev.fish.map(f => f.id === id ? { ...f, reaction: null } : f)
    }));
  };

  return (
    <div 
      className="relative w-full h-80 bg-blue-900 rounded-xl overflow-hidden border-4 border-slate-800 mt-6 select-none shadow-[0_0_30px_rgba(0,100,255,0.2)] font-sans isolate group cursor-crosshair"
      onClick={handleTap}
    >
      
      {/* 1. LAYERS: Background, Sand, Decor */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/20 to-blue-950 z-0 pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-blue-950/80 rounded-t-full blur-xl z-0 pointer-events-none"></div>
      <div className="absolute bottom-0 w-full h-12 bg-gradient-to-t from-[#e6d5ac] to-[#c2b280] border-t-4 border-[#a69260] z-10 flex items-center justify-around pointer-events-none">
         {[...Array(20)].map((_, i) => (<div key={i} className="w-1 h-1 bg-yellow-900/20 rounded-full" style={{ marginTop: Math.random() * 20 }}></div>))}
      </div>
      <div className="absolute bottom-4 left-5 text-4xl opacity-80 animate-pulse z-10 pointer-events-none">🌿</div>
      <div className="absolute bottom-4 right-10 text-5xl opacity-80 animate-pulse z-10 pointer-events-none">🪸</div>

      {/* 2. DYNAMIC ITEMS */}
      {world.bubbles.map(b => (
        <div key={b.id} className="absolute rounded-full border border-white/40 bg-white/10 backdrop-blur-sm z-0 pointer-events-none" style={{ left: `${b.x}%`, top: `${b.y}%`, width: b.size, height: b.size }} />
      ))}
      {world.food.map(f => (
        <div key={f.id} className="absolute w-2 h-2 bg-yellow-600 rounded-full border border-yellow-800 z-10 animate-spin pointer-events-none" style={{ left: `${f.x}%`, top: `${f.y}%` }} />
      ))}

      {/* 3. FISH RENDERER */}
      {world.fish.map(s => (
        <motion.div 
          key={s.id}
          animate={{ left: `${s.x}%`, top: `${s.y}%`, scale: s.type === 'predator' ? 1.3 : 0.9 }}
          transition={{ duration: 0.05, ease: 'linear' }}
          className="absolute z-20 flex flex-col items-center pointer-events-none" // Events handled by parent
        >
           <AnimatePresence>
             {s.reaction && <motion.div initial={{ y: 0, opacity: 1 }} animate={{ y: -20, opacity: 0 }} exit={{ opacity: 0 }} className="absolute -top-8 text-xl z-50 drop-shadow-md">{s.reaction}</motion.div>}
           </AnimatePresence>
           <div className={`filter drop-shadow-xl transition-transform ${s.vx > 0 ? 'scale-x-[-1]' : ''}`} style={{ fontSize: `${s.size}px` }}>{s.sprite}</div>
        </motion.div>
      ))}

      {/* 4. UI CONTROLS */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
         {/* Anchor: Add Fish */}
         <button onClick={(e) => { e.stopPropagation(); spawnNew(); }} className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-all border-2 border-cyan-300">
            <Anchor size={20} />
         </button>
         {/* Skull: Toggle Kill Mode */}
         <button onClick={(e) => { e.stopPropagation(); setWorld(p => ({ ...p, mode: p.mode === 'kill' ? 'feed' : 'kill' })); }} 
                 className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-all border-2 ${world.mode === 'kill' ? 'bg-red-600 border-red-300 animate-pulse' : 'bg-slate-700 border-slate-500'}`}>
            <Skull size={20} />
         </button>
      </div>

      {/* Mode Status */}
      {world.mode === 'kill' && (
         <div className="absolute top-4 left-4 z-40 bg-red-600/90 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest pointer-events-none animate-bounce border border-red-400">
            ☠️ Kill Mode Active
         </div>
      )}

    </div>
  );
}
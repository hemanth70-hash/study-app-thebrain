import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Anchor, Skull } from 'lucide-react';

// =======================================================
// 1. THE COMPLETE CREATURE CATALOG
// =======================================================
const PREY = [
  { sprite: '🐟', size: 30 }, { sprite: '🐠', size: 35 },
  { sprite: '🦐', size: 20 }, { sprite: '🦀', size: 30 },
  { sprite: '🦞', size: 35 }, { sprite: '🐚', size: 25 },
  { sprite: '🦪', size: 25 }, { sprite: '🐌', size: 20 }
];

const PREDATORS = [
  { sprite: '🐙', size: 60 }, { sprite: '🦑', size: 55 },
  { sprite: '🐋', size: 80 }, { sprite: '🐳', size: 85 },
  { sprite: '🦈', size: 75 }, { sprite: '🐡', size: 45 }, 
  { sprite: '🐢', size: 50 }, { sprite: '🦭', size: 65 },
  { sprite: '🦦', size: 50 }, { sprite: '🪼', size: 45 }
];

export default function PixelAquarium({ dailyScore }) {
  // UNIFIED WORLD STATE (Prevents glitches)
  const [world, setWorld] = useState({
    fish: [],
    food: [],
    bubbles: [],
    mode: 'feed'
  });

  // --- INITIAL SPAWN ---
  useEffect(() => {
    const initialFish = [];
    for (let i = 0; i < 6; i++) initialFish.push(createFish('prey'));
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
      y: Math.random() * 60 + 10,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.2,
      type: isPredator ? 'predator' : 'prey',
      ...template,
      reaction: null
    };
  };

  // --- THE PHYSICS LOOP ---
  useEffect(() => {
    const loop = setInterval(() => {
      setWorld(prev => {
        let { fish, food, bubbles } = prev;
        
        // 1. BUBBLES (Float Up)
        let newBubbles = bubbles.map(b => ({ ...b, y: b.y - 1 })).filter(b => b.y > -10);
        if (Math.random() > 0.92) newBubbles.push({ id: Math.random(), x: Math.random() * 100, y: 110, size: Math.random() * 8 + 4 });

        // 2. FOOD (Sink Down)
        let newFood = food.map(f => ({ ...f, y: f.y + 0.8 })).filter(f => f.y < 100);

        // 3. FISH LOGIC
        let eatenFoodIds = new Set();
        let deadFishIds = new Set();

        let newFish = fish.map(f => {
          let { x, y, vx, vy, type, id } = f;

          // -- BOUNDARY WALLS (Stay on screen) --
          if (x <= 2) { x = 2; vx = Math.abs(vx); }        // Hit Left Wall -> Go Right
          if (x >= 96) { x = 96; vx = -Math.abs(vx); }     // Hit Right Wall -> Go Left
          if (y <= 2) { y = 2; vy = Math.abs(vy); }        // Hit Ceiling -> Go Down
          if (y >= 85) { y = 85; vy = -Math.abs(vy); }     // Hit Floor -> Go Up

          // -- PREDATION --
          if (type === 'predator') {
            const victim = fish.find(other => 
              other.type === 'prey' && 
              !deadFishIds.has(other.id) &&
              Math.abs(other.x - x) < 6 && Math.abs(other.y - y) < 6
            );
            if (victim) {
              deadFishIds.add(victim.id);
              f.reaction = '😋'; 
            }
          }

          // -- EATING FOOD --
          const targetFood = newFood.find(p => !eatenFoodIds.has(p.id) && Math.abs(p.x - x) < 15 && Math.abs(p.y - y) < 15);
          if (targetFood) {
            // Swim to food
            vx += (targetFood.x - x) * 0.02;
            vy += (targetFood.y - y) * 0.02;
            
            // Chomp
            if (Math.abs(targetFood.x - x) < 3 && Math.abs(targetFood.y - y) < 3) {
              eatenFoodIds.add(targetFood.id);
              f.reaction = '❤️';
            }
          } else {
            // Idle Wander
            if (Math.random() > 0.95) vx += (Math.random() - 0.5) * 0.2;
            if (Math.random() > 0.95) vy += (Math.random() - 0.5) * 0.2;
            
            // Speed Limits
            vx = Math.max(-1.2, Math.min(1.2, vx));
            vy = Math.max(-0.6, Math.min(0.6, vy));
          }

          return { ...f, x: x + vx, y: y + vy, vx, vy };
        });

        // 4. CLEANUP
        newFish = newFish.filter(f => !deadFishIds.has(f.id));
        newFood = newFood.filter(f => !eatenFoodIds.has(f.id));

        return { ...prev, fish: newFish, food: newFood, bubbles: newBubbles };
      });
    }, 40);

    return () => clearInterval(loop);
  }, []);

  // --- INTERACTIONS ---
  const handleTap = (e) => {
    if (e.target.closest('button')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Check click on fish
    const clickedFish = world.fish.find(f => Math.abs(f.x - x) < 6 && Math.abs(f.y - y) < 6);

    if (clickedFish) {
      if (world.mode === 'kill') {
        setWorld(prev => ({ ...prev, fish: prev.fish.filter(f => f.id !== clickedFish.id) }));
      } else {
        setWorld(prev => ({
          ...prev,
          fish: prev.fish.map(f => f.id === clickedFish.id ? { ...f, vx: f.vx * 6, reaction: '💨' } : f)
        }));
        setTimeout(() => clearReaction(clickedFish.id), 1000);
      }
    } else {
      // Drop Food
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
    // REDUCED HEIGHT: h-64 (was h-80)
    <div 
      className="relative w-full h-64 bg-blue-900 rounded-xl overflow-hidden border-4 border-slate-800 mt-6 select-none shadow-[0_0_30px_rgba(0,100,255,0.2)] font-sans isolate group cursor-crosshair"
      onClick={handleTap}
    >
      
      {/* 1. LAYERS: Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/20 to-blue-950 z-0 pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-blue-950/80 rounded-t-full blur-xl z-0 pointer-events-none"></div>

      {/* 2. SAND & DECOR */}
      <div className="absolute bottom-0 w-full h-10 bg-gradient-to-t from-[#e6d5ac] to-[#c2b280] border-t-4 border-[#a69260] z-10 flex items-center justify-around pointer-events-none">
         {[...Array(20)].map((_, i) => (<div key={i} className="w-1 h-1 bg-yellow-900/20 rounded-full" style={{ marginTop: Math.random() * 20 }}></div>))}
      </div>
      <div className="absolute bottom-4 left-5 text-4xl opacity-80 animate-pulse z-10 pointer-events-none">🌿</div>
      <div className="absolute bottom-4 right-10 text-5xl opacity-80 animate-pulse z-10 pointer-events-none">🪸</div>

      {/* 3. DYNAMIC ITEMS */}
      {world.bubbles.map(b => (
        <div key={b.id} className="absolute rounded-full border border-white/40 bg-white/10 backdrop-blur-sm z-0 pointer-events-none" style={{ left: `${b.x}%`, top: `${b.y}%`, width: b.size, height: b.size }} />
      ))}
      {world.food.map(f => (
        <div key={f.id} className="absolute w-2 h-2 bg-yellow-600 rounded-full border border-yellow-800 z-10 animate-spin pointer-events-none" style={{ left: `${f.x}%`, top: `${f.y}%` }} />
      ))}

      {/* 4. FISH RENDERER */}
      {world.fish.map(s => (
        <motion.div 
          key={s.id}
          animate={{ left: `${s.x}%`, top: `${s.y}%`, scale: s.type === 'predator' ? 1.3 : 0.9 }}
          transition={{ duration: 0.05, ease: 'linear' }}
          className="absolute z-20 flex flex-col items-center pointer-events-none"
        >
           <AnimatePresence>
             {s.reaction && <motion.div initial={{ y: 0, opacity: 1 }} animate={{ y: -20, opacity: 0 }} exit={{ opacity: 0 }} className="absolute -top-8 text-xl z-50 drop-shadow-md">{s.reaction}</motion.div>}
           </AnimatePresence>
           {/* Flip logic: scale-x-[-1] if velocity X is positive */}
           <div className={`filter drop-shadow-xl transition-transform ${s.vx > 0 ? 'scale-x-[-1]' : ''}`} style={{ fontSize: `${s.size}px` }}>{s.sprite}</div>
        </motion.div>
      ))}

      {/* 5. UI */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
         <button onClick={(e) => { e.stopPropagation(); spawnNew(); }} className="w-9 h-9 bg-cyan-600 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-all border-2 border-cyan-300">
            <Anchor size={18} />
         </button>
         <button onClick={(e) => { e.stopPropagation(); setWorld(p => ({ ...p, mode: p.mode === 'kill' ? 'feed' : 'kill' })); }} 
                 className={`w-9 h-9 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-all border-2 ${world.mode === 'kill' ? 'bg-red-600 border-red-300 animate-pulse' : 'bg-slate-700 border-slate-500'}`}>
            <Skull size={18} />
         </button>
      </div>

      {world.mode === 'kill' && (
         <div className="absolute top-4 left-4 z-40 bg-red-600/90 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest pointer-events-none animate-bounce border border-red-400">
            ☠️ KILL MODE
         </div>
      )}
      
      {/* Tutorial Text */}
      <div className="absolute bottom-2 left-0 w-full text-center text-white/20 text-[9px] uppercase tracking-widest pointer-events-none font-bold">
        {world.mode === 'kill' ? 'Tap fish to delete' : 'Tap to feed • Tap fish to poke'}
      </div>

    </div>
  );
}
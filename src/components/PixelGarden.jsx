import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SpriteAnimator from "./SpriteAnimator";

/* =====================================================
   CHARACTERS (LOGIC ONLY)
===================================================== */

const CHARACTERS = [
  {
    id: "shinchan",
    name: "Shinchan",
    // Local Brain Logic replacing API
    brain: (score) => score < 40 ? "Mom is angry! Hide the test paper!" : "Oho! Chocobi time!",
    x: 20,
    dir: 1,
  },
  {
    id: "doraemon",
    name: "Doraemon",
    brain: (score) => score < 40 ? "Nobita! Use the Memorization Bread!" : "Good job! Dorayaki for you!",
    x: 50,
    dir: 1,
  },
  {
    id: "ben10",
    name: "Ben 10",
    brain: (score) => score < 40 ? "The Omnitrix needs a recharge. Rest now." : "It's Hero Time!",
    x: 80,
    dir: -1,
  },
];

/* =====================================================
   SPRITE MAP (Matches your folder structure)
===================================================== */

const SPRITES = {
  shinchan: {
    idle: { src: "/pixel/shinchan/idle.png", frameCount: 4, fps: 4 },
    walk: { src: "/pixel/shinchan/walk.png", frameCount: 6, fps: 10 },
    talk: { src: "/pixel/shinchan/talk.png", frameCount: 4, fps: 8 },
  },
  doraemon: {
    idle: { src: "/pixel/doraemon/idle.png", frameCount: 4, fps: 4 },
    walk: { src: "/pixel/doraemon/walk.png", frameCount: 6, fps: 8 },
    talk: { src: "/pixel/doraemon/talk.png", frameCount: 4, fps: 6 },
  },
  ben10: {
    idle: { src: "/pixel/ben10/idle.png", frameCount: 4, fps: 4 },
    walk: { src: "/pixel/ben10/walk.png", frameCount: 6, fps: 10 },
    talk: { src: "/pixel/ben10/talk.png", frameCount: 4, fps: 6 },
  },
};

/* =====================================================
   COMPONENT
===================================================== */

export default function PixelGarden({ dailyScore, gpa, streak }) {
  const [chars, setChars] = useState(
    CHARACTERS.map((c) => ({
      ...c,
      action: "idle",
      locked: false,
    }))
  );

  const [bubbles, setBubbles] = useState({});
  const directorBusy = useRef(false);

  /* =====================================================
     AMBIENT MOVEMENT (Physics Loop)
  ===================================================== */

  useEffect(() => {
    const loop = setInterval(() => {
      setChars((prev) =>
        prev.map((c) => {
          if (c.locked) return c; // Don't move if talking

          const move = Math.random() > 0.6; // 40% chance to move
          const dir = Math.random() > 0.5 ? 1 : -1;

          let newX = c.x;
          let newAction = "idle";

          if (move) {
             newX += dir * 2;
             // Wall bouncing
             if (newX > 85) newX = 85; 
             if (newX < 5) newX = 5;
             newAction = "walk";
          }

          return {
            ...c,
            // Only update direction if actually moving
            dir: move ? dir : c.dir,
            action: newAction,
            x: newX,
          };
        })
      );
    }, 500); // Slower updates for chill vibe

    return () => clearInterval(loop);
  }, []);

  /* =====================================================
     DIRECTOR AI (Local Logic - No Backend)
  ===================================================== */

  useEffect(() => {
    const loop = setInterval(() => {
      if (directorBusy.current) return;
      directorBusy.current = true;

      // 1. Pick a random speaker
      const speakerIdx = Math.floor(Math.random() * chars.length);
      const speakerId = chars[speakerIdx].id;
      
      // 2. Generate Dialogue (Local Brain)
      // Uses dailyScore if available, otherwise GPA as fallback
      const scoreToCheck = dailyScore !== null ? dailyScore : gpa;
      const dialogue = CHARACTERS.find(c => c.id === speakerId).brain(scoreToCheck);

      // 3. Update State (Lock & Talk)
      setBubbles({ [speakerId]: dialogue });
      setChars(prev => prev.map(c => 
        c.id === speakerId ? { ...c, action: "talk", locked: true } : c
      ));

      // 4. Reset after 4 seconds
      setTimeout(() => {
        setBubbles({});
        setChars(prev => prev.map(c => 
          c.id === speakerId ? { ...c, action: "idle", locked: false } : c
        ));
        directorBusy.current = false;
      }, 4000);

    }, 8000); // Someone talks every 8 seconds

    return () => clearInterval(loop);
  }, [chars, gpa, dailyScore]);

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="relative w-full h-[180px] overflow-hidden rounded-xl border border-slate-700 bg-[#0a0a0f] mt-6 select-none group">
      
      {/* SKY LAYER */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-900/40 to-transparent" />
      
      {/* GROUND LAYER */}
      <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-green-900/80 to-green-800/40 border-t border-green-700/50" />

      {/* CHARACTERS LAYER */}
      {chars.map((c) => {
        // Fallback to 'idle' if action sprite missing
        const spriteKey = SPRITES[c.id][c.action] ? c.action : 'idle';
        const spriteData = SPRITES[c.id][spriteKey];

        return (
          <motion.div
            key={c.id}
            animate={{ left: `${c.x}%` }}
            transition={{ duration: 0.5, ease: "linear" }}
            className="absolute bottom-6 z-10 flex flex-col items-center"
          >
            {/* SPEECH BUBBLE */}
            <AnimatePresence>
              {bubbles[c.id] && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute -top-20 w-32 bg-white text-black text-[10px] font-bold px-3 py-2 rounded-xl border-2 border-black text-center shadow-lg z-50"
                >
                  {bubbles[c.id]}
                  {/* Bubble Tail */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white"></div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* SPRITE COMPONENT */}
            <div className={`transition-transform ${c.dir === -1 ? "scale-x-[-1]" : ""}`}>
               <SpriteAnimator
                 src={spriteData.src}
                 frameWidth={64}   // Ensure your PNGs match this size!
                 frameHeight={64}
                 frameCount={spriteData.frameCount}
                 fps={spriteData.fps}
               />
            </div>
            
            {/* Shadow */}
            <div className="w-10 h-2 bg-black/40 rounded-full blur-sm mt-[-5px]"></div>
          </motion.div>
        );
      })}
    </div>
  );
}
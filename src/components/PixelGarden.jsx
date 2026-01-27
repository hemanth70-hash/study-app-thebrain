import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SpriteAnimator from "./SpriteAnimator";

/* =====================================================
   CHARACTERS (LOGIC ONLY, NO SPRITES HERE)
===================================================== */

const CHARACTERS = [
  {
    id: "shinchan",
    name: "Shinchan",
    personality:
      "You are Shinchan. Naughty, sarcastic, playful, teasing others.",
    x: 30,
    dir: 1,
  },
];

/* =====================================================
   SPRITE MAP
===================================================== */

const SPRITES = {
  shinchan: {
    idle: { src: "/pixel/shinchan/idle.png", frames: 4, fps: 4 },
    walk: { src: "/pixel/shinchan/walk.png", frames: 6, fps: 10 },
    talk: { src: "/pixel/shinchan/talk.png", frames: 4, fps: 8 },
    angry: { src: "/pixel/shinchan/angry.png", frames: 4, fps: 6 },
    facepalm: { src: "/pixel/shinchan/facepalm.png", frames: 4, fps: 5 },
    happy: { src: "/pixel/shinchan/happy.png", frames: 4, fps: 8 },
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
    }))
  );
  const [bubbles, setBubbles] = useState({});
  const directorBusy = useRef(false);

  /* =====================================================
     AMBIENT MOVEMENT
  ===================================================== */

  useEffect(() => {
    const loop = setInterval(() => {
      setChars((prev) =>
        prev.map((c) => {
          const moving = Math.random() > 0.7;
          return {
            ...c,
            dir: moving ? (Math.random() > 0.5 ? 1 : -1) : c.dir,
            action: moving ? "walk" : "idle",
            x: moving
              ? Math.min(85, Math.max(5, c.x + (c.dir === 1 ? 2 : -2)))
              : c.x,
          };
        })
      );
    }, 3000);
    return () => clearInterval(loop);
  }, []);

  /* =====================================================
     AI LOOP (UNSCRIPTED)
  ===================================================== */

  useEffect(() => {
    if (directorBusy.current) return;

    const loop = setInterval(async () => {
      if (directorBusy.current) return;
      directorBusy.current = true;

      const speaker = chars[0];

      try {
        const res = await fetch("/api/cartoon-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            speaker,
            context: { gpa, dailyScore, streak },
          }),
        });

        const data = await res.json();

        setBubbles({ shinchan: data.dialogue });

        setChars((prev) =>
          prev.map((c) => ({
            ...c,
            action: data.action || "talk",
          }))
        );
      } catch (e) {
        console.error("AI error", e);
      }

      setTimeout(() => {
        setBubbles({});
        setChars((prev) =>
          prev.map((c) => ({ ...c, action: "idle" }))
        );
        directorBusy.current = false;
      }, 4000);
    }, 9000);

    return () => clearInterval(loop);
  }, [chars, gpa, dailyScore, streak]);

  /* =====================================================
     RENDER
  ===================================================== */

  const shinchan = chars[0];
  const sprite = SPRITES.shinchan[shinchan.action] || SPRITES.shinchan.idle;

  return (
    <div className="relative w-full h-[150px] overflow-hidden rounded-xl border border-slate-700 bg-[#050508] mt-4">
      {/* SKY */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400/30 to-transparent" />

      {/* GROUND */}
      <div className="absolute bottom-0 left-0 w-full h-8 bg-green-700/40 border-t border-green-900" />

      {/* SHINCHAN */}
      <motion.div
        animate={{ left: `${shinchan.x}%` }}
        transition={{ duration: 1.2, ease: "linear" }}
        className="absolute bottom-6 z-10"
        style={{
          transform: shinchan.dir === -1 ? "scaleX(-1)" : "scaleX(1)",
        }}
      >
        <AnimatePresence>
          {bubbles.shinchan && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] px-3 py-2 rounded-xl border border-black max-w-[140px] text-center"
            >
              {bubbles.shinchan}
            </motion.div>
          )}
        </AnimatePresence>

        <SpriteAnimator
          src={sprite.src}
          frameWidth={64}
          frameHeight={64}
          frames={sprite.frames}
          fps={sprite.fps}
        />
      </motion.div>
    </div>
  );
}

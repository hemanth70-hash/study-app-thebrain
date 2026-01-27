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
    personality:
      "You are Shinchan. Naughty, sarcastic, playful, teasing others.",
    x: 22,
    dir: 1,
  },
  {
    id: "doraemon",
    name: "Doraemon",
    personality:
      "You are Doraemon. Calm, logical, helpful, slightly annoyed by Shinchan.",
    x: 45,
    dir: 1,
  },
  {
    id: "ben10",
    name: "Ben 10",
    personality:
      "You are Ben 10. Confident, heroic, competitive, serious attitude.",
    x: 68,
    dir: -1,
  },
];

/* =====================================================
   SPRITE MAP
===================================================== */

const SPRITES = {
  shinchan: {
    idle: { src: "/pixel/shinchan/idle.png", frameCount: 4, fps: 4 },
    walk: { src: "/pixel/shinchan/walk.png", frameCount: 6, fps: 10 },
    talk: { src: "/pixel/shinchan/talk.png", frameCount: 4, fps: 8 },
    angry: { src: "/pixel/shinchan/angry.png", frameCount: 4, fps: 6 },
    facepalm: { src: "/pixel/shinchan/facepalm.png", frameCount: 4, fps: 5 },
    happy: { src: "/pixel/shinchan/happy.png", frameCount: 4, fps: 8 },
  },

  doraemon: {
    idle: { src: "/pixel/doraemon/idle.png", frameCount: 4, fps: 4 },
    walk: { src: "/pixel/doraemon/walk.png", frameCount: 6, fps: 8 },
    talk: { src: "/pixel/doraemon/talk.png", frameCount: 4, fps: 6 },
    gadget1: { src: "/pixel/doraemon/gadget1.png", frameCount: 4, fps: 6 },
    gadget2: { src: "/pixel/doraemon/gadget2.png", frameCount: 4, fps: 6 },
  },

  ben10: {
    idle: { src: "/pixel/ben10/idle.png", frameCount: 4, fps: 4 },
    walk: { src: "/pixel/ben10/walk.png", frameCount: 6, fps: 10 },
    talk: { src: "/pixel/ben10/talk.png", frameCount: 4, fps: 6 },
    hero: { src: "/pixel/ben10/hero.png", frameCount: 4, fps: 8 },
    angry: { src: "/pixel/ben10/angry.png", frameCount: 4, fps: 6 },
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
     AMBIENT MOVEMENT (ONLY IF NOT LOCKED)
  ===================================================== */

  useEffect(() => {
    const loop = setInterval(() => {
      setChars((prev) =>
        prev.map((c) => {
          if (c.locked) return c;

          const moving = Math.random() > 0.75;
          const dir = Math.random() > 0.5 ? 1 : -1;

          return {
            ...c,
            dir: moving ? dir : c.dir,
            action: moving ? "walk" : "idle",
            x: moving
              ? Math.min(85, Math.max(5, c.x + (dir === 1 ? 2 : -2)))
              : c.x,
          };
        })
      );
    }, 3000);

    return () => clearInterval(loop);
  }, []);

  /* =====================================================
     AI LOOP (ONE CHARACTER AT A TIME)
  ===================================================== */

  useEffect(() => {
    if (directorBusy.current) return;

    const loop = setInterval(async () => {
      directorBusy.current = true;

      const speaker =
        chars[Math.floor(Math.random() * chars.length)];

      try {
        const res = await fetch("/api/cartoon-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            speaker,
            characters: chars,
            context: { gpa, dailyScore, streak },
          }),
        });

        const data = await res.json();

        setBubbles({ [speaker.id]: data.dialogue });

        setChars((prev) =>
          prev.map((c) =>
            c.id === speaker.id
              ? {
                  ...c,
                  action: data.action || "talk",
                  locked: true,
                }
              : c
          )
        );
      } catch (e) {
        console.error("AI error", e);
      }

      setTimeout(() => {
        setBubbles({});
        setChars((prev) =>
          prev.map((c) =>
            c.locked ? { ...c, action: "idle", locked: false } : c
          )
        );
        directorBusy.current = false;
      }, 4000);
    }, 9000);

    return () => clearInterval(loop);
  }, [chars, gpa, dailyScore, streak]);

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="relative w-full h-[150px] overflow-hidden rounded-xl border border-slate-700 bg-[#050508] mt-4">
      {/* SKY */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400/30 to-transparent" />

      {/* GROUND */}
      <div className="absolute bottom-0 left-0 w-full h-8 bg-green-700/40 border-t border-green-900" />

      {/* CHARACTERS */}
      {chars.map((c) => {
        const sprite =
          SPRITES[c.id][c.action] || SPRITES[c.id].idle;

        return (
          <motion.div
            key={c.id}
            animate={{ left: `${c.x}%` }}
            transition={{ duration: 1.2, ease: "linear" }}
            className="absolute bottom-6 z-10"
          >
            <AnimatePresence>
              {bubbles[c.id] && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] px-3 py-2 rounded-xl border border-black max-w-[150px] text-center"
                >
                  {bubbles[c.id]}
                </motion.div>
              )}
            </AnimatePresence>

            <SpriteAnimator
              src={sprite.src}
              frameWidth={64}
              frameHeight={64}
              frameCount={sprite.frameCount}
              fps={sprite.fps}
              flip={c.dir === -1}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

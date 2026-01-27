import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* =====================================================
   CONFIG — PIXEL-ONLY ASSETS (NO EMOJIS, NO REAL IMAGES)
===================================================== */

const SPRITES = {
  shinchan: "https://i.ibb.co/wzkPfq9/shinchan-pixel.png",
  doraemon: "https://i.ibb.co/hR2y2yX/doraemon-pixel.png",
  ben10: "https://i.ibb.co/j3Jq0xL/ben10-pixel.png",
  shiro: "https://i.ibb.co/v4x4JqM/shiro-pixel.png",
};

const CHARACTERS = [
  {
    id: "shinchan",
    name: "Shinchan",
    sprite: SPRITES.shinchan,
    personality:
      "You are Shinchan. Naughty, sarcastic, playful, teasing others, childish humor.",
    x: 18,
    dir: 1,
  },
  {
    id: "doraemon",
    name: "Doraemon",
    sprite: SPRITES.doraemon,
    personality:
      "You are Doraemon. Calm, logical, helpful, slightly annoyed by Shinchan.",
    x: 38,
    dir: 1,
  },
  {
    id: "ben10",
    name: "Ben 10",
    sprite: SPRITES.ben10,
    personality:
      "You are Ben 10. Confident, heroic, competitive, serious attitude.",
    x: 58,
    dir: -1,
  },
  {
    id: "shiro",
    name: "Shiro",
    sprite: SPRITES.shiro,
    personality:
      "You are Shiro. Silent, loyal dog. React emotionally with short thoughts.",
    x: 75,
    dir: -1,
  },
];

/* =====================================================
   COMPONENT
===================================================== */

export default function PixelGarden({
  dailyScore,
  gpa,
  streak,
  embed = true,
}) {
  const [chars, setChars] = useState(
    CHARACTERS.map((c) => ({
      ...c,
      mood: "idle",
      action: "idle",
    }))
  );
  const [bubbles, setBubbles] = useState({});
  const directorBusy = useRef(false);

  /* =====================================================
     AMBIENT MOVEMENT (SLOW & CALM)
  ===================================================== */

  useEffect(() => {
    const loop = setInterval(() => {
      setChars((prev) =>
        prev.map((c) => {
          if (Math.random() > 0.96) {
            return {
              ...c,
              dir: Math.random() > 0.5 ? 1 : -1,
              action: "walk",
              x: Math.min(85, Math.max(5, c.x + (Math.random() > 0.5 ? 1 : -1))),
            };
          }
          return { ...c, action: "idle" };
        })
      );
    }, 1200);
    return () => clearInterval(loop);
  }, []);

  /* =====================================================
     AI CONVERSATION LOOP (REAL, NOT SCRIPTED)
  ===================================================== */

  useEffect(() => {
    if (directorBusy.current) return;

    const loop = setInterval(async () => {
      if (directorBusy.current) return;
      directorBusy.current = true;

      const speaker = chars[Math.floor(Math.random() * chars.length)];

      try {
        const res = await fetch("/api/cartoon-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            speaker,
            characters: chars,
            context: {
              gpa,
              dailyScore,
              streak,
            },
          }),
        });

        const data = await res.json();

        setBubbles({ [speaker.id]: data.dialogue });

        setChars((prev) =>
          prev.map((c) =>
            c.id === speaker.id
              ? { ...c, mood: data.mood, action: data.action }
              : c
          )
        );
      } catch (e) {
        console.error("AI error", e);
      }

      setTimeout(() => {
        setBubbles({});
        directorBusy.current = false;
      }, 3500);
    }, 9000);

    return () => clearInterval(loop);
  }, [chars, gpa, dailyScore, streak]);

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="relative w-full h-[150px] overflow-hidden rounded-xl border border-slate-700 bg-[#050508] mt-4">
      {/* SKY */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400/40 to-transparent" />

      {/* GROUND */}
      <div className="absolute bottom-0 left-0 w-full h-8 bg-green-700/40 border-t border-green-900" />

      {/* CHARACTERS */}
      {chars.map((c) => (
        <motion.div
          key={c.id}
          animate={{ left: `${c.x}%` }}
          transition={{ duration: 1 }}
          className="absolute bottom-6 z-10 cursor-default"
        >
          <AnimatePresence>
            {bubbles[c.id] && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] px-3 py-2 rounded-xl border border-black max-w-[140px] text-center"
              >
                {bubbles[c.id]}
              </motion.div>
            )}
          </AnimatePresence>

          <img
            src={c.sprite}
            alt={c.name}
            className={`image-pixelated h-8 ${
              c.dir === -1 ? "scale-x-[-1]" : ""
            } ${c.action === "walk" ? "animate-bounce" : ""}`}
          />
        </motion.div>
      ))}
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SpriteAnimator from "./SpriteAnimator";

/* =====================================================
   CHARACTERS (LOGIC + POSITION)
===================================================== */

const CHARACTERS = [
  {
    id: "shinchan",
    name: "Shinchan",
    brain: (score) =>
      score < 40
        ? "Eh?! Mom will kill me!"
        : "Hehehe… Chocobi party!",
    x: 20,
    dir: 1,
  },
  {
    id: "doraemon",
    name: "Doraemon",
    brain: (score) =>
      score < 40
        ? "Nobita! Use a gadget properly!"
        : "Good job! Dorayaki time.",
    x: 50,
    dir: 1,
  },
  {
    id: "ben10",
    name: "Ben 10",
    brain: (score) =>
      score < 40
        ? "Even heroes need rest."
        : "It’s Hero Time!",
    x: 80,
    dir: -1,
  },
];

/* =====================================================
   SPRITES (MATCHES YOUR FOLDERS)
===================================================== */

const SPRITES = {
  shinchan: {
    idle: { src: "/pixel/shinchan/idle.png", frames: 4, fps: 4 },
    walk: { src: "/pixel/shinchan/walk.png", frames: 6, fps: 10 },
    talk: { src: "/pixel/shinchan/talk.png", frames: 4, fps: 8 },
    angry: { src: "/pixel/shinchan/angry.png", frames: 4, fps: 6 },
    happy: { src: "/pixel/shinchan/happy.png", frames: 5, fps: 8 },
    facepalm: { src: "/pixel/shinchan/facepalm.png", frames: 4, fps: 5 },
  },
  doraemon: {
    idle: { src: "/pixel/doraemon/idle.png", frames: 4, fps: 4 },
    walk: { src: "/pixel/doraemon/walk.png", frames: 6, fps: 8 },
    talk: { src: "/pixel/doraemon/talk.png", frames: 4, fps: 6 },
    gadget1: { src: "/pixel/doraemon/gadget1.png", frames: 6, fps: 10 },
    gadget2: { src: "/pixel/doraemon/gadget2.png", frames: 6, fps: 10 },
  },
  ben10: {
    idle: { src: "/pixel/ben10/idle.png", frames: 4, fps: 4 },
    walk: { src: "/pixel/ben10/walk.png", frames: 6, fps: 10 },
    hero: { src: "/pixel/ben10/hero.png", frames: 6, fps: 12 },
    angry: { src: "/pixel/ben10/angry.png", frames: 4, fps: 6 },
  },
};

/* =====================================================
   HELPERS
===================================================== */

const talkActionFor = (id) => {
  if (id === "doraemon") return Math.random() > 0.5 ? "gadget1" : "gadget2";
  if (id === "ben10") return "hero";
  if (id === "shinchan") return Math.random() > 0.5 ? "happy" : "talk";
  return "talk";
};

/* =====================================================
   COMPONENT
===================================================== */

export default function PixelGarden({ dailyScore, gpa }) {
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
     AMBIENT MOVEMENT
  ===================================================== */

  useEffect(() => {
    const loop = setInterval(() => {
      setChars((prev) =>
        prev.map((c) => {
          if (c.locked) return c;

          const move = Math.random() > 0.65;
          if (!move) return { ...c, action: "idle" };

          let newX = c.x + (c.dir === 1 ? 2 : -2);
          if (newX > 85) newX = 85;
          if (newX < 5) newX = 5;

          return {
            ...c,
            x: newX,
            action: "walk",
          };
        })
      );
    }, 700);

    return () => clearInterval(loop);
  }, []);

  /* =====================================================
     DIRECTOR (LOCAL AI)
  ===================================================== */

  useEffect(() => {
    const loop = setInterval(() => {
      if (directorBusy.current) return;
      directorBusy.current = true;

      const speaker =
        chars[Math.floor(Math.random() * chars.length)];
      const score = dailyScore ?? gpa;
      const dialogue = CHARACTERS.find(
        (c) => c.id === speaker.id
      ).brain(score);

      setBubbles({ [speaker.id]: dialogue });
      setChars((prev) =>
        prev.map((c) =>
          c.id === speaker.id
            ? {
                ...c,
                action: talkActionFor(c.id),
                locked: true,
              }
            : c
        )
      );

      setTimeout(() => {
        setBubbles({});
        setChars((prev) =>
          prev.map((c) =>
            c.id === speaker.id
              ? { ...c, action: "idle", locked: false }
              : c
          )
        );
        directorBusy.current = false;
      }, 4000);
    }, 8000);

    return () => clearInterval(loop);
  }, [chars, dailyScore, gpa]);

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="relative w-full h-[180px] overflow-hidden rounded-xl border border-slate-700 bg-[#0a0a0f] mt-6 select-none">
      {/* SKY */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-900/40 to-transparent" />

      {/* GROUND */}
      <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-green-900/80 to-green-800/40 border-t border-green-700/50" />

      {chars.map((c) => {
        const sprite =
          SPRITES[c.id][c.action] || SPRITES[c.id].idle;

        return (
          <motion.div
            key={c.id}
            animate={{ left: `${c.x}%` }}
            transition={{ duration: 0.5, ease: "linear" }}
            className="absolute bottom-6 z-10 flex flex-col items-center"
          >
            <AnimatePresence>
              {bubbles[c.id] && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute -top-20 w-32 bg-white text-black text-[10px] font-bold px-3 py-2 rounded-xl border-2 border-black text-center shadow-lg z-50"
                >
                  {bubbles[c.id]}
                </motion.div>
              )}
            </AnimatePresence>

            <div className={c.dir === -1 ? "scale-x-[-1]" : ""}>
              <SpriteAnimator
                src={sprite.src}
                frameWidth={64}
                frameHeight={64}
                frames={sprite.frames}
                fps={sprite.fps}
              />
            </div>

            <div className="w-10 h-2 bg-black/40 rounded-full blur-sm mt-[-4px]" />
          </motion.div>
        );
      })}
    </div>
  );
}

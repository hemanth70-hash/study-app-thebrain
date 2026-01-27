import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import StudyChat from "./StudyChat";

/* ===============================
   SIMPLE SVG SILHOUETTES
================================ */
const OfficerSVG = () => (
  <svg width="80" height="160" viewBox="0 0 80 160" fill="none">
    <path d="M40 10c10 0 18 8 18 18s-8 18-18 18-18-8-18-18 8-18 18-18zM20 60h40v80H20z" stroke="currentColor" strokeWidth="3"/>
  </svg>
);

const ParentsSVG = () => (
  <svg width="120" height="160" viewBox="0 0 120 160" fill="none">
    <path d="M40 20c8 0 14 6 14 14s-6 14-14 14-14-6-14-14 6-14 14-14zM80 20c8 0 14 6 14 14s-6 14-14 14-14-6-14-14 6-14 14-14zM20 60h40v80H20zM60 60h40v80H60z"
      stroke="currentColor" strokeWidth="3"/>
  </svg>
);

/* ===============================
   MAIN COMPONENT
================================ */
export default function RailwayDreamTunnel({ user, globalMsg }) {
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);

  const rumbleRef = useRef(null);
  const whooshRef = useRef(null);

  const shakeX = useMotionValue(0);
  const shakeY = useMotionValue(0);

  const target = Math.min(user?.total_percentage_points || 0, 100);

  /* ===============================
     PROGRESS + SPEED
  =============================== */
  useEffect(() => {
    const p = setInterval(() => {
      setProgress(v => (v < target ? v + 1 : v));
    }, 60);

    const s = setInterval(() => {
      const max = Math.floor(target * 3.2);
      setSpeed(v => (v < max ? v + 2 : v));
    }, 40);

    return () => {
      clearInterval(p);
      clearInterval(s);
    };
  }, [target]);

  /* ===============================
     CAMERA SHAKE (SAFE)
  =============================== */
  useEffect(() => {
    const intensity = Math.min(speed / 120, 2);
    shakeX.set(Math.sin(Date.now() / 120) * intensity);
    shakeY.set(Math.cos(Date.now() / 150) * intensity);
  }, [speed, shakeX, shakeY]);

  /* ===============================
     SOUND (OPTIONAL)
  =============================== */
  useEffect(() => {
    rumbleRef.current = new Audio("/sounds/engine.mp3");
    rumbleRef.current.loop = true;
    rumbleRef.current.volume = 0.3;

    whooshRef.current = new Audio("/sounds/whoosh.mp3");

    return () => {
      rumbleRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (speed > 20) rumbleRef.current?.play().catch(() => {});
  }, [speed]);

  /* ===============================
     DREAM DEFINITIONS (STABLE)
  =============================== */
  const dreams = [
    { id: "house", unlock: 55, side: -420, color: "orange", label: "HOUSE" },
    { id: "parents", unlock: 80, side: 420, color: "pink", label: "PARENTS" },
    { id: "officer", unlock: 98, side: -300, color: "cyan", label: "OFFICER" }
  ];

  return (
    <motion.div
      style={{ x: shakeX, y: shakeY }}
      className="relative w-full h-screen bg-black overflow-hidden font-mono"
    >

      {/* ===============================
         LED BOARD
      =============================== */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-black border-b border-white/10 z-40 flex items-center px-8">
        <div className="flex-1 h-9 overflow-hidden bg-[#120202] border-2 border-red-900/60 rounded">
          <motion.div
            animate={{ x: ["100%", "-100%"] }}
            transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
            className="text-red-600 font-bold tracking-[0.35em] text-lg whitespace-nowrap"
          >
            {globalMsg || `DARKSIDE VILLAGE /// SPEED ${speed} KM/H ///`}
          </motion.div>
        </div>

        <button
          onClick={() => setChatOpen(v => !v)}
          className="ml-6 p-2 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300"
        >
          {chatOpen ? <ChevronUp /> : <ChevronDown />}
        </button>
      </div>

      {/* ===============================
         TUNNEL + TRACK
      =============================== */}
      <div className="absolute inset-0 top-14 perspective-[2200px]">

        {/* HEADLIGHT */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[160%]
          bg-[radial-gradient(ellipse_at_center,_rgba(34,211,238,0.35)_0%,_rgba(34,211,238,0.15)_40%,_transparent_70%)]
          blur-3xl z-10" />

        {/* TRACK */}
        <div
          className="absolute bottom-0 left-1/2 w-[1800px] h-[380%] origin-bottom"
          style={{ transform: "translateX(-50%) rotateX(82deg)" }}
        >
          <motion.div
            animate={{ translateY: [0, 1000] }}
            transition={{ repeat: Infinity, duration: 0.22, ease: "linear" }}
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(90deg,
                  transparent 32%,
                  #22d3ee 32%, #22d3ee 33%,
                  transparent 33%, transparent 67%,
                  #22d3ee 67%, #22d3ee 68%,
                  transparent 68%
                ),
                repeating-linear-gradient(
                  180deg,
                  rgba(255,255,255,0.05) 0px,
                  rgba(255,255,255,0.05) 100px,
                  #111 100px,
                  #000 150px
                )
              `,
              backgroundSize: "100% 600px"
            }}
          />
        </div>

        {/* RAIN / DUST */}
        {[...Array(80)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-[2px] h-[20px] bg-white/10"
            initial={{ y: -50, x: Math.random() * window.innerWidth }}
            animate={{ y: "110vh" }}
            transition={{
              repeat: Infinity,
              duration: 1 + Math.random() * 1.5,
              delay: Math.random()
            }}
          />
        ))}

        {/* DREAM SILHOUETTES */}
        {dreams.map(d => {
          const active = progress >= d.unlock;
          return (
            <motion.div
              key={d.id}
              initial={{ opacity: 0.25, scale: 0.4 }}
              animate={
                active
                  ? { opacity: [0.4, 1, 0], scale: [0.4, 1.2, 2.6], y: [0, 0, 1200], x: d.side }
                  : { opacity: 0.25, scale: 0.4, x: d.side }
              }
              transition={{ duration: 2.4, ease: "easeInOut" }}
              onAnimationStart={() => active && whooshRef.current?.play().catch(() => {})}
              className={`absolute left-1/2 top-1/2 text-${d.color}-400`}
            >
              <div className="p-6 border-2 border-current bg-black/90 shadow-[0_0_80px_currentColor]">
                {d.id === "officer" ? <OfficerSVG /> : <ParentsSVG />}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ===============================
         COCKPIT DASH
      =============================== */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[420px] h-[160px] z-30 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-b from-[#111] via-[#0a0a0a] to-black
          rounded-t-[90%] border-t border-cyan-500/40 shadow-[0_-20px_80px_rgba(0,0,0,0.9)]" />
      </div>

      {/* ===============================
         SUN VISOR CHAT
      =============================== */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ type: "spring", stiffness: 90, damping: 18 }}
            className="absolute top-0 right-10 w-[420px] h-[65%]
              bg-black/80 backdrop-blur-xl
              border-x border-b-4 border-cyan-500
              rounded-b-[2.5rem] shadow-[0_0_120px_black]
              z-50"
          >
            <StudyChat user={user} isTunnel />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

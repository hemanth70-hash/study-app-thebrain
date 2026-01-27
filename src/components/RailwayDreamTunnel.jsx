import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import StudyChat from "./StudyChat";

export default function RailwayDreamTunnel({ user, globalMsg }) {
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);

  const target = Math.min(user?.total_percentage_points || 0, 100);

  /* ===============================
     PROGRESS & SPEED (FINITE)
  =============================== */
  useEffect(() => {
    const p = setInterval(() => {
      setProgress(v => (v < target ? v + 1 : v));
    }, 60);

    const s = setInterval(() => {
      const max = Math.floor(target * 3.2);
      setSpeed(v => (v < max ? v + 3 : v));
    }, 30);

    return () => {
      clearInterval(p);
      clearInterval(s);
    };
  }, [target]);

  /* ===============================
     DREAM UNLOCKS
  =============================== */
  const dreams = [
    { id: "house", label: "HOUSE", unlock: 55, side: -420, color: "orange" },
    { id: "parents", label: "PARENTS", unlock: 80, side: 420, color: "pink" },
    { id: "officer", label: "OFFICER", unlock: 98, side: -320, color: "cyan" }
  ];

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-mono">

      {/* ===============================
         TOP LED BOARD
      =============================== */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-black border-b border-white/10 z-40 flex items-center px-8">
        <div className="flex-1 h-9 overflow-hidden bg-[#120202] border-2 border-red-900/60 rounded">
          <motion.div
            animate={{ x: ["100%", "-100%"] }}
            transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
            className="whitespace-nowrap text-red-600 font-bold tracking-[0.35em] text-lg drop-shadow-[0_0_8px_red]"
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
         TUNNEL VIEW
      =============================== */}
      <div className="absolute inset-0 top-14 perspective-[2000px] overflow-hidden">

        {/* HEADLIGHT CONE */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[160%]
          bg-[radial-gradient(ellipse_at_center,_rgba(34,211,238,0.35)_0%,_rgba(34,211,238,0.15)_35%,_transparent_70%)]
          blur-3xl pointer-events-none z-10"
        />

        {/* TRACK */}
        <div
          className="absolute bottom-0 left-1/2 w-[1600px] h-[320%] origin-bottom"
          style={{ transform: "translateX(-50%) rotateX(80deg)" }}
        >
          <motion.div
            animate={{ translateY: [0, 800] }}
            transition={{ repeat: Infinity, duration: 0.18, ease: "linear" }}
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(90deg,
                  transparent 30%,
                  #22d3ee 30%, #22d3ee 31%,
                  transparent 31%, transparent 69%,
                  #22d3ee 69%, #22d3ee 70%,
                  transparent 70%
                ),
                repeating-linear-gradient(
                  180deg,
                  rgba(255,255,255,0.05) 0px,
                  rgba(255,255,255,0.05) 90px,
                  #111 90px,
                  #000 130px
                )
              `,
              backgroundSize: "100% 500px"
            }}
          />
        </div>

        {/* SIDE TREES / GRASS */}
        <div className="absolute inset-0 pointer-events-none z-5">
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className="absolute bottom-0 w-[36px] h-[120px] bg-black/80 blur-sm"
              style={{
                left: i % 2 === 0 ? "8%" : "92%",
                transform: `translateZ(${-800 - i * 220}px)`
              }}
            />
          ))}
        </div>

        {/* DREAM OBJECTS */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {dreams.map(d => {
            const unlocked = progress >= d.unlock;

            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={
                  unlocked
                    ? {
                        opacity: [0, 1, 0],
                        scale: [0.4, 1.1, 2.4],
                        y: [0, 0, 1200],
                        x: d.side
                      }
                    : {
                        opacity: 0.25,
                        scale: 0.4,
                        x: d.side
                      }
                }
                transition={{ duration: 2.2, ease: "easeInOut" }}
                className={`absolute left-1/2 top-1/2 text-${d.color}-400`}
              >
                <div
                  className={`px-8 py-6 border-2 border-current bg-black/95
                  shadow-[0_0_80px_currentColor] tracking-[0.4em]`}
                >
                  {d.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ===============================
         COCKPIT DASH (DARK & SMALL)
      =============================== */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[420px] h-[160px] z-30 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-b from-[#111] via-[#0a0a0a] to-black
          rounded-t-[90%] border-t border-cyan-500/40
          shadow-[0_-20px_80px_rgba(0,0,0,0.9)]" />
      </div>

      {/* ===============================
         CHAT SUN VISOR
      =============================== */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ type: "spring", stiffness: 90, damping: 18 }}
            className="absolute top-0 right-10 w-[420px] h-[65%]
              bg-black/75 backdrop-blur-xl
              border-x border-b-4 border-cyan-500
              rounded-b-[2.5rem] shadow-[0_0_120px_black]
              z-50"
          >
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent)]" />
            <StudyChat user={user} isTunnel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

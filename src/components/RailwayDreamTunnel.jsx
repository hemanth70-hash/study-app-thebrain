import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import StudyChat from "./StudyChat";

export default function RailwayDreamTunnel({ user, globalMsg }) {
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);

  const target = Math.min(user?.total_percentage_points || 0, 100);

  /* ======================
     PROGRESS + SPEED
  ====================== */
  useEffect(() => {
    const p = setInterval(() => {
      setProgress(v => {
        if (v >= target) return v;
        return v + 1;
      });
    }, 60);

    const s = setInterval(() => {
      setSpeed(v => {
        const max = Math.floor(target * 3.5);
        if (v >= max) return v;
        return v + 4;
      });
    }, 30);

    return () => {
      clearInterval(p);
      clearInterval(s);
    };
  }, [target]);

  /* ======================
     DREAM STATES
  ====================== */
  const dreams = {
    house: progress >= 55,
    parents: progress >= 80,
    officer: progress >= 98
  };

  return (
    <div className="relative w-full h-[88vh] bg-black rounded-[3rem] overflow-hidden border-8 border-slate-900 shadow-2xl font-mono">

      {/* ======================
         LED DESTINATION BOARD
      ====================== */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-black border-b border-white/10 z-50 flex items-center px-10">
        <div className="flex-1 overflow-hidden h-9 bg-[#120202] border-2 border-red-900/60 rounded">
          <motion.div
            animate={{ x: ["100%", "-100%"] }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            className="text-red-600 font-bold tracking-[0.4em] text-xl whitespace-nowrap drop-shadow-[0_0_10px_red]"
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

      {/* ======================
         TUNNEL VIEWPORT
      ====================== */}
      <div className="absolute inset-0 top-14 perspective-[1400px] overflow-hidden">

        {/* TUNNEL SWAY */}
        <div
          className="absolute inset-0"
          style={{ animation: "sway 10s ease-in-out infinite" }}
        >
          <style>{`
            @keyframes sway {
              0%,100% { perspective-origin: 50% 50%; }
              25% { perspective-origin: 40% 50%; }
              75% { perspective-origin: 60% 50%; }
            }
          `}</style>

          {/* ======================
             INFINITE TRACK
          ====================== */}
          <div
            className="absolute bottom-0 left-1/2 w-[1600px] h-[300%] origin-bottom"
            style={{ transform: "translateX(-50%) rotateX(80deg)" }}
          >
            <motion.div
              animate={{ translateY: [0, 500] }}
              transition={{ repeat: Infinity, duration: 0.15, ease: "linear" }}
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(90deg,
                    transparent 26%,
                    #22d3ee 26%, #22d3ee 27%,
                    transparent 27%, transparent 73%,
                    #22d3ee 73%, #22d3ee 74%,
                    transparent 74%
                  ),
                  repeating-linear-gradient(
                    180deg,
                    rgba(255,255,255,0.04) 0px,
                    rgba(255,255,255,0.04) 80px,
                    #111 80px,
                    #000 120px
                  )
                `,
                backgroundSize: "100% 500px"
              }}
            />
          </div>

          {/* ======================
             DARK VILLAGE (FAR)
          ====================== */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

            {/* HOUSE */}
            <NeonSilhouette
              active={dreams.house}
              color="orange"
              label="HOUSE"
              z={900}
            />

            {/* PARENTS */}
            <NeonSilhouette
              active={dreams.parents}
              color="pink"
              label="PARENTS"
              z={700}
            />

            {/* OFFICER */}
            <NeonSilhouette
              active={dreams.officer}
              color="cyan"
              label="OFFICER"
              z={500}
            />
          </div>
        </div>
      </div>

      {/* ======================
         COCKPIT FRAME
      ====================== */}
      <div className="absolute inset-0 pointer-events-none z-40">
        <div className="absolute inset-0 border-[60px] border-black rounded-[3rem] shadow-[inset_0_0_180px_black]" />
      </div>

      {/* ======================
         SUN VISOR CHAT
      ====================== */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ type: "spring", stiffness: 90, damping: 18 }}
            className="absolute top-0 right-14 w-[420px] h-[75%] bg-black/80 backdrop-blur-xl border-x-2 border-b-8 border-cyan-500 rounded-b-[3rem] z-50"
          >
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent)]" />
            <StudyChat user={user} isTunnel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ======================
   NEON SILHOUETTE
====================== */
function NeonSilhouette({ active, color, label, z }) {
  return (
    <motion.div
      initial={{ opacity: 0.2, scale: 0.1 }}
      animate={
        active
          ? { opacity: [1, 1, 0], scale: [0.15, 1.2, 3], y: [0, 0, 1200], z: [z, z / 2, 0] }
          : { opacity: 0.25, scale: 0.15 }
      }
      transition={{ duration: 1.4, ease: "easeInOut" }}
      className={`absolute text-${color}-400 tracking-widest`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className={`border-2 border-current px-8 py-6 shadow-[0_0_40px_currentColor]`}>
        {label}
      </div>
    </motion.div>
  );
}

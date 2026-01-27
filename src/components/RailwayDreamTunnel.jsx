import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Zap,
  Home,
  Users,
  Shield,
  BookOpen,
  Ticket,
  Activity
} from "lucide-react";
import StudyChat from "./StudyChat";

export default function RailwayDreamTunnel({ user, globalMsg }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [displayedSpeed, setDisplayedSpeed] = useState(0);
  const [progress, setProgress] = useState(0);

  const gpa = user?.total_percentage_points || 0;
  const actualScore = Math.min(gpa, 100);

  /* ==============================
     SPEED + PROGRESS (FINITE)
  ============================== */
  useEffect(() => {
    const prog = setInterval(() => {
      setProgress(p => {
        if (p >= actualScore) {
          clearInterval(prog);
          return actualScore;
        }
        return p + 1;
      });
    }, 45);

    const speedTarget = Math.floor(actualScore * 3.5);
    const spd = setInterval(() => {
      setDisplayedSpeed(s => {
        if (s >= speedTarget) {
          clearInterval(spd);
          return speedTarget;
        }
        return s + 5;
      });
    }, 30);

    return () => {
      clearInterval(prog);
      clearInterval(spd);
    };
  }, [actualScore]);

  /* ==============================
     DREAM SILHOUETTES (VILLAGE)
  ============================== */
  const dreams = [
    { id: 1, val: 10, icon: <BookOpen size={80} />, label: "SYLLABUS", color: "text-white" },
    { id: 2, val: 30, icon: <Ticket size={80} />, label: "RAIL PASS", color: "text-green-400" },
    { id: 3, val: 55, icon: <Home size={80} />, label: "HOUSE", color: "text-yellow-400" },
    { id: 4, val: 80, icon: <Users size={80} />, label: "PARENTS", color: "text-pink-400" },
    { id: 5, val: 98, icon: <Shield size={80} />, label: "OFFICER", color: "text-cyan-400" }
  ];

  const liquidHeight = Math.min((user.streak_count / 365) * 100, 100);

  return (
    <div className="relative w-full h-[88vh] rounded-[3rem] overflow-hidden bg-black font-mono select-none shadow-2xl border-8 border-slate-900">

      {/* ==============================
          LED BROADCAST (BUS STYLE)
      ============================== */}
      <div className="z-50 h-14 bg-black border-b border-white/10 flex items-center px-10">
        <div className="flex-1 h-9 bg-[#120202] border-2 border-red-900/60 rounded overflow-hidden relative">
          <motion.div
            animate={{ x: ["100%", "-100%"] }}
            transition={{ repeat: Infinity, duration: 22, ease: "linear" }}
            className="whitespace-nowrap text-red-600 font-bold text-xl tracking-[0.4em] drop-shadow-[0_0_10px_red]"
          >
            {globalMsg ||
              `LOCO PILOT ${user.username} /// EN ROUTE TO DARK VILLAGE /// SPEED ${displayedSpeed} KM/H ///`}
          </motion.div>
        </div>

        <button
          onClick={() => setIsChatOpen(v => !v)}
          className="ml-6 p-2 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:scale-110 transition"
        >
          {isChatOpen ? <ChevronUp /> : <ChevronDown />}
        </button>
      </div>

      {/* ==============================
          TUNNEL ENGINE (INFINITE)
      ============================== */}
      <div className="relative flex-1 overflow-hidden perspective-[1200px] bg-[#020202]">

        {/* SWAY */}
        <div
          className="absolute inset-0 flex justify-center items-end"
          style={{ animation: "sway 10s ease-in-out infinite" }}
        >
          <style>{`
            @keyframes sway {
              0%,100% { perspective-origin: 50% 50%; }
              25% { perspective-origin: 40% 50%; }
              75% { perspective-origin: 60% 50%; }
            }
            @keyframes flicker {
              0%,100% { opacity: .35 }
              50% { opacity: .55 }
            }
          `}</style>

          {/* TRACK PLANE */}
          <div
            className="relative w-[1500px] h-[300%] origin-bottom transform-style-3d"
            style={{ transform: "rotateX(80deg)" }}
          >
            <motion.div
              animate={{ translateY: [0, 400] }}
              transition={{ repeat: Infinity, duration: 0.12, ease: "linear" }}
              className="absolute inset-0"
              style={{
                backgroundImage: `
                linear-gradient(90deg,
                  transparent 25%,
                  #22d3ee 25%, #22d3ee 26%,
                  transparent 26%, transparent 74%,
                  #22d3ee 74%, #22d3ee 75%,
                  transparent 75%
                ),
                repeating-linear-gradient(
                  180deg,
                  rgba(255,255,255,0.04) 0px,
                  rgba(255,255,255,0.04) 90px,
                  #111 90px,
                  #000 120px
                )`,
                backgroundSize: "100% 400px"
              }}
            />
          </div>
        </div>

        {/* ==============================
            DARK VILLAGE DREAMS
        ============================== */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none perspective-[1200px]">
          {dreams.map(d => {
            const hit = progress >= d.val;
            return (
              <motion.div
                key={d.id}
                initial={{ scale: 0.1, opacity: 0, z: 800 }}
                animate={
                  hit
                    ? { scale: [0.15, 6, 25], opacity: [1, 1, 0], y: [0, 0, 1200], z: [800, 400, 0] }
                    : { scale: 0.12, opacity: 0.4, y: -40, z: 800 }
                }
                transition={{ duration: 1.4, ease: "easeInOut" }}
                className="absolute flex flex-col items-center"
              >
                {hit && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0.8 }}
                    animate={{ scale: 6, opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute rounded-full border-4 border-white shadow-[0_0_100px_white]"
                  />
                )}

                <div
                  className={`p-10 rounded-3xl border-4 bg-black/95 ${d.color} border-current shadow-[0_0_60px_currentColor]`}
                  style={{ animation: !hit ? "flicker 4s infinite" : "none" }}
                >
                  {d.icon}
                </div>

                <div className="mt-6 px-6 py-2 bg-black/80 border border-white/20 text-white text-xl tracking-[0.3em]">
                  {d.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ==============================
          COCKPIT DASHBOARD
      ============================== */}
      <div className="absolute bottom-0 w-full h-64 bg-[#f8f9fa] border-t-[10px] border-blue-700 flex items-center justify-between px-20 shadow-[0_-30px_100px_black] rounded-t-[15rem] z-30">

        {/* COFFEE */}
        <div className="w-20 h-28 bg-white/20 border-4 border-slate-300 rounded-b-2xl relative overflow-hidden">
          <motion.div
            animate={{ height: `${liquidHeight}%` }}
            className="absolute bottom-0 w-full bg-gradient-to-t from-orange-800 to-orange-400"
          />
        </div>

        {/* SPEED */}
        <div className="w-64 h-64 -mt-32 bg-black rounded-full border-[15px] border-slate-300 flex items-center justify-center shadow-2xl">
          <div className="text-center">
            <p className="text-cyan-500 tracking-widest text-xs">NEURAL SPEED</p>
            <p className="text-8xl font-black text-white drop-shadow-[0_0_20px_cyan]">
              {displayedSpeed}
            </p>
            <p className="text-cyan-400 text-sm">KM/H</p>
          </div>
        </div>

        {/* TELEMETRY */}
        <div className="flex flex-col gap-6 items-end">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-slate-400 tracking-widest">EFFICIENCY</p>
              <p className="text-4xl font-black text-blue-800">{progress}%</p>
            </div>
            <div className="p-4 bg-blue-700 rounded-3xl text-white shadow-lg">
              <Zap />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-12 h-12 bg-slate-200 rounded-2xl flex items-center justify-center">
              <Shield className="text-blue-600" />
            </div>
            <div className="w-12 h-12 bg-slate-200 rounded-2xl flex items-center justify-center">
              <Activity className="text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ==============================
          SUN SHIELD CHAT VISOR
      ============================== */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ type: "spring", stiffness: 90, damping: 15 }}
            className="absolute top-0 right-14 w-[450px] h-[75%] bg-gradient-to-b from-black/80 to-black/95 backdrop-blur-xl border-x-2 border-b-8 border-cyan-500 rounded-b-[3rem] shadow-[0_0_150px_black] z-[60]"
          >
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent)] pointer-events-none" />
            <StudyChat user={user} isTunnel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

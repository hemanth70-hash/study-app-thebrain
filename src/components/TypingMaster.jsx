import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Keyboard, Activity, CheckCircle, Target, 
  Zap, Lock, Database, FastForward, Award, Volume2, VolumeX,
  Gamepad2, Flame, Play, Pause, RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';

// --- CONFIGURATION & ASSETS ---
const SOUND_PATHS = { correct: '/sounds/bubble.mp3', error: '/sounds/thud.mp3' };

// --- CAMPAIGN CONTENT GENERATORS ---
const ROWS = {
  middle: "asdfghjkl;",
  top: "qwertyuiop",
  bottom: "zxcvbnm"
};

const WORDS_MED = ["the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "neural", "grid", "system", "logic", "code", "react", "data", "node", "loop", "array"];
const WORDS_HARD = ["synchronization", "infrastructure", "authentication", "cryptography", "decentralized", "architecture", "implementation", "polymorphism", "encapsulation", "asynchronous", "middleware"];

const generateCampaignText = (level) => {
  // SECTOR 1: EASY (Row Training)
  if (level <= 10) return generateRowString(ROWS.middle, 15 + level);
  if (level <= 20) return generateRowString(ROWS.top, 20 + (level-10));
  if (level <= 30) return generateRowString(ROWS.bottom, 20 + (level-20));

  // SECTOR 2: MEDIUM (Simple Paragraphs)
  if (level <= 60) return generateParagraph(WORDS_MED, 10 + Math.ceil((level-30)/2));

  // SECTOR 3: HARD (Complex Paragraphs)
  return generateParagraph(WORDS_HARD, 10 + Math.ceil((level-60)/2));
};

const generateRowString = (chars, length) => {
  let res = "";
  for(let i=0; i<length; i++) {
    res += chars[Math.floor(Math.random() * chars.length)];
    if (i % 5 === 4 && i !== length-1) res += " "; // Add space every 5 chars
  }
  return res;
};

const generateParagraph = (wordList, count) => {
  let res = [];
  for(let i=0; i<count; i++) res.push(wordList[Math.floor(Math.random() * wordList.length)]);
  return res.join(" ");
};

// --- COMPONENT START ---
export default function TypingMaster({ user }) {
  // GLOBAL STATE
  const [mode, setMode] = useState('campaign'); // 'campaign', 'games'
  const [gameType, setGameType] = useState(null); // 'balloon', 'infinite'
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // CAMPAIGN STATE
  const [level, setLevel] = useState(user.typing_level || 1);
  const [perfectStreak, setPerfectStreak] = useState(0); // Tracks 100% acc streak
  
  // TYPING ENGINE STATE
  const [text, setText] = useState('');
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isFinished, setIsFinished] = useState(false);
  
  // BALLOON GAME STATE
  const [balloons, setBalloons] = useState([]);
  const [balloonScore, setBalloonScore] = useState(0);
  const [balloonLives, setBalloonLives] = useState(3);
  const [gameActive, setGameActive] = useState(false);
  const requestRef = useRef();

  const inputRef = useRef(null);
  const audioCorrect = useRef(new Audio(SOUND_PATHS.correct));
  const audioError = useRef(new Audio(SOUND_PATHS.error));

  // --- INIT & LOADERS ---
  const loadCampaign = useCallback(() => {
    setIsFinished(false); setInput(''); setStartTime(null); setWpm(0); setAccuracy(100);
    setText(generateCampaignText(level));
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [level]);

  const loadInfiniteMock = async () => {
    setIsFinished(false); setInput(''); setStartTime(null); setWpm(0); setAccuracy(100);
    const { data } = await supabase.from('mocks').select('questions').limit(10);
    if (data && data.length > 0) {
      const randomMock = data[Math.floor(Math.random() * data.length)];
      let questions = typeof randomMock.questions === 'string' ? JSON.parse(randomMock.questions) : randomMock.questions;
      if (questions && questions.length > 0) {
        const q = questions[Math.floor(Math.random() * questions.length)];
        const cleanText = (q.questionText || "Neural sync failed.").replace(/<[^>]*>?/gm, '');
        setText(cleanText);
      }
    } else {
      setText("No mock data found. Using backup protocol.");
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  useEffect(() => {
    if (mode === 'campaign') loadCampaign();
    else if (mode === 'games' && gameType === 'infinite') loadInfiniteMock();
  }, [mode, gameType, level, loadCampaign]);

  // --- AUDIO ---
  const playSound = (type) => {
    if (!soundEnabled) return;
    const audio = type === 'correct' ? audioCorrect.current : audioError.current;
    audio.currentTime = 0; audio.play().catch(()=>{});
  };

  // --- CAMPAIGN & INFINITE TYPING HANDLER ---
  const handleTyping = async (e) => {
    if (isFinished) return;
    const val = e.target.value;
    const lastChar = val.slice(-1);
    const expectedChar = text[val.length - 1];

    if (val.length > input.length) {
      if (lastChar === expectedChar) playSound('correct');
      else playSound('error');
    }

    if (!startTime && val.length === 1) setStartTime(Date.now());
    setInput(val);

    // Metrics
    const time = (Date.now() - startTime) / 60000;
    const words = val.length / 5;
    setWpm(Math.round(words / (time || 0.001)));
    
    let correct = 0;
    for (let i = 0; i < val.length; i++) if (val[i] === text[i]) correct++;
    const acc = Math.round((correct / val.length) * 100) || 100;
    setAccuracy(acc);

    if (val === text) {
      setIsFinished(true);
      if (mode === 'campaign') await handleCampaignComplete(acc);
      else if (gameType === 'infinite') await handleInfiniteComplete();
    }
  };

  // --- REWARD LOGIC (STREAK FREEZE) ---
  const handleCampaignComplete = async (finalAcc) => {
    if (finalAcc === 100) {
      const newStreak = perfectStreak + 1;
      setPerfectStreak(newStreak);
      
      if (newStreak >= 5) {
        // AWARD STREAK FREEZE POINT
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#F97316', '#FFFFFF'] });
        await supabase.from('profiles').update({ 
          streak_points: (user.streak_points || 0) + 1 
        }).eq('id', user.id);
        alert("🔥 REWARD: +1 Streak Freeze Point Acquired!");
        setPerfectStreak(0); // Reset after reward
      } else {
        confetti({ particleCount: 50, spread: 50 });
      }
    } else {
      setPerfectStreak(0); // Reset on imperfect run
    }

    // Level Up
    const nextLevel = level + 1;
    await supabase.from('profiles').update({ typing_level: nextLevel }).eq('id', user.id);
    // Wait a bit then load next
    setTimeout(() => setLevel(nextLevel), 1500);
  };

  const handleInfiniteComplete = async () => {
    // Just reset instantly for "Flow State"
    setTimeout(loadInfiniteMock, 500);
  };

  // --- BALLOON GAME LOGIC ---
  const startBalloonGame = () => {
    setGameActive(true);
    setBalloonScore(0);
    setBalloonLives(3);
    setBalloons([]);
    setInput('');
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const gameLoop = () => {
    if (!gameActive) return;

    setBalloons(prev => {
      // 1. Add new balloon randomly
      if (Math.random() < 0.02) { // Spawn rate
        const word = WORDS_MED[Math.floor(Math.random() * WORDS_MED.length)];
        return [...prev, { id: Date.now(), word, x: Math.random() * 80 + 10, y: -10 }];
      }

      // 2. Move balloons down
      const moved = prev.map(b => ({ ...b, y: b.y + 0.3 + (balloonScore * 0.01) })); // Speed increases with score

      // 3. Check collisions
      const missed = moved.filter(b => b.y > 90);
      if (missed.length > 0) {
        setBalloonLives(l => {
          if (l - missed.length <= 0) {
             setGameActive(false); // Game Over
             alert(`Mission Failed. Final Score: ${balloonScore}`);
             return 0;
          }
          return l - missed.length;
        });
        playSound('error');
        return moved.filter(b => b.y <= 90);
      }
      return moved;
    });

    if (balloonLives > 0) requestRef.current = requestAnimationFrame(gameLoop);
  };

  const handleBalloonInput = (e) => {
    const val = e.target.value;
    setInput(val);
    
    // Check if any balloon matches the typed word
    const match = balloons.find(b => b.word === val);
    if (match) {
      playSound('correct');
      setBalloons(prev => prev.filter(b => b.id !== match.id)); // Pop it
      setBalloonScore(s => s + 1);
      setInput(''); // Reset input
    }
  };

  useEffect(() => {
    return () => cancelAnimationFrame(requestRef.current);
  }, []);


  // --- RENDERERS ---

  const renderText = () => {
    return text.split('').map((char, index) => {
      let color = "text-slate-500 opacity-50";
      let bg = "";
      if (index < input.length) {
        if (input[index] === char) color = "text-cyan-400 opacity-100 shadow-[0_0_10px_rgba(34,211,238,0.5)]";
        else { color = "text-red-500 opacity-100"; bg = "bg-red-500/20"; }
      } else if (index === input.length) {
        bg = "bg-cyan-500/20 animate-pulse border-b-2 border-cyan-400"; 
      }
      return <span key={index} className={`${color} ${bg} transition-all duration-75 px-[1px] rounded-sm`}>{char}</span>;
    });
  };

  // --- MAIN UI ---
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-8">
      
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/20 text-white">
            <Keyboard size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
              Neural Typer 2.0
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
              Level {level} • {perfectStreak}/5 Perfect Streak
            </p>
          </div>
        </div>

        <div className="flex gap-4">
           <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-3 rounded-xl ${soundEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
             {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
           </button>
           <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex">
             <button onClick={() => { setMode('campaign'); setGameType(null); }} className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${mode === 'campaign' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400'}`}>Campaign</button>
             <button onClick={() => { setMode('games'); setGameType('balloon'); }} className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${mode === 'games' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-400'}`}>Games</button>
           </div>
        </div>
      </div>

      {/* --- CAMPAIGN & INFINITE MODE --- */}
      {(mode === 'campaign' || (mode === 'games' && gameType === 'infinite')) && (
        <>
          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">WPM</p>
              <p className="text-4xl font-black text-slate-800 dark:text-white">{wpm}</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Precision</p>
              <p className={`text-4xl font-black ${accuracy===100?'text-green-500':'text-orange-500'}`}>{accuracy}%</p>
            </div>
            <div className="md:col-span-2 bg-gradient-to-r from-orange-500 to-red-600 p-6 rounded-3xl text-white relative overflow-hidden">
               <div className="relative z-10">
                 <p className="font-bold opacity-70 uppercase text-[10px] tracking-widest">Streak Freeze Progress</p>
                 <div className="flex items-center gap-2 mt-2">
                   {[1,2,3,4,5].map(i => (
                     <div key={i} className={`h-3 flex-1 rounded-full transition-all ${i <= perfectStreak ? 'bg-white shadow-[0_0_10px_white]' : 'bg-white/20'}`} />
                   ))}
                 </div>
                 <p className="text-[10px] mt-2 font-bold uppercase">{perfectStreak}/5 Perfect runs to earn Freeze Point</p>
               </div>
               <Flame className="absolute right-[-10px] bottom-[-10px] text-white/20 rotate-12" size={80} />
            </div>
          </div>

          {/* GAME SELECTION (Only if mode is Games) */}
          {mode === 'games' && (
             <div className="flex justify-center gap-4 mb-4">
                <button onClick={() => setGameType('balloon')} className={`px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest ${gameType === 'balloon' ? 'bg-pink-600 text-white' : 'bg-slate-800 text-slate-500'}`}>🎈 Balloon Pop</button>
                <button onClick={() => setGameType('infinite')} className={`px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest ${gameType === 'infinite' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-500'}`}>♾️ Infinite Mock</button>
             </div>
          )}

          {/* TYPING AREA */}
          <div className="relative bg-white dark:bg-[#0f172a] p-10 md:p-14 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 min-h-[300px] flex flex-col justify-center text-center">
            {isFinished ? (
               <div className="animate-in zoom-in">
                 <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
                 <h3 className="text-3xl font-black uppercase dark:text-white">Complete</h3>
                 <p className="text-slate-400 font-bold mb-6">Processing results...</p>
               </div>
            ) : (
              <>
                 <div className="font-mono text-2xl md:text-3xl leading-relaxed tracking-wide mb-8 break-words select-none pointer-events-none">{renderText()}</div>
                 <textarea ref={inputRef} value={input} onChange={handleTyping} className="absolute inset-0 w-full h-full opacity-0 cursor-text resize-none" autoFocus spellCheck="false" />
                 {!startTime && <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-400 font-bold text-xs uppercase tracking-widest animate-bounce">Type to Initialize</div>}
              </>
            )}
          </div>
          
          {/* CAMPAIGN MAP (Visual Only) */}
          {mode === 'campaign' && (
            <div className="grid grid-cols-3 gap-4 text-center">
               <div className={`p-4 rounded-xl border-2 ${level<=30 ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-800 opacity-50'}`}>
                 <p className="font-black uppercase text-xs">Sector 1: Basics</p>
                 <p className="text-[10px] text-slate-400">Rows & Fundamentals</p>
               </div>
               <div className={`p-4 rounded-xl border-2 ${level>30 && level<=60 ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 opacity-50'}`}>
                 <p className="font-black uppercase text-xs">Sector 2: Fluency</p>
                 <p className="text-[10px] text-slate-400">Standard English</p>
               </div>
               <div className={`p-4 rounded-xl border-2 ${level>60 ? 'border-purple-500 bg-purple-500/10' : 'border-slate-800 opacity-50'}`}>
                 <p className="font-black uppercase text-xs">Sector 3: Mastery</p>
                 <p className="text-[10px] text-slate-400">Technical Data</p>
               </div>
            </div>
          )}
        </>
      )}

      {/* --- BALLOON GAME UI --- */}
      {mode === 'games' && gameType === 'balloon' && (
        <div className="bg-slate-900 rounded-[2.5rem] p-4 h-[600px] relative overflow-hidden border-4 border-pink-500/30 shadow-2xl">
           {/* GAME OVERLAY */}
           {!gameActive ? (
             <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
               <Gamepad2 size={64} className="text-pink-500 mb-4" />
               <h3 className="text-4xl font-black uppercase text-white mb-2">Aerial Defense</h3>
               <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-8">Type falling words to intercept</p>
               <button onClick={startBalloonGame} className="bg-pink-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all">Start Mission</button>
             </div>
           ) : (
             <>
               {/* SCORE HUD */}
               <div className="absolute top-4 left-4 z-10 bg-slate-900/50 backdrop-blur px-4 py-2 rounded-xl border border-white/10">
                 <p className="text-white font-black text-xl">Score: {balloonScore}</p>
                 <div className="flex gap-1 text-red-500">{[...Array(balloonLives)].map((_,i) => <span key={i}>❤️</span>)}</div>
               </div>
               
               {/* INPUT HUD */}
               <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-1/2">
                 <input 
                   autoFocus
                   value={input}
                   onChange={handleBalloonInput}
                   className="w-full bg-slate-800/80 text-white text-center font-bold uppercase p-4 rounded-2xl border-2 border-pink-500/50 outline-none placeholder-slate-600"
                   placeholder="TYPE TO INTERCEPT..." 
                 />
               </div>

               {/* BALLOONS */}
               {balloons.map(b => (
                 <div 
                   key={b.id}
                   className="absolute bg-white text-slate-900 px-3 py-1 rounded-full font-bold text-xs shadow-[0_0_15px_rgba(255,255,255,0.5)] border-2 border-pink-500"
                   style={{ left: `${b.x}%`, top: `${b.y}%` }}
                 >
                   {b.word}
                   {/* Balloon String Visual */}
                   <div className="absolute left-1/2 top-full h-4 w-[1px] bg-white/50"></div>
                 </div>
               ))}
               
               {/* GROUND */}
               <div className="absolute bottom-0 w-full h-2 bg-pink-500/50 shadow-[0_0_20px_#ec4899]"></div>
             </>
           )}
        </div>
      )}

    </div>
  );
}
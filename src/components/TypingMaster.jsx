import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Keyboard, Activity, Target, Volume2, VolumeX,
  Gamepad2, Flame, RefreshCw, ChevronLeft, ChevronRight, Unlock, Star, FastForward, Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';

// --- CONFIG ---
const AUDIO_URLS = {
  correct: '/sounds/bubble.mp3', 
  error: '/sounds/thud.mp3'
};

const KEY_ZONES = {
  'q': 'pinky-l', 'a': 'pinky-l', 'z': 'pinky-l', '1': 'pinky-l',
  'w': 'ring-l', 's': 'ring-l', 'x': 'ring-l', '2': 'ring-l',
  'e': 'middle-l', 'd': 'middle-l', 'c': 'middle-l', '3': 'middle-l',
  'r': 'index-l', 'f': 'index-l', 'v': 'index-l', '4': 'index-l', '5': 'index-l', 't': 'index-l', 'g': 'index-l', 'b': 'index-l',
  'y': 'index-r', 'h': 'index-r', 'n': 'index-r', '6': 'index-r', '7': 'index-r', 'u': 'index-r', 'j': 'index-r', 'm': 'index-r',
  'i': 'middle-r', 'k': 'middle-r', ',': 'middle-r', '8': 'middle-r',
  'o': 'ring-r', 'l': 'ring-r', '.': 'ring-r', '9': 'ring-r',
  'p': 'pinky-r', ';': 'pinky-r', '/': 'pinky-r', '0': 'pinky-r', '-': 'pinky-r', '=': 'pinky-r', '[': 'pinky-r', ']': 'pinky-r', "'": 'pinky-r'
};

const KEYBOARD_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/']
];

const ROWS = { middle: "asdfghjkl;", top: "qwertyuiop", bottom: "zxcvbnm" };
const WORDS_MED = ["neural", "grid", "system", "logic", "code", "react", "data", "node", "loop", "array", "function", "variable", "constant", "string", "number", "boolean", "object", "syntax"];
const WORDS_HARD = ["synchronization", "infrastructure", "authentication", "cryptography", "decentralized", "architecture", "implementation", "polymorphism", "encapsulation"];

const generateCampaignText = (lvl) => {
  if (lvl <= 10) return generateRowString(ROWS.middle, 150 + (lvl * 5));
  if (lvl <= 20) return generateRowString(ROWS.top, 150 + (lvl * 5));
  if (lvl <= 30) return generateRowString(ROWS.bottom, 150 + (lvl * 5));
  if (lvl <= 60) return generateParagraph(WORDS_MED, 50 + Math.ceil((lvl-30)));
  return generateParagraph(WORDS_HARD, 40 + Math.ceil((lvl-60)));
};

const generateRowString = (chars, length) => {
  let res = "";
  for(let i=0; i<length; i++) {
    res += chars[Math.floor(Math.random() * chars.length)];
    if (i > 0 && i % 6 === 0) res += " "; 
  }
  return res;
};

const generateParagraph = (wordList, count) => {
  let res = [];
  for(let i=0; i<count; i++) res.push(wordList[Math.floor(Math.random() * wordList.length)]);
  return res.join(" ");
};

export default function TypingMaster({ user, isDarkMode }) {
  const [mode, setMode] = useState('campaign'); 
  const [gameType, setGameType] = useState('balloon'); 
  const [soundEnabled, setSoundEnabled] = useState(true);

  // CAMPAIGN STATE
  const [maxLevel, setMaxLevel] = useState(user.typing_level || 1);
  const [currentLevel, setCurrentLevel] = useState(user.typing_level || 1);
  const [perfectStreak, setPerfectStreak] = useState(0);
  const [resultStars, setResultStars] = useState(0); 

  // TYPING ENGINE
  const [text, setText] = useState('');
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isFinished, setIsFinished] = useState(false);
  const [activeKey, setActiveKey] = useState(null);

  // BALLOON STATE
  const [balloons, setBalloons] = useState([]);
  const [balloonScore, setBalloonScore] = useState(0);
  const [balloonLives, setBalloonLives] = useState(3);
  const [gameActive, setGameActive] = useState(false);
  
  const inputRef = useRef(null);
  const gameInputRef = useRef(null);
  const requestRef = useRef();
  
  // 🔥 AUDIO FIX: Initialize inside useRef as NULL to prevent "Illegal Constructor"
  const soundsRef = useRef(null);

  // 🔥 Initialize Audio ONLY on mount (Client-side)
  useEffect(() => {
    soundsRef.current = {
      correct: new Audio(AUDIO_URLS.correct),
      error: new Audio(AUDIO_URLS.error)
    };
    // Preload
    soundsRef.current.correct.load();
    soundsRef.current.error.load();
  }, []);

  const playSound = (type) => {
    if (!soundEnabled || !soundsRef.current) return;
    try {
      const sound = soundsRef.current[type].cloneNode();
      sound.volume = 0.5;
      sound.play().catch(() => {});
    } catch (e) {
      console.warn("Audio Error", e);
    }
  };

  const loadLevel = useCallback(() => {
    setIsFinished(false); 
    setInput(''); 
    setStartTime(null); 
    setWpm(0); 
    setAccuracy(100); 
    setResultStars(0);
    setText(generateCampaignText(currentLevel));
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [currentLevel]);

  useEffect(() => {
    if (mode === 'campaign') loadLevel();
  }, [mode, currentLevel, loadLevel]);

  const handleTyping = async (e) => {
    if (isFinished) return;
    const val = e.target.value;
    const lastChar = val.slice(-1);
    const expectedChar = text[val.length - 1];

    setActiveKey(lastChar.toLowerCase());
    setTimeout(() => setActiveKey(null), 150);

    if (val.length > input.length) {
      if (lastChar === expectedChar) playSound('correct');
      else playSound('error');
    }

    if (!startTime && val.length === 1) setStartTime(Date.now());
    setInput(val);

    const time = (Date.now() - startTime) / 60000;
    const words = val.length / 5;
    setWpm(Math.round(words / (time || 0.001)));
    
    let correct = 0;
    for (let i = 0; i < val.length; i++) if (val[i] === text[i]) correct++;
    const acc = Math.round((correct / val.length) * 100) || 100;
    setAccuracy(acc);

    if (val.length >= text.length) {
      setIsFinished(true);
      await handleLevelComplete(acc);
    }
  };

  const handleLevelComplete = async (acc) => {
    let stars = 0;
    if (acc === 100) stars = 3;
    else if (acc >= 95) stars = 2;
    else if (acc >= 90) stars = 1;
    
    setResultStars(stars);

    if (stars === 3) {
      const newStreak = perfectStreak + 1;
      setPerfectStreak(newStreak);
      if (newStreak >= 5) {
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#F97316', '#FFFFFF'] });
        await supabase.from('profiles').update({ streak_points: (user.streak_points || 0) + 1 }).eq('id', user.id);
        alert("🔥 REWARD: +1 Streak Freeze Point Acquired!");
        setPerfectStreak(0);
      } else {
        confetti({ particleCount: 50 });
      }
    } else {
      setPerfectStreak(0);
    }

    if (stars >= 1 && currentLevel === maxLevel) {
      const nextLevel = maxLevel + 1;
      await supabase.from('profiles').update({ typing_level: nextLevel }).eq('id', user.id);
      setMaxLevel(nextLevel);
    }
  };

  const jumpLevel = (direction) => {
    if (direction === 'prev' && currentLevel > 1) setCurrentLevel(c => c - 1);
    if (direction === 'next' && currentLevel < maxLevel) setCurrentLevel(c => c + 1);
  };

  const startBalloonGame = () => {
    setGameActive(true); setBalloonScore(0); setBalloonLives(3); setBalloons([]); setInput('');
    if (gameInputRef.current) gameInputRef.current.focus();
  };

  useEffect(() => {
    if (!gameActive) return;
    let lastTime = Date.now();
    const loop = () => {
      const now = Date.now();
      lastTime = now;

      setBalloons(prev => {
        if (Math.random() < 0.015) { 
          const word = WORDS_MED[Math.floor(Math.random() * WORDS_MED.length)];
          return [...prev, { id: Date.now(), word, x: Math.random() * 80 + 10, y: -10 }];
        }
        const nextBalloons = [];
        let livesLost = 0;
        prev.forEach(b => {
          const newY = b.y + (0.1 + (balloonScore * 0.005)); 
          if (newY > 95) livesLost++;
          else nextBalloons.push({ ...b, y: newY });
        });
        if (livesLost > 0) {
          setBalloonLives(l => {
             const newLives = l - livesLost;
             if (newLives <= 0) setGameActive(false);
             return newLives;
          });
          playSound('error');
        }
        return nextBalloons;
      });
      if (gameActive) requestRef.current = requestAnimationFrame(loop);
    };
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameActive, balloonScore]);

  const handleBalloonInput = (e) => {
    const val = e.target.value.trim().toLowerCase();
    setInput(e.target.value); 
    const match = balloons.find(b => b.word.toLowerCase() === val);
    if (match) {
      playSound('correct');
      setBalloons(prev => prev.filter(b => b.id !== match.id));
      setBalloonScore(s => s + 1);
      setInput(''); 
    }
  };

  const getFingerClass = (keyChar) => {
    const zone = KEY_ZONES[keyChar.toLowerCase()];
    const baseClass = isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-500';
    if (!zone) return baseClass; 
    
    const nextChar = text[input.length]?.toLowerCase();
    
    if (nextChar === keyChar.toLowerCase()) {
      if (zone.includes('pinky')) return 'bg-pink-500 text-white shadow-[0_0_15px_#ec4899] border-pink-400 scale-110';
      if (zone.includes('ring')) return 'bg-blue-500 text-white shadow-[0_0_15px_#3b82f6] border-blue-400 scale-110';
      if (zone.includes('middle')) return 'bg-emerald-500 text-white shadow-[0_0_15px_#10b981] border-emerald-400 scale-110';
      return 'bg-orange-500 text-white shadow-[0_0_15px_#f97316] border-orange-400 scale-110';
    }
    
    if (activeKey === keyChar.toLowerCase()) return 'bg-white text-slate-900 scale-95 border-white';
    return baseClass;
  };

  const renderText = () => {
    return text.split('').map((char, index) => {
      let color = isDarkMode ? "text-slate-600" : "text-slate-300";
      let bg = "";
      let glow = "";
      
      if (index < input.length) {
        if (input[index] === char) {
            color = isDarkMode ? "text-cyan-400" : "text-blue-600";
            glow = isDarkMode ? "drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "";
        } else { 
            color = "text-red-500"; 
            bg = "bg-red-500/20"; 
        }
      } else if (index === input.length) {
        bg = isDarkMode ? "bg-cyan-500/20 border-b-2 border-cyan-400" : "bg-blue-500/20 border-b-2 border-blue-400"; 
        color = isDarkMode ? "text-white" : "text-slate-900";
      }
      return <span key={index} className={`${color} ${bg} ${glow} transition-all duration-75 px-[1px] rounded-sm`}>{char}</span>;
    });
  };

  const theme = {
      bg: isDarkMode ? 'bg-slate-900' : 'bg-white',
      border: isDarkMode ? 'border-slate-800' : 'border-slate-200',
      text: isDarkMode ? 'text-white' : 'text-slate-900',
      subText: isDarkMode ? 'text-slate-400' : 'text-slate-500',
  };

  return (
    <div className={`max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-8`}>
      
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/20 text-white">
            <Keyboard size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
              Neural Typer 2.0
            </h2>
            <p className={`text-[10px] font-bold uppercase tracking-[0.3em] ${theme.subText}`}>
              Level {currentLevel} • {perfectStreak}/5 Perfect Streak
            </p>
          </div>
        </div>
        <div className="flex gap-4">
           <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-3 rounded-xl transition-all ${soundEnabled ? 'bg-indigo-600 text-white' : `${isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-400'}`}`}>
             {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
           </button>
           <div className={`p-1.5 rounded-2xl border flex ${theme.bg} ${theme.border}`}>
             <button onClick={() => setMode('campaign')} className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${mode === 'campaign' ? 'bg-cyan-600 text-white shadow-lg' : theme.subText}`}>Campaign</button>
             <button onClick={() => setMode('games')} className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${mode === 'games' ? 'bg-pink-600 text-white shadow-lg' : theme.subText}`}>Games</button>
           </div>
        </div>
      </div>

      {mode === 'campaign' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${theme.bg} ${theme.border}`}>
               <div><p className={`text-[10px] font-bold uppercase tracking-widest ${theme.subText}`}>Velocity</p><p className={`text-3xl font-black ${theme.text}`}>{wpm}</p></div>
               <Activity className={theme.subText} />
            </div>
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${theme.bg} ${theme.border}`}>
               <div><p className={`text-[10px] font-bold uppercase tracking-widest ${theme.subText}`}>Precision</p><p className={`text-3xl font-black ${theme.text}`}>{accuracy}%</p></div>
               <Target className={theme.subText} />
            </div>
            <div className="md:col-span-2 bg-gradient-to-r from-orange-500 to-red-600 p-4 rounded-2xl text-white relative overflow-hidden flex items-center justify-between shadow-lg shadow-orange-500/20">
               <div className="relative z-10 w-full">
                 <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-[10px] uppercase tracking-widest opacity-90">Streak Freeze Progress</p>
                    <span className="font-black text-xs bg-white/20 px-2 py-0.5 rounded">{perfectStreak}/5</span>
                 </div>
                 <div className="flex gap-1.5 h-2">
                   {[1,2,3,4,5].map(i => (
                     <div key={i} className={`flex-1 rounded-full transition-all duration-500 ${i <= perfectStreak ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-black/20'}`} />
                   ))}
                 </div>
               </div>
               <Flame className="absolute -right-4 -bottom-4 text-white/10 rotate-12" size={80} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className={`p-4 rounded-xl border-2 transition-all ${currentLevel <= 30 ? 'border-cyan-500 bg-cyan-500/10' : `${isDarkMode ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-100'} opacity-60`}`}>
               <div className={`flex justify-between ${isDarkMode ? 'text-white' : 'text-slate-800'}`}><p className="font-black uppercase text-xs">Sector 1: Basics</p>{currentLevel <= 30 && <Unlock size={14} className="text-cyan-500"/>}</div>
               <p className={`text-[10px] ${theme.subText}`}>Levels 1-30</p>
             </div>
             <div className={`p-4 rounded-xl border-2 transition-all ${maxLevel >= 31 ? (currentLevel > 30 && currentLevel <= 60 ? 'border-blue-500 bg-blue-500/10' : theme.border) : `${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-100'} opacity-40 grayscale`}`}>
               <div className={`flex justify-between ${isDarkMode ? 'text-white' : 'text-slate-800'}`}><p className="font-black uppercase text-xs">Sector 2: Fluency</p>{maxLevel < 31 && <Lock size={14}/>}</div>
               <p className={`text-[10px] ${theme.subText}`}>Levels 31-60</p>
             </div>
             <div className={`p-4 rounded-xl border-2 transition-all ${maxLevel >= 61 ? (currentLevel > 60 ? 'border-purple-500 bg-purple-500/10' : theme.border) : `${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-100'} opacity-40 grayscale`}`}>
               <div className={`flex justify-between ${isDarkMode ? 'text-white' : 'text-slate-800'}`}><p className="font-black uppercase text-xs">Sector 3: Mastery</p>{maxLevel < 61 && <Lock size={14}/>}</div>
               <p className={`text-[10px] ${theme.subText}`}>Levels 61-100</p>
             </div>
          </div>

          <div className={`flex items-center justify-between p-4 rounded-2xl shadow-sm border mt-4 ${theme.bg} ${theme.border}`}>
             <button onClick={() => jumpLevel('prev')} disabled={currentLevel <= 1} className={`p-2 rounded-lg disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 ${theme.text}`}><ChevronLeft/></button>
             <div className="text-center">
               <h3 className={`text-2xl font-black uppercase ${theme.text}`}>Level {currentLevel}</h3>
               <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.subText}`}>Max Unlocked: {maxLevel}</p>
             </div>
             <button onClick={() => jumpLevel('next')} disabled={currentLevel >= maxLevel} className={`p-2 rounded-lg disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 ${theme.text}`}><ChevronRight/></button>
          </div>

          <div className={`relative p-10 md:p-14 rounded-[2.5rem] shadow-2xl border min-h-[200px] flex flex-col justify-center text-center mt-4 transition-colors duration-500 ${isDarkMode ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-100'}`}>
            {isFinished ? (
               <div className="animate-in zoom-in space-y-6">
                 <div className="flex justify-center gap-4">
                   {[...Array(3)].map((_, i) => (
                     <Star key={i} size={48} className={`transition-all duration-500 ${i < resultStars ? 'fill-yellow-400 text-yellow-500 scale-110 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]' : 'text-slate-700'}`} />
                   ))}
                 </div>
                 <div>
                    <h3 className={`text-3xl font-black uppercase ${theme.text}`}>{resultStars === 3 ? 'Perfect Sync' : resultStars > 0 ? 'Passed' : 'Sync Failed'}</h3>
                    <p className={`font-bold mt-2 ${theme.subText}`}>Accuracy: {accuracy}% • WPM: {wpm}</p>
                 </div>
                 <div className="flex justify-center gap-4">
                    <button onClick={loadLevel} className="bg-slate-700 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-slate-600 transition-all flex items-center gap-2"><RefreshCw size={18}/> Re-Attempt</button>
                    {(resultStars > 0 && currentLevel < maxLevel) && (
                      <button onClick={() => jumpLevel('next')} className="bg-cyan-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"><FastForward size={18}/> Next Level</button>
                    )}
                 </div>
               </div>
            ) : (
              <>
                 <div className="font-mono text-xl md:text-2xl leading-loose tracking-wide mb-8 break-words select-none pointer-events-none text-left opacity-90">{renderText()}</div>
                 <textarea ref={inputRef} value={input} onChange={handleTyping} className="absolute inset-0 w-full h-full opacity-0 cursor-text resize-none" autoFocus spellCheck="false" />
                 
                 {!startTime && (
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className={`font-black text-xs uppercase tracking-[0.3em] animate-pulse px-6 py-3 rounded-full border shadow-lg backdrop-blur-sm ${isDarkMode ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' : 'text-blue-500 border-blue-200 bg-blue-50'}`}>
                       Tap to Initialize
                     </div>
                   </div>
                 )}
              </>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 mt-8 opacity-90 select-none">
            {KEYBOARD_ROWS.map((row, rIdx) => (
              <div key={rIdx} className="flex gap-1.5">
                {row.map((key) => <div key={key} className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg border-b-4 font-bold text-sm uppercase transition-all duration-75 ${getFingerClass(key)}`}>{key}</div>)}
              </div>
            ))}
            <div className="flex gap-1.5 w-full justify-center">
               <div className={`w-40 md:w-64 h-8 md:h-10 rounded-lg border-b-4 transition-all duration-75 ${text[input.length] === ' ' ? 'bg-orange-500 border-orange-400' : isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-300 bg-white'}`}></div>
            </div>
          </div>
        </>
      )}

      {mode === 'games' && (
        <div className="bg-slate-900 rounded-[2.5rem] p-4 h-[600px] relative overflow-hidden border-4 border-pink-500/30 shadow-2xl">
           {!gameActive ? (
             <div className="absolute inset-0 z-20 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center text-center">
               <Gamepad2 size={64} className="text-pink-500 mb-4" />
               <h3 className="text-4xl font-black uppercase text-white mb-2">Aerial Defense</h3>
               <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-8">Type falling words before impact</p>
               <button onClick={startBalloonGame} className="bg-pink-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all">Start Mission</button>
             </div>
           ) : (
             <>
               <div className="absolute top-4 left-4 z-10 bg-slate-900/80 px-4 py-2 rounded-xl border border-white/10">
                 <p className="text-white font-black text-xl">Score: {balloonScore}</p>
                 <div className="flex gap-1 text-red-500">{[...Array(balloonLives)].map((_,i) => <span key={i}>❤️</span>)}</div>
               </div>
               <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 w-2/3 max-w-md">
                 <input ref={gameInputRef} autoFocus value={input} onChange={handleBalloonInput} className="w-full bg-slate-800/90 text-white text-center font-bold uppercase p-4 rounded-2xl border-2 border-pink-500/50 outline-none placeholder-slate-600 focus:border-pink-500 transition-all shadow-[0_0_30px_rgba(236,72,153,0.3)]" placeholder="TYPE HERE..." />
               </div>
               {balloons.map(b => (
                 <div key={b.id} className="absolute bg-white text-slate-900 px-3 py-1 rounded-full font-bold text-xs shadow-[0_0_15px_rgba(255,255,255,0.5)] border-2 border-pink-500 animate-in zoom-in" style={{ left: `${b.x}%`, top: `${b.y}%` }}>
                   {b.word}<div className="absolute left-1/2 top-full h-4 w-[1px] bg-white/50"></div>
                 </div>
               ))}
               <div className="absolute bottom-0 w-full h-2 bg-pink-500/50 shadow-[0_0_20px_#ec4899]"></div>
             </>
           )}
        </div>
      )}
    </div>
  );
}
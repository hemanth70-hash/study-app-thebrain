import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Keyboard, RefreshCw, Activity, CheckCircle, Target, 
  Zap, Lock, Database, FastForward, Award, Volume2, VolumeX
} from 'lucide-react';
import confetti from 'canvas-confetti';

// --- CONFIGURATION ---
const SOUND_PATHS = {
  correct: '/sounds/bubble.mp3',
  error: '/sounds/thud.mp3'
};

// --- KEYBOARD MAP (Finger Zones) ---
// Pinky(P), Ring(R), Middle(M), Index(I)
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

// --- LEVEL CONTENT GENERATOR ---
const WORDS_EASY = ["node", "grid", "data", "code", "sync", "flux", "core", "byte", "neon", "link"];
const WORDS_MED = ["network", "system", "neural", "access", "protocol", "encrypt", "server", "matrix", "vector", "signal"];
const WORDS_HARD = ["synchronization", "infrastructure", "authentication", "cryptography", "decentralized", "architecture", "implementation", "functionality"];

const generateLevelText = (level) => {
  const difficulty = Math.ceil(level / 10); 
  let words = [];
  const length = 10 + difficulty * 2; 

  for (let i = 0; i < length; i++) {
    if (level <= 10) words.push(WORDS_EASY[Math.floor(Math.random() * WORDS_EASY.length)]);
    else if (level <= 40) words.push(WORDS_MED[Math.floor(Math.random() * WORDS_MED.length)]);
    else words.push(WORDS_HARD[Math.floor(Math.random() * WORDS_HARD.length)]);
  }
  return words.join(" ");
};

export default function TypingMaster({ user }) {
  // Game State
  const [mode, setMode] = useState('campaign'); // 'campaign' or 'mock'
  const [level, setLevel] = useState(user.typing_level || 1);
  const [text, setText] = useState('');
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isFinished, setIsFinished] = useState(false);
  const [mockLoading, setMockLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeKey, setActiveKey] = useState(null); // For visual keyboard
  
  const inputRef = useRef(null);
  
  // Audio Refs (Preloaded)
  const audioCorrect = useRef(new Audio(SOUND_PATHS.correct));
  const audioError = useRef(new Audio(SOUND_PATHS.error));

  // --- INITIALIZATION ---
  const loadContent = useCallback(async () => {
    setIsFinished(false);
    setInput('');
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
    setActiveKey(null);

    if (mode === 'campaign') {
      setText(generateLevelText(level));
    } else {
      setMockLoading(true);
      const { data } = await supabase.from('mocks').select('questions').limit(5);
      
      if (data && data.length > 0) {
        const randomMock = data[Math.floor(Math.random() * data.length)];
        let questions = typeof randomMock.questions === 'string' ? JSON.parse(randomMock.questions) : randomMock.questions;
        if (questions && questions.length > 0) {
          const q = questions[Math.floor(Math.random() * questions.length)];
          const cleanText = (q.questionText || "Neural sync failed.").replace(/<[^>]*>?/gm, '');
          setText(cleanText);
        }
      } else {
        setText("No mock data available. Please initialize database content.");
      }
      setMockLoading(false);
    }
    
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [mode, level]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // --- PLAY SOUND HELPER ---
  const playSound = (type) => {
    if (!soundEnabled) return;
    const audio = type === 'correct' ? audioCorrect.current : audioError.current;
    audio.currentTime = 0; // Reset to allow rapid fire
    audio.play().catch(e => console.log("Audio play prevented:", e));
  };

  // --- TYPING LOGIC ---
  const handleChange = async (e) => {
    if (isFinished) return;
    const val = e.target.value;
    const lastChar = val.slice(-1);
    const expectedChar = text[val.length - 1];

    // Visual Keyboard Feedback
    setActiveKey(lastChar.toLowerCase());
    setTimeout(() => setActiveKey(null), 150);

    // Audio Feedback
    if (val.length > input.length) { // Only on adding char
      if (lastChar === expectedChar) playSound('correct');
      else playSound('error');
    }
    
    // Start Timer
    if (!startTime && val.length === 1) setStartTime(Date.now());

    setInput(val);

    // Metrics
    const timeElapsed = (Date.now() - startTime) / 60000;
    const wordCount = val.length / 5;
    const currentWpm = Math.round(wordCount / (timeElapsed || 0.001));
    setWpm(currentWpm > 999 ? 999 : currentWpm);

    let correct = 0;
    for (let i = 0; i < val.length; i++) if (val[i] === text[i]) correct++;
    const acc = Math.round((correct / val.length) * 100) || 100;
    setAccuracy(acc);

    // Completion
    if (val === text) {
      setIsFinished(true);
      await handleCompletion(currentWpm, acc);
    }
  };

  // --- REWARDS SYSTEM ---
  const handleCompletion = async (finalWpm, finalAcc) => {
    if (typeof confetti === 'function') confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

    await supabase.from('typing_scores').insert([{ 
      username: user.username, wpm: finalWpm, accuracy: finalAcc 
    }]);

    if (mode === 'campaign' && finalAcc >= 90) {
      const nextLevel = level + 1;
      const pointsReward = 10;
      await supabase.from('profiles').update({ 
        typing_level: nextLevel,
        total_percentage_points: (user.total_percentage_points || 0) + pointsReward
      }).eq('id', user.id);
      setLevel(nextLevel);
    }
  };

  // --- VISUAL HELPERS ---
  const getFingerClass = (keyChar) => {
    const zone = KEY_ZONES[keyChar.toLowerCase()];
    if (!zone) return 'border-slate-700 text-slate-500'; // Default
    
    // Highlight next expected key
    const nextChar = text[input.length]?.toLowerCase();
    const isNext = nextChar === keyChar.toLowerCase();

    if (isNext) {
      if (zone.includes('pinky')) return 'bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.5)] border-pink-400 scale-110';
      if (zone.includes('ring')) return 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] border-blue-400 scale-110';
      if (zone.includes('middle')) return 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] border-emerald-400 scale-110';
      return 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)] border-orange-400 scale-110';
    }

    // Active Pressed State
    if (activeKey === keyChar.toLowerCase()) return 'bg-white text-slate-900 scale-95';

    return 'border-slate-700 text-slate-400 dark:bg-slate-800/50';
  };

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

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-lg shadow-pink-500/20 text-white">
            <Keyboard size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 drop-shadow-sm">
              Neural Typer
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
              Level {level} • Haptic Feedback Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-3 rounded-xl transition-all ${soundEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          
          <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <button onClick={() => setMode('campaign')} className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${mode === 'campaign' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Campaign</button>
            <button onClick={() => setMode('mock')} className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${mode === 'mock' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Mock Injector</button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:border-pink-500/50 transition-all">
          <div><p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Velocity</p><p className="text-4xl font-black text-slate-800 dark:text-white group-hover:text-pink-500 transition-colors">{wpm} <span className="text-sm text-slate-400">WPM</span></p></div>
          <Activity className="text-slate-300 group-hover:text-pink-500 transition-colors" size={32} />
        </div>
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:border-cyan-500/50 transition-all">
          <div><p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Precision</p><p className={`text-4xl font-black ${accuracy >= 95 ? 'text-green-500' : 'text-orange-500'}`}>{accuracy}%</p></div>
          <Target className="text-slate-300 group-hover:text-cyan-500 transition-colors" size={32} />
        </div>
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl shadow-xl shadow-indigo-600/20 text-white relative overflow-hidden">
          <div className="relative z-10"><p className="font-bold opacity-70 uppercase text-[10px] tracking-widest">Next Reward</p><p className="text-3xl font-black flex items-center gap-2 mt-1">+10 <span className="text-sm bg-white/20 px-2 py-0.5 rounded text-[10px]">POINTS</span></p></div>
          <Award className="absolute right-[-10px] bottom-[-10px] text-white/20 rotate-12" size={80} />
        </div>
      </div>

      {/* TYPING ARENA */}
      <div className="relative group">
        <div className={`absolute -inset-1 rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 ${mode === 'campaign' ? 'bg-pink-600' : 'bg-cyan-600'}`}></div>
        <div className="relative bg-white dark:bg-[#0f172a] p-10 md:p-14 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 min-h-[250px] flex flex-col justify-center">
          
          {mockLoading ? (
            <div className="flex flex-col items-center justify-center space-y-4 animate-pulse">
              <Database className="text-cyan-500" size={48} />
              <p className="text-cyan-500 font-black uppercase tracking-widest text-xs">Injecting Data from Mock DB...</p>
            </div>
          ) : isFinished ? (
            <div className="text-center space-y-6 animate-in zoom-in duration-300">
              <div className="inline-flex p-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-2"><CheckCircle size={64} /></div>
              <div>
                <h3 className="text-3xl font-black uppercase text-slate-800 dark:text-white">{mode === 'campaign' ? 'Level Complete' : 'Practice Sync Complete'}</h3>
                <p className="text-slate-500 dark:text-slate-400 font-bold mt-2">Stats uploaded to Neural Grid. {mode === 'campaign' && accuracy >= 90 && <span className="text-pink-500">+10 Leaderboard Points Awarded.</span>}</p>
              </div>
              <button onClick={loadContent} className={`mx-auto px-10 py-4 rounded-2xl font-black text-white uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 ${mode === 'campaign' ? 'bg-pink-600 hover:bg-pink-500' : 'bg-cyan-600 hover:bg-cyan-500'}`}>
                <FastForward size={20} fill="currentColor" /> {mode === 'campaign' ? 'Next Level' : 'Next Question'}
              </button>
            </div>
          ) : (
            <>
              <div className="font-mono text-2xl md:text-3xl leading-relaxed tracking-wide mb-8 break-words select-none pointer-events-none">{renderText()}</div>
              <textarea ref={inputRef} value={input} onChange={handleChange} className="absolute inset-0 w-full h-full opacity-0 cursor-text resize-none" autoFocus spellCheck="false" />
              {!startTime && <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-400 font-bold text-xs uppercase tracking-widest animate-bounce">Type to Initialize</div>}
            </>
          )}
        </div>
      </div>

      {/* VIRTUAL KEYBOARD (VISUAL AID) */}
      <div className="hidden md:flex flex-col items-center gap-2 mt-8 opacity-80 select-none">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex gap-1.5">
            {row.map((key) => (
              <div 
                key={key} 
                className={`
                  w-10 h-10 flex items-center justify-center rounded-lg border-b-4 font-bold text-sm uppercase transition-all duration-75
                  ${getFingerClass(key)}
                `}
              >
                {key}
              </div>
            ))}
          </div>
        ))}
        
        {/* Spacebar */}
        <div className="flex gap-1.5 w-full justify-center">
           <div className={`w-64 h-10 rounded-lg border-b-4 transition-all duration-75 ${text[input.length] === ' ' ? 'bg-orange-500 border-orange-400' : 'border-slate-700 dark:bg-slate-800/50'}`}></div>
        </div>

        {/* Finger Legend */}
        <div className="flex gap-6 mt-4 text-[9px] font-black uppercase tracking-widest text-slate-500">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-pink-500 rounded-full"></div> Pinky</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> Ring</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div> Middle</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-500 rounded-full"></div> Index</div>
        </div>
      </div>

    </div>
  );
}
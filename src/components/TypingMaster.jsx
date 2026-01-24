import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient'; // 🔥 Uses your MAIN connection
import { Keyboard, RefreshCw, Activity, CheckCircle } from 'lucide-react';

const PASSAGES = [
  "The neural network connects all nodes in the grid, ensuring seamless data transmission.",
  "Consistency is the key to unlocking the full potential of your cognitive capabilities.",
  "To master the art of coding is to master the art of thinking clearly.",
  "System integrity is paramount when dealing with sensitive neural data streams.",
  "The Reaper watches silently, waiting for the signal to purge inactive elements."
];

export default function TypingMaster({ user }) {
  const [text, setText] = useState('');
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isFinished, setIsFinished] = useState(false);
  const inputRef = useRef(null);

  const resetGame = () => {
    const randomText = PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
    setText(randomText);
    setInput('');
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
    setIsFinished(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  useEffect(() => {
    resetGame();
  }, []);

  const handleChange = (e) => {
    if (isFinished) return;
    const val = e.target.value;
    if (!startTime) setStartTime(Date.now());
    setInput(val);

    // Live Stats
    const words = val.length / 5;
    const minutes = (Date.now() - startTime) / 60000;
    const currentWpm = Math.round(words / (minutes || 0.001));
    setWpm(currentWpm);

    let correct = 0;
    for (let i = 0; i < val.length; i++) if (val[i] === text[i]) correct++;
    setAccuracy(Math.round((correct / val.length) * 100) || 100);

    // Completion Check
    if (val === text) {
      setIsFinished(true);
      saveScore(currentWpm, Math.round((correct / val.length) * 100));
    }
  };

  const saveScore = async (finalWpm, finalAcc) => {
    // 🔥 Saves to your MAIN database
    const { error } = await supabase
      .from('typing_scores')
      .insert([{ 
        username: user.username, 
        wpm: finalWpm, 
        accuracy: finalAcc 
      }]);
      
    if (error) console.error("Save failed:", error);
  };

  const renderText = () => {
    return text.split('').map((char, index) => {
      let color = "text-slate-500";
      if (index < input.length) {
        color = input[index] === char ? "text-green-400" : "text-red-500 bg-red-900/20";
      }
      return <span key={index} className={`${color} transition-colors`}>{char}</span>;
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-10 rounded-[2.5rem] shadow-2xl border border-indigo-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Keyboard size={120} className="text-white" /></div>
        <div className="relative z-10">
          <h2 className="text-4xl font-black uppercase tracking-tighter text-white mb-2 flex items-center gap-3">
            <Keyboard size={32} className="text-indigo-400" /> Neural Typer
          </h2>
          <p className="text-indigo-200 font-bold text-xs uppercase tracking-widest">
            Internal Node • WPM Synchronization Active
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Speed (WPM)</p>
            <p className="text-4xl font-black text-indigo-500">{wpm}</p>
          </div>
          <Activity className="text-indigo-500/50" size={32} />
        </div>
        <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Accuracy</p>
            <p className={`text-4xl font-black ${accuracy >= 95 ? 'text-green-500' : 'text-orange-500'}`}>{accuracy}%</p>
          </div>
          <CheckCircle className="text-green-500/50" size={32} />
        </div>
      </div>

      {/* Typing Field */}
      <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-700 relative">
        <div className="mb-6 font-mono text-xl md:text-2xl leading-relaxed tracking-wide select-none pointer-events-none">
          {renderText()}
        </div>

        {isFinished ? (
          <div className="flex flex-col items-center justify-center py-8 animate-in zoom-in">
            <div className="p-4 bg-green-500/20 rounded-full text-green-400 border border-green-500/50 mb-4">
              <CheckCircle size={48} />
            </div>
            <h3 className="text-2xl font-black uppercase text-white">Sequence Complete</h3>
            <button onClick={resetGame} className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 transition-all">
              <RefreshCw size={18} /> Reset
            </button>
          </div>
        ) : (
          <textarea 
            ref={inputRef}
            value={input}
            onChange={handleChange}
            className="w-full bg-transparent text-transparent caret-indigo-500 absolute top-0 left-0 h-full w-full outline-none resize-none p-8 font-mono text-xl"
            autoFocus
            spellCheck="false"
          />
        )}
      </div>
    </div>
  );
}
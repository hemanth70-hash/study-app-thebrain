import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Brain, Zap, ArrowRight, Lightbulb, RefreshCw } from 'lucide-react';

export default function QuickQuiz() {
  const [tickleQuestion, setTickleQuestion] = useState(null);
  const [showAns, setShowAns] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- ATOMIC FETCH LOGIC ---
  const fetchDailyTickle = useCallback(async () => {
    setLoading(true);
    setShowAns(false);
    try {
      const { data, error } = await supabase
        .from('daily_mocks')
        .select('questions')
        .eq('is_daily', true)
        .order('mock_date', { ascending: false })
        .limit(1)
        .maybeSingle(); // Prevents crash if no daily mock exists yet
      
      if (data && data.questions && data.questions.length > 0) {
        // Randomly pick one question from today's set to keep it fresh
        const randomIndex = Math.floor(Math.random() * data.questions.length);
        setTickleQuestion(data.questions[randomIndex]);
      } else {
        setTickleQuestion(null);
      }
    } catch (err) {
      console.error("Brain Tickle Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDailyTickle();
  }, [fetchDailyTickle]);

  // --- VIEW: LOADING STATE ---
  if (loading) return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-xl animate-pulse border-b-8 border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-2xl w-12 h-12"></div>
        <div className="h-6 w-32 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 w-full bg-gray-50 dark:bg-gray-700/50 rounded"></div>
        <div className="h-4 w-5/6 bg-gray-50 dark:bg-gray-700/50 rounded"></div>
      </div>
    </div>
  );

  // --- VIEW: NO DATA STATE ---
  if (!tickleQuestion) return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-xl border-b-8 border-gray-200 text-center">
      <Zap className="mx-auto text-gray-300 mb-4" size={40} />
      <p className="text-gray-400 font-black uppercase text-xs tracking-widest">No daily questions loaded yet.</p>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-xl border-b-8 border-orange-500 group transition-all hover:shadow-orange-200/20 dark:hover:shadow-none relative overflow-hidden">
      
      {/* Background Decor */}
      <Brain className="absolute -right-6 -top-6 text-orange-500/5 rotate-12" size={160} />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-2xl shadow-inner">
            <Brain size={24} />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Brain Tickle</h3>
        </div>
        <button 
          onClick={fetchDailyTickle}
          className="p-2 text-gray-300 hover:text-orange-500 transition-colors"
          title="New Question"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="space-y-8 relative z-10">
        <p className="text-xl font-bold text-gray-800 dark:text-gray-100 leading-snug tracking-tight">
          {tickleQuestion.question}
        </p>

        {showAns ? (
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-[2rem] border-2 border-green-100 dark:border-green-800/50 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-black uppercase text-[10px] mb-3 tracking-widest">
              <Lightbulb size={14} className="fill-current" /> Correct Solution
            </div>
            <p className="font-black text-green-700 dark:text-green-300 text-lg">
              {tickleQuestion.options[tickleQuestion.correct_option]}
            </p>
          </div>
        ) : (
          <button 
            onClick={() => setShowAns(true)}
            className="w-full flex items-center justify-center gap-3 py-5 bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-[1.5rem] font-black uppercase text-xs tracking-widest transition-all border border-transparent hover:border-orange-200 dark:hover:border-orange-900"
          >
            Reveal Answer <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
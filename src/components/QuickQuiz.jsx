import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Brain, Zap, ArrowRight, Lightbulb } from 'lucide-react';

export default function QuickQuiz() {
  const [tickleQuestion, setTickleQuestion] = useState(null);
  const [showAns, setShowAns] = useState(false);

  useEffect(() => {
    fetchDailyTickle();
  }, []);

  const fetchDailyTickle = async () => {
    const { data } = await supabase
      .from('daily_mocks')
      .select('questions')
      .eq('is_daily', true)
      .order('mock_date', { ascending: false })
      .limit(1)
      .single();
    
    if (data && data.questions) {
      // Pick a random question from today's set for the Brain Tickle
      const randomIndex = Math.floor(Math.random() * data.questions.length);
      setTickleQuestion(data.questions[randomIndex]);
    }
  };

  if (!tickleQuestion) return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-xl animate-pulse">
      <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
      <div className="h-4 w-full bg-gray-100 rounded mb-2"></div>
      <div className="h-4 w-2/3 bg-gray-100 rounded"></div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-xl border-b-8 border-orange-500 group transition-all hover:shadow-orange-200 dark:hover:shadow-none">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-2xl">
            <Brain size={24} />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Brain Tickle</h3>
        </div>
        <span className="text-[10px] font-black uppercase text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-lg">Quick IQ</span>
      </div>

      <div className="space-y-6">
        <p className="text-lg font-bold text-gray-700 dark:text-gray-200 leading-tight">
          {tickleQuestion.question}
        </p>

        {showAns ? (
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border border-green-100 dark:border-green-800 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-green-600 font-black uppercase text-[10px] mb-2">
              <Lightbulb size={14} /> Correct Solution
            </div>
            <p className="font-bold text-green-700 dark:text-green-400">
              {tickleQuestion.options[tickleQuestion.correct_option]}
            </p>
          </div>
        ) : (
          <button 
            onClick={() => setShowAns(true)}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gray-50 dark:bg-gray-900 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
          >
            Reveal Answer <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X, Quote, RefreshCw, Book } from 'lucide-react';

export default function DailyVerse({ isAdmin }) {
  const [verse, setVerse] = useState(null);
  const [isVisible, setIsVisible] = useState(true);

  const fetchRandomVerse = async () => {
    try {
      // 1. Get total count for randomness
      const { count } = await supabase.from('bible_verses').select('*', { count: 'exact', head: true });
      if (!count) return;

      const randomOffset = Math.floor(Math.random() * count);
      
      // 2. Fetch one random row
      const { data } = await supabase
        .from('bible_verses')
        .select('content, reference')
        .range(randomOffset, randomOffset)
        .single();

      if (data) setVerse(data);
    } catch (err) {
      console.error("Verse Fetch Error:", err);
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const isHiddenToday = localStorage.getItem('verseHidden') === today;

    // Show to everyone unless closed today; Admins (TheBrain/Hemanth) always see it
    if (isHiddenToday && !isAdmin) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }

    fetchRandomVerse();
  }, [isAdmin]);

  const handleClose = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('verseHidden', today);
    setIsVisible(false);
  };

  if (!isVisible || !verse) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border-2 border-blue-100 dark:border-gray-700 shadow-xl relative overflow-hidden group transition-all">
      <div className="absolute -right-2 -bottom-2 text-blue-500/5 rotate-12 group-hover:scale-110 transition-transform duration-500">
        <Quote size={120} />
      </div>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-xl">
            <Book size={16} /> Daily Bread
          </div>
          <div className="flex gap-2 text-gray-400">
            {isAdmin && (
              <button onClick={fetchRandomVerse} className="hover:text-blue-600 transition-colors">
                <RefreshCw size={16} />
              </button>
            )}
            <button onClick={handleClose} className="hover:text-red-600 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-800 dark:text-white leading-tight mb-4 italic">
          "{verse.content}"
        </p>
        <div className="flex items-center gap-3">
          <div className="h-1 w-12 bg-blue-600 rounded-full" />
          <span className="text-sm font-black text-blue-600 uppercase">
            {verse.reference}
          </span>
        </div>
      </div>
    </div>
  );
}
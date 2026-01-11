import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X, Quote, RefreshCw, Book } from 'lucide-react';

export default function DailyVerse({ isAdmin }) {
  const [verse, setVerse] = useState(null);
  const [isVisible, setIsVisible] = useState(true);

  // --- Optimized Random Fetch for 400+ Rows ---
  const fetchRandomVerse = async () => {
    try {
      // 1. Get total count of verses in the table
      const { count, error: countError } = await supabase
        .from('bible_verses')
        .select('*', { count: 'exact', head: true });

      if (countError || count === 0) return null;

      // 2. Pick a random number within that range
      const randomOffset = Math.floor(Math.random() * count);

      // 3. Fetch exactly one row at that random offset
      const { data, error } = await supabase
        .from('bible_verses')
        .select('content, reference')
        .range(randomOffset, randomOffset)
        .single();

      if (error) throw error;

      setVerse(data);
      return data;
    } catch (err) {
      console.error("Error fetching verse:", err.message);
      return null;
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const isHiddenToday = localStorage.getItem('verseHidden') === today;

    // Visibility Logic: Show to everyone unless they clicked "X" today
    // Admins always see it to allow for testing/refreshing
    if (isHiddenToday && !isAdmin) {
      setIsVisible(false);
      return;
    } else {
      setIsVisible(true);
    }

    const savedVerse = localStorage.getItem('dailyVerse');
    const savedDate = localStorage.getItem('verseDate');

    // Fetch new if it's a new day or no data exists
    if (savedDate !== today || !savedVerse) {
      fetchRandomVerse().then(newVerse => {
        if (newVerse) {
          localStorage.setItem('dailyVerse', JSON.stringify(newVerse));
          localStorage.setItem('verseDate', today);
          localStorage.setItem('verseHidden', 'false');
        }
      });
    } else {
      setVerse(JSON.parse(savedVerse));
    }
  }, [isAdmin]); // Re-run if admin status changes to show hidden elements

  const hideVerse = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('verseHidden', today);
    setIsVisible(false);
  };

  if (!isVisible || !verse) return null;

  return (
    <div className="relative overflow-hidden bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border-2 border-blue-100 dark:border-gray-700 shadow-xl group transition-all duration-300">
      {/* Background Icon Decoration */}
      <div className="absolute -right-2 -bottom-2 text-blue-500/5 rotate-12 group-hover:scale-110 transition-transform duration-500">
        <Quote size={120} />
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-xl">
            <Book size={16} /> Daily Bread
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <button 
                onClick={fetchRandomVerse} 
                className="p-2 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-blue-600"
                title="Refresh (Admin Only)"
              >
                <RefreshCw size={16} />
              </button>
            )}
            <button 
              onClick={hideVerse} 
              className="p-2 hover:bg-red-50 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-red-600"
              title="Hide for today"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <p className="text-2xl font-bold text-gray-800 dark:text-white leading-tight mb-4 italic">
          "{verse.content}"
        </p>
        
        <div className="flex items-center gap-3">
          <div className="h-1 w-12 bg-blue-600 rounded-full" />
          <span className="text-sm font-black text-blue-600 uppercase tracking-tighter">
            {verse.reference}
          </span>
        </div>
      </div>
    </div>
  );
}
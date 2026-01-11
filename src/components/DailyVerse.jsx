import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X, Quote, RefreshCw, Book } from 'lucide-react';

export default function DailyVerse({ isAdmin }) {
  const [verse, setVerse] = useState(null);
  const [isVisible, setIsVisible] = useState(true);

  const fetchRandomVerse = async () => {
    // This SQL trick picks a random row from the table efficiently
    const { data, error } = await supabase
      .from('bible_verses')
      .select('content, reference')
      .limit(1); 
      // Note: For true randomness with 400+ rows, we fetch a random offset
    
    if (data && data.length > 0) {
      // Logic to get a random index from the database
      const countRes = await supabase.from('bible_verses').select('*', { count: 'exact', head: true });
      const count = countRes.count;
      const randomOffset = Math.floor(Math.random() * count);
      
      const { data: randomData } = await supabase
        .from('bible_verses')
        .select('content, reference')
        .range(randomOffset, randomOffset)
        .single();

      setVerse(randomData);
      return randomData;
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const isHidden = localStorage.getItem('verseHidden') === today;

    if (isHidden && !isAdmin) {
      setIsVisible(false);
      return;
    }

    const savedVerse = localStorage.getItem('dailyVerse');
    const savedDate = localStorage.getItem('verseDate');

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
  }, [isAdmin]);

  const hideVerse = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('verseHidden', today);
    setIsVisible(false);
  };

  if (!isVisible || !verse) return null;

  return (
    <div className="relative overflow-hidden bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border-2 border-blue-100 dark:border-gray-700 shadow-xl group">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest">
          <Book size={16} /> Daily Bread
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button onClick={fetchRandomVerse} className="p-2 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400">
              <RefreshCw size={16} />
            </button>
          )}
          <button onClick={hideVerse} className="p-2 hover:bg-red-50 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400">
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
  );
}
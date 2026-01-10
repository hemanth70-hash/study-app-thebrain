import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Trophy } from 'lucide-react';

export default function Leaderboard() {
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    const fetchRankings = async () => {
      const { data } = await supabase
        .from('scores')
        .select(`
          percentage,
          profiles ( username )
        `)
        .order('percentage', { ascending: false })
        .limit(10);
      
      setRankings(data || []);
    };
    fetchRankings();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-blue-100">
      <div className="bg-blue-600 p-6 text-white flex items-center gap-3">
        <Trophy size={32} />
        <h2 className="text-2xl font-bold">Global Rankings</h2>
      </div>
      <div className="p-4">
        {rankings.length > 0 ? rankings.map((row, index) => (
          <div key={index} className="flex justify-between items-center p-4 border-b last:border-0 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center gap-4">
              <span className={`text-lg font-bold w-8 ${index === 0 ? 'text-yellow-500' : 'text-gray-400'}`}>
                #{index + 1}
              </span>
              <span className="font-semibold text-lg">{row.profiles?.username}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-mono font-bold">
                {row.percentage?.toFixed(1)}%
              </span>
            </div>
          </div>
        )) : (
          <p className="text-center py-10 text-gray-500">No scores yet. Be the first to take a mock!</p>
        )}
      </div>
    </div>
  );
}
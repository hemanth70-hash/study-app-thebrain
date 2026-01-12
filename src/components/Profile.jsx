import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Award, BookOpen, Clock, Zap, Trash2, ShieldAlert } from 'lucide-react';

export default function Profile({ user }) {
  const [stats, setStats] = useState({ totalMocks: 0, avgScore: 0, history: [] });
  const [loading, setLoading] = useState(true);

  // --- 1. ATOMIC FETCH LOGIC ---
  const fetchUserStats = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    
    // Define the 24-hour cutoff
    const cutOff = new Date();
    cutOff.setHours(cutOff.getHours() - 24);

    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Logic Fix: Handle potential NULL values for is_daily
      const visibleHistory = data.filter(item => {
        // If it's a regular mock or is_daily is null/undefined, keep it permanently
        if (item.is_daily === false || item.is_daily === null) return true;
        
        // If it's a daily mock, check the 24h timer
        const itemDate = new Date(item.created_at);
        return itemDate > cutOff;
      });

      const avg = visibleHistory.length > 0 
        ? visibleHistory.reduce((acc, curr) => acc + curr.percentage, 0) / visibleHistory.length 
        : 0;

      setStats({
        totalMocks: visibleHistory.length,
        avgScore: avg.toFixed(1),
        history: visibleHistory
      });
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  // --- 2. DELETE HISTORY FEATURE ---
  const clearHistory = async () => {
    const confirmation = window.confirm("The Brain, are you sure you want to wipe your neural records? This will delete all permanent and temporary scores.");
    if (confirmation) {
      const { error } = await supabase
        .from('scores')
        .delete()
        .eq('user_id', user.id);
      
      if (!error) {
        alert("History Wiped.");
        fetchUserStats();
      }
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg border-b-4 border-blue-500 flex items-center gap-4">
          <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-2xl text-blue-600"><BookOpen /></div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400">Total Exams</p>
            <h4 className="text-2xl font-bold dark:text-white">{stats.totalMocks}</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg border-b-4 border-green-500 flex items-center gap-4">
          <div className="p-4 bg-green-100 dark:bg-green-900 rounded-2xl text-green-600"><Award /></div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400">Avg Accuracy</p>
            <h4 className="text-2xl font-bold dark:text-white">{stats.avgScore}%</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg border-b-4 border-purple-500 flex items-center gap-4">
          <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-2xl text-purple-600"><Zap /></div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400">User Rank</p>
            <h4 className="text-2xl font-bold dark:text-white uppercase tracking-tighter">
              {stats.totalMocks > 10 ? 'Elite' : 'Student'}
            </h4>
          </div>
        </div>
      </div>

      {/* EXAM HISTORY TABLE */}
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
            <Clock size={20} className="text-blue-600" /> Neural History
          </h3>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded-lg">
            Dailies expire in 24h
          </span>
        </div>

        <div className="p-6 overflow-x-auto min-h-[300px]">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 text-blue-600">
               <div className="w-8 h-8 border-4 border-t-transparent border-blue-600 rounded-full animate-spin mb-4"></div>
               <p className="font-black uppercase text-xs tracking-widest">Retrieving Records...</p>
             </div>
          ) : stats.history.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest border-b dark:border-gray-700">
                  <th className="pb-4">Exam Title</th>
                  <th className="pb-4">Date & Time</th>
                  <th className="pb-4">Score</th>
                  <th className="pb-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {stats.history.map((item, i) => (
                  <tr key={item.id || i} className="hover:bg-blue-50/30 dark:hover:bg-gray-900 transition-colors group">
                    <td className="py-4 font-bold text-sm dark:text-gray-200">
                      <div className="flex flex-col">
                        {item.mock_title}
                        {item.is_daily && (
                          <span className="text-[8px] text-orange-500 font-black uppercase tracking-tighter flex items-center gap-1">
                            <Zap size={8} /> Temporary Daily Record
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-xs text-gray-500 font-medium italic">
                      {new Date(item.created_at).toLocaleDateString()} • {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td className="py-4 font-black text-blue-600 group-hover:scale-110 transition-transform origin-left">
                      {item.percentage}%
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        item.percentage >= 50 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {item.percentage >= 50 ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-20">
              <ShieldAlert className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No neural history detected.</p>
            </div>
          )}
        </div>
      </div>

      {/* DANGER ZONE */}
      <div className="flex justify-end">
        <button 
          onClick={clearHistory}
          className="flex items-center gap-2 text-red-400 hover:text-red-600 text-xs font-black uppercase tracking-widest p-4 transition-colors"
        >
          <Trash2 size={16} /> Wipe Neural Records
        </button>
      </div>
    </div>
  );
}
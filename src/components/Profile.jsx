import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Award, BookOpen, Clock, Zap, Trash2, ShieldAlert, Loader2, TrendingUp } from 'lucide-react';

export default function Profile({ user }) {
  const [stats, setStats] = useState({ totalMocks: 0, avgScore: 0, history: [] });
  const [loading, setLoading] = useState(true);

  // --- 1. ATOMIC FETCH LOGIC: SYNC WITH NEURAL GRID ---
  const fetchUserStats = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    
    // Define the 24-hour cutoff for temporary daily records
    const cutOff = new Date();
    cutOff.setHours(cutOff.getHours() - 24);

    try {
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // FILTER LOGIC:
        // Regular mocks (is_daily: false/null) stay forever.
        // Daily mocks (is_daily: true) expire from view after 24h.
        const visibleHistory = data.filter(item => {
          if (item.is_daily === false || item.is_daily === null) return true;
          const itemDate = new Date(item.created_at);
          return itemDate > cutOff;
        });

        // Calculate average accuracy from visible history
        const avg = visibleHistory.length > 0 
          ? visibleHistory.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / visibleHistory.length 
          : 0;

        setStats({
          totalMocks: visibleHistory.length,
          avgScore: avg.toFixed(1),
          history: visibleHistory
        });
      }
    } catch (err) {
      console.error("Neural History Sync Error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  // --- 2. SECURITY: WIPE NEURAL RECORDS ---
  const clearHistory = async () => {
    const confirmation = window.confirm("The Brain, are you sure you want to wipe your neural records? This will delete all permanent and temporary scores.");
    if (confirmation) {
      const { error } = await supabase
        .from('scores')
        .delete()
        .eq('user_id', user.id);
      
      if (!error) {
        alert("Neural Records Wiped.");
        fetchUserStats();
      } else {
        alert("Error during wipe procedure.");
      }
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      
      {/* --- STATS OVERVIEW CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-xl border-b-8 border-blue-500 flex items-center gap-6 group transition-all hover:scale-105">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 group-hover:rotate-12 transition-transform">
            <BookOpen size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total Exams</p>
            <h4 className="text-3xl font-black dark:text-white tracking-tighter">{stats.totalMocks}</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-xl border-b-8 border-green-500 flex items-center gap-6 group transition-all hover:scale-105">
          <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-2xl text-green-600 group-hover:rotate-12 transition-transform">
            <Award size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Neural Accuracy</p>
            <h4 className="text-3xl font-black dark:text-white tracking-tighter">{stats.avgScore}%</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-xl border-b-8 border-purple-500 flex items-center gap-6 group transition-all hover:scale-105">
          <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-2xl text-purple-600 group-hover:rotate-12 transition-transform">
            <Zap size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Portal Rank</p>
            <h4 className="text-3xl font-black dark:text-white tracking-tighter uppercase">
              {stats.totalMocks > 15 ? 'Elite' : 'Aspirant'}
            </h4>
          </div>
        </div>
      </div>

      {/* --- NEURAL HISTORY TABLE --- */}
      <div className="bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl overflow-hidden border border-blue-50 dark:border-gray-700">
        <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <Clock size={24} className="text-blue-600" />
            <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Neural History</h3>
          </div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border dark:border-gray-700 shadow-sm">
            Dailies Expire: 24H
          </span>
        </div>

        <div className="p-8 overflow-x-auto min-h-[400px]">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-24 text-blue-600">
               <Loader2 className="animate-spin mb-4" size={48} />
               <p className="font-black uppercase tracking-widest text-xs">Retrieving Neural Data...</p>
             </div>
          ) : stats.history.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b dark:border-gray-700">
                  <th className="pb-6 px-4">Subject/Title</th>
                  <th className="pb-6 px-4">Timestamp</th>
                  <th className="pb-6 px-4">Accuracy</th>
                  <th className="pb-6 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {stats.history.map((item, i) => (
                  <tr key={item.id || i} className="hover:bg-blue-50/30 dark:hover:bg-gray-900/50 transition-all group">
                    <td className="py-6 px-4 font-bold text-gray-800 dark:text-gray-200">
                      <div className="flex flex-col">
                        <span className="text-lg tracking-tight group-hover:text-blue-600 transition-colors">
                            {item.mock_title || "Unnamed Mock"}
                        </span>
                        {item.is_daily && (
                          <span className="text-[8px] text-orange-500 font-black uppercase tracking-widest flex items-center gap-1 mt-1">
                            <Zap size={8} className="fill-current" /> Daily Streak Entry
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-6 px-4 text-xs text-gray-500 font-bold uppercase tracking-widest">
                      {new Date(item.created_at).toLocaleDateString()}
                      <span className="block opacity-50 mt-1 font-medium">
                        {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </td>
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-2xl text-blue-600">{item.percentage}%</span>
                        <TrendingUp size={14} className={item.percentage >= 50 ? 'text-green-500' : 'text-red-500'} />
                      </div>
                    </td>
                    <td className="py-6 px-4 text-right">
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                        item.percentage >= 50 
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' 
                        : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                      }`}>
                        {item.percentage >= 50 ? 'Validated' : 'Retake Required'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 opacity-40">
              <ShieldAlert size={64} className="text-gray-300 mb-4" />
              <p className="text-gray-400 font-black uppercase text-xs tracking-widest">No Neural History Detected</p>
            </div>
          )}
        </div>
      </div>

      {/* --- DANGER ZONE: DATA MANAGEMENT --- */}
      <div className="flex justify-end pt-6">
        <button 
          onClick={clearHistory}
          className="flex items-center gap-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-transparent hover:border-red-100"
        >
          <Trash2 size={16} /> Wipe Neural Grid
        </button>
      </div>
    </div>
  );
}
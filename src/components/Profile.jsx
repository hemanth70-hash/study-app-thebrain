import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { User, Award, BookOpen, BarChart3, Clock, Zap } from 'lucide-react';

export default function Profile({ user }) {
  const [stats, setStats] = useState({ totalMocks: 0, avgScore: 0, history: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      setLoading(true);
      
      // 1. Get the timestamp for 24 hours ago
      const cutOff = new Date();
      cutOff.setHours(cutOff.getHours() - 24);

      // 2. Fetch all scores
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // 3. Apply The Brain's Filter: Permanent vs 24h Daily
        const visibleHistory = data.filter(item => {
          if (!item.is_daily) return true; // Keep regular mocks forever
          
          const itemDate = new Date(item.created_at);
          return itemDate > cutOff; // Keep daily only if < 24h old
        });

        // 4. Calculate Stats based on visible history
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
    };

    fetchUserStats();
  }, [user.id]);

  return (
    <div className="space-y-6 pb-20">
      {/* 1. STATS CARDS */}
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
            <h4 className="text-2xl font-bold dark:text-white">
              {stats.totalMocks > 20 ? 'Grandmaster' : stats.totalMocks > 5 ? 'Scholar' : 'Novice'}
            </h4>
          </div>
        </div>
      </div>

      {/* 2. EXAM HISTORY TABLE */}
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
            <Clock size={20} className="text-blue-600" /> Neural History
          </h3>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dailies expire in 24h</span>
        </div>

        <div className="p-6 overflow-x-auto">
          {loading ? (
             <div className="text-center py-10 animate-pulse font-bold text-gray-400">Retrieving Records...</div>
          ) : stats.history.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest border-b dark:border-gray-700">
                  <th className="pb-4">Exam Title</th>
                  <th className="pb-4">Date</th>
                  <th className="pb-4">Score</th>
                  <th className="pb-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {stats.history.map((item, i) => (
                  <tr key={i} className="hover:bg-blue-50/50 dark:hover:bg-gray-900 transition-colors group">
                    <td className="py-4 font-bold text-sm dark:text-gray-200">
                      <div className="flex flex-col">
                        {item.mock_title}
                        {item.is_daily && (
                          <span className="text-[8px] text-orange-500 font-black uppercase tracking-tighter">Temporary Record</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-xs text-gray-500 font-medium">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 font-black text-blue-600 group-hover:scale-110 transition-transform">
                      {item.percentage}%
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        item.percentage >= 50 
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30' 
                          : 'bg-red-100 text-red-600 dark:bg-red-900/30'
                      }`}>
                        {item.percentage >= 50 ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 font-medium italic">Your history is currently empty. Start a mock to build your profile.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
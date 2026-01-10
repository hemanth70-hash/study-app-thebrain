import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { User, Award, BookOpen, BarChart3 } from 'lucide-react';

export default function Profile({ user }) {
  const [stats, setStats] = useState({ totalMocks: 0, avgScore: 0, history: [] });

  useEffect(() => {
    const fetchUserStats = async () => {
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data.length > 0) {
        const avg = data.reduce((acc, curr) => acc + curr.percentage, 0) / data.length;
        setStats({
          totalMocks: data.length,
          avgScore: avg.toFixed(1),
          history: data
        });
      }
    };
    fetchUserStats();
  }, [user.id]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg border-b-4 border-blue-500 flex items-center gap-4">
          <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-2xl text-blue-600"><BookOpen /></div>
          <div>
            <p className="text-sm text-gray-500">Mocks Taken</p>
            <h4 className="text-2xl font-bold">{stats.totalMocks}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg border-b-4 border-green-500 flex items-center gap-4">
          <div className="p-4 bg-green-100 dark:bg-green-900 rounded-2xl text-green-600"><Award /></div>
          <div>
            <p className="text-sm text-gray-500">Average Score</p>
            <h4 className="text-2xl font-bold">{stats.avgScore}%</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg border-b-4 border-purple-500 flex items-center gap-4">
          <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-2xl text-purple-600"><BarChart3 /></div>
          <div>
            <p className="text-sm text-gray-500">User Level</p>
            <h4 className="text-2xl font-bold">{stats.totalMocks > 5 ? 'Pro' : 'Rookie'}</h4>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold">Exam History</h3>
        </div>
        <div className="p-6">
          {stats.history.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-sm uppercase">
                  <th className="pb-4">Date</th>
                  <th className="pb-4">Score</th>
                  <th className="pb-4">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {stats.history.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                    <td className="py-4 text-sm">{new Date(item.created_at).toLocaleDateString()}</td>
                    <td className="py-4 font-bold">{item.percentage}%</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.percentage >= 50 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {item.percentage >= 50 ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500 py-10">No history found. Complete a mock test to see your stats!</p>
          )}
        </div>
      </div>
    </div>
  );
}
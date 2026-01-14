import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Award, BookOpen, Clock, Zap, Trash2, ShieldAlert, 
  Loader2, TrendingUp, Camera, Save, RefreshCw 
} from 'lucide-react';

export default function Profile({ user }) {
  const [profile, setProfile] = useState(user);
  const [stats, setStats] = useState({ totalMocks: 0, avgScore: 0, history: [] });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [gender, setGender] = useState(user.gender || 'neutral');

  // --- 1. AVATAR LOGIC (ANTI-BEARD PROTECTION) ---
  const getAvatarUrl = (seed, g) => {
    // We use 'avataaars' for human styles. 'bottts' for neutral/default.
    const style = g === 'neutral' ? 'bottts' : 'avataaars';
    // 🔥 Security: facialHairProbability=0 for female prevents beard generation.
    const params = g === 'female' ? '&topProbability=100&facialHairProbability=0' : '';
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}${params}`;
  };

  // --- 2. ATOMIC FETCH: SYNC WITH NEURAL GRID ---
  const fetchUserStats = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    
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
        // Logic: Regular mocks stay, Daily mocks expire after 24h
        const visibleHistory = data.filter(item => {
          if (item.is_daily === false || item.is_daily === null) return true;
          const itemDate = new Date(item.created_at);
          return itemDate > cutOff;
        });

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

  // --- 3. IDENTITY UPDATE ---
  const handleUpdate = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ gender: gender })
      .eq('id', user.id);

    if (!error) {
      alert("Identity Refined, The Brain.");
      // Refresh local user state if needed
    }
    setIsSaving(false);
  };

  // --- 4. SECURITY: WIPE RECORDS ---
  const clearHistory = async () => {
    const confirmation = window.confirm("The Brain, wipe your neural records permanently?");
    if (confirmation) {
      const { error } = await supabase.from('scores').delete().eq('user_id', user.id);
      if (!error) { alert("Grid Purged."); fetchUserStats(); }
    }
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      
      {/* --- IDENTITY SECTION --- */}
      <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-2xl border-b-8 border-blue-600 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="relative group">
            <div className="w-40 h-40 rounded-[2.5rem] bg-gray-100 dark:bg-gray-900 flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-xl overflow-hidden">
              <img src={getAvatarUrl(user.username, gender)} alt="Avatar" className="w-32 h-32" />
            </div>
          </div>

          <div className="text-center md:text-left space-y-4">
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter dark:text-white">{user.username}</h2>
              <p className="text-blue-600 font-black text-[10px] uppercase tracking-[0.3em]">Portal Identity Verified</p>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {['male', 'female', 'neutral'].map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    gender === g ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                  }`}
                >
                  {g}
                </button>
              ))}
              <button 
                onClick={handleUpdate}
                className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-all active:scale-95"
              >
                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- STATS OVERVIEW --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-xl border-b-8 border-blue-500 flex items-center gap-6 group">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 group-hover:rotate-12 transition-transform">
            <BookOpen size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Exams Taken</p>
            <h4 className="text-3xl font-black dark:text-white tracking-tighter">{stats.totalMocks}</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-xl border-b-8 border-green-500 flex items-center gap-6 group">
          <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-2xl text-green-600 group-hover:rotate-12 transition-transform">
            <Award size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Avg Accuracy</p>
            <h4 className="text-3xl font-black dark:text-white tracking-tighter">{stats.avgScore}%</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-xl border-b-8 border-purple-500 flex items-center gap-6 group">
          <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-2xl text-purple-600 group-hover:rotate-12 transition-transform">
            <Zap size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Portal Rank</p>
            <h4 className="text-3xl font-black dark:text-white tracking-tighter uppercase">{stats.totalMocks > 15 ? 'Elite' : 'Aspirant'}</h4>
          </div>
        </div>
      </div>

      {/* --- NEURAL HISTORY --- */}
      <div className="bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl overflow-hidden border border-blue-50 dark:border-gray-700">
        <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <Clock size={24} className="text-blue-600" />
            <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Neural History</h3>
          </div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border">Dailies Expire: 24H</span>
        </div>

        <div className="p-8 overflow-x-auto min-h-[300px]">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 text-blue-600">
               <Loader2 className="animate-spin mb-4" size={48} />
               <p className="font-black uppercase tracking-widest text-[10px]">Retrieving Grid Data...</p>
             </div>
          ) : stats.history.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest border-b dark:border-gray-700">
                  <th className="pb-6 px-4">Exam Details</th>
                  <th className="pb-6 px-4">Timestamp</th>
                  <th className="pb-6 px-4">Accuracy</th>
                  <th className="pb-6 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {stats.history.map((item, i) => (
                  <tr key={item.id || i} className="hover:bg-blue-50/30 transition-all group">
                    <td className="py-6 px-4">
                      <div className="flex flex-col">
                        <span className="text-lg font-bold dark:text-white tracking-tight">{item.mock_title}</span>
                        {item.is_daily && <span className="text-[8px] text-orange-500 font-black uppercase mt-1">Daily Entry</span>}
                      </div>
                    </td>
                    <td className="py-6 px-4 text-xs text-gray-500 font-bold uppercase">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-2xl text-blue-600">{item.percentage}%</span>
                        <TrendingUp size={14} className={item.percentage >= 50 ? 'text-green-500' : 'text-red-500'} />
                      </div>
                    </td>
                    <td className="py-6 px-4 text-right">
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${item.percentage >= 50 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {item.percentage >= 50 ? 'Passed' : 'Retake'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 opacity-40">
              <ShieldAlert size={64} className="text-gray-300 mb-4" />
              <p className="text-gray-400 font-black uppercase text-xs tracking-widest">No History Detected</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={clearHistory} className="flex items-center gap-2 text-red-400 hover:text-red-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 border-transparent hover:border-red-100 transition-all">
          <Trash2 size={16} /> Wipe History
        </button>
      </div>
    </div>
  );
}
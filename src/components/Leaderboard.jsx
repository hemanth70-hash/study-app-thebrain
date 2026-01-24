import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Trophy, Medal, Flame, ShieldCheck, GraduationCap, Target, Loader2, Award, Crown, Skull, AlertTriangle } from 'lucide-react';

export default function Leaderboard() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. NEURAL RANK HELPER ---
  const getNeuralRank = (totalPoints, totalExams) => {
    const gpa = totalExams > 0 ? (totalPoints / totalExams) : 0;
    if (gpa >= 95) return { label: 'Architect', color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30 border-purple-200' };
    if (gpa >= 85) return { label: 'Genius', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 border-blue-200' };
    if (gpa >= 70) return { label: 'Specialist', color: 'text-green-600 bg-green-50 dark:bg-green-900/30 border-green-200' };
    if (gpa >= 50) return { label: 'Scholar', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 border-orange-200' };
    return { label: 'Aspirant', color: 'text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200' };
  };

  // --- 2. THE TRUTH ENGINE (Visual Streak Fix) ---
  const calculateRealStreak = (user) => {
    if (!user.last_mock_date || user.streak_count === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastDate = new Date(user.last_mock_date);
    lastDate.setHours(0, 0, 0, 0);

    if (lastDate.getTime() < yesterday.getTime()) {
      return 0; // Streak is dead visually
    }
    return user.streak_count;
  };

  // --- 🔥 3. INACTIVITY WATCHDOG ---
  const getInactivityStatus = (lastDateStr) => {
    if (!lastDateStr) return { status: 'dead', days: 99 };
    
    const last = new Date(lastDateStr);
    const today = new Date();
    const diffTime = Math.abs(today - last);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Reaper deletes at 60 days
    if (diffDays > 60) return { status: 'purge', days: diffDays }; 
    // Danger Zone (30-60 days)
    if (diffDays > 30) return { status: 'danger', days: diffDays, remaining: 60 - diffDays };
    // Warning Zone (7-30 days)
    if (diffDays > 7) return { status: 'warning', days: diffDays };
    
    return { status: 'active', days: 0 };
  };

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .not('username', 'ilike', 'thebrain') 
          .order('streak_count', { ascending: false })
          .order('total_exams_completed', { ascending: false })
          .limit(25);

        if (!error && data) {
          const civilianNodes = data.filter(u => u.username.toLowerCase() !== 'thebrain');
          setRankings(civilianNodes);
        }
      } catch (err) {
        console.error("Leaderboard Sync Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 text-blue-600 animate-pulse">
      <Loader2 className="animate-spin mb-4" size={48} />
      <p className="font-black uppercase tracking-widest text-[10px]">Filtering Neural Standings...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      
      {/* --- PRESTIGE HEADER --- */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden">
        <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12">
          <Trophy size={250} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-5xl font-black uppercase tracking-tighter mb-2 italic">The Hall of Fame</h2>
            <p className="text-blue-100 font-bold uppercase text-[10px] tracking-[0.4em] opacity-80">Public Standings (Admin Identity Hidden)</p>
          </div>
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20">
             <Award size={32} className="text-yellow-400" />
             <div className="text-left">
               <p className="text-[8px] font-black uppercase tracking-widest">Global Nodes</p>
               <p className="text-xl font-black">{rankings.length}</p>
             </div>
          </div>
        </div>
      </div>

      {/* --- RANKINGS TABLE --- */}
      <div className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl border dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left border-separate border-spacing-y-4">
            <thead>
              <tr className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                <th className="px-6 pb-2 text-center">Rank</th>
                <th className="px-6 pb-2">User Identity</th>
                <th className="px-6 pb-2">Goal Profile</th>
                <th className="px-6 pb-2 text-center">Neural GPA</th>
                <th className="px-6 pb-2 text-right">Streak</th>
              </tr>
            </thead>
            <tbody>
              {rankings.length > 0 ? rankings.map((u, index) => {
                const nodeRank = getNeuralRank(u.total_percentage_points, u.total_exams_completed);
                const gpa = u.total_exams_completed > 0 
                  ? (u.total_percentage_points / u.total_exams_completed).toFixed(1) 
                  : 0;
                
                // Real-time calculations
                const displayStreak = calculateRealStreak(u);
                const health = getInactivityStatus(u.last_mock_date);

                // Top 3 Styling Logic
                let rankDisplay;
                let rankStyle = "bg-gray-50 dark:bg-gray-900/40 border-transparent";
                
                if (index === 0) {
                    rankStyle = "bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800";
                    rankDisplay = <Crown size={32} className="text-yellow-500 fill-yellow-500 animate-bounce" />;
                } else if (index === 1) {
                    rankStyle = "bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700";
                    rankDisplay = <Medal size={28} className="text-gray-400 fill-gray-200" />;
                } else if (index === 2) {
                    rankStyle = "bg-orange-50/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800";
                    rankDisplay = <Medal size={28} className="text-amber-700 fill-amber-500" />;
                } else {
                    rankDisplay = <span className="font-black text-2xl text-gray-300 italic">#{index + 1}</span>;
                }

                return (
                  <tr key={u.id} className={`group transition-all hover:scale-[1.01] rounded-2xl border-2 ${rankStyle}`}>
                    
                    {/* Rank */}
                    <td className="px-6 py-4 rounded-l-[2rem]">
                      <div className="flex flex-col items-center justify-center h-full">
                        {rankDisplay}
                      </div>
                    </td>

                    {/* Identity & Status */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 border-2 p-0.5 overflow-hidden ${index === 0 ? 'border-yellow-400 shadow-yellow-200 shadow-lg' : 'border-blue-100 dark:border-gray-700'}`}>
                          <img 
                            src={`https://api.dicebear.com/7.x/${u.gender === 'neutral' ? 'bottts' : 'avataaars'}/svg?seed=${u.avatar_seed || u.username}${u.gender === 'female' ? '&facialHairProbability=0' : ''}`} 
                            className="w-full h-full object-contain"
                            alt="Node"
                          />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-black dark:text-white uppercase text-sm tracking-tight">{u.username}</span>
                            
                            {/* 🔥 INACTIVITY BADGES */}
                            {health.status === 'warning' && (
                              <span className="bg-yellow-100 text-yellow-600 border border-yellow-200 px-2 py-0.5 rounded text-[8px] font-black uppercase flex items-center gap-1">
                                <AlertTriangle size={8} /> Inactive
                              </span>
                            )}
                            {health.status === 'danger' && (
                              <span className="bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded text-[8px] font-black uppercase flex items-center gap-1 animate-pulse">
                                <Skull size={8} /> Deletion in {health.remaining}d
                              </span>
                            )}
                          </div>

                          <div className={`mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-widest w-fit shadow-sm ${nodeRank.color}`}>
                            <ShieldCheck size={10} />
                            {nodeRank.label}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Goal */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          <GraduationCap size={14} className="text-blue-500" /> {u.education || 'Student'}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-red-500 uppercase tracking-widest">
                          <Target size={14} /> {u.preparing_for || 'Syncing...'}
                        </div>
                      </div>
                    </td>

                    {/* GPA */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col">
                        <span className={`font-black text-2xl ${parseFloat(gpa) >= 75 ? 'text-green-600' : 'text-blue-600'}`}>{gpa}%</span>
                        <span className="text-[8px] font-black text-gray-400 uppercase">Lifetime Avg</span>
                      </div>
                    </td>

                    {/* Streak */}
                    <td className="px-6 py-4 text-right rounded-r-[2rem]">
                      <div className={`inline-flex items-center gap-3 bg-white dark:bg-gray-800 px-5 py-2.5 rounded-2xl border-2 shadow-sm transition-all ${
                        displayStreak > 0 
                        ? 'border-orange-100 dark:border-orange-900/30' 
                        : 'border-gray-100 dark:border-gray-700 opacity-60 grayscale'
                      }`}>
                        <Flame size={18} className={`${displayStreak > 0 ? 'text-orange-500 fill-orange-500 animate-pulse' : 'text-gray-300'}`} />
                        <span className={`font-black text-xl ${displayStreak > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                          {displayStreak} 
                        </span>
                      </div>
                    </td>

                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="5" className="text-center py-20 text-gray-400 font-black uppercase text-xs opacity-50">
                    No civilian nodes identified.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
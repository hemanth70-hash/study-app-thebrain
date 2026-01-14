import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Trophy, Medal, Flame, ShieldCheck, GraduationCap, Target, Loader2, Award } from 'lucide-react';

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

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        // 🔥 STEALTH LOGIC: .neq('username', 'thebrain') filters the Admin from public view
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('username', 'thebrain') 
          .order('streak_count', { ascending: false })
          .order('total_exams_completed', { ascending: false })
          .limit(20);

        if (!error && data) setRankings(data);
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
                
                return (
                  <tr key={u.id} className={`group transition-all hover:scale-[1.01] ${index === 0 ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-900/40'} rounded-2xl`}>
                    
                    {/* 1. POSITION & AVATAR */}
                    <td className="px-6 py-4 rounded-l-[2rem]">
                      <div className="flex flex-col items-center">
                        <span className={`font-black text-2xl italic ${index === 0 ? 'text-yellow-500' : 'text-gray-300'}`}>
                          {index === 0 ? <Medal size={28} /> : `#${index + 1}`}
                        </span>
                      </div>
                    </td>

                    {/* 2. IDENTITY */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-gray-700 p-0.5 overflow-hidden">
                          <img 
                            src={`https://api.dicebear.com/7.x/${u.gender === 'neutral' ? 'bottts' : 'avataaars'}/svg?seed=${u.avatar_seed || u.username}${u.gender === 'female' ? '&facialHairProbability=0' : ''}`} 
                            className="w-full h-full object-contain"
                            alt="Node"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black dark:text-white uppercase text-sm tracking-tight">{u.username}</span>
                          <div className={`mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-widest w-fit shadow-sm ${nodeRank.color}`}>
                            <ShieldCheck size={10} />
                            {nodeRank.label}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 3. FOCUS & GOAL */}
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

                    {/* 4. GPA */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col">
                        <span className={`font-black text-2xl ${parseFloat(gpa) >= 75 ? 'text-green-600' : 'text-blue-600'}`}>{gpa}%</span>
                        <span className="text-[8px] font-black text-gray-400 uppercase">Lifetime Avg</span>
                      </div>
                    </td>

                    {/* 5. STREAK */}
                    <td className="px-6 py-4 text-right rounded-r-[2rem]">
                      <div className="inline-flex items-center gap-3 bg-white dark:bg-gray-800 px-5 py-2.5 rounded-2xl border-2 border-orange-100 dark:border-gray-700 shadow-sm group-hover:border-orange-500 transition-all">
                        <Flame size={18} className={`${u.streak_count > 0 ? 'text-orange-500 fill-orange-500 animate-pulse' : 'text-gray-200'}`} />
                        <span className={`font-black text-xl ${u.streak_count > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{u.streak_count || 0}</span>
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
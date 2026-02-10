import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Trophy, Medal, Flame, ShieldCheck, GraduationCap, Target, Loader2, Award, Crown, Skull, AlertTriangle, ArrowDown } from 'lucide-react';

export default function Leaderboard({ isDarkMode }) {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. NEURAL RANK HELPER ---
  const getNeuralRank = (gpa) => {
    if (gpa >= 95) return { label: 'Architect', color: isDarkMode ? 'text-purple-400 bg-purple-900/30 border-purple-800' : 'text-purple-500 bg-purple-50 border-purple-200' };
    if (gpa >= 85) return { label: 'Genius', color: isDarkMode ? 'text-blue-400 bg-blue-900/30 border-blue-800' : 'text-blue-600 bg-blue-50 border-blue-200' };
    if (gpa >= 70) return { label: 'Specialist', color: isDarkMode ? 'text-green-400 bg-green-900/30 border-green-800' : 'text-green-600 bg-green-50 border-green-200' };
    if (gpa >= 50) return { label: 'Scholar', color: isDarkMode ? 'text-orange-400 bg-orange-900/30 border-orange-800' : 'text-orange-600 bg-orange-50 border-orange-200' };
    return { label: 'Aspirant', color: isDarkMode ? 'text-slate-400 bg-slate-800 border-slate-700' : 'text-slate-400 bg-slate-50 border-slate-200' };
  };

  // --- 2. THE TRUTH ENGINE (Calculates Real Streak) ---
  const calculateRealStreak = (user) => {
    if (!user.last_mock_date || user.streak_count === 0) return 0;
    
    // Normalize dates to midnight to avoid timezone issues
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastDate = new Date(user.last_mock_date);
    lastDate.setHours(0, 0, 0, 0);
    
    // If last test was older than yesterday, streak is dead.
    if (lastDate.getTime() < yesterday.getTime()) return 0;
    
    return user.streak_count;
  };

  // --- 3. INACTIVITY WATCHDOG ---
  const getInactivityStatus = (lastDateStr) => {
    if (!lastDateStr) return { status: 'dead', days: 99 };
    const last = new Date(lastDateStr);
    const today = new Date();
    const diffTime = Math.abs(today - last);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 60) return { status: 'purge', days: diffDays }; 
    if (diffDays > 30) return { status: 'danger', days: diffDays, remaining: 60 - diffDays };
    if (diffDays > 7) return { status: 'warning', days: diffDays };
    return { status: 'active', days: 0 };
  };

  // --- 4. SORTING LOGIC ---
  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*');

        if (!error && data) {
          // 1. Filter out Admin
          let processed = data.filter(u => u.username?.toLowerCase() !== 'thebrain');

          // 2. Attach computed metrics (Real Streak & GPA)
          processed = processed.map(u => {
            const realStreak = calculateRealStreak(u);
            const gpa = u.total_exams_completed > 0 
              ? (u.total_percentage_points / u.total_exams_completed)
              : 0;
            return { ...u, realStreak, gpa };
          });

          // 3. SORT: Active Streak > GPA > Total Exams
          processed.sort((a, b) => {
            // Priority 1: Is Streak Active? (Active goes top, 0 drops to bottom)
            const aActive = a.realStreak > 0;
            const bActive = b.realStreak > 0;
            if (aActive && !bActive) return -1;
            if (!aActive && bActive) return 1;

            // Priority 2: GPA (Higher is better)
            if (b.gpa !== a.gpa) return b.gpa - a.gpa;

            // Priority 3: Tie-breaker (Volume)
            return b.total_exams_completed - a.total_exams_completed;
          });

          setRankings(processed.slice(0, 50)); // Top 50
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
      <p className="font-black uppercase tracking-widest text-[10px]">Calibrating Neural Hierarchies...</p>
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
            <h2 className="text-5xl font-black uppercase tracking-tighter mb-2 italic">Global Ranking</h2>
            <p className="text-blue-100 font-bold uppercase text-[10px] tracking-[0.4em] opacity-80">Rank by Streak Status & GPA</p>
          </div>
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20">
              <Award size={32} className="text-yellow-400" />
              <div className="text-left">
                <p className="text-[8px] font-black uppercase tracking-widest">Active Nodes</p>
                <p className="text-xl font-black">{rankings.filter(r => r.realStreak > 0).length}</p>
              </div>
          </div>
        </div>
      </div>

      {/* --- RANKINGS TABLE --- */}
      <div className={`rounded-[3rem] shadow-2xl border transition-colors duration-500 overflow-hidden ${
        isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'
      }`}>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left border-separate border-spacing-y-4">
            <thead>
              <tr className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                <th className="px-6 pb-2 text-center">Rank</th>
                <th className="px-6 pb-2">User Identity</th>
                <th className="px-6 pb-2">Goal Profile</th>
                <th className="px-6 pb-2 text-center">Neural GPA</th>
                <th className="px-6 pb-2 text-right">Streak Status</th>
              </tr>
            </thead>
            <tbody>
              {rankings.length > 0 ? rankings.map((u, index) => {
                const nodeRank = getNeuralRank(u.gpa);
                const health = getInactivityStatus(u.last_mock_date);
                const isDropped = u.realStreak === 0;

                let rankDisplay;
                let rankStyle = isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-gray-50 border-transparent";
                
                // Styling Logic
                if (isDropped) {
                    rankStyle = isDarkMode ? "bg-red-900/10 border-red-900/30 opacity-60" : "bg-red-50 border-red-100 opacity-60";
                    rankDisplay = <ArrowDown size={20} className="text-red-500" />;
                } else if (index === 0) {
                    rankStyle = isDarkMode ? "bg-yellow-900/10 border-yellow-800" : "bg-yellow-50/50 border-yellow-200";
                    rankDisplay = <Crown size={32} className="text-yellow-500 fill-yellow-500 animate-bounce" />;
                } else if (index === 1) {
                    rankStyle = isDarkMode ? "bg-slate-800/80 border-slate-600" : "bg-slate-100/50 border-slate-200";
                    rankDisplay = <Medal size={28} className="text-slate-400 fill-slate-200" />;
                } else if (index === 2) {
                    rankStyle = isDarkMode ? "bg-orange-900/10 border-orange-800" : "bg-orange-50/50 border-orange-200";
                    rankDisplay = <Medal size={28} className="text-amber-700 fill-amber-500" />;
                } else {
                    rankDisplay = <span className="font-black text-2xl text-slate-300 italic">#{index + 1}</span>;
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
                        <div className={`w-12 h-12 rounded-2xl border-2 p-0.5 overflow-hidden ${
                          isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-blue-100'
                        } ${index === 0 && !isDropped ? 'border-yellow-400 shadow-yellow-200 shadow-lg' : ''}`}>
                          <img 
                            src={`https://api.dicebear.com/7.x/${u.gender === 'neutral' ? 'bottts' : 'avataaars'}/svg?seed=${u.avatar_seed || u.username}${u.gender === 'female' ? '&facialHairProbability=0' : ''}`} 
                            className={`w-full h-full object-contain ${isDropped ? 'grayscale' : ''}`}
                            alt="Node"
                          />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className={`font-black uppercase text-sm tracking-tight ${isDropped ? 'text-slate-500 line-through' : isDarkMode ? 'text-white' : 'text-slate-900'}`}>{u.username}</span>
                            
                            {/* Health Badges */}
                            {health.status === 'warning' && (
                              <span className="bg-yellow-100 text-yellow-600 border border-yellow-200 px-2 py-0.5 rounded text-[8px] font-black uppercase flex items-center gap-1">
                                <AlertTriangle size={8} /> Idle
                              </span>
                            )}
                            {health.status === 'danger' && (
                              <span className="bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded text-[8px] font-black uppercase flex items-center gap-1 animate-pulse">
                                <Skull size={8} /> Purge Soon
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

                    {/* Goal Profile */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
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
                        <span className={`font-black text-2xl ${u.gpa >= 75 ? 'text-green-600' : 'text-blue-600'}`}>{u.gpa.toFixed(1)}%</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase">Avg Score</span>
                      </div>
                    </td>

                    {/* Streak */}
                    <td className="px-6 py-4 text-right rounded-r-[2rem]">
                      <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl border-2 shadow-sm transition-all ${
                        u.realStreak > 0 
                        ? (isDarkMode ? 'bg-slate-700 border-orange-900/30' : 'bg-white border-orange-100') 
                        : (isDarkMode ? 'bg-slate-800 border-slate-600 opacity-60' : 'bg-white border-slate-100 opacity-60')
                      }`}>
                        <Flame size={18} className={`${u.realStreak > 0 ? 'text-orange-500 fill-orange-500 animate-pulse' : 'text-slate-300'}`} />
                        <span className={`font-black text-xl ${u.realStreak > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
                          {u.realStreak > 0 ? u.realStreak : "DROPPED"} 
                        </span>
                      </div>
                    </td>

                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="5" className="text-center py-20 text-slate-400 font-black uppercase text-xs opacity-50">
                    No active nodes identified in the grid.
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
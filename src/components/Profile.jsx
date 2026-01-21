import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Award, BookOpen, Clock, Zap, Trash2, ShieldAlert, 
  Loader2, TrendingUp, Save, RefreshCw, Dice5, 
  ChevronDown, ChevronUp, GraduationCap, Target, Edit3, Activity, ShieldCheck, FileText, Download, Megaphone
} from 'lucide-react';

export default function Profile({ user }) {
  // --- CORE STATES ---
  const [stats, setStats] = useState({ history: [] });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showTools, setShowTools] = useState(false); 
  
  // --- IDENTITY & GOAL STATES ---
  const [gender, setGender] = useState(user.gender || 'neutral');
  const [currentSeed, setCurrentSeed] = useState(user.avatar_seed || user.username);
  const [education, setEducation] = useState(user.education || '');
  const [preparingFor, setPreparingFor] = useState(user.preparing_for || '');

  // --- 1. NEURAL GPA & RANK LOGIC ---
  const lifetimeGPA = user.total_exams_completed > 0 
    ? (user.total_percentage_points / user.total_exams_completed).toFixed(1) 
    : 0;

  const getNeuralRank = (gpa) => {
    if (gpa >= 95) return { label: 'Architect', color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30 border-purple-200' };
    if (gpa >= 85) return { label: 'Genius', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 border-blue-200' };
    if (gpa >= 70) return { label: 'Specialist', color: 'text-green-600 bg-green-50 dark:bg-green-900/30 border-green-200' };
    if (gpa >= 50) return { label: 'Scholar', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 border-orange-200' };
    return { label: 'Aspirant', color: 'text-gray-500 bg-gray-50 dark:bg-gray-800 border-gray-200' };
  };

  const rank = getNeuralRank(parseFloat(lifetimeGPA));

  // --- 2. AVATAR LOGIC ---
  const getAvatarUrl = (seed, g) => {
    const style = g === 'neutral' ? 'bottts' : 'avataaars';
    const params = g === 'female' ? '&topProbability=100&facialHairProbability=0' : '';
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}${params}`;
  };

  const shuffleAvatar = () => {
    const newSeed = Math.random().toString(36).substring(2, 10).toUpperCase();
    setCurrentSeed(newSeed);
  };

  // --- 3. PDF GENERATION LOGIC ---
  const downloadPDF = () => {
    if (!user.last_regular_result) return;
    const doc = new jsPDF();
    const result = user.last_regular_result;

    // Header
    doc.setFontSize(18);
    doc.text(`NEURAL PORTAL REPORT: ${user.username.toUpperCase()}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Mock: ${result.title} | Score: ${result.score}/${result.total} | ${new Date(result.timestamp).toLocaleDateString()}`, 14, 28);

    // Data Table
    const tableData = result.breakdown.map((item, index) => [
      index + 1,
      item.question.substring(0, 50) + "...",
      item.selected,
      item.actual,
      item.status
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['#', 'Question', 'Your Answer', 'Correct Answer', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
      styles: { fontSize: 8 },
    });

    doc.save(`Neural_Report_${user.username}_${Date.now()}.pdf`);
  };

  // --- 4. DATA SYNC ---
  const fetchUserStats = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setStats({ history: data });
    } catch (err) {
      console.error("Neural Sync Error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          gender: gender,
          avatar_seed: currentSeed,
          education: education,
          preparing_for: preparingFor
        })
        .eq('id', user.id);

      if (error) throw error;
      alert("Neural Identity Refined. Data synchronized.");
      setShowTools(false);
    } catch (err) {
      alert(`Sync Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // --- 5. ADMIN REQUEST LOGIC (New) ---
  const sendAdminRequest = async () => {
    const msg = window.prompt("Transmission to The Brain (Admin):");
    if (!msg) return;

    try {
      const { error } = await supabase.from('admin_requests').insert([{
        user_id: user.id, 
        user_name: user.username, 
        message: msg, 
        request_type: 'USER_REQUEST'
      }]);

      if (error) throw error;
      alert("Signal transmitted to The Brain.");
    } catch (err) {
      alert("Transmission Failed.");
    }
  };

  const clearHistory = async () => {
    if (window.confirm("Wipe all neural records permanently? This cannot be undone.")) {
      const { error } = await supabase.from('scores').delete().eq('user_id', user.id);
      // Also clear the last result slot
      await supabase.from('profiles').update({ last_regular_result: null }).eq('id', user.id);
      
      if (!error) { 
        fetchUserStats(); 
        alert("Grid Purged."); 
      }
    }
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      
      {/* --- IDENTITY HUB --- */}
      <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-2xl border-b-8 border-blue-600 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="relative group">
            <div className="w-44 h-44 rounded-[2.5rem] bg-gray-100 dark:bg-gray-900 flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-xl overflow-hidden">
              <img src={getAvatarUrl(currentSeed, gender)} alt="Avatar" className="w-36 h-36" />
            </div>
            <button 
              onClick={shuffleAvatar}
              className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-3 rounded-2xl shadow-lg hover:rotate-180 transition-all duration-500"
            >
              <Dice5 size={20} />
            </button>
          </div>

          <div className="text-center md:text-left flex-1 space-y-4">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <h2 className="text-5xl font-black uppercase tracking-tighter dark:text-white">{user.username}</h2>
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border-2 font-black text-[10px] uppercase tracking-widest shadow-sm transition-all ${rank.color}`}>
                <ShieldCheck size={14} />
                {rank.label}
              </div>
              <button 
                onClick={() => setShowTools(!showTools)}
                className="p-2 bg-blue-50 dark:bg-gray-700 rounded-full text-blue-600 hover:scale-110 transition-all"
              >
                {showTools ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </button>
            </div>
            
            <div className="space-y-4 max-w-sm mx-auto md:mx-0">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-transparent focus-within:border-blue-500/50 transition-all">
                <GraduationCap size={20} className="text-blue-500" />
                <div className="flex-1 text-left">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Education Background</p>
                  <input 
                    className="bg-transparent border-none outline-none focus:ring-0 text-sm font-bold uppercase tracking-widest w-full dark:text-white"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    placeholder="E.G. BSC COMPUTER SCIENCE"
                  />
                </div>
                <Edit3 size={14} className="text-gray-300" />
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-transparent focus-within:border-red-500/50 transition-all">
                <Target size={20} className="text-red-500" />
                <div className="flex-1 text-left">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest text-red-400">Target Goal</p>
                  <input 
                    className="bg-transparent border-none outline-none focus:ring-0 text-sm font-black uppercase tracking-widest w-full text-red-600 dark:text-red-400"
                    value={preparingFor}
                    onChange={(e) => setPreparingFor(e.target.value)}
                    placeholder="E.G. NEET / JEE 2026"
                  />
                </div>
                <Edit3 size={14} className="text-gray-300" />
              </div>
            </div>

            {showTools && (
              <div className="flex flex-wrap gap-2 mt-6 justify-center md:justify-start animate-in slide-in-from-top-4 duration-300">
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
                  disabled={isSaving}
                  className="bg-green-600 text-white px-8 py-2 rounded-xl hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg"
                >
                  {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  <span className="text-[10px] font-black uppercase">Sync Profile</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- LATEST MOCK ANALYSIS --- */}
      {user.last_regular_result && (
        <div className="bg-gradient-to-br from-indigo-900 to-blue-900 p-8 rounded-[32px] shadow-2xl text-white relative overflow-hidden animate-in slide-in-from-bottom-8">
          <div className="absolute top-0 right-0 p-32 bg-blue-500/20 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
          
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                <FileText size={32} className="text-blue-300" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-blue-300 tracking-widest">Latest Regular Mock</p>
                <h3 className="text-2xl font-black uppercase tracking-tight">{user.last_regular_result.title}</h3>
                <p className="text-[10px] font-bold opacity-60">{new Date(user.last_regular_result.timestamp).toLocaleString()}</p>
              </div>
            </div>
            
            <button 
              onClick={downloadPDF}
              className="flex items-center gap-2 bg-white text-blue-900 px-6 py-3 rounded-2xl font-black uppercase text-xs hover:scale-105 transition-all shadow-xl"
            >
              <Download size={16} /> Save PDF Report
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
            <div className="p-6 bg-black/20 rounded-3xl border border-white/5 backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase text-blue-300 mb-2">Final Score</p>
              <p className="text-4xl font-black">{user.last_regular_result.score} <span className="text-lg opacity-50">/ {user.last_regular_result.total}</span></p>
            </div>
            <div className="p-6 bg-black/20 rounded-3xl border border-white/5 backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase text-green-300 mb-2">Accuracy Rate</p>
              <p className="text-4xl font-black text-green-400">{user.last_regular_result.percentage}%</p>
            </div>
            <div className="p-6 bg-black/20 rounded-3xl border border-white/5 backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase text-orange-300 mb-2">Status</p>
              <p className="text-4xl font-black text-orange-400">ANALYZED</p>
            </div>
          </div>
        </div>
      )}

      {/* --- NEURAL ANALYTICS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-xl border-b-8 border-blue-500 flex items-center gap-6 group transition-all hover:scale-105">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 transition-transform group-hover:rotate-12">
            <BookOpen size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Lifetime Exams</p>
            <h4 className="text-3xl font-black dark:text-white tracking-tighter">{user.total_exams_completed || 0}</h4>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 rounded-[2.5rem] shadow-xl text-white border-b-8 border-green-700 flex items-center gap-6 transition-all hover:scale-105">
          <div className="p-4 bg-white/20 rounded-2xl">
            <TrendingUp size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-white/70 tracking-widest">Neural GPA</p>
            <h4 className="text-3xl font-black tracking-tighter">{lifetimeGPA}%</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-xl border-b-8 border-purple-500 transition-all hover:scale-105">
          <div className="flex items-center gap-3 mb-4">
             <Activity size={24} className="text-purple-500" />
             <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Trend</p>
          </div>
          <div className="flex items-end gap-1.5 h-12">
             {stats.history.slice(0, 7).reverse().map((s, i) => (
               <div 
                 key={i} 
                 className="bg-purple-500/40 hover:bg-purple-600 w-full rounded-t-md transition-all duration-500 group relative cursor-help" 
                 style={{ height: `${s.percentage}%` }}
               >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-[8px] text-white px-1.5 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    {s.percentage}%
                  </div>
               </div>
             ))}
             {stats.history.length === 0 && <p className="text-[8px] text-gray-400 italic">No data yet</p>}
          </div>
        </div>
      </div>

      {/* --- NEURAL TRANSCRIPT TABLE --- */}
      <div className="bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl overflow-hidden border dark:border-gray-700">
        <div className="p-8 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <Clock size={24} className="text-blue-600" />
            <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Neural Transcript</h3>
          </div>
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/40 px-4 py-2 rounded-xl">Permanent Storage Enabled</span>
        </div>

        <div className="p-8 overflow-x-auto min-h-[300px]">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 text-blue-600">
               <Loader2 className="animate-spin mb-4" size={48} />
               <p className="font-black uppercase tracking-widest text-[10px]">Accessing History...</p>
             </div>
          ) : stats.history.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest border-b dark:border-gray-700">
                  <th className="pb-6 px-4">Exam Record</th>
                  <th className="pb-6 px-4">Date</th>
                  <th className="pb-6 px-4">Score</th>
                  <th className="pb-6 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {stats.history.map((item, i) => (
                  <tr key={item.id || i} className="hover:bg-blue-50/30 transition-all group">
                    <td className="py-6 px-4">
                      <div className="flex flex-col text-left">
                        <span className="text-lg font-bold dark:text-white tracking-tight">{item.mock_title}</span>
                        {item.is_daily && <span className="text-[8px] text-orange-500 font-black uppercase mt-1">Daily Sequence</span>}
                      </div>
                    </td>
                    <td className="py-6 px-4 text-xs text-gray-500 font-bold uppercase">{new Date(item.created_at).toLocaleDateString()}</td>
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-2xl text-blue-600">{item.percentage}%</span>
                        <TrendingUp size={14} className={item.percentage >= 50 ? 'text-green-500' : 'text-red-500'} />
                      </div>
                    </td>
                    <td className="py-6 px-4 text-right">
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${item.percentage >= 50 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {item.percentage >= 50 ? 'Validated' : 'Retake'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 opacity-40">
              <ShieldAlert size={64} className="text-gray-300 mb-4" />
              <p className="text-gray-400 font-black uppercase text-xs tracking-widest">No History Captured</p>
            </div>
          )}
        </div>
      </div>

      {/* --- 🔥 NEW: NEURAL UPLINK (ADMIN REQUEST) --- */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8 rounded-[2.5rem] shadow-xl border border-gray-700 relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight mb-2 flex items-center gap-2">
              <Megaphone size={24} className="text-yellow-400" /> Neural Uplink
            </h3>
            <p className="text-xs text-gray-400 font-bold leading-relaxed max-w-lg">
              Establish a direct line to Central Command (The Brain). Use this uplink for feature requests, bug reports, or urgent access issues.
            </p>
          </div>
          <button 
            onClick={sendAdminRequest}
            className="w-full md:w-auto bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest backdrop-blur-md border border-white/10 transition-all active:scale-95 shadow-2xl"
          >
            Establish Connection
          </button>
        </div>
        {/* Decor */}
        <div className="absolute top-0 right-0 p-24 bg-yellow-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 group-hover:bg-yellow-500/20 transition-colors"></div>
      </div>

      <div className="flex justify-end">
        <button onClick={clearHistory} className="flex items-center gap-2 text-red-400 hover:text-red-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 border-transparent hover:border-red-100 transition-all">
          <Trash2 size={16} /> Wipe Grid History
        </button>
      </div>
    </div>
  );
}
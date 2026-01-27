import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, CheckCircle, TrendingUp, Trophy, Target, Plus, 
  Flame, Download, FileText, X, Radio, ExternalLink, Globe, AlertTriangle
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function ChronosDashboard({ user }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [goals, setGoals] = useState([]);
  const [monthlyPlan, setMonthlyPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [newGoal, setNewGoal] = useState("");
  const [examDate, setExamDate] = useState("2026-08-01");
  const [hybridFeed, setHybridFeed] = useState([]);

  // --- 1. PERSISTENCE & HYBRID FEED ENGINE ---
  useEffect(() => {
    const storedGoals = localStorage.getItem('chronos_goals');
    const storedPlan = localStorage.getItem(`chronos_plan_${currentDate.getMonth()}_${currentDate.getFullYear()}`);
    
    if (storedGoals) setGoals(JSON.parse(storedGoals));
    if (storedPlan) setMonthlyPlan(JSON.parse(storedPlan)); 
    else setShowPlanModal(true);

    const fetchHybridFeed = async () => {
      // 1. Internal DB Feed
      const { data: internalData } = await supabase.from('victory_feed').select('*').order('created_at', { ascending: false }).limit(10);
      const internalLogs = internalData ? internalData.map(item => ({
        id: `int-${item.id}`, type: item.type, text: item.message, time: new Date(item.created_at).getTime(), source: 'INTERNAL'
      })) : [];

      // 2. External RSS (Times of India Education)
      try {
        const RSS_URL = "https://timesofindia.indiatimes.com/rssfeeds/913168846.cms"; 
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`);
        const json = await res.json();
        const externalLogs = json.items ? json.items.slice(0, 5).map((item, idx) => ({
          id: `ext-${idx}`, type: 'news', text: item.title, time: new Date(item.pubDate).getTime(), source: 'WEB', link: item.link
        })) : [];
        setHybridFeed([...internalLogs, ...externalLogs].sort((a, b) => b.time - a.time));
      } catch (e) { console.error("RSS Error", e); setHybridFeed(internalLogs); }
    };
    fetchHybridFeed();

    const channel = supabase.channel('victory_feed_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'victory_feed' }, (payload) => {
        const newItem = {
          id: `int-${payload.new.id}`, type: payload.new.type, text: payload.new.message, time: new Date(payload.new.created_at).getTime(), source: 'INTERNAL'
        };
        setHybridFeed(prev => [newItem, ...prev].slice(0, 20));
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => { localStorage.setItem('chronos_goals', JSON.stringify(goals)); }, [goals]);

  // --- 2. MATH ENGINE ---
  const totalPoints = user?.total_percentage_points || 0;
  const totalExams = user?.total_exams_completed || 1; 
  const currentGPA = parseFloat(Math.min((totalExams > 0 ? (totalPoints / totalExams) : 0), 100).toFixed(1));
  const targetGPA = 95.0;
  const daysToExam = Math.max(1, Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24)));
  const gap = Math.max(0, targetGPA - currentGPA);
  const requiredDailyGrowth = (gap / daysToExam).toFixed(2);
  const completedGoals = goals.filter(g => g.completed).length;
  const monthlyEfficiency = goals.length === 0 ? 0 : Math.round((completedGoals / goals.length) * 100);

  // --- 3. ADVANCED CALENDAR LOGIC ---
  const todayDay = currentDate.getDate();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  // Logic to calculate specific day status
  const getDayStatus = (day) => {
    const isToday = day === todayDay;
    const isFuture = day > todayDay;
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Check if this date matches the Exam Date
    if (dateStr === examDate) return { type: 'exam', label: 'TARGET DAY' };

    if (isFuture) return { type: 'future', label: 'LOCKED' };
    
    // Simulate Streak History (Active for last N days based on streak count)
    // In a real app, you'd check a daily_logs table. Here we approximate visually.
    const streak = user?.streak_count || 0;
    const dayDistance = todayDay - day;
    
    if (dayDistance >= 0 && dayDistance < streak) {
      // High Performance Variation (Every 3rd day is a "Peak" day)
      if (day % 3 === 0) return { type: 'peak', label: `HIGH SCORE: ${(currentGPA + Math.random()*5).toFixed(1)}%` };
      return { type: 'active', label: `STREAK DAY` };
    }

    return { type: 'inactive', label: 'NO LOGIN' };
  };

  // Actions
  const saveMonthlyPlan = (plan) => { localStorage.setItem(`chronos_plan_${currentDate.getMonth()}_${currentDate.getFullYear()}`, JSON.stringify(plan)); setMonthlyPlan(plan); setShowPlanModal(false); };
  const addGoal = () => { if(newGoal.trim()){ setGoals([...goals, { id: Date.now(), title: newGoal, date: new Date().toISOString().split('T')[0], completed: false }]); setNewGoal(""); }};
  const toggleGoal = (id) => { setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g)); };
  const downloadReport = () => {
    const w = window.open('', '', 'height=600,width=800');
    w.document.write(`<html><head><title>Report</title><style>body{font-family:monospace;padding:20px;}h1{border-bottom:2px solid black;}</style></head><body><h1>NEURAL REPORT: ${user.username}</h1><p>GPA: ${currentGPA}%</p><p>EFFICIENCY: ${monthlyEfficiency}%</p><hr/><h3>LOG</h3>${goals.map(g=>`<div>[${g.completed?'X':' '}] ${g.title}</div>`).join('')}</body></html>`);
    w.document.close(); w.print();
  };

  return (
    <div className="w-full min-h-screen p-4 md:p-8 font-sans text-slate-100 animate-in fade-in zoom-in duration-500">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Chronos Command</h1>
          <p className="text-blue-500 text-xs font-mono tracking-widest uppercase">
            {currentDate.toLocaleDateString('default', { month: 'long' })} PROTOCOL ACTIVE
          </p>
        </div>
        <button onClick={() => setShowReportModal(true)} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg border border-slate-700 transition-all shadow-lg group">
           <FileText size={16} className="group-hover:text-blue-400" /> <span className="text-xs font-bold uppercase">Report Card</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">

        {/* BLOCK 1: BALLISTICS */}
        <div className="lg:col-span-8 bg-[#0a0a0f] border border-slate-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[100px] rounded-full pointer-events-none"></div>
           <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                 <div><h2 className="text-2xl font-bold text-white mb-1">Victory Ballistics</h2><p className="text-slate-500 text-xs">Selection Probability Engine</p></div>
                 <div className="flex flex-col items-end"><label className="text-[9px] text-slate-500 uppercase font-bold mb-1">Target Date</label><input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="bg-slate-900 border border-slate-700 text-white text-xs px-3 py-1 rounded outline-none" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="p-5 bg-slate-900/50 rounded-2xl border border-slate-800"><p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-2">Neural GPA</p><div className="text-5xl font-black text-white">{currentGPA}<span className="text-lg text-slate-600">%</span></div></div>
                 <div className="p-5 bg-slate-900/50 rounded-2xl border border-red-900/30"><p className="text-[9px] text-red-400 uppercase font-bold tracking-widest mb-2">Deficit</p><div className="text-5xl font-black text-red-500">-{gap.toFixed(1)}</div></div>
                 <div className="p-5 bg-blue-900/10 rounded-2xl border border-blue-500/30"><p className="text-[9px] text-blue-300 uppercase font-bold tracking-widest mb-2">Required Gain</p><div className="flex items-end gap-2"><TrendingUp size={32} className="text-green-400 mb-2" /><div className="text-5xl font-black text-green-400">+{requiredDailyGrowth}</div></div></div>
              </div>
              <div className="mt-8"><div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700"><motion.div initial={{ width: 0 }} animate={{ width: `${currentGPA}%` }} className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_15px_cyan]" /></div></div>
           </div>
        </div>

        {/* BLOCK 2: HYBRID FEED */}
        <div className="lg:col-span-4 bg-[#0a0a0f] border border-slate-800 rounded-[2rem] p-6 shadow-xl flex flex-col h-[420px] overflow-hidden relative">
           <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800 bg-[#0a0a0f] z-10">
              <div className="flex items-center gap-3"><Radio size={18} className="text-red-500 animate-pulse" /><h3 className="font-black text-sm text-slate-200 uppercase tracking-widest">Global Intel</h3></div>
              <span className="text-[9px] text-slate-600 font-mono">LIVE UPLINK</span>
           </div>
           <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
              {hybridFeed.map((item) => (
                 <div key={item.id} className={`p-3 rounded-xl border-l-2 bg-slate-900/40 hover:bg-slate-800/60 transition-colors ${item.source === 'WEB' ? 'border-blue-500' : item.type === 'win' ? 'border-green-500' : item.type === 'streak' ? 'border-orange-500' : 'border-purple-500'}`}>
                    <div className="flex justify-between items-start mb-1">
                       <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded text-white flex items-center gap-1 ${item.source === 'WEB' ? 'bg-blue-600' : item.type === 'win' ? 'bg-green-600' : item.type === 'streak' ? 'bg-orange-600' : 'bg-purple-600'}`}>{item.source === 'WEB' ? <Globe size={8} /> : null} {item.source === 'WEB' ? 'INTERNET' : item.type.toUpperCase()}</span>
                       <span className="text-[9px] text-slate-600 font-mono">{new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-300 leading-snug mb-1">{item.text}</p>
                    {item.source === 'WEB' && <a href={item.link} target="_blank" rel="noreferrer" className="text-[9px] text-blue-400 flex items-center gap-1 hover:underline">Read Source <ExternalLink size={8} /></a>}
                 </div>
              ))}
              {hybridFeed.length === 0 && <div className="text-center text-xs text-slate-600 mt-10">Initializing Uplink...</div>}
           </div>
        </div>

        {/* BLOCK 3: INTERACTIVE CALENDAR */}
        <div className="lg:col-span-6 bg-[#0a0a0f] border border-slate-800 rounded-[2rem] p-8 shadow-xl">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-lg text-white flex items-center gap-2"><Calendar className="text-purple-500" /><span>Execution Grid</span></h3>
              {/* LEGEND */}
              <div className="flex gap-2 text-[9px] font-bold uppercase text-slate-500">
                 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-[#050508] border border-slate-700"></div> Future</div>
                 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-green-900"></div> Active</div>
                 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-green-500"></div> Peak</div>
                 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-red-600 animate-pulse"></div> Exam</div>
              </div>
           </div>
           
           <div className="grid grid-cols-7 gap-3">
              {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-center text-xs font-bold text-slate-600">{d}</div>)}
              {calendarDays.map(day => {
                 const status = getDayStatus(day);
                 
                 // Dynamic Styling based on Status
                 let cellStyle = "";
                 if (status.type === 'exam') cellStyle = "border-red-500 bg-red-900/50 text-red-200 animate-pulse shadow-[0_0_15px_red]";
                 else if (status.type === 'future') cellStyle = "border-transparent bg-[#050508] text-slate-800 cursor-not-allowed";
                 else if (status.type === 'peak') cellStyle = "border-green-400 bg-green-500 text-black shadow-[0_0_10px_green] font-black scale-105";
                 else if (status.type === 'active') cellStyle = "border-transparent bg-green-900/40 text-green-300";
                 else cellStyle = "border-transparent bg-slate-900 text-slate-600 hover:border-slate-700"; // Inactive

                 return (
                    <div key={day} className="relative group">
                       <div className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold border transition-all ${cellStyle}`}>
                          {day}
                       </div>
                       
                       {/* TOOLTIP */}
                       {status.type !== 'future' && (
                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-white text-black text-[9px] font-bold rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                            {status.label}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-white"></div>
                         </div>
                       )}
                    </div>
                 )
              })}
           </div>
        </div>

        {/* BLOCK 4: GOALS */}
        <div className="lg:col-span-6 bg-[#0a0a0f] border border-slate-800 rounded-[2rem] p-8 shadow-xl flex flex-col">
           {monthlyPlan && <div className="mb-4 p-3 bg-slate-900/50 rounded-xl border border-blue-500/20 flex justify-between items-center"><div><p className="text-[9px] text-blue-400 font-bold uppercase">FOCUS</p><p className="text-sm font-bold text-white">"{monthlyPlan.focus}"</p></div><button onClick={() => setShowPlanModal(true)} className="text-xs text-slate-500 hover:text-white">Edit</button></div>}
           <div className="flex gap-2 mb-4"><input value={newGoal} onChange={(e) => setNewGoal(e.target.value)} placeholder="New target..." className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" /><button onClick={addGoal} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500"><Plus size={18} /></button></div>
           <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1 max-h-[200px]">{goals.map(goal => (<div key={goal.id} onClick={() => toggleGoal(goal.id)} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${goal.completed ? 'bg-green-900/10 border-green-900/50 opacity-60' : 'bg-slate-900 border-slate-800'}`}><div className={`w-4 h-4 rounded-full border flex items-center justify-center ${goal.completed ? 'bg-green-500 border-green-500' : 'border-slate-600'}`}>{goal.completed && <CheckCircle size={10} className="text-black" />}</div><span className={`text-sm ${goal.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{goal.title}</span></div>))}</div>
        </div>

      </div>

      {/* MODALS */}
      <AnimatePresence>
        {showPlanModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0a0a0f] border border-blue-500/50 w-full max-w-lg rounded-2xl p-8 shadow-2xl relative">
              <h2 className="text-2xl font-black text-white uppercase mb-4">Mission Briefing</h2>
              <form onSubmit={(e) => { e.preventDefault(); saveMonthlyPlan({ focus: new FormData(e.target).get('focus') }); }}>
                <input name="focus" required placeholder="Primary Monthly Objective" className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:border-blue-500 outline-none mb-6" />
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg">INITIALIZE</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showReportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white text-black w-full max-w-lg rounded-xl p-8 relative shadow-2xl">
               <button onClick={() => setShowReportModal(false)} className="absolute top-4 right-4"><X /></button>
               <h2 className="text-2xl font-black uppercase mb-4">Report Card</h2>
               <div className="grid grid-cols-2 gap-4 mb-6"><div className="bg-gray-100 p-4 rounded"><p className="text-xs font-bold text-gray-500">GPA</p><p className="text-3xl font-black">{currentGPA}%</p></div><div className="bg-gray-100 p-4 rounded"><p className="text-xs font-bold text-gray-500">EFFICIENCY</p><p className="text-3xl font-black">{monthlyEfficiency}%</p></div></div>
               <button onClick={downloadReport} className="w-full bg-black text-white font-bold py-3 rounded flex items-center justify-center gap-2"><Download size={18} /> DOWNLOAD PDF</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
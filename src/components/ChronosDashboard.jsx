import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, CheckCircle, TrendingUp, Trophy, Target, Plus, 
  Flame, Download, FileText, X, AlertCircle, ArrowUpRight, Radio, ExternalLink, Globe, Loader2, Clock, Flag, MessageSquare
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import StudyChat from './StudyChat';
import PixelGarden from './PixelGarden'; // 🔥 IMPORT CONFIRMED

export default function ChronosDashboard({ user }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // --- CORE STATE ---
  const [goals, setGoals] = useState([]);
  const [monthlyPlan, setMonthlyPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // --- COMMS SYSTEM STATE ---
  const [commsMode, setCommsMode] = useState('intel'); // 'intel' or 'chat'
  const [hasNewMessage, setHasNewMessage] = useState(false); 

  // --- INPUTS ---
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalType, setNewGoalType] = useState("ops"); // 'core' or 'ops'
  const [newGoalDate, setNewGoalDate] = useState(new Date().toISOString().split('T')[0]);
  const [newGoalPriority, setNewGoalPriority] = useState("normal");
  const [examDate, setExamDate] = useState("2026-08-01");
  
  // --- FEED STATE ---
  const [hybridFeed, setHybridFeed] = useState(() => {
    const cached = localStorage.getItem('chronos_feed_cache');
    return cached ? JSON.parse(cached) : [];
  });
  const [isFeedUpdating, setIsFeedUpdating] = useState(false);

  // --- 1. PERSISTENCE & INIT ---
  useEffect(() => {
    const storedGoals = localStorage.getItem('chronos_goals');
    const storedPlan = localStorage.getItem(`chronos_plan_${currentDate.getMonth()}_${currentDate.getFullYear()}`);
    
    if (storedGoals) setGoals(JSON.parse(storedGoals));
    if (storedPlan) setMonthlyPlan(JSON.parse(storedPlan)); 
    else setShowPlanModal(true);

    // LIVE FEED ENGINE
    const fetchHybridFeed = async () => {
      setIsFeedUpdating(true);
      const { data: internalData } = await supabase.from('victory_feed').select('*').order('created_at', { ascending: false }).limit(10);
      const internalLogs = internalData ? internalData.map(item => ({
        id: `int-${item.id}`, type: item.type, text: item.message, time: new Date(item.created_at).getTime(), source: 'INTERNAL'
      })) : [];

      let externalLogs = [];
      try {
        const RSS_URL = "https://timesofindia.indiatimes.com/rssfeeds/913168846.cms"; 
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`);
        const json = await res.json();
        if(json.items) externalLogs = json.items.slice(0, 6).map((item, idx) => ({
            id: `ext-${idx}`, type: 'news', text: item.title, time: new Date(item.pubDate).getTime(), source: 'WEB', link: item.link
        }));
      } catch (e) { console.error("RSS Uplink Failed", e); }

      const merged = [...internalLogs, ...externalLogs].sort((a, b) => b.time - a.time);
      if (merged.length > 0) {
        setHybridFeed(merged);
        localStorage.setItem('chronos_feed_cache', JSON.stringify(merged));
      }
      setIsFeedUpdating(false);
    };
    fetchHybridFeed();

    const channel = supabase.channel('victory_feed_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'victory_feed' }, (payload) => {
        const newItem = { id: `int-${payload.new.id}`, type: payload.new.type, text: payload.new.message, time: new Date(payload.new.created_at).getTime(), source: 'INTERNAL' };
        setHybridFeed(prev => { const updated = [newItem, ...prev].slice(0, 30); localStorage.setItem('chronos_feed_cache', JSON.stringify(updated)); return updated; });
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => { localStorage.setItem('chronos_goals', JSON.stringify(goals)); }, [goals]);

  // --- 2. CALCULATIONS ---
  const totalPoints = user?.total_percentage_points || 0;
  const totalExams = user?.total_exams_completed || 1; 
  const rawGPA = totalExams > 0 ? (totalPoints / totalExams) : 0;
  const currentGPA = parseFloat(Math.min(rawGPA, 100).toFixed(1));
  const targetGPA = 95.0;
  const daysToExam = Math.max(1, Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24)));
  const gap = Math.max(0, targetGPA - currentGPA);
  const requiredDailyGrowth = (gap / daysToExam).toFixed(2);
  const completedGoals = goals.filter(g => g.completed).length;
  const totalGoals = goals.length;
  const monthlyEfficiency = totalGoals === 0 ? 0 : Math.round((completedGoals / totalGoals) * 100);

  // Daily Score Logic for Garden Weather
  const todayStr = new Date().toISOString().split('T')[0];
  const dailyScore = user?.last_mock_date === todayStr ? user.last_mock_score : null;

  // --- 3. CALENDAR LOGIC ---
  const todayDay = currentDate.getDate();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getTimeRemaining = (targetDateStr) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const target = new Date(targetDateStr);
    const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24)); 
    if (diffDays < 0) return { text: "OVERDUE", color: "text-red-500", bg: "bg-red-500/10" };
    if (diffDays === 0) return { text: "DUE TODAY", color: "text-red-400 animate-pulse", bg: "bg-red-500/10" };
    if (diffDays === 1) return { text: "TOMORROW", color: "text-orange-400", bg: "bg-orange-500/10" };
    return { text: `${diffDays} DAYS LEFT`, color: "text-blue-400", bg: "bg-blue-500/10" };
  };

  const saveMonthlyPlan = (plan) => { localStorage.setItem(`chronos_plan_${currentDate.getMonth()}_${currentDate.getFullYear()}`, JSON.stringify(plan)); setMonthlyPlan(plan); setShowPlanModal(false); };
  const addGoal = () => { if(!newGoalTitle.trim()) return; setGoals([...goals, { id: Date.now(), title: newGoalTitle, type: newGoalType, date: newGoalType === 'ops' ? newGoalDate : null, priority: newGoalPriority, completed: false }]); setNewGoalTitle(""); };
  const toggleGoal = (id) => { setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g)); };
  const deleteGoal = (id, e) => { e.stopPropagation(); setGoals(goals.filter(g => g.id !== id)); };
  
  const downloadReport = () => {
    const w = window.open('', '', 'height=600,width=800');
    w.document.write(`<html><head><title>Report</title><style>body{font-family:monospace;padding:20px;}h1{border-bottom:2px solid black;}</style></head><body><h1>NEURAL REPORT: ${user.username}</h1><p>GPA: ${currentGPA}%</p><p>EFFICIENCY: ${monthlyEfficiency}%</p><hr/><h3>LOG</h3>${goals.map(g=>`<div>[${g.completed?'X':' '}] ${g.title} (${g.type})</div>`).join('')}</body></html>`);
    w.document.close(); w.print();
  };

  const switchComms = (mode) => {
    setCommsMode(mode);
    if(mode === 'chat') setHasNewMessage(false);
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

        {/* BLOCK 1: BALLISTICS & PIXEL GARDEN */}
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
              <div className="mt-8">
                 <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700"><motion.div initial={{ width: 0 }} animate={{ width: `${currentGPA}%` }} className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_15px_cyan]" /></div>
                 
                 {/* 🔥 PIXEL GARDEN CONFIRMED & INSERTED HERE */}
                 <PixelGarden
  gpa={currentGPA}
  streak={user?.streak_count || 0}
  dailyScore={dailyScore}
  embed
/>

              </div>
           </div>
        </div>

        {/* =======================================================
            BLOCK 2: TACTICAL COMMS & INTEL
        ======================================================= */}
        <div className="lg:col-span-4 bg-[#0a0a0f] border border-slate-800 rounded-[2rem] p-6 shadow-xl flex flex-col h-[420px] overflow-hidden relative">
           <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800 bg-[#0a0a0f] z-10 shrink-0">
              <div className="flex gap-2 p-1 bg-slate-900 rounded-lg">
                 <button onClick={() => switchComms('intel')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${commsMode === 'intel' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}><Radio size={12} className={commsMode === 'intel' ? 'animate-pulse' : ''} /> Intel</button>
                 <button onClick={() => switchComms('chat')} className={`relative flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${commsMode === 'chat' ? 'bg-green-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}><MessageSquare size={12} /> Chat {hasNewMessage && commsMode !== 'chat' && (<span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-bounce border border-black"></span>)}</button>
              </div>
              <span className="text-[9px] text-slate-600 font-mono">{commsMode === 'intel' ? 'LIVE UPLINK' : 'SECURE LINE'}</span>
           </div>
           
           <div className="flex-1 overflow-hidden relative flex flex-col">
              {/* MODE A: INTEL FEED */}
              {commsMode === 'intel' && (
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                   {hybridFeed.map((item) => (
                      <div key={item.id} className={`p-3 rounded-xl border-l-2 bg-slate-900/40 hover:bg-slate-800/60 transition-colors ${item.source === 'WEB' ? 'border-blue-500' : item.type === 'win' ? 'border-green-500' : 'border-purple-500'}`}>
                         <div className="flex justify-between items-start mb-1"><span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded text-white flex items-center gap-1 ${item.source === 'WEB' ? 'bg-blue-600' : 'bg-slate-700'}`}>{item.source === 'WEB' ? <Globe size={8} /> : null} {item.source === 'WEB' ? 'INTERNET' : item.type.toUpperCase()}</span><span className="text-[9px] text-slate-600 font-mono">{new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                         <p className="text-xs font-medium text-slate-300 leading-snug mb-1">{item.text}</p>
                         {item.source === 'WEB' && <a href={item.link} target="_blank" rel="noreferrer" className="text-[9px] text-blue-400 flex items-center gap-1 hover:underline">Read Source <ExternalLink size={8} /></a>}
                      </div>
                   ))}
                </div>
              )}

              {/* MODE B: CHAT (FIXED FLEXBOX LAYOUT) */}
              <div className={`absolute inset-0 flex flex-col bg-[#050508] ${commsMode === 'chat' ? 'visible' : 'invisible pointer-events-none'}`}>
                 <div className="flex-1 min-h-0 bg-[#050508] rounded-xl border border-slate-800 overflow-hidden relative">
                    <StudyChat user={user} isTunnel={false} />
                 </div>
              </div>
           </div>
        </div>

        {/* BLOCK 3: CALENDAR */}
        <div className="lg:col-span-6 bg-[#0a0a0f] border border-slate-800 rounded-[2rem] p-8 shadow-xl">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-lg text-white flex items-center gap-2"><Calendar className="text-purple-500" /><span>Execution Grid</span></h3>
              <div className="flex gap-3 text-[9px] font-bold uppercase text-slate-500">
                 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-green-900"></div> Active</div>
                 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-blue-500"></div> Target</div>
                 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-white"></div> Today</div>
              </div>
           </div>
           <div className="grid grid-cols-7 gap-3">
              {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-center text-xs font-bold text-slate-600">{d}</div>)}
              {calendarDays.map(day => {
                 const isToday = day === todayDay;
                 const isFuture = day > todayDay;
                 const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                 const hasTarget = goals.some(g => g.type === 'ops' && g.date === dateStr && !g.completed);
                 const hasCompletedTarget = goals.some(g => g.type === 'ops' && g.date === dateStr && g.completed);
                 let style = isFuture ? "border-transparent text-slate-800 bg-[#050508] cursor-not-allowed" : isToday ? "border-white text-white bg-slate-800 shadow-lg scale-110" : "border-transparent text-slate-500 bg-slate-900";
                 return (
                    <div key={day} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-bold border transition-all relative ${style}`}>
                       {day}
                       <div className="flex gap-0.5 mt-1">
                          {hasTarget && <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse shadow-[0_0_5px_blue]"></div>}
                          {hasCompletedTarget && <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_5px_green]"></div>}
                       </div>
                    </div>
                 )
              })}
           </div>
        </div>

        {/* BLOCK 4: GOALS */}
        <div className="lg:col-span-6 bg-[#0a0a0f] border border-slate-800 rounded-[2rem] p-8 shadow-xl flex flex-col">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-lg text-white flex items-center gap-2"><Target className="text-orange-500" /><span>Tactical Objectives</span></h3>
              <div className="flex bg-slate-900 rounded-lg p-1">
                 <button onClick={() => setNewGoalType('ops')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${newGoalType === 'ops' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>OPS</button>
                 <button onClick={() => setNewGoalType('core')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${newGoalType === 'core' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500'}`}>CORE</button>
              </div>
           </div>
           <div className="flex flex-col gap-2 mb-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
              <div className="flex gap-2"><input value={newGoalTitle} onChange={(e) => setNewGoalTitle(e.target.value)} placeholder={newGoalType === 'core' ? "Set Strategic Directive..." : "Set Tactical Mission..."} className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-600 font-medium" /><button onClick={addGoal} className="bg-white text-black p-1.5 rounded hover:bg-slate-200"><Plus size={16} /></button></div>
              {newGoalType === 'ops' && (<div className="flex gap-3 pt-2 border-t border-slate-800"><input type="date" value={newGoalDate} onChange={(e) => setNewGoalDate(e.target.value)} className="bg-slate-800 text-[10px] text-slate-300 rounded px-2 py-1 outline-none border border-slate-700" /><select value={newGoalPriority} onChange={(e) => setNewGoalPriority(e.target.value)} className="bg-slate-800 text-[10px] text-slate-300 rounded px-2 py-1 outline-none border border-slate-700"><option value="normal">Normal Priority</option><option value="high">High Priority</option></select></div>)}
           </div>
           <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1 max-h-[300px]">
              {goals.filter(g => g.type === 'ops' && !g.completed).length > 0 && (<div className="mb-4"><p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-2 px-1">Active Timeline</p><div className="space-y-2">{goals.filter(g => g.type === 'ops' && !g.completed).sort((a,b) => new Date(a.date) - new Date(b.date)).map(goal => {const timer = getTimeRemaining(goal.date); return (<div key={goal.id} className={`flex items-center gap-3 p-3 rounded-xl border bg-slate-900/40 cursor-pointer group hover:border-slate-600 transition-all ${goal.priority === 'high' ? 'border-red-900/50' : 'border-slate-800'}`} onClick={() => toggleGoal(goal.id)}><div className={`w-4 h-4 rounded border flex items-center justify-center border-slate-600 group-hover:border-blue-500 transition-colors`}></div><div className="flex-1"><div className="flex justify-between items-start"><span className="text-sm text-slate-200 font-medium">{goal.title}</span><span className={`text-[9px] font-bold px-2 py-0.5 rounded ml-2 ${timer.color} ${timer.bg}`}>{timer.text}</span></div><p className="text-[10px] text-slate-500 font-mono flex items-center gap-1"><Clock size={8} /> {goal.date}</p></div><button onClick={(e) => deleteGoal(goal.id, e)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 transition-opacity"><X size={14}/></button></div>)})}</div></div>)}
              <div className="mb-2"><p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-2 px-1">Strategic Directives</p>{goals.filter(g => g.type === 'core' && !g.completed).map(goal => (<div key={goal.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/20 cursor-pointer group hover:border-purple-500/30 transition-all mb-2" onClick={() => toggleGoal(goal.id)}><div className="w-4 h-4 rounded-full border border-slate-600 group-hover:border-purple-500 transition-colors"></div><span className="text-sm text-slate-300 flex-1">{goal.title}</span><button onClick={(e) => deleteGoal(goal.id, e)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 transition-opacity"><X size={14}/></button></div>))}{goals.filter(g => g.type === 'core' && !g.completed).length === 0 && <div className="text-center text-xs text-slate-700 italic py-2">No strategic directives set.</div>}</div>
              {goals.some(g => g.completed) && (<div className="mt-6 pt-4 border-t border-slate-800/50"><p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mb-2">Completed Logs</p>{goals.filter(g => g.completed).map(goal => (<div key={goal.id} className="flex items-center gap-3 p-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => toggleGoal(goal.id)}><CheckCircle size={14} className="text-green-500" /><span className="text-xs text-slate-500 line-through decoration-slate-700">{goal.title}</span></div>))}</div>)}
           </div>
        </div>

      </div>

      {/* MODALS */}
      <AnimatePresence>
        {showPlanModal && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"><motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0a0a0f] border border-blue-500/50 w-full max-w-lg rounded-2xl p-8 shadow-2xl relative"><h2 className="text-2xl font-black text-white uppercase mb-4">Mission Briefing</h2><form onSubmit={(e) => { e.preventDefault(); saveMonthlyPlan({ focus: new FormData(e.target).get('focus') }); }}><input name="focus" required placeholder="Primary Monthly Objective" className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:border-blue-500 outline-none mb-6" /><button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg">INITIALIZE</button></form></motion.div></motion.div>)}
      </AnimatePresence>
      <AnimatePresence>
        {showReportModal && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white text-black w-full max-w-lg rounded-xl p-8 relative shadow-2xl"><button onClick={() => setShowReportModal(false)} className="absolute top-4 right-4"><X /></button><h2 className="text-2xl font-black uppercase mb-4">Report Card</h2><div className="grid grid-cols-2 gap-4 mb-6"><div className="bg-gray-100 p-4 rounded"><p className="text-xs font-bold text-gray-500">GPA</p><p className="text-3xl font-black">{currentGPA}%</p></div><div className="bg-gray-100 p-4 rounded"><p className="text-xs font-bold text-gray-500">EFFICIENCY</p><p className="text-3xl font-black">{monthlyEfficiency}%</p></div></div><button onClick={downloadReport} className="w-full bg-black text-white font-bold py-3 rounded flex items-center justify-center gap-2"><Download size={18} /> DOWNLOAD PDF</button></div></motion.div>)}
      </AnimatePresence>
    </div>
  );
}
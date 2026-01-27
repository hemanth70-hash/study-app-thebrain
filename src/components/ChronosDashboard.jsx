import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, CheckCircle, TrendingUp, Trophy, Target, Plus, 
  Flame, Download, FileText, X, ChevronRight, AlertCircle
} from 'lucide-react';

export default function ChronosDashboard({ user }) {
  // --- STATE ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [goals, setGoals] = useState([]);
  const [monthlyPlan, setMonthlyPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [newGoal, setNewGoal] = useState("");
  const [examDate, setExamDate] = useState("2026-08-01");

  // --- 1. PERSISTENCE ENGINE (Local Storage) ---
  useEffect(() => {
    const storedGoals = localStorage.getItem('chronos_goals');
    const storedPlan = localStorage.getItem(`chronos_plan_${currentDate.getMonth()}_${currentDate.getFullYear()}`);
    
    if (storedGoals) setGoals(JSON.parse(storedGoals));
    
    if (storedPlan) {
      setMonthlyPlan(JSON.parse(storedPlan));
    } else {
      // 🚨 FORCE MONTHLY BRIEFING IF MISSING
      setShowPlanModal(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chronos_goals', JSON.stringify(goals));
  }, [goals]);

  // --- 2. TRAJECTORY MATH (Linked to Neural GPA) ---
  // 🔥 CONNECTED TO REAL USER DATA
  const currentGPA = user?.total_percentage_points 
    ? parseFloat(user.total_percentage_points.toFixed(1)) 
    : 0.0;
    
  const targetGPA = 95.0;
  const daysToExam = Math.max(1, Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24)));
  const gap = Math.max(0, targetGPA - currentGPA);
  const requiredDailyGrowth = (gap / daysToExam).toFixed(2);
  
  // Monthly Stats
  const completedGoals = goals.filter(g => g.completed).length;
  const totalGoals = goals.length;
  const monthlyEfficiency = totalGoals === 0 ? 0 : Math.round((completedGoals / totalGoals) * 100);

  // --- 3. VICTORY FEED DATA ---
  const newsFeed = [
    { type: "news", text: "RRB NTPC Notification expected next month. 5000+ Seats." },
    { type: "win", text: "Aspirant 'Ravi_99' cleared Station Master cutoff with 89%!" },
    { type: "quote", text: "The pain of discipline is far less than the pain of regret." },
    { type: "news", text: "General Awareness weighting increased in Mains." },
    { type: "win", text: "User 'SpeedDemon' maintained a 100-day streak!" }
  ];

  // --- 4. CALENDAR LOGIC ---
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // --- ACTIONS ---
  const saveMonthlyPlan = (planData) => {
    const key = `chronos_plan_${currentDate.getMonth()}_${currentDate.getFullYear()}`;
    localStorage.setItem(key, JSON.stringify(planData));
    setMonthlyPlan(planData);
    setShowPlanModal(false);
  };

  const addGoal = () => {
    if (!newGoal.trim()) return;
    setGoals([...goals, { 
      id: Date.now(), 
      title: newGoal, 
      date: new Date().toISOString().split('T')[0], 
      completed: false,
      impact: "+0.5%" 
    }]);
    setNewGoal("");
  };

  const toggleGoal = (id) => {
    setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  // --- PDF GENERATOR ---
  const downloadReport = () => {
    const printContent = document.getElementById('printable-report');
    const windowUrl = 'about:blank';
    const windowName = 'Print' + new Date().getTime();
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

    printWindow.document.write(`
      <html>
        <head>
          <title>NEURAL REPORT - ${user.username}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 40px; }
            .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
            .stat-box { border: 1px solid #ccc; padding: 15px; }
            .stat-value { font-size: 24px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header"><h1>CHRONOS MONTHLY REPORT</h1><p>Agent: ${user.username}</p></div>
          <div class="stat-grid">
            <div class="stat-box"><div>NEURAL GPA</div><div class="stat-value">${currentGPA}%</div></div>
            <div class="stat-box"><div>EFFICIENCY</div><div class="stat-value">${monthlyEfficiency}%</div></div>
          </div>
          <h3>MISSION LOG</h3>
          <ul>${goals.map(g => `<li>[${g.completed ? 'X' : ' '}] ${g.title}</li>`).join('')}</ul>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="w-full min-h-screen p-4 md:p-8 font-sans text-slate-100 animate-in fade-in zoom-in duration-500">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Chronos Command</h1>
          <p className="text-slate-500 text-xs font-mono tracking-widest">
            {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })} PROTOCOL ACTIVE
          </p>
        </div>
        <button 
           onClick={() => setShowReportModal(true)}
           className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg border border-slate-700 transition-all shadow-lg"
        >
           <FileText size={16} /> <span className="text-xs font-bold uppercase">Report Card</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">

        {/* =======================================================
            BLOCK 1: TRAJECTORY & MATH (Top Left - 8 Cols)
        ======================================================= */}
        <div className="lg:col-span-8 bg-[#0a0a0f] border border-slate-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[100px] rounded-full"></div>
           <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                 <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Victory Ballistics</h2>
                    <p className="text-slate-500 text-xs">Probability of Selection Calculation</p>
                 </div>
                 <div className="flex flex-col items-end">
                    <label className="text-[9px] text-slate-500 uppercase font-bold mb-1">Target Date</label>
                    <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="bg-slate-900 border border-slate-700 text-white text-xs px-3 py-1 rounded focus:border-blue-500 outline-none" />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Neural GPA */}
                 <div className="p-5 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-2">Neural GPA</p>
                    <div className="text-5xl font-black text-white">{currentGPA}<span className="text-lg text-slate-600">%</span></div>
                 </div>
                 {/* Gap */}
                 <div className="p-5 bg-slate-900/50 rounded-2xl border border-red-900/30 relative overflow-hidden">
                    <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
                    <p className="text-[9px] text-red-400 uppercase font-bold tracking-widest mb-2">Deficit (Gap)</p>
                    <div className="text-5xl font-black text-red-500">-{gap.toFixed(1)}</div>
                 </div>
                 {/* Daily Requirement */}
                 <div className="p-5 bg-blue-900/10 rounded-2xl border border-blue-500/30">
                    <p className="text-[9px] text-blue-300 uppercase font-bold tracking-widest mb-2">Required Daily Gain</p>
                    <div className="flex items-end gap-2">
                       <TrendingUp size={32} className="text-green-400 mb-2" />
                       <div className="text-5xl font-black text-green-400">+{requiredDailyGrowth}</div>
                    </div>
                 </div>
              </div>

              <div className="mt-8">
                 <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-2">
                    <span>Selection Probability</span>
                    <span>{daysToExam} Days Remaining</span>
                 </div>
                 <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${currentGPA}%` }} className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_15px_cyan]" />
                 </div>
              </div>
           </div>
        </div>

        {/* =======================================================
            BLOCK 2: VICTORY FEED (Top Right - 4 Cols)
        ======================================================= */}
        <div className="lg:col-span-4 bg-[#0a0a0f] border border-slate-800 rounded-[2rem] p-6 shadow-xl flex flex-col h-[400px]">
           <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-800">
              <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500"><Trophy size={18} /></div>
              <h3 className="font-black text-sm text-slate-200 uppercase tracking-widest">Victory Feed</h3>
           </div>
           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
              {newsFeed.map((item, idx) => (
                 <motion.div 
                   key={idx} 
                   initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                   className={`p-3 rounded-xl border-l-2 ${item.type === 'win' ? 'border-green-500 bg-green-500/5' : item.type === 'news' ? 'border-blue-500 bg-blue-500/5' : 'border-purple-500 bg-purple-500/5'}`}
                 >
                    <div className="flex justify-between items-start mb-1">
                       <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${item.type === 'win' ? 'bg-green-500 text-black' : item.type === 'news' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}>
                          {item.type === 'win' ? 'SUCCESS' : item.type === 'news' ? 'NEWS' : 'WISDOM'}
                       </span>
                    </div>
                    <p className="text-xs font-medium text-slate-300 leading-snug">"{item.text}"</p>
                 </motion.div>
              ))}
           </div>
        </div>

        {/* =======================================================
            BLOCK 3: STRATEGIC CALENDAR (Bottom Left - 6 Cols)
        ======================================================= */}
        <div className="lg:col-span-6 bg-[#0a0a0f] border border-slate-800 rounded-[2rem] p-8 shadow-xl">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-lg text-white flex items-center gap-2">
                 <Calendar className="text-purple-500" />
                 <span>Execution Grid</span>
              </h3>
              <div className="flex gap-2">
                 <span className="w-2 h-2 rounded-full bg-slate-800" title="Zero"></span>
                 <span className="w-2 h-2 rounded-full bg-green-900" title="Low"></span>
                 <span className="w-2 h-2 rounded-full bg-green-500" title="High"></span>
              </div>
           </div>
           <div className="grid grid-cols-7 gap-3">
              {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-center text-xs font-bold text-slate-600">{d}</div>)}
              {calendarDays.map(day => {
                 const intensity = Math.random() > 0.7 ? 'bg-green-500 shadow-[0_0_10px_green]' : Math.random() > 0.4 ? 'bg-green-900/50' : 'bg-slate-900';
                 const isToday = day === currentDate.getDate();
                 return (
                    <div key={day} className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all border ${isToday ? 'border-white text-white bg-slate-800' : `border-transparent text-slate-500 ${intensity} hover:border-slate-600`}`}>
                       {day}
                    </div>
                 )
              })}
           </div>
        </div>

        {/* =======================================================
            BLOCK 4: MISSION LOG & PLAN (Bottom Right - 6 Cols)
        ======================================================= */}
        <div className="lg:col-span-6 bg-[#0a0a0f] border border-slate-800 rounded-[2rem] p-8 shadow-xl flex flex-col">
           {/* Monthly Plan Summary */}
           {monthlyPlan && (
             <div className="mb-6 p-4 bg-slate-900/80 rounded-xl border border-blue-500/20 flex justify-between items-center">
                <div>
                   <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest mb-1">MONTHLY FOCUS</p>
                   <p className="text-sm font-bold text-white">"{monthlyPlan.focus}"</p>
                </div>
                <button onClick={() => setShowPlanModal(true)} className="text-xs text-slate-500 hover:text-white">Edit</button>
             </div>
           )}

           <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-lg text-white flex items-center gap-2">
                 <CheckCircle className="text-green-500" />
                 <span>Daily Targets</span>
              </h3>
              <span className="text-[10px] text-slate-500">{goals.filter(g => g.completed).length} / {goals.length}</span>
           </div>

           <div className="flex gap-2 mb-4">
              <input value={newGoal} onChange={(e) => setNewGoal(e.target.value)} placeholder="New directive..." className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" />
              <button onClick={addGoal} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500"><Plus size={18} /></button>
           </div>

           <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1 max-h-[200px]">
              {goals.map(goal => (
                 <div key={goal.id} onClick={() => toggleGoal(goal.id)} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${goal.completed ? 'bg-green-900/10 border-green-900/50 opacity-60' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${goal.completed ? 'bg-green-500 border-green-500' : 'border-slate-600'}`}>{goal.completed && <CheckCircle size={10} className="text-black" />}</div>
                    <span className={`text-sm ${goal.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{goal.title}</span>
                 </div>
              ))}
           </div>
        </div>

      </div>

      {/* =======================================================
          MODAL: MONTHLY PLANNING
      ======================================================= */}
      <AnimatePresence>
        {showPlanModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0f1014] border border-blue-500/50 w-full max-w-lg rounded-2xl p-8 shadow-2xl relative">
              <h2 className="text-2xl font-black text-white uppercase mb-1">Mission Briefing</h2>
              <p className="text-blue-400 text-xs font-mono tracking-widest mb-6">PROTOCOL: {currentDate.toLocaleString('default', { month: 'long' }).toUpperCase()}</p>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const plan = { focus: formData.get('focus'), targets: [formData.get('t1')] };
                saveMonthlyPlan(plan);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-500 font-bold uppercase">Primary Objective</label>
                    <input name="focus" required placeholder="e.g. Master Geometry" className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:border-blue-500 outline-none mt-1" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-6 shadow-[0_0_20px_blue]">INITIALIZE MONTH</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =======================================================
          MODAL: PDF REPORT
      ======================================================= */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white text-black w-full max-w-xl rounded-xl p-8 relative shadow-2xl" id="printable-report">
               <button onClick={() => setShowReportModal(false)} className="absolute top-4 right-4"><X /></button>
               <h2 className="text-2xl font-black uppercase mb-4 border-b-2 border-black pb-2">Monthly Report</h2>
               <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-gray-100 rounded">
                     <p className="text-xs font-bold text-gray-500">NEURAL GPA</p>
                     <p className="text-3xl font-black">{currentGPA}%</p>
                  </div>
                  <div className="p-4 bg-gray-100 rounded">
                     <p className="text-xs font-bold text-gray-500">GOALS MET</p>
                     <p className="text-3xl font-black">{completedGoals}/{totalGoals}</p>
                  </div>
               </div>
               <button onClick={downloadReport} className="w-full bg-black text-white font-bold py-3 rounded flex items-center justify-center gap-2 hover:bg-gray-800"><Download size={18} /> DOWNLOAD PDF</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
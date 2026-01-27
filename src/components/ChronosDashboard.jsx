import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, CheckCircle, TrendingUp, Trophy, Target, Plus, 
  Flame, Download, FileText, X, AlertCircle, ArrowUpRight
} from 'lucide-react';

export default function ChronosDashboard({ user }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [goals, setGoals] = useState([]);
  const [monthlyPlan, setMonthlyPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [newGoal, setNewGoal] = useState("");
  const [examDate, setExamDate] = useState("2026-08-01");

  // --- 1. PERSISTENCE ENGINE ---
  useEffect(() => {
    const storedGoals = localStorage.getItem('chronos_goals');
    const storedPlan = localStorage.getItem(`chronos_plan_${currentDate.getMonth()}_${currentDate.getFullYear()}`);
    
    if (storedGoals) setGoals(JSON.parse(storedGoals));
    if (storedPlan) {
      setMonthlyPlan(JSON.parse(storedPlan));
    } else {
      setShowPlanModal(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chronos_goals', JSON.stringify(goals));
  }, [goals]);

  // --- 2. TRAJECTORY MATH (CORRECTED) ---
  // Fix: Calculate Average, not Sum
  const totalPoints = user?.total_percentage_points || 0;
  const totalExams = user?.total_exams_completed || 1; // Prevent divide by zero
  
  // Calculate RAW GPA: (Total Points / Total Exams)
  const rawGPA = totalExams > 0 ? (totalPoints / totalExams) : 0;
  // Cap at 100% and fix to 1 decimal
  const currentGPA = parseFloat(Math.min(rawGPA, 100).toFixed(1));

  const targetGPA = 95.0;
  // Days Calculation
  const daysToExam = Math.max(1, Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24)));
  // Gap Calculation
  const gap = Math.max(0, targetGPA - currentGPA);
  // Required Daily Gain
  const requiredDailyGrowth = (gap / daysToExam).toFixed(3);

  // Stats for Report
  const completedGoals = goals.filter(g => g.completed).length;
  const totalGoals = goals.length;
  const monthlyEfficiency = totalGoals === 0 ? 0 : Math.round((completedGoals / totalGoals) * 100);

  // --- 3. VICTORY FEED DATA ---
  const newsFeed = [
    { type: "win", text: "User 'TheBrain' is calibrating for success..." },
    { type: "news", text: "RRB NTPC: 5,000+ Seats Notification Expected Q3." },
    { type: "quote", text: "Discipline is choosing between what you want now and what you want most." },
    { type: "win", text: "Aspirant 'Ravi_99' cleared Station Master cutoff!" },
    { type: "news", text: "New General Science syllabus weighting added." },
    { type: "quote", text: "You didn't come this far to only come this far." }
  ];

  // --- 4. CALENDAR LOGIC ---
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Actions
  const saveMonthlyPlan = (planData) => {
    const key = `chronos_plan_${currentDate.getMonth()}_${currentDate.getFullYear()}`;
    localStorage.setItem(key, JSON.stringify(planData));
    setMonthlyPlan(planData);
    setShowPlanModal(false);
  };

  const addGoal = () => {
    if (!newGoal.trim()) return;
    setGoals([...goals, { 
      id: Date.now(), title: newGoal, date: new Date().toISOString().split('T')[0], completed: false 
    }]);
    setNewGoal("");
  };

  const toggleGoal = (id) => {
    setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  // PDF Generator
  const downloadReport = () => {
    const printContent = document.getElementById('printable-report');
    const windowUrl = 'about:blank';
    const windowName = 'Print' + new Date().getTime();
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');
    
    // Safety check if popup blocked
    if (!printWindow) {
      alert("Please allow popups to download the report.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>CHRONOS REPORT - ${user.username}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 40px; color: #000; }
            h1 { border-bottom: 2px solid #000; padding-bottom: 10px; }
            .stat { font-size: 18px; margin-bottom: 10px; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>MONTHLY PERFORMANCE REPORT</h1>
          <p>AGENT: ${user.username}</p>
          <p>DATE: ${new Date().toLocaleDateString()}</p>
          <hr/>
          <div class="stat">NEURAL GPA: <span class="bold">${currentGPA}%</span></div>
          <div class="stat">MONTHLY EFFICIENCY: <span class="bold">${monthlyEfficiency}%</span></div>
          <div class="stat">MISSIONS: <span class="bold">${completedGoals}/${totalGoals}</span></div>
          <hr/>
          <h3>MISSION LOG</h3>
          <ul>
            ${goals.map(g => `<li>[${g.completed ? 'X' : ' '}] ${g.title}</li>`).join('')}
          </ul>
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
          <p className="text-blue-500 text-xs font-mono tracking-widest uppercase">
            {currentDate.toLocaleDateString('default', { month: 'long' })} PROTOCOL ACTIVE
          </p>
        </div>
        <button 
           onClick={() => setShowReportModal(true)}
           className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg border border-slate-700 transition-all shadow-lg group"
        >
           <FileText size={16} className="group-hover:text-blue-400 transition-colors" /> 
           <span className="text-xs font-bold uppercase">Report Card</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">

        {/* =======================================================
            BLOCK 1: BALLISTICS (Corrected Math)
        ======================================================= */}
        <div className="lg:col-span-8 bg-[#0a0a0f] border border-slate-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[100px] rounded-full pointer-events-none"></div>
           
           <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                 <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Victory Ballistics</h2>
                    <p className="text-slate-500 text-xs">Mathematical Probability of Selection</p>
                 </div>
                 <div className="flex flex-col items-end">
                    <label className="text-[9px] text-slate-500 uppercase font-bold mb-1">Target Date</label>
                    <input 
                      type="date" 
                      value={examDate} 
                      onChange={(e) => setExamDate(e.target.value)} 
                      className="bg-slate-900 border border-slate-700 text-white text-xs px-3 py-1 rounded focus:border-blue-500 outline-none hover:border-slate-600 transition-colors" 
                    />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* GPA */}
                 <div className="p-5 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-2">Neural GPA</p>
                    <div className="text-5xl font-black text-white">{currentGPA}<span className="text-lg text-slate-600">%</span></div>
                 </div>
                 {/* GAP */}
                 <div className="p-5 bg-slate-900/50 rounded-2xl border border-red-900/30 relative overflow-hidden">
                    <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
                    <p className="text-[9px] text-red-400 uppercase font-bold tracking-widest mb-2">Deficit (Gap)</p>
                    <div className="text-5xl font-black text-red-500">-{gap.toFixed(1)}</div>
                 </div>
                 {/* GAIN */}
                 <div className="p-5 bg-blue-900/10 rounded-2xl border border-blue-500/30">
                    <p className="text-[9px] text-blue-300 uppercase font-bold tracking-widest mb-2">Required Daily Gain</p>
                    <div className="flex items-end gap-2">
                       <TrendingUp size={32} className="text-green-400 mb-2" />
                       <div className="text-5xl font-black text-green-400">+{requiredDailyGrowth}</div>
                    </div>
                 </div>
              </div>

              {/* BAR */}
              <div className="mt-8">
                 <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-2">
                    <span>Selection Probability</span>
                    <span>{daysToExam} Days Remaining</span>
                 </div>
                 <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${currentGPA}%` }} 
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_20px_cyan]" 
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* =======================================================
            BLOCK 2: VICTORY FEED (Auto-Scroll)
        ======================================================= */}
        <div className="lg:col-span-4 bg-[#0a0a0f] border border-slate-800 rounded-[2rem] p-6 shadow-xl flex flex-col h-[420px] overflow-hidden relative">
           <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-800 z-10 bg-[#0a0a0f]">
              <Trophy size={18} className="text-yellow-500" />
              <h3 className="font-black text-sm text-slate-200 uppercase tracking-widest">Victory Feed</h3>
           </div>
           
           <div className="flex-1 overflow-hidden relative mask-image-gradient">
              {/* Marquee Animation */}
              <motion.div 
                animate={{ y: [0, -500] }} 
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="space-y-3 absolute w-full"
              >
                 {[...newsFeed, ...newsFeed].map((item, idx) => ( // Duplicate for infinite loop
                    <div 
                      key={idx} 
                      className={`p-3 rounded-xl border-l-2 ${
                        item.type === 'win' ? 'border-green-500 bg-green-500/5' : 
                        item.type === 'news' ? 'border-blue-500 bg-blue-500/5' : 
                        'border-purple-500 bg-purple-500/5'
                      }`}
                    >
                       <div className="flex justify-between items-start mb-1">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                             item.type === 'win' ? 'bg-green-500 text-black' : 
                             item.type === 'news' ? 'bg-blue-600 text-white' : 
                             'bg-purple-600 text-white'
                          }`}>
                             {item.type.toUpperCase()}
                          </span>
                       </div>
                       <p className="text-xs font-medium text-slate-300 leading-snug">"{item.text}"</p>
                    </div>
                 ))}
              </motion.div>
           </div>
        </div>

        {/* =======================================================
            BLOCK 3: STRATEGIC CALENDAR
        ======================================================= */}
        <div className="lg:col-span-6 bg-[#0a0a0f] border border-slate-800 rounded-[2rem] p-8 shadow-xl">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-lg text-white flex items-center gap-2">
                 <Calendar className="text-purple-500" />
                 <span>Execution Grid</span>
              </h3>
              <div className="flex gap-2">
                 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-800"></div><span className="text-[9px] text-slate-500">Rest</span></div>
                 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div><span className="text-[9px] text-slate-500">Active</span></div>
              </div>
           </div>
           <div className="grid grid-cols-7 gap-3">
              {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-center text-xs font-bold text-slate-600">{d}</div>)}
              {calendarDays.map(day => {
                 const isToday = day === currentDate.getDate();
                 // Simulating previous activity for visuals (in real app, map from DB)
                 const hasActivity = Math.random() > 0.6; 
                 const intensity = hasActivity ? 'bg-green-500 shadow-[0_0_10px_green]' : 'bg-slate-900';
                 
                 return (
                    <div 
                      key={day} 
                      className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all border 
                        ${isToday 
                          ? 'border-white text-white bg-slate-800 scale-110 shadow-lg' 
                          : `border-transparent text-slate-500 ${intensity} hover:border-slate-600`
                        }`}
                    >
                       {day}
                    </div>
                 )
              })}
           </div>
        </div>

        {/* =======================================================
            BLOCK 4: MISSION LOG (Bottom Right)
        ======================================================= */}
        <div className="lg:col-span-6 bg-[#0a0a0f] border border-slate-800 rounded-[2rem] p-8 shadow-xl flex flex-col">
           {monthlyPlan && (
             <div className="mb-6 p-4 bg-slate-900/50 rounded-xl border border-blue-500/20 flex justify-between items-center">
                <div>
                   <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest mb-1">MONTHLY FOCUS</p>
                   <p className="text-sm font-bold text-white">"{monthlyPlan.focus}"</p>
                </div>
                <button onClick={() => setShowPlanModal(true)} className="text-xs text-slate-500 hover:text-white underline">Edit</button>
             </div>
           )}

           <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-lg text-white flex items-center gap-2">
                 <CheckCircle className="text-green-500" />
                 <span>Daily Targets</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-bold bg-slate-900 px-2 py-1 rounded">{goals.filter(g => g.completed).length} / {goals.length}</span>
           </div>

           <div className="flex gap-2 mb-4">
              <input 
                value={newGoal} 
                onChange={(e) => setNewGoal(e.target.value)} 
                placeholder="New directive..." 
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none transition-colors" 
              />
              <button onClick={addGoal} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500 transition-all"><Plus size={18} /></button>
           </div>

           <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1 max-h-[200px]">
              {goals.map(goal => (
                 <div 
                   key={goal.id} 
                   onClick={() => toggleGoal(goal.id)} 
                   className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all group ${
                      goal.completed ? 'bg-green-900/10 border-green-900/50 opacity-60' : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                   }`}
                 >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                       goal.completed ? 'bg-green-500 border-green-500' : 'border-slate-600 group-hover:border-blue-500'
                    }`}>
                       {goal.completed && <CheckCircle size={10} className="text-black" />}
                    </div>
                    <span className={`text-sm ${goal.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{goal.title}</span>
                    <ArrowUpRight size={12} className="ml-auto text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
              ))}
           </div>
        </div>

      </div>

      {/* =======================================================
          MODAL 1: MONTHLY PLAN (Auto-Triggers on New Month)
      ======================================================= */}
      <AnimatePresence>
        {showPlanModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0a0a0f] border border-blue-500/50 w-full max-w-lg rounded-2xl p-8 shadow-2xl relative">
              <h2 className="text-2xl font-black text-white uppercase mb-1">Mission Briefing</h2>
              <p className="text-blue-400 text-xs font-mono tracking-widest mb-6">PROTOCOL: {currentDate.toLocaleString('default', { month: 'long' }).toUpperCase()}</p>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const plan = { focus: formData.get('focus') };
                saveMonthlyPlan(plan);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-500 font-bold uppercase">Primary Objective</label>
                    <input name="focus" required placeholder="e.g. Master Geometry & Reasoning" className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:border-blue-500 outline-none mt-1" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-6 shadow-[0_0_20px_blue] transition-all">INITIALIZE MONTH</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =======================================================
          MODAL 2: REPORT CARD
      ======================================================= */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white text-black w-full max-w-lg rounded-xl p-8 relative shadow-2xl" id="printable-report">
               <button onClick={() => setShowReportModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black"><X /></button>
               
               <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Performance Report</h2>
                    <p className="text-xs font-mono text-gray-600">CHRONOS ANALYTICS // {new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black">{currentGPA}%</p>
                    <p className="text-[10px] font-bold uppercase">Rating</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-100 p-4 rounded">
                     <p className="text-[10px] text-gray-500 uppercase font-bold">Goals Met</p>
                     <p className="text-xl font-bold">{completedGoals}/{totalGoals}</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded">
                     <p className="text-[10px] text-gray-500 uppercase font-bold">Efficiency</p>
                     <p className="text-xl font-bold">{monthlyEfficiency}%</p>
                  </div>
               </div>

               <button onClick={downloadReport} className="w-full bg-black text-white font-bold py-3 rounded flex items-center justify-center gap-2 hover:bg-gray-800 transition-all">
                 <Download size={18} /> DOWNLOAD PDF
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, CheckCircle, TrendingUp, Trophy, Target, Plus, 
  Flame, Download, ChevronRight, AlertTriangle, FileText, X
} from 'lucide-react';

export default function ChronosDashboard({ user }) {
  // --- STATE ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [goals, setGoals] = useState([]);
  const [monthlyPlan, setMonthlyPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [newGoal, setNewGoal] = useState("");
  const [examDate, setExamDate] = useState("2026-08-01"); // Default Target

  // --- PERSISTENCE ENGINE (Local Storage) ---
  useEffect(() => {
    const storedGoals = localStorage.getItem('chronos_goals');
    const storedPlan = localStorage.getItem(`chronos_plan_${currentDate.getMonth()}_${currentDate.getFullYear()}`);
    
    if (storedGoals) setGoals(JSON.parse(storedGoals));
    
    if (storedPlan) {
      setMonthlyPlan(JSON.parse(storedPlan));
    } else {
      // 🚨 TRIGGER NEW MONTH PROTOCOL
      setShowPlanModal(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chronos_goals', JSON.stringify(goals));
  }, [goals]);

  // --- CALCULATIONS ENGINE ---
  const currentGPA = parseFloat((user?.total_percentage_points || 0).toFixed(1));
  const targetGPA = 95.0;
  const daysToExam = Math.max(1, Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24)));
  const gap = Math.max(0, targetGPA - currentGPA);
  const requiredDailyGrowth = (gap / daysToExam).toFixed(3); // High precision
  
  // Monthly Stats
  const completedGoals = goals.filter(g => g.completed).length;
  const totalGoals = goals.length;
  const monthlyEfficiency = totalGoals === 0 ? 0 : Math.round((completedGoals / totalGoals) * 100);

  // --- ACTIONS ---
  const saveMonthlyPlan = (planData) => {
    const key = `chronos_plan_${currentDate.getMonth()}_${currentDate.getFullYear()}`;
    localStorage.setItem(key, JSON.stringify(planData));
    setMonthlyPlan(planData);
    setShowPlanModal(false);
  };

  const addGoal = () => {
    if (!newGoal.trim()) return;
    const g = { 
      id: Date.now(), 
      title: newGoal, 
      date: new Date().toISOString().split('T')[0], 
      completed: false,
      impact: "+0.5%" // Mock impact calc
    };
    setGoals([...goals, g]);
    setNewGoal("");
  };

  const toggleGoal = (id) => {
    setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  // --- PDF GENERATOR (Native Print) ---
  const downloadReport = () => {
    const printContent = document.getElementById('printable-report');
    const windowUrl = 'about:blank';
    const uniqueName = new Date();
    const windowName = 'Print' + uniqueName.getTime();
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

    printWindow.document.write(`
      <html>
        <head>
          <title>Monthly Performance Report - ${user.username}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 40px; color: #000; }
            .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; text-transform: uppercase; }
            .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
            .stat-box { border: 1px solid #ccc; padding: 15px; }
            .stat-label { font-size: 10px; text-transform: uppercase; color: #666; }
            .stat-value { font-size: 20px; font-weight: bold; }
            .footer { margin-top: 50px; font-size: 10px; text-align: center; border-top: 1px solid #ccc; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Chronos Protocol // Monthly Report</div>
            <div>Agent: ${user.username} | Date: ${new Date().toLocaleDateString()}</div>
          </div>
          <div class="stat-grid">
            <div class="stat-box">
              <div class="stat-label">Current GPA</div>
              <div class="stat-value">${currentGPA}%</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Monthly Efficiency</div>
              <div class="stat-value">${monthlyEfficiency}%</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Missions Completed</div>
              <div class="stat-value">${completedGoals} / ${totalGoals}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Projected Selection Probability</div>
              <div class="stat-value">${(currentGPA * 0.9).toFixed(1)}%</div>
            </div>
          </div>
          <h3>Mission Log</h3>
          <ul>
            ${goals.map(g => `<li>[${g.completed ? 'X' : ' '}] ${g.title}</li>`).join('')}
          </ul>
          <div class="footer">GENERATED BY NEURAL PORTAL SYSTEM</div>
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
      
      {/* HEADER ACTION BAR */}
      <div className="flex justify-between items-center mb-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Chronos Command</h1>
          <p className="text-slate-500 text-xs font-mono tracking-widest">
            {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })} CYCLE
          </p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => setShowReportModal(true)}
             className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg border border-slate-700 transition-all shadow-lg"
           >
             <FileText size={16} /> <span className="text-xs font-bold uppercase">Performance Report</span>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">

        {/* =======================================================
            1. BALLISTICS COMPUTER (Trajectory)
        ======================================================= */}
        <div className="lg:col-span-8 bg-[#0a0a0f] border border-slate-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[100px] rounded-full"></div>
           <div className="relative z-10">
              
              {/* Target Input */}
              <div className="flex justify-between items-start mb-8">
                 <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Victory Ballistics</h2>
                    <p className="text-slate-500 text-xs">Mathematical Probability of Selection</p>
                 </div>
                 <div className="flex flex-col items-end">
                    <label className="text-[9px] text-slate-500 uppercase font-bold mb-1">Exam Date Target</label>
                    <input 
                      type="date" 
                      value={examDate} 
                      onChange={(e) => setExamDate(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-white text-xs px-3 py-1 rounded focus:border-blue-500 outline-none"
                    />
                 </div>
              </div>

              {/* The Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="p-5 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-2">Current GPA</p>
                    <div className="text-5xl font-black text-white">{currentGPA}<span className="text-lg text-slate-600">%</span></div>
                 </div>
                 
                 <div className="p-5 bg-slate-900/50 rounded-2xl border border-red-900/30 relative overflow-hidden">
                    <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
                    <p className="text-[9px] text-red-400 uppercase font-bold tracking-widest mb-2">Gap to 95%</p>
                    <div className="text-5xl font-black text-red-500">-{gap.toFixed(1)}</div>
                 </div>

                 <div className="p-5 bg-blue-900/10 rounded-2xl border border-blue-500/30">
                    <p className="text-[9px] text-blue-300 uppercase font-bold tracking-widest mb-2">Required Daily Gain</p>
                    <div className="flex items-end gap-2">
                       <TrendingUp size={32} className="text-green-400 mb-2" />
                       <div className="text-5xl font-black text-green-400">+{requiredDailyGrowth}</div>
                    </div>
                 </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-8">
                 <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-2">
                    <span>Selection Probability</span>
                    <span>{daysToExam} Days Remaining</span>
                 </div>
                 <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${currentGPA}%` }}
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_15px_cyan]"
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* =======================================================
            2. MONTHLY PLANNER (Right Column)
        ======================================================= */}
        <div className="lg:col-span-4 bg-[#0a0a0f] border border-slate-800 rounded-[2rem] p-6 shadow-xl flex flex-col relative">
           <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
              <h3 className="font-black text-lg text-slate-200 uppercase tracking-widest">
                {currentDate.toLocaleString('default', { month: 'short' })} Protocol
              </h3>
              <button onClick={() => setShowPlanModal(true)} className="text-xs text-blue-400 hover:text-blue-300 underline">Edit Plan</button>
           </div>

           <div className="flex-1 overflow-y-auto space-y-4">
              {monthlyPlan ? (
                <>
                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-700">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Primary Objective</p>
                    <p className="text-sm font-bold text-white">"{monthlyPlan.focus}"</p>
                  </div>
                  <div className="space-y-2">
                    {monthlyPlan.targets.map((t, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800/50">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-xs text-slate-300">{t}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-500 text-xs py-10">No protocol set for this month.</div>
              )}
           </div>
        </div>

        {/* =======================================================
            3. EXECUTION LOG (Bottom Full)
        ======================================================= */}
        <div className="lg:col-span-12 bg-[#0a0a0f] border border-slate-800 rounded-[2rem] p-8 shadow-xl">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-xl text-white flex items-center gap-2">
                 <CheckCircle className="text-green-500" />
                 <span>Daily Execution Log</span>
              </h3>
              
              {/* Quick Input */}
              <div className="flex gap-2 w-full max-w-md">
                <input 
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="Input daily objective..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:border-blue-500 outline-none"
                />
                <button onClick={addGoal} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500"><Plus size={18} /></button>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map(goal => (
                 <div 
                   key={goal.id}
                   onClick={() => toggleGoal(goal.id)}
                   className={`group flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      goal.completed ? 'bg-green-900/10 border-green-900/50 opacity-60' : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                   }`}
                 >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                       goal.completed ? 'bg-green-500 border-green-500' : 'border-slate-600 group-hover:border-blue-500'
                    }`}>
                       {goal.completed && <CheckCircle size={12} className="text-black" />}
                    </div>
                    <div>
                       <p className={`text-sm font-bold ${goal.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{goal.title}</p>
                       <p className="text-[10px] text-slate-500 font-mono">{goal.date}</p>
                    </div>
                 </div>
              ))}
           </div>
        </div>

      </div>

      {/* =======================================================
          MODAL 1: MONTHLY PLANNING BRIEFING
      ======================================================= */}
      <AnimatePresence>
        {showPlanModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="bg-[#0f1014] border border-blue-500/50 w-full max-w-lg rounded-2xl p-8 shadow-2xl relative"
            >
              <h2 className="text-2xl font-black text-white uppercase mb-1">Mission Briefing</h2>
              <p className="text-blue-400 text-xs font-mono tracking-widest mb-6">INITIATE PROTOCOL: {currentDate.toLocaleString('default', { month: 'long' }).toUpperCase()}</p>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const plan = {
                  focus: formData.get('focus'),
                  targets: [formData.get('t1'), formData.get('t2'), formData.get('t3')]
                };
                saveMonthlyPlan(plan);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-500 font-bold uppercase">Primary Focus</label>
                    <input name="focus" required placeholder="e.g. Complete Geometry & Physics" className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:border-blue-500 outline-none mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-bold uppercase">Top 3 Targets</label>
                    <input name="t1" required placeholder="Target Alpha" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white mt-1 mb-2 text-sm" />
                    <input name="t2" required placeholder="Target Beta" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white mb-2 text-sm" />
                    <input name="t3" required placeholder="Target Gamma" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-6 shadow-[0_0_20px_blue]">
                  INITIALIZE MONTH
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =======================================================
          MODAL 2: PERFORMANCE REPORT
      ======================================================= */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white text-black w-full max-w-2xl rounded-xl p-8 relative shadow-2xl" id="printable-report">
               <button onClick={() => setShowReportModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black"><X /></button>
               
               <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Performance Report</h2>
                    <p className="text-xs font-mono text-gray-600">CHRONOS ANALYTICS DIV // {new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-black">{currentGPA}%</p>
                    <p className="text-xs font-bold uppercase">Current Rating</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-gray-100 p-4 rounded">
                     <p className="text-xs text-gray-500 uppercase font-bold">Monthly Efficiency</p>
                     <p className="text-2xl font-bold">{monthlyEfficiency}%</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded">
                     <p className="text-xs text-gray-500 uppercase font-bold">Goals Executed</p>
                     <p className="text-2xl font-bold">{completedGoals} / {totalGoals}</p>
                  </div>
               </div>

               <div className="mb-8">
                  <h3 className="font-bold uppercase text-sm border-b border-gray-300 pb-2 mb-2">Objective Log</h3>
                  <ul className="text-sm space-y-1">
                     {goals.map(g => (
                       <li key={g.id} className="flex justify-between">
                         <span className={g.completed ? "font-bold" : "text-gray-500"}>{g.title}</span>
                         <span>{g.completed ? "COMPLETED" : "PENDING"}</span>
                       </li>
                     ))}
                  </ul>
               </div>

               <button 
                 onClick={downloadReport} 
                 className="w-full bg-black text-white font-bold py-3 rounded flex items-center justify-center gap-2 hover:bg-gray-800"
               >
                 <Download size={18} /> DOWNLOAD OFFICIAL PDF
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
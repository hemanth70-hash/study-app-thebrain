import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, CheckCircle, TrendingUp, Trophy, Target, Clock, Plus, Flame, Newspaper, Quote
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function ChronosDashboard({ user }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [goals, setGoals] = useState([
    { id: 1, title: "Finish Algebra Syllabus", date: "2026-02-15", completed: false },
    { id: 2, title: "Mock Test 50 Marks", date: "2026-02-20", completed: false }
  ]);
  const [newGoal, setNewGoal] = useState("");
  
  // 🧠 CORE DATA
  const currentGPA = parseFloat((user?.total_percentage_points || 0).toFixed(1));
  const targetGPA = 95.0; // The "Safe Score" for RRB
  const daysRemaining = 180; // Example countdown to Exam
  const gap = targetGPA - currentGPA;
  const requiredRate = gap > 0 ? (gap / daysRemaining).toFixed(2) : 0;

  // 📰 MOCK NEWS FEED (Victory Feed)
  const newsFeed = [
    { type: "news", text: "RRB NTPC Notification expected next month. 5000+ Seats." },
    { type: "win", text: "Aspirant 'Ravi_99' cleared Station Master cutoff with 89%!" },
    { type: "quote", text: "The pain of discipline is far less than the pain of regret." },
    { type: "news", text: "General Awareness weighting increased in Mains." },
    { type: "win", text: "User 'SpeedDemon' maintained a 100-day streak!" }
  ];

  // 📅 CALENDAR GENERATION
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const addGoal = () => {
    if (!newGoal.trim()) return;
    setGoals([...goals, { id: Date.now(), title: newGoal, date: new Date().toISOString().split('T')[0], completed: false }]);
    setNewGoal("");
  };

  return (
    <div className="w-full min-h-screen p-2 md:p-6 font-sans text-slate-100 grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in duration-700">
      
      {/* =======================================================
          BLOCK 1: THE TARGET CALCULATOR (Top Left - Large)
          "The Mathematical Path to Victory"
      ======================================================= */}
      <div className="md:col-span-8 bg-[#0f1014] border border-slate-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full group-hover:bg-blue-600/20 transition-all"></div>
        
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex justify-between items-start">
             <div>
               <h2 className="text-3xl font-black text-white tracking-tight">TRAJECTORY ANALYSIS</h2>
               <p className="text-slate-500 font-medium">Projected path to Government Selection</p>
             </div>
             <div className="bg-blue-900/30 border border-blue-500/50 px-4 py-2 rounded-full flex items-center gap-2">
                <Target size={18} className="text-blue-400" />
                <span className="text-blue-200 font-bold">Target: {targetGPA}%</span>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
             {/* STAT 1: CURRENT */}
             <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-2">Current Capacity</p>
                <div className="text-5xl font-black text-white">{currentGPA}<span className="text-lg text-slate-600">%</span></div>
             </div>
             {/* STAT 2: THE GAP */}
             <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
                <p className="text-xs text-red-400 uppercase font-bold tracking-widest mb-2">Deficit (Gap)</p>
                <div className="text-5xl font-black text-red-500">-{gap.toFixed(1)}<span className="text-lg text-red-900">%</span></div>
             </div>
             {/* STAT 3: REQUIRED EFFORT */}
             <div className="p-6 bg-gradient-to-br from-blue-900/50 to-slate-900 rounded-2xl border border-blue-500/30">
                <p className="text-xs text-blue-300 uppercase font-bold tracking-widest mb-2">Required Daily Growth</p>
                <div className="flex items-end gap-2">
                   <TrendingUp size={32} className="text-green-400 mb-2" />
                   <div className="text-5xl font-black text-green-400">+{requiredRate}</div>
                   <span className="text-sm text-green-700 font-bold mb-2">pts/day</span>
                </div>
             </div>
          </div>

          <div className="mt-8">
             <div className="flex justify-between text-xs font-bold text-slate-500 uppercase mb-2">
                <span>Progress Bar</span>
                <span>{daysRemaining} Days Remaining</span>
             </div>
             <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden">
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
          BLOCK 2: THE VICTORY FEED (Right Side - Tall)
          "Instant Dopamine & News"
      ======================================================= */}
      <div className="md:col-span-4 bg-[#0f1014] border border-slate-800 rounded-[2rem] p-6 shadow-xl flex flex-col relative overflow-hidden">
         <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
            <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500"><Trophy size={20} /></div>
            <h3 className="font-black text-lg text-slate-200 uppercase tracking-widest">Victory Feed</h3>
         </div>

         <div className="flex-1 overflow-hidden relative space-y-4">
            {/* Auto Scrolling Content */}
            <div className="space-y-4">
               {newsFeed.map((item, idx) => (
                 <motion.div 
                   key={idx}
                   initial={{ opacity: 0, x: 50 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: idx * 0.2 }}
                   className={`p-4 rounded-xl border-l-4 ${
                      item.type === 'win' ? 'border-green-500 bg-green-500/5' : 
                      item.type === 'news' ? 'border-blue-500 bg-blue-500/5' : 
                      'border-purple-500 bg-purple-500/5'
                   }`}
                 >
                    <div className="flex justify-between items-start mb-1">
                       <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          item.type === 'win' ? 'bg-green-500 text-black' : 
                          item.type === 'news' ? 'bg-blue-500 text-white' : 
                          'bg-purple-500 text-white'
                       }`}>
                          {item.type === 'win' ? 'HALL OF FAME' : item.type === 'news' ? 'UPDATE' : 'WISDOM'}
                       </span>
                       <span className="text-[10px] text-slate-600">Just now</span>
                    </div>
                    <p className="text-sm font-medium text-slate-300 leading-relaxed">"{item.text}"</p>
                 </motion.div>
               ))}
               
               {/* Call to Action */}
               <div className="p-4 rounded-xl border border-dashed border-slate-700 text-center opacity-50">
                  <p className="text-xs text-slate-500">Your name will be here next.</p>
               </div>
            </div>
         </div>
      </div>

      {/* =======================================================
          BLOCK 3: THE STRATEGIC CALENDAR (Bottom Left)
          "Daily Execution Grid"
      ======================================================= */}
      <div className="md:col-span-6 bg-[#0f1014] border border-slate-800 rounded-[2rem] p-8 shadow-xl">
         <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-xl text-white flex items-center gap-2">
               <Calendar className="text-purple-500" /> 
               <span>{currentDate.toLocaleString('default', { month: 'long' })} Protocol</span>
            </h3>
            <span className="text-xs font-bold bg-slate-800 px-3 py-1 rounded-full text-slate-400">2026</span>
         </div>

         {/* Calendar Grid */}
         <div className="grid grid-cols-7 gap-2">
            {['S','M','T','W','T','F','S'].map(d => (
               <div key={d} className="text-center text-xs font-bold text-slate-600 py-2">{d}</div>
            ))}
            {calendarDays.map(day => {
               // Heatmap Logic: Randomize some activity for visual effect
               const intensity = Math.random() > 0.7 ? 'bg-green-500' : Math.random() > 0.5 ? 'bg-green-900' : 'bg-slate-900';
               const isToday = day === currentDate.getDate();
               return (
                  <div 
                    key={day} 
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold border transition-all hover:scale-110 cursor-pointer
                      ${isToday ? 'border-white text-white shadow-[0_0_10px_white] bg-slate-800' : `border-transparent text-slate-500 ${intensity} hover:border-slate-600`}
                    `}
                  >
                     {day}
                  </div>
               )
            })}
         </div>
         
         <div className="mt-4 flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-slate-900"></div> Lazy</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-green-900"></div> Active</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-green-500"></div> Beast Mode</div>
         </div>
      </div>

      {/* =======================================================
          BLOCK 4: MISSION LOG (Bottom Right)
          "Import Goals & Execute"
      ======================================================= */}
      <div className="md:col-span-6 bg-[#0f1014] border border-slate-800 rounded-[2rem] p-8 shadow-xl flex flex-col">
         <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-xl text-white flex items-center gap-2">
               <CheckCircle className="text-orange-500" /> 
               <span>Mission Log</span>
            </h3>
            <div className="text-xs text-orange-500 font-bold bg-orange-500/10 px-3 py-1 rounded-full">
               {goals.filter(g => g.completed).length}/{goals.length} Complete
            </div>
         </div>

         {/* Goal Input */}
         <div className="flex gap-2 mb-6">
            <input 
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              placeholder="Inject new directive..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600 font-medium"
            />
            <button 
              onClick={addGoal}
              className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-all shadow-lg shadow-blue-600/20"
            >
               <Plus size={20} />
            </button>
         </div>

         {/* Goal List */}
         <div className="flex-1 space-y-3 overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
            {goals.map(goal => (
               <div 
                 key={goal.id} 
                 className={`group flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                   goal.completed 
                   ? 'bg-green-900/10 border-green-900 opacity-50' 
                   : 'bg-slate-900/50 border-slate-800 hover:border-slate-600'
                 }`}
                 onClick={() => {
                    const newGoals = goals.map(g => g.id === goal.id ? { ...g, completed: !g.completed } : g);
                    setGoals(newGoals);
                 }}
               >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                     goal.completed ? 'bg-green-500 border-green-500' : 'border-slate-600 group-hover:border-blue-500'
                  }`}>
                     {goal.completed && <CheckCircle size={14} className="text-white" />}
                  </div>
                  <div className="flex-1">
                     <p className={`text-sm font-bold ${goal.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {goal.title}
                     </p>
                     <p className="text-[10px] text-slate-500 font-mono mt-1">Deadline: {goal.date}</p>
                  </div>
                  {/* Calculation Tag */}
                  <div className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-1 rounded">
                     +2.5% Gain
                  </div>
               </div>
            ))}
         </div>
      </div>

    </div>
  );
}
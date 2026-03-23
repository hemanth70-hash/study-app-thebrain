import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Calendar, BookOpen, Edit3, Calculator, BarChart2, 
  FileText, CheckCircle, AlertTriangle, 
  Download, Plus, Clock, Target, Zap, Loader2
} from 'lucide-react';

const SYLLABUS_TOPICS = {
  math: ['Number System', 'Percentage', 'Ratio & Proportion', 'Average', 'Time & Work', 'Speed & Distance', 'Simple & Compound Interest', 'Profit & Loss', 'Algebra', 'Geometry', 'Trigonometry', 'Data Interpretation'],
  reasoning: ['Analogy', 'Classification', 'Series', 'Coding-Decoding', 'Blood Relations', 'Direction Test', 'Ranking & Order', 'Alphabet Test', 'Syllogism', 'Venn Diagram', 'Puzzle', 'Data Sufficiency'],
  ga: ['History', 'Geography', 'Polity', 'Economy', 'General Science', 'Current Affairs', 'Sports', 'Awards & Honors', 'Books & Authors', 'Important Days', 'Abbreviations', 'Computer Awareness']
};

const INITIAL_FORMULAS = [
  { title: "Percentage", body: "• Percentage = (Part/Whole) × 100\n• Increase % = [(New - Old)/Old] × 100\n• Decrease % = [(Old - New)/Old] × 100\n• Successive % = A + B + (AB/100)" },
  { title: "Profit & Loss", body: "• Profit = SP - CP\n• Loss = CP - SP\n• Profit % = (Profit/CP) × 100\n• Loss % = (Loss/CP) × 100\n• SP = CP × (100 + Profit%)/100\n• CP = SP × 100/(100 + Profit%)" },
  { title: "Speed, Time & Distance", body: "• Speed = Distance/Time\n• Average Speed = Total Dist/Total Time\n• Rel Speed (same) = S₁ - S₂\n• Rel Speed (opp) = S₁ + S₂" },
  { title: "Simple & Compound Interest", body: "• SI = (P × R × T)/100\n• Amount = P + SI\n• CI = P(1 + R/100)^T - P\n• Diff (2 yrs) = P × R²/(100)²" }
];

export default function NTPCTracker({ user, isDarkMode }) {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState('daily');
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState({
    sessions: [], 
    mockTests: [], 
    formulas: INITIAL_FORMULAS, 
    totalStudyTime: 0,
    syllabus: { math: {}, reasoning: {}, ga: {} }
  });

  // Forms State
  const [dailyForm, setDailyForm] = useState({ subject: 'Mathematics', topic: '', duration: '', questions: '', correct: '', conceptClear: false, needRevision: false, formulaNoted: false, notes: '' });
  const [mockForm, setMockForm] = useState({ name: '', total: 100, attempted: '', correct: '', time: '', date: new Date().toISOString().split('T')[0], mathScore: '', reasoningScore: '', gaScore: '' });

  // --- 🛡️ DATABASE FETCHING (BULLETPROOF) ---
  const fetchTrackerData = useCallback(async () => {
    // 🔥 FIX 1: If no user, turn off loader and stop. 
    if (!user?.id) {
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    try {
      const [sessionsRes, mocksRes, profileRes] = await Promise.all([
        supabase.from('study_sessions').select('*').eq('user_id', user.id).order('session_date', { ascending: false }),
        supabase.from('manual_mocks').select('*').eq('user_id', user.id).order('mock_date', { ascending: false }),
        supabase.from('profiles').select('ntpc_syllabus, ntpc_formulas').eq('id', user.id).single()
      ]);

      // Fallback arrays to prevent .map() crashes
      const fetchedSessions = sessionsRes.data || [];
      const fetchedMocks = mocksRes.data || [];
      const profile = profileRes.data || {};

      // 🔥 FIX 2: Aggressive Null Checks for JSONB
      const safeFormulas = (profile.ntpc_formulas && Array.isArray(profile.ntpc_formulas) && profile.ntpc_formulas.length > 0) 
        ? profile.ntpc_formulas 
        : INITIAL_FORMULAS;

      const safeSyllabus = (profile.ntpc_syllabus && typeof profile.ntpc_syllabus === 'object') 
        ? profile.ntpc_syllabus 
        : { math: {}, reasoning: {}, ga: {} };

      setData({
        sessions: fetchedSessions,
        mockTests: fetchedMocks,
        formulas: safeFormulas,
        totalStudyTime: fetchedSessions.reduce((acc, curr) => acc + (curr.duration || 0), 0),
        // Ensure nested objects exist to prevent syllabus tab crashes
        syllabus: {
            math: safeSyllabus.math || {},
            reasoning: safeSyllabus.reasoning || {},
            ga: safeSyllabus.ga || {}
        }
      });
    } catch (err) {
      console.error("Failed to load NTPC Tracker data:", err);
    } finally {
      setIsLoading(false); // ALWAYS turn off loader
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTrackerData();
  }, [fetchTrackerData]);

  // --- DATABASE SAVING HANDLERS ---
  const handleSaveSession = async () => {
    if (!dailyForm.topic || !dailyForm.duration) return alert('Please fill in Topic and Duration');
    
    const newSession = {
      user_id: user.id,
      session_date: new Date().toISOString(),
      subject: dailyForm.subject,
      topic: dailyForm.topic,
      duration: parseInt(dailyForm.duration) || 0,
      questions: parseInt(dailyForm.questions) || 0,
      correct: parseInt(dailyForm.correct) || 0,
      concept_clear: dailyForm.conceptClear,
      need_revision: dailyForm.needRevision,
      formula_noted: dailyForm.formulaNoted,
      notes: dailyForm.notes
    };

    try {
      const { data: inserted, error } = await supabase.from('study_sessions').insert([newSession]).select();
      if (error) throw error;

      setData(prev => ({
        ...prev,
        sessions: [inserted[0], ...prev.sessions],
        totalStudyTime: prev.totalStudyTime + newSession.duration
      }));

      setDailyForm({ subject: 'Mathematics', topic: '', duration: '', questions: '', correct: '', conceptClear: false, needRevision: false, formulaNoted: false, notes: '' });
      alert('Session Saved to Database!');
    } catch (error) {
      alert("Error saving session: " + error.message);
    }
  };

  const handleSaveMock = async () => {
    if (!mockForm.name || !mockForm.correct) return alert('Please fill Test Name and Correct Score');
    
    const newMock = {
      user_id: user.id,
      name: mockForm.name,
      total: parseInt(mockForm.total) || 100,
      attempted: parseInt(mockForm.attempted) || 0,
      correct: parseInt(mockForm.correct) || 0,
      time_taken: parseInt(mockForm.time) || 0,
      mock_date: mockForm.date,
      math_score: mockForm.mathScore,
      reasoning_score: mockForm.reasoningScore,
      ga_score: mockForm.gaScore
    };

    try {
      const { data: inserted, error } = await supabase.from('manual_mocks').insert([newMock]).select();
      if (error) throw error;

      setData(prev => ({ ...prev, mockTests: [inserted[0], ...prev.mockTests] }));
      setMockForm({ name: '', total: 100, attempted: '', correct: '', time: '', date: new Date().toISOString().split('T')[0], mathScore: '', reasoningScore: '', gaScore: '' });
      alert('Mock Test Saved to Database!');
    } catch (error) {
      alert("Error saving mock: " + error.message);
    }
  };

  const toggleSyllabus = async (subject, topic) => {
    const updatedSyllabus = {
      ...data.syllabus,
      [subject]: {
        ...data.syllabus[subject],
        [topic]: !data.syllabus[subject][topic]
      }
    };

    setData(prev => ({ ...prev, syllabus: updatedSyllabus }));
    try { await supabase.from('profiles').update({ ntpc_syllabus: updatedSyllabus }).eq('id', user.id); } 
    catch (error) { console.error("Failed to sync syllabus:", error); }
  };

  const addCustomFormula = async () => {
    const title = window.prompt('Enter Formula Category/Title:');
    const body = window.prompt('Enter Formula Details:');
    if (title && body) {
      const newFormulas = [...data.formulas, { title, body }];
      setData(prev => ({ ...prev, formulas: newFormulas }));
      try { await supabase.from('profiles').update({ ntpc_formulas: newFormulas }).eq('id', user.id); } 
      catch (error) { console.error("Failed to sync formulas:", error); }
    }
  };

  const downloadReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(30, 60, 114);
    doc.text('NTPC Preparation Report', 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
    
    doc.setFontSize(14);
    doc.text('Summary Statistics', 20, 45);
    doc.setFontSize(10);
    doc.text(`Total Study Hours: ${(data.totalStudyTime / 60).toFixed(1)}`, 20, 55);
    doc.text(`Total Sessions: ${data.sessions.length}`, 20, 62);
    doc.text(`Mock Tests Taken: ${data.mockTests.length}`, 20, 69);
    
    doc.setFontSize(14);
    doc.text('Recent Study Sessions', 20, 85);
    
    const tableData = data.sessions.slice(0, 10).map(s => [
      new Date(s.session_date).toLocaleDateString(),
      s.subject,
      s.topic,
      `${s.duration} min`,
      `${s.correct}/${s.questions}`
    ]);

    autoTable(doc, {
      startY: 90,
      head: [['Date', 'Subject', 'Topic', 'Time', 'Score']],
      body: tableData,
    });

    doc.save(`NTPC_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // --- COMPUTED DATA ---
  const todayStr = new Date().toDateString();
  const todaySessions = data.sessions.filter(s => new Date(s.session_date).toDateString() === todayStr);
  const todayMinutes = todaySessions.reduce((acc, curr) => acc + (curr.duration || 0), 0);
  const todayQs = todaySessions.reduce((acc, curr) => acc + (curr.questions || 0), 0);
  const todayCorrect = todaySessions.reduce((acc, curr) => acc + (curr.correct || 0), 0);
  const todayAccuracy = todayQs > 0 ? Math.round((todayCorrect / todayQs) * 100) : 0;

  const totalQs = data.sessions.reduce((acc, curr) => acc + (curr.questions || 0), 0);
  const totalCorrect = data.sessions.reduce((acc, curr) => acc + (curr.correct || 0), 0);
  const overallAccuracy = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;

  // --- STYLING ---
  const theme = {
    bg: isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900',
    card: isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200',
    input: isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900',
    tabBase: 'flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap',
    tabActive: 'bg-blue-600 text-white shadow-lg shadow-blue-500/30',
    tabInactive: isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-200',
  };

  const tabs = [
    { id: 'daily', icon: Calendar, label: 'Daily Tracker' },
    { id: 'mock', icon: Edit3, label: 'Mock Tests' },
    { id: 'syllabus', icon: BookOpen, label: 'Syllabus Progress' },
    { id: 'formulas', icon: Calculator, label: 'Formula Bank' },
    { id: 'analytics', icon: BarChart2, label: 'Analytics' },
    { id: 'reports', icon: FileText, label: 'Reports' },
  ];

  if (isLoading) {
    return (
      <div className={`min-h-[80vh] flex flex-col items-center justify-center ${theme.bg}`}>
         <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
         <p className="font-black uppercase tracking-widest text-xs opacity-50">Syncing with Grid...</p>
      </div>
    );
  }

  // If component loaded but no user exists
  if (!user?.id) {
     return (
       <div className={`min-h-[80vh] flex flex-col items-center justify-center ${theme.bg}`}>
         <AlertTriangle size={48} className="text-orange-500 mb-4" />
         <p className="font-black uppercase tracking-widest text-xs opacity-50">User Profile Not Found</p>
      </div>
     );
  }

  return (
    <div className={`min-h-screen p-4 md:p-8 font-sans transition-colors duration-500 ${theme.bg}`}>
      
      {/* HEADER */}
      <div className={`p-6 md:p-8 rounded-3xl shadow-xl border mb-8 ${theme.card}`}>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight flex items-center gap-3 text-blue-600 dark:text-blue-400 mb-2">
          🚆 NTPC Prep Hub
        </h1>
        <p className="text-sm font-bold opacity-60 uppercase tracking-widest">Your Centralized Railway Exam Command Center</p>
        
        {/* TABS */}
        <div className="flex gap-2 overflow-x-auto custom-scrollbar mt-8 pb-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${theme.tabBase} ${activeTab === tab.id ? theme.tabActive : theme.tabInactive}`}
              >
                <Icon size={18} /> <span className="text-xs uppercase tracking-wider">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* ================= DAILY TRACKER ================= */}
        {activeTab === 'daily' && (
          <div className="space-y-6">
            <div className={`p-8 rounded-3xl shadow-xl border ${theme.card}`}>
              <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Today's Blueprint - {new Date().toLocaleDateString()}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-lg">
                  <Clock className="mb-2 opacity-50" size={24} />
                  <h3 className="text-4xl font-black mb-1">{(todayMinutes / 60).toFixed(1)} <span className="text-sm">HRS</span></h3>
                  <p className="text-[10px] uppercase tracking-widest font-bold opacity-80">Studied Today</p>
                </div>
                <div className="bg-gradient-to-br from-pink-500 to-rose-600 text-white p-6 rounded-2xl shadow-lg">
                  <Target className="mb-2 opacity-50" size={24} />
                  <h3 className="text-4xl font-black mb-1">{todayQs}</h3>
                  <p className="text-[10px] uppercase tracking-widest font-bold opacity-80">Questions Solved</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 rounded-2xl shadow-lg">
                  <Zap className="mb-2 opacity-50" size={24} />
                  <h3 className="text-4xl font-black mb-1">{todayAccuracy}%</h3>
                  <p className="text-[10px] uppercase tracking-widest font-bold opacity-80">Accuracy Rate</p>
                </div>
              </div>

              <div className={`p-6 rounded-2xl border-2 border-dashed ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-blue-200 bg-blue-50/50'}`}>
                <h3 className="font-black uppercase tracking-widest text-xs mb-6 text-blue-500">Log New Session</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-60 mb-2">Subject</label>
                    <select 
                      className={`w-full p-3 rounded-xl border outline-none font-bold text-sm ${theme.input}`}
                      value={dailyForm.subject} onChange={e => setDailyForm({...dailyForm, subject: e.target.value})}
                    >
                      <option>Mathematics</option>
                      <option>General Intelligence & Reasoning</option>
                      <option>General Awareness</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-60 mb-2">Topic</label>
                    <input type="text" placeholder="e.g. Percentages" className={`w-full p-3 rounded-xl border outline-none font-bold text-sm ${theme.input}`} value={dailyForm.topic} onChange={e => setDailyForm({...dailyForm, topic: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-60 mb-2">Duration (Mins)</label>
                    <input type="number" placeholder="60" className={`w-full p-3 rounded-xl border outline-none font-bold text-sm ${theme.input}`} value={dailyForm.duration} onChange={e => setDailyForm({...dailyForm, duration: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-60 mb-2">Questions Attempted</label>
                    <input type="number" placeholder="50" className={`w-full p-3 rounded-xl border outline-none font-bold text-sm ${theme.input}`} value={dailyForm.questions} onChange={e => setDailyForm({...dailyForm, questions: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-60 mb-2">Correct Answers</label>
                    <input type="number" placeholder="40" className={`w-full p-3 rounded-xl border outline-none font-bold text-sm ${theme.input}`} value={dailyForm.correct} onChange={e => setDailyForm({...dailyForm, correct: e.target.value})} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                    <input type="checkbox" checked={dailyForm.conceptClear} onChange={e => setDailyForm({...dailyForm, conceptClear: e.target.checked})} className="w-5 h-5 rounded text-blue-600 focus:ring-0" />
                    Concepts Clear
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                    <input type="checkbox" checked={dailyForm.needRevision} onChange={e => setDailyForm({...dailyForm, needRevision: e.target.checked})} className="w-5 h-5 rounded text-orange-500 focus:ring-0" />
                    Needs Revision
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                    <input type="checkbox" checked={dailyForm.formulaNoted} onChange={e => setDailyForm({...dailyForm, formulaNoted: e.target.checked})} className="w-5 h-5 rounded text-purple-500 focus:ring-0" />
                    Formula Noted
                  </label>
                </div>

                <textarea placeholder="Session notes, doubts, or observations..." rows="2" className={`w-full p-4 rounded-xl border outline-none font-bold text-sm mb-4 ${theme.input}`} value={dailyForm.notes} onChange={e => setDailyForm({...dailyForm, notes: e.target.value})}></textarea>
                
                <button onClick={handleSaveSession} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-lg">Save Session Data</button>
              </div>
            </div>

            {/* SESSIONS TABLE */}
            <div className={`p-8 rounded-3xl shadow-xl border overflow-x-auto ${theme.card}`}>
              <h3 className="font-black uppercase tracking-widest text-xs mb-6">Recent Sessions</h3>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest opacity-50 border-b dark:border-slate-700">
                    <th className="pb-4 pr-4">Date</th>
                    <th className="pb-4 pr-4">Subject</th>
                    <th className="pb-4 pr-4">Topic</th>
                    <th className="pb-4 pr-4">Time</th>
                    <th className="pb-4 pr-4">Score</th>
                    <th className="pb-4">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-bold">
                  {data.sessions.slice(0,10).map((s, i) => (
                    <tr key={s.id || i} className="border-b dark:border-slate-800 last:border-0">
                      <td className="py-4 pr-4 opacity-70">{new Date(s.session_date).toLocaleDateString()}</td>
                      <td className="py-4 pr-4 text-blue-500">{s.subject}</td>
                      <td className="py-4 pr-4">{s.topic}</td>
                      <td className="py-4 pr-4 opacity-70">{s.duration}m</td>
                      <td className="py-4 pr-4">{s.correct}/{s.questions}</td>
                      <td className="py-4">
                        {s.concept_clear ? <CheckCircle size={16} className="text-green-500" /> : <AlertTriangle size={16} className="text-orange-500" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.sessions.length === 0 && <p className="text-center py-10 opacity-50 font-bold uppercase text-xs">No sessions logged yet.</p>}
            </div>
          </div>
        )}

        {/* ================= MOCK TESTS ================= */}
        {activeTab === 'mock' && (
          <div className="space-y-6">
            <div className={`p-8 rounded-3xl shadow-xl border ${theme.card}`}>
              <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Mock Test Repository</h2>
              
              <div className={`p-6 rounded-2xl border-2 border-dashed mb-10 ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-purple-200 bg-purple-50/50'}`}>
                <h3 className="font-black uppercase tracking-widest text-xs mb-6 text-purple-500">Record New Mock</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold uppercase opacity-60 mb-2">Test Name</label>
                    <input type="text" placeholder="e.g. Testbook Full Mock 1" className={`w-full p-3 rounded-xl border outline-none font-bold text-sm ${theme.input}`} value={mockForm.name} onChange={e => setMockForm({...mockForm, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-60 mb-2">Date</label>
                    <input type="date" className={`w-full p-3 rounded-xl border outline-none font-bold text-sm ${theme.input}`} value={mockForm.date} onChange={e => setMockForm({...mockForm, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-60 mb-2">Total Qs</label>
                    <input type="number" className={`w-full p-3 rounded-xl border outline-none font-bold text-sm ${theme.input}`} value={mockForm.total} onChange={e => setMockForm({...mockForm, total: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-60 mb-2">Attempted</label>
                    <input type="number" placeholder="90" className={`w-full p-3 rounded-xl border outline-none font-bold text-sm ${theme.input}`} value={mockForm.attempted} onChange={e => setMockForm({...mockForm, attempted: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase opacity-60 mb-2">Correct</label>
                    <input type="number" placeholder="75" className={`w-full p-3 rounded-xl border outline-none font-bold text-sm ${theme.input}`} value={mockForm.correct} onChange={e => setMockForm({...mockForm, correct: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold uppercase opacity-60 mb-2">Time Taken (Mins)</label>
                    <input type="number" placeholder="90" className={`w-full p-3 rounded-xl border outline-none font-bold text-sm ${theme.input}`} value={mockForm.time} onChange={e => setMockForm({...mockForm, time: e.target.value})} />
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-[10px] font-bold uppercase opacity-60 mb-2">Math (Score)</label>
                      <input type="text" placeholder="25/30" className={`w-full p-3 rounded-xl border outline-none font-bold text-sm ${theme.input}`} value={mockForm.mathScore} onChange={e => setMockForm({...mockForm, mathScore: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase opacity-60 mb-2">Reasoning (Score)</label>
                      <input type="text" placeholder="28/30" className={`w-full p-3 rounded-xl border outline-none font-bold text-sm ${theme.input}`} value={mockForm.reasoningScore} onChange={e => setMockForm({...mockForm, reasoningScore: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase opacity-60 mb-2">GA (Score)</label>
                      <input type="text" placeholder="20/40" className={`w-full p-3 rounded-xl border outline-none font-bold text-sm ${theme.input}`} value={mockForm.gaScore} onChange={e => setMockForm({...mockForm, gaScore: e.target.value})} />
                    </div>
                </div>
                
                <button onClick={handleSaveMock} className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-lg">Save Mock Results</button>
              </div>

              <h3 className="font-black uppercase tracking-widest text-xs mb-6">Mock History</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.mockTests.map((mock, i) => {
                  const percentage = Math.round((mock.correct / mock.total) * 100);
                  return (
                    <div key={mock.id || i} className={`p-6 rounded-2xl border flex flex-col justify-between ${theme.card}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                           <h4 className="font-black text-lg uppercase tracking-tight">{mock.name}</h4>
                           <p className="text-[10px] uppercase font-bold opacity-60">{new Date(mock.mock_date).toLocaleDateString()} • {mock.time_taken} mins</p>
                        </div>
                        <div className={`px-4 py-2 rounded-xl text-xl font-black ${percentage >= 70 ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30'}`}>
                          {percentage}%
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs font-bold opacity-70">
                         <span>M: {mock.math_score || '-'}</span>
                         <span>R: {mock.reasoning_score || '-'}</span>
                         <span>GA: {mock.ga_score || '-'}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              {data.mockTests.length === 0 && <p className="text-center py-10 opacity-50 font-bold uppercase text-xs">No mock tests recorded yet.</p>}
            </div>
          </div>
        )}

        {/* ================= SYLLABUS PROGRESS ================= */}
        {activeTab === 'syllabus' && (
          <div className="space-y-6">
            {Object.entries(SYLLABUS_TOPICS).map(([subjectKey, topics]) => {
              const displayTitle = subjectKey === 'math' ? 'Mathematics' : subjectKey === 'reasoning' ? 'Intelligence & Reasoning' : 'General Awareness';
              const completedCount = topics.filter(t => data.syllabus[subjectKey]?.[t]).length;
              const progressPct = Math.round((completedCount / topics.length) * 100);
              
              return (
                <div key={subjectKey} className={`p-8 rounded-3xl shadow-xl border ${theme.card}`}>
                  <div className="flex justify-between items-end mb-4">
                    <h2 className="text-xl font-black uppercase tracking-tight">{displayTitle}</h2>
                    <span className="text-2xl font-black text-blue-500">{progressPct}%</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-6">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500" style={{ width: `${progressPct}%` }}></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {topics.map(topic => {
                      const isDone = data.syllabus[subjectKey]?.[topic];
                      return (
                        <button 
                          key={topic}
                          onClick={() => toggleSyllabus(subjectKey, topic)}
                          className={`p-4 rounded-xl border-2 text-left font-bold text-sm transition-all flex items-center justify-between ${isDone ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : `${theme.input} hover:border-blue-400`}`}
                        >
                          {topic}
                          {isDone && <CheckCircle size={16} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= FORMULA BANK ================= */}
        {activeTab === 'formulas' && (
          <div className={`p-8 rounded-3xl shadow-xl border ${theme.card}`}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tight">Quick Reference Vault</h2>
              <button onClick={addCustomFormula} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-blue-700">
                <Plus size={14} /> Add Formula
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.formulas.map((f, i) => (
                <div key={i} className={`p-6 rounded-2xl border-l-4 border-l-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <h4 className="text-lg font-black uppercase tracking-tight mb-4 text-blue-500">{f.title}</h4>
                  <pre className="whitespace-pre-wrap font-mono text-sm font-bold opacity-80 leading-relaxed">{f.body}</pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= ANALYTICS ================= */}
        {activeTab === 'analytics' && (
          <div className={`p-8 rounded-3xl shadow-xl border ${theme.card}`}>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-8">Performance Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-8 rounded-3xl shadow-lg">
                  <p className="text-[10px] uppercase tracking-widest font-bold opacity-80 mb-2">Total Prep Days</p>
                  <h3 className="text-5xl font-black">{data.sessions.length > 0 ? Math.floor((new Date() - new Date(data.sessions[data.sessions.length-1].session_date)) / (1000*60*60*24)) + 1 : 0}</h3>
                </div>
                <div className="bg-gradient-to-br from-pink-500 to-orange-400 text-white p-8 rounded-3xl shadow-lg">
                  <p className="text-[10px] uppercase tracking-widest font-bold opacity-80 mb-2">Total Study Hours</p>
                  <h3 className="text-5xl font-black">{(data.totalStudyTime / 60).toFixed(1)}</h3>
                </div>
                <div className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white p-8 rounded-3xl shadow-lg">
                  <p className="text-[10px] uppercase tracking-widest font-bold opacity-80 mb-2">Lifetime Accuracy</p>
                  <h3 className="text-5xl font-black">{overallAccuracy}%</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                 <h4 className="font-black uppercase tracking-widest text-xs mb-4 text-green-500 flex items-center gap-2"><CheckCircle size={16}/> Strongest Concepts</h4>
                 <div className="flex flex-wrap gap-2">
                   {Array.from(new Set(data.sessions.filter(s => s.concept_clear).map(s => s.topic))).slice(0,5).map((t,i) => (
                     <span key={i} className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-[10px] font-bold uppercase">{t}</span>
                   ))}
                   {data.sessions.filter(s => s.concept_clear).length === 0 && <span className="text-xs opacity-50 font-bold">Needs more data</span>}
                 </div>
              </div>
              <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                 <h4 className="font-black uppercase tracking-widest text-xs mb-4 text-red-500 flex items-center gap-2"><AlertTriangle size={16}/> Needs Revision</h4>
                 <div className="flex flex-wrap gap-2">
                   {Array.from(new Set(data.sessions.filter(s => s.need_revision).map(s => s.topic))).slice(0,5).map((t,i) => (
                     <span key={i} className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-[10px] font-bold uppercase">{t}</span>
                   ))}
                   {data.sessions.filter(s => s.need_revision).length === 0 && <span className="text-xs opacity-50 font-bold">No revision flags</span>}
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= REPORTS ================= */}
        {activeTab === 'reports' && (
          <div className={`p-8 rounded-3xl shadow-xl border text-center ${theme.card}`}>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-8">Export Neural Data</h2>
            <FileText size={64} className="mx-auto text-blue-500 mb-6 opacity-80" />
            <p className="text-sm font-bold opacity-70 max-w-md mx-auto mb-8">Generate a comprehensive PDF report containing your lifetime study hours, mock scores, and session logs for offline review.</p>
            
            <button onClick={downloadReport} className="flex items-center gap-3 mx-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-sm tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95">
              <Download size={18} /> Download Master PDF Report
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
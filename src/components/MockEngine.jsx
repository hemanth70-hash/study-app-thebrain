import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Timer, CheckCircle, Play, Zap, Award, 
  Clock, ArrowLeft, Eye, Lock, ShieldAlert, Hourglass, AlertTriangle
} from 'lucide-react';

export default function MockEngine({ user, onFinish, setIsExamLocked, setIsDarkMode }) {
  // --- 1. COMPREHENSIVE STATE MANAGEMENT ---
  const [availableMocks, setAvailableMocks] = useState([]);
  const [selectedMock, setSelectedMock] = useState(null);
  const [questions, setQuestions] = useState([]); 
  const [subjects, setSubjects] = useState([]); 
  const [activeSubject, setActiveSubject] = useState(""); 
  const [currentIdx, setCurrentIdx] = useState(0); 
  const [selectedOptions, setSelectedOptions] = useState({});
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [completedMockIds, setCompletedMockIds] = useState([]); 
  const [showStreakAnim, setShowStreakAnim] = useState(false);
  const [warnings, setWarnings] = useState(0); 
  const [timeUntilMidnight, setTimeUntilMidnight] = useState(""); 

  // --- 2. NEURAL TIMER & PROCTORING (STRICT LOCKDOWN) ---
  useEffect(() => {
    let interval = null;
    
    // Auto-Submit Watchdog
    if (selectedMock && !isFinished && timeLeft === 0) {
      console.warn("Simulation Exhausted. Finalizing...");
      handleSubmit(false); 
      return;
    }

    if (selectedMock && !isFinished && timeLeft > 0) {
      if (setIsExamLocked) setIsExamLocked(true);
      if (setIsDarkMode) setIsDarkMode(true);

      interval = setInterval(() => {
        setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);

      // Strict Mode Surveillance
      if (selectedMock.is_strict) {
        const handleVisibility = () => {
          if (document.hidden) {
            setWarnings(prev => {
              const next = prev + 1;
              if (next >= 2) {
                alert("CRITICAL SECURITY BREACH: Simulation Terminated. Results Disqualified.");
                handleSubmit(true); 
                return next;
              }
              alert(`STRICT MODE WARNING: Strike ${next}/2. Attempt to exit recorded.`);
              return next;
            });
          }
        };

        window.history.pushState(null, null, window.location.href);
        const blockNavigation = () => window.history.pushState(null, null, window.location.href);

        document.addEventListener("visibilitychange", handleVisibility);
        window.addEventListener('popstate', blockNavigation);

        return () => {
          clearInterval(interval);
          document.removeEventListener("visibilitychange", handleVisibility);
          window.removeEventListener('popstate', blockNavigation);
        };
      }
    }
    return () => { if (interval) clearInterval(interval); };
  }, [selectedMock?.id, isFinished, timeLeft === 0]); 

  // --- 3. MIDNIGHT COUNTDOWN ---
  useEffect(() => {
    const updateCountdown = () => {
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0); 
      const diff = midnight - new Date();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeUntilMidnight(`${h}h ${m}m ${s}s`);
    };
    const timer = setInterval(updateCountdown, 1000);
    updateCountdown();
    return () => clearInterval(timer);
  }, []);

  // --- 4. ATOMIC DATA LOAD (DUAL-TABLE SYNC) ---
  const loadMockData = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch from both 'mocks' and 'daily_mocks' simultaneously
      const [regRes, daiRes, compRes] = await Promise.all([
        supabase.from('mocks').select('*').order('created_at', { ascending: false }),
        supabase.from('daily_mocks').select('*').eq('mock_date', today),
        supabase.from('completed_daily_mocks').select('mock_id').eq('user_id', user.id)
      ]);

      if (compRes.data) setCompletedMockIds(compRes.data.map(c => c.mock_id));
      
      const combined = [
        ...(regRes.data || []).map(m => ({ ...m, is_daily: false })),
        ...(daiRes.data || []).map(m => ({ ...m, is_daily: true }))
      ];
      
      setAvailableMocks(combined.sort((a, b) => (b.is_daily ? 1 : -1)));
    } catch (err) {
      console.error("Neural Grid Access Error:", err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { loadMockData(); }, [loadMockData]);

  // --- 5. ENGINE STARTUP ---
  const startMock = async (mock) => {
    if (mock.is_daily && completedMockIds.includes(mock.id)) {
      alert("Neural Node already secured for today.");
      return;
    }
    
    // Explicit fetch of questions to ensure fresh data
    const table = mock.is_daily ? 'daily_mocks' : 'mocks';
    const { data } = await supabase.from(table).select('*').eq('id', mock.id).single();

    if (data && data.questions) {
      const raw = data.questions;
      if (raw[0]?.subject) {
        setSubjects(raw);
        setQuestions(raw.flatMap(s => s.questions));
        setActiveSubject(raw[0].subject);
      } else {
        setSubjects([{ subject: "General", questions: raw }]);
        setQuestions(raw);
        setActiveSubject("General");
      }
      setSelectedMock(data);
      setWarnings(0);
      setTimeLeft((parseInt(data.time_limit) || 10) * 60); 
    }
  };

  const getAbsIdx = (subName, qIdx) => {
    let offset = 0;
    for (let s of subjects) {
      if (s.subject === subName) break;
      offset += s.questions.length;
    }
    return offset + qIdx;
  };

  // --- 6. SUBMISSION & DETAILED BREAKDOWN GENERATION ---
  const handleSubmit = async (isPenalty = false) => {
    if (isFinished) return;
    if (setIsExamLocked) setIsExamLocked(false); 

    let scoreCount = 0;
    
    // Generate the Data Packet for the PDF Report
    const breakdown = questions.map((q, idx) => {
      const selected = selectedOptions[idx];
      const isCorrect = selected === q.correct_option;
      if (isCorrect && !isPenalty) scoreCount++;
      
      return {
        question: q.question,
        selected: selected !== undefined ? q.options[selected] : "Not Attempted",
        actual: q.options[q.correct_option],
        status: isPenalty ? "DISQUALIFIED" : (isCorrect ? "CORRECT" : "WRONG"),
        options: q.options
      };
    });

    const percentage = isPenalty ? 0 : Math.round((scoreCount / questions.length) * 100);

    try {
      // A. History Log
      await supabase.from('scores').insert([{
        user_id: user.id, mock_id: selectedMock.id, score: scoreCount, 
        percentage: percentage, mock_title: selectedMock.mock_title,
        status: isPenalty ? 'DISQUALIFIED' : 'COMPLETED'
      }]);

      // B. Profile Identity Sync
      const updatePayload = { 
        total_exams_completed: (user.total_exams_completed || 0) + 1,
        total_percentage_points: (user.total_percentage_points || 0) + percentage
      };

      // 🔥 Overwrite the last_regular_result slot for PDF Report generation
      if (!selectedMock.is_daily) {
        updatePayload.last_regular_result = {
          title: selectedMock.mock_title,
          score: scoreCount,
          total: questions.length,
          percentage: percentage,
          timestamp: new Date().toISOString(),
          breakdown: breakdown 
        };
      }

      await supabase.from('profiles').update(updatePayload).eq('id', user.id);

      // C. Daily Streak logic
      if (selectedMock.is_daily) {
        await supabase.from('completed_daily_mocks').insert([{ user_id: user.id, mock_id: selectedMock.id }]);
        if (!isPenalty) {
          await supabase.from('profiles').update({ 
            streak_count: (user.streak_count || 0) + 1, 
            last_mock_date: new Date().toISOString().split('T')[0] 
          }).eq('id', user.id);
          setShowStreakAnim(true);
        }
      }
      setIsFinished(true);
      loadMockData(); 
    } catch (err) { console.error("Neural Submission Error", err); }
  };

  const handleReturn = () => {
    setSelectedMock(null); setQuestions([]); setSubjects([]); 
    setActiveSubject(""); setCurrentIdx(0); setSelectedOptions({});
    setIsFinished(false); setShowReview(false); setShowStreakAnim(false);
    if (setIsExamLocked) setIsExamLocked(false);
    onFinish(); 
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-blue-600 uppercase tracking-widest">Connecting Neural Grid...</div>;

  // --- VIEW: LIBRARY (SELECTION SCREEN) ---
  if (!selectedMock) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-700">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl">
             <Play fill="currentColor" size={24} />
          </div>
          <h3 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Simulation Library</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availableMocks.map((mock) => {
            const isDone = completedMockIds.includes(mock.id);
            return (
              <button key={mock.id} disabled={mock.is_daily && isDone} onClick={() => startMock(mock)} 
                className={`p-8 rounded-[32px] text-left transition-all shadow-xl border-b-8 relative group hover:scale-[1.02] ${
                  mock.is_daily 
                    ? (isDone ? 'bg-gray-100 dark:bg-gray-800 opacity-60 border-gray-300' : 'bg-gradient-to-br from-orange-500 to-red-600 text-white border-orange-700') 
                    : 'bg-white dark:bg-gray-800 dark:text-white border-blue-500'
                }`}>
                
                {mock.is_daily && !isDone && (
                  <div className="absolute -top-3 right-8 bg-black text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase flex items-center gap-2 shadow-2xl border border-white/20">
                    <Hourglass size={12} className="animate-spin text-orange-400" /> Expires: {timeUntilMidnight}
                  </div>
                )}

                <div className="flex justify-between items-start mb-6">
                  <div className={`p-4 rounded-2xl ${mock.is_daily ? 'bg-white/20' : 'bg-blue-50 dark:bg-gray-700 text-blue-600'}`}>
                    {isDone ? <Lock size={28} /> : (mock.is_daily ? <Zap size={28} /> : <Layout size={28} />)}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="flex items-center gap-1 bg-black/10 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                      <Clock size={12} /> {mock.time_limit} MINS
                    </span>
                    {mock.is_strict && <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><ShieldAlert size={10} /> Strict</span>}
                  </div>
                </div>
                
                <h4 className="text-2xl font-black uppercase mb-1 tracking-tight">{mock.mock_title}</h4>
                <p className="text-[10px] opacity-60 font-black uppercase tracking-widest">
                   {isDone ? 'STREAK NODE SECURED' : (mock.is_daily ? 'Daily Streak Required' : 'Casual Practice Simulation')}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // --- VIEW: RESULTS & REVIEW ---
  if (isFinished) {
    const finalScore = Math.round((questions.filter((q, i) => selectedOptions[i] === q.correct_option).length / questions.length) * 100);
    
    if (showReview) {
      return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20 animate-in slide-in-from-bottom-6 duration-500">
          <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-lg border dark:border-gray-700">
            <button onClick={() => setShowReview(false)} className="px-6 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-2 dark:text-white transition-all bg-gray-100 dark:bg-gray-700 hover:scale-105">
              <ArrowLeft size={16} /> Summary
            </button>
            <h3 className="font-black uppercase tracking-widest text-blue-600">Detailed Analytics</h3>
          </div>
          
          {questions.map((q, idx) => (
            <div key={idx} className={`p-10 rounded-[3rem] border-l-[12px] bg-white dark:bg-gray-800 shadow-xl transition-all ${selectedOptions[idx] === q.correct_option ? 'border-green-500' : 'border-red-500'}`}>
              <div className="flex justify-between items-start mb-6">
                 <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Node Question {idx + 1}</span>
                 {selectedOptions[idx] === q.correct_option ? 
                   <div className="bg-green-100 text-green-600 px-4 py-1.5 rounded-full font-black text-[10px] uppercase flex items-center gap-2"><CheckCircle size={16} /> Validated</div> : 
                   <div className="bg-red-100 text-red-600 px-4 py-1.5 rounded-full font-black text-[10px] uppercase flex items-center gap-2"><ShieldAlert size={16} /> Error</div>
                 }
              </div>
              
              <p className="font-bold text-xl dark:text-white mb-8 leading-snug">{q.question}</p>
              
              <div className="grid grid-cols-1 gap-4">
                {q.options.map((opt, i) => (
                  <div key={i} className={`p-5 rounded-2xl text-sm font-bold flex justify-between items-center transition-all ${
                    i === q.correct_option ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-2 ring-green-500/30' : 
                    i === selectedOptions[idx] ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                    'bg-gray-50 dark:bg-gray-900/50 opacity-60'
                  }`}>
                    <span className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-[10px]">{String.fromCharCode(65 + i)}</div>
                      {opt}
                    </span>
                    {i === q.correct_option && <span className="text-[8px] font-black uppercase bg-green-500 text-white px-3 py-1 rounded-lg shadow-md">Correct Node</span>}
                    {i === selectedOptions[idx] && i !== q.correct_option && <span className="text-[8px] font-black uppercase bg-red-500 text-white px-3 py-1 rounded-lg shadow-md">Input Received</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="max-w-xl mx-auto text-center p-16 bg-white dark:bg-gray-800 rounded-[50px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border-t-[12px] border-green-500 relative overflow-hidden">
        {showStreakAnim && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 flex flex-col items-center justify-center bg-orange-600 z-50 text-white p-6">
            <div className="text-[10rem] mb-4">🔥</div>
            <h2 className="text-6xl font-black uppercase tracking-tighter mb-4">STREAK +1</h2>
            <p className="font-bold opacity-80 mb-10">DAILY NODE SYNCHRONIZED</p>
            <button onClick={() => setShowStreakAnim(false)} className="bg-white text-orange-600 px-16 py-5 rounded-full font-black uppercase text-sm shadow-2xl hover:scale-110 transition-all">Proceed</button>
          </motion.div>
        )}
        
        <Award size={80} className="mx-auto text-green-500 mb-8 animate-bounce" />
        <h2 className="text-4xl font-black dark:text-white uppercase tracking-tighter">Neural Record</h2>
        <div className="text-8xl font-black text-blue-600 my-10 tracking-tighter">{finalScore}<span className="text-3xl opacity-40">%</span></div>
        
        <div className="space-y-4">
            <button onClick={() => setShowReview(true)} className="flex items-center justify-center gap-3 w-full bg-gray-100 dark:bg-gray-700 py-5 rounded-[2rem] font-black uppercase text-xs hover:bg-blue-600 hover:text-white transition-all duration-300">
               <Eye size={20} /> Inspect Simulation Breakdown
            </button>
            <button onClick={handleReturn} className="w-full bg-black dark:bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">
               Return to Neural Portal
            </button>
        </div>
      </div>
    );
  }

  // --- VIEW: CBT INTERFACE ---
  const activeSubData = subjects.find(s => s.subject === activeSubject);
  const isFinalMinute = timeLeft <= 60;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-1000">
      {/* Subject Tabs & Timer */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-[2.5rem] shadow-2xl flex flex-wrap justify-between items-center border dark:border-gray-700 backdrop-blur-xl">
        <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
          {subjects.map(s => (
            <button key={s.subject} onClick={() => {setActiveSubject(s.subject); setCurrentIdx(0);}} 
              className={`px-8 py-3 rounded-2xl font-black text-[11px] uppercase whitespace-nowrap transition-all ${
                activeSubject === s.subject ? 'bg-blue-600 text-white shadow-[0_10px_20px_rgba(37,99,235,0.3)] scale-105' : 'bg-gray-50 dark:bg-gray-900 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}>{s.subject}</button>
          ))}
        </div>
        
        <div className={`flex items-center gap-4 font-mono text-3xl font-black px-10 py-3 rounded-[1.5rem] transition-all duration-500 shadow-inner ${
          isFinalMinute ? 'bg-red-600 text-white animate-pulse' : 'bg-black text-white'
        }`}>
          <Timer size={24} className={isFinalMinute ? 'animate-spin' : ''} /> 
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Question Area */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-12 rounded-[4rem] shadow-2xl border dark:border-gray-700 relative min-h-[600px] flex flex-col">
          {selectedMock.is_strict && (
            <div className="absolute top-8 right-12 flex items-center gap-3">
               <div className="flex gap-1">
                 {[...Array(2)].map((_, i) => (
                   <div key={i} className={`w-3 h-3 rounded-full ${warnings > i ? 'bg-red-500 animate-ping' : 'bg-gray-200'}`} />
                 ))}
               </div>
               <span className="text-red-500 font-black text-[10px] uppercase tracking-widest">Strikes: {warnings}/2</span>
            </div>
          )}

          <div className="flex-1">
            <h4 className="text-blue-600 font-black uppercase text-[12px] mb-6 tracking-[0.3em] flex items-center gap-2">
               <Database size={16} /> {activeSubject} / SIMULATION {currentIdx + 1}
            </h4>
            <h3 className="text-3xl font-bold dark:text-white mb-12 leading-tight tracking-tight">
              {activeSubData.questions[currentIdx].question}
            </h3>
            
            <div className="grid grid-cols-1 gap-5">
              {activeSubData.questions[currentIdx].options.map((opt, i) => {
                const absIdx = getAbsIdx(activeSubject, currentIdx);
                const isSelected = selectedOptions[absIdx] === i;
                return (
                  <button key={i} onClick={() => setSelectedOptions({...selectedOptions, [absIdx]: i})} 
                    className={`w-full text-left p-8 rounded-[2rem] border-2 transition-all duration-300 font-bold flex items-center gap-6 group ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/40 dark:text-white shadow-lg' 
                        : 'border-gray-100 dark:border-gray-700 dark:text-gray-300 hover:border-blue-300 hover:bg-gray-50'
                    }`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all ${
                      isSelected ? 'bg-blue-600 text-white rotate-6' : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100'
                    }`}>{String.fromCharCode(65 + i)}</div>
                    <span className="text-lg">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-16 flex justify-between pt-10 border-t-2 border-dashed dark:border-gray-700">
            <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(prev => prev - 1)} className="px-8 py-3 text-gray-400 font-black uppercase text-sm disabled:opacity-20 hover:text-blue-600 transition-all flex items-center gap-2">
               <ArrowLeft size={18} /> Previous
            </button>
            <button disabled={currentIdx === activeSubData.questions.length - 1} onClick={() => setCurrentIdx(prev => prev + 1)} className="px-14 py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-xs shadow-[0_15px_30px_rgba(37,99,235,0.4)] disabled:opacity-20 hover:scale-110 active:scale-95 transition-all">
               Next Simulation
            </button>
          </div>
        </div>

        {/* Question Palette Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] shadow-xl border dark:border-gray-700 text-center">
            <p className="text-[10px] font-black uppercase text-gray-400 mb-8 tracking-widest flex items-center justify-center gap-2">
               <ListFilter size={14} /> Simulation Nodes
            </p>
            <div className="grid grid-cols-4 gap-3 mb-10 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {activeSubData.questions.map((_, i) => {
                const absIdx = getAbsIdx(activeSubject, i);
                const isDone = selectedOptions[absIdx] !== undefined;
                const isCurrent = currentIdx === i;
                return (
                  <button key={i} onClick={() => setCurrentIdx(i)} 
                    className={`aspect-square rounded-2xl font-black text-xs transition-all duration-300 ${
                      isCurrent ? 'ring-4 ring-blue-500 ring-offset-4 dark:ring-offset-gray-800 scale-110 z-10' : ''
                    } ${isDone ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-900 text-gray-400 hover:bg-gray-200'}`}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
            
            <button onClick={() => { if(window.confirm("Broadcast final results to Neural Portal?")) handleSubmit(false); }} 
              className="w-full bg-red-600 text-white py-6 rounded-[2rem] font-black uppercase text-xs shadow-[0_15px_30px_rgba(220,38,38,0.3)] active:scale-95 transition-all hover:bg-red-700 flex items-center justify-center gap-2">
              <ShieldAlert size={20} /> Terminate & Submit
            </button>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[3rem] shadow-2xl text-white">
             <div className="flex items-center gap-3 mb-4">
                <AlertTriangle size={24} className="text-yellow-400 animate-pulse" />
                <h5 className="font-black uppercase text-[10px] tracking-widest">Protocol Warning</h5>
             </div>
             <p className="text-[11px] font-bold opacity-80 leading-relaxed uppercase text-left">
                Ensure all nodes are validated before termination. Disconnection during strict mode results in zero GPA retention.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
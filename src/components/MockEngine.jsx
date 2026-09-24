import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Timer, CheckCircle, Play, Layout, Zap, Award, 
  Clock, ArrowLeft, Eye, Lock, ShieldAlert, Hourglass, Search, X, ChevronRight, BarChart2
} from 'lucide-react';

export default function MockEngine({ user, onFinish, setIsExamLocked, setIsDarkMode, isDarkMode }) {
  // --- STATE MANAGEMENT ---
  const [availableMocks, setAvailableMocks] = useState([]);
  const [filteredMocks, setFilteredMocks] = useState([]); 
  const [searchQuery, setSearchQuery] = useState(""); 
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

  // --- 🛡️ THE OMNI-PARSER & DICTIONARY TRANSFORMER ---
  const forceArray = (val) => {
    if (Array.isArray(val)) return val;
    if (val && typeof val === 'object') return Object.values(val);
    return [];
  };

  const sanitizeQuestions = (qList) => {
    const arr = forceArray(qList);
    return arr.map(q => {
        if (!q || typeof q !== 'object') return null;

        let opts = forceArray(q.options || q.Options || q.choices || q.Choices);
        if (opts.length === 0) opts = ["Option A", "Option B", "Option C", "Option D"];

        const ansStr = q.correct_answer || q.Correct_Answer || q.answer;
        let cIdx = q.correct_option ?? q.Correct_Option ?? q.correctIndex;

        if (cIdx === undefined && ansStr !== undefined) {
            cIdx = opts.findIndex(o => String(o).trim().toLowerCase() === String(ansStr).trim().toLowerCase());
        }

        return {
            ...q,
            question: q.question || q.Question || q.text || "⚠️ Missing Question Data",
            options: opts,
            correct_option: cIdx !== undefined && cIdx !== -1 ? cIdx : 0,
            explanation: q.explanation || q.Explanation || null
        };
    }).filter(Boolean); 
  };

  const parsePayload = (raw) => {
    let parsed = raw;
    while (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch (e) { break; }
    }
    return parsed;
  };

  const getCorrectIdx = (q) => q?.correct_option ?? 0;

  // --- 1. NEURAL TIMER & PROCTORING ---
  useEffect(() => {
    let interval = null;
    if (selectedMock && !isFinished && timeLeft === 0) {
      handleSubmit(false); 
      return;
    }
    if (selectedMock && !isFinished && timeLeft > 0) {
      if (setIsExamLocked) setIsExamLocked(true);
      if (setIsDarkMode) setIsDarkMode(true);
      interval = setInterval(() => setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1)), 1000);

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
              alert(`STRICT MODE WARNING: Strike ${next}/2. Exit attempt recorded.`);
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

  // --- 2. MIDNIGHT COUNTDOWN ---
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0); 
      const diff = midnight - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeUntilMidnight(`${hours}h ${mins}m ${secs}s`);
    };
    const timer = setInterval(updateCountdown, 1000);
    updateCountdown();
    return () => clearInterval(timer);
  }, []);

  // --- 3. ATOMIC DATA LOAD ---
  const loadMockData = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [dailyRes, normalRes, completionRes] = await Promise.all([
        supabase.from('daily_mocks').select('*'),
        supabase.from('mocks').select('*'),
        supabase.from('completed_daily_mocks').select('mock_id').eq('user_id', user.id)
      ]);

      if (completionRes.data) setCompletedMockIds(completionRes.data.map(c => c.mock_id));
      
      let allMocks = [];
      if (dailyRes.data) allMocks = [...allMocks, ...dailyRes.data.filter(m => m.mock_date === today)];
      if (normalRes.data) allMocks = [...allMocks, ...normalRes.data];

      const sorted = allMocks.sort((a, b) => {
        if (a.is_daily && !b.is_daily) return -1;
        if (!a.is_daily && b.is_daily) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      });

      setAvailableMocks(sorted);
      setFilteredMocks(sorted);
    } catch (err) {
      console.error("Neural Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { loadMockData(); }, [loadMockData]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMocks(availableMocks);
    } else {
      setFilteredMocks(availableMocks.filter(m => m.mock_title.toLowerCase().includes(searchQuery.toLowerCase())));
    }
  }, [searchQuery, availableMocks]);

  // --- 4. ENGINE STARTUP (WITH DICTIONARY DECODER) ---
  const startMock = async (mock) => {
    const isLocked = mock.is_daily && completedMockIds.some(id => String(id) === String(mock.id));
    if (isLocked) { alert("Daily mock already secured."); return; }
    
    setLoading(true);
    const tableName = mock.is_daily ? 'daily_mocks' : 'mocks';
    const { data } = await supabase.from(tableName).select('*').eq('id', mock.id).single();
    setLoading(false);

    if (data && data.questions) {
      let rawData = parsePayload(data.questions);

      if (!rawData || (typeof rawData === 'object' && Object.keys(rawData).length === 0) || (Array.isArray(rawData) && rawData.length === 0)) {
          alert("CRITICAL ERROR: Simulation data is empty.");
          setSelectedMock(null);
          return;
      }

      let finalSubjects = [];

      // 🛡️ SCENARIO 1: The data is a dictionary like {"Module 1": [...], "Module 2": [...]}
      if (typeof rawData === 'object' && !Array.isArray(rawData)) {
          // If there's an outer wrapper like {"questions": {"Module 1": [...]}}, strip it
          if (rawData.questions && typeof rawData.questions === 'object' && !Array.isArray(rawData.questions)) {
              rawData = rawData.questions;
          }

          finalSubjects = Object.keys(rawData).map(key => {
              if (key === 'is_strict') return null; // Ignore config flags
              return {
                  subject: key,
                  questions: sanitizeQuestions(rawData[key])
              };
          }).filter(sub => sub && sub.questions.length > 0);
      } 
      // 🛡️ SCENARIO 2: The data is an array of objects
      else if (Array.isArray(rawData)) {
          const isCategorized = rawData.some(item => (item.subject || item.Subject) && (item.questions || item.Questions));
          
          if (isCategorized) {
              finalSubjects = rawData.map(sub => ({
                  subject: sub.subject || sub.Subject || "Module",
                  questions: sanitizeQuestions(sub.questions || sub.Questions)
              })).filter(sub => sub.questions.length > 0);
          } else {
              finalSubjects = [{
                  subject: "General Module",
                  questions: sanitizeQuestions(rawData)
              }].filter(sub => sub.questions.length > 0);
          }
      }

      if (finalSubjects.length === 0) {
          alert("CRITICAL ERROR: Failed to extract valid questions from the simulation.");
          setSelectedMock(null);
          return;
      }

      setSubjects(finalSubjects);
      setQuestions(finalSubjects.flatMap(s => s.questions));
      setActiveSubject(finalSubjects[0].subject);
      setSelectedMock(data);
      setWarnings(0); setCurrentIdx(0); setSelectedOptions({});
      
      const limitInMinutes = parseInt(data.time_limit) || 10;
      setTimeLeft(limitInMinutes * 60); 
    }
  };

  const getAbsIdx = (subName, qIdx) => {
    let offset = 0;
    for (let s of forceArray(subjects)) {
      if (s.subject === subName) break;
      offset += forceArray(s.questions).length;
    }
    return offset + qIdx;
  };

  // --- 5. SUBMISSION ---
  const handleSubmit = async (isPenalty = false) => {
    if (isFinished) return;
    if (setIsExamLocked) setIsExamLocked(false); 

    let scoreCount = 0;
    const safeQuestions = forceArray(questions);
    
    const breakdown = safeQuestions.map((q, idx) => {
      const selectedIdx = selectedOptions[idx];
      const correctIdx = getCorrectIdx(q);
      const isCorrect = selectedIdx === correctIdx;
      
      let qSubject = "General Module";
      let counter = 0;
      for (let s of forceArray(subjects)) {
         const sQuestions = forceArray(s.questions);
         if (idx < counter + sQuestions.length) { qSubject = s.subject; break; }
         counter += sQuestions.length;
      }

      if (isCorrect && !isPenalty) scoreCount++;
      return {
        subject: qSubject,
        question: q.question,
        selected_option: selectedIdx !== undefined && forceArray(q.options) ? forceArray(q.options)[selectedIdx] : "Not Attempted",
        correct_answer: correctIdx !== -1 && forceArray(q.options) ? forceArray(q.options)[correctIdx] : "Unknown",
        status: isPenalty ? "DISQUALIFIED" : (isCorrect ? "CORRECT" : "WRONG"),
        options: forceArray(q.options),
        explanation: q.explanation 
      };
    });

    const percentage = isPenalty || safeQuestions.length === 0 ? 0 : Math.round((scoreCount / safeQuestions.length) * 100);

    try {
      const { error: scoreErr } = await supabase.from('scores').insert([{
        user_id: user.id, mock_id: selectedMock.id, score: scoreCount, 
        percentage: percentage, mock_title: selectedMock.mock_title, status: isPenalty ? 'DISQUALIFIED' : 'COMPLETED'
      }]);
      if (scoreErr && scoreErr.code !== '23505') throw scoreErr;

      const updatePayload = { 
        total_exams_completed: (user.total_exams_completed || 0) + 1,
        total_percentage_points: (user.total_percentage_points || 0) + percentage
      };

      if (!selectedMock.is_daily) {
        updatePayload.last_regular_result = {
          title: selectedMock.mock_title, score: scoreCount, total: safeQuestions.length,
          percentage: percentage, timestamp: new Date().toISOString(), breakdown: breakdown 
        };
      }
      
      await supabase.from('profiles').update(updatePayload).eq('id', user.id);

      if (selectedMock.is_daily) {
        const { error: lockErr } = await supabase.from('completed_daily_mocks').insert([{ user_id: user.id, mock_id: selectedMock.id }]);
        if (!lockErr || lockErr.code === '23505') {
            setCompletedMockIds(prev => [...prev, selectedMock.id]);
        }
        
        if (!isPenalty) {
          const today = new Date().toISOString().split('T')[0];
          await supabase.from('profiles').update({ streak_count: (user.streak_count || 0) + 1, last_mock_date: today }).eq('id', user.id);
          setShowStreakAnim(true);
        }
      }
      setIsFinished(true);
    } catch (err) { 
      console.warn("Soft Data Sync Error: ", err.message); 
      setIsFinished(true); 
    }
  };

  const handleReturn = () => {
    setSelectedMock(null); setQuestions([]); setSubjects([]); setActiveSubject(""); 
    setCurrentIdx(0); setSelectedOptions({}); setIsFinished(false); setShowReview(false); 
    setShowStreakAnim(false); if (setIsExamLocked) setIsExamLocked(false); onFinish(); 
  };

  if (loading && !selectedMock) return <div className="p-20 text-center font-black animate-pulse text-blue-600 uppercase tracking-widest">Connecting Grid...</div>;

  // --- VIEW: LIBRARY ---
  if (!selectedMock) {
    const dailyExists = availableMocks.some(m => m.is_daily);
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-2 gap-4">
          <div className="flex items-center gap-3">
            <Play className="text-blue-600" fill="currentColor" />
            <h3 className={`text-2xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Exam Library</h3>
          </div>
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500" size={18} />
            <input type="text" placeholder="Search Simulation..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-10 py-3 rounded-2xl border-2 outline-none font-bold text-xs uppercase tracking-wider transition-all ${isDarkMode ? 'bg-slate-900 border-slate-700 focus:border-blue-500 text-white' : 'bg-white border-slate-200 focus:border-blue-500 text-slate-900'}`} />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-3.5 text-slate-400 hover:text-red-500"><X size={16} /></button>}
          </div>
        </div>
        {!dailyExists && <div className={`p-8 rounded-[32px] border-2 border-dashed text-center ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}><p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">No daily mock active.</p></div>}
        {filteredMocks.length === 0 ? ( <div className="text-center py-20 opacity-50 font-black uppercase tracking-widest">No matching simulations found.</div> ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
            {filteredMocks.map((mock) => {
              const isDone = completedMockIds.some(id => String(id) === String(mock.id));
              return (
                <button key={mock.id} disabled={mock.is_daily && isDone} onClick={() => startMock(mock)} 
                  className={`p-8 rounded-[32px] text-left transition-all shadow-xl border-b-8 relative group hover:scale-[1.02] active:scale-95 ${mock.is_daily ? (isDone ? 'bg-gray-100 opacity-60 cursor-not-allowed' : 'bg-gradient-to-br from-orange-500 to-red-600 text-white border-orange-700') : `${isDarkMode ? 'bg-slate-800 text-white border-blue-600 hover:border-blue-500' : 'bg-white text-gray-900 border-blue-500 hover:border-blue-400'}`}`}>
                  {mock.is_daily && !isDone && ( <div className="absolute -top-3 right-8 bg-black text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase flex items-center gap-2 shadow-2xl border border-white/20"><Hourglass size={12} className="animate-spin" /> Expires: {timeUntilMidnight}</div> )}
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${mock.is_daily ? 'bg-white/20' : isDarkMode ? 'bg-slate-700' : 'bg-blue-50 text-blue-600'}`}>{isDone ? <Lock size={24} /> : <Zap size={24} />}</div>
                    <span className="flex items-center gap-1 bg-black/10 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">{mock.is_strict && <ShieldAlert size={12} className="text-red-400 mr-1" />}<Clock size={12} /> {mock.time_limit}m</span>
                  </div>
                  <h4 className="text-xl font-black uppercase mb-1 tracking-tight line-clamp-1">{mock.mock_title}</h4>
                  <p className="text-[10px] opacity-70 font-black uppercase tracking-widest">{isDone ? 'STREAK SECURED' : (mock.is_strict ? 'STRICT PROTOCOL' : 'MULTI-MODULE PRACTICE')}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // --- VIEW: RESULTS & REVIEW ---
  if (isFinished) {
    const safeQuestions = forceArray(questions);
    const finalScore = safeQuestions.length === 0 ? 0 : Math.round((safeQuestions.filter((q, i) => selectedOptions[i] === getCorrectIdx(q)).length / safeQuestions.length) * 100);
    const correctCount = safeQuestions.filter((q, i) => selectedOptions[i] === getCorrectIdx(q)).length;
    
    if (showReview) {
      return (
        <div className="space-y-12 max-w-4xl mx-auto pb-20 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => setShowReview(false)} className={`px-6 py-3 rounded-2xl shadow-sm border font-black uppercase text-xs flex items-center gap-2 transition-all hover:scale-105 ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-gray-900 border-gray-100'}`}><ArrowLeft size={16} /> Back to Result</button>
            <div className={`px-4 py-2 rounded-xl font-black uppercase text-[10px] ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>Module Review Mode</div>
          </div>
          
          {forceArray(subjects).map((sub, sIdx) => (
            <div key={sIdx} className="space-y-6">
              <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3 text-blue-500 border-b-2 border-blue-500/20 pb-4">
                 <Layout size={24} /> Module: {sub.subject}
              </h3>

              {forceArray(sub.questions).map((q, qIdx) => {
                const absIdx = getAbsIdx(sub.subject, qIdx);
                const correctIdx = getCorrectIdx(q);
                const userSelectedCorrectly = selectedOptions[absIdx] === correctIdx;

                return (
                  <div key={qIdx} className={`p-8 rounded-[2.5rem] border-l-8 shadow-xl transition-all ${isDarkMode ? 'bg-slate-800' : 'bg-white'} ${userSelectedCorrectly ? 'border-green-500' : 'border-red-500'}`}>
                    <div className="flex justify-between items-start mb-4">
                       <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Question {qIdx + 1}</span>
                       {userSelectedCorrectly ? <div className="flex items-center gap-1 text-green-500 font-black text-[10px] uppercase"><CheckCircle size={16} /> Correct</div> : <div className="flex items-center gap-1 text-red-500 font-black text-[10px] uppercase"><ShieldAlert size={16} /> Incorrect</div>}
                    </div>
                    <p className={`font-bold text-lg mb-4 leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{q.question}</p>
                    
                    {q.explanation?.summary && (
                      <div className={`mb-6 p-4 rounded-xl border flex gap-3 items-start ${isDarkMode ? 'bg-blue-900/10 border-blue-900/30 text-blue-300' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
                        <Zap size={18} className="shrink-0 mt-0.5" />
                        <p className="text-xs font-bold leading-relaxed">{q.explanation.summary}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 gap-3">
                      {forceArray(q.options).map((opt, i) => {
                        const isCorrect = i === correctIdx;
                        const isSelected = i === selectedOptions[absIdx];
                        const optExplanation = isCorrect ? q.explanation?.why_correct : q.explanation?.why_wrong?.[opt];
                        
                        let cardStyle = isCorrect ? 'bg-green-100 border-green-300 dark:bg-green-900/20 dark:border-green-500/30' : isSelected ? 'bg-red-100 border-red-300 dark:bg-red-900/20 dark:border-red-500/30' : isDarkMode ? 'bg-slate-900 border-slate-700 opacity-80' : 'bg-gray-50 border-gray-200 opacity-80';
                        let textStyle = isCorrect ? 'text-green-700 dark:text-green-400' : isSelected ? 'text-red-700 dark:text-red-400' : isDarkMode ? 'text-slate-400' : 'text-gray-500';

                        return (
                          <div key={i} className={`flex flex-col rounded-2xl transition-all border ${cardStyle}`}>
                            <div className="p-4 flex justify-between items-center text-sm font-bold">
                              <span className={textStyle}>{opt}</span>
                              <div className="flex gap-2">
                                {isCorrect && <span className="text-[8px] font-black uppercase bg-green-500 text-white px-2 py-1 rounded-md shadow-sm">Correct Answer</span>}
                                {isSelected && !isCorrect && <span className="text-[8px] font-black uppercase bg-red-500 text-white px-2 py-1 rounded-md shadow-sm">Your Answer</span>}
                              </div>
                            </div>
                            {optExplanation && (
                              <div className={`px-4 pb-4 text-xs font-medium ${isCorrect ? 'text-green-800 dark:text-green-300' : isSelected ? 'text-red-800 dark:text-red-300' : isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                                <div className={`pt-3 border-t ${isCorrect ? 'border-green-200 dark:border-green-900/50' : isSelected ? 'border-red-200 dark:border-red-900/50' : isDarkMode ? 'border-slate-800' : 'border-gray-200'}`}>
                                  <span className="font-black uppercase text-[9px] tracking-wider block mb-1 opacity-70">{isCorrect ? '✓ Why it is correct' : '✗ Misconception Breakdown'}</span>
                                  {optExplanation}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className={`max-w-2xl mx-auto p-12 rounded-[40px] shadow-2xl border-t-8 border-green-500 relative overflow-hidden animate-in zoom-in duration-500 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
        {showStreakAnim && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-orange-600 z-50 text-white p-6 text-center animate-in zoom-in duration-500">
            <div className="text-8xl animate-bounce mb-4">🔥</div><h2 className="text-5xl font-black uppercase tracking-tighter mb-2">STREAK +1</h2>
            <button onClick={() => setShowStreakAnim(false)} className="mt-10 bg-white text-orange-600 px-12 py-4 rounded-[2rem] font-black uppercase text-xs shadow-2xl hover:scale-105 transition-all">Continue</button>
          </div>
        )}
        <div className="text-center">
          <Award size={64} className="mx-auto text-green-500 mb-6" />
          <h2 className={`text-3xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Neural Record</h2>
          <div className="text-6xl font-black text-blue-600 my-6">{finalScore}%</div>
          <p className="text-gray-400 font-bold text-[10px] uppercase mb-10 tracking-widest italic">Overall Grid Accuracy</p>
        </div>

        <div className="mb-10">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2"><BarChart2 size={14}/> Module Diagnostics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {forceArray(subjects).map((sub, i) => {
              const safeSubQ = forceArray(sub.questions);
              const totalSub = safeSubQ.length;
              let correctSub = 0;
              safeSubQ.forEach((q, qIdx) => { if(selectedOptions[getAbsIdx(sub.subject, qIdx)] === getCorrectIdx(q)) correctSub++; });
              
              return (
                <div key={i} className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                  <span className="text-[8px] font-black uppercase text-gray-500 mb-1 line-clamp-1 w-full">{sub.subject}</span>
                  <span className="text-2xl font-black text-blue-500">{correctSub}<span className="text-sm opacity-50">/{totalSub}</span></span>
                </div>
              )
            })}
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
            <button onClick={() => setShowReview(true)} className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black uppercase text-xs hover:bg-gray-200 transition-all ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-900'}`}><Eye size={20} /> Module Deep Review</button>
            <button onClick={handleReturn} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-blue-700 active:scale-95 transition-all">Return to Portal</button>
        </div>
      </div>
    );
  }

  // --- VIEW: MULTI-MODULE CBT INTERFACE ---
  const safeSubjectsArray = forceArray(subjects);
  const activeSubData = safeSubjectsArray.find(s => s.subject === activeSubject);
  const activeSubIndex = safeSubjectsArray.findIndex(s => s.subject === activeSubject);
  const isFinalMinute = timeLeft <= 60; 
  const activeSubQuestions = forceArray(activeSubData?.questions);
  const isLastQuestionInSub = currentIdx === (activeSubQuestions.length - 1);
  const hasNextModule = activeSubIndex < safeSubjectsArray.length - 1;

  // 🛡️ CORRUPTION FALLBACK (Prevents infinite loading)
  if (!activeSubData || activeSubQuestions.length === 0) {
      return (
          <div className="p-20 flex flex-col items-center justify-center text-center font-black animate-in zoom-in duration-500">
              <ShieldAlert size={64} className="text-red-500 mb-6" />
              <h2 className="text-3xl text-red-500 uppercase tracking-tighter mb-2">Grid Corruption Detected</h2>
              <p className="text-gray-400 uppercase text-[10px] tracking-widest max-w-md">
                  The simulation data structure is invalid or fundamentally missing. This usually happens when the JSON uploaded to the database is malformed.
              </p>
              <button onClick={handleReturn} className="mt-8 px-8 py-4 bg-red-600 text-white rounded-2xl shadow-xl hover:bg-red-700 transition-all">
                  Abort Simulation
              </button>
          </div>
      );
  }

  const currentQuestion = activeSubQuestions[currentIdx] || {};
  const currentOptions = forceArray(currentQuestion.options);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className={`p-4 rounded-[2rem] shadow-xl flex flex-wrap justify-between items-center border transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
        <div className="flex flex-wrap gap-2">
          {safeSubjectsArray.map(s => {
            const safeQuestions = forceArray(s.questions);
            const isSubComplete = safeQuestions.length > 0 && safeQuestions.every((_, i) => selectedOptions[getAbsIdx(s.subject, i)] !== undefined);

            return (
              <button key={s.subject} onClick={() => {setActiveSubject(s.subject); setCurrentIdx(0);}} 
                className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all flex items-center gap-2 ${activeSubject === s.subject ? 'bg-blue-600 text-white shadow-lg scale-105' : `${isDarkMode ? 'bg-slate-900 text-slate-500 hover:bg-slate-700' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}`}>
                {s.subject}
                {isSubComplete && <CheckCircle size={12} className={activeSubject === s.subject ? 'text-white' : 'text-green-500'} />}
              </button>
            );
          })}
        </div>
        
        <div className={`flex items-center gap-3 font-mono text-xl font-bold px-6 py-2 rounded-xl transition-all duration-300 ${isFinalMinute ? 'bg-red-600 text-white animate-pulse' : 'bg-black text-white'}`}>
          <Timer size={18} className={isFinalMinute ? 'animate-spin' : ''} /> 
          {Math.max(0, Math.floor(timeLeft / 60))}:{String(Math.max(0, timeLeft % 60)).padStart(2, '0')}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className={`lg:col-span-3 p-10 rounded-[3rem] shadow-2xl border relative transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
          {selectedMock.is_strict && <div className="absolute top-6 right-10 text-red-500 font-black text-[10px] uppercase flex items-center gap-2 animate-pulse"><ShieldAlert size={14} /> Strikes: {warnings}/2</div>}
          
          <h4 className="text-blue-500 font-black uppercase text-[10px] mb-4 tracking-widest flex items-center gap-2">
             {activeSubject} / Question {currentIdx + 1}
          </h4>
          
          <h3 className={`text-2xl font-bold mb-10 leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{currentQuestion.question}</h3>
          
          <div className="grid grid-cols-1 gap-4">
            {currentOptions.map((opt, i) => {
              const absIdx = getAbsIdx(activeSubject, currentIdx);
              const isSelected = selectedOptions[absIdx] === i;
              return (
                <button key={i} onClick={() => setSelectedOptions({...selectedOptions, [absIdx]: i})} 
                  className={`w-full text-left p-6 rounded-2xl border-2 transition-all font-bold flex items-center gap-4 group ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:text-white' : `${isDarkMode ? 'border-slate-700 text-slate-300 hover:border-blue-700' : 'border-gray-100 text-gray-700 hover:border-blue-300'}`}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-colors ${isSelected ? 'bg-blue-600 text-white' : `${isDarkMode ? 'bg-slate-700 group-hover:bg-blue-900' : 'bg-gray-100 group-hover:bg-blue-100'}`}`}>{String.fromCharCode(65 + i)}</div>{opt}
                </button>
              )
            })}
          </div>

          <div className={`mt-12 flex justify-between pt-8 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
            <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(prev => prev - 1)} className="px-6 py-2 text-gray-400 font-bold uppercase text-xs disabled:opacity-30 hover:text-gray-600 transition-all">Previous</button>
            <button 
              onClick={() => {
                if (isLastQuestionInSub) {
                  if (hasNextModule) { setActiveSubject(safeSubjectsArray[activeSubIndex + 1].subject); setCurrentIdx(0); }
                } else {
                  setCurrentIdx(prev => prev + 1);
                }
              }} 
              disabled={isLastQuestionInSub && !hasNextModule}
              className={`px-10 py-4 rounded-2xl font-black uppercase text-xs shadow-lg flex items-center gap-2 disabled:opacity-30 hover:scale-105 active:scale-95 transition-all ${isLastQuestionInSub ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
              {isLastQuestionInSub ? (hasNextModule ? 'Next Module' : 'End of Exam') : 'Next Question'}
              {isLastQuestionInSub && hasNextModule && <ChevronRight size={16}/>}
            </button>
          </div>
        </div>

        <div className={`p-8 rounded-[3rem] shadow-xl border text-center transition-colors flex flex-col h-full ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
          <p className="text-[10px] font-black uppercase text-gray-400 mb-6 tracking-widest border-b pb-4 dark:border-slate-700">{activeSubject} Palette</p>
          <div className="grid grid-cols-4 gap-2 mb-8 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {activeSubQuestions.map((_, i) => {
              const absIdx = getAbsIdx(activeSubject, i);
              const isDone = selectedOptions[absIdx] !== undefined;
              return (
                <button key={i} onClick={() => setCurrentIdx(i)} 
                  className={`aspect-square rounded-xl font-black text-xs transition-all ${currentIdx === i ? 'ring-2 ring-blue-500 ring-offset-2 scale-110' : ''} ${isDone ? 'bg-green-500 text-white shadow-md' : `${isDarkMode ? 'bg-slate-900 text-slate-600 hover:bg-slate-700' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}`}>{i + 1}</button>
              )
            })}
          </div>
          <button onClick={() => { if(window.confirm("Submit final neural transmission?")) handleSubmit(false); }} className="w-full mt-auto bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all hover:bg-red-700">Submit Full Test</button>
        </div>
      </div>
    </div>
  );
}
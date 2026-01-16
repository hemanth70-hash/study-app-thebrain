import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Timer, CheckCircle, Play, Layout, Zap, Award, 
  Clock, ArrowLeft, Eye, Lock, ShieldAlert, AlertTriangle, Hourglass
} from 'lucide-react';

export default function MockEngine({ user, onFinish, setIsExamLocked, setIsDarkMode }) {
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

  // --- 1. NEURAL TIMER & PROCTORING (STRICT LOCKDOWN) ---
  useEffect(() => {
    let interval = null;
    
    // 🔥 FIXED: Only start timer if a mock is active and has time
    if (selectedMock && !isFinished && timeLeft > 0) {
      if (setIsExamLocked) setIsExamLocked(true);
      if (setIsDarkMode) setIsDarkMode(true);

      // Decoupled from dependencies to prevent jumping
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      if (selectedMock.is_strict) {
        // A. TERMINATE ON TAB/WINDOW SWITCH
        const handleVisibility = () => {
          if (document.hidden) {
            setWarnings(prev => {
              const next = prev + 1;
              if (next >= 2) { // Disqualify on 2nd breach
                alert("STRICT MODE BREACH: Simulation Terminated. Results Disqualified.");
                handleSubmit(true); 
                return next;
              }
              alert(`STRICT MODE WARNING: Strike ${next}/2. Stay on this tab.`);
              return next;
            });
          }
        };

        // B. BLOCK NAVIGATION (LOCK USER IN)
        window.history.pushState(null, null, window.location.href);
        const blockNavigation = () => {
          window.history.pushState(null, null, window.location.href);
          alert("SECURITY LOCK: Navigation disabled during active simulation.");
        };

        document.addEventListener("visibilitychange", handleVisibility);
        window.addEventListener('popstate', blockNavigation);

        return () => {
          clearInterval(interval);
          document.removeEventListener("visibilitychange", handleVisibility);
          window.removeEventListener('popstate', blockNavigation);
        };
      }
    } else if (timeLeft === 0 && selectedMock && !isFinished) {
      handleSubmit(); // Auto-submit on time exhaustion
    }

    return () => {
      if (interval) clearInterval(interval);
    };
    // 🧠 Dependencies anchored to prevent re-triggering the effect loop
  }, [selectedMock?.id, isFinished]); 

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
      const { data: mockData } = await supabase.from('daily_mocks').select('*');
      const { data: completionData } = await supabase.from('completed_daily_mocks').select('mock_id').eq('user_id', user.id);

      if (completionData) setCompletedMockIds(completionData.map(c => c.mock_id));
      
      if (mockData) {
        const activeMocks = mockData.filter(mock => {
          if (!mock.is_daily) return true;
          return mock.mock_date === today; 
        });
        setAvailableMocks(activeMocks.sort((a, b) => (b.is_daily ? 1 : -1)));
      }
    } catch (err) {
      console.error("Neural Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadMockData();
  }, [loadMockData]);

  // --- 4. ENGINE START ---
  const startMock = async (mock) => {
    if (mock.is_daily && completedMockIds.includes(mock.id)) {
      alert("Daily mock already secured.");
      return;
    }
    const { data } = await supabase.from('daily_mocks').select('*').eq('id', mock.id).single();
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
      // Ensure integer parsing for database values
      const limit = parseInt(data.time_limit) || 10;
      setTimeLeft(limit * 60); 
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

  // --- 5. SUBMISSION & PERMANENT GPA LOGIC ---
  const handleSubmit = async (isPenalty = false) => {
    if (isFinished) return;
    if (setIsExamLocked) setIsExamLocked(false); 

    let scoreCount = 0;
    if (!isPenalty) {
      questions.forEach((q, idx) => {
        if (selectedOptions[idx] === q.correct_option) scoreCount++;
      });
    }
    const percentage = isPenalty ? 0 : Math.round((scoreCount / questions.length) * 100);

    try {
      await supabase.from('scores').insert([{
        user_id: user.id, mock_id: selectedMock.id, score: scoreCount, 
        percentage: percentage, mock_title: selectedMock.mock_title,
        is_daily: selectedMock.is_daily, status: isPenalty ? 'DISQUALIFIED' : 'COMPLETED'
      }]);

      await supabase.from('profiles')
        .update({ 
          total_exams_completed: (user.total_exams_completed || 0) + 1,
          total_percentage_points: (user.total_percentage_points || 0) + percentage
        })
        .eq('id', user.id);

      if (selectedMock.is_daily) {
        await supabase.from('completed_daily_mocks').insert([{ user_id: user.id, mock_id: selectedMock.id }]);
        if (!isPenalty) {
          const today = new Date().toISOString().split('T')[0];
          await supabase.from('profiles').update({ 
            streak_count: (user.streak_count || 0) + 1, last_mock_date: today 
          }).eq('id', user.id);
          setShowStreakAnim(true);
        }
      }
      setIsFinished(true);
      loadMockData(); 
    } catch (err) { console.error("Neural Error", err); }
  };

  const handleReturn = () => {
    setSelectedMock(null); setQuestions([]); setSubjects([]); 
    setActiveSubject(""); setCurrentIdx(0); setSelectedOptions({});
    setIsFinished(false); setShowReview(false); setShowStreakAnim(false);
    if (setIsExamLocked) setIsExamLocked(false);
    onFinish(); 
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-blue-600 uppercase tracking-widest">Connecting...</div>;

  // --- VIEW: LIBRARY ---
  if (!selectedMock) {
    const dailyExists = availableMocks.some(m => m.is_daily);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Play className="text-blue-600" fill="currentColor" />
            <h3 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Exam Library</h3>
          </div>
        </div>

        {!dailyExists && (
          <div className="p-8 rounded-[32px] bg-gray-50 dark:bg-gray-900/50 border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">No daily mock active.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availableMocks.map((mock) => {
            const isDone = completedMockIds.includes(mock.id);
            return (
              <button key={mock.id} disabled={mock.is_daily && isDone} onClick={() => startMock(mock)} 
                className={`p-8 rounded-[32px] text-left transition-all shadow-xl border-b-8 relative group ${
                  mock.is_daily ? (isDone ? 'bg-gray-100 opacity-60' : 'bg-gradient-to-br from-orange-500 to-red-600 text-white border-orange-700') : 'bg-white dark:bg-gray-800 dark:text-white border-blue-500'
                }`}>
                
                {mock.is_daily && !isDone && (
                  <div className="absolute -top-3 right-8 bg-black text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase flex items-center gap-2 shadow-2xl border border-white/20">
                    <Hourglass size={12} className="animate-spin" /> Expires: {timeUntilMidnight}
                  </div>
                )}

                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${mock.is_daily ? 'bg-white/20' : 'bg-blue-50 dark:bg-gray-700 text-blue-600'}`}>{isDone ? <Lock size={24} /> : <Zap size={24} />}</div>
                  <span className="flex items-center gap-1 bg-black/10 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                    {mock.is_strict && <ShieldAlert size={12} className="text-red-400 mr-1" />}
                    <Clock size={12} /> {mock.time_limit}m
                  </span>
                </div>
                <h4 className="text-xl font-black uppercase mb-1 tracking-tight">{mock.mock_title}</h4>
                <p className="text-[10px] opacity-70 font-black uppercase tracking-widest">{isDone ? 'STREAK SECURED' : (mock.is_strict ? 'STRICT' : 'PRACTICE')}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // --- VIEW: RESULTS ---
  if (isFinished) {
    const finalScore = Math.round((questions.filter((q, i) => selectedOptions[i] === q.correct_option).length / questions.length) * 100);
    if (showReview) {
      return (
        <div className="space-y-6 max-w-3xl mx-auto pb-20">
          <button onClick={() => setShowReview(false)} className="bg-white dark:bg-gray-800 px-6 py-3 rounded-2xl shadow-sm border dark:border-gray-700 font-black uppercase text-xs flex items-center gap-2 dark:text-white transition-all"><ArrowLeft size={16} /> Back</button>
          {questions.map((q, idx) => (
            <div key={idx} className={`p-8 rounded-[2.5rem] border-l-8 bg-white dark:bg-gray-800 shadow-xl ${selectedOptions[idx] === q.correct_option ? 'border-green-500' : 'border-red-500'}`}>
              <p className="font-bold text-lg dark:text-white mb-4 leading-tight">{idx + 1}. {q.question}</p>
              <div className="grid grid-cols-1 gap-3">
                {q.options.map((opt, i) => (
                  <div key={i} className={`p-4 rounded-2xl text-sm font-bold flex justify-between items-center ${i === q.correct_option ? 'bg-green-100 text-green-700' : i === selectedOptions[idx] ? 'bg-red-100 text-red-700' : 'bg-gray-50 dark:bg-gray-900 opacity-60'}`}>
                    <span>{opt}</span>{i === q.correct_option && <CheckCircle size={16} />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="max-w-md mx-auto text-center p-12 bg-white dark:bg-gray-800 rounded-[40px] shadow-2xl border-t-8 border-green-500 relative overflow-hidden">
        {showStreakAnim && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-orange-600 z-50 text-white p-6 text-center animate-in zoom-in duration-500">
            <div className="text-8xl animate-bounce mb-4">🔥</div>
            <h2 className="text-5xl font-black uppercase tracking-tighter mb-2">STREAK +1</h2>
            <button onClick={() => setShowStreakAnim(false)} className="mt-10 bg-white text-orange-600 px-12 py-4 rounded-[2rem] font-black uppercase text-xs shadow-2xl">Continue</button>
          </div>
        )}
        <Award size={64} className="mx-auto text-green-500 mb-6" />
        <h2 className="text-3xl font-black dark:text-white uppercase">Neural Record</h2>
        <div className="text-6xl font-black text-blue-600 my-6">{finalScore}%</div>
        <p className="text-gray-400 font-bold text-[10px] uppercase mb-6 tracking-widest italic">Factored into lifetime Neural GPA</p>
        <div className="flex flex-col gap-4">
            <button onClick={() => setShowReview(true)} className="flex items-center justify-center gap-2 w-full bg-gray-100 dark:bg-gray-700 py-4 rounded-2xl font-black uppercase text-xs"><Eye size={20} /> Review</button>
            <button onClick={handleReturn} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl">Return</button>
        </div>
      </div>
    );
  }

  // --- VIEW: CBT ---
  const activeSubData = subjects.find(s => s.subject === activeSubject);
  const isFinalMinute = timeLeft <= 60; // 🔥 WARNING TRIGGER

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-[2rem] shadow-xl flex flex-wrap justify-between items-center border dark:border-gray-700">
        <div className="flex gap-2">
          {subjects.map(s => (
            <button key={s.subject} onClick={() => {setActiveSubject(s.subject); setCurrentIdx(0);}} 
              className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${activeSubject === s.subject ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-900 text-gray-400'}`}>{s.subject}</button>
          ))}
        </div>
        
        {/* 🔥 TIMER UI WITH PULSING ALARM */}
        <div className={`flex items-center gap-3 font-mono text-xl font-bold px-6 py-2 rounded-xl transition-all duration-300 ${isFinalMinute ? 'bg-red-600 text-white animate-pulse' : 'bg-black text-white'}`}>
          <Timer size={18} className={isFinalMinute ? 'animate-spin' : ''} /> 
          {Math.max(0, Math.floor(timeLeft / 60))}:{String(Math.max(0, timeLeft % 60)).padStart(2, '0')}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-2xl border dark:border-gray-700 relative">
          {selectedMock.is_strict && <div className="absolute top-6 right-10 text-red-500 font-black text-[10px] uppercase flex items-center gap-2"><ShieldAlert size={14} /> Strikes: {warnings}/2</div>}
          <h4 className="text-blue-600 font-black uppercase text-[10px] mb-4 italic">{activeSubject} / Q{currentIdx + 1}</h4>
          <h3 className="text-2xl font-bold dark:text-white mb-10 leading-tight">{activeSubData.questions[currentIdx].question}</h3>
          <div className="grid grid-cols-1 gap-4">
            {activeSubData.questions[currentIdx].options.map((opt, i) => {
              const absIdx = getAbsIdx(activeSubject, currentIdx);
              return (
                <button key={i} onClick={() => setSelectedOptions({...selectedOptions, [absIdx]: i})} 
                  className={`w-full text-left p-6 rounded-2xl border-2 transition-all font-bold flex items-center gap-4 group ${selectedOptions[absIdx] === i ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:text-white' : 'border-gray-100 dark:border-gray-700 dark:text-gray-300'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${selectedOptions[absIdx] === i ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>{String.fromCharCode(65 + i)}</div>{opt}
                </button>
              )
            })}
          </div>
          <div className="mt-12 flex justify-between pt-8 border-t dark:border-gray-700">
            <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(prev => prev - 1)} className="px-6 py-2 text-gray-400 font-bold uppercase text-xs disabled:opacity-30">Previous</button>
            <button disabled={currentIdx === activeSubData.questions.length - 1} onClick={() => setCurrentIdx(prev => prev + 1)} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg disabled:opacity-30">Next</button>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] shadow-xl border dark:border-gray-700 text-center">
          <p className="text-[10px] font-black uppercase text-gray-400 mb-6 tracking-widest">Questions Palette</p>
          <div className="grid grid-cols-4 gap-2 mb-8">
            {activeSubData.questions.map((_, i) => {
              const absIdx = getAbsIdx(activeSubject, i);
              const isDone = selectedOptions[absIdx] !== undefined;
              return (
                <button key={i} onClick={() => setCurrentIdx(i)} 
                  className={`aspect-square rounded-xl font-black text-xs transition-all ${currentIdx === i ? 'ring-2 ring-blue-500 ring-offset-2' : ''} ${isDone ? 'bg-green-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-900 text-gray-400'}`}>{i + 1}</button>
              )
            })}
          </div>
          <button onClick={() => { if(window.confirm("Submit transmission and end simulation?")) handleSubmit(false); }} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Submit Test</button>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Timer, CheckCircle, Play, Layout, Zap, Award, Clock, ArrowLeft, Eye, Lock } from 'lucide-react';

export default function MockEngine({ user, onFinish }) {
  const [availableMocks, setAvailableMocks] = useState([]);
  const [selectedMock, setSelectedMock] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [completedMockIds, setCompletedMockIds] = useState([]); 
  const [showStreakAnim, setShowStreakAnim] = useState(false); // 🔥 Animation State

  // --- 1. ATOMIC LOAD: FETCH MOCKS & LOCK STATUS ---
  const loadMockData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all available tests
      const { data: mockData } = await supabase.from('daily_mocks').select('*');
      
      // Fetch specifically from your 'completed_daily_mocks' security table
      const { data: completionData } = await supabase
        .from('completed_daily_mocks')
        .select('mock_id')
        .eq('user_id', user.id);

      if (completionData) {
        setCompletedMockIds(completionData.map(c => c.mock_id));
      }

      if (mockData) {
        setAvailableMocks(mockData.sort((a, b) => (b.is_daily ? 1 : -1)));
      }
    } catch (err) {
      console.error("The Brain - Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadMockData();
  }, [loadMockData]);

  // --- 2. START MOCK WITH LOCK CHECK ---
  const startMock = async (mock) => {
    if (mock.is_daily && completedMockIds.includes(mock.id)) {
      alert("The Brain, this daily streak mock is already secured.");
      return;
    }

    const { data } = await supabase
      .from('daily_mocks')
      .select('*')
      .eq('id', mock.id)
      .single();

    if (data && data.questions) {
      setQuestions(data.questions); 
      setSelectedMock(data);
      setTimeLeft((data.time_limit || 10) * 60); 
    }
  };

  // --- 3. SUBMIT & STREAK LOGIC ---
  const handleSubmit = async () => {
    if (isFinished) return;
    
    let scoreCount = 0;
    questions.forEach((q, idx) => {
      if (selectedOptions[idx] === q.correct_option) scoreCount++;
    });
    const percentage = Math.round((scoreCount / questions.length) * 100);

    try {
      // A. Save Score to History
      const { error: scoreError } = await supabase.from('scores').insert([{
        user_id: user.id, 
        mock_id: selectedMock.id, 
        score: scoreCount, 
        percentage: percentage, 
        mock_title: selectedMock.mock_title,
        is_daily: selectedMock.is_daily 
      }]);

      if (scoreError) throw scoreError;

      // B. Handle Daily Streak Mechanics
      if (selectedMock.is_daily) {
        // 1. Double check lock to prevent multi-tab exploits
        if (!completedMockIds.includes(selectedMock.id)) {
          
          // 2. Add entry to completion log (Locks the test forever)
          await supabase.from('completed_daily_mocks').insert([{
            user_id: user.id,
            mock_id: selectedMock.id
          }]);

          // 3. Update Profile Streak Count
          const today = new Date().toISOString().split('T')[0];
          await supabase.from('profiles').update({ 
            streak_count: (user.streak_count || 0) + 1, 
            last_mock_date: today 
          }).eq('id', user.id);

          // 4. Trigger the Flame Animation
          setShowStreakAnim(true);
        }
      }
      
      setIsFinished(true);
      loadMockData(); // Refresh UI locks
      
    } catch (err) {
      console.error("The Brain - Submit Error:", err.message);
      alert("Neural Grid Error: Data not synced.");
    }
  };

  const handleReturn = () => {
    setSelectedMock(null);
    setQuestions([]);
    setCurrentIdx(0);
    setSelectedOptions({});
    setIsFinished(false);
    setShowReview(false);
    setShowStreakAnim(false);
    onFinish(); 
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-blue-600 uppercase tracking-widest">Syncing Neural Grid...</div>;

  // --- LIBRARY VIEW ---
  if (!selectedMock) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Play className="text-blue-600" fill="currentColor" />
          <h3 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Exam Library</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availableMocks.map((mock) => {
            const isDone = completedMockIds.includes(mock.id);
            return (
              <button 
                key={mock.id} 
                disabled={mock.is_daily && isDone}
                onClick={() => startMock(mock)} 
                className={`p-8 rounded-[32px] text-left transition-all shadow-xl border-b-8 relative group ${
                  mock.is_daily 
                    ? (isDone ? 'bg-gray-100 dark:bg-gray-800/50 text-gray-400 border-gray-200 opacity-60' : 'bg-gradient-to-br from-orange-500 to-red-600 text-white border-orange-700 hover:scale-[1.02]') 
                    : 'bg-white dark:bg-gray-800 border-blue-500 dark:border-blue-900 dark:text-white hover:scale-[1.02]'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${mock.is_daily ? (isDone ? 'bg-gray-200 dark:bg-gray-700' : 'bg-white/20') : 'bg-blue-50 dark:bg-gray-700 text-blue-600'}`}>
                    {isDone && mock.is_daily ? <Lock size={24} /> : (mock.is_daily ? <Zap size={24} /> : <Layout size={24} />)}
                  </div>
                  <span className="flex items-center gap-1 bg-black/10 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest"><Clock size={12} /> {mock.time_limit} Mins</span>
                </div>
                <h4 className="text-xl font-black uppercase mb-1">{mock.mock_title}</h4>
                <p className="text-[10px] opacity-70 font-black uppercase tracking-widest">
                  {isDone && mock.is_daily ? 'LOCKED • STREAK SECURED' : (mock.is_daily ? 'STREAK ENABLED' : 'PRACTICE MODE')}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // --- RESULTS VIEW WITH ANIMATION ---
  if (isFinished) {
    const finalScore = Math.round((Object.values(selectedOptions).filter((val, i) => val === questions[i].correct_option).length / questions.length) * 100);
    
    return (
      <div className="max-w-md mx-auto text-center p-12 bg-white dark:bg-gray-800 rounded-[40px] shadow-2xl border-t-8 border-green-500 relative overflow-hidden">
        
        {/* 🔥 STREAK FLAME OVERLAY 🔥 */}
        {showStreakAnim && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-orange-600 z-50 animate-in fade-in zoom-in duration-500 text-white p-6">
            <div className="text-8xl animate-bounce mb-4 drop-shadow-2xl">🔥</div>
            <h2 className="text-5xl font-black uppercase italic tracking-tighter mb-2">STREAK +1</h2>
            <p className="font-bold text-orange-200 uppercase tracking-[0.2em] text-xs">Daily Knowledge Logged</p>
            <button onClick={() => setShowStreakAnim(false)} className="mt-10 bg-white text-orange-600 px-12 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-110 transition-transform active:scale-95">
                Dismiss
            </button>
          </div>
        )}

        <Award size={64} className="mx-auto text-green-500 mb-6" />
        <h2 className="text-3xl font-black dark:text-white uppercase tracking-tighter">Mock Complete!</h2>
        <div className="text-6xl font-black text-blue-600 my-6">{finalScore}%</div>
        <div className="flex flex-col gap-4">
            <button onClick={() => setShowReview(true)} className="flex items-center justify-center gap-2 w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all"><Eye size={20} /> Review Answers</button>
            <button onClick={handleReturn} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl transition-all">Return to Hub</button>
        </div>
      </div>
    );
  }

  // --- TEST TAKING VIEW ---
  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-2xl border border-blue-50 dark:border-gray-700">
      {/* (Timer and Question UI code matches your verified layout) */}
      <div className="flex justify-between items-center mb-8">
        <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-4 py-1.5 rounded-lg font-black text-xs uppercase tracking-widest">{currentIdx + 1} / {questions.length}</span>
        <div className={`flex items-center gap-2 font-mono font-bold text-xl px-4 py-2 rounded-xl ${timeLeft < 60 ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-gray-900 dark:text-white'}`}>
          <Timer size={20} /> {formatTime(timeLeft)}
        </div>
      </div>
      <h3 className="text-2xl font-bold mb-8 dark:text-white leading-tight tracking-tight">{questions[currentIdx].question}</h3>
      <div className="grid grid-cols-1 gap-4">
        {questions[currentIdx].options.map((opt, i) => (
          <button key={i} onClick={() => setSelectedOptions({...selectedOptions, [currentIdx]: i})} className={`w-full text-left p-6 rounded-2xl border-2 transition-all font-bold flex items-center gap-4 group ${selectedOptions[currentIdx] === i ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:text-white' : 'border-gray-100 dark:border-gray-700 dark:text-gray-300'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${selectedOptions[currentIdx] === i ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>{String.fromCharCode(65 + i)}</div>
            {opt}
          </button>
        ))}
      </div>
      <div className="mt-12 flex justify-between items-center pt-8 border-t dark:border-gray-700">
        <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(prev => prev - 1)} className="px-6 py-2 text-gray-400 font-bold hover:text-blue-600 disabled:opacity-0 uppercase text-xs tracking-widest">Previous</button>
        {currentIdx === questions.length - 1 
          ? <button onClick={handleSubmit} className="px-10 py-4 bg-green-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-green-600 shadow-lg active:scale-95">Finish Test</button>
          : <button onClick={() => setCurrentIdx(prev => prev + 1)} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg active:scale-95">Next</button>
        }
      </div>
    </div>
  );
}
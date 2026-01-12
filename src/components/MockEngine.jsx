import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Timer, CheckCircle, Play, Layout, Zap, Award, Clock, ArrowLeft, Eye } from 'lucide-react';

export default function MockEngine({ user, onFinish }) {
  // --- STATE MANAGEMENT ---
  const [availableMocks, setAvailableMocks] = useState([]);
  const [selectedMock, setSelectedMock] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false); // New state for review mode

  // --- FETCH AVAILABLE MOCKS FROM DAILY_MOCKS ---
  useEffect(() => {
    const fetchMockList = async () => {
      const { data } = await supabase
        .from('daily_mocks')
        .select('mock_title, is_daily, time_limit');
      
      if (data) {
        setAvailableMocks(data.sort((a, b) => (b.is_daily ? 1 : -1)));
      }
      setLoading(false);
    };
    fetchMockList();
  }, []);

  // --- TIMER LOGIC ---
  useEffect(() => {
    if (selectedMock && !isFinished) {
      if (timeLeft <= 0) {
        handleSubmit();
        return;
      }
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [selectedMock, isFinished, timeLeft]);

  // --- START MOCK: EXTRACT ARRAY FROM JSONB ---
  const startMock = async (mock) => {
    const { data } = await supabase
      .from('daily_mocks')
      .select('*')
      .eq('mock_title', mock.mock_title)
      .single(); 
    
    if (data && data.questions) {
      setQuestions(data.questions); 
      setSelectedMock(data);
      setTimeLeft((data.time_limit || 60) * 60); 
    }
  };

  const handleSubmit = async () => {
    if (isFinished) return;

    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedOptions[idx] === q.correct_option) score++;
    });

    const percentage = Math.round((score / questions.length) * 100);

    // Save Score to Database
    await supabase.from('scores').insert({
      user_id: user.id,
      score: score,
      percentage: percentage,
      mock_title: selectedMock.mock_title
    });

    // Update Profile Streaks if it's a Daily Mock
    if (selectedMock.is_daily) {
      const today = new Date().toISOString().split('T')[0];
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .update({ 
          streak_count: (user.streak_count || 0) + 1,
          last_mock_date: today 
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updatedProfile && updatedProfile.streak_count % 30 === 0) {
        await supabase.from('profiles')
          .update({ freeze_points: (user.freeze_points || 0) + 1 })
          .eq('id', user.id);
        alert("⭐ LEGENDARY! 30-Day Streak. Freeze Point Awarded!");
      }
    }
    setIsFinished(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) return <div className="text-center p-10 font-bold animate-pulse text-blue-600">Syncing Exam Servers...</div>;

  // --- VIEW 1: MOCK SELECTION MENU ---
  if (!selectedMock) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Play className="text-blue-600" fill="currentColor" />
          <h3 className="text-2xl font-black text-gray-800 dark:text-white uppercase">Exam Library</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availableMocks.map((mock, i) => (
            <button 
              key={i}
              onClick={() => startMock(mock)}
              className={`p-8 rounded-[32px] text-left transition-all hover:scale-[1.02] shadow-xl border-b-8 active:scale-95 ${
                mock.is_daily 
                ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white border-orange-700' 
                : 'bg-white dark:bg-gray-800 border-blue-500 dark:border-blue-900 dark:text-white'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${mock.is_daily ? 'bg-white/20' : 'bg-blue-50 dark:bg-gray-700 text-blue-600'}`}>
                  {mock.is_daily ? <Zap size={24} /> : <Layout size={24} />}
                </div>
                <div className="flex flex-col items-end gap-2 text-[10px] font-bold uppercase tracking-widest">
                   <span className="flex items-center gap-1 bg-black/10 px-2 py-1 rounded-lg">
                      <Clock size={12} /> {mock.time_limit} Mins
                   </span>
                </div>
              </div>
              <h4 className="text-xl font-black uppercase mb-1">{mock.mock_title}</h4>
              <p className={`text-sm ${mock.is_daily ? 'text-white/80' : 'text-gray-500'}`}>
                {mock.is_daily ? 'Attendance Required' : 'Practice Mode'}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- VIEW 2: RESULTS & REVIEW ---
  if (isFinished) {
    const finalScore = Math.round((Object.values(selectedOptions).filter((val, i) => val === questions[i].correct_option).length / questions.length) * 100);

    if (showReview) {
      return (
        <div className="space-y-6 max-w-3xl mx-auto pb-20">
          <button onClick={() => setShowReview(false)} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 font-black uppercase text-xs flex items-center gap-2 hover:bg-gray-50 transition-all">
             <ArrowLeft size={16} /> Back to Results
          </button>
          {questions.map((q, idx) => (
            <div key={idx} className={`p-8 rounded-[2.5rem] border-l-8 bg-white dark:bg-gray-800 shadow-xl ${
              selectedOptions[idx] === q.correct_option ? 'border-green-500' : 'border-red-500'
            }`}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <p className="font-bold text-lg dark:text-white leading-tight">{idx + 1}. {q.question}</p>
                {selectedOptions[idx] === q.correct_option ? 
                  <CheckCircle className="text-green-500 shrink-0" size={24} /> : 
                  <AlertTriangle className="text-red-500 shrink-0" size={24} />
                }
              </div>
              <div className="grid grid-cols-1 gap-3">
                {q.options.map((opt, i) => (
                  <div key={i} className={`p-4 rounded-2xl text-sm font-bold flex items-center justify-between ${
                    i === q.correct_option ? 'bg-green-100 text-green-700 border border-green-200' : 
                    i === selectedOptions[idx] ? 'bg-red-100 text-red-700 border border-red-200' : 
                    'bg-gray-50 dark:bg-gray-900 text-gray-400'
                  }`}>
                    {opt}
                    {i === q.correct_option && <span className="text-[10px] uppercase font-black">Correct Answer</span>}
                    {i === selectedOptions[idx] && i !== q.correct_option && <span className="text-[10px] uppercase font-black">Your Choice</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="max-w-md mx-auto text-center p-12 bg-white dark:bg-gray-800 rounded-[40px] shadow-2xl border-t-8 border-green-500">
        <div className="inline-flex p-6 bg-green-50 dark:bg-green-900/20 rounded-full mb-6 text-green-500">
          <Award size={64} />
        </div>
        <h2 className="text-3xl font-black dark:text-white uppercase tracking-tighter">Mock Complete!</h2>
        <div className="text-6xl font-black text-blue-600 my-6">{finalScore}%</div>
        <div className="flex flex-col gap-4">
            <button onClick={() => setShowReview(true)} className="flex items-center justify-center gap-2 w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all">
                <Eye size={20} /> Review Answers
            </button>
            <button onClick={() => window.location.reload()} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl transition-all">
                Back to Dashboard
            </button>
        </div>
      </div>
    );
  }

  // --- VIEW 3: ACTIVE TEST ENGINE ---
  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-2xl border border-blue-50 dark:border-gray-700">
      <div className="flex justify-between items-center mb-8">
        <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-4 py-1.5 rounded-lg font-black text-xs uppercase">
          {currentIdx + 1} / {questions.length}
        </span>
        <div className={`flex items-center gap-2 font-mono font-bold text-xl px-4 py-2 rounded-xl transition-all ${timeLeft < 60 ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-gray-900'}`}>
          <Timer size={20} /> {formatTime(timeLeft)}
        </div>
      </div>

      <h3 className="text-2xl font-bold mb-8 dark:text-white leading-tight">{questions[currentIdx].question}</h3>
      
      <div className="grid grid-cols-1 gap-4">
        {questions[currentIdx].options.map((opt, i) => (
          <button 
            key={i}
            onClick={() => setSelectedOptions({...selectedOptions, [currentIdx]: i})}
            className={`w-full text-left p-6 rounded-2xl border-2 transition-all font-bold flex items-center gap-4 ${
              selectedOptions[currentIdx] === i ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:text-white' : 'border-gray-100 dark:border-gray-700 dark:text-gray-300'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${selectedOptions[currentIdx] === i ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>
              {String.fromCharCode(65 + i)}
            </div>
            {opt}
          </button>
        ))}
      </div>

      <div className="mt-12 flex justify-between items-center pt-8 border-t dark:border-gray-700">
        <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(prev => prev - 1)} className="px-6 py-2 text-gray-400 font-bold hover:text-blue-600 disabled:opacity-0 uppercase text-xs tracking-widest">Previous</button>
        {currentIdx === questions.length - 1 
          ? <button onClick={handleSubmit} className="px-10 py-4 bg-green-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-green-600 shadow-lg active:scale-95 transition-all">Finish Test</button>
          : <button onClick={() => setCurrentIdx(prev => prev + 1)} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg active:scale-95 transition-all">Next</button>
        }
      </div>
    </div>
  );
}
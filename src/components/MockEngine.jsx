import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Timer, CheckCircle, Play, Layout, Zap, Award, Clock } from 'lucide-react';

export default function MockEngine({ user, onFinish }) {
  // --- STATE MANAGEMENT ---
  const [availableMocks, setAvailableMocks] = useState([]);
  const [selectedMock, setSelectedMock] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [timeLeft, setTimeLeft] = useState(600); 
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- FETCH AVAILABLE MOCKS ---
  useEffect(() => {
    const fetchMockList = async () => {
      // Get unique mock titles and their "daily" status
      const { data } = await supabase.from('questions').select('mock_title, is_daily');
      if (data) {
        const unique = [];
        const titles = new Set();
        data.forEach(item => {
          if (!titles.has(item.mock_title)) {
            titles.add(item.mock_title);
            unique.push(item);
          }
        });
        // Sort to put Daily Quick Mock at the very top
        setAvailableMocks(unique.sort((a, b) => (b.is_daily ? 1 : -1)));
      }
      setLoading(false);
    };
    fetchMockList();
  }, []);

  // --- TIMER LOGIC ---
  useEffect(() => {
    if (selectedMock && !isFinished) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [selectedMock, isFinished]);

  // --- START SPECIFIC MOCK ---
  const startMock = async (mock) => {
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('mock_title', mock.mock_title);
    
    if (data && data.length > 0) {
      setQuestions(data);
      setSelectedMock(mock);
      setTimeLeft(data.length * 60); // 1 minute per question
    }
  };

  // --- SUBMISSION & STREAK LOGIC ---
  const handleSubmit = async () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedOptions[idx] === q.correct_option) score++;
    });

    const percentage = Math.round((score / questions.length) * 100);

    // 1. Save the result
    await supabase.from('scores').insert({
      user_id: user.id,
      score: score,
      percentage: percentage,
      mock_title: selectedMock.mock_title
    });

    // 2. ATTENDANCE SYSTEM: Handle Streaks if this was the Daily Mock
    if (selectedMock.is_daily) {
      const today = new Date().toISOString().split('T')[0];
      
      // Update streak and last completion date
      const { data: updatedProfile } = await supabase.from('profiles')
        .update({ 
          streak_count: (user.streak_count || 0) + 1,
          last_mock_date: today 
        })
        .eq('id', user.id)
        .select()
        .single();

      // 3. FREEZE POINT: Award 1 point every 30 days
      if (updatedProfile && updatedProfile.streak_count % 30 === 0) {
        await supabase.from('profiles')
          .update({ freeze_points: (user.freeze_points || 0) + 1 })
          .eq('id', user.id);
        alert("⭐ LEGENDARY! You earned a Freeze Point for a 30-day streak!");
      }
    }

    setIsFinished(true);
  };

  // --- VIEW: LOADING ---
  if (loading) return <div className="text-center p-10 font-bold animate-pulse">Scanning Library...</div>;

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
                {mock.is_daily && (
                  <span className="text-[10px] font-black bg-white text-orange-600 px-3 py-1 rounded-full uppercase tracking-tighter">
                    Attendance Required
                  </span>
                )}
              </div>
              <h4 className="text-xl font-black uppercase mb-1">{mock.mock_title}</h4>
              <p className={`text-sm ${mock.is_daily ? 'text-white/80' : 'text-gray-500'}`}>
                {mock.is_daily ? 'Complete this to save your streak!' : 'Practice mode available.'}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- VIEW 2: RESULTS ---
  if (isFinished) {
    const finalScore = Math.round((Object.values(selectedOptions).filter((val, i) => val === questions[i].correct_option).length / questions.length) * 100);
    return (
      <div className="max-w-md mx-auto text-center p-12 bg-white dark:bg-gray-800 rounded-[40px] shadow-2xl border-t-8 border-green-500">
        <div className="inline-flex p-6 bg-green-50 dark:bg-green-900/20 rounded-full mb-6 text-green-500">
          <Award size={64} />
        </div>
        <h2 className="text-3xl font-black dark:text-white">Exam Complete!</h2>
        <div className="text-6xl font-black text-blue-600 my-6">{finalScore}%</div>
        <p className="text-gray-500 font-bold uppercase text-sm mb-8 tracking-widest">Mock: {selectedMock.mock_title}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg transition-all"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // --- VIEW 3: ACTIVE TEST ENGINE ---
  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-2xl border border-blue-50 dark:border-gray-700">
      <div className="flex justify-between items-center mb-8">
        <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-5 py-2 rounded-xl font-black text-xs uppercase">
          Question {currentIdx + 1} of {questions.length}
        </span>
        <div className="flex items-center gap-2 text-red-500 font-mono font-bold text-lg bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl">
          <Timer size={20} /> {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </div>
      </div>

      {questions.length > 0 && (
        <>
          <h3 className="text-2xl font-bold mb-8 dark:text-white leading-tight">
            {questions[currentIdx].question}
          </h3>
          
          <div className="space-y-4">
            {questions[currentIdx].options.map((opt, i) => (
              <button 
                key={i}
                onClick={() => setSelectedOptions({...selectedOptions, [currentIdx]: i})}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all font-bold flex items-center gap-4 group ${
                  selectedOptions[currentIdx] === i 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:text-white' 
                  : 'border-gray-100 dark:border-gray-700 dark:text-gray-300 hover:border-blue-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${
                  selectedOptions[currentIdx] === i ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  {String.fromCharCode(65 + i)}
                </div>
                {opt}
              </button>
            ))}
          </div>

          <div className="mt-10 flex justify-between items-center pt-6 border-t dark:border-gray-700">
            <button 
              disabled={currentIdx === 0} 
              onClick={() => setCurrentIdx(prev => prev - 1)} 
              className="px-6 py-2 text-gray-400 font-bold hover:text-blue-600 disabled:opacity-0 transition-all"
            >
              Previous
            </button>
            
            {currentIdx === questions.length - 1 
              ? <button onClick={handleSubmit} className="px-10 py-4 bg-green-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-green-600 shadow-lg shadow-green-200 transition-all active:scale-95">Submit Test</button>
              : <button onClick={() => setCurrentIdx(prev => prev + 1)} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">Next</button>
            }
          </div>
        </>
      )}
    </div>
  );
}
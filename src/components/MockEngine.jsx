import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Timer, CheckCircle } from 'lucide-react';

export default function MockEngine({ user, mockId, onFinish }) {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    fetchQuestions();
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchQuestions = async () => {
    const { data } = await supabase.from('questions').select('*');
    setQuestions(data || []);
  };

  const handleSubmit = async () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedOptions[idx] === q.correct_option) score++;
    });

    const percentage = (score / questions.length) * 100;

    await supabase.from('scores').insert({
      user_id: user.id,
      score: score,
      percentage: percentage,
      mock_id: mockId || 1
    });

    setIsFinished(true);
  };

  if (isFinished) {
    return (
      <div className="text-center p-10 bg-white rounded-xl shadow-lg">
        <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
        <h2 className="text-3xl font-bold">Mock Complete!</h2>
        <p className="text-xl mt-2">Your Score: {((Object.values(selectedOptions).length / questions.length) * 100).toFixed(1)}%</p>
        <button onClick={onFinish} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-blue-100">
      <div className="flex justify-between items-center mb-6">
        <span className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full font-bold">Question {currentIdx + 1}/{questions.length}</span>
        <div className="flex items-center gap-2 text-red-500 font-mono font-bold">
          <Timer size={20} /> {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </div>
      </div>

      {questions.length > 0 && (
        <>
          <h3 className="text-xl font-semibold mb-6">{questions[currentIdx].question}</h3>
          <div className="space-y-3">
            {questions[currentIdx].options.map((opt, i) => (
              <button 
                key={i}
                onClick={() => setSelectedOptions({...selectedOptions, [currentIdx]: i})}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedOptions[currentIdx] === i ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-200'}`}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="mt-8 flex justify-between">
            <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(prev => prev - 1)} className="px-6 py-2 text-gray-500">Previous</button>
            {currentIdx === questions.length - 1 
              ? <button onClick={handleSubmit} className="px-8 py-2 bg-green-500 text-white rounded-lg font-bold">Submit Test</button>
              : <button onClick={() => setCurrentIdx(prev => prev + 1)} className="px-8 py-2 bg-blue-600 text-white rounded-lg font-bold">Next Question</button>
            }
          </div>
        </>
      )}
    </div>
  );
}
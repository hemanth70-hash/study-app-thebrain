import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BrainCircuit, Zap, RefreshCw } from 'lucide-react';

export default function QuickQuiz() {
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  const fetchRandomQuestion = async () => {
    setSelected(null);
    setIsCorrect(null);
    const { data } = await supabase.from('questions').select('*');
    if (data && data.length > 0) {
      const random = data[Math.floor(Math.random() * data.length)];
      setQuestion(random);
    }
  };

  useEffect(() => { fetchRandomQuestion(); }, []);

  const handleCheck = (index) => {
    setSelected(index);
    setIsCorrect(index === question.correct_option);
  };

  if (!question) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border-l-8 border-yellow-400 mt-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3 text-yellow-600">
          <BrainCircuit size={28} />
          <h3 className="text-xl font-black uppercase">Quick Brain Tickler</h3>
        </div>
        <button onClick={fetchRandomQuestion} className="text-gray-400 hover:text-yellow-500 transition-transform hover:rotate-180 duration-500">
          <RefreshCw size={20} />
        </button>
      </div>

      <p className="text-lg font-bold mb-4">{question.question}</p>
      
      <div className="grid grid-cols-1 gap-3">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleCheck(i)}
            disabled={selected !== null}
            className={`p-3 rounded-xl border-2 transition-all text-left font-medium ${
              selected === i 
                ? (isCorrect ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-red-700')
                : 'border-gray-100 dark:border-gray-700 hover:border-yellow-400'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {isCorrect !== null && (
        <div className={`mt-4 p-3 rounded-xl font-bold flex items-center gap-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
          <Zap size={18} /> {isCorrect ? "Genius! That's correct." : "Not quite! Keep studying."}
        </div>
      )}
    </div>
  );
}
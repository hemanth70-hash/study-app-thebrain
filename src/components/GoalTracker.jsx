import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Target, CheckCircle2 } from 'lucide-react';

export default function GoalTracker({ user }) {
  const [goal, setGoal] = useState(user?.daily_goal || 5);
  const [completedToday, setCompletedToday] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user?.id) fetchTodayProgress();
  }, [user?.id]);

  const fetchTodayProgress = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('scores')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', today);
    
    setCompletedToday(data?.length || 0);
  };

  const updateGoal = async () => {
    await supabase.from('profiles').update({ daily_goal: goal }).eq('id', user.id);
    setIsEditing(false);
  };

  const progressPercentage = Math.min((completedToday / goal) * 100, 100);

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border-t-8 border-indigo-500">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
          <Target size={28} />
          <h3 className="text-xl font-black uppercase tracking-tight">Daily Goal</h3>
        </div>
        
        {isEditing ? (
          <div className="flex gap-2">
            <input 
              type="number" 
              className="w-16 p-1 rounded border dark:bg-gray-700 text-black"
              value={goal} 
              onChange={(e) => setGoal(parseInt(e.target.value) || 0)}
            />
            <button onClick={updateGoal} className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-bold">SET</button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-indigo-500 text-xs font-bold uppercase tracking-widest">Adjust Goal</button>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between text-sm font-bold">
          <span>{completedToday} Mocks Finished</span>
          <span>Goal: {goal}</span>
        </div>
        
        <div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {completedToday >= goal && (
          <div className="flex items-center gap-2 text-green-500 font-bold justify-center bg-green-50 dark:bg-green-900/20 p-2 rounded-xl">
            <CheckCircle2 size={18} /> Daily Goal Smashed!
          </div>
        )}
      </div>
    </div>
  );
}
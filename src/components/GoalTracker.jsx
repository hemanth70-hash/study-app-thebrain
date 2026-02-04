import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Target, CheckCircle2, Loader2 } from 'lucide-react';

export default function GoalTracker({ user }) {
  // Using 'daily_goal_target' to match the database column we created
  const [goal, setGoal] = useState(5); 
  const [completedToday, setCompletedToday] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- 1. INITIAL SYNC (Fetch Goal & Today's Progress) ---
  useEffect(() => {
    if (user?.id) fetchGoalData();
  }, [user?.id]);

  const fetchGoalData = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    try {
      // A. Fetch the User's Saved Goal
      const { data: profileData } = await supabase
        .from('profiles')
        .select('daily_goal_target')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setGoal(profileData.daily_goal_target || 5);
      }

      // B. Count Exams Completed TODAY
      const { count } = await supabase
        .from('scores')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`);

      setCompletedToday(count || 0);

    } catch (err) {
      console.error("Goal Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. UPDATE LOGIC (Save to DB) ---
  const updateGoal = async () => {
    if (goal < 1) return;
    
    await supabase
      .from('profiles')
      .update({ daily_goal_target: goal }) // Saving to the correct column
      .eq('id', user.id);
      
    setIsEditing(false);
  };

  const progressPercentage = Math.min((completedToday / goal) * 100, 100);

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border-t-8 border-indigo-500 h-full flex flex-col justify-between">
      
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
          <Target size={28} />
          <h3 className="text-xl font-black uppercase tracking-tight">Daily Goal</h3>
        </div>
        
        {isEditing ? (
          <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
            <input 
              type="number" 
              className="w-16 p-1 rounded border dark:bg-gray-700 dark:border-gray-600 text-black dark:text-white font-bold text-center outline-none focus:ring-2 ring-indigo-500"
              value={goal} 
              onChange={(e) => setGoal(parseInt(e.target.value) || 0)}
            />
            <button onClick={updateGoal} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-black tracking-widest transition-colors">SET</button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-indigo-500 text-[10px] font-black uppercase tracking-widest transition-colors">
            Adjust Goal
          </button>
        )}
      </div>

      {/* Progress Section */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="animate-spin text-indigo-200" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between text-sm font-bold dark:text-gray-300">
            <span>{completedToday} Mocks Finished</span>
            <span>Goal: {goal}</span>
          </div>
          
          <div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {completedToday >= goal && (
            <div className="flex items-center gap-2 text-green-500 font-black justify-center bg-green-50 dark:bg-green-900/20 p-3 rounded-xl animate-in zoom-in duration-300 border border-green-100 dark:border-green-900/30">
              <CheckCircle2 size={18} /> Daily Goal Smashed!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
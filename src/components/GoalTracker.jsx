import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Target, ChevronUp, ChevronDown, CheckCircle, Flame } from 'lucide-react';

export default function GoalTracker({ user }) {
  const [goal, setGoal] = useState(5); // Default fallback
  const [completedToday, setCompletedToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // --- 1. INITIAL SYNC (Fetch Goal & Today's Progress) ---
  useEffect(() => {
    if (user?.id) {
      fetchGoalData();
    }
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
      // We look at the 'scores' table for records created today
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

  // --- 2. UPDATE LOGIC (Save to DB Immediately) ---
  const updateGoal = async (newGoal) => {
    if (newGoal < 1 || newGoal > 50) return; // Safety limits
    
    // 1. Optimistic Update (Instant UI change)
    setGoal(newGoal);
    setIsUpdating(true);

    // 2. Database Write
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ daily_goal_target: newGoal })
        .eq('id', user.id);

      if (error) throw error;
    } catch (err) {
      console.error("Failed to save goal:", err);
      // Revert if failed (Optional, but good practice)
    } finally {
      setTimeout(() => setIsUpdating(false), 500);
    }
  };

  // Progress Calculation
  const progress = Math.min((completedToday / goal) * 100, 100);
  const isGoalMet = completedToday >= goal;

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-xl border-b-8 border-orange-500 h-full flex flex-col justify-between relative overflow-hidden group">
      
      {/* Background Decoration */}
      <div className="absolute -right-6 -top-6 text-orange-500/10 group-hover:text-orange-500/20 transition-colors duration-500">
        <Target size={140} />
      </div>

      {/* Header */}
      <div className="relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">Daily Target</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              {isGoalMet ? 'Mission Accomplished' : `${goal - completedToday} Exams Remaining`}
            </p>
          </div>
          {isGoalMet && <div className="bg-green-100 text-green-600 p-2 rounded-full animate-bounce"><CheckCircle size={20} /></div>}
        </div>
      </div>

      {/* Main Counter & Controls */}
      <div className="relative z-10 flex items-center justify-between mt-6">
        <div className="flex flex-col">
          <span className="text-5xl font-black text-gray-800 dark:text-white tracking-tighter">
            {completedToday}<span className="text-2xl text-gray-300 dark:text-gray-600">/{goal}</span>
          </span>
        </div>

        {/* Adjuster Buttons */}
        <div className="flex flex-col gap-2 bg-gray-50 dark:bg-gray-900 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => updateGoal(goal + 1)}
            disabled={isUpdating}
            className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-green-500 transition-all shadow-sm active:scale-90"
          >
            <ChevronUp size={18} strokeWidth={3} />
          </button>
          <button 
            onClick={() => updateGoal(goal - 1)}
            disabled={isUpdating}
            className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-red-500 transition-all shadow-sm active:scale-90"
          >
            <ChevronDown size={18} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 mt-6">
        <div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
          <div 
            className={`h-full transition-all duration-1000 ease-out ${isGoalMet ? 'bg-green-500' : 'bg-orange-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {isGoalMet && (
          <p className="text-[10px] font-black text-center text-green-500 mt-2 uppercase tracking-widest flex items-center justify-center gap-1">
            <Flame size={12} /> Neural Limits Exceeded
          </p>
        )}
      </div>

    </div>
  );
}
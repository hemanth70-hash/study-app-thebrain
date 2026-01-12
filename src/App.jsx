import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MockEngine from './components/MockEngine';
import Leaderboard from './components/Leaderboard';
import AdminPanel from './components/AdminPanel';
import { supabase } from './supabaseClient';
import Profile from './components/Profile';
import SubjectNotes from './components/SubjectNotes';
import QuickQuiz from './components/QuickQuiz';
import GoalTracker from './components/GoalTracker';
import StudyChat from './components/StudyChat';
import InviteButton from './components/InviteButton';

export default function App() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [globalMsg, setGlobalMsg] = useState(null);

  // --- 1. GLOBAL ANNOUNCEMENT FETCH ---
  useEffect(() => {
    const fetchAnnouncement = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('message')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (data) setGlobalMsg(data.message);
    };
    fetchAnnouncement();
  }, [user]);

  // --- 2. STREAK & ATTENDANCE LOGIC ---
  const handleStreakCheck = async (profile) => {
    const today = new Date().toISOString().split('T')[0];
    if (profile.last_mock_date === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (profile.last_mock_date !== yesterdayStr && profile.last_mock_date !== null) {
      if (profile.freeze_points > 0) {
        await supabase.from('profiles')
          .update({ 
            freeze_points: profile.freeze_points - 1,
            last_mock_date: yesterdayStr 
          })
          .eq('id', profile.id);
        alert("🔥 Streak Protected! A Freeze Point was used to cover yesterday.");
      } else {
        await supabase.from('profiles')
          .update({ streak_count: 0 })
          .eq('id', profile.id);
      }
    }
  };

  const handleLogin = async () => {
    if (!username) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ username: username }, { onConflict: 'username' })
        .select()
        .single();

      if (error) {
        setUser({ username: username, id: '12345', streak_count: 0, freeze_points: 0 });
      } else {
        setUser(data);
        handleStreakCheck(data);
      }
    } catch (err) {
      setUser({ username: username, id: '12345' });
    }
  };

  if (!user) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-blue-50'}`}>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-xl border-2 border-blue-200 w-96 text-center">
          <h1 className="text-3xl font-black mb-6 text-blue-600 italic tracking-tighter">The Brain Portal</h1>
          <input 
            className="w-full p-4 rounded-2xl border mb-4 text-black dark:bg-gray-700 dark:text-white outline-none focus:ring-4 focus:ring-blue-100 transition-all" 
            placeholder="Enter Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
          />
          <button onClick={handleLogin} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg transition-all active:scale-95">
            Enter Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-blue-50 text-gray-800'}`}>
        
        <Sidebar 
          user={user} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          setIsDarkMode={setIsDarkMode} 
          isDarkMode={isDarkMode}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />
        
        <main className={`flex-1 p-10 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
          
          <header className="mb-10 flex flex-wrap items-center gap-6">
            <h2 className="text-4xl font-black capitalize text-blue-600 dark:text-blue-400">
              {activeTab === 'ranking' ? 'Leaderboard' : activeTab}
            </h2>

            {/* MARQUEE ANNOUNCEMENT SYSTEM */}
            <div className="flex-1 min-w-[300px]">
              {globalMsg && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-[1.5rem] shadow-lg flex items-center border border-white/20 overflow-hidden">
                  <span className="bg-white text-blue-600 px-2 py-0.5 rounded-lg font-black text-[10px] uppercase mr-4 shrink-0 z-10">News</span>
                  <div className="flex-1 overflow-hidden relative">
                    <marquee className="font-bold text-sm whitespace-nowrap" scrollamount="6">
                      {globalMsg}
                    </marquee>
                  </div>
                  <button onClick={() => setGlobalMsg(null)} className="ml-4 hover:text-white/70 transition-colors shrink-0 z-10">✕</button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-6 py-2 rounded-2xl shadow-sm border-2 border-orange-50 dark:border-gray-700">
              <span className="text-2xl">🔥</span>
              <span className="font-black text-xl text-orange-500">{user.streak_count || 0}</span>
              <span className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">Streak</span>
            </div>
          </header>

          <div className="max-w-6xl mx-auto space-y-8">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <div className="flex flex-col gap-6">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-xl border-b-8 border-blue-500">
                      <div className="flex justify-between items-start mb-4">
                         <h3 className="text-2xl font-black uppercase tracking-tighter">Hi, {user.username}!</h3>
                         <InviteButton />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                        Your study portal is live. Complete today's **Quick Mock** to earn points and protect your flame.
                      </p>
                    </div>
                  </div>
                  <div className="h-full">
                    <GoalTracker user={user} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <QuickQuiz />
                  </div>
                  <div className="lg:col-span-1">
                    <StudyChat user={user} />
                  </div>
                </div>
              </div>
            )}

            {/* TAB ROUTING */}
            {activeTab === 'subjects' && <SubjectNotes user={user} />}
            {activeTab === 'mocks' && <MockEngine user={user} onFinish={() => setActiveTab('dashboard')} />}
            {activeTab === 'ranking' && <Leaderboard />}
            {activeTab === 'admin' && <AdminPanel />}
            {activeTab === 'profile' && <Profile user={user} />}
            
          </div>
        </main>
      </div>
    </div>
  );
}
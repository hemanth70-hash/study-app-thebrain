import React, { useState, useEffect, useCallback } from 'react';
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
import StudyHub from './components/StudyHub'; 
import { Lock, Megaphone, ShieldAlert, Key, Youtube, Layout } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [globalMsg, setGlobalMsg] = useState(null);
  const [isExamLocked, setIsExamLocked] = useState(false); // 🔥 Active Exam Lockdown State

  // --- ACCESS KEY STATES ---
  const [accessKey, setAccessKey] = useState('');
  const [authError, setAuthError] = useState('');

  // --- 1. ATOMIC USER REFRESH ---
  const refreshUser = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data && !error) setUser(data);
  }, []);

  // --- 2. GLOBAL ANNOUNCEMENT ---
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

  // --- 3. REFINED STREAK LOGIC (Strict Point Protection) ---
  const handleStreakCheck = async (profile) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    if (profile.last_mock_date === todayStr) return;

    const lastDate = profile.last_mock_date ? new Date(profile.last_mock_date) : null;
    
    if (lastDate) {
      lastDate.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastDate.getTime() < yesterday.getTime()) {
        if (profile.streak_points > 0) {
          // PROTECT: Consume streak point (Freeze)
          await supabase.from('profiles').update({ 
            streak_points: profile.streak_points - 1,
            last_mock_date: yesterday.toISOString().split('T')[0] 
          }).eq('id', profile.id);
          
          alert("🔥 STREAK PROTECTED: 1 Streak Point consumed.");
          refreshUser(profile.id);
        } else {
          // COLLAPSE: Reset to 0
          await supabase.from('profiles').update({ streak_count: 0 }).eq('id', profile.id);
          refreshUser(profile.id);
        }
      }
    }
  };

  // --- 4. LOGIN LOGIC ---
  const handleLogin = async () => {
    if (!username) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ username: username.trim() }, { onConflict: 'username' })
        .select().single();

      if (!error) {
        setUser(data);
        handleStreakCheck(data);
      }
    } catch (err) { console.error("Login Error", err); }
  };

  // --- 5. IDENTITY VERIFICATION ---
  const validateAccessKey = async () => {
    setAuthError('⏳ Validating Identity...');
    const { data: keyData, error: keyError } = await supabase
      .from('authorized_users')
      .select('*')
      .eq('access_key', accessKey.trim().toUpperCase())
      .single();

    if (keyData && !keyError) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', user.id);

      if (!updateError) {
        await refreshUser(user.id);
        setAuthError('');
      }
    } else {
      setAuthError('❌ Invalid Access Key. Verification Failed.');
    }
  };

  const sendAdminRequest = async () => {
    const msg = window.prompt("The Brain, what is your request?");
    if (!msg) return;
    await supabase.from('admin_requests').insert([{
      user_id: user.id, user_name: user.username, message: msg, request_type: 'USER_REQUEST'
    }]);
    alert("Request transmitted to The Brain.");
  };

  // --- VIEW: LOGIN SCREEN ---
  if (!user) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-950' : 'bg-blue-50'}`}>
        <div className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] shadow-2xl border-2 border-blue-500/20 w-full max-w-md text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3">
             <ShieldAlert className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-black mb-2 text-blue-600 italic tracking-tighter uppercase">Neural Portal</h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-8">Identify Node</p>
          <input className="w-full p-5 rounded-2xl border-2 mb-4 dark:bg-gray-800 dark:border-gray-700 dark:text-white font-black outline-none focus:border-blue-500 transition-all text-center" placeholder="ENTER USERNAME" value={username} onChange={(e) => setUsername(e.target.value)} />
          <button onClick={handleLogin} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl transition-all active:scale-95">Verify Identity</button>
        </div>
      </div>
    );
  }

  // --- VIEW: IDENTITY AUTHORIZATION LOCK ---
  const isAdmin = user.username.toLowerCase() === 'thebrain';
  if (!isAdmin && !user.is_verified) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-950' : 'bg-blue-50'}`}>
        <div className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] shadow-2xl border-2 border-indigo-500/20 w-full max-w-md text-center">
          <Key className="mx-auto mb-6 text-indigo-500" size={48} />
          <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter mb-2">Access Locked</h2>
          <p className="text-gray-500 text-xs font-bold uppercase mb-8">Node "{user.username}" requires verification key.</p>
          <input className="w-full p-5 rounded-2xl border-2 mb-4 dark:bg-gray-800 dark:border-gray-700 dark:text-white font-mono text-center text-xl tracking-[0.2em] outline-none focus:border-indigo-500 transition-all" placeholder="BRAIN-XXXXXX" value={accessKey} onChange={(e) => setAccessKey(e.target.value)} />
          <button onClick={validateAccessKey} className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl transition-all mb-4">Authorize Identity</button>
          {authError && <p className="text-red-500 font-black text-[10px] uppercase tracking-widest">{authError}</p>}
        </div>
      </div>
    );
  }

  // --- VIEW: MAIN PORTAL ---
  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-blue-50 text-gray-800'}`}>
        
        {/* 🔥 SIDEBAR LOCKDOWN: Blocks navigation clicks and blurs UI during tests */}
        <div className={`${isExamLocked ? 'pointer-events-none opacity-40 blur-[3px] grayscale select-none' : ''} transition-all duration-700 z-40`}>
          <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} setIsDarkMode={setIsDarkMode} isDarkMode={isDarkMode} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        </div>
        
        <main className={`flex-1 p-6 md:p-10 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
          <header className={`mb-10 flex flex-wrap items-center gap-6 transition-all duration-700 ${isExamLocked ? 'opacity-20 pointer-events-none select-none translate-y-[-10px]' : ''}`}>
            <h2 className="text-4xl font-black capitalize text-blue-600 dark:text-blue-400">
              {activeTab === 'ranking' ? 'Leaderboard' : activeTab === 'study' ? 'Study Hub' : activeTab}
            </h2>
            <div className="flex-1 min-w-[300px]">
              {globalMsg && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-3xl shadow-lg flex items-center border border-white/20 overflow-hidden relative">
                  <div className="flex-1 overflow-hidden"><marquee className="font-bold text-sm whitespace-nowrap" scrollamount="6">{globalMsg}</marquee></div>
                  <button onClick={() => setGlobalMsg(null)} className="ml-4 hover:text-white/70 transition-colors shrink-0 z-10">✕</button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-6 py-2 rounded-2xl shadow-sm border-2 border-orange-50 dark:border-gray-700">
              <span className="text-2xl">🔥</span>
              <span className="font-black text-xl text-orange-500">{user.streak_count || 0}</span>
            </div>
          </header>

          <div className="max-w-7xl mx-auto space-y-8">
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                  <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl border-b-8 border-blue-500 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform duration-700"><Layout size={160} /></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-3xl font-black uppercase tracking-tighter dark:text-white">Hi, {user.username}!</h3>
                          <p className="text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] mt-1">Identity: {user.education || 'Neural Aspirant'}</p>
                        </div>
                        <InviteButton />
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800">
                        <p className="text-sm font-bold text-gray-600 dark:text-gray-400">
                          Synchronization level: Omega. Lifetime GPA: <span className="text-blue-600 font-black">{(user.total_percentage_points / (user.total_exams_completed || 1)).toFixed(1)}%</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-1 h-full min-h-[250px]"><GoalTracker user={user} /></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                  <div className="lg:col-span-3 h-full"><QuickQuiz /></div>
                  <div className="lg:col-span-2 h-full flex flex-col min-h-[400px]"><StudyChat user={user} /></div>
                </div>
              </div>
            )}
            
            {activeTab === 'study' && <StudyHub user={user} />}
            {activeTab === 'subjects' && <SubjectNotes user={user} />}
            
            {/* 🔥 MOCK ENGINE: Integrated with Sidebar Lockdown & Forced Dark Mode */}
            {activeTab === 'mocks' && (
              <MockEngine 
                user={user} 
                setIsExamLocked={setIsExamLocked} 
                setIsDarkMode={setIsDarkMode} 
                onFinish={() => { 
                  setActiveTab('dashboard'); 
                  setIsExamLocked(false); 
                  refreshUser(user.id); 
                }} 
              />
            )}

            {activeTab === 'ranking' && <Leaderboard />}
            {activeTab === 'admin' && <AdminPanel />}
            {activeTab === 'profile' && <Profile user={user} />}
          </div>

          {/* 🔥 HIDE ADMIN REQUESTS & SIGNALS DURING EXAM */}
          {!isExamLocked && user.username.toLowerCase() !== 'thebrain' && (
            <button onClick={sendAdminRequest} className="fixed bottom-8 right-8 bg-blue-600/10 backdrop-blur-md text-blue-600 p-4 rounded-full border border-blue-600/20 hover:bg-blue-600 hover:text-white transition-all shadow-2xl group" title="Request Admin">
              <Megaphone size={24} className="group-hover:animate-bounce" />
            </button>
          )}
        </main>
      </div>
    </div>
  );
}
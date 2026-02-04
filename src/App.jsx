import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MockEngine from './components/MockEngine';
import Leaderboard from './components/Leaderboard';
import AdminPanel from './components/AdminPanel';
import { supabase } from './supabaseClient';
import Profile from './components/Profile';
import SubjectNotes from './components/SubjectNotes';
import StudyHub from './components/StudyHub'; 
import TypingMaster from './components/TypingMaster';
import ChronosDashboard from './components/ChronosDashboard';

import { Megaphone, ShieldAlert } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // 🔥 CHANGED: Default is now FALSE (Solar Mode / Light Mode)
  const [isDarkMode, setIsDarkMode] = useState(false); 

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [globalMsg, setGlobalMsg] = useState(null);
  const [isExamLocked, setIsExamLocked] = useState(false); 
  const [loginError, setLoginError] = useState('');

  // --- REAPER LOGIC ---
  const runTheReaper = async () => {
    const today = new Date();
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(today.getDate() - 60);
    const dateStr = sixtyDaysAgo.toISOString().split('T')[0];
    const { data: deadNodes } = await supabase.from('profiles').select('id, username').lt('last_mock_date', dateStr).neq('username', 'TheBrain');
    if (deadNodes && deadNodes.length > 0) {
      for (const node of deadNodes) {
        await supabase.from('scores').delete().eq('user_id', node.id);
        await supabase.from('subject_notes').delete().eq('user_id', node.id);
        await supabase.from('profiles').delete().eq('id', node.id);
      }
    }
  };

  const refreshUser = useCallback(async (userId) => {
    if (!userId) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setUser(data);
  }, []);

  // --- GLOBAL MSG ---
  useEffect(() => {
    const fetchAnnouncement = async () => {
      const { data } = await supabase.from('announcements').select('message').eq('active', true).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (data) setGlobalMsg(data.message);
    };
    if (user) fetchAnnouncement();
  }, [user?.id]);

  // --- STREAK ---
  const handleStreakCheck = async (profile) => {
    if (!profile?.last_mock_date) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    if (profile.last_mock_date === todayStr) return;
    const lastDate = new Date(profile.last_mock_date);
    lastDate.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastDate.getTime() < yesterday.getTime()) {
      if (profile.streak_points > 0) {
        await supabase.from('profiles').update({ streak_points: profile.streak_points - 1, last_mock_date: yesterday.toISOString().split('T')[0] }).eq('id', profile.id);
        alert("🔥 STREAK PROTECTED.");
        refreshUser(profile.id);
      } else {
        await supabase.from('profiles').update({ streak_count: 0 }).eq('id', profile.id);
        refreshUser(profile.id);
      }
    }
  };

  // --- LOGIN ---
  const handleLogin = async () => {
    if (!username.trim()) return;
    setLoginError('');
    try {
      const inputName = username.trim();
      const { data: existingUser } = await supabase.from('profiles').select('*').ilike('username', inputName).maybeSingle();
      if (existingUser) {
        setUser(existingUser);
        handleStreakCheck(existingUser);
        if (existingUser.username.toLowerCase() === 'thebrain') runTheReaper();
        return;
      }
      const { data: invite } = await supabase.from('invite_codes').select('*').eq('code', inputName).eq('is_used', false).maybeSingle();
      if (invite) {
        const { data: newUser, error: createError } = await supabase.from('profiles').insert([{ username: inputName, is_verified: true, last_mock_date: new Date().toISOString().split('T')[0] }]).select().single();
        if (newUser && !createError) {
          await supabase.from('invite_codes').update({ is_used: true }).eq('id', invite.id);
          setUser(newUser);
        } else setLoginError("Error.");
      } else setLoginError("❌ Access Denied.");
    } catch (err) { setLoginError("System Failure."); }
  };

  const sendAdminRequest = async () => {
    const msg = window.prompt("Transmission to The Brain:");
    if (!msg) return;
    await supabase.from('admin_requests').insert([{ user_id: user.id, user_name: user.username, message: msg, request_type: 'USER_REQUEST' }]);
    alert("Signal transmitted.");
  };

  if (!user) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-slate-950' : 'bg-blue-50'}`}>
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl border-2 border-blue-500/20 w-full max-w-md text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3"><ShieldAlert className="text-white" size={40} /></div>
          <h1 className="text-4xl font-black mb-2 text-blue-600 italic tracking-tighter uppercase">Neural Portal</h1>
          <input className="w-full p-5 rounded-2xl border-2 mb-4 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-center font-bold" placeholder="USERNAME" value={username} onChange={(e) => setUsername(e.target.value)} />
          <button onClick={handleLogin} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase">Initialize</button>
          {loginError && <p className="text-red-500 font-bold mt-4">{loginError}</p>}
        </div>
      </div>
    );
  }

  const isAdmin = user.username.toLowerCase() === 'thebrain' || user.is_moderator;

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      {/* GLOBAL BACKGROUND: Solar = bg-blue-50 (Clean Light) | Lunar = bg-[#050508] (Deep Dark) */}
      <div className={`flex min-h-screen transition-colors duration-500 ease-in-out ${isDarkMode ? 'bg-[#050508] text-slate-100' : 'bg-blue-50 text-gray-800'}`}>
        
        <div className={`${isExamLocked ? 'pointer-events-none opacity-40 blur-[3px] grayscale select-none' : ''} transition-all duration-700 z-40`}>
          <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} setIsDarkMode={setIsDarkMode} isDarkMode={isDarkMode} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        </div>
        
        <main className={`flex-1 p-6 md:p-10 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
          <header className={`mb-10 flex flex-wrap items-center gap-6 transition-all duration-700 ${isExamLocked ? 'opacity-20 pointer-events-none' : ''}`}>
            <h2 className="text-4xl font-black capitalize text-blue-600 dark:text-blue-400">
              {activeTab === 'ranking' ? 'Leaderboard' : activeTab === 'study' ? 'Study Hub' : activeTab}
            </h2>
            <div className="flex-1 min-w-[300px]">
              {globalMsg && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-3xl shadow-lg flex items-center">
                  <div className="flex-1 overflow-hidden"><marquee className="font-bold text-sm">{globalMsg}</marquee></div>
                  <button onClick={() => setGlobalMsg(null)} className="ml-4 hover:text-white/70">✕</button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-6 py-2 rounded-2xl shadow-sm border-2 border-orange-50 dark:border-slate-700">
              <span className="text-2xl animate-pulse">🔥</span>
              <span className="font-black text-xl text-orange-500">{user.streak_count || 0}</span>
            </div>
          </header>

          <div className="max-w-7xl mx-auto space-y-8">
            {activeTab === 'dashboard' && <ChronosDashboard user={user} isDarkMode={isDarkMode} />}
            
            {activeTab === 'study' && <StudyHub user={user} />}
            {activeTab === 'subjects' && <SubjectNotes user={user} />}
            {activeTab === 'typing' && <TypingMaster user={user} />}
            
            {activeTab === 'mocks' && (
              <MockEngine user={user} setIsExamLocked={setIsExamLocked} setIsDarkMode={setIsDarkMode} onFinish={() => { setActiveTab('dashboard'); setIsExamLocked(false); refreshUser(user.id); }} />
            )}

            {activeTab === 'ranking' && <Leaderboard />}
            {activeTab === 'admin' && <AdminPanel user={user} />}
            {activeTab === 'profile' && <Profile user={user} />}
          </div>

          {!isExamLocked && !isAdmin && (
            <button onClick={sendAdminRequest} className="fixed bottom-8 right-8 bg-blue-600 text-white p-5 rounded-full shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:scale-110 active:scale-95 transition-all z-50 group">
              <Megaphone size={26} className="group-hover:animate-bounce" />
            </button>
          )}
        </main>
      </div>
    </div>
  );
}
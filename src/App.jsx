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
import TypingMaster from './components/TypingMaster'; 
import RailwayDreamTunnel from './components/RailwayDreamTunnel'; // 🔥 IMPORTED

// 🔥 STABILIZED IMPORTS: All required icons for Dashboard & Engine included
import { 
  Lock, Megaphone, ShieldAlert, Key, Youtube, 
  Layout, Zap, Award, Database, ListFilter, Skull, TrainFront // 🔥 Added Train Icon
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [globalMsg, setGlobalMsg] = useState(null);
  const [isExamLocked, setIsExamLocked] = useState(false); 
  const [loginError, setLoginError] = useState('');
  const [isTunnelOpen, setIsTunnelOpen] = useState(false); // 🔥 NEW TUNNEL STATE

  // --- 1. THE REAPER (AUTO-DELETE LOGIC) ---
  const runTheReaper = async () => {
    const today = new Date();
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(today.getDate() - 60);
    const dateStr = sixtyDaysAgo.toISOString().split('T')[0];

    const { data: deadNodes } = await supabase
      .from('profiles')
      .select('id, username')
      .lt('last_mock_date', dateStr)
      .neq('username', 'TheBrain');

    if (deadNodes && deadNodes.length > 0) {
      console.log("💀 THE REAPER: Purging inactive nodes...", deadNodes);
      
      for (const node of deadNodes) {
        await supabase.from('scores').delete().eq('user_id', node.id);
        await supabase.from('subject_notes').delete().eq('user_id', node.id);
        await supabase.from('profiles').delete().eq('id', node.id);
      }
    }
  };

  const refreshUser = useCallback(async (userId) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data && !error) setUser(data);
  }, []);

  // --- 2. GLOBAL ANNOUNCEMENT ENGINE ---
  useEffect(() => {
    const fetchAnnouncement = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('message')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setGlobalMsg(data.message);
    };
    if (user) fetchAnnouncement();
  }, [user?.id]);

  // --- 3. REFINED STREAK LOGIC ---
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
        await supabase.from('profiles').update({ 
          streak_points: profile.streak_points - 1,
          last_mock_date: yesterday.toISOString().split('T')[0] 
        }).eq('id', profile.id);
        alert("🔥 STREAK PROTECTED: 1 Streak Point consumed to maintain your grid connection.");
        refreshUser(profile.id);
      } else {
        await supabase.from('profiles').update({ streak_count: 0 }).eq('id', profile.id);
        refreshUser(profile.id);
      }
    }
  };

  // --- 4. NEW LOGIN SYSTEM (INVITE CODES) ---
  const handleLogin = async () => {
    if (!username.trim()) return;
    setLoginError('');

    try {
      const inputName = username.trim();
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', inputName)
        .maybeSingle();

      if (existingUser) {
        setUser(existingUser);
        handleStreakCheck(existingUser);
        if (existingUser.username.toLowerCase() === 'thebrain') {
          runTheReaper();
        }
        return;
      }

      const { data: invite } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('code', inputName)
        .eq('is_used', false)
        .maybeSingle();

      if (invite) {
        const { data: newUser, error: createError } = await supabase
          .from('profiles')
          .insert([{ 
            username: inputName, 
            is_verified: true,   
            last_mock_date: new Date().toISOString().split('T')[0] 
          }])
          .select()
          .single();

        if (newUser && !createError) {
          await supabase.from('invite_codes').update({ is_used: true }).eq('id', invite.id);
          setUser(newUser);
        } else {
          setLoginError("Error initializing node.");
        }
      } else {
        setLoginError("❌ Access Denied: User not found or Invalid Invite Code.");
      }

    } catch (err) { 
      console.error("Login Error", err); 
      setLoginError("System Failure.");
    }
  };

  const sendAdminRequest = async () => {
    const msg = window.prompt("Transmission to The Brain:");
    if (!msg) return;
    await supabase.from('admin_requests').insert([{
      user_id: user.id, user_name: user.username, message: msg, request_type: 'USER_REQUEST'
    }]);
    alert("Signal transmitted to The Brain.");
  };

  // --- 🔥 VIEW: TUNNEL OVERRIDE (LOCO PILOT MODE) ---
  if (user && isTunnelOpen) {
    return <RailwayDreamTunnel user={user} onClose={() => setIsTunnelOpen(false)} />;
  }

  // --- VIEW: LOGIN ---
  if (!user) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-slate-950' : 'bg-blue-50'}`}>
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl border-2 border-blue-500/20 w-full max-w-md text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3">
             <ShieldAlert className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-black mb-2 text-blue-600 italic tracking-tighter uppercase">Neural Portal</h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-8">Identify Node / Enter Code</p>
          <input className="w-full p-5 rounded-2xl border-2 mb-4 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-black outline-none focus:border-blue-500 transition-all text-center" placeholder="USERNAME OR INVITE CODE" value={username} onChange={(e) => setUsername(e.target.value)} />
          <button onClick={handleLogin} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl transition-all">Initialize Connection</button>
          {loginError && <p className="text-red-500 font-black text-[10px] uppercase tracking-widest mt-4 animate-pulse">{loginError}</p>}
        </div>
      </div>
    );
  }

  const isAdmin = user.username.toLowerCase() === 'thebrain' || user.is_moderator;

  // --- VIEW: MAIN DASHBOARD ---
  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-blue-50 text-gray-800'}`}>
        
        {/* SIDEBAR LOCKDOWN */}
        <div className={`${isExamLocked ? 'pointer-events-none opacity-40 blur-[3px] grayscale select-none' : ''} transition-all duration-700 z-40`}>
          <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} setIsDarkMode={setIsDarkMode} isDarkMode={isDarkMode} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        </div>
        
        <main className={`flex-1 p-6 md:p-10 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
          {/* HEADER SECTION */}
          <header className={`mb-10 flex flex-wrap items-center gap-6 transition-all duration-700 ${isExamLocked ? 'opacity-20 pointer-events-none select-none -translate-y-4' : ''}`}>
            <h2 className="text-4xl font-black capitalize text-blue-600 dark:text-blue-400">
              {activeTab === 'ranking' ? 'Leaderboard' : activeTab === 'study' ? 'Study Hub' : activeTab === 'typing' ? 'Neural Typer' : activeTab}
            </h2>
            <div className="flex-1 min-w-[300px]">
              {globalMsg && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-3xl shadow-lg flex items-center border border-white/20 relative overflow-hidden">
                  <div className="flex-1 overflow-hidden"><marquee className="font-bold text-sm whitespace-nowrap">{globalMsg}</marquee></div>
                  <button onClick={() => setGlobalMsg(null)} className="ml-4 hover:text-white/70 transition-colors shrink-0 z-10">✕</button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-6 py-2 rounded-2xl shadow-sm border-2 border-orange-50 dark:border-slate-700">
              <span className="text-2xl animate-pulse">🔥</span>
              <span className="font-black text-xl text-orange-500">{user.streak_count || 0}</span>
            </div>
          </header>

          <div className="max-w-7xl mx-auto space-y-8">
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-xl border-b-8 border-blue-500 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform duration-700"><Layout size={160} /></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-4xl font-black uppercase tracking-tighter dark:text-white">Welcome, {user.username}</h3>
                          <p className="text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] mt-2 italic">Identity: {user.education || 'Neural Aspirant'}</p>
                        </div>
                        {/* 🔥 COCKPIT TRIGGER BUTTON */}
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setIsTunnelOpen(true)}
                            className="bg-slate-900 dark:bg-slate-800 text-white p-3 rounded-xl border border-slate-700 hover:border-cyan-500 hover:text-cyan-400 transition-all shadow-lg group/btn"
                            title="Enter Loco Pilot Mode"
                          >
                            <TrainFront size={24} className="group-hover/btn:animate-bounce" />
                          </button>
                          <InviteButton />
                        </div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800 backdrop-blur-sm">
                        <p className="text-sm font-bold text-gray-600 dark:text-slate-300">
                          Synchronization Active. Global Performance Index: <span className="text-blue-600 font-black">{(user.total_percentage_points / (user.total_exams_completed || 1)).toFixed(1)}%</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-1 min-h-[250px]"><GoalTracker user={user} /></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  <div className="lg:col-span-3"><QuickQuiz /></div>
                  <div className="lg:col-span-2 flex flex-col min-h-[400px]"><StudyChat user={user} /></div>
                </div>
              </div>
            )}
            
            {activeTab === 'study' && <StudyHub user={user} />}
            {activeTab === 'subjects' && <SubjectNotes user={user} />}
            {activeTab === 'typing' && <TypingMaster user={user} />}
            
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
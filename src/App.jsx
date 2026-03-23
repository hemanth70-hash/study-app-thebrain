import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MockEngine from './components/MockEngine';
import Leaderboard from './components/Leaderboard';
import AdminPanel from './components/AdminPanel';
import { supabase } from './supabaseClient';
import Profile from './components/Profile';
import SubjectNotes from './components/SubjectNotes';
import StudyHub from './components/StudyHub'; 
import TypingMaster from './components/TypingMaster'; 
import NeuralTools from './components/NeuralTools';
import NTPCTracker from './components/NTPCTracker';
import Auth from './components/Auth'; // 🔥 IMPORTED AUTH
// 🔥 WIDGETS
import CalendarWidget from './components/CalendarWidget'; 
import WelcomeHeader from './components/WelcomeHeader'; 
import GoalTracker from './components/GoalTracker';
import StudyChat from './components/StudyChat';

import { ShieldAlert, Megaphone, Loader2 } from 'lucide-react';

// --- MAIN DASHBOARD COMPONENT ---
function DashboardLayout({ user, isDarkMode, setIsDarkMode, activeTab, setActiveTab, setUser, refreshUser, onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [globalMsg, setGlobalMsg] = useState(null);
  const [isExamLocked, setIsExamLocked] = useState(false); 

  // --- GLOBAL ANNOUNCEMENT ENGINE ---
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

  const sendAdminRequest = async () => {
    const msg = window.prompt("Transmission to The Brain:");
    if (!msg) return;
    await supabase.from('admin_requests').insert([{
      user_id: user.id, user_name: user.username, message: msg, request_type: 'USER_REQUEST'
    }]);
    alert("Signal transmitted.");
  };

  const isAdmin = user.username?.toLowerCase() === 'thebrain' || user.is_moderator;

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-blue-50 text-gray-800'}`}>
      
      {/* SIDEBAR */}
      <div className={`${isExamLocked ? 'pointer-events-none opacity-40 blur-[3px] grayscale select-none' : ''} transition-all duration-700 z-40`}>
        <Sidebar 
          user={user} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          setIsDarkMode={setIsDarkMode} 
          isDarkMode={isDarkMode} 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
        />
      </div>
      
      {/* MAIN CONTENT AREA */}
      <main className={`flex-1 p-6 md:p-10 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        
        {/* HEADER */}
        <header className={`mb-10 flex flex-wrap items-center gap-6 transition-all duration-700 ${isExamLocked ? 'opacity-20 pointer-events-none select-none -translate-y-4' : ''}`}>
          <h2 className={`text-4xl font-black capitalize transition-colors ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            {activeTab === 'ranking' ? 'Leaderboard' : activeTab === 'study' ? 'Study Hub' : activeTab === 'typing' ? 'Neural Typer' : activeTab}
          </h2>
          
          <div className="flex-1 min-w-[200px]">
            {globalMsg && (
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-3xl shadow-lg flex items-center border border-white/20 relative overflow-hidden">
                <div className="flex-1 overflow-hidden"><marquee className="font-bold text-sm whitespace-nowrap">{globalMsg}</marquee></div>
                <button onClick={() => setGlobalMsg(null)} className="ml-4 hover:text-white/70 transition-colors shrink-0 z-10">✕</button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-3 px-6 py-2 rounded-2xl shadow-sm border-2 transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-orange-100'}`}>
              <span className="text-2xl animate-pulse">🔥</span>
              <span className="font-black text-xl text-orange-500">{user.streak_count || 0}</span>
            </div>
            {/* 🔥 NEW DISCONNECT (LOGOUT) BUTTON */}
            <button 
              onClick={onLogout} 
              className="px-6 py-2.5 rounded-2xl bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all border border-red-500/20 active:scale-95"
            >
              Disconnect
            </button>
          </div>
        </header>

        {/* CONTENT SWITCHER */}
        <div className="max-w-7xl mx-auto space-y-8">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <WelcomeHeader isDarkMode={isDarkMode} />
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="h-full lg:col-span-1"><CalendarWidget isDarkMode={isDarkMode} /></div>
                <div className="h-full lg:col-span-2"><StudyChat user={user} isDarkMode={isDarkMode} /></div>
                <div className="h-full lg:col-span-1"><GoalTracker user={user} isDarkMode={isDarkMode} /></div>
              </div>
            </div>
          )}
          
          {activeTab === 'study' && <StudyHub user={user} isDarkMode={isDarkMode} />}
          {activeTab === 'subjects' && <SubjectNotes user={user} isDarkMode={isDarkMode} />}
          {activeTab === 'typing' && <TypingMaster user={user} isDarkMode={isDarkMode} />}
          {activeTab === 'tools' && <NeuralTools isDarkMode={isDarkMode} />}
          {activeTab === 'tracker' && <NTPCTracker user={user} isDarkMode={isDarkMode} />}
          
          {activeTab === 'mocks' && (
            <MockEngine 
              user={user} 
              setIsExamLocked={setIsExamLocked} 
              setIsDarkMode={setIsDarkMode} 
              isDarkMode={isDarkMode}
              onFinish={() => { 
                setActiveTab('dashboard'); 
                setIsExamLocked(false); 
                refreshUser(user.id); 
              }} 
            />
          )}

          {activeTab === 'ranking' && <Leaderboard isDarkMode={isDarkMode} />}
          {activeTab === 'admin' && <AdminPanel user={user} isDarkMode={isDarkMode} />}
          {activeTab === 'profile' && <Profile user={user} isDarkMode={isDarkMode} />}
        </div>

        {/* ADMIN REQUEST BUTTON */}
        {!isExamLocked && !isAdmin && (
          <button onClick={sendAdminRequest} className="fixed bottom-8 right-8 bg-blue-600 text-white p-5 rounded-full shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:scale-110 active:scale-95 transition-all z-50 group">
            <Megaphone size={26} className="group-hover:animate-bounce" />
          </button>
        )}
      </main>
    </div>
  );
}

// --- ROOT APP COMPONENT ---
export default function App() {
  const [session, setSession] = useState(null); // 🔥 NEW: Auth Session
  const [user, setUser] = useState(null);       // Profile Data
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // 🔥 LEGACY USER STATE
  const [legacyUser, setLegacyUser] = useState(() => {
    const saved = localStorage.getItem('legacy_neural_user');
    return saved ? JSON.parse(saved) : null;
  });

  // --- THE REAPER (AUTO-DELETE LOGIC) ---
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

  // --- STREAK LOGIC ---
  const handleStreakCheck = async (profile) => {
    if (!profile?.last_mock_date) return profile;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    if (profile.last_mock_date === todayStr) return profile;

    const lastDate = new Date(profile.last_mock_date);
    lastDate.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastDate.getTime() < yesterday.getTime()) {
      await supabase.from('profiles').update({ streak_count: 0 }).eq('id', profile.id);
      return { ...profile, streak_count: 0 };
    }
    return profile;
  };

  // --- REFRESH USER LOGIC ---
  const refreshUser = useCallback(async (userId) => {
    if (!userId) return;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    
    if (data && !error) {
      // Check streak status before saving to state
      const updatedProfile = await handleStreakCheck(data);
      setUser(updatedProfile);

      // 🔥 Update local storage if it's a legacy user
      if (legacyUser && legacyUser.id === userId) {
         setLegacyUser(updatedProfile);
         localStorage.setItem('legacy_neural_user', JSON.stringify(updatedProfile));
      }
      
      // Trigger Reaper if Admin
      if (updatedProfile.username?.toLowerCase() === 'thebrain') {
        runTheReaper();
      }
    }
    setIsLoadingProfile(false);
  }, [legacyUser]);

  // --- GLOBAL AUTHENTICATION EFFECT ---
  useEffect(() => {
    // 🔥 Skip Supabase Auth check if they are a local legacy user
    if (legacyUser) {
      setIsLoadingProfile(false);
      return;
    }

    // 1. Check Session on Load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        refreshUser(session.user.id);
      } else {
        setIsLoadingProfile(false);
      }
    });

    // 2. Listen for Auth Changes (Login / Logout / Sign Up)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        setIsLoadingProfile(true);
        refreshUser(session.user.id);
      } else {
        setUser(null);
        setIsLoadingProfile(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshUser, legacyUser]);

  // 🔥 LEGACY LOGIN HANDLER
  const handleLegacyLogin = (profile) => {
    setLegacyUser(profile);
    localStorage.setItem('legacy_neural_user', JSON.stringify(profile));
  };

  // 🔥 GLOBAL LOGOUT HANDLER
  const handleLogout = async () => {
    if (legacyUser) {
      setLegacyUser(null);
      localStorage.removeItem('legacy_neural_user');
    } else {
      await supabase.auth.signOut();
    }
    setActiveTab('dashboard'); 
  };

  // Combine standard user or legacy user
  const activeUser = legacyUser || user;

  return (
    <Router>
      <div className={isDarkMode ? 'dark' : ''}>
        <Routes>
          
          {/* 🔥 ROUTE 1: THE NEURAL TOOLS POPUP (NO SIDEBAR) */}
          <Route 
            path="/tools" 
            element={
              <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
                <NeuralTools isDarkMode={isDarkMode} />
              </div>
            } 
          />

          {/* 🔥 ROUTE 2: MAIN APP (AUTH & DASHBOARD) */}
          <Route 
            path="/" 
            element={
              !activeUser ? (
                // --- 1. NEW SECURE AUTH COMPONENT ---
                <Auth isDarkMode={isDarkMode} onLegacyLogin={handleLegacyLogin} />
              ) : isLoadingProfile ? (
                // --- 2. LOADING STATE (Fetching Profile Data) ---
                <div className={`flex flex-col items-center justify-center min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-blue-500' : 'bg-blue-50 text-blue-600'}`}>
                   <Loader2 size={48} className="animate-spin mb-4" />
                   <p className="font-black text-xs uppercase tracking-widest animate-pulse">Initializing Neural Link...</p>
                </div>
              ) : (
                // --- 3. MAIN DASHBOARD ---
                <DashboardLayout 
                  user={activeUser} 
                  isDarkMode={isDarkMode} 
                  setIsDarkMode={setIsDarkMode} 
                  activeTab={activeTab} 
                  setActiveTab={setActiveTab} 
                  setUser={setUser} 
                  refreshUser={refreshUser}
                  onLogout={handleLogout} // 🔥 Passing logout down
                />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}
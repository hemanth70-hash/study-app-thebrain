import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MockEngine from './components/MockEngine';
import Leaderboard from './components/Leaderboard';
import AdminPanel from './components/AdminPanel';
import { supabase } from './supabaseClient';
import Profile from './components/Profile';
import SubjectNotes from './components/SubjectNotes';
import QuickQuiz from './components/QuickQuiz';
import GoalTracker from './components/GoalTracker';
import StudyChat from './components/StudyChat'; // New Real-time Chat

export default function App() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogin = async () => {
    if (!username) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ username: username }, { onConflict: 'username' })
        .select()
        .single();

      if (error) {
        console.error("Supabase Error:", error.message);
        setUser({ username: username, id: '12345' });
      } else {
        setUser(data);
      }
    } catch (err) {
      console.error("Critical Crash:", err);
      setUser({ username: username, id: '12345' });
    }
  };

  if (!user) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-blue-50'}`}>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border-2 border-blue-200 w-96 text-center">
          <h1 className="text-2xl font-bold mb-4 text-blue-600">The Brain Portal</h1>
          <input 
            className="w-full p-3 rounded-lg border mb-4 text-black dark:bg-gray-700 dark:text-white" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
          />
          <button onClick={handleLogin} className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700">
            Enter
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
          <header className="mb-10">
            <h2 className="text-4xl font-black capitalize text-blue-600 dark:text-blue-400">
              {activeTab === 'ranking' ? 'Leaderboard' : activeTab}
            </h2>
          </header>

          <div className="max-w-6xl mx-auto space-y-8">
            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border-b-4 border-blue-500">
                    <h3 className="text-xl font-bold mb-2">Welcome back, {user.username}!</h3>
                    <p className="text-gray-500 dark:text-gray-400">Your portal is fully synced. Invite friends to compete on the leaderboard!</p>
                  </div>
                  <GoalTracker user={user} />
                </div>
                
                {/* 3-Column Layout for Quiz and Chat */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <QuickQuiz />
                  </div>
                  <div className="lg:col-span-1">
                    <StudyChat user={user} />
                  </div>
                </div>
              </div>
            )}

            {/* CONTENT TABS */}
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
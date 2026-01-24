import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, BookOpen, Timer, Trophy, 
  User, Moon, Sun, ChevronLeft, ChevronRight, 
  Database, Flame, Youtube, ShieldCheck, Keyboard // 🔥 Added Keyboard Icon
} from 'lucide-react';

export default function Sidebar({ user, activeTab, setActiveTab, setIsDarkMode, isDarkMode, isOpen, setIsOpen }) {
  
  // --- 🔥 1. IDENTITY SYNC LOGIC ---
  const getAvatarUrl = (seed, gender) => {
    const style = gender === 'neutral' ? 'bottts' : 'avataaars';
    const params = gender === 'female' ? '&topProbability=100&facialHairProbability=0' : '';
    const finalSeed = seed || user.username;
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${finalSeed}${params}`;
  };

  // --- 2. DYNAMIC MENU CONFIGURATION ---
  const menuItems = [
    { id: 'dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
    { id: 'study', icon: <Youtube />, label: 'Study Hub' }, 
    { id: 'subjects', icon: <BookOpen />, label: 'Resources' },
    
    // 🔥 NEW MODULE ADDED HERE
    { id: 'typing', icon: <Keyboard />, label: 'Neural Typer' },

    { id: 'mocks', icon: <Timer />, label: 'Mock Tests' },
    { id: 'ranking', icon: <Trophy />, label: 'Leaderboard' },
    { id: 'profile', icon: <User />, label: 'Profile' },
  ];

  // 🔥 LOGIC UPDATE: Show Admin Panel for "The Brain" OR "Moderators"
  const isAdmin = user.username?.toLowerCase() === 'thebrain' || user?.is_moderator;

  if (isAdmin) {
    const adminExists = menuItems.find(item => item.id === 'admin');
    if (!adminExists) {
      // Insert Admin Panel right before 'Profile' (which is the last item)
      menuItems.splice(menuItems.length - 1, 0, { id: 'admin', icon: <Database />, label: 'Admin Panel' });
    }
  }

  return (
    <>
      {/* 3. NEON TOGGLE BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`fixed top-6 z-50 p-2.5 rounded-full bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all duration-500 active:scale-90 ${isOpen ? 'left-60' : 'left-6'}`}
      >
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* 4. MAIN SIDEBAR CONTAINER */}
      <motion.div 
        initial={{ x: -260 }}
        animate={{ x: isOpen ? 0 : -260 }}
        transition={{ type: 'spring', damping: 22, stiffness: 120 }}
        className="w-64 bg-white dark:bg-gray-900 h-screen shadow-2xl flex flex-col p-6 fixed z-40 border-r dark:border-gray-800"
      >
        {/* Profile Avatar Section */}
        <div className="flex flex-col items-center mt-12 mb-10">
          <motion.div 
            whileHover={{ rotate: 5, scale: 1.05 }}
            className="w-24 h-24 bg-blue-50 dark:bg-gray-800 flex items-center justify-center mb-4 shadow-lg border-2 border-blue-100 dark:border-blue-900 overflow-hidden relative group" 
            style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}
          >
             <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors animate-pulse" />
             <img 
              src={getAvatarUrl(user.avatar_seed, user.gender)} 
              alt="Identity" 
              className="w-20 h-20 object-contain relative z-10 transition-transform duration-500 group-hover:scale-110" 
            />
          </motion.div>
          
          <div className="text-center">
            <h3 className="font-black text-gray-800 dark:text-white uppercase tracking-tighter text-sm flex items-center justify-center gap-1">
              {user.username}
              {user.total_exams_completed > 15 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <ShieldCheck size={14} className="text-blue-500 fill-blue-500/10" />
                </motion.span>
              )}
            </h3>
            <p className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mt-1">
              {user.education || 'Neural Aspirant'}
            </p>
          </div>
          
          {/* Dynamic Streak Badge (Preserved Animation) */}
          <motion.div 
            animate={user.streak_count > 0 ? { scale: [1, 1.05, 1], boxShadow: ["0 0 0px rgba(249,115,22,0)", "0 0 15px rgba(249,115,22,0.2)", "0 0 0px rgba(249,115,22,0)"] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`mt-3 flex items-center gap-2 px-4 py-1.5 rounded-full border-2 transition-all duration-500 ${
              user.streak_count > 0 
              ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' 
              : 'bg-gray-50 border-gray-100 dark:bg-gray-900/50 dark:border-gray-700'
            }`}
          >
            <Flame size={14} className={`${user.streak_count > 0 ? 'text-orange-500 fill-orange-500' : 'text-gray-300'}`} />
            <span className={`text-[9px] font-black tracking-widest ${user.streak_count > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
              {user.streak_count || 0} DAY STREAK
            </span>
          </motion.div>
        </div>

        {/* 5. NAVIGATION MENU */}
        <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group relative ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 scale-[1.02]' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <span className={`transition-all duration-300 ${activeTab === item.id ? 'text-white' : 'text-blue-500 group-hover:scale-110 group-hover:rotate-6'}`}>
                {React.cloneElement(item.icon, { size: 18, strokeWidth: 2.5 })}
              </span>
              <span className="font-black text-[10px] uppercase tracking-widest leading-none">
                {item.label}
              </span>
              
              {activeTab === item.id && (
                <motion.div 
                  layoutId="activePill"
                  className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                />
              )}
            </button>
          ))}
        </nav>

        {/* 6. NEURAL THEME SWITCHER */}
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="mt-8 flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-[1.5rem] border border-gray-100 dark:border-gray-700 transition-all hover:border-blue-500/30 group"
        >
          <div className="flex items-center gap-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={isDarkMode ? 'dark' : 'light'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isDarkMode ? <Sun size={16} className="text-yellow-500" /> : <Moon size={16} className="text-indigo-500" />}
              </motion.div>
            </AnimatePresence>
            <span className="font-black text-[10px] uppercase tracking-widest text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors">
              {isDarkMode ? 'Solar' : 'Lunar'}
            </span>
          </div>
          <div className={`w-10 h-5 rounded-full relative transition-colors duration-500 ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
            <motion.div 
              animate={{ x: isDarkMode ? 22 : 2 }}
              className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-md" 
            />
          </div>
        </button>
      </motion.div>
    </>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, BookOpen, Timer, Trophy, 
  User, Moon, Sun, ChevronLeft, ChevronRight, Database, Flame
} from 'lucide-react';

export default function Sidebar({ user, activeTab, setActiveTab, setIsDarkMode, isDarkMode, isOpen, setIsOpen }) {
  
  // 1. Menu Items Configuration
  const menuItems = [
    { id: 'dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
    { id: 'subjects', icon: <BookOpen />, label: 'Subjects' },
    { id: 'mocks', icon: <Timer />, label: 'Mock Tests' },
    { id: 'ranking', icon: <Trophy />, label: 'Leaderboard' },
    { id: 'profile', icon: <User />, label: 'Profile' },
  ];

  // Logic: Insert Admin Panel at Index 4 (before Profile) only for The Brain
  if (user.username === 'TheBrain') {
    const adminExists = menuItems.find(item => item.id === 'admin');
    if (!adminExists) {
      menuItems.splice(4, 0, { id: 'admin', icon: <Database />, label: 'Admin Panel' });
    }
  }

  return (
    <>
      {/* 2. NEON TOGGLE BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`fixed top-6 z-50 p-2.5 rounded-full bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all duration-500 active:scale-90 ${isOpen ? 'left-60' : 'left-6'}`}
      >
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* 3. MAIN SIDEBAR CONTAINER */}
      <motion.div 
        initial={{ x: -260 }}
        animate={{ x: isOpen ? 0 : -260 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="w-64 bg-white dark:bg-gray-800 h-screen shadow-2xl flex flex-col p-6 fixed z-40 border-r dark:border-gray-700"
      >
        {/* Profile Avatar Section */}
        <div className="flex flex-col items-center mt-12 mb-10">
          <motion.div 
            whileHover={{ rotate: 5, scale: 1.05 }}
            className="w-20 h-20 bg-blue-50 dark:bg-gray-700 flex items-center justify-center mb-4 shadow-lg border-2 border-blue-100 dark:border-gray-600 overflow-hidden" 
            style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}
          >
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
              alt="avatar" 
              className="w-16 h-16 object-contain" 
            />
          </motion.div>
          <h3 className="font-black text-gray-800 dark:text-white uppercase tracking-tighter text-sm">{user.username}</h3>
          
          {/* Dynamic Streak Badge */}
          <motion.div 
            animate={user.streak_count > 0 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`mt-3 flex items-center gap-2 px-4 py-1.5 rounded-full border-2 transition-all ${
              user.streak_count > 0 
              ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800 shadow-[0_0_10px_rgba(249,115,22,0.2)]' 
              : 'bg-gray-50 border-gray-100 dark:bg-gray-900/50 dark:border-gray-700'
            }`}
          >
            <Flame size={16} className={`${user.streak_count > 0 ? 'text-orange-500 fill-orange-500' : 'text-gray-300'}`} />
            <span className={`text-xs font-black ${user.streak_count > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>
              {user.streak_count || 0} DAY STREAK
            </span>
          </motion.div>
        </div>

        {/* 4. NAVIGATION MENU */}
        <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 group ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 scale-[1.02]' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-700/50 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <span className={`transition-colors duration-300 ${activeTab === item.id ? 'text-white' : 'text-blue-500 group-hover:scale-110'}`}>
                {React.cloneElement(item.icon, { size: 20 })}
              </span>
              <span className="font-black text-xs uppercase tracking-widest leading-none">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* 5. DARK MODE TOGGLE (Redesigned) */}
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="mt-8 flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-[1.5rem] border border-gray-100 dark:border-gray-700 transition-all hover:border-blue-200 dark:hover:border-blue-900 shadow-inner"
        >
          <div className="flex items-center gap-3">
            {isDarkMode ? <Sun size={18} className="text-yellow-500 animate-pulse" /> : <Moon size={18} className="text-indigo-500" />}
            <span className="font-black text-[10px] uppercase tracking-widest text-gray-400">
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
import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, BookOpen, Timer, Trophy, 
  User, Moon, Sun, ChevronLeft, ChevronRight, Database, Flame
} from 'lucide-react';

export default function Sidebar({ user, activeTab, setActiveTab, setIsDarkMode, isDarkMode, isOpen, setIsOpen }) {
  
  // Define all possible menu items
  const menuItems = [
    { id: 'dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
    { id: 'subjects', icon: <BookOpen />, label: 'Subjects' },
    { id: 'mocks', icon: <Timer />, label: 'Mock Tests' },
    { id: 'ranking', icon: <Trophy />, label: 'Leaderboard' },
    { id: 'profile', icon: <User />, label: 'Profile' },
  ];

  // Add Admin Panel ONLY if the user is "TheBrain"
  if (user.username === 'TheBrain') {
    menuItems.splice(4, 0, { id: 'admin', icon: <Database />, label: 'Admin Panel' });
  }

  return (
    <>
      {/* GLOWING NEON TOGGLE BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`fixed top-6 z-50 p-2 rounded-full bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all duration-500 ${isOpen ? 'left-60' : 'left-6'}`}
      >
        {isOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
      </button>

      <motion.div 
        initial={{ x: -260 }}
        animate={{ x: isOpen ? 0 : -260 }}
        className="w-64 bg-white dark:bg-gray-800 h-screen shadow-2xl flex flex-col p-6 fixed z-40 border-r dark:border-gray-700"
      >
        {/* User Profile Section */}
        <div className="flex flex-col items-center mt-12 mb-10">
          <div 
            className="w-20 h-20 bg-blue-50 dark:bg-gray-700 flex items-center justify-center mb-3 shadow-lg" 
            style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}
          >
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
              alt="avatar" 
              className="w-16 h-16" 
            />
          </div>
          <h3 className="font-bold text-gray-700 dark:text-gray-200">{user.username}</h3>
          
          {/* Streak Badge in Sidebar */}
          <div className="mt-2 flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800">
            <Flame size={14} className="text-orange-500 fill-orange-500" />
            <span className="text-xs font-black text-orange-600 dark:text-orange-400">{user.streak_count || 0}</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg scale-[1.02]' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <span className={activeTab === item.id ? 'text-white' : 'text-blue-500'}>
                {item.icon}
              </span>
              <span className="font-bold text-sm tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Dark Mode Toggle */}
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="mt-auto flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            {isDarkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-indigo-500" />}
            <span className="font-bold text-xs uppercase tracking-widest">{isDarkMode ? 'Light' : 'Dark'}</span>
          </div>
          <div className={`w-10 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}`}>
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isDarkMode ? 'right-1' : 'left-1'}`} />
          </div>
        </button>
      </motion.div>
    </>
  );
}
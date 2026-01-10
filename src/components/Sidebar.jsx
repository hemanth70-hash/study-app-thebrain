import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, BookOpen, Timer, Trophy, 
  User, Moon, Sun, ChevronLeft, ChevronRight, Database 
} from 'lucide-react';

export default function Sidebar({ user, activeTab, setActiveTab, setIsDarkMode, isDarkMode, isOpen, setIsOpen }) {
  
  const menuItems = [
    { id: 'dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
    { id: 'subjects', icon: <BookOpen />, label: 'Subjects' },
    { id: 'mocks', icon: <Timer />, label: 'Mock Tests' },
    { id: 'ranking', icon: <Trophy />, label: 'Leaderboard' },
    { id: 'admin', icon: <Database />, label: 'Admin Panel' },
    { id: 'profile', icon: <User />, label: 'Profile' },
  ];

  return (
    <>
      {/* GLOWING NEON TOGGLE BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`fixed top-6 z-50 p-2 rounded-full bg-blue-600 text-white neon-button transition-all duration-500 ${isOpen ? 'left-60' : 'left-6'}`}
      >
        {isOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
      </button>

      <motion.div 
        initial={{ x: -260 }}
        animate={{ x: isOpen ? 0 : -260 }}
        className="w-64 bg-white dark:bg-gray-800 h-screen shadow-2xl flex flex-col p-6 fixed z-40"
      >
        <div className="flex flex-col items-center mt-12 mb-10">
          <div 
            className="w-20 h-20 bg-blue-50 flex items-center justify-center mb-3 shadow-lg" 
            style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}
          >
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt="avatar" className="w-16 h-16" />
          </div>
          <h3 className="font-bold text-gray-700 dark:text-gray-200">{user.username}</h3>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
                activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-blue-50 dark:hover:bg-gray-700'
              }`}
            >
              {item.icon} <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="mt-auto flex items-center gap-4 p-3 border-t dark:border-gray-700 text-gray-500"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          <span>{isDarkMode ? 'Light' : 'Dark'}</span>
        </button>
      </motion.div>
    </>
  );
}
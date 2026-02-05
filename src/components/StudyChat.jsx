import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Send, MessageSquare } from 'lucide-react';

export default function StudyChat({ user, isDarkMode }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef();

  // --- 1. REAL-TIME SYNCHRONIZATION ---
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('public:study_chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'study_chat' }, 
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // --- 2. AUTO-SCROLL LOGIC ---
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('study_chat')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50);
    setMessages(data || []);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { error } = await supabase.from('study_chat').insert([
      { user_name: user.username, message: newMessage }
    ]);
    
    if (!error) setNewMessage('');
  };

  // --- STYLES ---
  const theme = {
    bg: isDarkMode ? 'bg-slate-950' : 'bg-white',
    border: isDarkMode ? 'border-slate-800' : 'border-slate-200',
    text: isDarkMode ? 'text-white' : 'text-slate-900',
    inputBg: isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900',
    subText: isDarkMode ? 'text-slate-500' : 'text-slate-400',
    msgUser: 'bg-blue-600 text-white',
    msgOther: isDarkMode ? 'bg-slate-900 text-slate-200 border border-slate-800' : 'bg-slate-100 text-slate-800 border border-slate-200'
  };

  return (
    // 🔥 FIXED HEIGHT: h-[380px] matches the Calendar Widget exactly
    <div className={`rounded-3xl shadow-xl flex flex-col h-[380px] border-b-4 border-blue-600 overflow-hidden transition-all duration-500 ${theme.bg} ${theme.text}`}>
      
      {/* HEADER */}
      <div className={`p-4 border-b flex items-center gap-2 shrink-0 ${theme.border}`}>
        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
          <MessageSquare size={16} className="text-blue-600" />
        </div>
        <h3 className={`text-xs font-black uppercase tracking-widest ${theme.text}`}>Live Signals</h3>
        <div className="ml-auto flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-[9px] font-bold text-green-500">LIVE</span>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.user_name === user.username ? 'items-end' : 'items-start'}`}>
            <span className="text-[9px] font-black opacity-40 mb-1 px-1 uppercase">{msg.user_name}</span>
            <div className={`px-3 py-2 rounded-2xl max-w-[85%] text-xs font-bold shadow-sm leading-relaxed ${
              msg.user_name === user.username 
              ? `${theme.msgUser} rounded-tr-none` 
              : `${theme.msgOther} rounded-tl-none`
            }`}>
              {msg.message}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* INPUT AREA */}
      <form onSubmit={sendMessage} className={`p-3 border-t flex gap-2 shrink-0 ${theme.bg} ${theme.border}`}>
        <input 
          type="text" 
          className={`flex-1 p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold transition-all ${theme.inputBg}`}
          placeholder="Transmit message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit" className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
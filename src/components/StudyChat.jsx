import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Send, MessageSquare } from 'lucide-react';

export default function StudyChat({ user }) {
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

  return (
    /* 🔥 FIXED HEIGHT: Adjust h-[420px] to match your QuickQuiz card exactly */
    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl flex flex-col h-[420px] border-b-8 border-blue-600 overflow-hidden transition-all">
      
      {/* HEADER: SHRINK-0 prevents title from disappearing */}
      <div className="p-5 border-b dark:border-gray-700 flex items-center gap-3 text-blue-600 shrink-0">
        <MessageSquare size={20} />
        <h3 className="text-xs font-black uppercase tracking-widest">Live Study Chat</h3>
      </div>

      {/* MESSAGES AREA: flex-1 + overflow-y-auto creates the internal scroll */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-gray-50/30 dark:bg-gray-900/10">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.user_name === user.username ? 'items-end' : 'items-start'}`}>
            <span className="text-[10px] font-black text-gray-400 mb-1 px-2 uppercase">{msg.user_name}</span>
            <div className={`p-3 rounded-2xl max-w-[85%] text-xs font-bold shadow-sm leading-relaxed ${
              msg.user_name === user.username 
              ? 'bg-blue-600 text-white rounded-tr-none' 
              : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-tl-none border dark:border-gray-600'
            }`}>
              {msg.message}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* INPUT AREA: FIXED AT BOTTOM */}
      <form onSubmit={sendMessage} className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex gap-2 shrink-0">
        <input 
          type="text" 
          className="flex-1 p-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 dark:bg-gray-900 dark:text-white text-xs font-bold"
          placeholder="Type a signal..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit" className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all active:scale-90">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
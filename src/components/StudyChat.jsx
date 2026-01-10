import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Send, MessageSquare } from 'lucide-react';

export default function StudyChat({ user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef();

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages in real-time
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

    await supabase.from('study_chat').insert([
      { user_name: user.username, message: newMessage }
    ]);
    setNewMessage('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl flex flex-col h-[500px] border-t-8 border-blue-600">
      <div className="p-6 border-b dark:border-gray-700 flex items-center gap-3 text-blue-600 font-black uppercase">
        <MessageSquare size={24} />
        <h3>Live Study Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.user_name === user.username ? 'items-end' : 'items-start'}`}>
            <span className="text-xs font-bold text-gray-400 mb-1">{msg.user_name}</span>
            <div className={`p-3 rounded-2xl max-w-[80%] shadow-sm ${
              msg.user_name === user.username 
              ? 'bg-blue-600 text-white rounded-tr-none' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-tl-none'
            }`}>
              {msg.message}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-3xl flex gap-2">
        <input 
          type="text" 
          className="flex-1 p-3 rounded-xl border-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          placeholder="Discuss a question..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit" className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all">
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
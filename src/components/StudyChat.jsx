import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Send, MessageSquare, Trash2, Paperclip, 
  X, Flame, Image as ImageIcon, FileText, Pin, Smile
} from 'lucide-react';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function StudyChat({ user, isDarkMode }) {
  // --- STATE ---
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineCount, setOnlineCount] = useState(1);
  const [typingUsers, setTypingUsers] = useState({});
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeReactionId, setActiveReactionId] = useState(null);
  
  const scrollRef = useRef();
  const fileInputRef = useRef();
  
  // Derived State
  const pinnedMessage = messages.find(m => m.is_pinned);

  // --- 1. REAL-TIME ENGINE ---
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('public:study_chat')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_chat' }, 
        (payload) => {
          if (payload.eventType === 'INSERT') setMessages(prev => [...prev, payload.new]);
          if (payload.eventType === 'DELETE') setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
          if (payload.eventType === 'UPDATE') setMessages(prev => prev.map(msg => msg.id === payload.new.id ? payload.new : msg));
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        setTypingUsers(prev => ({ ...prev, [payload.user]: Date.now() }));
        setTimeout(() => {
          setTypingUsers(prev => {
            const newState = { ...prev };
            delete newState[payload.user];
            return newState;
          });
        }, 3000);
      })
      .on('presence', { event: 'sync' }, () => {
        setOnlineCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user: user.username, online_at: new Date().toISOString() });
        }
      });

    return () => supabase.removeChannel(channel);
  }, [user.username]);

  // --- 2. AUTO-SCROLL ---
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // --- 3. FETCH HISTORY ---
  const fetchMessages = async () => {
    const { data } = await supabase
      .from('study_chat')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100);
    setMessages(data || []);
  };

  // --- 4. ACTIONS ---
  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !file) || uploading) return;

    let fileData = { url: null, type: null };

    if (file) {
      setUploading(true);
      const fileName = `${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('chat-uploads').upload(fileName, file);
      if (!error) {
        const { data } = supabase.storage.from('chat-uploads').getPublicUrl(fileName);
        fileData = { url: data.publicUrl, type: file.type.startsWith('image/') ? 'image' : 'file' };
      }
      setUploading(false);
      setFile(null);
    }

    await supabase.from('study_chat').insert([{ 
      user_name: user.username, 
      message: newMessage,
      streak_count: user.streak_count || 0,
      file_url: fileData.url,
      file_type: fileData.type
    }]);
    setNewMessage('');
  };

  const deleteMessage = async (id) => {
    if(!window.confirm("Delete this message?")) return;
    await supabase.from('study_chat').delete().eq('id', id);
  };

  // 🔥 PINNING LOGIC
  const togglePin = async (msg) => {
    if (!msg.is_pinned) {
      await supabase.from('study_chat').update({ is_pinned: false }).neq('id', 0);
    }
    await supabase.from('study_chat').update({ is_pinned: !msg.is_pinned }).eq('id', msg.id);
  };

  // 🔥 REACTION LOGIC
  const addReaction = async (msg, emoji) => {
    const currentReactions = msg.reactions || {};
    if (currentReactions[user.username] === emoji) {
      delete currentReactions[user.username];
    } else {
      currentReactions[user.username] = emoji;
    }
    await supabase.from('study_chat').update({ reactions: currentReactions }).eq('id', msg.id);
    setActiveReactionId(null);
  };

  const getReactionSummary = (reactions) => {
    if (!reactions) return null;
    const counts = {};
    Object.values(reactions).forEach(emoji => {
      counts[emoji] = (counts[emoji] || 0) + 1;
    });
    return Object.entries(counts);
  };

  // --- STYLES ---
  const theme = {
    bg: isDarkMode ? 'bg-slate-950' : 'bg-white',
    border: isDarkMode ? 'border-slate-800' : 'border-slate-200',
    text: isDarkMode ? 'text-white' : 'text-slate-900',
    inputBg: isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900',
    msgUser: 'bg-blue-600 text-white',
    msgOther: isDarkMode ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-white text-slate-800 border border-slate-100 shadow-sm'
  };

  return (
    <div className={`rounded-3xl shadow-xl flex flex-col h-[380px] border-b-4 border-blue-600 overflow-hidden transition-all duration-500 relative ${theme.bg} ${theme.text}`}>
      
      {/* HEADER */}
      <div className={`p-3 border-b flex items-center justify-between shrink-0 ${theme.border} z-20 relative bg-inherit`}>
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
            <MessageSquare size={16} className="text-blue-600" />
          </div>
          <div>
            <h3 className={`text-xs font-black uppercase tracking-widest ${theme.text}`}>Live Chat</h3>
            <p className="text-[9px] font-bold text-green-500 flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {onlineCount} Online
            </p>
          </div>
        </div>
      </div>

      {/* PINNED MESSAGE BAR */}
      {pinnedMessage && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-2 flex items-center gap-2 cursor-pointer transition-colors hover:bg-yellow-500/20 z-10" onClick={() => document.getElementById(`msg-${pinnedMessage.id}`)?.scrollIntoView({ behavior: 'smooth' })}>
          <Pin size={12} className="text-yellow-600 fill-yellow-600 rotate-45" />
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-bold text-yellow-600 truncate uppercase">Pinned Message</p>
            <p className={`text-[10px] truncate ${theme.text}`}>{pinnedMessage.message}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); togglePin(pinnedMessage); }} className="text-yellow-600 hover:text-red-500"><X size={12}/></button>
        </div>
      )}

      {/* MESSAGES AREA */}
      {/* 🔥 Increased space-y to accommodate hover menu below messages */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
        {messages.map((msg, i) => {
          const isMe = msg.user_name === user.username;
          const reactions = getReactionSummary(msg.reactions);
          const showPicker = activeReactionId === msg.id;

          return (
            <div id={`msg-${msg.id}`} key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative mb-2`}>
              
              {/* User Info */}
              <div className="flex items-center gap-1 mb-1 px-1">
                <span className="text-[10px] font-black opacity-50 uppercase">{msg.user_name}</span>
                {msg.streak_count > 0 && (
                  <span className="flex items-center text-[9px] font-bold text-orange-500 bg-orange-100 dark:bg-orange-900/20 px-1 rounded">
                    <Flame size={8} className="fill-orange-500" /> {msg.streak_count}
                  </span>
                )}
              </div>

              {/* Bubble */}
              <div className={`relative px-4 py-2 rounded-2xl max-w-[85%] text-xs font-bold shadow-sm leading-relaxed ${isMe ? `${theme.msgUser} rounded-tr-none` : `${theme.msgOther} rounded-tl-none`}`}>
                {msg.message}
                {msg.file_url && (
                  <div className="mt-2">
                    {msg.file_type === 'image' ? (
                      <a href={msg.file_url} target="_blank" rel="noreferrer"><img src={msg.file_url} alt="Shared" className="rounded-lg max-h-32 border border-white/20" /></a>
                    ) : (
                      <a href={msg.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-black/20 rounded-lg"><FileText size={16} /> Download File</a>
                    )}
                  </div>
                )}

                {/* Reactions Display */}
                {reactions && reactions.length > 0 && (
                  <div className={`absolute -bottom-3 ${isMe ? 'right-0' : 'left-0'} flex gap-1`}>
                    {reactions.map(([emoji, count]) => (
                      <div key={emoji} className="bg-white dark:bg-slate-800 shadow-md border border-gray-200 dark:border-slate-700 px-1.5 rounded-full text-[9px] flex items-center gap-0.5">
                        <span>{emoji}</span>
                        {count > 1 && <span className="font-black text-slate-500">{count}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 🛠 ACTIONS MENU (Hover - Now positioned BELOW) */}
              <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all absolute -bottom-9 ${isMe ? 'right-0' : 'left-0'} z-10 p-1 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-sm border ${theme.border}`}>
                
                {/* Reaction Picker Trigger */}
                <div className="relative">
                  <button onClick={() => setActiveReactionId(showPicker ? null : msg.id)} className="p-1.5 hover:bg-black/5 rounded-full text-slate-400 hover:text-blue-500 transition-colors">
                    <Smile size={14} />
                  </button>
                  
                  {/* 😍 EMOJI PICKER POPUP (Positioned above menu) */}
                  {showPicker && (
                    <div className="absolute bottom-full mb-1 left-0 bg-white dark:bg-slate-800 shadow-xl border dark:border-slate-700 rounded-full p-1.5 flex gap-1 z-50 animate-in zoom-in-95 duration-200 whitespace-nowrap">
                      {REACTION_EMOJIS.map(emoji => (
                        <button 
                          key={emoji} 
                          onClick={() => addReaction(msg, emoji)}
                          className={`p-1.5 rounded-full hover:bg-black/5 hover:scale-125 transition-transform text-lg leading-none ${msg.reactions?.[user.username] === emoji ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pin Button */}
                <button onClick={() => togglePin(msg)} className={`p-1.5 hover:bg-black/5 rounded-full transition-colors ${msg.is_pinned ? 'text-yellow-500 fill-yellow-500' : 'text-slate-400 hover:text-yellow-500'}`}>
                  <Pin size={14} />
                </button>

                {/* Delete (Only for me) */}
                {isMe && (
                  <button onClick={() => deleteMessage(msg.id)} className="p-1.5 hover:bg-black/5 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

            </div>
          );
        })}
        
        {Object.keys(typingUsers).length > 0 && (
          <div className="text-[9px] font-bold text-gray-400 animate-pulse pl-2">
            {Object.keys(typingUsers).join(', ')} is typing...
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* INPUT AREA */}
      <form onSubmit={sendMessage} className={`p-3 border-t flex flex-col gap-2 shrink-0 ${theme.bg} ${theme.border}`}>
        {file && (
          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-xs">
            <span className="truncate max-w-[200px] flex items-center gap-2 text-blue-600">
              {file.type.startsWith('image/') ? <ImageIcon size={14} /> : <FileText size={14} />} {file.name}
            </span>
            <button type="button" onClick={() => setFile(null)} className="text-gray-500 hover:text-red-500"><X size={14}/></button>
          </div>
        )}

        <div className="flex gap-2">
          <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}>
            <Paperclip size={16} />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setFile(e.target.files[0])} />

          <input 
            type="text" 
            className={`flex-1 p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold transition-all ${theme.inputBg}`}
            placeholder={uploading ? "Uploading..." : "Transmit message..."}
            value={newMessage}
            disabled={uploading}
            onChange={(e) => {
              setNewMessage(e.target.value);
              supabase.channel('public:study_chat').send({ type: 'broadcast', event: 'typing', payload: { user: user.username } });
            }}
          />
          
          <button type="submit" disabled={uploading || (!newMessage.trim() && !file)} className={`p-2.5 rounded-xl text-white transition-all active:scale-95 shadow-lg ${uploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'}`}>
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
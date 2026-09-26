import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Youtube, PenTool, Save, Trash2, FileDown, 
  Loader2, PlayCircle, Search, Filter, SkipForward,
  ChevronLeft, ChevronRight, BookOpen, Maximize, Minimize, Clock,
  MessageCircle, GripHorizontal, Send, Reply, Edit2, Pin, X, Users
} from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function StudyHub({ user, isDarkMode }) {
  // --- CORE STATES ---
  const [query, setQuery] = useState("");
  const [videoId, setVideoId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  // Custom Username State
  const [myUsername, setMyUsername] = useState("Student");

  // --- LAYOUT STATES ---
  const [showActiveNotes, setShowActiveNotes] = useState(false);
  const [showSavedNotes, setShowSavedNotes] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const workspaceRef = useRef(null);

  // --- SEARCH STATES ---
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ language: '', duration: 'any' });
  const [searchResults, setSearchResults] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedNotesList, setSavedNotesList] = useState([]);

  // --- MULTIPLAYER CHAT & PRESENCE STATES ---
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  // Draggable Chat State
  const [chatPos, setChatPos] = useState({ x: window.innerWidth - 450, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const chatEndRef = useRef(null);

  // --- 1. DATA & PRESENCE INITIALIZATION ---
  useEffect(() => {
    let isMounted = true;
    
    fetchSavedNotes();
    fetchChatHistory();

    const initializeProfileAndPresence = async () => {
      // 1. Fetch exact username from the database
      let resolvedUsername = user.user_metadata?.username || user.email?.split('@')[0] || "Student";
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .maybeSingle();
          
        if (data && data.username) {
          resolvedUsername = data.username;
        }
      } catch (err) {
        console.error("Failed to fetch profile username:", err);
      }

      if (isMounted) setMyUsername(resolvedUsername);

      // 2. Setup Presence with the confirmed username
      const presenceChannel = supabase.channel('study_hub_presence');
      
      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          const users = Object.values(state).flat();
          
          // Remove duplicates and FILTER OUT 'admin'
          const uniqueUsers = Array.from(new Map(users.map(u => [u.user_id, u])).values())
            .filter(u => u.username && u.username.toLowerCase() !== 'admin');
            
          setOnlineUsers(uniqueUsers);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({
              user_id: user.id,
              username: resolvedUsername,
              current_video: ""
            });
          }
        });
    };

    initializeProfileAndPresence();

    // 3. Subscribe to Global Chat
    const chatSub = supabase
      .channel('public:study_hub_chat')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_hub_chat' }, payload => {
        if (payload.eventType === 'INSERT') {
          setMessages(prev => [...prev, payload.new]);
          setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } else if (payload.eventType === 'UPDATE') {
          setMessages(prev => prev.map(msg => msg.id === payload.new.id ? payload.new : msg));
        } else if (payload.eventType === 'DELETE') {
          setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(chatSub);
      const presenceChannel = supabase.getChannels().find(c => c.topic === 'realtime:study_hub_presence');
      if(presenceChannel) supabase.removeChannel(presenceChannel);
    };
  }, [user.id]);

  // Update presence whenever the video or username changes
  useEffect(() => {
    const presenceChannel = supabase.getChannels().find(c => c.topic === 'realtime:study_hub_presence');
    if (presenceChannel && myUsername) {
      presenceChannel.track({
        user_id: user.id,
        username: myUsername,
        current_video: videoId
      });
    }
  }, [videoId, myUsername, user.id]);

  const fetchSavedNotes = async () => {
    const { data } = await supabase.from('video_notes').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
    if (data) setSavedNotesList(data);
  };

  const fetchChatHistory = async () => {
    const { data } = await supabase.from('study_hub_chat').select('*').order('created_at', { ascending: true }).limit(50);
    if (data) {
      setMessages(data);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 500);
    }
  };

  const loadNoteForVideo = async (targetVideoId) => {
    const { data } = await supabase.from('video_notes').select('note_content, updated_at').eq('user_id', user.id).eq('video_id', targetVideoId).maybeSingle();
    if (data) {
      setNote(data.note_content);
      setLastSaved(new Date(data.updated_at).toLocaleTimeString());
    } else {
      setNote(""); setLastSaved(null);
    }
  };

  // --- 2. MULTIPLAYER CHAT FUNCTIONS ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (editingMsg) {
      await supabase.from('study_hub_chat').update({ content: newMessage, is_edited: true }).eq('id', editingMsg.id);
      setEditingMsg(null);
    } else {
      await supabase.from('study_hub_chat').insert([{
        user_id: user.id,
        username: myUsername, // Uses the fetched profile username
        content: newMessage,
        watching_video_id: videoId,
        reply_to: replyingTo?.id || null
      }]);
    }
    setNewMessage("");
    setReplyingTo(null);
  };

  const deleteMessage = async (msgId) => {
    if(window.confirm("Delete this message?")) {
      await supabase.from('study_hub_chat').delete().eq('id', msgId);
    }
  };

  const togglePin = async (msg) => {
    await supabase.from('study_hub_chat').update({ is_pinned: !msg.is_pinned }).eq('id', msg.id);
  };

  // --- 3. VIDEO SEARCH & SYNC ---
  const visitUserSpace = async (targetVideoId) => {
    if(!targetVideoId) return alert("This user isn't watching a video right now.");
    setVideoId(targetVideoId);
    setQuery(`https://youtube.com/watch?v=${targetVideoId}`);
    await loadNoteForVideo(targetVideoId);
    if (!document.fullscreenElement) {
        workspaceRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const performSearch = async (searchQuery, activeFilters) => {
    setIsSearching(true);
    try {
      const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || 'YOUR_YOUTUBE_API_KEY';
      let finalQuery = searchQuery;
      if (activeFilters.language) {
        const langMap = { en: 'in English', te: 'in Telugu', hi: 'in Hindi' };
        if (langMap[activeFilters.language]) finalQuery = `${searchQuery} ${langMap[activeFilters.language]}`;
      }
      let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(finalQuery)}&type=video&maxResults=15&key=${API_KEY}`;
      if (activeFilters.language) searchUrl += `&relevanceLanguage=${activeFilters.language}`;
      if (activeFilters.duration !== 'any') searchUrl += `&videoDuration=${activeFilters.duration}`;

      const res = await fetch(searchUrl);
      const data = await res.json();

      if (data.items && data.items.length > 0) {
        const ids = data.items.map(item => item.id.videoId);
        setSearchResults(ids);
        setCurrentIndex(0);
        setVideoId(ids[0]);
        await loadNoteForVideo(ids[0]);
        setQuery(`https://youtube.com/watch?v=${ids[0]}`); 
      } else {
        alert("No videos found. Try different keywords.");
      }
    } catch (err) {
      console.error(err); alert("Search failed. Ensure your YouTube API key is valid.");
    } finally { setIsSearching(false); }
  };

  const handleSearchOrLoad = async () => {
    if (!query.trim()) return;
    const isUrl = query.includes('youtube.com') || query.includes('youtu.be');
    if (isUrl) {
      const id = query.split('v=')[1]?.split('&')[0] || query.split('/').pop();
      if (!id) return;
      setVideoId(id);
      setSearchResults([id]);
      setCurrentIndex(0);
      await loadNoteForVideo(id);
    } else {
      await performSearch(query, filters);
    }
  };

  const loadNextVideo = async () => {
    if (currentIndex < searchResults.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const nextId = searchResults[nextIdx];
      setVideoId(nextId);
      setQuery(`https://youtube.com/watch?v=${nextId}`);
      await loadNoteForVideo(nextId);
    }
  };

  // --- 4. CRUD FOR NOTES ---
  const saveNotes = async () => {
    if (!videoId) return alert("Load a video first.");
    setSaving(true);
    const { error } = await supabase.from('video_notes').upsert({ 
        user_id: user.id, video_id: videoId, note_content: note, updated_at: new Date() 
      }, { onConflict: 'user_id, video_id' });
    if (!error) {
      setLastSaved(new Date().toLocaleTimeString());
      fetchSavedNotes();
    }
    setSaving(false);
  };

  const exportPDF = (content, id) => {
    if (!content) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.text(`Study Notes - Video ID: ${id}`, 10, 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(doc.splitTextToSize(content, 180), 10, 20);
    doc.save(`Study_Notes_${id}.pdf`);
  };

  const deleteNote = async (targetId) => {
    if (!window.confirm("Delete these notes permanently?")) return;
    const { error } = await supabase.from('video_notes').delete().eq('user_id', user.id).eq('video_id', targetId);
    if (!error) {
      if (targetId === videoId) { setNote(""); setLastSaved(null); }
      fetchSavedNotes();
    }
  };

  // --- DRAG EVENT HANDLERS ---
  const handleDragStart = (e) => {
    setIsDragging(true);
    dragOffset.current = { x: e.clientX - chatPos.x, y: e.clientY - chatPos.y };
  };
  const handleDragMove = (e) => {
    if (!isDragging) return;
    setChatPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
  };
  const handleDragEnd = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
    } else {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging]);

  // --- THEME ---
  const theme = {
    bg: isDarkMode ? 'bg-slate-900' : 'bg-white',
    border: isDarkMode ? 'border-slate-700' : 'border-gray-200',
    text: isDarkMode ? 'text-white' : 'text-slate-900',
    subText: isDarkMode ? 'text-slate-400' : 'text-gray-500',
    inputBg: isDarkMode ? 'bg-slate-950' : 'bg-gray-50',
    panelBg: isDarkMode ? 'bg-slate-800' : 'bg-slate-50',
    chatBg: isDarkMode ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-gray-300',
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700 relative">
      
      {/* HEADER & SEARCH BAR */}
      <div className={`p-6 rounded-[2.5rem] shadow-xl flex flex-col gap-4 border transition-colors duration-500 ${theme.bg} ${theme.border}`}>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 relative min-w-[300px]">
            <input 
              className={`w-full p-4 pl-12 pr-12 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-red-500 transition-all ${theme.inputBg} ${theme.text}`}
              placeholder="Search topics (e.g. SSC CGL Reasoning) or paste a link..." 
              value={query} 
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearchOrLoad()}
            />
            <Search className={`absolute left-4 top-4 ${theme.subText}`} size={20} />
            <button onClick={() => setShowFilters(!showFilters)} className={`absolute right-4 top-4 transition-colors ${showFilters ? 'text-red-500' : theme.subText}`}>
              <Filter size={20} />
            </button>
          </div>
          <button onClick={handleSearchOrLoad} disabled={isSearching} className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 shadow-lg active:scale-95 transition-all flex items-center gap-2">
            {isSearching ? <Loader2 className="animate-spin" size={16} /> : <Youtube size={16} />}
            {isSearching ? 'Searching...' : 'Load Lecture'}
          </button>
        </div>
      </div>

      {/* DYNAMIC WORKSPACE (THEATER / FULLSCREEN CONTAINER) */}
      <div ref={workspaceRef} className={`flex bg-black shadow-2xl relative border-4 overflow-hidden transition-all duration-300 ${isFullscreen ? 'w-screen h-screen fixed inset-0 z-50 border-0 rounded-none' : `h-[700px] rounded-[3rem] ${theme.border}`}`}>
        
        {/* LEFT PANEL: SAVED NOTES HISTORY */}
        <div className={`flex flex-col overflow-hidden transition-[max-width] duration-500 ease-in-out border-r ${showSavedNotes ? `max-w-md border-zinc-800 ${theme.panelBg}` : 'max-w-0 border-transparent'}`}>
          <div className="w-80 h-full flex flex-col shrink-0">
            <div className="p-6 border-b border-zinc-700/50 flex items-center gap-3 text-emerald-500">
              <BookOpen size={20} />
              <h3 className="font-black uppercase text-xs tracking-widest">Saved Notes</h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
              {savedNotesList.length === 0 ? (
                <p className={`text-center text-xs font-bold py-10 ${theme.subText}`}>No saved notes yet.</p>
              ) : (
                savedNotesList.map(item => (
                  <div key={item.video_id} className={`p-4 rounded-2xl border flex flex-col gap-3 group ${theme.bg} ${theme.border}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2 text-xs font-black uppercase text-zinc-500">
                        <Youtube size={14} className="text-red-500"/> {item.video_id}
                      </div>
                      <span className="text-[9px] font-bold opacity-50 flex items-center gap-1"><Clock size={10}/> {new Date(item.updated_at).toLocaleDateString()}</span>
                    </div>
                    <p className={`text-sm font-medium line-clamp-3 ${theme.text}`}>{item.note_content || "Empty note..."}</p>
                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                      <button onClick={() => exportPDF(item.note_content, item.video_id)} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:scale-105"><FileDown size={14}/></button>
                      <button onClick={() => { visitUserSpace(item.video_id); setShowSavedNotes(false); setShowActiveNotes(true); }} className="px-3 py-2 bg-emerald-100 text-emerald-600 rounded-lg text-xs font-bold uppercase tracking-widest hover:scale-105">Load</button>
                      <button onClick={() => deleteNote(item.video_id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:scale-105"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* CENTER PANEL: VIDEO PLAYER */}
        <div className="flex-1 relative bg-black flex flex-col justify-center min-w-[300px] transition-all duration-500">
          
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <button onClick={() => { if(!showChat) setChatPos({ x: window.innerWidth/2, y: 100 }); setShowChat(!showChat); }} className={`p-3 backdrop-blur-md rounded-xl transition-all shadow-lg text-white ${showChat ? 'bg-blue-600' : 'bg-black/50 hover:bg-blue-600'}`}>
              <MessageCircle size={18} />
            </button>
            <button onClick={() => {
              if (!document.fullscreenElement) {
                workspaceRef.current?.requestFullscreen();
              } else {
                document.exitFullscreen();
              }
            }} className="p-3 bg-black/50 hover:bg-red-600 text-white backdrop-blur-md rounded-xl transition-all shadow-lg">
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>

          <button onClick={() => setShowSavedNotes(!showSavedNotes)} className="absolute left-0 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-emerald-600 text-white p-2 rounded-r-xl backdrop-blur-md transition-all shadow-lg flex flex-col items-center gap-2">
            {showSavedNotes ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            {!showSavedNotes && <BookOpen size={14} className="opacity-70" />}
          </button>

          <button onClick={() => setShowActiveNotes(!showActiveNotes)} className="absolute right-0 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-blue-600 text-white p-2 rounded-l-xl backdrop-blur-md transition-all shadow-lg flex flex-col items-center gap-2">
            {showActiveNotes ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!showActiveNotes && <PenTool size={14} className="opacity-70" />}
          </button>

          {videoId ? (
            <>
              <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`} title="Player" frameBorder="0" allowFullScreen></iframe>
              {searchResults.length > 1 && (
                <div className="h-14 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between px-6 shrink-0 absolute bottom-0 left-0 right-0 z-40">
                  <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Result {currentIndex + 1} of {searchResults.length}</span>
                  <button onClick={loadNextVideo} disabled={currentIndex >= searchResults.length - 1} className="flex items-center gap-2 text-white bg-zinc-800 hover:bg-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-30 disabled:hover:bg-zinc-800">
                    Next Result <SkipForward size={12} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-600 gap-4">
               <PlayCircle size={80} className="opacity-20 animate-pulse" />
               <p className="font-black uppercase text-xs tracking-[0.3em]">Mr. Max's Theater</p>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: ACTIVE NOTEPAD */}
        <div className={`flex flex-col overflow-hidden transition-[max-width] duration-500 ease-in-out border-l ${showActiveNotes ? `max-w-lg border-zinc-800 ${theme.panelBg}` : 'max-w-0 border-transparent'}`}>
           <div className="w-96 h-full flex flex-col shrink-0">
             <div className="p-6 border-b border-zinc-700/50 flex justify-between items-center">
                <div className="flex items-center gap-2 text-blue-500">
                  <PenTool size={20} />
                  <h3 className="font-black uppercase text-xs tracking-widest">Active Notes</h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => exportPDF(note, videoId)} title="Export PDF" className={`p-2 transition-colors hover:text-blue-500 ${theme.subText}`}><FileDown size={18}/></button>
                  <button onClick={() => deleteNote(videoId)} title="Delete Notes" className={`p-2 transition-colors hover:text-red-500 ${theme.subText}`}><Trash2 size={18}/></button>
                  <button onClick={saveNotes} disabled={saving} className="p-2 text-green-500 hover:scale-110 transition-all">
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  </button>
                </div>
             </div>
             <div className="flex-1 relative">
               <textarea 
                 className={`w-full h-full p-8 bg-transparent outline-none font-medium text-sm leading-relaxed resize-none custom-scrollbar ${theme.text}`}
                 placeholder="Jot down formulas, concepts, or timestamps here..."
                 value={note}
                 onChange={e => setNote(e.target.value)}
               />
               {lastSaved && (
                 <div className={`absolute bottom-4 right-6 text-[8px] font-black text-green-500 uppercase px-2 py-1 rounded ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
                   Synced at {lastSaved}
                 </div>
               )}
             </div>
           </div>
        </div>

        {/* --- FLOATING DRAGGABLE LIVE CHAT WIDGET --- */}
        {showChat && (
          <div 
            className={`fixed flex flex-col z-[100] w-80 h-[500px] shadow-2xl rounded-2xl border backdrop-blur-xl overflow-hidden ${theme.chatBg}`}
            style={{ left: `${chatPos.x}px`, top: `${chatPos.y}px` }}
          >
            {/* Chat Header (Draggable) */}
            <div 
              onMouseDown={handleDragStart} 
              className={`p-4 border-b flex justify-between items-center cursor-move ${isDarkMode ? 'border-slate-700 bg-slate-800/80' : 'border-gray-200 bg-gray-50/80'}`}
            >
              <div className="flex items-center gap-2">
                <GripHorizontal size={16} className={theme.subText} />
                <h3 className={`font-black uppercase text-xs tracking-widest ${theme.text}`}>Study Lounge</h3>
              </div>
              <button onClick={() => setShowChat(false)} className={`${theme.subText} hover:text-red-500 transition-colors`}>
                <X size={16} />
              </button>
            </div>

            {/* Live Users Strip */}
            <div className={`p-3 border-b flex gap-3 overflow-x-auto custom-scrollbar ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center gap-2 shrink-0">
                <Users size={14} className="text-emerald-500" />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${theme.text}`}>
                  Live ({onlineUsers.length}):
                </span>
              </div>
              {onlineUsers.map((ou, i) => (
                <button 
                  key={i} 
                  onClick={() => visitUserSpace(ou.current_video)}
                  title={`Watch with ${ou.username}`}
                  className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-colors shrink-0"
                >
                  <PlayCircle size={10} /> {ou.username}
                </button>
              ))}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
              
              {messages.filter(m => m.is_pinned).map(pinned => (
                <div key={`pinned-${pinned.id}`} className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl mb-2 flex items-start gap-2">
                  <Pin size={12} className="text-orange-500 shrink-0 mt-1" />
                  <div>
                    <span className="text-[10px] font-black uppercase text-orange-500 block mb-1">Pinned by {pinned.username}</span>
                    <p className={`text-xs font-medium ${theme.text}`}>{pinned.content}</p>
                  </div>
                </div>
              ))}

              {messages.map(msg => (
                <div key={msg.id} className="group relative flex flex-col gap-1">
                  
                  {msg.reply_to && messages.find(m => m.id === msg.reply_to) && (
                    <div className="flex items-center gap-1 text-[10px] font-bold opacity-50 ml-2">
                      <Reply size={10} /> 
                      Replying to {messages.find(m => m.id === msg.reply_to).username}
                    </div>
                  )}

                  <div className={`flex flex-col ${msg.user_id === user.id ? 'items-end' : 'items-start'}`}>
                    <span className={`text-[9px] font-black uppercase tracking-widest mb-1 opacity-50 px-1`}>
                      {msg.username} {msg.is_edited && '(Edited)'}
                    </span>
                    <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${msg.user_id === user.id ? 'bg-blue-600 text-white rounded-tr-sm' : isDarkMode ? 'bg-slate-700 text-white rounded-tl-sm' : 'bg-gray-100 text-slate-900 rounded-tl-sm'}`}>
                      {msg.content}
                    </div>
                  </div>

                  {/* Hover Actions */}
                  <div className={`absolute top-4 ${msg.user_id === user.id ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'} opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}>
                    <button onClick={() => setReplyingTo(msg)} className="p-1.5 bg-zinc-800 text-zinc-300 rounded hover:text-white shadow"><Reply size={12}/></button>
                    <button onClick={() => togglePin(msg)} className={`p-1.5 bg-zinc-800 rounded hover:text-white shadow ${msg.is_pinned ? 'text-orange-500' : 'text-zinc-300'}`}><Pin size={12}/></button>
                    {msg.user_id === user.id && (
                      <>
                        <button onClick={() => { setEditingMsg(msg); setNewMessage(msg.content); }} className="p-1.5 bg-zinc-800 text-zinc-300 rounded hover:text-white shadow"><Edit2 size={12}/></button>
                        <button onClick={() => deleteMessage(msg.id)} className="p-1.5 bg-zinc-800 text-zinc-300 rounded hover:text-red-500 shadow"><Trash2 size={12}/></button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className={`p-3 border-t ${isDarkMode ? 'border-slate-700 bg-slate-800/80' : 'border-gray-200 bg-gray-50/80'}`}>
              {(replyingTo || editingMsg) && (
                <div className="flex justify-between items-center mb-2 px-2 border-l-2 border-blue-500 bg-blue-500/10 rounded-r py-1">
                  <span className="text-[10px] font-bold text-blue-500 truncate">
                    {editingMsg ? "Editing Message..." : `Replying to ${replyingTo.username}`}
                  </span>
                  <button onClick={() => { setReplyingTo(null); setEditingMsg(null); setNewMessage(""); }} className="text-blue-500 hover:text-red-500"><X size={12}/></button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                <textarea 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                  placeholder="Type a message or paste a timestamp..."
                  className={`flex-1 p-3 rounded-xl outline-none text-xs resize-none h-10 max-h-24 custom-scrollbar transition-colors ${theme.inputBg} ${theme.text}`}
                />
                <button type="submit" disabled={!newMessage.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-3 rounded-xl transition-colors">
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
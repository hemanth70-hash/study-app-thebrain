import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
  UploadCloud, History, Megaphone, Trash2, 
  Zap, ShieldAlert, Key, UserPlus, 
  Clock, MessageSquare, X, BookOpen, ListFilter, Database, ShieldCheck, Lock
} from 'lucide-react';

export default function AdminPanel({ user, isDarkMode }) {
  // --- 0. PERMISSION CHECK ---
  const isRoot = user?.username?.toLowerCase() === 'thebrain';
  const isModerator = user?.is_moderator || isRoot;
  const canUploadDaily = isRoot || user?.is_elite_mod; 

  // --- 1. MOCK UPLOAD STATE ---
  const [bulkData, setBulkData] = useState('');
  const [mockTitle, setMockTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(10); 
  const [isDailyQuickMock, setIsDailyQuickMock] = useState(false);
  const [isStrict, setIsStrict] = useState(false); 
  const [status, setStatus] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const [regularMocks, setRegularMocks] = useState([]);
  const [dailyMocks, setDailyMocks] = useState([]); 

  // --- 2. SYSTEM STATE ---
  const [activeKeys, setActiveKeys] = useState([]); 
  const [userRequests, setUserRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]); 
  const [loading, setLoading] = useState(true);

  // --- 3. LIBRARY MANAGER STATE ---
  const [bookTitle, setBookTitle] = useState('');
  const [bookUrl, setBookUrl] = useState('');
  const [bookCategory, setBookCategory] = useState('Computer Science'); 

  const librarySubjects = [
    "Computer Science", "Reasoning", "Aptitude", 
    "General Awareness", "Maths", "Physics", 
    "Chemistry", "English"
  ];

  // --- 4. DEV LOGS & BROADCAST ---
  const [verName, setVerName] = useState('');
  const [verDesc, setVerDesc] = useState('');
  const [history, setHistory] = useState([]); 
  const [announcement, setAnnouncement] = useState('');

  // --- 5. ATOMIC DATA FETCH ---
  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      // 🔥 REMOVED .order() to fix the 400 Bad Request error
      const [reg, dai, profs] = await Promise.all([
        supabase.from('mocks').select('*'),
        supabase.from('daily_mocks').select('*'),
        supabase.from('profiles').select('*'), 
      ]);

      setRegularMocks(reg.data || []);
      setDailyMocks(dai.data || []);
      
      // Filter out 'TheBrain' (Keep existing logic)
      const civilianNodes = (profs.data || []).filter(u => u.username?.toLowerCase() !== 'thebrain');
      setAllUsers(civilianNodes);

      let keyQuery = supabase.from('invite_codes').select('*');
      if (!isRoot) {
        keyQuery = keyQuery.eq('created_by', user.id);
      }
      
      const { data: keyData } = await keyQuery;
      setActiveKeys(keyData || []);

      if (isRoot) {
        const [logs, reqs] = await Promise.all([
          supabase.from('dev_logs').select('*'),
          supabase.from('admin_requests').select('*'),
        ]);
        setHistory(logs.data || []);
        setUserRequests(reqs.data || []);
      }
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }, [isRoot, user.id]);

  useEffect(() => { fetchAdminData(); }, [fetchAdminData]);

  // --- 6. ACTION HANDLERS ---
  const handlePublish = async () => {
    if (isPublishing || !mockTitle || !bulkData) return;
    
    // 🔥 PERMISSION LOCK: Daily Mocks
    if (isDailyQuickMock && !canUploadDaily) {
        alert("ACCESS DENIED: Daily Streak upload requires Elite Clearance.");
        return;
    }

    setIsPublishing(true);
    setStatus('⏳ Validating Node...');

    try {
      const parsedQuestions = JSON.parse(bulkData);
      const targetTable = isDailyQuickMock ? 'daily_mocks' : 'mocks';
      const today = new Date().toISOString().split('T')[0];

      const payload = {
        mock_title: mockTitle,
        questions: parsedQuestions,
        is_strict: isStrict,
        time_limit: parseInt(timeLimit) || 10,
        ...(isDailyQuickMock && { is_daily: true, mock_date: today })
      };

      const { error } = await supabase.from(targetTable).insert([payload]);
      if (error) throw error;

      setStatus(`🎉 Node Published to ${targetTable}`);
      setBulkData(''); setMockTitle('');
      fetchAdminData();
    } catch (err) {
      setStatus(`❌ Error: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const deleteMock = async (id, table) => {
    if (!window.confirm("Confirm deletion?")) return;
    try {
      await supabase.from('scores').delete().eq('mock_id', id);
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      fetchAdminData();
    } catch (err) {
      alert(`Purge Error: ${err.message}`);
    }
  };

  const generateInvite = async () => {
    try {
      const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newCode = `NEURAL-${suffix}`;
      const { error } = await supabase.from('invite_codes').insert([{ 
        code: newCode, 
        created_by: user.id 
      }]);
      if (error) throw error;
      fetchAdminData();
    } catch (err) {
      alert(`Generation Failed: ${err.message}`);
    }
  };

  const deleteInvite = async (id) => {
    await supabase.from('invite_codes').delete().eq('id', id);
    fetchAdminData();
  };

  const uploadResource = async () => {
    if (!bookTitle || !bookUrl) return alert("Data missing.");
    const { error } = await supabase.from('study_materials').insert([
      { title: bookTitle, url: bookUrl, subject: bookCategory, type: 'pdf' }
    ]);
    if (error) alert(`Upload Error: ${error.message}`);
    else {
      setBookTitle(''); setBookUrl(''); 
      alert("Knowledge Synced to Library.");
    }
  };

  // 🔥 EXTENDED PERMISSION SYSTEM (3 TIERS)
  const setPermission = async (userId, level) => {
    if (!isRoot) return;
    
    // 0: Student | 1: Mod | 2: Elite
    const updates = { 
      is_moderator: level >= 1, 
      is_elite_mod: level === 2 
    };

    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (!error) fetchAdminData();
  };

  const postAnnouncement = async () => {
    if (!announcement) return;
    await supabase.from('announcements').update({ active: false }).neq('id', 0); 
    await supabase.from('announcements').insert([{ message: announcement, active: true }]);
    setAnnouncement(''); fetchAdminData(); alert("Broadcast Live.");
  };

  const saveLog = async () => {
    if (!verName || !verDesc) return;
    await supabase.from('dev_logs').insert([{ version_name: verName, description: verDesc }]);
    setVerName(''); setVerDesc(''); fetchAdminData();
  };

  if (loading && allUsers.length === 0 && !isRoot) return <div className="p-20 text-center animate-pulse font-black text-blue-600 uppercase">Connecting Grid...</div>;
  if (!isModerator) return <div className="p-20 text-center font-black text-red-500 uppercase tracking-widest">Access Denied</div>;

  const theme = {
    bg: isDarkMode ? 'bg-slate-900' : 'bg-white',
    text: isDarkMode ? 'text-white' : 'text-slate-900',
    border: isDarkMode ? 'border-slate-800' : 'border-slate-200',
    input: isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'
  };

  // Helper for date matching
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto p-4 animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-2xl text-white shadow-lg ${isRoot ? 'bg-red-600' : 'bg-blue-600'}`}>
          {isRoot ? <ShieldCheck size={24} /> : <Database size={24} />}
        </div>
        <div>
          <h2 className={`text-3xl font-black uppercase tracking-tighter ${theme.text}`}>
            {isRoot ? 'Central Command' : 'Moderator Panel'}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {isRoot ? 'System Root Access' : `Moderator: ${user.username}`}
          </p>
        </div>
      </div>

      {/* --- MOCK & TOOLS SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        
        {/* LEFT: MOCK CREATOR */}
        <div className={`p-8 rounded-[32px] shadow-xl border transition-colors ${theme.bg} ${theme.border}`}>
          <div className="flex items-center gap-3 mb-6 text-blue-600"><UploadCloud size={32} /><h2 className={`text-2xl font-black uppercase ${theme.text}`}>Mock Creator</h2></div>
          <div className="space-y-4">
            <input className={`w-full p-4 rounded-2xl border font-bold outline-none ${theme.input} ${theme.border}`} placeholder="Title" value={mockTitle} onChange={e => setMockTitle(e.target.value)} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="relative">
                 <input type="number" className={`w-full p-4 rounded-2xl border font-black outline-none ${theme.input} ${theme.border}`} value={timeLimit} onChange={e => setTimeLimit(e.target.value)} placeholder="Mins" />
                 <Clock size={16} className="absolute right-4 top-5 text-slate-400" />
               </div>
               
               {/* 🔥 LOCKED DAILY TOGGLE */}
               <button 
                 onClick={() => canUploadDaily && setIsDailyQuickMock(!isDailyQuickMock)} 
                 className={`p-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 transition-all ${
                   isDailyQuickMock 
                   ? 'bg-orange-500 text-white shadow-lg' 
                   : !canUploadDaily 
                     ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50' 
                     : isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-500'
                 }`}
               >
                 {canUploadDaily ? <Zap size={14} /> : <Lock size={14} />} 
                 {isDailyQuickMock ? 'Daily' : 'Regular'}
               </button>

               <button onClick={() => setIsStrict(!isStrict)} className={`p-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 transition-all ${isStrict ? 'bg-red-600 text-white shadow-lg' : isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-500'}`}><ShieldAlert size={14} /> Strict</button>
            </div>
            <textarea className={`w-full h-32 p-4 font-mono text-[10px] border rounded-2xl outline-none ${theme.input} ${theme.border}`} placeholder='Paste JSON array...' value={bulkData} onChange={e => setBulkData(e.target.value)} />
            <button disabled={isPublishing} onClick={handlePublish} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-blue-500">
              {isPublishing ? 'Publishing...' : 'Publish Mock'}
            </button>
            {status && <p className="text-center font-black uppercase text-[10px] text-blue-500 mt-2">{status}</p>}
            
            <div className={`mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-4 ${theme.border}`}>
               <div className="space-y-2">
                 <p className="text-[10px] font-black uppercase text-blue-400 mb-2 flex items-center gap-2"><ListFilter size={14}/> Normal Mocks</p>
                 <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                   {regularMocks.map(m => (
                     <div key={m.id} className={`p-3 rounded-xl flex justify-between items-center group transition-all border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-transparent hover:border-blue-500/30'}`}>
                       <div><p className={`font-bold text-[10px] uppercase truncate w-24 ${theme.text}`}>{m.mock_title}</p><p className="text-[8px] font-bold text-slate-400 uppercase">{m.time_limit}m</p></div>
                       <button onClick={() => deleteMock(m.id, 'mocks')} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                     </div>
                   ))}
                 </div>
               </div>
               <div className="space-y-2">
                 <p className="text-[10px] font-black uppercase text-orange-400 mb-2 flex items-center gap-2"><Zap size={14}/> Ongoing Daily Mock</p>
                 <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                   {/* 🔥 FILTERED: Only shows TODAY's mock here */}
                   {dailyMocks.filter(m => m.mock_date === todayStr).map(m => (
                     <div key={m.id} className={`p-3 rounded-xl flex justify-between items-center group transition-all border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-orange-50 border-transparent hover:border-red-500/30'}`}>
                       <div><p className={`font-bold text-[10px] uppercase truncate w-24 ${theme.text}`}>{m.mock_title}</p><p className="text-[8px] font-bold text-slate-400 uppercase">{m.time_limit}m</p></div>
                       {canUploadDaily && <button onClick={() => deleteMock(m.id, 'daily_mocks')} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>}
                     </div>
                   ))}
                   {dailyMocks.filter(m => m.mock_date === todayStr).length === 0 && <p className="text-[9px] text-slate-400 italic p-2">No active mock for today.</p>}
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* RIGHT: TOOLS */}
        <div className="space-y-8 h-full">
          <div className={`p-8 rounded-[32px] shadow-xl border transition-colors ${theme.bg} ${theme.border}`}>
            <div className="flex items-center gap-3 mb-6 text-indigo-600"><Key size={32} /><h2 className={`text-2xl font-black uppercase ${theme.text}`}>Invite Generator</h2></div>
            <div className="mb-6 space-y-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">Generate recruitment codes.</p>
              <button onClick={generateInvite} className="w-full bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 font-black uppercase text-xs tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"><UserPlus size={16} /> Generate Invite Code</button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {activeKeys.map(k => (
                <div key={k.id} className={`p-4 rounded-xl flex justify-between items-center transition-all border ${k.is_used ? 'bg-slate-100 border-slate-200 opacity-60' : isDarkMode ? 'bg-indigo-900/20 border-indigo-900' : 'bg-indigo-50 border-indigo-100'}`}>
                  <div><p className={`font-black text-lg tracking-widest ${k.is_used ? 'text-slate-400 line-through' : 'text-indigo-600 dark:text-indigo-400'}`}>{k.code}</p><p className="text-[8px] font-bold text-slate-400 uppercase">{k.is_used ? 'CLAIMED' : 'ACTIVE'}</p></div>
                  {!k.is_used && <button onClick={() => deleteInvite(k.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>}
                </div>
              ))}
            </div>
          </div>

          <div className={`p-8 rounded-[32px] shadow-xl border transition-colors ${theme.bg} ${theme.border}`}>
            <div className="flex items-center gap-3 mb-6 text-orange-500"><BookOpen size={32} /><h2 className={`text-2xl font-black uppercase ${theme.text}`}>Library</h2></div>
            <div className="space-y-4">
              <input className={`w-full p-4 rounded-2xl border outline-none transition-colors ${theme.input} ${theme.border}`} placeholder="Resource Title" value={bookTitle} onChange={e => setBookTitle(e.target.value)} />
              <input className={`w-full p-4 rounded-2xl border outline-none transition-colors ${theme.input} ${theme.border}`} placeholder="PDF URL" value={bookUrl} onChange={e => setBookUrl(e.target.value)} />
              <button onClick={uploadResource} className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black uppercase shadow-lg transition-all active:scale-95 hover:bg-orange-600">Upload Resource</button>
            </div>
          </div>
        </div>
      </div>

      {/* --- RESTRICTED ZONE (ROOT ONLY) --- */}
      {isRoot && (
        <div className="space-y-10">
          <div className={`border-t-4 border-dashed my-10 relative ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
            <span className={`absolute top-[-14px] left-1/2 -translate-x-1/2 px-4 text-[10px] font-black uppercase text-slate-400 ${isDarkMode ? 'bg-slate-950' : 'bg-white'}`}>Root Command</span>
          </div>

          {/* 🔥 3-TIER PERMISSION MANAGER (REPLACED ROSTER) */}
          <div className={`p-8 rounded-[32px] shadow-xl border-l-8 border-l-purple-600 transition-colors ${theme.bg} ${theme.border}`}>
            <div className="flex items-center gap-3 mb-6 text-purple-600"><ShieldCheck size={32} /><h2 className={`text-2xl font-black uppercase ${theme.text}`}>Clearance Levels</h2></div>
            
            {loading ? (
              <div className="text-center py-10 text-slate-400 font-bold animate-pulse">Scanning Grid...</div>
            ) : allUsers.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                <Users size={40} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-400 font-black uppercase text-sm">No Other Nodes Detected</p>
                <p className="text-slate-500 text-xs mt-1">Check database or generate invites.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {allUsers.map(u => (
                  <div key={u.id} className={`p-4 rounded-2xl border-2 flex flex-col md:flex-row items-center justify-between transition-all ${u.is_elite_mod ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : u.is_moderator ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : theme.border}`}>
                    <div className="mb-3 md:mb-0 text-center md:text-left">
                      <p className={`font-black uppercase text-xs ${theme.text}`}>{u.username}</p>
                      <p className={`text-[9px] font-bold ${u.is_elite_mod ? 'text-purple-600' : u.is_moderator ? 'text-blue-500' : 'text-slate-400'}`}>
                        {u.is_elite_mod ? 'ELITE MODERATOR' : u.is_moderator ? 'MODERATOR' : 'STUDENT'}
                      </p>
                    </div>
                    
                    {/* 🔥 3 TOGGLES (Extended System) */}
                    <div className={`flex p-1 rounded-xl gap-1 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <button onClick={() => setPermission(u.id, 0)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${!u.is_moderator ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Student</button>
                      <button onClick={() => setPermission(u.id, 1)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${u.is_moderator && !u.is_elite_mod ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-blue-500'}`}>Mod</button>
                      <button onClick={() => setPermission(u.id, 2)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${u.is_elite_mod ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-purple-500'}`}>Elite</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[32px] shadow-2xl text-white">
            <div className="flex items-center gap-3 mb-6"><Megaphone size={32} className="animate-bounce" /><h2 className="text-2xl font-black uppercase tracking-tighter">Global Broadcast</h2></div>
            <div className="flex flex-col md:flex-row gap-4">
              <input className="flex-1 p-4 rounded-2xl text-slate-900 font-bold border-none outline-none" placeholder="Transmission..." value={announcement} onChange={(e) => setAnnouncement(e.target.value)} />
              <button onClick={postAnnouncement} className="bg-white text-blue-600 px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-50 transition-all">Broadcast</button>
            </div>
          </div>

          <div className={`p-8 rounded-[32px] shadow-xl border transition-colors ${theme.bg} ${theme.border}`}>
            <div className="flex items-center gap-3 mb-6 text-orange-500"><MessageSquare size={28} /><h2 className={`text-xl font-black uppercase tracking-tight ${theme.text}`}>Requests</h2></div>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
              {userRequests.map(req => (
                <div key={req.id} className={`p-4 rounded-2xl border transition-all ${theme.border}`}>
                  <div className="flex justify-between items-start mb-2"><span className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">{req.request_type}</span></div>
                  <p className={`text-xs font-black uppercase ${theme.text}`}>{req.user_name}</p>
                  <p className="text-[10px] text-slate-500 italic mt-1 mb-4">"{req.message}"</p>
                  <div className="flex gap-2">
                    <button onClick={() => { supabase.from('admin_requests').delete().eq('id', req.id); fetchAdminData(); }} className="flex-1 bg-green-100 dark:bg-green-600/20 text-green-600 dark:text-green-400 py-2 rounded-xl font-black text-[10px]">RESOLVE</button>
                    <button onClick={() => { supabase.from('admin_requests').delete().eq('id', req.id); fetchAdminData(); }} className="p-2 bg-red-100 dark:bg-red-600/20 text-red-600 dark:text-red-400 rounded-xl"><X size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`p-8 rounded-[32px] shadow-xl border transition-colors ${theme.bg} ${theme.border}`}>
            <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-blue-600 uppercase tracking-tighter"><History size={24} /> Dev Logs</h3>
            <div className="space-y-3 mb-6">
              <input className={`w-full p-4 rounded-2xl border outline-none transition-colors ${theme.input} ${theme.border}`} placeholder="Version" value={verName} onChange={e => setVerName(e.target.value)} />
              <textarea className={`w-full p-4 rounded-2xl border outline-none h-20 resize-none transition-colors ${theme.input} ${theme.border}`} placeholder="Commit..." value={verDesc} onChange={e => setVerDesc(e.target.value)} />
              <button onClick={saveLog} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg">Commit Update</button>
            </div>
            <div className="space-y-4 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {history.map(log => (
                <div key={log.id} className="border-l-4 border-blue-600 pl-4 py-1">
                  <p className="text-blue-600 font-black text-xs uppercase">{log.version_name} • <span className="text-slate-400 text-[10px]">{new Date(log.created_at).toLocaleDateString()}</span></p>
                  <p className="text-slate-500 text-[10px] mt-1">{log.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
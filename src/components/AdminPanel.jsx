import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
  UploadCloud, History, Megaphone, Trash2, 
  Zap, Loader2, ShieldAlert, Key, UserPlus, 
  Clock, MessageSquare, X, Users, Flame, Target, 
  GraduationCap, ChevronDown, BookOpen, ListFilter, Award, Database, ShieldCheck, ToggleLeft, ToggleRight
} from 'lucide-react';

export default function AdminPanel({ user }) {
  // --- 0. PERMISSION CHECK ---
  // The 'isRoot' flag identifies YOU (The Brain). Everyone else is a Moderator.
  const isRoot = user?.username?.toLowerCase() === 'thebrain';

  // --- 1. MOCK UPLOAD STATE ---
  const [bulkData, setBulkData] = useState('');
  const [mockTitle, setMockTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(10); 
  const [isDailyQuickMock, setIsDailyQuickMock] = useState(false);
  const [isStrict, setIsStrict] = useState(false); 
  const [status, setStatus] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // Separate states for separate tables
  const [regularMocks, setRegularMocks] = useState([]);
  const [dailyMocks, setDailyMocks] = useState([]); 

  // --- 2. SYSTEM & ROSTER STATE ---
  // Renamed 'activeKeys' contextually to handle Invite Codes, but keeping state name for stability if you prefer
  const [activeKeys, setActiveKeys] = useState([]); 
  const [userRequests, setUserRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]); 
  const [showRoster, setShowRoster] = useState(true); // Default TRUE for visibility
  const [loading, setLoading] = useState(true);

  // --- 3. LIBRARY MANAGER STATE ---
  const [bookTitle, setBookTitle] = useState('');
  const [bookUrl, setBookUrl] = useState('');
  const [bookCategory, setBookCategory] = useState('Computer Science'); 

  // 🔥 EXPANDED SUBJECT LIST
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
      // 1. Fetch Data visible to EVERYONE (You + Moderators)
      const [reg, dai, profs] = await Promise.all([
        supabase.from('mocks').select('*').order('created_at', { ascending: false }),
        supabase.from('daily_mocks').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('total_exams_completed', { ascending: false }),
      ]);

      setRegularMocks(reg.data || []);
      setDailyMocks(dai.data || []);
      
      // 🔥 STEALTH PROTOCOL: Filter 'The Brain' out of the roster immediately
      const civilianNodes = (profs.data || []).filter(u => u.username.toLowerCase() !== 'thebrain');
      setAllUsers(civilianNodes);

      // 2. Fetch INVITE CODES (Replaces Access Keys)
      // We look at 'invite_codes' table now
      let keyQuery = supabase.from('invite_codes').select('*').order('created_at', { ascending: false });
      
      // 🔥 IF NOT ROOT, ONLY SHOW KEYS I CREATED
      if (!isRoot) {
        keyQuery = keyQuery.eq('created_by', user.id);
      }
      
      const { data: keyData } = await keyQuery;
      setActiveKeys(keyData || []);

      // 3. Fetch Sensitive Data ONLY if you are The Brain (isRoot)
      if (isRoot) {
        const [logs, reqs] = await Promise.all([
          supabase.from('dev_logs').select('*').order('created_at', { ascending: false }),
          supabase.from('admin_requests').select('*').order('created_at', { ascending: false }),
        ]);
        setHistory(logs.data || []);
        setUserRequests(reqs.data || []);
      }

    } catch (err) {
      console.error("Neural Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }, [isRoot, user.id]);

  useEffect(() => { fetchAdminData(); }, [fetchAdminData]);

  // --- 6. HELPERS ---
  const getNeuralRank = (points, exams) => {
    const gpa = exams > 0 ? (points / exams) : 0;
    if (gpa >= 95) return { label: 'Architect', color: 'text-purple-600' };
    if (gpa >= 85) return { label: 'Genius', color: 'text-blue-600' };
    if (gpa >= 70) return { label: 'Specialist', color: 'text-green-600' };
    if (gpa >= 50) return { label: 'Scholar', color: 'text-orange-600' };
    return { label: 'Aspirant', color: 'text-slate-400' };
  };

  // --- 7. ACTION HANDLERS ---

  const handlePublish = async () => {
    if (isPublishing || !mockTitle || !bulkData) return;
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
        time_limit: parseInt(timeLimit) || 10
      };

      if (isDailyQuickMock) {
        payload.is_daily = true;
        payload.mock_date = today;
      }

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
    if (!window.confirm(`PERMANENT TERMINATION: Purge from ${table}?`)) return;
    try {
      await supabase.from('scores').delete().eq('mock_id', id);
      if (table === 'daily_mocks') {
        await supabase.from('completed_daily_mocks').delete().eq('mock_id', id);
      }
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      fetchAdminData();
    } catch (err) {
      alert(`Purge Error: ${err.message}`);
    }
  };

  // 🔥 NEW: GENERATE INVITE CODE LOGIC
  const generateInvite = async () => {
    try {
      // Create a random 6-char suffix like 'A9F2B1'
      const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newCode = `NEURAL-${suffix}`;
      
      // Insert into 'invite_codes' table
      const { error } = await supabase.from('invite_codes').insert([{ 
        code: newCode, 
        created_by: user.id 
      }]);
      
      if (error) throw error;
      fetchAdminData(); // Refresh list immediately
    } catch (err) {
      alert(`Generation Failed: ${err.message}`);
    }
  };

  const deleteInvite = async (id) => {
    // Delete from 'invite_codes'
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

  // --- ROOT ONLY ACTIONS ---
  const toggleModerator = async (userId, currentStatus) => {
    if (!isRoot) return;
    const { error } = await supabase.from('profiles').update({ is_moderator: !currentStatus }).eq('id', userId);
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

  if (loading && allUsers.length === 0) return <div className="p-20 text-center animate-pulse font-black text-blue-600 uppercase">Connecting Grid...</div>;

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto p-4 animate-in fade-in duration-700">
      
      {/* --- HEADER --- */}
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-2xl text-white shadow-lg ${isRoot ? 'bg-red-600' : 'bg-blue-600'}`}>
          {isRoot ? <ShieldCheck size={24} /> : <Database size={24} />}
        </div>
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
            {isRoot ? 'Central Command' : 'Moderator Panel'}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {isRoot ? 'System Root Access' : `Access granted to: ${user.username}`}
          </p>
        </div>
      </div>

      {/* --- LAYOUT: SPLIT TOP SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        
        {/* 1. MOCK CREATOR (LEFT COLUMN) */}
        {/* 🔥 FIXED: Explicit bg-white for Solar Mode */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6 text-blue-600"><UploadCloud size={32} /><h2 className="text-2xl font-black uppercase text-slate-900 dark:text-white">Mock Creator</h2></div>
          <div className="space-y-4">
            <input type="text" placeholder="Mock Title" className="w-full p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold placeholder:text-slate-400 outline-none" value={mockTitle} onChange={(e) => setMockTitle(e.target.value)} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="relative"><input type="number" className="w-full p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-black outline-none" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} /><Clock size={16} className="absolute right-4 top-5 text-slate-400" /></div>
               <button type="button" onClick={() => setIsDailyQuickMock(!isDailyQuickMock)} className={`p-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 transition-all ${isDailyQuickMock ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}><Zap size={14} /> {isDailyQuickMock ? 'Daily' : 'Regular'}</button>
               <button type="button" onClick={() => setIsStrict(!isStrict)} className={`p-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 transition-all ${isStrict ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}><ShieldAlert size={14} /> Strict: {isStrict ? 'ON' : 'OFF'}</button>
            </div>
            <textarea className="w-full h-40 p-4 font-mono text-[10px] border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl outline-none placeholder:text-slate-400" placeholder='Paste JSON array...' value={bulkData} onChange={(e) => setBulkData(e.target.value)} />
            <button disabled={isPublishing} onClick={handlePublish} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-blue-500">
              {isPublishing ? 'Publishing...' : 'Publish Mock'}
            </button>
            {status && <p className="text-center font-black uppercase text-[10px] text-blue-500 mt-2">{status}</p>}
            
            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <p className="text-[10px] font-black uppercase text-blue-400 mb-2 flex items-center gap-2"><ListFilter size={14}/> Normal Mocks</p>
                 <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                   {regularMocks.map(m => (
                     <div key={m.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between items-center group transition-all border border-transparent hover:border-blue-500/30">
                       <div><p className="font-bold text-[10px] text-slate-900 dark:text-white uppercase truncate w-24">{m.mock_title}</p><p className="text-[8px] font-bold text-slate-400 uppercase">{m.time_limit}m</p></div>
                       <button onClick={() => deleteMock(m.id, 'mocks')} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                     </div>
                   ))}
                 </div>
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase text-orange-400 mb-2 flex items-center gap-2"><Zap size={14}/> Daily Mocks</p>
                 <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                   {dailyMocks.map(m => (
                     <div key={m.id} className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex justify-between items-center group transition-all border border-transparent hover:border-red-500/30">
                       <div><p className="font-bold text-[10px] text-slate-900 dark:text-white uppercase truncate w-24">{m.mock_title}</p><p className="text-[8px] font-bold text-slate-400 uppercase">{m.time_limit}m</p></div>
                       <button onClick={() => deleteMock(m.id, 'daily_mocks')} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* 2. RIGHT COL: TOOLS STACK (Invite & Library) */}
        <div className="space-y-8 h-full">
          
          {/* INVITE GENERATOR */}
          {/* 🔥 FIXED: White Card */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6 text-indigo-600"><Key size={32} /><h2 className="text-2xl font-black uppercase text-slate-900 dark:text-white">Invite Generator</h2></div>
            <div className="mb-6 space-y-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">
                Generate unique access codes for new recruits. Users enter this code as their username to initialize their account.
              </p>
              <button onClick={generateInvite} className="w-full bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 font-black uppercase text-xs tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
                <UserPlus size={16} /> Generate Invite Code
              </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {activeKeys.length > 0 ? activeKeys.map(k => (
                <div key={k.id} className={`p-4 rounded-xl flex justify-between items-center transition-all border ${k.is_used ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60' : 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-900'}`}>
                  <div>
                    <p className={`font-black text-lg tracking-widest ${k.is_used ? 'text-slate-400 line-through' : 'text-indigo-600 dark:text-indigo-400'}`}>{k.code}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">
                      {k.is_used ? 'CLAIMED' : 'ACTIVE'} • {k.created_by === user.id ? 'You' : 'Admin'}
                    </p>
                  </div>
                  {!k.is_used && (
                    <button onClick={() => deleteInvite(k.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                  )}
                </div>
              )) : <p className="text-center text-[10px] text-slate-400 italic">No active invites.</p>}
            </div>
          </div>

          {/* LIBRARY MANAGER */}
          {/* 🔥 FIXED: White Card */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6 text-orange-500"><BookOpen size={32} /><h2 className="text-2xl font-black uppercase text-slate-900 dark:text-white">Library</h2></div>
            <div className="space-y-4">
              <input className="w-full p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none placeholder:text-slate-400" placeholder="Resource Title" value={bookTitle} onChange={e => setBookTitle(e.target.value)} />
              <input className="w-full p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none placeholder:text-slate-400" placeholder="PDF URL" value={bookUrl} onChange={e => setBookUrl(e.target.value)} />
              <select className="w-full p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-bold cursor-pointer" value={bookCategory} onChange={e => setBookCategory(e.target.value)}>
                {librarySubjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={uploadResource} className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black uppercase shadow-lg transition-all active:scale-95 hover:bg-orange-600">Upload Resource</button>
            </div>
          </div>

        </div>
      </div>

      {/* --- NEURAL ROSTER --- */}
      {/* 🔥 FIXED: White Card */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-xl border border-slate-200 dark:border-slate-800 mt-8 h-fit">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-blue-600"><Users size={32} /><h2 className="text-2xl font-black uppercase text-slate-900 dark:text-white tracking-tighter">Neural Roster</h2></div>
          <button onClick={() => setShowRoster(!showRoster)} className={`p-3 rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-600 transition-all ${showRoster ? 'rotate-180 bg-blue-600 text-white' : ''}`}><ChevronDown size={28} /></button>
        </div>
        {showRoster && (
          <div className="overflow-x-auto animate-in slide-in-from-top-4 mt-8">
            <table className="w-full text-left border-separate border-spacing-y-3">
              <thead><tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest"><th className="px-6 pb-2">Node</th><th className="px-6 pb-2 text-center">GPA</th><th className="px-6 pb-2 text-right">Streak</th></tr></thead>
              <tbody>
                {allUsers.map((u) => {
                  const r = getNeuralRank(u.total_percentage_points, u.total_exams_completed);
                  return (
                    <tr key={u.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:scale-[1.01] transition-transform">
                      <td className="px-6 py-4 rounded-l-2xl flex items-center gap-3">
                        <img src={`https://api.dicebear.com/7.x/${u.gender === 'neutral' ? 'bottts' : 'avataaars'}/svg?seed=${u.username}`} className="w-10 h-10 rounded-xl bg-white p-1" />
                        <div className="flex flex-col"><span className="font-black text-slate-900 dark:text-white uppercase text-sm">{u.username}</span><span className={`text-[8px] font-black uppercase tracking-widest ${r.color}`}>{r.label}</span></div>
                      </td>
                      <td className="px-6 py-4 text-center"><p className="font-black text-blue-600 text-lg">{(u.total_percentage_points / (u.total_exams_completed || 1)).toFixed(1)}%</p></td>
                      <td className="px-6 py-4 text-right rounded-r-2xl"><div className="inline-flex items-center gap-1 bg-orange-100 dark:bg-orange-900/20 px-3 py-1 rounded-lg"><Flame size={12} className="text-orange-500 fill-orange-500" /><span className="text-xs font-black text-orange-600">{u.streak_count || 0}</span></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------------------------- */}
      {/* 🔥 RESTRICTED ZONES (ROOT ONLY) 🔥 */}
      {/* ---------------------------------------------------------------------------------- */}
      
      {isRoot && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8">
          
          <div className="border-t-4 border-dashed border-slate-200 dark:border-slate-700 my-10 relative">
            <span className="absolute top-[-14px] left-1/2 -translate-x-1/2 bg-slate-100 dark:bg-slate-900 px-4 text-[10px] font-black uppercase text-slate-400">Restricted Zone</span>
          </div>

          {/* 5. PERMISSIONS MANAGER */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-xl border border-slate-200 dark:border-slate-800 border-l-8 border-l-purple-600">
            <div className="flex items-center gap-3 mb-6 text-purple-600"><ShieldCheck size={32} /><h2 className="text-2xl font-black uppercase text-slate-900 dark:text-white">Permission Management</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allUsers.map(u => (
                <div key={u.id} className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${u.is_moderator ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-slate-100 dark:border-slate-800'}`}>
                  <div>
                    <p className="font-black uppercase text-xs text-slate-900 dark:text-white">{u.username}</p>
                    <p className="text-[9px] font-bold text-slate-400">{u.is_moderator ? 'MODERATOR' : 'STUDENT'}</p>
                  </div>
                  <button onClick={() => toggleModerator(u.id, u.is_moderator)} className={`text-2xl transition-colors ${u.is_moderator ? 'text-purple-600' : 'text-slate-300'}`}>
                    {u.is_moderator ? <ToggleRight /> : <ToggleLeft />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 6. BROADCAST */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-[32px] shadow-2xl text-white">
            <div className="flex items-center gap-3 mb-6"><Megaphone size={32} className="animate-bounce" /><h2 className="text-2xl font-black uppercase tracking-tighter">Global Broadcast</h2></div>
            <div className="flex flex-col md:flex-row gap-4">
              <input className="flex-1 p-4 rounded-2xl text-gray-900 font-bold border-none outline-none" placeholder="Type transmission..." value={announcement} onChange={(e) => setAnnouncement(e.target.value)} />
              <button onClick={postAnnouncement} className="bg-white text-blue-600 px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-50 transition-all">Broadcast</button>
            </div>
          </div>

          {/* 7. PORTAL SIGNALS */}
          {/* 🔥 FIXED: White Card */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6 text-orange-500"><MessageSquare size={28} /><h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Portal Signals</h2></div>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
              {userRequests.map(req => (
                <div key={req.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-orange-500/50 transition-all">
                  <div className="flex justify-between items-start mb-2"><span className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">{req.request_type}</span></div>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter">{req.user_name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-1 mb-4">"{req.message}"</p>
                  <div className="flex gap-2">
                    <button onClick={async () => { await supabase.from('admin_requests').delete().eq('id', req.id); fetchAdminData(); }} className="flex-1 bg-green-100 dark:bg-green-600/20 text-green-600 dark:text-green-400 py-2 rounded-xl font-black text-[10px] hover:bg-green-200 dark:hover:bg-green-600/40">RESOLVE</button>
                    <button onClick={async () => { await supabase.from('admin_requests').delete().eq('id', req.id); fetchAdminData(); }} className="p-2 bg-red-100 dark:bg-red-600/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-600/40"><X size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 8. DEV LOGS */}
          {/* 🔥 FIXED: White Card */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-blue-600 uppercase tracking-tighter"><History size={24} /> Dev Logs</h3>
              <div className="space-y-3 mb-6">
              <input className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl text-sm border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white" placeholder="Version Name" value={verName} onChange={e => setVerName(e.target.value)} />
              <textarea className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl text-sm border border-slate-200 dark:border-slate-700 outline-none h-20 resize-none text-slate-900 dark:text-white" placeholder="Commit details..." value={verDesc} onChange={e => setVerDesc(e.target.value)} />
              <button onClick={saveLog} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-indigo-700 transition-all">Commit Update</button>
            </div>
            <div className="space-y-4 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {history.map(log => (
                <div key={log.id} className="border-l-4 border-blue-600 pl-4 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                  <p className="text-blue-600 font-black text-xs uppercase">{log.version_name} • <span className="text-slate-400 text-[10px]">{new Date(log.created_at).toLocaleDateString()}</span></p>
                  <p className="text-slate-500 text-[10px] leading-relaxed mt-1">{log.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
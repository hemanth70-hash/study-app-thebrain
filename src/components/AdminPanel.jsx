import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
  UploadCloud, Database, History, Megaphone, Trash2, 
  Zap, Loader2, ShieldAlert, Key, UserPlus, 
  Clock, MessageSquare, X, Users, Flame, Target, 
  GraduationCap, ChevronDown, BookOpen, ListFilter, Award
} from 'lucide-react';

export default function AdminPanel() {
  // --- 1. MOCK UPLOAD STATE ---
  const [bulkData, setBulkData] = useState('');
  const [mockTitle, setMockTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(10); 
  const [isDailyQuickMock, setIsDailyQuickMock] = useState(false);
  const [isStrict, setIsStrict] = useState(false); 
  const [status, setStatus] = useState('');
  const [allMocks, setAllMocks] = useState([]); // 🔥 POPULATES GRID
  const [isPublishing, setIsPublishing] = useState(false); 

  // --- 2. ACCESS KEY & ROSTER STATE ---
  const [assignedName, setAssignedName] = useState('');
  const [activeKeys, setActiveKeys] = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]); 
  const [showRoster, setShowRoster] = useState(false); 

  // --- 3. LIBRARY STATE ---
  const [bookTitle, setBookTitle] = useState('');
  const [bookUrl, setBookUrl] = useState('');
  const [bookCategory, setBookCategory] = useState('Physics');

  // --- 4. SYSTEM STATES ---
  const [verName, setVerName] = useState('');
  const [verDesc, setVerDesc] = useState('');
  const [history, setHistory] = useState([]); 
  const [announcement, setAnnouncement] = useState('');
  const [loading, setLoading] = useState(true);

  // --- 5. ATOMIC DATA FETCH (ISOLATED & ROBUST) ---
  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    
    // A. FETCH MOCKS (Direct Database Check)
    try {
      const { data: mockData, error } = await supabase
        .from('daily_mocks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAllMocks(mockData || []);
    } catch (err) {
      console.error("Grid Sync Error:", err.message);
    }

    // B. FETCH PROFILES
    try {
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .order('total_exams_completed', { ascending: false });
        if (profileData) setAllUsers(profileData);
    } catch (err) { console.error("Profile Error:", err); }

    // C. FETCH SECONDARY TABLES
    try {
      const [logs, keys, reqs] = await Promise.all([
        supabase.from('dev_logs').select('*').order('created_at', { ascending: false }),
        supabase.from('authorized_users').select('*').order('created_at', { ascending: false }),
        supabase.from('admin_requests').select('*').order('created_at', { ascending: false }),
      ]);

      if (logs.data) setHistory(logs.data);
      if (keys.data) setActiveKeys(keys.data);
      if (reqs.data) setUserRequests(reqs.data);
    } catch (err) {
      console.warn("Secondary tables missing.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAdminData(); }, [fetchAdminData]);

  // --- 6. HELPERS ---
  const getNeuralRank = (points, exams) => {
    const gpa = exams > 0 ? (points / exams) : 0;
    if (gpa >= 95) return { label: 'Architect', color: 'text-purple-500' };
    if (gpa >= 85) return { label: 'Genius', color: 'text-blue-500' };
    if (gpa >= 70) return { label: 'Specialist', color: 'text-green-500' };
    if (gpa >= 50) return { label: 'Scholar', color: 'text-orange-500' };
    return { label: 'Aspirant', color: 'text-gray-400' };
  };

  // --- 7. HANDLERS ---
  const handleBulkUpload = async () => {
    if (isPublishing) return;
    if (!mockTitle || !bulkData) return setStatus('❌ Fields Required.');
    
    setIsPublishing(true);
    setStatus('⏳ Publishing...');
    
    try {
      const parsedQuestions = JSON.parse(bulkData);
      const today = new Date().toISOString().split('T')[0];

      if (isDailyQuickMock) {
        const { data: old } = await supabase.from('daily_mocks').select('id').eq('is_daily', true).eq('mock_date', today);
        if (old?.length > 0) {
          const ids = old.map(m => m.id);
          await supabase.from('scores').delete().in('mock_id', ids);
          await supabase.from('completed_daily_mocks').delete().in('mock_id', ids);
          await supabase.from('daily_mocks').delete().in('id', ids);
        }
      }

      const { error } = await supabase.from('daily_mocks').insert([{ 
        mock_title: mockTitle, 
        questions: parsedQuestions, 
        is_daily: isDailyQuickMock, 
        is_strict: isStrict, 
        time_limit: parseInt(timeLimit), 
        mock_date: today 
      }]);

      if (error) throw error;
      setStatus(`🎉 Published!`);
      setBulkData(''); setMockTitle(''); 
      await fetchAdminData(); // Refresh grid immediately
    } catch (err) { 
      console.error("Upload Error:", err);
      setStatus(`❌ Error: ${err.message}`); 
    } finally {
      setIsPublishing(false);
    }
  };

  // 🔥 SMART DELETE: Checks type before deleting dependencies
  const deleteMock = async (id, isDaily) => {
    if (!window.confirm("PERMANENTLY DELETE this node and ALL student scores?")) return;
    setStatus('⏳ Purging Node...');
    
    try {
        // 1. Always delete scores (Foreign Key)
        await supabase.from('scores').delete().eq('mock_id', id);
        
        // 2. Only delete completion records if it was a Daily Mock
        if (isDaily) {
           await supabase.from('completed_daily_mocks').delete().eq('mock_id', id);
        }

        // 3. Delete the Mock itself
        const { error } = await supabase.from('daily_mocks').delete().eq('id', id);
        
        if (error) throw error;
        setStatus('✅ Node Purged.');
        fetchAdminData(); // Refresh list
    } catch (err) { 
        setStatus(`❌ Delete Failed: ${err.message}`); 
    }
  };

  const generateKey = async () => {
    if (!assignedName) return alert("Enter name.");
    const newKey = `BRAIN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    await supabase.from('authorized_users').insert([{ access_key: newKey, assigned_to: assignedName }]);
    setAssignedName(''); fetchAdminData();
  };

  const uploadResource = async () => {
    if (!bookTitle || !bookUrl) return alert("Fill data.");
    await supabase.from('study_resources').insert([{ title: bookTitle, file_url: bookUrl, category: bookCategory }]);
    setBookTitle(''); setBookUrl(''); alert("Synced.");
  };

  const postAnnouncement = async () => {
    if (!announcement) return;
    await supabase.from('announcements').update({ active: false }).eq('active', true);
    await supabase.from('announcements').insert([{ message: announcement, active: true }]);
    setAnnouncement(''); fetchAdminData(); alert("Live.");
  };

  const saveLog = async () => {
    if (!verName || !verDesc) return;
    await supabase.from('dev_logs').insert([{ version_name: verName, description: verDesc }]);
    setVerName(''); setVerDesc(''); fetchAdminData();
  };

  if (loading && allUsers.length === 0) return <div className="p-20 text-center animate-pulse font-black text-blue-600 uppercase">Accessing Neural Grid...</div>;

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto p-4 animate-in fade-in duration-700">
      
      {/* 1. BROADCAST PANEL */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-[32px] shadow-2xl text-white">
        <div className="flex items-center gap-3 mb-6"><Megaphone size={32} className="animate-bounce" /><h2 className="text-2xl font-black uppercase tracking-tighter">Global Broadcast</h2></div>
        <div className="flex flex-col md:flex-row gap-4">
          <input className="flex-1 p-4 rounded-2xl text-gray-900 font-bold border-none outline-none" placeholder="Type transmission..." value={announcement} onChange={(e) => setAnnouncement(e.target.value)} />
          <button onClick={postAnnouncement} className="bg-white text-blue-600 px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg">Broadcast</button>
        </div>
      </div>

      {/* 2. REGULAR MOCK RESULTS ROSTER */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-xl border dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6 text-green-500"><Award size={32} /><h2 className="text-2xl font-black uppercase dark:text-white">Regular Mock Results</h2></div>
        <div className="overflow-x-auto max-h-96 pr-2 custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase text-gray-400 border-b dark:border-gray-700">
                <th className="pb-4">Node</th><th className="pb-4">Latest Mock</th><th className="pb-4 text-center">Score</th><th className="pb-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.filter(u => u.last_regular_result).map(u => (
                <tr key={u.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all">
                  <td className="py-4 font-black uppercase text-xs dark:text-white">{u.username}</td>
                  <td className="py-4 text-xs font-bold text-gray-500">{u.last_regular_result.title}</td>
                  <td className="py-4 text-center"><span className={`px-3 py-1 rounded-lg font-black text-xs ${u.last_regular_result.percentage >= 50 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{u.last_regular_result.score}/{u.last_regular_result.total}</span></td>
                  <td className="py-4 text-right text-[10px] font-bold text-gray-400">{new Date(u.last_regular_result.timestamp).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* 3. MOCK CREATOR + ACTIVE NODES LIST (INTEGRATED) */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-xl border dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6 text-blue-600"><UploadCloud size={32} /><h2 className="text-2xl font-black uppercase dark:text-white">Mock Creator</h2></div>
          <div className="space-y-4">
            <input type="text" placeholder="Mock Title" className="w-full p-4 rounded-2xl border dark:bg-gray-900 dark:text-white font-bold outline-none" value={mockTitle} onChange={(e) => setMockTitle(e.target.value)} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="relative"><input type="number" className="w-full p-4 rounded-2xl border dark:bg-gray-900 dark:text-white font-black outline-none" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} /><Clock size={16} className="absolute right-4 top-5 text-gray-400" /></div>
               <button type="button" onClick={() => setIsDailyQuickMock(!isDailyQuickMock)} className={`p-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all ${isDailyQuickMock ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}><Zap size={14} /> {isDailyQuickMock ? 'Daily' : 'Regular'}</button>
               <button type="button" onClick={() => setIsStrict(!isStrict)} className={`p-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all ${isStrict ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}><ShieldAlert size={14} /> Strict: {isStrict ? 'ON' : 'OFF'}</button>
            </div>
            <textarea className="w-full h-40 p-4 font-mono text-[10px] border dark:bg-gray-900 dark:text-white rounded-2xl outline-none" placeholder='Paste JSON array...' value={bulkData} onChange={(e) => setBulkData(e.target.value)} />
            <button disabled={isPublishing} onClick={handleBulkUpload} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
              {isPublishing ? 'Publishing...' : 'Publish Mock'}
            </button>
            {status && <p className="text-center font-black uppercase text-xs text-green-500 mt-2">{status}</p>}

            {/* 🔥 COMPACT ACTIVE NODES LIST (Replaces Grid Management) */}
            <div className="mt-8 pt-8 border-t dark:border-gray-700">
               <p className="text-[10px] font-black uppercase text-gray-400 mb-4 flex items-center gap-2"><ListFilter size={14}/> Active Simulation Nodes</p>
               <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {allMocks.length === 0 ? <p className="text-xs text-gray-400 italic">No active nodes found.</p> : allMocks.map(m => (
                    <div key={m.id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl flex justify-between items-center group border border-transparent hover:border-red-500/30 transition-all">
                      <div><p className="font-bold text-xs dark:text-white uppercase">{m.mock_title}</p><p className="text-[8px] font-bold text-gray-400 uppercase">{m.is_daily ? 'Daily Slot' : 'Regular Grid'} • {m.time_limit}m</p></div>
                      {/* 🔥 SMART DELETE BUTTON: Passes is_daily to handler */}
                      <button onClick={() => deleteMock(m.id, m.is_daily)} className="p-2 text-gray-400 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>

        {/* 4. NEURAL ROSTER (Cumulative) */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-xl border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-blue-600"><Users size={32} /><h2 className="text-2xl font-black uppercase dark:text-white tracking-tighter">Neural Roster</h2></div>
            <button onClick={() => setShowRoster(!showRoster)} className={`p-3 rounded-2xl bg-blue-50 dark:bg-gray-700 text-blue-600 transition-all ${showRoster ? 'rotate-180 bg-blue-600 text-white' : ''}`}><ChevronDown size={28} /></button>
          </div>
          {showRoster && (
            <div className="overflow-x-auto animate-in slide-in-from-top-4 mt-8">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead><tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest"><th className="px-6 pb-2">Node</th><th className="px-6 pb-2">Role</th><th className="px-6 pb-2 text-center">GPA</th><th className="px-6 pb-2 text-right">Streak</th></tr></thead>
                <tbody>
                  {allUsers.map((u) => {
                    const r = getNeuralRank(u.total_percentage_points, u.total_exams_completed);
                    return (
                      <tr key={u.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl hover:scale-[1.01] transition-transform">
                        <td className="px-6 py-4 rounded-l-2xl flex items-center gap-3">
                          <img src={`https://api.dicebear.com/7.x/${u.gender === 'neutral' ? 'bottts' : 'avataaars'}/svg?seed=${u.username}`} className="w-10 h-10 rounded-xl bg-white p-1" />
                          <div className="flex flex-col"><span className="font-black dark:text-white uppercase text-sm">{u.username}</span><span className={`text-[8px] font-black uppercase tracking-widest ${r.color}`}>{r.label}</span></div>
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

        {/* 5. LIBRARY MANAGER */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-xl border dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6 text-orange-500"><BookOpen size={32} /><h2 className="text-2xl font-black uppercase dark:text-white">Library</h2></div>
          <div className="space-y-4">
            <input className="w-full p-4 rounded-2xl border dark:bg-gray-900 dark:text-white outline-none" placeholder="Title" value={bookTitle} onChange={e => setBookTitle(e.target.value)} />
            <input className="w-full p-4 rounded-2xl border dark:bg-gray-900 dark:text-white outline-none" placeholder="URL" value={bookUrl} onChange={e => setBookUrl(e.target.value)} />
            <select className="w-full p-4 rounded-2xl border dark:bg-gray-900 dark:text-white outline-none font-bold" value={bookCategory} onChange={e => setBookCategory(e.target.value)}>
              {['Physics', 'Chemistry', 'Biology', 'Maths', 'General'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={uploadResource} className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black uppercase shadow-lg transition-all">Upload</button>
          </div>
        </div>

        {/* 6. ACCESS KEYS */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-xl border dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6 text-indigo-600"><Key size={32} /><h2 className="text-2xl font-black uppercase dark:text-white">Access</h2></div>
          <div className="flex gap-2 mb-6"><input type="text" placeholder="Recipient" className="flex-1 p-4 rounded-2xl border dark:bg-gray-900 dark:text-white outline-none" value={assignedName} onChange={(e) => setAssignedName(e.target.value)} /><button onClick={generateKey} className="bg-indigo-600 text-white p-4 rounded-2xl"><UserPlus size={24} /></button></div>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
            {activeKeys.map(k => (
              <div key={k.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl flex justify-between items-center transition-all">
                <div><p className="font-black text-indigo-600 text-xs">{k.access_key}</p><p className="text-[10px] font-bold text-gray-400 uppercase">Node: {k.assigned_to}</p></div>
                <button onClick={async () => { await supabase.from('authorized_users').delete().eq('id', k.id); fetchAdminData(); }} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* 7. PORTAL SIGNALS */}
        <div className="bg-gray-900 text-white p-8 rounded-[32px] shadow-2xl border border-white/5 lg:col-span-1">
          <div className="flex items-center gap-3 mb-6 text-orange-400"><MessageSquare size={28} /><h2 className="text-xl font-black uppercase tracking-tight">Signals</h2></div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
            {userRequests.map(req => (
              <div key={req.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-orange-500/50 transition-all">
                <div className="flex justify-between items-start mb-2"><span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">{req.request_type}</span></div>
                <p className="text-xs font-black text-gray-300 uppercase tracking-tighter">{req.user_name}</p>
                <p className="text-[10px] text-gray-500 italic mt-1 mb-4">"{req.message}"</p>
                <button onClick={async () => { await supabase.from('admin_requests').delete().eq('id', req.id); fetchAdminData(); }} className="w-full bg-green-600/20 text-green-400 py-2 rounded-xl font-black text-[10px] hover:bg-green-600/40">RESOLVE</button>
              </div>
            ))}
          </div>
        </div>

        {/* 8. DEV LOGS */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-xl border dark:border-gray-700">
           <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-blue-600 uppercase tracking-tighter"><History size={24} /> Dev Logs</h3>
           <div className="space-y-3 mb-6">
            <input className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl text-sm border dark:border-gray-700 outline-none" placeholder="Version Name" value={verName} onChange={e => setVerName(e.target.value)} />
            <textarea className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl text-sm border dark:border-gray-700 outline-none h-20 resize-none" placeholder="Commit details..." value={verDesc} onChange={e => setVerDesc(e.target.value)} />
            <button onClick={saveLog} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-indigo-700 transition-all">Commit Update</button>
          </div>
          <div className="space-y-4 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
            {history.map(log => (
              <div key={log.id} className="border-l-4 border-blue-600 pl-4 py-1 hover:bg-blue-50 dark:hover:bg-gray-900/50 transition-all">
                <p className="text-blue-600 font-black text-xs uppercase">{log.version_name} • <span className="text-gray-400 text-[10px]">{new Date(log.created_at).toLocaleDateString()}</span></p>
                <p className="text-gray-500 text-[10px] leading-relaxed mt-1">{log.description}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
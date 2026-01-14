import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
  UploadCloud, Database, History, Megaphone, Trash2, 
  ListChecks, Zap, Loader2, ShieldAlert, Key, UserPlus, 
  Clock, MessageSquare, Check, X, Users, Flame, Target, GraduationCap, ChevronDown
} from 'lucide-react';

export default function AdminPanel() {
  // --- MOCK UPLOAD STATE ---
  const [bulkData, setBulkData] = useState('');
  const [mockTitle, setMockTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(10); 
  const [isDailyQuickMock, setIsDailyQuickMock] = useState(false);
  const [isStrict, setIsStrict] = useState(false); 
  const [status, setStatus] = useState('');
  const [existingMocks, setExistingMocks] = useState([]); 

  // --- ACCESS KEY & REQUEST STATE ---
  const [assignedName, setAssignedName] = useState('');
  const [activeKeys, setActiveKeys] = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]); 
  const [showRoster, setShowRoster] = useState(false); // 🔥 Dropdown Control

  // --- VERSION HISTORY STATE ---
  const [verName, setVerName] = useState('');
  const [verDesc, setVerDesc] = useState('');
  const [history, setHistory] = useState([]); 

  // --- ANNOUNCEMENT STATE ---
  const [announcement, setAnnouncement] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState('');
  const [loading, setLoading] = useState(true);

  // --- 1. ATOMIC DATA FETCH ---
  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: logs } = await supabase.from('dev_logs').select('*').order('created_at', { ascending: false });
      const { data: mocks } = await supabase.from('daily_mocks').select('*').order('mock_date', { ascending: false });
      const { data: keys } = await supabase.from('authorized_users').select('*').order('created_at', { ascending: false });
      const { data: requests } = await supabase.from('admin_requests').select('*').order('created_at', { ascending: false });
      
      // 🔥 Fetching permanent profile data for the roster
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('total_exams_completed', { ascending: false });

      if (logs) setHistory(logs);
      if (mocks) setExistingMocks(mocks);
      if (keys) setActiveKeys(keys);
      if (requests) setUserRequests(requests);
      if (profiles) setAllUsers(profiles);
    } catch (err) {
      console.error("Admin Grid Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // --- 2. NEURAL RANK HELPER ---
  const getNeuralRank = (points, exams) => {
    const gpa = exams > 0 ? (points / exams) : 0;
    if (gpa >= 95) return { label: 'Architect', color: 'text-purple-500' };
    if (gpa >= 85) return { label: 'Genius', color: 'text-blue-500' };
    if (gpa >= 70) return { label: 'Specialist', color: 'text-green-500' };
    if (gpa >= 50) return { label: 'Scholar', color: 'text-orange-500' };
    return { label: 'Aspirant', color: 'text-gray-400' };
  };

  // --- 3. HANDLERS ---
  const generateKey = async () => {
    if (!assignedName) return alert("The Brain, enter a friend's name first.");
    const newKey = `BRAIN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const { error } = await supabase.from('authorized_users').insert([{ access_key: newKey, assigned_to: assignedName }]);
    if (!error) { setAssignedName(''); fetchAdminData(); alert(`Access Key Primed: ${newKey}`); }
  };

  const handleBulkUpload = async () => {
    if (!mockTitle || !bulkData) return setStatus('❌ Error: Fields Required.');
    setStatus('⏳ Processing Neural Upload...');
    try {
      const parsedQuestions = JSON.parse(bulkData);
      if (isDailyQuickMock) {
        const { data: oldMocks } = await supabase.from('daily_mocks').select('id').eq('is_daily', true);
        if (oldMocks?.length > 0) {
          const ids = oldMocks.map(m => m.id);
          await supabase.from('scores').delete().in('mock_id', ids);
          await supabase.from('completed_daily_mocks').delete().in('mock_id', ids);
          await supabase.from('daily_mocks').delete().in('id', ids);
        }
      }
      const newMockEntry = { 
        mock_title: mockTitle, questions: parsedQuestions, 
        is_daily: isDailyQuickMock, is_strict: isStrict, 
        time_limit: parseInt(timeLimit) || 10, 
        mock_date: new Date().toISOString().split('T')[0] 
      };
      const { error } = await supabase.from('daily_mocks').insert([newMockEntry]);
      if (error) throw error;
      setStatus(`🎉 Grid Updated!`);
      setBulkData(''); setMockTitle(''); setIsDailyQuickMock(false); setIsStrict(false);
      fetchAdminData(); 
    } catch (err) { setStatus(`❌ Error: ${err.message}`); }
  };

  const postAnnouncement = async () => {
    if (!announcement) return;
    await supabase.from('announcements').update({ active: false }).eq('active', true);
    const { error } = await supabase.from('announcements').insert([{ message: announcement, active: true }]);
    if (!error) { setAnnouncement(''); fetchAdminData(); alert("Broadcast Live."); }
  };

  const saveLog = async () => {
    if (!verName || !verDesc) return;
    const { error } = await supabase.from('dev_logs').insert([{ version_name: verName, description: verDesc }]);
    if (!error) { fetchAdminData(); setVerName(''); setVerDesc(''); }
  };

  if (loading && allUsers.length === 0) return (
    <div className="p-20 text-center animate-pulse font-black text-blue-600 uppercase tracking-[0.5em]">
      Accessing Neural Admin...
    </div>
  );

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto p-4 animate-in fade-in duration-700">
      
      {/* 1. GLOBAL BROADCAST */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-[32px] shadow-2xl text-white">
        <div className="flex items-center gap-3 mb-6">
          <Megaphone size={32} className="animate-bounce" />
          <h2 className="text-2xl font-black uppercase tracking-tighter">Global Broadcast</h2>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <input className="flex-1 p-4 rounded-2xl text-gray-900 font-bold border-none outline-none focus:ring-4 focus:ring-blue-400" placeholder="Type transmission..." value={announcement} onChange={(e) => setAnnouncement(e.target.value)} />
          <button onClick={postAnnouncement} className="bg-white text-blue-600 px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg">Broadcast</button>
        </div>
      </div>

      {/* 🔥 2. NEURAL ROSTER (THE CLEAN DROP-DOWN) */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-xl border dark:border-gray-700 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-blue-600">
            <Users size={32} />
            <h2 className="text-2xl font-black uppercase dark:text-white tracking-tighter">Neural Roster</h2>
          </div>
          
          <button 
            onClick={() => setShowRoster(!showRoster)}
            className={`p-3 rounded-2xl bg-blue-50 dark:bg-gray-700 text-blue-600 transition-all duration-300 hover:scale-110 ${showRoster ? 'rotate-180 bg-blue-600 text-white shadow-lg' : ''}`}
          >
            <ChevronDown size={28} strokeWidth={3} />
          </button>
        </div>
        
        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">
          {allUsers.length} Active Nodes Synchronized
        </p>

        {showRoster && (
          <div className="overflow-x-auto animate-in slide-in-from-top-4 duration-500 mt-8">
            <table className="w-full text-left border-separate border-spacing-y-3">
              <thead>
                <tr className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                  <th className="px-6 pb-2">Identity</th>
                  <th className="px-6 pb-2">Focus</th>
                  <th className="px-6 pb-2 text-center">Neural GPA</th>
                  <th className="px-6 pb-2 text-right">Activity</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u) => {
                  const r = getNeuralRank(u.total_percentage_points, u.total_exams_completed);
                  return (
                    <tr key={u.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl group transition-all hover:scale-[1.01]">
                      <td className="px-6 py-4 rounded-l-2xl border-l-4 border-transparent group-hover:border-blue-500">
                        <div className="flex items-center gap-3">
                          <img src={`https://api.dicebear.com/7.x/${u.gender === 'neutral' ? 'bottts' : 'avataaars'}/svg?seed=${u.avatar_seed || u.username}`} className="w-10 h-10 rounded-xl bg-white p-1" alt="avatar" />
                          <div>
                            <p className="font-black dark:text-white uppercase text-sm">{u.username}</p>
                            <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${r.color}`}>{r.label}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest italic">
                        <div className="flex items-center gap-2"><GraduationCap size={14}/> {u.education || 'N/A'}</div>
                        <div className="flex items-center gap-2 text-red-500/70 mt-1"><Target size={14}/> {u.preparing_for || 'General'}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="font-black text-blue-600 text-lg">{(u.total_percentage_points / (u.total_exams_completed || 1)).toFixed(1)}%</p>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Lifetime Avg</p>
                      </td>
                      <td className="px-6 py-4 text-right rounded-r-2xl">
                        <div className="inline-flex flex-col items-end">
                          <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/20 px-3 py-1 rounded-lg">
                            <Flame size={12} className="text-orange-500 fill-orange-500" />
                            <span className="text-xs font-black text-orange-600">{u.streak_count || 0}</span>
                          </div>
                          <p className="text-[8px] font-black text-gray-400 uppercase mt-1">Exams: {u.total_exams_completed || 0}</p>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* 3. MOCK CREATOR */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-xl border dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6 text-blue-600">
            <UploadCloud size={32} />
            <h2 className="text-2xl font-black uppercase dark:text-white">Mock Creator</h2>
          </div>
          <div className="space-y-4">
            <input type="text" placeholder="Mock Title" className="w-full p-4 rounded-2xl border dark:bg-gray-900 dark:border-gray-700 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500" value={mockTitle} onChange={(e) => setMockTitle(e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setIsDailyQuickMock(!isDailyQuickMock)} className={`p-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all ${isDailyQuickMock ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}><Zap size={14} /> Daily Mock</button>
              <button onClick={() => setIsStrict(!isStrict)} className={`p-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all ${isStrict ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}><ShieldAlert size={14} /> Strict Mode</button>
            </div>
            <textarea className="w-full h-40 p-4 font-mono text-[10px] border dark:bg-gray-900 dark:border-gray-700 rounded-2xl outline-none" placeholder='Paste JSON array...' value={bulkData} onChange={(e) => setBulkData(e.target.value)} />
            <button onClick={handleBulkUpload} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all active:scale-95">Publish Mock</button>
            {status && <p className="text-center font-black uppercase text-xs text-green-500 mt-2">{status}</p>}
          </div>
        </div>

        {/* 4. ACCESS KEY GENERATOR */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-xl border dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6 text-indigo-600">
            <Key size={32} />
            <h2 className="text-2xl font-black uppercase dark:text-white">Authorizations</h2>
          </div>
          <div className="flex gap-2 mb-6">
            <input type="text" placeholder="Friend's Name" className="flex-1 p-4 rounded-2xl border dark:bg-gray-900 dark:border-gray-700 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={assignedName} onChange={(e) => setAssignedName(e.target.value)} />
            <button onClick={generateKey} className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 shadow-lg"><UserPlus size={24} /></button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {activeKeys.map(k => (
              <div key={k.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border dark:border-gray-800 flex justify-between items-center group transition-all">
                <div>
                  <p className="font-black text-indigo-600 text-xs tracking-widest">{k.access_key}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Linked: {k.assigned_to}</p>
                </div>
                <button onClick={async () => { await supabase.from('authorized_users').delete().eq('id', k.id); fetchAdminData(); }} className="text-gray-300 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* 5. USER REQUESTS */}
        <div className="bg-gray-900 text-white p-8 rounded-[32px] shadow-2xl border border-white/5 lg:col-span-1">
          <div className="flex items-center gap-3 mb-6 text-orange-400">
            <MessageSquare size={28} />
            <h2 className="text-xl font-black uppercase tracking-tight">Portal Requests</h2>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
            {userRequests.length === 0 ? <p className="text-gray-500 text-center font-bold text-xs py-10 uppercase opacity-50">No signals incoming...</p> : userRequests.map(req => (
              <div key={req.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-orange-500/50 transition-all relative group">
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">{req.request_type}</span>
                  <span className="text-[8px] text-gray-500 font-bold">{new Date(req.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-xs font-black text-gray-300 uppercase tracking-tighter">{req.user_name}</p>
                <p className="text-[10px] text-gray-500 italic mt-1 mb-4">"{req.message}"</p>
                <div className="flex gap-2">
                  <button onClick={async () => { await supabase.from('admin_requests').delete().eq('id', req.id); fetchAdminData(); }} className="flex-1 bg-green-600/20 text-green-400 py-2 rounded-xl font-black text-[10px] hover:bg-green-600/40 transition-all">RESOLVE</button>
                  <button onClick={async () => { await supabase.from('admin_requests').delete().eq('id', req.id); fetchAdminData(); }} className="p-2 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/40 transition-all"><X size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. DEV LOGS */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-xl border dark:border-gray-700">
           <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-blue-600 uppercase tracking-tighter"><History size={24} /> Dev Logs</h3>
           <div className="space-y-3 mb-6">
            <input className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl text-sm border dark:border-gray-700 outline-none" placeholder="Version (e.g. v2.1.0)" value={verName} onChange={e => setVerName(e.target.value)} />
            <textarea className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl text-sm border dark:border-gray-700 outline-none h-20 resize-none" placeholder="Neural updates..." value={verDesc} onChange={e => setVerDesc(e.target.value)} />
            <button onClick={saveLog} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-indigo-700 transition-all active:scale-95">Save Update</button>
          </div>
          <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {history.map(log => (
              <div key={log.id} className="border-l-4 border-blue-600 pl-4 py-1 hover:bg-blue-50 transition-all">
                <p className="text-blue-600 font-black text-xs uppercase tracking-widest">{log.version_name} • <span className="text-gray-400 text-[10px]">{new Date(log.created_at).toLocaleDateString()}</span></p>
                <p className="text-gray-500 text-[10px] leading-relaxed mt-1">{log.description}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
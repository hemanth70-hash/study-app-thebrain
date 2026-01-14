import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
  UploadCloud, Database, History, Megaphone, Trash2, 
  ListChecks, Zap, Loader2, ShieldAlert, Key, UserPlus, 
  Clock, MessageSquare, Check, X
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
      // Fetch Logs
      const { data: logs } = await supabase.from('dev_logs').select('*').order('created_at', { ascending: false });
      // Fetch Mocks
      const { data: mocks } = await supabase.from('daily_mocks').select('*').order('mock_date', { ascending: false });
      // Fetch Authorized Keys
      const { data: keys } = await supabase.from('authorized_users').select('*').order('created_at', { ascending: false });
      // Fetch Admin Requests
      const { data: requests } = await supabase.from('admin_requests').select('*').order('created_at', { ascending: false });

      if (logs) setHistory(logs);
      if (mocks) setExistingMocks(mocks);
      if (keys) setActiveKeys(keys);
      if (requests) setUserRequests(requests);
    } catch (err) {
      console.error("Admin Load Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // --- 2. HANDLERS ---

  // Generate unique BRAIN access key for friends
  const generateKey = async () => {
    if (!assignedName) return alert("The Brain, enter a friend's name first.");
    const newKey = `BRAIN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const { error } = await supabase.from('authorized_users').insert([{ 
      access_key: newKey, 
      assigned_to: assignedName 
    }]);

    if (!error) {
      setAssignedName('');
      fetchAdminData();
      alert(`Access Key Primed for ${assignedName}: ${newKey}`);
    }
  };

  const handleBulkUpload = async () => {
    if (!mockTitle) return setStatus('❌ Error: Enter a Mock Title.');
    if (!bulkData) return setStatus('❌ Error: JSON field is empty.');
    
    setStatus('⏳ Processing Neural Upload...');
    try {
      const parsedQuestions = JSON.parse(bulkData);
      if (!Array.isArray(parsedQuestions)) throw new Error("JSON must be an array");

      // 🔥 SELECTIVE OVERWRITE: Only triggers if "Daily" is toggled ON
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
        mock_title: mockTitle,
        questions: parsedQuestions, 
        is_daily: isDailyQuickMock,
        is_strict: isStrict,
        time_limit: parseInt(timeLimit) || 10,
        mock_date: new Date().toISOString().split('T')[0] 
      };

      const { error } = await supabase.from('daily_mocks').insert([newMockEntry]);
      if (error) throw error;

      setStatus(`🎉 Grid Updated! Mock Live.`);
      setBulkData(''); setMockTitle(''); setIsDailyQuickMock(false); setIsStrict(false);
      fetchAdminData(); 
    } catch (err) {
      setStatus(`❌ Error: ${err.message}`);
    }
  };

  const deleteMock = async (id) => {
    if (window.confirm("The Brain, delete this mock permanently?")) {
      const { error } = await supabase.from('daily_mocks').delete().eq('id', id);
      if (error?.code === '23503') alert("🔒 LOCKED: Scores exist for this mock.");
      else fetchAdminData();
    }
  };

  const postAnnouncement = async () => {
    if (!announcement) return;
    setBroadcastStatus('Broadcasting...');
    await supabase.from('announcements').update({ active: false }).eq('active', true);
    const { error } = await supabase.from('announcements').insert([{ message: announcement, active: true }]);
    if (!error) { setBroadcastStatus('✅ Message Live!'); setAnnouncement(''); setTimeout(() => setBroadcastStatus(''), 3000); }
  };

  const saveLog = async () => {
    if (!verName || !verDesc) return;
    const { error } = await supabase.from('dev_logs').insert([{ version_name: verName, description: verDesc }]);
    if (!error) { fetchAdminData(); setVerName(''); setVerDesc(''); }
  };

  if (loading && history.length === 0) return <div className="p-20 text-center animate-pulse font-black text-blue-600">ACCESSING NEURAL ADMIN...</div>;

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto p-4 animate-in fade-in duration-700">
      
      {/* 1. BROADCAST SYSTEM */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-[32px] shadow-2xl text-white">
        <div className="flex items-center gap-3 mb-6">
          <Megaphone size={32} className="animate-bounce" />
          <h2 className="text-2xl font-black uppercase">Global Broadcast</h2>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <input className="flex-1 p-4 rounded-2xl text-gray-900 font-bold border-none outline-none focus:ring-4" placeholder="Type transmission..." value={announcement} onChange={(e) => setAnnouncement(e.target.value)} />
          <button onClick={postAnnouncement} className="bg-white text-blue-600 px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-50">BROADCAST</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* 2. MOCK CREATOR */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-xl border dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6 text-blue-600">
            <UploadCloud size={32} />
            <h2 className="text-2xl font-black uppercase dark:text-white">Mock Creator</h2>
          </div>
          <div className="space-y-4">
            <input type="text" placeholder="Mock Title" className="w-full p-4 rounded-2xl border dark:bg-gray-900 dark:border-gray-700 dark:text-white font-bold outline-none" value={mockTitle} onChange={(e) => setMockTitle(e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setIsDailyQuickMock(!isDailyQuickMock)} className={`p-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 ${isDailyQuickMock ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}><Zap size={14} /> Daily Mock</button>
              <button onClick={() => setIsStrict(!isStrict)} className={`p-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 ${isStrict ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}><ShieldAlert size={14} /> Strict Mode</button>
            </div>
            <textarea className="w-full h-40 p-4 font-mono text-[10px] border dark:bg-gray-900 dark:border-gray-700 rounded-2xl outline-none" placeholder='Paste JSON questions array...' value={bulkData} onChange={(e) => setBulkData(e.target.value)} />
            <button onClick={handleBulkUpload} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl">Publish Mock</button>
            {status && <p className="text-center font-black uppercase text-xs text-green-500">{status}</p>}
          </div>
        </div>

        {/* 3. ACCESS KEY GENERATOR */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-xl border dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6 text-indigo-600">
            <Key size={32} />
            <h2 className="text-2xl font-black uppercase dark:text-white">Authorizations</h2>
          </div>
          <div className="space-y-4 mb-6">
            <div className="flex gap-2">
              <input type="text" placeholder="Friend's Name" className="flex-1 p-4 rounded-2xl border dark:bg-gray-900 dark:border-gray-700 dark:text-white font-bold outline-none" value={assignedName} onChange={(e) => setAssignedName(e.target.value)} />
              <button onClick={generateKey} className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700"><UserPlus size={24} /></button>
            </div>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {activeKeys.map(k => (
              <div key={k.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border dark:border-gray-800 flex justify-between items-center group">
                <div>
                  <p className="font-black text-indigo-600 text-xs tracking-widest">{k.access_key}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Linked To: {k.assigned_to}</p>
                </div>
                <button onClick={async () => { await supabase.from('authorized_users').delete().eq('id', k.id); fetchAdminData(); }} className="text-gray-300 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* 4. USER REQUESTS LOG */}
        <div className="bg-gray-900 text-white p-8 rounded-[32px] shadow-2xl border border-white/5">
          <div className="flex items-center gap-3 mb-6 text-orange-400">
            <MessageSquare size={28} />
            <h2 className="text-xl font-black uppercase tracking-tight">Portal Requests</h2>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
            {userRequests.length === 0 ? (
              <p className="text-gray-500 text-center font-bold text-xs py-10">No incoming requests.</p>
            ) : (
              userRequests.map(req => (
                <div key={req.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-orange-500/50 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded text-[8px] font-black uppercase">{req.request_type}</span>
                    <span className="text-[8px] text-gray-500 font-bold">{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-300">{req.user_name}</p>
                  <p className="text-[10px] text-gray-500 italic mb-4">"{req.message}"</p>
                  <div className="flex gap-2">
                    <button onClick={async () => { await supabase.from('admin_requests').delete().eq('id', req.id); fetchAdminData(); }} className="flex-1 bg-green-600/20 text-green-400 py-2 rounded-xl font-black text-[10px] hover:bg-green-600/40 transition-all">RESOLVE</button>
                    <button onClick={async () => { await supabase.from('admin_requests').delete().eq('id', req.id); fetchAdminData(); }} className="p-2 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/40 transition-all"><X size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 5. VERSION LOGS */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-xl border dark:border-gray-700">
           <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-blue-600 uppercase tracking-tighter"><History size={24} /> Dev Logs</h3>
           <div className="space-y-3 mb-6">
            <input className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl text-sm border dark:border-gray-700 outline-none" placeholder="Version (e.g. v2.0.0)" value={verName} onChange={e => setVerName(e.target.value)} />
            <textarea className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl text-sm border dark:border-gray-700 outline-none h-20 resize-none" placeholder="Update details..." value={verDesc} onChange={e => setVerDesc(e.target.value)} />
            <button onClick={saveLog} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-indigo-700">Save Log</button>
          </div>
          <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {history.map(log => (
              <div key={log.id} className="border-l-4 border-blue-600 pl-4 py-1">
                <p className="text-blue-600 font-black text-xs uppercase">{log.version_name} • <span className="text-gray-400 text-[10px]">{new Date(log.created_at).toLocaleDateString()}</span></p>
                <p className="text-gray-500 text-[10px] leading-relaxed">{log.description}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
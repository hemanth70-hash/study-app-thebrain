import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
  UploadCloud, Database, Info, Calendar, 
  Clock, History, CheckCircle, AlertTriangle, 
  Megaphone, Trash2, ListChecks, Zap, Loader2
} from 'lucide-react';

export default function AdminPanel() {
  // --- MOCK UPLOAD STATE ---
  const [bulkData, setBulkData] = useState('');
  const [mockTitle, setMockTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(10); 
  const [isDailyQuickMock, setIsDailyQuickMock] = useState(false);
  const [status, setStatus] = useState('');
  const [existingMocks, setExistingMocks] = useState([]); // Initialized as empty array

  // --- VERSION HISTORY STATE ---
  const [verName, setVerName] = useState('');
  const [verDesc, setVerDesc] = useState('');
  const [history, setHistory] = useState([]); // Initialized as empty array

  // --- ANNOUNCEMENT STATE ---
  const [announcement, setAnnouncement] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState('');
  const [loading, setLoading] = useState(true);

  // --- 1. ATOMIC DATA FETCH ---
  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: logs } = await supabase
        .from('dev_logs')
        .select('*')
        .order('created_at', { ascending: false });
      
      const { data: mocks } = await supabase
        .from('daily_mocks')
        .select('id, mock_title, mock_date, is_daily')
        .order('mock_date', { ascending: false });

      if (logs) setHistory(logs);
      if (mocks) setExistingMocks(mocks);
    } catch (err) {
      console.error("Admin Load Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // --- HANDLERS ---
  const handleBulkUpload = async () => {
    if (!mockTitle) return setStatus('❌ Error: Enter a Mock Title.');
    if (!bulkData) return setStatus('❌ Error: JSON field is empty.');
    
    try {
      const parsedQuestions = JSON.parse(bulkData);
      if (!Array.isArray(parsedQuestions)) throw new Error("JSON must be an array");

      const newMockEntry = {
        mock_title: mockTitle,
        questions: parsedQuestions, 
        is_daily: isDailyQuickMock,
        time_limit: parseInt(timeLimit) || 10,
        mock_date: new Date().toISOString().split('T')[0] 
      };

      const { error } = await supabase.from('daily_mocks').insert([newMockEntry]);
      if (error) throw error;

      setStatus(`🎉 Success! "${mockTitle}" is live.`);
      setBulkData(''); setMockTitle(''); setIsDailyQuickMock(false); setTimeLimit(10);
      fetchAdminData(); // Refresh list
    } catch (err) {
      setStatus(`❌ Error: ${err.message}`);
    }
  };

  const deleteMock = async (id) => {
    if (window.confirm("The Brain, delete this mock permanently?")) {
      const { error } = await supabase.from('daily_mocks').delete().eq('id', id);
      if (!error) {
        setStatus('🗑️ Mock deleted.');
        fetchAdminData();
      }
    }
  };

  const saveLog = async () => {
    if (!verName || !verDesc) return;
    const { error } = await supabase.from('dev_logs').insert([{ version_name: verName, description: verDesc }]);
    if (!error) { 
      fetchAdminData(); 
      setVerName(''); 
      setVerDesc(''); 
    }
  };

  const postAnnouncement = async () => {
    if (!announcement) return;
    setBroadcastStatus('Broadcasting...');
    await supabase.from('announcements').update({ active: false }).eq('active', true);
    const { error } = await supabase.from('announcements').insert([{ message: announcement, active: true }]);
    
    if (!error) {
      setBroadcastStatus('✅ Message Live!');
      setAnnouncement('');
      setTimeout(() => setBroadcastStatus(''), 3000);
    }
  };

  // --- PREVENT BLANK SCREEN DURING INITIAL LOAD ---
  if (loading && history.length === 0 && existingMocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-blue-600">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-black uppercase tracking-widest text-xs">Accessing Neural Admin Network...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      
      {/* 1. GLOBAL ANNOUNCEMENT SYSTEM */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-[32px] shadow-2xl text-white">
        <div className="flex items-center gap-3 mb-6">
          <Megaphone size={32} className="animate-bounce" />
          <h2 className="text-2xl font-black uppercase tracking-tight">Global Broadcast</h2>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <input 
            className="flex-1 p-4 rounded-2xl text-gray-900 font-bold outline-none border-none focus:ring-4 focus:ring-blue-400 transition-all" 
            placeholder="Type announcement..." 
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
          />
          <button onClick={postAnnouncement} className="bg-white text-blue-600 px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-50 transition-all active:scale-95 shadow-lg">
            BROADCAST
          </button>
        </div>
        {broadcastStatus && <p className="mt-3 text-[10px] font-black uppercase text-blue-200 tracking-[0.2em]">{broadcastStatus}</p>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        
        {/* 2. MOCK CREATOR & MANAGEMENT */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-xl border border-blue-50 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6 text-blue-600">
            <UploadCloud size={32} />
            <h2 className="text-2xl font-black uppercase tracking-tight dark:text-white">Mock Creator</h2>
          </div>

          <div className="space-y-4 mb-6">
            <input 
              type="text" placeholder="Mock Test Title"
              className="w-full p-4 rounded-2xl border dark:bg-gray-900 dark:border-gray-700 dark:text-white font-bold outline-none focus:border-blue-500"
              value={mockTitle} onChange={(e) => setMockTitle(e.target.value)}
            />

            <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border dark:border-gray-700">
              <Clock className="text-blue-600" size={20} />
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Duration (Minutes)</p>
                <input type="number" className="w-full bg-transparent outline-none font-black text-blue-600"
                  value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} />
              </div>
            </div>

            <button onClick={() => setIsDailyQuickMock(!isDailyQuickMock)}
              className={`w-full p-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 transition-all ${
                isDailyQuickMock ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
              }`}>
              <Zap size={18} fill={isDailyQuickMock ? "currentColor" : "none"} /> {isDailyQuickMock ? "Daily Streak Mock" : "Regular Mock"}
            </button>

            <textarea 
              className="w-full h-40 p-4 font-mono text-[10px] border dark:border-gray-700 rounded-2xl dark:bg-gray-900 dark:text-white outline-none focus:border-blue-500"
              placeholder='Paste JSON array here...'
              value={bulkData} onChange={(e) => setBulkData(e.target.value)}
            />
          </div>

          <button onClick={handleBulkUpload} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl active:scale-95 transition-all mb-8">
            <Database size={20} className="inline mr-2" /> Publish Mock
          </button>
          {status && <p className={`mb-6 text-center font-black uppercase text-xs tracking-widest ${status.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{status}</p>}

          <div className="mt-8 pt-8 border-t dark:border-gray-700">
            <h3 className="text-lg font-black uppercase mb-4 flex items-center gap-2 text-gray-400 tracking-tighter">
              <ListChecks size={20} /> Active Mocks Library
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {/* FALLBACK: ensures the map doesn't break if existingMocks is null */}
              {(existingMocks || []).map(m => (
                <div key={m.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-blue-300 transition-all group">
                  <div>
                    <p className="font-bold text-sm dark:text-white">{m.mock_title}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest">{m.mock_date}</span>
                        {m.is_daily && <span className="bg-orange-100 text-orange-600 px-1 rounded text-[8px] font-black uppercase">Daily</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteMock(m.id)} className="text-gray-300 hover:text-red-500 transition-all p-2">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. VERSION HISTORY LOGGER */}
        <div className="bg-gray-900 text-white p-8 rounded-[32px] shadow-2xl flex flex-col border border-white/5">
          <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-blue-400 uppercase tracking-tighter"><History size={24} /> Version History</h3>
          <div className="space-y-3 mb-8">
            <input className="w-full bg-gray-800/50 p-4 rounded-2xl text-sm outline-none border border-white/5 focus:border-blue-500" placeholder="Version (e.g. v2.0.0)" value={verName} onChange={e => setVerName(e.target.value)} />
            <textarea className="w-full bg-gray-800/50 p-4 rounded-2xl text-sm h-24 outline-none border border-white/5 focus:border-blue-500 resize-none" placeholder="Description of changes..." value={verDesc} onChange={e => setVerDesc(e.target.value)} />
            <button onClick={saveLog} className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-lg active:scale-95 transition-all">
              Log Update
            </button>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[340px] space-y-4 custom-scrollbar pr-4">
            {/* FALLBACK: ensures the map doesn't break if history is null */}
            {(history || []).map((log) => (
              <div key={log.id} className="border-l-4 border-blue-600 pl-4 py-1 hover:bg-white/5 transition-all rounded-r-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-blue-400 text-xs uppercase tracking-widest">{log.version_name}</span>
                  <span className="text-[9px] text-gray-500 font-bold uppercase">{new Date(log.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed font-medium">{log.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
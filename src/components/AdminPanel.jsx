import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  UploadCloud, Database, Info, Calendar, 
  Clock, History, CheckCircle, AlertTriangle, Megaphone 
} from 'lucide-react';

export default function AdminPanel() {
  // --- MOCK UPLOAD STATE ---
  const [bulkData, setBulkData] = useState('');
  const [mockTitle, setMockTitle] = useState('');
  const [isDailyQuickMock, setIsDailyQuickMock] = useState(false);
  const [status, setStatus] = useState('');

  // --- VERSION HISTORY STATE ---
  const [verName, setVerName] = useState('');
  const [verDesc, setVerDesc] = useState('');
  const [history, setHistory] = useState([]);
  const [logStatus, setLogStatus] = useState('');

  // --- ANNOUNCEMENT STATE ---
  const [announcement, setAnnouncement] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState('');

  // Initial Data Load
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('dev_logs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setHistory(data || []);
  };

  // --- HANDLERS ---

  const handleBulkUpload = async () => {
    if (!mockTitle) {
      setStatus('Error: Please enter a Mock Title.');
      return;
    }
    try {
      const rawData = JSON.parse(bulkData);
      const formattedData = rawData.map(q => ({
        ...q,
        mock_title: mockTitle,
        is_daily: isDailyQuickMock 
      }));

      const { error } = await supabase.from('questions').insert(formattedData);
      if (error) throw error;

      setStatus(`Success! "${mockTitle}" uploaded.`);
      setBulkData(''); setMockTitle(''); setIsDailyQuickMock(false);
    } catch (err) {
      setStatus('Error: Check JSON format.');
    }
  };

  const saveLog = async () => {
    if (!verName || !verDesc) return setLogStatus('Error: Missing fields');
    const { error } = await supabase.from('dev_logs').insert([{ version_name: verName, description: verDesc }]);
    if (!error) {
      setLogStatus('Logged!');
      setVerName(''); setVerDesc('');
      fetchHistory();
    }
  };

  const postAnnouncement = async () => {
    if (!announcement) return;
    setBroadcastStatus('Broadcasting...');
    
    // Deactivate previous active announcements
    await supabase.from('announcements').update({ active: false }).eq('active', true);
    
    // Insert new announcement
    const { error } = await supabase.from('announcements').insert([{ message: announcement, active: true }]);
    
    if (!error) {
      setBroadcastStatus('Success: Message Live!');
      setAnnouncement('');
      setTimeout(() => setBroadcastStatus(''), 3000);
    } else {
      setBroadcastStatus('Error sending broadcast.');
    }
  };

  return (
    <div className="space-y-10 pb-20">
      
      {/* 1. GLOBAL ANNOUNCEMENT SYSTEM */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-[32px] shadow-2xl text-white">
        <div className="flex items-center gap-3 mb-6">
          <Megaphone size={32} className="animate-bounce" />
          <h2 className="text-2xl font-black uppercase tracking-tight">Global Broadcast</h2>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <input 
            className="flex-1 p-4 rounded-2xl text-gray-900 font-bold focus:ring-4 focus:ring-blue-400 outline-none" 
            placeholder="Type an announcement for all users (e.g., New Mock Added!)..." 
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
          />
          <button 
            onClick={postAnnouncement} 
            className="bg-white text-blue-600 px-10 py-4 rounded-2xl font-black hover:bg-blue-50 transition-all active:scale-95 shadow-lg"
          >
            BROADCAST
          </button>
        </div>
        {broadcastStatus && <p className="mt-3 text-xs font-bold text-blue-200 uppercase animate-pulse">{broadcastStatus}</p>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        
        {/* 2. EXAM CREATOR CENTER */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-xl border border-blue-50 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6 text-blue-600">
            <UploadCloud size={32} />
            <h2 className="text-2xl font-black uppercase tracking-tight text-gray-800 dark:text-white">Mock Creator</h2>
          </div>

          <div className="space-y-4 mb-6">
            <input 
              type="text"
              placeholder="Mock Test Title"
              className="w-full p-4 rounded-2xl border dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none"
              value={mockTitle}
              onChange={(e) => setMockTitle(e.target.value)}
            />
            <button 
              onClick={() => setIsDailyQuickMock(!isDailyQuickMock)}
              className={`w-full p-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 transition-all ${
                isDailyQuickMock ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
              }`}
            >
              <Calendar size={18} /> {isDailyQuickMock ? "Set as Daily Streak Mock" : "Regular Mock Test"}
            </button>
            <textarea 
              className="w-full h-40 p-4 font-mono text-sm border dark:border-gray-700 rounded-2xl dark:bg-gray-900 dark:text-white outline-none"
              placeholder='Paste JSON array here...'
              value={bulkData}
              onChange={(e) => setBulkData(e.target.value)}
            />
          </div>

          <button onClick={handleBulkUpload} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg active:scale-95 transition-all">
            <Database size={20} className="inline mr-2" /> Publish Mock
          </button>
          {status && <p className="mt-4 text-center font-bold text-sm text-blue-500">{status}</p>}
        </div>

        {/* 3. VERSION HISTORY LOGGER */}
        <div className="bg-gray-900 text-white p-8 rounded-[32px] shadow-2xl flex flex-col">
          <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-blue-400 uppercase">
            <History size={24} /> Version History
          </h3>
          
          <div className="space-y-3 mb-8">
            <input 
              className="w-full bg-gray-800 border-none p-4 rounded-2xl text-sm font-bold" 
              placeholder="Version (e.g. v1.2.0)" 
              value={verName} onChange={e => setVerName(e.target.value)} 
            />
            <textarea 
              className="w-full bg-gray-800 border-none p-4 rounded-2xl text-sm h-20" 
              placeholder="Changes..." 
              value={verDesc} onChange={e => setVerDesc(e.target.value)} 
            />
            <button onClick={saveLog} className="w-full bg-blue-600 py-3 rounded-2xl font-black uppercase text-xs tracking-widest">
              Log Update
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-64 pr-2 space-y-4 custom-scrollbar">
            {history.map((log) => (
              <div key={log.id} className="border-l-4 border-blue-600 pl-4 py-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-blue-400 text-xs uppercase">{log.version_name}</span>
                  <span className="text-[9px] text-gray-500 font-bold">
                    {new Date(log.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">{log.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800 flex gap-4">
        <Info className="text-blue-600 shrink-0" />
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>The Brain's Dashboard Tip:</strong> Announcements appear at the top of every user's screen. Use them for server maintenance, new test alerts, or high-score celebrations.
        </p>
      </div>
    </div>
  );
}
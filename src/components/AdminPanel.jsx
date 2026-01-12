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
  const [timeLimit, setTimeLimit] = useState(60); 
  const [isDailyQuickMock, setIsDailyQuickMock] = useState(false);
  const [status, setStatus] = useState('');

  // --- VERSION HISTORY STATE ---
  const [verName, setVerName] = useState('');
  const [verDesc, setVerDesc] = useState('');
  const [history, setHistory] = useState([]);

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
      // 1. Parse the JSON array of questions
      const parsedQuestions = JSON.parse(bulkData);

      // 2. Prepare the SINGLE row for 'daily_mocks' table
      const newMockEntry = {
        mock_title: mockTitle,
        questions: parsedQuestions, // Stores the whole array in the JSONB column
        is_daily: isDailyQuickMock,
        time_limit: parseInt(timeLimit),
        mock_date: new Date().toISOString().split('T')[0] // Sets today's date
      };

      // 3. Insert into the NEW 'daily_mocks' table
      const { error } = await supabase
        .from('daily_mocks')
        .insert([newMockEntry]);

      if (error) throw error;

      setStatus(`🎉 Success! "${mockTitle}" is now live.`);
      setBulkData(''); 
      setMockTitle(''); 
      setIsDailyQuickMock(false); 
      setTimeLimit(60);
      
    } catch (err) {
      console.error(err);
      setStatus('❌ Error: Check JSON format or daily_mocks columns.');
    }
  };

  // ... (Announcement and Log functions remain same)
  const saveLog = async () => {
    if (!verName || !verDesc) return;
    const { error } = await supabase.from('dev_logs').insert([{ version_name: verName, description: verDesc }]);
    if (!error) { fetchHistory(); setVerName(''); setVerDesc(''); }
  };

  const postAnnouncement = async () => {
    if (!announcement) return;
    await supabase.from('announcements').update({ active: false }).eq('active', true);
    await supabase.from('announcements').insert([{ message: announcement, active: true }]);
    setAnnouncement('');
  };
  const [announcement, setAnnouncement] = useState('');

  return (
    <div className="space-y-10 pb-20">
      {/* GLOBAL ANNOUNCEMENT */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-[32px] shadow-2xl text-white">
        <div className="flex items-center gap-3 mb-6">
          <Megaphone size={32} className="animate-bounce" />
          <h2 className="text-2xl font-black uppercase tracking-tight">Global Broadcast</h2>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <input 
            className="flex-1 p-4 rounded-2xl text-gray-900 font-bold outline-none" 
            placeholder="Type announcement..." 
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
          />
          <button onClick={postAnnouncement} className="bg-white text-blue-600 px-10 py-4 rounded-2xl font-black hover:bg-blue-50 transition-all">
            BROADCAST
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* MOCK CREATOR */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-xl border border-blue-50 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6 text-blue-600">
            <UploadCloud size={32} />
            <h2 className="text-2xl font-black uppercase tracking-tight dark:text-white">Mock Creator</h2>
          </div>

          <div className="space-y-4 mb-6">
            <input 
              type="text"
              placeholder="Mock Test Title"
              className="w-full p-4 rounded-2xl border dark:bg-gray-900 dark:border-gray-700 dark:text-white font-bold outline-none"
              value={mockTitle}
              onChange={(e) => setMockTitle(e.target.value)}
            />

            <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border dark:border-gray-700">
              <Clock className="text-blue-600" size={20} />
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Duration (Minutes)</p>
                <input 
                  type="number"
                  className="w-full bg-transparent outline-none font-black text-blue-600"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                />
              </div>
            </div>

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

          <button onClick={handleBulkUpload} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg transition-all">
            <Database size={20} className="inline mr-2" /> Publish to Database
          </button>
          {status && <p className={`mt-4 text-center font-bold text-sm ${status.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{status}</p>}
        </div>

        {/* VERSION HISTORY */}
        <div className="bg-gray-900 text-white p-8 rounded-[32px] shadow-2xl flex flex-col">
          <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-blue-400 uppercase"><History size={24} /> Version History</h3>
          <div className="space-y-3 mb-8">
            <input className="w-full bg-gray-800 p-4 rounded-2xl text-sm" placeholder="Version..." value={verName} onChange={e => setVerName(e.target.value)} />
            <textarea className="w-full bg-gray-800 p-4 rounded-2xl text-sm h-20" placeholder="Changes..." value={verDesc} onChange={e => setVerDesc(e.target.value)} />
            <button onClick={saveLog} className="w-full bg-blue-600 py-3 rounded-2xl font-black uppercase text-xs">Log Update</button>
          </div>
          <div className="flex-1 overflow-y-auto max-h-64 space-y-4">
            {history.map((log) => (
              <div key={log.id} className="border-l-4 border-blue-600 pl-4 py-1">
                <span className="font-black text-blue-400 text-xs uppercase">{log.version_name}</span>
                <p className="text-gray-400 text-xs">{log.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  UploadCloud, Database, Info, Calendar, 
  Clock, History, CheckCircle, AlertTriangle 
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

  // Fetch history on component load
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

      setStatus(`Success! "${mockTitle}" uploaded with ${formattedData.length} questions.`);
      setBulkData('');
      setMockTitle('');
      setIsDailyQuickMock(false);
    } catch (err) {
      setStatus('Error: Check your JSON format or database connection.');
    }
  };

  const saveLog = async () => {
    if (!verName || !verDesc) {
      setLogStatus('Error: Fill in both fields.');
      return;
    }

    const { error } = await supabase.from('dev_logs').insert([
      { version_name: verName, description: verDesc }
    ]);

    if (!error) {
      setLogStatus('Update logged successfully!');
      setVerName(''); 
      setVerDesc('');
      fetchHistory();
      setTimeout(() => setLogStatus(''), 3000);
    } else {
      setLogStatus('Error saving log.');
    }
  };

  return (
    <div className="space-y-10">
      {/* SECTION 1: EXAM CREATOR */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-xl border border-blue-50 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6 text-blue-600">
          <UploadCloud size={32} />
          <h2 className="text-2xl font-black uppercase tracking-tight text-gray-800 dark:text-white">
            Exam Creator Center
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">Mock Test Title</label>
            <input 
              type="text"
              placeholder="e.g., Mid-Term Mock 01"
              className="w-full p-4 rounded-2xl border dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={mockTitle}
              onChange={(e) => setMockTitle(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <button 
              onClick={() => setIsDailyQuickMock(!isDailyQuickMock)}
              className={`w-full p-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all ${
                isDailyQuickMock 
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              <Calendar size={18} />
              {isDailyQuickMock ? "Set as Today's Quick Mock" : "Set as Regular Mock Test"}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">JSON Question Data</label>
          <textarea 
            className="w-full h-48 p-4 font-mono text-sm border dark:border-gray-700 rounded-2xl dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder='[{"question": "...", "options": ["A", "B"], "correct_option": 0, "subject": "math"}]'
            value={bulkData}
            onChange={(e) => setBulkData(e.target.value)}
          />
        </div>

        <button 
          onClick={handleBulkUpload} 
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 dark:shadow-none flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <Database size={20} /> Publish Mock Exam
        </button>

        {status && (
          <div className={`mt-6 p-4 rounded-2xl font-bold text-sm text-center flex items-center justify-center gap-2 ${
            status.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
          }`}>
            {status.includes('Error') ? <AlertTriangle size={18}/> : <CheckCircle size={18}/>}
            {status}
          </div>
        )}
      </div>

      {/* SECTION 2: VERSION HISTORY LOGGER */}
      <div className="bg-gray-900 text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
          <History size={150} />
        </div>

        <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-blue-400 uppercase tracking-tighter">
          <Clock size={28} /> Version History Log
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10 relative z-10">
          <input 
            className="bg-gray-800 border-none p-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500" 
            placeholder="Version (e.g. v1.2.0)" 
            value={verName} 
            onChange={e => setVerName(e.target.value)} 
          />
          <input 
            className="bg-gray-800 border-none p-4 rounded-2xl text-sm lg:col-span-1 focus:ring-2 focus:ring-blue-500" 
            placeholder="Description of changes..." 
            value={verDesc} 
            onChange={e => setVerDesc(e.target.value)} 
          />
          <button 
            onClick={saveLog} 
            className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
          >
            Log Update
          </button>
        </div>

        {logStatus && <p className="mb-4 text-xs font-bold text-blue-400 animate-pulse">{logStatus}</p>}

        <div className="space-y-6 max-h-80 overflow-y-auto pr-4 custom-scrollbar">
          {history.length > 0 ? history.map((log) => (
            <div key={log.id} className="group relative border-l-4 border-blue-600 pl-6 py-2 transition-all hover:border-blue-400">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-blue-500 text-sm">{log.version_name}</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  {new Date(log.created_at).toLocaleDateString()} — {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{log.description}</p>
            </div>
          )) : (
            <p className="text-gray-600 text-sm italic italic">No version logs found. Start by adding one above.</p>
          )}
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800 flex gap-4">
        <Info className="text-blue-600 shrink-0" />
        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
          <strong>The Brain's Dashboard Tip:</strong> Use the <strong>Version History</strong> to communicate updates to your users. It creates a professional audit trail of every fix and feature you implement.
        </p>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { UploadCloud, Database, Info, Calendar } from 'lucide-react';

export default function AdminPanel() {
  const [bulkData, setBulkData] = useState('');
  const [mockTitle, setMockTitle] = useState('');
  const [isDailyQuickMock, setIsDailyQuickMock] = useState(false);
  const [status, setStatus] = useState('');

  const handleBulkUpload = async () => {
    if (!mockTitle) {
      setStatus('Error: Please enter a Mock Title.');
      return;
    }

    try {
      // 1. Parse the JSON
      const rawData = JSON.parse(bulkData);
      
      // 2. Format the data to include the Mock Title
      const formattedData = rawData.map(q => ({
        ...q,
        mock_title: mockTitle,
        // If it's the Daily Quick Mock, we can tag it specifically
        is_daily: isDailyQuickMock 
      }));

      // 3. Insert into 'questions' table
      const { error } = await supabase.from('questions').insert(formattedData);
      
      if (error) throw error;

      setStatus(`Success! "${mockTitle}" uploaded with ${formattedData.length} questions.`);
      setBulkData('');
      setMockTitle('');
      setIsDailyQuickMock(false);
    } catch (err) {
      console.error(err);
      setStatus('Error: Check your JSON format or database connection.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-blue-50">
        <div className="flex items-center gap-3 mb-6 text-blue-600">
          <UploadCloud size={32} />
          <h2 className="text-2xl font-black uppercase tracking-tight text-gray-800 dark:text-white">
            Exam Creator Center
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">Mock Test Title</label>
            <input 
              type="text"
              placeholder="e.g., Mid-Term Mock 01"
              className="w-full p-3 rounded-xl border dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={mockTitle}
              onChange={(e) => setMockTitle(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <button 
              onClick={() => setIsDailyQuickMock(!isDailyQuickMock)}
              className={`w-full p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                isDailyQuickMock 
                ? 'bg-orange-500 text-white shadow-lg' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
              }`}
            >
              <Calendar size={20} />
              {isDailyQuickMock ? "Set as Today's Quick Mock" : "Regular Mock Test"}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">JSON Data (Questions Array)</label>
          <textarea 
            className="w-full h-64 p-4 font-mono text-sm border rounded-2xl dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder='[{"question": "...", "options": ["A", "B"], "correct_option": 0, "subject": "math"}]'
            value={bulkData}
            onChange={(e) => setBulkData(e.target.value)}
          />
        </div>

        <button 
          onClick={handleBulkUpload} 
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <Database size={20} /> Publish Mock Exam
        </button>

        {status && (
          <div className={`mt-6 p-4 rounded-xl font-bold text-center ${status.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {status}
          </div>
        )}
      </div>

      {/* Helpful Tip for the Admin */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 flex gap-4">
        <Info className="text-blue-600 shrink-0" />
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>The Brain's Tip:</strong> When you mark a test as the <strong>Quick Mock</strong>, it will appear as the primary challenge for users to maintain their <strong>Attendance Streak</strong>.
        </p>
      </div>
    </div>
  );
}
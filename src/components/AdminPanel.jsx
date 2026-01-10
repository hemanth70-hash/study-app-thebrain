import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { UploadCloud, Database } from 'lucide-react';

export default function AdminPanel() {
  const [bulkData, setBulkData] = useState('');
  const [status, setStatus] = useState('');

  const handleBulkUpload = async () => {
    try {
      const parsedData = JSON.parse(bulkData);
      const { error } = await supabase.from('questions').insert(parsedData);
      if (error) throw error;
      setStatus('Success! Questions uploaded.');
      setBulkData('');
    } catch (err) {
      setStatus('Error: Check your JSON format.');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-blue-100">
      <div className="flex items-center gap-3 mb-6 text-blue-600">
        <UploadCloud size={32} />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Bulk Upload Questions</h2>
      </div>
      <textarea 
        className="w-full h-64 p-4 font-mono text-sm border rounded-xl mb-4 dark:bg-gray-900 dark:text-white"
        placeholder='Paste JSON here...'
        value={bulkData}
        onChange={(e) => setBulkData(e.target.value)}
      />
      <button onClick={handleBulkUpload} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2">
        <Database size={20} /> Push to Database
      </button>
      {status && <p className="mt-4 font-bold text-green-600">{status}</p>}
    </div>
  );
}
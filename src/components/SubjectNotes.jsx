import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Lightbulb, Save, Edit3, Loader2, BookOpen, Clock } from 'lucide-react';

export default function SubjectNotes({ user }) {
  const [questions, setQuestions] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [personalNote, setPersonalNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch all questions to build the subject list and preview cards
  const fetchData = async () => {
    const { data: qData } = await supabase.from('questions').select('*');
    if (qData && qData.length > 0) {
      setQuestions(qData);
      const uniqueSubjects = [...new Set(qData.map(n => 
        n.subject.charAt(0).toUpperCase() + n.subject.slice(1).toLowerCase()
      ))];
      setSelectedSubject(uniqueSubjects[0]);
    }
  };

  // Automatically load the saved note whenever you switch subjects
  useEffect(() => {
    if (selectedSubject) fetchPersonalNote();
  }, [selectedSubject]);

  const fetchPersonalNote = async () => {
    const { data } = await supabase
      .from('subject_notes')
      .select('content, updated_at')
      .eq('user_id', user.id)
      .eq('subject', selectedSubject)
      .single();
    
    setPersonalNote(data?.content || '');
    if (data?.updated_at) setLastSaved(new Date(data.updated_at).toLocaleTimeString());
  };

  const handleSaveNote = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('subject_notes')
      .upsert({ 
        user_id: user.id, 
        subject: selectedSubject, 
        content: personalNote,
        updated_at: new Date()
      }, { onConflict: 'user_id,subject' }); // Ensures notes are updated, not duplicated
    
    if (!error) {
        setLastSaved(new Date().toLocaleTimeString());
    }
    setTimeout(() => setIsSaving(false), 500);
  };

  const subjects = [...new Set(questions.map(n => 
    n.subject.charAt(0).toUpperCase() + n.subject.slice(1).toLowerCase()
  ))];

  return (
    <div className="space-y-6 pb-20">
      {/* 1. SUBJECT SUB-MENU */}
      <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-blue-50 dark:border-gray-700">
        <div className="flex items-center gap-2 px-3 mr-2 border-r dark:border-gray-700 text-blue-600 font-black text-xs uppercase">
            <BookOpen size={16} /> Library
        </div>
        {subjects.map((sub) => (
          <button 
            key={sub}
            onClick={() => setSelectedSubject(sub)}
            className={`px-6 py-2 rounded-xl font-bold transition-all duration-300 text-sm ${
              selectedSubject === sub 
              ? 'bg-blue-600 text-white shadow-lg scale-105' 
              : 'text-gray-500 hover:bg-blue-50 dark:hover:bg-gray-700'
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* 2. QUESTION PREVIEW CARDS (Top Section) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {questions.filter(n => (n.subject.toLowerCase() === selectedSubject?.toLowerCase())).slice(0, 4).map((note, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border-l-4 border-blue-500 group hover:shadow-xl transition-all">
             <div className="flex items-start gap-4">
                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-500">
                    <Lightbulb size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 dark:text-white mb-2 leading-tight">{note.question}</h4>
                  <p className="text-blue-600 text-xs font-black bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg inline-block uppercase tracking-wider">
                    Ans: {note.options[note.correct_option]}
                  </p>
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* 3. PERSONAL NOTEPAD (Bottom Section) */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] border-2 border-blue-50 dark:border-gray-700 shadow-xl relative overflow-hidden">
        {/* Subtle Background Icon */}
        <Edit3 className="absolute -right-4 -bottom-4 text-blue-500/5 rotate-12" size={180} />

        <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">
                    {selectedSubject} Master Note
                </h3>
                {lastSaved && (
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        <Clock size={12} /> Last synced: {lastSaved}
                    </div>
                )}
              </div>
              
              <button 
                onClick={handleSaveNote}
                disabled={isSaving}
                className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 active:scale-95"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {isSaving ? 'Syncing...' : 'Save to Cloud'}
              </button>
            </div>

            <textarea 
              className="w-full h-64 p-8 rounded-[2rem] border-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 bg-gray-50 dark:bg-gray-900 dark:text-white shadow-inner resize-none font-medium leading-relaxed"
              placeholder={`Write down your complex formulas or concepts for ${selectedSubject} here...`}
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value)}
            />
        </div>
      </div>
    </div>
  );
}
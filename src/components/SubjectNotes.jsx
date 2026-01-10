import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Lightbulb, Save, Edit3, Loader2 } from 'lucide-react';

export default function SubjectNotes({ user }) {
  const [questions, setQuestions] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [personalNote, setPersonalNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch both questions (for cards) and existing personal notes
  const fetchData = async () => {
    const { data: qData } = await supabase.from('questions').select('*');
    if (qData) {
      setQuestions(qData);
      const uniqueSubjects = [...new Set(qData.map(n => 
        n.subject.charAt(0).toUpperCase() + n.subject.slice(1).toLowerCase()
      ))];
      setSelectedSubject(uniqueSubjects[0]);
    }
  };

  // Fetch the specific note for the selected subject
  useEffect(() => {
    if (selectedSubject) fetchPersonalNote();
  }, [selectedSubject]);

  const fetchPersonalNote = async () => {
    const { data } = await supabase
      .from('subject_notes')
      .select('content')
      .eq('user_id', user.id)
      .eq('subject', selectedSubject)
      .single();
    setPersonalNote(data?.content || '');
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
      }, { onConflict: 'user_id,subject' });
    
    setTimeout(() => setIsSaving(false), 500);
  };

  const subjects = [...new Set(questions.map(n => 
    n.subject.charAt(0).toUpperCase() + n.subject.slice(1).toLowerCase()
  ))];

  return (
    <div className="space-y-6">
      {/* SUB-MENU */}
      <div className="flex flex-wrap gap-2 p-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-blue-50">
        {subjects.map((sub) => (
          <button 
            key={sub}
            onClick={() => setSelectedSubject(sub)}
            className={`px-6 py-2 rounded-xl font-bold transition-all duration-300 ${
              selectedSubject === sub 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'text-gray-500 hover:bg-blue-50 dark:hover:bg-gray-700'
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* TOP SECTION: QUESTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {questions.filter(n => (n.subject.toLowerCase() === selectedSubject?.toLowerCase())).map((note, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border-t-4 border-blue-500">
             <div className="flex items-start gap-4">
                <Lightbulb className="text-yellow-500 shrink-0" size={24} />
                <div>
                  <h4 className="font-bold text-gray-800 dark:text-white mb-2">{note.question}</h4>
                  <p className="text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg inline-block">
                    {note.options[note.correct_option]}
                  </p>
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* BOTTOM SECTION: PERSONAL NOTEPAD */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 p-8 rounded-3xl border-2 border-white dark:border-gray-700 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Edit3 size={20} />
            <h3 className="text-lg font-black uppercase">Personal Study Notes: {selectedSubject}</h3>
          </div>
          <button 
            onClick={handleSaveNote}
            disabled={isSaving}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {isSaving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
        <textarea 
          className="w-full h-48 p-6 rounded-2xl border-none focus:ring-4 focus:ring-indigo-200 dark:bg-gray-800 dark:text-white shadow-inner resize-none font-medium"
          placeholder={`Type your key takeaways for ${selectedSubject} here...`}
          value={personalNote}
          onChange={(e) => setPersonalNote(e.target.value)}
        />
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Lightbulb, Save, Edit3, Loader2, BookOpen, 
  Clock, Download, FileText, Trash2 
} from 'lucide-react';
import { jsPDF } from "jspdf";

export default function SubjectNotes({ user }) {
  const [questions, setQuestions] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [personalNote, setPersonalNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [allNotes, setAllNotes] = useState([]);

  useEffect(() => {
    fetchData();
    fetchAllNotes();
  }, []);

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

  const fetchAllNotes = async () => {
    const { data } = await supabase
      .from('subject_notes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (data) setAllNotes(data);
  };

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
      }, { onConflict: 'user_id,subject' });
    
    if (!error) {
        setLastSaved(new Date().toLocaleTimeString());
        fetchAllNotes();
    }
    setTimeout(() => setIsSaving(false), 500);
  };

  // --- DELETE NOTE LOGIC ---
  const handleDeleteNote = async (id) => {
    const confirmDelete = window.confirm("The Brain, are you sure you want to delete this note permanently?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from('subject_notes')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchAllNotes(); // Refresh the list after deletion
      if (allNotes.find(n => n.id === id)?.subject === selectedSubject) {
        setPersonalNote(''); // Clear the editor if the active note was deleted
      }
    }
  };

  // --- PDF GENERATION LOGIC ---
  const downloadAsPDF = (note) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235);
    doc.text(`${note.subject} Study Notes`, 20, 20);
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175);
    doc.text(`The Brain Portal - Retrieved on ${new Date(note.updated_at).toLocaleString()}`, 20, 30);
    doc.line(20, 35, 190, 35);
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    const splitText = doc.splitTextToSize(note.content, 170);
    doc.text(splitText, 20, 45);
    doc.save(`${note.subject}_Notes.pdf`);
  };

  const subjects = [...new Set(questions.map(n => 
    n.subject.charAt(0).toUpperCase() + n.subject.slice(1).toLowerCase()
  ))];

  return (
    <div className="space-y-10 pb-20">
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

      {/* 2. PERSONAL NOTEPAD EDITOR */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] border-2 border-blue-50 dark:border-gray-700 shadow-xl relative overflow-hidden">
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
                className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-lg transition-all"
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

      {/* 3. MASTER RETRIEVAL SECTION WITH DELETE */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="text-blue-600" size={24} />
          <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Master Notebook</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {allNotes.map((note) => (
            <div key={note.id} className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col justify-between group transition-all hover:border-blue-500">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-4 py-1 rounded-xl text-[10px] font-black uppercase">
                    {note.subject}
                  </span>
                  <div className="flex gap-3">
                    <button 
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                        title="Delete Note"
                    >
                        <Trash2 size={16} />
                    </button>
                    <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold uppercase">
                        <Clock size={10} /> {new Date(note.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-6 font-medium leading-relaxed">
                  {note.content || 'No content saved yet...'}
                </p>
              </div>
              
              <button 
                onClick={() => downloadAsPDF(note)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-gray-900 text-gray-500 hover:bg-blue-600 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
              >
                <Download size={14} /> Download PDF
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Lightbulb, Save, Edit3, Loader2, BookOpen, 
  Clock, Download, FileText, Trash2, PlusCircle
} from 'lucide-react';
import { jsPDF } from "jspdf";

export default function SubjectNotes({ user }) {
  // --- 1. DEFINE CORE SUBJECTS ---
  const coreSubjects = ["Math", "General Awareness", "Current Affairs", "Other"];
  
  const [selectedSubject, setSelectedSubject] = useState(coreSubjects[0]);
  const [personalNote, setPersonalNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [allNotes, setAllNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllNotes();
  }, [user.id]);

  useEffect(() => {
    if (selectedSubject) fetchPersonalNote();
  }, [selectedSubject, user.id]);

  const fetchAllNotes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('subject_notes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (data) setAllNotes(data);
    setLoading(false);
  };

  const fetchPersonalNote = async () => {
    const { data } = await supabase
      .from('subject_notes')
      .select('content, updated_at')
      .eq('user_id', user.id)
      .eq('subject', selectedSubject)
      .maybeSingle(); // Better than .single() to avoid errors if missing
    
    setPersonalNote(data?.content || '');
    if (data?.updated_at) {
        setLastSaved(new Date(data.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } else {
        setLastSaved(null);
    }
  };

  const handleSaveNote = async () => {
    if (!personalNote.trim()) return;
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
        setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        fetchAllNotes();
    }
    setTimeout(() => setIsSaving(false), 600);
  };

  const handleDeleteNote = async (id) => {
    const confirmDelete = window.confirm("The Brain, delete this note permanently?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from('subject_notes')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchAllNotes();
      if (allNotes.find(n => n.id === id)?.subject === selectedSubject) {
        setPersonalNote('');
        setLastSaved(null);
      }
    }
  };

  const downloadAsPDF = (note) => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235);
    doc.text(`${note.subject} Study Notes`, 20, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(156, 163, 175);
    doc.text(`Retrieved from The Brain Portal on ${new Date(note.updated_at).toLocaleString()}`, 20, 30);
    doc.line(20, 35, 190, 35);
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    const splitText = doc.splitTextToSize(note.content, 170);
    doc.text(splitText, 20, 45);
    doc.save(`${note.subject}_Notes.pdf`);
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      
      {/* 1. FIXED SUBJECT NAVIGATION */}
      <div className="flex flex-wrap gap-3 p-4 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-blue-50 dark:border-gray-700">
        <div className="flex items-center gap-2 px-4 border-r dark:border-gray-700 text-blue-600 font-black text-xs uppercase tracking-widest">
            <BookOpen size={18} /> Library
        </div>
        {coreSubjects.map((sub) => (
          <button 
            key={sub}
            onClick={() => setSelectedSubject(sub)}
            className={`px-6 py-2.5 rounded-2xl font-black transition-all text-xs uppercase tracking-tighter ${
              selectedSubject === sub 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105' 
              : 'text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-700'
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* 2. ENHANCED EDITOR */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border-2 border-blue-50 dark:border-gray-700 shadow-xl relative">
        <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
              <div className="space-y-1">
                <h3 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">
                    {selectedSubject} Notes
                </h3>
                {lastSaved && (
                    <div className="flex items-center gap-1.5 text-[10px] text-green-500 font-black uppercase tracking-widest">
                        <CheckCircle size={12} /> Synced at {lastSaved}
                    </div>
                )}
              </div>
              <button 
                onClick={handleSaveNote}
                disabled={isSaving}
                className="flex items-center gap-3 bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {isSaving ? 'Saving...' : 'Sync to Cloud'}
              </button>
            </div>
            <textarea 
              className="w-full h-80 p-8 rounded-[2rem] border-none focus:ring-8 focus:ring-blue-100 dark:focus:ring-blue-900/10 bg-gray-50 dark:bg-gray-900 dark:text-white shadow-inner resize-none font-medium leading-relaxed text-lg"
              placeholder={`Synthesize your ${selectedSubject} knowledge here...`}
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value)}
            />
        </div>
      </div>

      {/* 3. RETRIEVAL VAULT */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <FileText className="text-blue-600" size={28} />
                <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Knowledge Vault</h2>
            </div>
            <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800 mx-6 hidden md:block"></div>
        </div>
        
        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1,2,3].map(i => <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-[2.5rem]"></div>)}
            </div>
        ) : allNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {allNotes.map((note) => (
                <div key={note.id} className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-xl border border-transparent hover:border-blue-500 transition-all group flex flex-col justify-between h-full">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <span className="bg-blue-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter">
                        {note.subject}
                      </span>
                      <button 
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-4 mb-8 font-medium leading-relaxed">
                      {note.content}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[9px] text-gray-400 font-black uppercase tracking-widest px-1">
                        <Clock size={12} /> {new Date(note.updated_at).toLocaleDateString()}
                    </div>
                    <button 
                        onClick={() => downloadAsPDF(note)}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-gray-50 dark:bg-gray-900 text-gray-500 hover:bg-blue-600 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm"
                    >
                        <Download size={16} /> Export as PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
        ) : (
            <div className="bg-gray-50 dark:bg-gray-900/50 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[32px] p-20 text-center">
                <PlusCircle className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No notes in the vault yet. Start writing above!</p>
            </div>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Youtube, PenTool, Save, Trash2, FileDown, 
  Loader2, Book, ExternalLink, PlayCircle 
} from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function StudyHub({ user }) {
  // --- STATES ---
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);

  // --- 1. INITIAL LOAD: FETCH PDF LIBRARY ---
  useEffect(() => {
    const fetchBooks = async () => {
      setLoadingBooks(true);
      const { data, error } = await supabase.from('study_resources').select('*').order('created_at', { ascending: false });
      if (!error && data) setBooks(data);
      setLoadingBooks(false);
    };
    fetchBooks();
  }, []);

  // --- 2. VIDEO LOGIC: EXTRACT & LOAD EXISTING NOTES ---
  const extractAndLoad = async () => {
    const id = videoUrl.split('v=')[1]?.split('&')[0] || videoUrl.split('/').pop();
    if (!id) return;
    setVideoId(id);

    // Fetch existing note for this specific video + user
    const { data, error } = await supabase
      .from('video_notes')
      .select('note_content')
      .eq('user_id', user.id)
      .eq('video_id', id)
      .maybeSingle();

    if (data) setNote(data.note_content);
    else setNote(""); // Reset notepad for new video
  };

  // --- 3. PERSISTENCE: SAVE TO SUPABASE ---
  const saveNotes = async () => {
    if (!videoId) return alert("Load a video first.");
    setSaving(true);
    
    const { error } = await supabase
      .from('video_notes')
      .upsert({ 
        user_id: user.id, 
        video_id: videoId, 
        note_content: note,
        updated_at: new Date() 
      }, { onConflict: 'user_id, video_id' });

    if (!error) {
      setLastSaved(new Date().toLocaleTimeString());
    } else {
      console.error("Save Error:", error.message);
    }
    setSaving(false);
  };

  // --- 4. EXPORT: CONVERT TO PDF ---
  const exportPDF = () => {
    if (!note) return alert("Note is empty.");
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.text(`Neural Study Notes - Video ID: ${videoId}`, 10, 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    
    const splitText = doc.splitTextToSize(note, 180);
    doc.text(splitText, 10, 20);
    
    doc.save(`Neural_Notes_${videoId}.pdf`);
  };

  // --- 5. CLEANUP: DELETE FROM GRID ---
  const deleteNotes = async () => {
    if (!window.confirm("Wipe these notes from the Neural Grid permanently?")) return;
    const { error } = await supabase
      .from('video_notes')
      .delete()
      .eq('user_id', user.id)
      .eq('video_id', videoId);
    
    if (!error) {
      setNote("");
      setLastSaved(null);
    }
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      
      {/* 📘 SECTION 1: NEURAL LIBRARY (PDFs) */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] shadow-2xl border-b-8 border-orange-500 overflow-hidden relative">
        <div className="flex items-center gap-3 mb-8">
          <Book className="text-orange-500" size={32} />
          <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Neural Library</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingBooks ? (
            <div className="col-span-full py-10 flex justify-center"><Loader2 className="animate-spin text-orange-500" /></div>
          ) : books.length > 0 ? (
            books.map(book => (
              <div key={book.id} className="p-6 bg-gray-50 dark:bg-gray-900 rounded-[2rem] border-2 border-transparent hover:border-orange-500 transition-all group shadow-sm">
                <span className="text-[9px] font-black uppercase text-orange-500 bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full">{book.category}</span>
                <h4 className="font-bold dark:text-white mt-3 mb-4 line-clamp-1">{book.title}</h4>
                <a 
                  href={book.file_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-xl text-xs font-black uppercase text-gray-500 hover:text-orange-500 transition-all border border-gray-100 dark:border-gray-700 shadow-sm"
                >
                  Access PDF <ExternalLink size={14} />
                </a>
              </div>
            ))
          ) : (
            <div className="col-span-full py-10 text-center text-gray-400 font-bold uppercase text-xs italic tracking-widest opacity-50">No resources synced to grid yet.</div>
          )}
        </div>
      </div>

      {/* 🎥 SECTION 2: STUDY WORKSPACE (SIDE-BY-SIDE) */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-xl flex flex-wrap gap-4 border dark:border-gray-700">
          <div className="flex-1 relative min-w-[300px]">
            <input 
              className="w-full bg-gray-50 dark:bg-gray-900 p-4 pl-12 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-red-500 transition-all dark:text-white"
              placeholder="Paste YouTube Lecture Link..." 
              value={videoUrl} 
              onChange={e => setVideoUrl(e.target.value)} 
            />
            <Youtube className="absolute left-4 top-4 text-red-500" size={20} />
          </div>
          <button onClick={extractAndLoad} className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 shadow-lg active:scale-95 transition-all">
            Load Lecture
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[700px]">
          {/* LEFT: VIDEO PLAYER (3/5) */}
          <div className="lg:col-span-3 bg-black rounded-[3rem] overflow-hidden shadow-2xl border-4 border-gray-100 dark:border-gray-800 relative">
            {videoId ? (
              <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}`} title="Neural Player" frameBorder="0" allowFullScreen></iframe>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                 <PlayCircle size={80} className="opacity-10 animate-pulse" />
                 <p className="font-black uppercase text-xs tracking-[0.3em]">Awaiting Visual Input</p>
              </div>
            )}
          </div>

          {/* RIGHT: NEURAL NOTEPAD (2/5) */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl border dark:border-gray-700 flex flex-col overflow-hidden">
             <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                <div className="flex items-center gap-2 text-blue-600">
                  <PenTool size={20} />
                  <h3 className="font-black uppercase text-xs tracking-widest">Neural Notepad</h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={exportPDF} title="Export PDF" className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><FileDown size={20}/></button>
                  <button onClick={deleteNotes} title="Delete Notes" className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                  <button onClick={saveNotes} disabled={saving} className="p-2 text-green-600 hover:scale-110 transition-all">
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  </button>
                </div>
             </div>
             
             <div className="flex-1 relative">
               <textarea 
                 className="w-full h-full p-8 bg-transparent outline-none font-medium text-sm leading-relaxed dark:text-gray-200 resize-none custom-scrollbar"
                 placeholder="Begin knowledge synthesis... (Notes auto-save when you click save button)"
                 value={note}
                 onChange={e => setNote(e.target.value)}
               />
               {lastSaved && (
                 <div className="absolute bottom-4 right-6 text-[8px] font-black text-green-500 uppercase bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                   Grid Synced at {lastSaved}
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Youtube, PenTool, Save, Trash2, FileDown, 
  Loader2, Book, ExternalLink, PlayCircle, UploadCloud, Plus, X // 🔥 Added X here
} from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function StudyHub({ user, isDarkMode }) {
  // --- STATES ---
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  // Library States
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  
  // Upload States
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCategory, setNewCategory] = useState("Computer Science");
  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false); 

  const categories = ["Computer Science", "Physics", "Maths", "General", "Notes"];

  // --- 1. FETCH PDF LIBRARY ---
  const fetchBooks = useCallback(async () => {
    setLoadingBooks(true);
    const { data, error } = await supabase
      .from('study_resources')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) setBooks(data);
    setLoadingBooks(false);
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // --- UPLOAD FUNCTION ---
  const handleUpload = async () => {
    if (!newTitle || !newUrl) return alert("Please enter a Title and PDF Link.");
    
    setIsUploading(true);
    
    const { error } = await supabase.from('study_resources').insert([
      { 
        title: newTitle, 
        file_url: newUrl, 
        category: newCategory,
      }
    ]);

    if (error) {
      alert(`Upload Failed: ${error.message}`);
    } else {
      setNewTitle("");
      setNewUrl("");
      setShowUpload(false); 
      fetchBooks(); 
    }
    setIsUploading(false);
  };

  // --- 2. VIDEO LOGIC ---
  const extractAndLoad = async () => {
    const id = videoUrl.split('v=')[1]?.split('&')[0] || videoUrl.split('/').pop();
    if (!id) return;
    setVideoId(id);

    const { data } = await supabase
      .from('video_notes')
      .select('note_content')
      .eq('user_id', user.id)
      .eq('video_id', id)
      .maybeSingle();

    if (data) setNote(data.note_content);
    else setNote(""); 
  };

  // --- 3. SAVE NOTES ---
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

    if (!error) setLastSaved(new Date().toLocaleTimeString());
    setSaving(false);
  };

  // --- 4. EXPORT PDF ---
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

  // --- 5. DELETE NOTES ---
  const deleteNotes = async () => {
    if (!window.confirm("Delete these notes?")) return;
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

  // --- THEME ---
  const theme = {
    bg: isDarkMode ? 'bg-slate-900' : 'bg-white',
    cardBg: isDarkMode ? 'bg-gray-800' : 'bg-white',
    border: isDarkMode ? 'border-slate-700' : 'border-gray-100',
    text: isDarkMode ? 'text-white' : 'text-slate-900',
    subText: isDarkMode ? 'text-slate-400' : 'text-gray-500',
    inputBg: isDarkMode ? 'bg-slate-950' : 'bg-gray-50',
    hoverBorder: isDarkMode ? 'hover:border-orange-500' : 'hover:border-orange-500'
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      
      {/* 📘 SECTION 1: NEURAL LIBRARY (With Upload) */}
      <div className={`p-8 rounded-[3rem] shadow-2xl border-b-8 border-orange-500 overflow-hidden relative transition-colors duration-500 ${theme.cardBg}`}>
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Book className="text-orange-500" size={32} />
            <h2 className={`text-2xl font-black uppercase tracking-tighter ${theme.text}`}>Neural Library</h2>
          </div>
          {/* Toggle Upload Button */}
          <button 
            onClick={() => setShowUpload(!showUpload)} 
            className={`p-3 rounded-2xl border-2 transition-all ${showUpload ? 'bg-orange-500 text-white border-orange-500' : `${theme.inputBg} ${theme.text} ${theme.border}`}`}
          >
            {showUpload ? <X size={20} /> : <Plus size={20} />}
          </button>
        </div>

        {/* 🔥 UPLOAD FORM (Collapsible) */}
        {showUpload && (
          <div className="mb-8 p-6 rounded-[2rem] border-2 border-orange-500/30 bg-orange-500/5 animate-in slide-in-from-top-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input 
                className={`p-4 rounded-xl outline-none font-bold text-sm ${theme.inputBg} ${theme.text}`}
                placeholder="Book Title"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
              />
              <input 
                className={`p-4 rounded-xl outline-none font-bold text-sm ${theme.inputBg} ${theme.text}`}
                placeholder="PDF Link (URL)"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
              />
              <select 
                className={`p-4 rounded-xl outline-none font-bold text-sm ${theme.inputBg} ${theme.text}`}
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button 
              onClick={handleUpload} 
              disabled={isUploading}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-black uppercase tracking-widest hover:bg-orange-600 transition-all flex justify-center items-center gap-2"
            >
              {isUploading ? <Loader2 className="animate-spin" /> : <><UploadCloud size={18} /> Upload Resource</>}
            </button>
          </div>
        )}
        
        {/* BOOKS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
          {loadingBooks ? (
            <div className="col-span-full py-10 flex justify-center"><Loader2 className="animate-spin text-orange-500" /></div>
          ) : books.length > 0 ? (
            books.map(book => (
              <div key={book.id} className={`p-6 rounded-[2rem] border-2 border-transparent transition-all group shadow-sm ${theme.inputBg} ${theme.hoverBorder}`}>
                <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${isDarkMode ? 'text-orange-400 bg-orange-900/30' : 'text-orange-500 bg-orange-100'}`}>{book.category}</span>
                <h4 className={`font-bold mt-3 mb-4 line-clamp-1 ${theme.text}`}>{book.title}</h4>
                <a 
                  href={book.file_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className={`flex items-center justify-between p-3 rounded-xl text-xs font-black uppercase transition-all border shadow-sm ${theme.bg} ${theme.border} ${theme.subText} hover:text-orange-500`}
                >
                  Access PDF <ExternalLink size={14} />
                </a>
              </div>
            ))
          ) : (
            <div className={`col-span-full py-10 text-center font-bold uppercase text-xs italic tracking-widest opacity-50 ${theme.subText}`}>No resources found. Upload one!</div>
          )}
        </div>
      </div>

      {/* 🎥 SECTION 2: STUDY WORKSPACE */}
      <div className="space-y-6">
        <div className={`p-6 rounded-[2.5rem] shadow-xl flex flex-wrap gap-4 border transition-colors duration-500 ${theme.bg} ${theme.border}`}>
          <div className="flex-1 relative min-w-[300px]">
            <input 
              className={`w-full p-4 pl-12 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-red-500 transition-all ${theme.inputBg} ${theme.text}`}
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
          {/* VIDEO PLAYER */}
          <div className={`lg:col-span-3 bg-black rounded-[3rem] overflow-hidden shadow-2xl border-4 relative ${theme.border}`}>
            {videoId ? (
              <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}`} title="Neural Player" frameBorder="0" allowFullScreen></iframe>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                 <PlayCircle size={80} className="opacity-10 animate-pulse" />
                 <p className="font-black uppercase text-xs tracking-[0.3em]">Awaiting Visual Input</p>
              </div>
            )}
          </div>

          {/* NOTEPAD */}
          <div className={`lg:col-span-2 rounded-[3rem] shadow-2xl border flex flex-col overflow-hidden transition-colors duration-500 ${theme.bg} ${theme.border}`}>
             <div className={`p-6 border-b flex justify-between items-center ${theme.border} ${isDarkMode ? 'bg-slate-900/50' : 'bg-gray-50/50'}`}>
                <div className="flex items-center gap-2 text-blue-600">
                  <PenTool size={20} />
                  <h3 className="font-black uppercase text-xs tracking-widest">Neural Notepad</h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={exportPDF} title="Export PDF" className={`p-2 transition-colors hover:text-blue-600 ${theme.subText}`}><FileDown size={20}/></button>
                  <button onClick={deleteNotes} title="Delete Notes" className={`p-2 transition-colors hover:text-red-500 ${theme.subText}`}><Trash2 size={20}/></button>
                  <button onClick={saveNotes} disabled={saving} className="p-2 text-green-600 hover:scale-110 transition-all">
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  </button>
                </div>
             </div>
             
             <div className="flex-1 relative">
               <textarea 
                 className={`w-full h-full p-8 bg-transparent outline-none font-medium text-sm leading-relaxed resize-none custom-scrollbar ${theme.text}`}
                 placeholder="Begin knowledge synthesis..."
                 value={note}
                 onChange={e => setNote(e.target.value)}
               />
               {lastSaved && (
                 <div className={`absolute bottom-4 right-6 text-[8px] font-black text-green-500 uppercase px-2 py-1 rounded ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
                   Synced at {lastSaved}
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
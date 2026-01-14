import React, { useState } from 'react';
import { Youtube, Book, PenTool, ExternalLink, Save } from 'lucide-react';

export default function StudyHub({ user }) {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [note, setNote] = useState("");

  const extractId = () => {
    const id = videoUrl.split('v=')[1]?.split('&')[0] || videoUrl.split('/').pop();
    setVideoId(id);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* 1. INPUT FOR VIDEO */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-xl flex gap-4 border dark:border-gray-700">
        <input 
          className="flex-1 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl outline-none font-bold text-sm"
          placeholder="Paste YouTube Study Link..."
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
        <button onClick={extractId} className="bg-red-600 text-white px-6 rounded-xl font-black uppercase text-xs flex items-center gap-2">
          <Youtube size={18} /> Load Lecture
        </button>
      </div>

      {/* 2. SIDE-BY-SIDE INTERFACE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
        {/* LEFT: PLAYER */}
        <div className="bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-gray-800">
          {videoId ? (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
              <Youtube size={64} className="opacity-20" />
              <p className="font-black uppercase text-xs tracking-widest">Awaiting Neural Signal...</p>
            </div>
          )}
        </div>

        {/* RIGHT: NEURAL NOTEPAD */}
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl border dark:border-gray-700 flex flex-col p-8">
           <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-blue-600">
                <PenTool size={20} />
                <h3 className="font-black uppercase tracking-tighter">Active Notes</h3>
              </div>
              <button className="text-green-600 p-2 hover:bg-green-50 rounded-lg transition-all">
                <Save size={20} />
              </button>
           </div>
           <textarea 
             className="flex-1 w-full bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl outline-none font-medium resize-none border-none focus:ring-2 focus:ring-blue-500/20"
             placeholder="Synthesize your lecture notes here..."
             value={note}
             onChange={(e) => setNote(e.target.value)}
           />
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { 
  Brain, BookOpen, ExternalLink, Zap, 
  MessageSquare, Layers, Sparkles 
} from 'lucide-react';

export default function NeuralTools({ isDarkMode }) {

  // Function to open focused "App-like" popups
  const openTool = (url, title) => {
    const width = 1200;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    window.open(
      url, 
      title, 
      `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`
    );
  };

  const theme = {
    bg: isDarkMode ? 'bg-slate-900' : 'bg-white',
    text: isDarkMode ? 'text-white' : 'text-slate-900',
    card: isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200',
    subText: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    hoverBorderBlue: isDarkMode ? 'hover:border-blue-500' : 'hover:border-blue-400',
    hoverBorderGreen: isDarkMode ? 'hover:border-green-500' : 'hover:border-green-400'
  };

  return (
    <div className={`min-h-screen p-8 animate-in fade-in duration-500 max-w-7xl mx-auto space-y-10 ${theme.text}`}>
      
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg">
          <Layers size={32} />
        </div>
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">External Neural Grid</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Connect to Personal AI Workspaces</p>
        </div>
      </div>

      {/* TOOLS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* 1. GOOGLE GEMINI CARD */}
        <div className={`p-8 rounded-[32px] border-2 shadow-2xl relative overflow-hidden group transition-all hover:scale-[1.01] ${theme.card} ${theme.hoverBorderBlue}`}>
          {/* Background Icon Effect */}
          <div className="absolute -top-10 -right-10 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 rotate-12">
            <Sparkles size={200} />
          </div>
          
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl text-blue-600 dark:text-blue-400">
                  <Brain size={24} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Gemini Advanced</h2>
              </div>
              
              <p className={`text-sm font-medium mb-8 leading-relaxed ${theme.subText}`}>
                Direct link to Google's most capable AI model. Use this for complex reasoning, coding help, and creative writing assistance using your personal account.
              </p>
            </div>

            <button 
              onClick={() => openTool('https://gemini.google.com/app', 'GeminiWindow')}
              className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95"
            >
              <ExternalLink size={16} /> Launch Gemini Core
            </button>
          </div>
        </div>

        {/* 2. NOTEBOOK LM CARD */}
        <div className={`p-8 rounded-[32px] border-2 shadow-2xl relative overflow-hidden group transition-all hover:scale-[1.01] ${theme.card} ${theme.hoverBorderGreen}`}>
          {/* Background Icon Effect */}
          <div className="absolute -top-10 -right-10 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 rotate-12">
            <BookOpen size={200} />
          </div>
          
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl text-green-600 dark:text-green-400">
                  <MessageSquare size={24} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">NotebookLM</h2>
              </div>
              
              <p className={`text-sm font-medium mb-8 leading-relaxed ${theme.subText}`}>
                Upload your PDFs, Google Docs, or slides. NotebookLM becomes an expert on your specific sources, complete with citations and audio overviews.
              </p>
            </div>

            <button 
              onClick={() => openTool('https://notebooklm.google.com/', 'NotebookWindow')}
              className="w-full py-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/30 transition-all active:scale-95"
            >
              <ExternalLink size={16} /> Launch Notebook Node
            </button>
          </div>
        </div>

      </div>

      {/* FOOTER NOTE */}
      <div className={`p-6 rounded-2xl border border-dashed text-center opacity-60 ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-300 bg-slate-50'}`}>
        <p className="text-[10px] font-black uppercase flex items-center justify-center gap-2">
          <Zap size={12} className="text-yellow-500" /> 
          Note: These tools run on Google's Cloud. Your data remains private to your account.
        </p>
      </div>

    </div>
  );
}
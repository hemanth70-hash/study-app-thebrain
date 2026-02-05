import React, { useState, useEffect } from 'react';
import { Search, Globe, GraduationCap, Youtube, Radio, ExternalLink, Building2, RefreshCw } from 'lucide-react';

export default function WelcomeHeader({ isDarkMode }) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('govt'); 
  const [newsIndex, setNewsIndex] = useState(0);
  
  // LIVE DATA STATES
  const [newsFeed, setNewsFeed] = useState([
    { source: "SYSTEM", title: "Initializing Neural Uplink to Govt Servers...", link: "#" }
  ]);
  const [loading, setLoading] = useState(true);

  // --- 🔥 THE LIVE FETCH ENGINE ---
  useEffect(() => {
    const fetchLiveNews = async () => {
      try {
        // 1. We use Google News RSS tailored for Indian Govt Exams
        // 2. We use rss2json.com to bypass CORS (Browser Security) so it works on localhost
        const RSS_URL = "https://news.google.com/rss/search?q=India+Govt+Job+Exam+Notification+UPSC+SSC+IBPS+Admit+Card+Result+when:2d&hl=en-IN&gl=IN&ceid=IN:en";
        const API_ENDPOINT = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`;

        const response = await fetch(API_ENDPOINT);
        const data = await response.json();

        if (data.status === 'ok' && data.items.length > 0) {
          // Format the raw data into our ticker format
          const formattedNews = data.items.map(item => ({
            source: item.author || "GOVT NEWS", // Sometimes author is empty in RSS
            title: item.title,
            link: item.link
          }));
          setNewsFeed(formattedNews);
          setLoading(false);
        } else {
          // Fallback if API limit reached
          throw new Error("API Limit");
        }
      } catch (error) {
        console.error("News Uplink Failed:", error);
        // Fallback Mock Data so the UI never breaks
        setNewsFeed([
            { source: "UPSC", title: "Civil Services (Prelims) Admit Cards released (Fallback Mode)", link: "https://upsc.gov.in" },
            { source: "NTA", title: "JEE Main Session 2 Result declared (Fallback Mode)", link: "https://jeemain.nta.nic.in" },
            { source: "SSC", title: "CGL Notification out: 7,500+ vacancies (Fallback Mode)", link: "https://ssc.nic.in" }
        ]);
        setLoading(false);
      }
    };

    fetchLiveNews();
  }, []);

  // Rotate News every 5 seconds
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      setNewsIndex((prev) => (prev + 1) % newsFeed.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [newsFeed.length, loading]);

  const handleSearch = (e) => {
    if ((e?.type === 'keydown' && e?.key === 'Enter') || e?.type === 'click') {
      if (!query.trim()) return;
      let url = '';
      switch(mode) {
        case 'govt': 
          url = `https://www.google.com/search?q=${encodeURIComponent(query + " official website notification site:gov.in OR site:nic.in")}`; 
          break;
        case 'scholar': 
          url = `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`; 
          break;
        case 'youtube': 
          url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + " exam preparation strategy")}`; 
          break;
        default: 
          url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      }
      window.open(url, '_blank');
      setQuery('');
    }
  };

  const visitNewsLink = () => {
    const currentLink = newsFeed[newsIndex].link;
    window.open(currentLink, '_blank');
  };

  // --- STYLES ---
  const containerClass = isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200';
  const textClass = isDarkMode ? 'text-white' : 'text-slate-900';
  const inputBg = isDarkMode ? 'bg-slate-900' : 'bg-slate-50';
  const activeBtn = "bg-blue-600 text-white shadow-lg shadow-blue-500/40";
  const inactiveBtn = isDarkMode ? "text-slate-500 hover:bg-slate-800" : "text-slate-400 hover:bg-slate-100";

  return (
    <div className={`w-full rounded-2xl border-2 overflow-hidden shadow-xl ${containerClass}`}>
      
      {/* 1. SEARCH SECTOR */}
      <div className="p-3 flex items-center gap-3">
        {/* Mode Toggles */}
        <div className={`flex gap-1 p-1 rounded-lg border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
          <button onClick={() => setMode('govt')} className={`p-2 rounded-md transition-all ${mode === 'govt' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/40' : inactiveBtn}`} title="Official Govt Portals">
            <Building2 size={16} />
          </button>
          <button onClick={() => setMode('scholar')} className={`p-2 rounded-md transition-all ${mode === 'scholar' ? activeBtn : inactiveBtn}`} title="Academic Papers">
            <GraduationCap size={16} />
          </button>
          <button onClick={() => setMode('youtube')} className={`p-2 rounded-md transition-all ${mode === 'youtube' ? 'bg-red-600 text-white shadow-lg shadow-red-500/40' : inactiveBtn}`} title="Lectures">
            <Youtube size={16} />
          </button>
        </div>

        {/* Input Bar */}
        <div className={`flex-1 flex items-center px-4 h-12 rounded-xl border transition-all focus-within:ring-2 focus-within:ring-blue-500/50 ${inputBg} ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <Search size={18} className="text-slate-400 mr-3" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder={`SEARCH ${mode === 'govt' ? 'OFFICIAL GOVT NOTICES' : mode.toUpperCase()}...`} 
            className={`w-full bg-transparent outline-none font-mono text-sm tracking-wide ${textClass}`}
          />
        </div>

        {/* Execute Button */}
        <button onClick={handleSearch} className={`h-12 px-6 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 ${isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
          INIT
        </button>
      </div>

      {/* 2. LIVE GOVT INTEL TICKER */}
      <button 
        onClick={visitNewsLink}
        className={`w-full py-2 px-4 flex items-center gap-4 border-t cursor-pointer hover:bg-blue-50/5 transition-colors ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
      >
        
        {/* Live Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${loading ? 'bg-yellow-400' : 'bg-green-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${loading ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
          </span>
          <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${loading ? 'text-yellow-500' : 'text-green-600 dark:text-green-400'}`}>
            {loading ? 'CONNECTING...' : 'LIVE FEED'}
          </span>
        </div>

        {/* Scrolling Text */}
        <div className="flex-1 overflow-hidden relative h-5 text-left">
          <div key={newsIndex} className="absolute inset-0 flex items-center animate-in slide-in-from-bottom-2 fade-in duration-500">
            <Radio size={12} className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={`text-[10px] font-bold font-mono mr-2 hidden md:inline ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
              [{newsFeed[newsIndex].source.slice(0, 15)}]
            </span>
            <span className={`text-xs font-medium truncate ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {/* Clean up the title by removing the source usually appended by Google News like "- Times of India" */}
              {newsFeed[newsIndex].title.split(' - ')[0]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-blue-500 shrink-0">
          Open <ExternalLink size={10} />
        </div>
      </button>

    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Target, Coffee, X, Trash2, Save, 
  Edit, BellRing // Using standard Edit icon
} from 'lucide-react';

export default function CalendarWidget({ isDarkMode }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeView, setActiveView] = useState('calendar'); 
  
  // --- USER GOALS (Targets & Rest Days) ---
  const [events, setEvents] = useState([
    { id: 1, day: 15, month: new Date().getMonth(), year: new Date().getFullYear(), type: 'target', label: 'Physics Mock' },
    { id: 2, day: 25, month: new Date().getMonth(), year: new Date().getFullYear(), type: 'holiday', label: 'Rest Day' }
  ]);

  // --- STATES ---
  const [selectedDate, setSelectedDate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState(null);

  // Editor Inputs
  const [editorLabel, setEditorLabel] = useState("");
  const [editorType, setEditorType] = useState("target");

  // --- INIT: NOTIFICATIONS ---
  useEffect(() => {
    const today = new Date();
    const dayNum = today.getDate();
    
    // Check if Today has an event
    const goal = events.find(e => 
      e.day === dayNum && e.month === today.getMonth() && e.year === today.getFullYear()
    );

    if (goal) {
      setNotification({ type: goal.type, label: goal.label, sub: "Scheduled for Today" });
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, []);

  // --- CALENDAR HELPERS ---
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const padding = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // --- ACTIONS ---
  const openDayView = (day) => {
    const existing = events.find(e => e.day === day && e.month === currentDate.getMonth());
    setSelectedDate({ day, month: currentDate.getMonth(), year: currentDate.getFullYear() });
    
    if (existing) {
      setEditorLabel(existing.label);
      setEditorType(existing.type);
    } else {
      setEditorLabel("");
      setEditorType("target");
    }
    setIsEditing(false);
  };

  const saveEvent = () => {
    if (!editorLabel) return;
    const cleaned = events.filter(e => !(e.day === selectedDate.day && e.month === selectedDate.month));
    cleaned.push({
      id: Date.now(),
      ...selectedDate,
      label: editorLabel,
      type: editorType
    });
    setEvents(cleaned);
    setIsEditing(false);
    setSelectedDate(null);
  };

  const deleteEvent = () => {
    setEvents(events.filter(e => !(e.day === selectedDate.day && e.month === selectedDate.month)));
    setIsEditing(false);
    setSelectedDate(null);
  };

  // --- STYLES ---
  const theme = {
    bg: isDarkMode ? 'bg-slate-950' : 'bg-white',
    text: isDarkMode ? 'text-white' : 'text-slate-900',
    subText: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    border: isDarkMode ? 'border-slate-800' : 'border-slate-200',
    hover: isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100',
    input: isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
  };

  // --- VISUAL ENGINE ---
  const renderVisuals = (day) => {
    const evt = events.find(e => e.day === day && e.month === currentDate.getMonth());
    
    if (!evt) return null;

    return (
      <div className="mt-1 flex justify-center">
        {evt.type === 'target' ? (
          <Target size={12} className="text-red-500 fill-red-500/20 drop-shadow-sm" />
        ) : (
          <Coffee size={12} className="text-purple-500 fill-purple-500/20 drop-shadow-sm" />
        )}
      </div>
    );
  };

  return (
    <div className={`w-full max-w-[300px] h-[380px] p-4 rounded-3xl shadow-xl border-b-4 border-indigo-600 flex flex-col relative overflow-hidden transition-colors duration-500 ${theme.bg} ${theme.text}`}>
      
      {/* NOTIFICATION POP-UP */}
      {notification && (
        <div className="absolute top-4 left-4 right-4 z-50 animate-in slide-in-from-top-4 duration-500">
          <div className={`p-3 rounded-2xl shadow-2xl border-l-4 flex items-center gap-3 ${
            notification.type === 'holiday' ? 'bg-purple-600 text-white border-white' : 'bg-red-600 text-white border-white'
          }`}>
            <BellRing size={18} className="animate-bounce" />
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-80">{notification.sub}</p>
              <p className="font-bold text-xs leading-tight">{notification.label}</p>
            </div>
            <button onClick={() => setNotification(null)} className="ml-auto opacity-50 hover:opacity-100"><X size={14} /></button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-2 shrink-0">
        <span className={`text-lg font-black uppercase tracking-tighter ${theme.text}`}>
          {activeView === 'calendar' ? `${monthNames[currentDate.getMonth()]} '${currentDate.getFullYear().toString().slice(2)}` : activeView}
        </span>
        {activeView === 'calendar' && (
          <div className="flex gap-1">
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className={`p-1 rounded-lg ${theme.hover}`}><ChevronLeft size={18} /></button>
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className={`p-1 rounded-lg ${theme.hover}`}><ChevronRight size={18} /></button>
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative pr-1">
        
        {/* CALENDAR VIEW */}
        {activeView === 'calendar' && (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            {/* 🔥 FIX: Used index (i) as key to fix duplicate key warning */}
            <div className={`grid grid-cols-7 mb-1 text-center text-[10px] font-black ${theme.subText}`}>
              {['S','M','T','W','T','F','S'].map((d, i) => <span key={i}>{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {padding.map((_, i) => <div key={`pad-${i}`} />)}
              {days.map(day => {
                const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth();
                const evt = events.find(e => e.day === day && e.month === currentDate.getMonth());
                
                return (
                  <button 
                    key={day} 
                    onClick={() => openDayView(day)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center relative border transition-all active:scale-95 ${
                      isToday 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                        : evt 
                          ? `${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}` 
                          : `${theme.hover} ${theme.border}`
                    }`}
                  >
                    <span className={`text-[12px] font-bold ${isToday ? 'text-white' : theme.text}`}>{day}</span>
                    {renderVisuals(day)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* LISTS */}
        {(activeView === 'targets' || activeView === 'holidays') && (
          <div className="space-y-2 animate-in slide-in-from-right duration-300">
            {events.filter(e => activeView === 'targets' ? e.type === 'target' : e.type === 'holiday').map((e) => (
              <div key={e.id} className={`p-3 rounded-2xl border flex items-center justify-between group ${theme.border} ${theme.hover}`}>
                <div className="flex items-center gap-3">
                  {e.type === 'target' ? <Target size={18} className="text-red-500" /> : <Coffee size={18} className="text-purple-500" />}
                  <div>
                    <p className={`text-sm font-bold leading-none ${theme.text}`}>{e.label}</p>
                    <p className={`text-[10px] font-bold ${theme.subText}`}>{monthNames[e.month]} {e.day}</p>
                  </div>
                </div>
                <button onClick={() => openDayView(e.day)} className="p-2 bg-indigo-100 text-indigo-600 rounded-xl dark:bg-indigo-900/30 dark:text-indigo-400">
                  <Edit size={16} />
                </button>
              </div>
            ))}
            {events.filter(e => activeView === 'targets' ? e.type === 'target' : e.type === 'holiday').length === 0 && (
              <p className={`text-center text-xs py-10 ${theme.subText}`}>No items found.</p>
            )}
          </div>
        )}
      </div>

      {/* --- OVERLAY: DAY EDITOR --- */}
      {selectedDate && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedDate(null)} />
          <div className={`relative w-full p-5 rounded-[2rem] shadow-2xl border ${theme.bg} ${theme.border}`}>
            
            <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest block">Selected Date</span>
                <span className={`text-xl font-black ${theme.text}`}>{selectedDate.day} {monthNames[selectedDate.month]}</span>
              </div>
              <div className="flex gap-2">
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="p-2 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-400 transition-all">
                    <Edit size={20} />
                  </button>
                )}
                <button onClick={() => setSelectedDate(null)} className={`p-2 rounded-xl ${theme.hover}`}><X size={20} /></button>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <input 
                  autoFocus
                  className={`w-full p-3 rounded-xl text-sm font-bold outline-none border ${theme.input}`}
                  placeholder="Event Name (e.g. Test, Break)"
                  value={editorLabel}
                  onChange={(e) => setEditorLabel(e.target.value)}
                />
                <div className="flex gap-2 justify-between">
                  <button onClick={() => setEditorType('target')} className={`flex-1 p-3 rounded-xl border-2 flex justify-center transition-all ${editorType === 'target' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : theme.border}`}>
                    <Target size={24} className="text-red-500" />
                  </button>
                  <button onClick={() => setEditorType('holiday')} className={`flex-1 p-3 rounded-xl border-2 flex justify-center transition-all ${editorType === 'holiday' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : theme.border}`}>
                    <Coffee size={24} className="text-purple-500" />
                  </button>
                </div>
                <div className="flex gap-2 pt-2">
                  {events.find(e => e.day === selectedDate.day) && (
                    <button onClick={deleteEvent} className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"><Trash2 size={20} /></button>
                  )}
                  <button onClick={saveEvent} className="flex-1 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs hover:bg-indigo-700 py-3 flex items-center justify-center gap-2">
                    <Save size={18} /> Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                {editorLabel ? (
                  <div className="space-y-2">
                    <div className={`inline-block p-4 rounded-2xl mb-2 ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                      {editorType === 'target' ? <Target size={32} className="text-red-500" /> : <Coffee size={32} className="text-purple-500" />}
                    </div>
                    <p className={`text-lg font-bold ${theme.text}`}>{editorLabel}</p>
                    <p className={`text-xs font-bold uppercase tracking-widest ${theme.subText}`}>{editorType === 'target' ? 'Target Goal' : 'Rest Day'}</p>
                  </div>
                ) : (
                  <div className="space-y-2 opacity-50">
                    <p className="text-sm font-bold">No events scheduled.</p>
                    <p className="text-[10px] uppercase">Click pen to add.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- NAV BAR --- */}
      <div className={`mt-2 pt-2 border-t flex justify-around items-center shrink-0 ${theme.border}`}>
        <NavButton icon={CalendarIcon} view="calendar" active={activeView} set={setActiveView} color="indigo" isDark={isDarkMode} />
        <NavButton icon={Target} view="targets" active={activeView} set={setActiveView} color="red" isDark={isDarkMode} />
        <NavButton icon={Coffee} view="holidays" active={activeView} set={setActiveView} color="purple" isDark={isDarkMode} />
      </div>
    </div>
  );
}

function NavButton({ icon: Icon, view, active, set, color, isDark }) {
    const isActive = active === view;
    const colors = { indigo: 'bg-indigo-600', red: 'bg-red-500', purple: 'bg-purple-500' };
    return (
      <button onClick={() => set(view)} className={`transition-all duration-300 ${isActive ? 'scale-110' : 'opacity-40 hover:opacity-100'}`}>
        <div className={`p-2 rounded-xl ${isActive ? `${colors[color]} text-white shadow-lg` : isDark ? 'text-white' : 'text-slate-900'}`}>
          <Icon size={18} />
        </div>
      </button>
    );
}
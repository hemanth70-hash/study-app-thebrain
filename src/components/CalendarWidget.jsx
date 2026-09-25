import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Target,
  Coffee,
  X,
  Trash2,
  Save,
  Edit,
  BellRing
} from 'lucide-react';

export default function CalendarWidget({ isDarkMode, user }) {
  // =========================================================
  // STATE
  // =========================================================

  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeView, setActiveView] = useState('calendar');

  const [events, setEvents] = useState([]);
  const [userId, setUserId] = useState(null); // Force null initially

  const [selectedDate, setSelectedDate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [notification, setNotification] = useState(null);

  const [editorLabel, setEditorLabel] = useState('');
  const [editorType, setEditorType] = useState('target');

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);


  // =========================================================
  // FETCH USER + EVENTS
  // =========================================================

  useEffect(() => {
    const initSession = async () => {
      try {
        // ALWAYS fetch the definitive Auth UUID directly from Supabase
        // This prevents foreign key mismatches caused by bad props
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser?.id) {
          console.warn('No authenticated user found or auth error:', authError);
          setEvents([]);
          return;
        }

        const trueUserId = authUser.id;
        setUserId(trueUserId);

        const { data, error } = await supabase
          .from('user_events')
          .select('*')
          .eq('user_id', trueUserId)
          .order('year', { ascending: true })
          .order('month', { ascending: true })
          .order('day', { ascending: true });

        if (error) {
          console.error('Failed to load events:', error);
          return;
        }

        setEvents(data || []);

      } catch (error) {
        console.error('Unexpected initialization error:', error);
      }
    };

    initSession();
  }, []); // Remove 'user' dependency so it doesn't re-run if prop is unstable


  // =========================================================
  // TODAY NOTIFICATION
  // =========================================================

  useEffect(() => {
    if (!events.length) {
      setNotification(null);
      return;
    }

    const today = new Date();

    const dayNum = today.getDate();
    const monthNum = today.getMonth();
    const yearNum = today.getFullYear();

    const goal = events.find(
      event =>
        Number(event.day) === dayNum &&
        Number(event.month) === monthNum &&
        Number(event.year) === yearNum
    );

    if (goal) {
      setNotification({
        type: goal.type,
        label: goal.label,
        sub: 'Scheduled for Today'
      });

      const timer = setTimeout(() => {
        setNotification(null);
      }, 6000);

      return () => clearTimeout(timer);
    }

    setNotification(null);
  }, [events]);


  // =========================================================
  // CALENDAR HELPERS
  // =========================================================

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const firstDay = new Date(
    year,
    month,
    1
  ).getDay();

  const padding = Array(firstDay).fill(null);

  const days = Array.from(
    { length: daysInMonth },
    (_, index) => index + 1
  );

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];


  // =========================================================
  // FIND EVENT FOR DATE
  // =========================================================

  const findEvent = (day, targetMonth = month, targetYear = year) => {
    return events.find(
      event =>
        Number(event.day) === Number(day) &&
        Number(event.month) === Number(targetMonth) &&
        Number(event.year) === Number(targetYear)
    );
  };


  // =========================================================
  // OPEN DAY
  // =========================================================

  const openDayView = (
    day,
    targetMonth = month,
    targetYear = year,
    forcedEvent = null
  ) => {

    const existing =
      forcedEvent ||
      findEvent(day, targetMonth, targetYear);

    setSelectedDate({
      day,
      month: targetMonth,
      year: targetYear,
      db_id: existing?.id || null
    });

    if (existing) {
      setEditorLabel(existing.label || '');
      setEditorType(existing.type || 'target');
    } else {
      setEditorLabel('');
      setEditorType('target');
    }

    setIsEditing(false);
  };


  // =========================================================
  // SAVE EVENT
  // =========================================================

  const saveEvent = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);

      const cleanLabel = editorLabel.trim();

      if (!cleanLabel) {
        alert('Please enter an event name.');
        return;
      }

      if (!selectedDate) {
        alert('No date selected.');
        return;
      }

      // Fetch the explicit Auth UUID instantly to bypass FK errors
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const activeId = authUser?.id;

      if (!activeId) {
        alert('You are not logged in. Session expired.');
        return;
      }

      const payload = {
        user_id: activeId, // THIS is now guaranteed to match auth.users(id)
        day: Number(selectedDate.day),
        month: Number(selectedDate.month),
        year: Number(selectedDate.year),
        label: cleanLabel,
        type: editorType
      };

      // UPDATE EXISTING EVENT
      if (selectedDate.db_id) {
        const { data, error } = await supabase
          .from('user_events')
          .update(payload)
          .eq('id', selectedDate.db_id)
          .eq('user_id', activeId)
          .select()
          .single();

        if (error) {
          console.error('UPDATE user_events ERROR:', error);
          alert(`Failed to update event:\n\n${error.message}`);
          return;
        }

        setEvents(prev =>
          prev.map(event =>
            event.id === selectedDate.db_id ? data : event
          )
        );
      }
      // INSERT NEW EVENT
      else {
        const { data, error } = await supabase
          .from('user_events')
          .insert([payload])
          .select()
          .single();

        if (error) {
          console.error('INSERT user_events ERROR:', error);
          alert(`Failed to save event:\n\n${error.message}`);
          return;
        }

        setEvents(prev => [...prev, data]);
      }

      setIsEditing(false);
      setSelectedDate(null);

    } catch (error) {
      console.error('Unexpected saveEvent error:', error);
      alert(`Unexpected error while saving:\n\n${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };


  // =========================================================
  // DELETE EVENT
  // =========================================================

  const deleteEvent = async () => {
    if (isDeleting) return;

    if (!selectedDate?.db_id) {
      return;
    }

    try {
      setIsDeleting(true);

      const { data: { user: authUser } } = await supabase.auth.getUser();
      const activeId = authUser?.id;

      if (!activeId) {
        alert('You are not logged in.');
        return;
      }

      const { error } = await supabase
        .from('user_events')
        .delete()
        .eq('id', selectedDate.db_id)
        .eq('user_id', activeId);

      if (error) {
        console.error('DELETE user_events ERROR:', error);
        alert(`Failed to delete event:\n\n${error.message}`);
        return;
      }

      setEvents(prev => prev.filter(event => event.id !== selectedDate.db_id));

      setIsEditing(false);
      setSelectedDate(null);

    } catch (error) {
      console.error('Unexpected delete error:', error);
      alert(`Unexpected error while deleting:\n\n${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };


  // =========================================================
  // CHANGE MONTH
  // =========================================================

  const changeMonth = direction => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + direction,
        1
      )
    );
    setSelectedDate(null);
    setIsEditing(false);
  };


  // =========================================================
  // THEME
  // =========================================================

  const theme = {
    bg: isDarkMode ? 'bg-slate-950' : 'bg-white',
    text: isDarkMode ? 'text-white' : 'text-slate-900',
    subText: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    border: isDarkMode ? 'border-slate-800' : 'border-slate-200',
    hover: isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100',
    input: isDarkMode
      ? 'bg-slate-900 border-slate-700 text-white'
      : 'bg-slate-50 border-slate-200 text-slate-900'
  };


  // =========================================================
  // CALENDAR VISUALS
  // =========================================================

  const renderVisuals = day => {
    const event = findEvent(day);

    if (!event) {
      return null;
    }

    return (
      <div className="mt-1 flex justify-center">
        {event.type === 'target' ? (
          <Target
            size={12}
            className="text-red-500 fill-red-500/20 drop-shadow-sm"
          />
        ) : (
          <Coffee
            size={12}
            className="text-purple-500 fill-purple-500/20 drop-shadow-sm"
          />
        )}
      </div>
    );
  };


  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      className={`
        w-full max-w-[300px] h-[380px] p-4 rounded-3xl shadow-xl 
        border-b-4 border-indigo-600 flex flex-col relative overflow-hidden 
        transition-colors duration-500 ${theme.bg} ${theme.text}
      `}
    >

      {/* =====================================================
          NOTIFICATION
      ===================================================== */}

      {notification && (
        <div className="absolute top-4 left-4 right-4 z-50 animate-in slide-in-from-top-4 duration-500">
          <div
            className={`
              p-3 rounded-2xl shadow-2xl border-l-4 flex items-center gap-3
              ${
                notification.type === 'holiday'
                  ? 'bg-purple-600 text-white border-white'
                  : 'bg-red-600 text-white border-white'
              }
            `}
          >
            <BellRing size={18} className="animate-bounce" />
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-80">
                {notification.sub}
              </p>
              <p className="font-bold text-xs leading-tight">
                {notification.label}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="ml-auto opacity-50 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}


      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex justify-between items-center mb-2 shrink-0">
        <span className={`text-lg font-black uppercase tracking-tighter ${theme.text}`}>
          {activeView === 'calendar'
            ? `${monthNames[month]} '${year.toString().slice(2)}`
            : activeView}
        </span>

        {activeView === 'calendar' && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className={`p-1 rounded-lg ${theme.hover}`}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className={`p-1 rounded-lg ${theme.hover}`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>


      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="flex-1 overflow-y-auto custom-scrollbar relative pr-1">

        {/* ===================================================
            CALENDAR
        =================================================== */}

        {activeView === 'calendar' && (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <div className={`grid grid-cols-7 mb-1 text-center text-[10px] font-black ${theme.subText}`}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayName, index) => (
                <span key={index}>{dayName}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {padding.map((_, index) => (
                <div key={`pad-${index}`} />
              ))}

              {days.map(day => {
                const today = new Date();
                const isToday =
                  day === today.getDate() &&
                  month === today.getMonth() &&
                  year === today.getFullYear();
                const event = findEvent(day);

                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => openDayView(day)}
                    className={`
                      aspect-square rounded-xl flex flex-col items-center justify-center 
                      relative border transition-all active:scale-95
                      ${
                        isToday
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                          : event
                            ? `${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`
                            : `${theme.hover}${theme.border}`
                      }
                    `}
                  >
                    <span className={`text-[12px] font-bold ${isToday ? 'text-white' : theme.text}`}>
                      {day}
                    </span>
                    {renderVisuals(day)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================================================
            TARGETS / HOLIDAYS
        =================================================== */}

        {(activeView === 'targets' || activeView === 'holidays') && (
          <div className="space-y-2 animate-in slide-in-from-right duration-300">
            {events
              .filter(event =>
                activeView === 'targets'
                  ? event.type === 'target'
                  : event.type === 'holiday'
              )
              .map(event => (
                <div
                  key={event.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between group ${theme.border} ${theme.hover}`}
                >
                  <div className="flex items-center gap-3">
                    {event.type === 'target' ? (
                      <Target size={18} className="text-red-500" />
                    ) : (
                      <Coffee size={18} className="text-purple-500" />
                    )}
                    <div>
                      <p className={`text-sm font-bold leading-none ${theme.text}`}>
                        {event.label}
                      </p>
                      <p className={`text-[10px] font-bold ${theme.subText}`}>
                        {monthNames[event.month]} {event.day}, {event.year}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentDate(new Date(event.year, event.month, event.day));
                      openDayView(event.day, event.month, event.year, event);
                    }}
                    className="p-2 bg-indigo-100 text-indigo-600 rounded-xl dark:bg-indigo-900/30 dark:text-indigo-400"
                  >
                    <Edit size={16} />
                  </button>
                </div>
              ))}

            {events.filter(event =>
              activeView === 'targets'
                ? event.type === 'target'
                : event.type === 'holiday'
            ).length === 0 && (
              <p className={`text-center text-xs py-10 ${theme.subText}`}>
                No items found.
              </p>
            )}
          </div>
        )}
      </div>

      {/* =====================================================
          DAY EDITOR OVERLAY
      ===================================================== */}

      {selectedDate && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              if (!isSaving && !isDeleting) setSelectedDate(null);
            }}
          />

          <div className={`relative w-full p-5 rounded-[2rem] shadow-2xl border ${theme.bg} ${theme.border}`}>
            <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest block">
                  Selected Date
                </span>
                <span className={`text-xl font-black ${theme.text}`}>
                  {selectedDate.day} {monthNames[selectedDate.month]}
                </span>
              </div>
              <div className="flex gap-2">
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="p-2 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-400 transition-all"
                  >
                    <Edit size={20} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!isSaving && !isDeleting) setSelectedDate(null);
                  }}
                  className={`p-2 rounded-xl ${theme.hover}`}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <input
                  autoFocus
                  type="text"
                  className={`w-full p-3 rounded-xl text-sm font-bold outline-none border ${theme.input}`}
                  placeholder="Event Name (e.g. Test, Break)"
                  value={editorLabel}
                  disabled={isSaving || isDeleting}
                  onChange={event => setEditorLabel(event.target.value)}
                />

                <div className="flex gap-2 justify-between">
                  <button
                    type="button"
                    disabled={isSaving || isDeleting}
                    onClick={() => setEditorType('target')}
                    className={`flex-1 p-3 rounded-xl border-2 flex justify-center transition-all ${
                      editorType === 'target'
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : theme.border
                    }`}
                  >
                    <Target size={24} className="text-red-500" />
                  </button>

                  <button
                    type="button"
                    disabled={isSaving || isDeleting}
                    onClick={() => setEditorType('holiday')}
                    className={`flex-1 p-3 rounded-xl border-2 flex justify-center transition-all ${
                      editorType === 'holiday'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : theme.border
                    }`}
                  >
                    <Coffee size={24} className="text-purple-500" />
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  {selectedDate.db_id && (
                    <button
                      type="button"
                      disabled={isSaving || isDeleting}
                      onClick={deleteEvent}
                      className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? <span className="text-xs">...</span> : <Trash2 size={20} />}
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isSaving || isDeleting || !editorLabel.trim()}
                    onClick={saveEvent}
                    className="flex-1 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs hover:bg-indigo-700 py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} /> Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                {editorLabel ? (
                  <div className="space-y-2">
                    <div className={`inline-block p-4 rounded-2xl mb-2 ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                      {editorType === 'target' ? (
                        <Target size={32} className="text-red-500" />
                      ) : (
                        <Coffee size={32} className="text-purple-500" />
                      )}
                    </div>
                    <p className={`text-lg font-bold ${theme.text}`}>
                      {editorLabel}
                    </p>
                    <p className={`text-xs font-bold uppercase tracking-widest ${theme.subText}`}>
                      {editorType === 'target' ? 'Target Goal' : 'Rest Day'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0.5 opacity-50">
                    <p className="text-sm font-bold">No events scheduled.</p>
                    <p className="text-[10px] uppercase">Click pen to add.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          NAVIGATION
      ===================================================== */}
      <div className={`mt-2 pt-2 border-t flex justify-around items-center shrink-0 ${theme.border}`}>
        <NavButton
          icon={CalendarIcon}
          view="calendar"
          active={activeView}
          set={setActiveView}
          color="indigo"
          isDark={isDarkMode}
        />
        <NavButton
          icon={Target}
          view="targets"
          active={activeView}
          set={setActiveView}
          color="red"
          isDark={isDarkMode}
        />
        <NavButton
          icon={Coffee}
          view="holidays"
          active={activeView}
          set={setActiveView}
          color="purple"
          isDark={isDarkMode}
        />
      </div>
    </div>
  );
}

// =============================================================
// NAV BUTTON
// =============================================================
function NavButton({ icon: Icon, view, active, set, color, isDark }) {
  const isActive = active === view;
  const colors = {
    indigo: 'bg-indigo-600',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  return (
    <button
      type="button"
      onClick={() => set(view)}
      className={`transition-all duration-300 ${
        isActive ? 'scale-110' : 'opacity-40 hover:opacity-100'
      }`}
    >
      <div
        className={`p-2 rounded-xl ${
          isActive
            ? `${colors[color]} text-white shadow-lg`
            : isDark
              ? 'text-white'
              : 'text-slate-900'
        }`}
      >
        <Icon size={18} />
      </div>
    </button>
  );
}
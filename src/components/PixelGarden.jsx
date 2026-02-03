import React, { useState, useRef, useEffect } from 'react';

// Standard CSS Animations embedded in JS
const styles = {
  container: {
    position: 'relative',
    width: '100%',
    height: '12rem', // h-48
    backgroundColor: '#0f172a', // slate-900
    borderRadius: '0.75rem', // rounded-xl
    border: '4px solid #1e293b', // border-slate-800
    marginTop: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    overflow: 'hidden',
    boxShadow: '0 0 40px rgba(14,165,233,0.15)',
    fontFamily: 'monospace'
  },
  track: {
    position: 'relative',
    width: '90%',
    height: '4rem',
    display: 'flex',
    alignItems: 'center',
    zIndex: 10
  },
  lineBase: {
    position: 'absolute',
    width: '100%',
    height: '0.75rem',
    backgroundColor: '#334155', // slate-700
    borderRadius: '9999px',
    overflow: 'hidden'
  },
  lineFill: {
    height: '100%',
    backgroundColor: '#0ea5e9', // cyan-500
    transition: 'width 0.1s linear'
  },
  knob: {
    position: 'absolute',
    top: '50%',
    left: '0',
    width: '3rem',
    height: '3rem',
    borderRadius: '50%',
    border: '4px solid white',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'grab',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
    transition: 'background-color 0.3s, left 0.1s linear',
    zIndex: 20
  },
  display: {
    marginTop: '2rem',
    textAlign: 'center',
    zIndex: 10
  },
  timeText: {
    fontSize: '3rem',
    fontWeight: '900',
    color: 'white',
    lineHeight: 1
  },
  subText: {
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: '#64748b', // slate-500
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginTop: '0.5rem'
  },
  cheerPopup: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  }
};

export default function PixelGarden() {
  const [minutes, setMinutes] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [cheer, setCheer] = useState(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const trackRef = useRef(null);
  const audioCtx = useRef(null);
  const lastTickX = useRef(0);
  const timerRef = useRef(null);

  // --- AUDIO ENGINE ---
  const playSound = (type) => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtx.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'tick') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }
    osc.connect(gain);
    gain.connect(ctx.destination);
  };

  // --- MOUSE HANDLERS ---
  const handleMouseDown = (e) => {
    if (isActive) return;
    setIsDragging(true);
    updatePosition(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (minutes > 0) {
      startTimer();
    } else {
      setDragX(0); // Snap back
    }
  };

  // Support Touch Events for Mobile
  const handleTouchStart = (e) => handleMouseDown(e.touches[0]);
  const handleTouchMove = (e) => handleMouseMove(e.touches[0]);

  const updatePosition = (clientX) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const width = rect.width;
    
    // Clamp between 0 and width
    let newX = Math.max(0, Math.min(offsetX, width));
    
    setDragX(newX);
    
    // Calculate minutes (0 to 60)
    const pct = newX / width;
    setMinutes(Math.round(pct * 60));

    // Tick Sound
    if (Math.abs(newX - lastTickX.current) > 10) {
      playSound('tick');
      lastTickX.current = newX;
    }
  };

  // --- TIMER LOGIC ---
  const startTimer = () => {
    setIsActive(true);
    const totalTime = minutes * 1000; // 1 second per minute for demo
    const startTime = Date.now();
    const startX = dragX;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = 1 - (elapsed / totalTime);
      
      if (remainingPct <= 0) {
        clearInterval(timerRef.current);
        finishTimer();
      } else {
        setDragX(startX * remainingPct);
        // Calculate remaining minutes based on original max width logic
        const currentMins = Math.ceil((startX * remainingPct / trackRef.current.offsetWidth) * 60);
        // Fallback if width ref is tricky during resize, simple math:
        setMinutes(Math.ceil(minutes * remainingPct)); 
      }
    }, 16); // 60fps
  };

  const finishTimer = () => {
    setDragX(0);
    setMinutes(0);
    setIsActive(false);
    playSound('success');
    setCheer("YOU CRUSHED IT! 🚀");
    setTimeout(() => setCheer(null), 3000);
  };

  // Cleanup on unmount
  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
      clearInterval(timerRef.current);
    };
  }, [isDragging, minutes]);

  return (
    <div style={styles.container} onMouseMove={handleMouseMove} onTouchMove={handleTouchMove}>
      
      {/* INSTRUCTIONS */}
      {!isActive && minutes === 0 && (
        <div style={{ position: 'absolute', top: '10px', color: '#64748b', fontSize: '10px', fontWeight: 'bold', letterSpacing: '2px', animation: 'pulse 2s infinite' }}>
          DRAG TO SET FOCUS
        </div>
      )}

      {/* TRACK */}
      <div style={styles.track} ref={trackRef}>
        <div style={styles.lineBase}>
          <div style={{ ...styles.lineFill, width: `${dragX}px`, backgroundColor: isActive ? '#22c55e' : '#0ea5e9' }}></div>
        </div>

        {/* DRAGGABLE KNOB */}
        <div 
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{ 
            ...styles.knob, 
            left: `${dragX}px`, 
            backgroundColor: isActive ? '#22c55e' : '#06b6d4',
            borderColor: isActive ? '#86efac' : '#cffafe'
          }}
        >
          {isActive ? (
             // Lightning Icon (SVG)
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
               <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
             </svg>
          ) : (
             // Clock Icon (SVG)
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
               <circle cx="12" cy="12" r="10"></circle>
               <polyline points="12 6 12 12 16 14"></polyline>
             </svg>
          )}
        </div>
      </div>

      {/* DIGITAL DISPLAY */}
      <div style={styles.display}>
        <div style={{ ...styles.timeText, color: isActive ? '#4ade80' : 'white' }}>
          {minutes < 10 ? `0${minutes}` : minutes}:00
        </div>
        <div style={styles.subText}>
          {isActive ? 'REMAINING' : 'MINUTES'}
        </div>
      </div>

      {/* CHEER POPUP */}
      {cheer && (
        <div style={styles.cheerPopup}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: '10px'}}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', color: 'white', fontStyle: 'italic', textAlign: 'center' }}>
            {cheer}
          </h2>
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
        @keyframes popIn { 0% { transform: scale(0); } 100% { transform: scale(1); } }
      `}</style>
    </div>
  );
}
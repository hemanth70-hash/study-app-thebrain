import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Lock, User, ArrowRight, Loader2, ShieldCheck, Key } from 'lucide-react';

// 🔥 Notice the onLegacyLogin prop here!
export default function Auth({ isDarkMode, onLegacyLogin }) {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  // Form States
  const [emailOrUser, setEmailOrUser] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [username, setUsername] = useState('');
  const [inviteCode, setInviteCode] = useState(''); 
  
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (isForgotPassword) {
        // 1. Password Reset
        const { error } = await supabase.auth.resetPasswordForEmail(emailOrUser, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Password reset link sent to your email!' });
        
      } else if (isLogin) {
        // 2. Standard & Legacy Login
        const loginEmail = emailOrUser.includes('@') 
          ? emailOrUser 
          : `${emailOrUser.replace(/\s/g, '').toLowerCase()}@neural.local`;

        const { error } = await supabase.auth.signInWithPassword({ 
          email: loginEmail, 
          password: password 
        });

        // 🔥 THE INVISIBLE LEGACY FALLBACK (Fixes the 500 Error)
        if (error) {
          // If Supabase throws an error (like a 500), but they used a Username and "GrindIt"
          if (!emailOrUser.includes('@') && password === 'GrindIt') {
            const { data: legacyProfile } = await supabase
              .from('profiles')
              .select('*')
              .ilike('username', emailOrUser.trim())
              .maybeSingle();

            if (legacyProfile) {
              onLegacyLogin(legacyProfile); // Secretly log them in!
              return; 
            }
          }
          // If they aren't a legacy user, show the actual error
          throw error; 
        }
        
      } else {
        // 3. Sign Up (With Invite Code & Default Password)
        const defaultPassword = "GrindIt";

        const { error } = await supabase.auth.signUp({
          email: emailOrUser,
          password: defaultPassword, 
          options: { 
            data: { 
              username: username,
              invite_code: inviteCode 
            } 
          }
        });
        
        if (error) throw error;
        setMessage({ type: 'success', text: 'Account created! You can now log in using the password "GrindIt".' });
        
        // Auto-switch back to login screen so they can log in
        setTimeout(() => setIsLogin(true), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: "Access Denied. Check credentials." });
    } finally {
      setLoading(false);
    }
  };

  const theme = {
    bg: isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900',
    card: isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200',
    input: isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${theme.bg}`}>
      <div className={`w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl border ${theme.card}`}>
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight">Neural Access</h2>
          <p className="text-xs font-bold uppercase tracking-widest opacity-50 mt-2">
            {isForgotPassword ? 'Reset Protocol' : isLogin ? 'Authenticate to continue' : 'Invite Code Registration'}
          </p>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl mb-6 text-xs font-bold uppercase tracking-wide text-center ${
            message.type === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Email / Username Field */}
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
            <input 
              type={isLogin && !isForgotPassword ? "text" : "email"} 
              required 
              placeholder={isLogin && !isForgotPassword ? "Email OR Username" : "Secure Email"} 
              value={emailOrUser} 
              onChange={(e) => setEmailOrUser(e.target.value)}
              className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 outline-none font-bold text-sm transition-all ${theme.input}`} 
            />
          </div>

          {/* SIGN UP FIELDS */}
          {!isLogin && !isForgotPassword && (
            <>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
                <input 
                  type="text" 
                  required 
                  placeholder="Agent Name (Username)" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 outline-none font-bold text-sm transition-all ${theme.input}`} 
                />
              </div>
              <div className="relative">
                <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
                <input 
                  type="text" 
                  required 
                  placeholder="Invite Code" 
                  value={inviteCode} 
                  onChange={(e) => setInviteCode(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 outline-none font-bold text-sm transition-all ${theme.input}`} 
                />
              </div>
            </>
          )}

          {/* LOGIN FIELD */}
          {isLogin && !isForgotPassword && (
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
              <input 
                type="password" 
                required 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 outline-none font-bold text-sm transition-all ${theme.input}`} 
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : (
              <>{isForgotPassword ? 'Send Reset Link' : isLogin ? 'Access System' : 'Apply Invite Code'} <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <div className="mt-8 text-center space-y-3">
          {!isForgotPassword && (
            <button 
              onClick={() => { setIsLogin(!isLogin); setMessage({type:'', text:''}); }}
              className="text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 hover:text-blue-500 transition-colors"
            >
              {isLogin ? 'Have an invite code? Sign Up' : 'Already registered? Log In'}
            </button>
          )}
          
          {isLogin && !isForgotPassword && (
            <div className="block">
              <button 
                onClick={() => setIsForgotPassword(true)}
                className="text-[10px] font-bold uppercase tracking-widest text-red-500 opacity-80 hover:opacity-100 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {isForgotPassword && (
            <button 
              onClick={() => setIsForgotPassword(false)}
              className="text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 hover:text-blue-500 transition-colors"
            >
              Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
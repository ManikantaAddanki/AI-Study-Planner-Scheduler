import React, { useState } from 'react';
import { User as UserIcon, LogIn, UserPlus, ShieldAlert, Award, Flame, Star, Sparkles } from 'lucide-react';
import { User } from '../types';

interface AuthViewProps {
  user: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
  onUpdateProfile: (name: string, email: string) => void;
}

export default function AuthView({ user, onLogin, onLogout, onUpdateProfile }: AuthViewProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister ? { name, email, password } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      onLogin(data.user);
      setMessage(data.message);
      if (isRegister) {
        setIsRegister(false);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user?.id, name: editName, email: editEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }
      onUpdateProfile(editName, editEmail);
      setMessage('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (user) {
    return (
      <div id="auth-profile-card" className="bg-[#0e1726]/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-xl max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/[0.06]">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white relative shadow-lg">
            <UserIcon className="w-10 h-10" />
            <div className="absolute -bottom-1 -right-1 bg-indigo-600 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-white/20 shadow font-mono">
              Lv.{user.level}
            </div>
          </div>
          <div className="text-center sm:text-left flex-1 font-display">
            <h2 className="text-xl font-bold flex items-center justify-center sm:justify-start gap-2 text-slate-100">
              {user.name}
              {user.isAdmin && (
                <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider font-mono">
                  Admin
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
            
            <div className="flex flex-wrap gap-3 mt-3 justify-center sm:justify-start font-mono">
              <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 fill-amber-500" />
                <span>{user.streak} Day Streak</span>
              </div>
              <div className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                <Star className="w-3.5 h-3.5 fill-indigo-400 animate-pulse" />
                <span>{user.xp} XP</span>
              </div>
            </div>
          </div>
          <button
            id="logout-btn"
            onClick={onLogout}
            className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 rounded-xl text-[10px] font-bold uppercase tracking-wider font-mono transition cursor-pointer"
          >
            Logout
          </button>
        </div>

        {/* Profile Edit Form */}
        <div className="mt-6">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-indigo-400 font-display">
            <Sparkles className="w-4 h-4" /> Edit Profile Details
          </h3>
          <form onSubmit={handleUpdate} className="space-y-4 font-display">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500/50"
                  required
                />
              </div>
            </div>

            {error && <div className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 font-mono">{error}</div>}
            {message && <div className="text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 font-mono">{message}</div>}

            <button
              id="update-profile-btn"
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* Badges Earned Section */}
        <div className="mt-8 pt-6 border-t border-white/[0.06]">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-amber-400 font-display">
            <Award className="w-4 h-4 animate-bounce" /> Badges & Achievements ({user.badges.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {user.badges.map((badge, idx) => (
              <div key={idx} className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-900/10 border border-indigo-500/10 hover:border-indigo-500/20 transition">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold shrink-0 shadow">
                  🏆
                </div>
                <div className="text-[10px]">
                  <p className="font-bold text-slate-200 font-display">{badge}</p>
                  <p className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider">Unlocked</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-[#0e1726]/40 backdrop-blur-md rounded-2xl p-8 border border-white/5 shadow-xl">
      <div className="text-center mb-6 font-display">
        <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-md">
          {isRegister ? <UserPlus className="w-7 h-7" /> : <LogIn className="w-7 h-7" />}
        </div>
        <h2 className="text-lg font-bold tracking-wider uppercase text-slate-100">
          {isRegister ? 'Create an Account' : 'Welcome to AI Study Planner'}
        </h2>
        <p className="text-[10px] text-slate-400 mt-1.5 max-w-xs mx-auto font-sans leading-relaxed">
          {isRegister ? 'Start optimizing your schedules' : 'Sign in to access your study schedules and progress'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 font-display">
        {isRegister && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500/50"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
          <input
            type="email"
            placeholder="student@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500/50"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500/50"
            required
          />
        </div>

        {error && (
          <div className="text-[11px] text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 flex items-center gap-2 font-mono">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="text-[11px] text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 font-mono">
            {message}
          </div>
        )}

        <button
          id="auth-submit-btn"
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-indigo-600/20 cursor-pointer active:scale-95"
        >
          {isRegister ? 'Sign Up' : 'Sign In'}
        </button>
      </form>

      <div className="text-center mt-6 pt-4 border-t border-white/[0.06] font-mono">
        <button
          onClick={() => {
            setIsRegister(!isRegister);
            setError('');
          }}
          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition cursor-pointer uppercase tracking-wider"
        >
          {isRegister ? 'Already have an account? Sign In' : "Don't have an account yet? Sign Up"}
        </button>
      </div>

      {/* Demo Account Credentials Quick helper */}
      {!isRegister && (
        <div className="mt-4 p-3 rounded-xl bg-indigo-950/10 border border-indigo-500/10 text-center font-mono">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Demo Credentials:</p>
          <p className="text-xs font-bold text-indigo-400 mt-1">student@demo.com / demo123</p>
        </div>
      )}
    </div>
  );
}

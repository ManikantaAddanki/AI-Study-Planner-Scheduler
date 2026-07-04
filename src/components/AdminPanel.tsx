import React, { useState, useEffect } from 'react';
import { User, Subject, ScheduleItem } from '../types';
import { Shield, Users, Calendar, BookOpen, Sparkles, RefreshCw } from 'lucide-react';

export default function AdminPanel() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, subjectsRes, schedulesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users'),
        fetch('/api/admin/subjects'),
        fetch('/api/admin/schedules'),
      ]);

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      const subjectsData = await subjectsRes.json();
      const schedulesData = await schedulesRes.json();

      setStats(statsData);
      setUsers(usersData);
      setSubjects(subjectsData);
      setSchedules(schedulesData);
    } catch (e) {
      console.error('Error fetching admin panels:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Admin header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.06] pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-400 font-display">
            <Shield className="w-5 h-5" />
          </div>
          <div className="font-display">
            <h2 className="text-sm font-bold tracking-wider uppercase text-slate-100">AI Study Planner Admin Panel</h2>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">System metrics, users database, and registered subjects</p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-wider font-mono transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Database
        </button>
      </div>

      {/* Global Counts Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-display">
          <div className="bg-[#0e1726]/40 backdrop-blur-md p-5 rounded-2xl border border-white/5 flex items-center gap-4 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Users</p>
              <p className="text-xl font-black text-slate-200 mt-0.5 font-mono">{stats.totalUsers}</p>
            </div>
          </div>

          <div className="bg-[#0e1726]/40 backdrop-blur-md p-5 rounded-2xl border border-white/5 flex items-center gap-4 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Subjects</p>
              <p className="text-xl font-black text-slate-200 mt-0.5 font-mono">{stats.totalSubjects}</p>
            </div>
          </div>

          <div className="bg-[#0e1726]/40 backdrop-blur-md p-5 rounded-2xl border border-white/5 flex items-center gap-4 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Planned Slots</p>
              <p className="text-xl font-black text-slate-200 mt-0.5 font-mono">{stats.totalSchedules}</p>
            </div>
          </div>

          <div className="bg-[#0e1726]/40 backdrop-blur-md p-5 rounded-2xl border border-white/5 flex items-center gap-4 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Tasks</p>
              <p className="text-xl font-black text-slate-200 mt-0.5 font-mono">{stats.totalTasks}</p>
            </div>
          </div>
        </div>
      )}

      {/* Database Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Users database */}
        <div className="bg-[#0e1726]/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl space-y-4 font-display">
          <h3 className="font-bold text-sm text-slate-200">Registered Student Profiles ({users.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-500 uppercase tracking-widest text-[9px] font-bold font-mono">
                  <th className="pb-3 font-semibold">Name</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Streak</th>
                  <th className="pb-3 font-semibold">Level</th>
                  <th className="pb-3 font-semibold">XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {users.map((u) => (
                  <tr key={u.id} className="text-slate-300">
                    <td className="py-3 font-semibold font-display text-[11px]">{u.name}</td>
                    <td className="py-3 font-mono text-slate-400 text-[10px]">{u.email}</td>
                    <td className="py-3 font-mono text-[10px]">{u.streak} Days</td>
                    <td className="py-3 font-bold text-indigo-400 font-mono text-[10px]">Lv.{u.level}</td>
                    <td className="py-3 font-mono text-slate-400 text-[10px]">{u.xp} XP</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subjects database */}
        <div className="bg-[#0e1726]/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl space-y-4 font-display">
          <h3 className="font-bold text-sm text-slate-200 font-display">Global Enrolled Course Subjects ({subjects.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-500 uppercase tracking-widest text-[9px] font-bold font-mono">
                  <th className="pb-3 font-semibold">Subject Name</th>
                  <th className="pb-3 font-semibold">Difficulty</th>
                  <th className="pb-3 font-semibold">Priority</th>
                  <th className="pb-3 font-semibold">Exam Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {subjects.map((sub) => (
                  <tr key={sub.id} className="text-slate-300">
                    <td className="py-3 font-bold flex items-center gap-1.5 font-display text-[11px]">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }} />
                      {sub.name}
                    </td>
                    <td className="py-3 text-[11px]">{sub.difficulty}</td>
                    <td className="py-3 text-[11px]">{sub.priority}</td>
                    <td className="py-3 font-mono text-slate-400 text-[10px]">{sub.examDate || 'No date'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

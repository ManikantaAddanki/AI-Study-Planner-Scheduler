import React from 'react';
import { Subject, Task, ScheduleItem } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
} from 'recharts';
import { Award, Target, BookOpen, AlertCircle, Sparkles } from 'lucide-react';

interface AnalyticsViewProps {
  subjects: Subject[];
  tasks: Task[];
  schedule: ScheduleItem[];
}

export default function AnalyticsView({ subjects, tasks, schedule }: AnalyticsViewProps) {
  // 1. Completion Rate calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 2. Study Hours per subject
  const subjectHoursData = subjects.map((sub) => {
    // Calculate total hours allocated to this subject in the schedule
    const subSlots = schedule.filter((it) => it.subject === sub.name && !it.isBreak);
    const totalMinutes = subSlots.length * 60; // assume 60 min sessions for simplicity
    return {
      name: sub.name,
      hours: Number((totalMinutes / 60).toFixed(1)),
      color: sub.color,
    };
  });

  // 3. Weekly Hours progress
  const weeklyHoursData = [
    { day: 'Mon', hours: 4.5 },
    { day: 'Tue', hours: 5.0 },
    { day: 'Wed', hours: 3.5 },
    { day: 'Thu', hours: 6.0 },
    { day: 'Fri', hours: 4.0 },
    { day: 'Sat', hours: 7.5 },
    { day: 'Sun', hours: 5.5 },
  ];

  // 4. Tasks distribution by priority
  const highPriorityTasks = tasks.filter((t) => t.priority === 'High');
  const mediumPriorityTasks = tasks.filter((t) => t.priority === 'Medium');
  const lowPriorityTasks = tasks.filter((t) => t.priority === 'Low');

  const priorityData = [
    { name: 'High', count: highPriorityTasks.length, fill: '#ef4444' },
    { name: 'Medium', count: mediumPriorityTasks.length, fill: '#6366f1' },
    { name: 'Low', count: lowPriorityTasks.length, fill: '#10b981' },
  ];

  // 5. Weak areas summary
  const allWeakAreas = subjects.flatMap((s) => s.weakTopics.map((topic) => ({ subject: s.name, topic })));

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-display">
        <div className="bg-[#0e1726]/40 backdrop-blur-md border border-white/5 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Task Completion</p>
            <p className="text-xl font-bold text-slate-100">{completionRate}%</p>
            <p className="text-[9px] text-slate-500 font-mono font-bold uppercase">{completedTasks} of {totalTasks} finished</p>
          </div>
        </div>

        <div className="bg-[#0e1726]/40 backdrop-blur-md border border-white/5 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Study Level</p>
            <p className="text-xl font-bold text-slate-100">Level {Math.max(1, Math.floor(completedTasks * 30 / 200) + 1)}</p>
            <p className="text-[9px] text-slate-500 font-mono font-bold uppercase">Keep completing tasks</p>
          </div>
        </div>

        <div className="bg-[#0e1726]/40 backdrop-blur-md border border-white/5 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">tracked load</p>
            <p className="text-xl font-bold text-slate-100">{subjects.length}</p>
            <p className="text-[9px] text-slate-500 font-mono font-bold uppercase">Optimized exam load</p>
          </div>
        </div>

        <div className="bg-[#0e1726]/40 backdrop-blur-md border border-white/5 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Unchecked high</p>
            <p className="text-xl font-bold text-slate-100">{highPriorityTasks.filter(t => !t.completed).length}</p>
            <p className="text-[9px] text-slate-500 font-mono font-bold uppercase">Requires attention</p>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Hours progress Area chart */}
        <div className="bg-[#0e1726]/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl space-y-4">
          <h3 className="font-bold text-sm text-slate-200 font-display">Weekly Study Hours Progress</h3>
          <div className="h-64 font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyHoursData}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '12px' }}
                  labelClassName="text-slate-200 font-bold text-xs"
                />
                <Area type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Study Hours distribution per subject */}
        <div className="bg-[#0e1726]/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl space-y-4">
          <h3 className="font-bold text-sm text-slate-200 font-display">Study Hours Allocated Per Subject</h3>
          {subjectHoursData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-xs italic font-sans">
              No subjects or schedules available. Generate a schedule to see hours allocation.
            </div>
          ) : (
            <div className="h-64 font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectHoursData} barSize={28}>
                  <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090d16', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '12px' }}
                    labelClassName="text-slate-200 font-bold text-xs"
                  />
                  <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                    {subjectHoursData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Row: Tasks priority and Weak Topics Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-[#0e1726]/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl space-y-4 flex flex-col justify-between">
          <h3 className="font-bold text-sm text-slate-200 font-display">Task Priorities</h3>
          <div className="h-56 flex items-center justify-center font-mono">
            {tasks.length === 0 ? (
              <p className="text-slate-500 text-xs italic font-sans">No tasks pending</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090d16', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '12px' }}
                    labelClassName="text-slate-200"
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex justify-around text-[10px] font-bold font-mono pt-3 border-t border-white/[0.06] uppercase tracking-wider">
            <span className="text-rose-400 flex items-center gap-1">● High ({highPriorityTasks.length})</span>
            <span className="text-indigo-400 flex items-center gap-1">● Med ({mediumPriorityTasks.length})</span>
            <span className="text-emerald-400 flex items-center gap-1">● Low ({lowPriorityTasks.length})</span>
          </div>
        </div>

        {/* Weak Areas Tracker list */}
        <div className="lg:col-span-8 bg-[#0e1726]/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl space-y-4">
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2 font-display">
            <Sparkles className="w-4 h-4 text-amber-400" /> Weak Topic Directory ({allWeakAreas.length})
          </h3>

          {allWeakAreas.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-12 text-center font-sans">No weak topics tracked yet. Add them in Subject Management!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
              {allWeakAreas.map((wa, i) => (
                <div key={i} className="p-3 bg-slate-950/25 border border-white/[0.04] rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-250 font-display">{wa.topic}</h4>
                    <p className="text-[10px] text-indigo-400 font-bold font-mono uppercase tracking-wider mt-0.5">{wa.subject}</p>
                  </div>
                  <span className="text-[8px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded font-bold font-mono uppercase tracking-widest">
                    Targeted
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

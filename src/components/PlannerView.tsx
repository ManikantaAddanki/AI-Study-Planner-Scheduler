import React, { useState } from 'react';
import { Subject, ScheduleItem } from '../types';
import { Calendar, Sparkles, Clock, Coffee, Eye, EyeOff, Save, Trash2, ShieldAlert } from 'lucide-react';

interface PlannerViewProps {
  subjects: Subject[];
  onGenerateSchedule: (preferences: any) => Promise<ScheduleItem[] | null>;
  schedule: ScheduleItem[];
  loading: boolean;
}

export default function PlannerView({ subjects, onGenerateSchedule, schedule, loading }: PlannerViewProps) {
  const [availableHours, setAvailableHours] = useState('6');
  const [breakDuration, setBreakDuration] = useState('15');
  const [wakeupTime, setWakeupTime] = useState('08:00');
  const [sleepTime, setSleepTime] = useState('23:00');
  const [sessionLength, setSessionLength] = useState('60');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (subjects.length === 0) {
      setError('Please add at least one subject in Subject Management before generating a schedule!');
      return;
    }

    const res = await onGenerateSchedule({
      date,
      availableHours: Number(availableHours),
      breakDuration: Number(breakDuration),
      wakeupTime,
      sleepTime,
      sessionLength: Number(sessionLength),
    });

    if (res) {
      setMessage('Schedule generated and optimized successfully by your AI Coach!');
    } else {
      setError('Generation failed. Using automated fallback schedules.');
    }
  };

  const todaySchedule = schedule.filter(it => it.date === date);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Preferences Form */}
        <div className="lg:col-span-5 bg-[#0e1726]/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl h-fit">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-bold font-display text-slate-100">Configure AI Planner</h2>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 font-mono">Target Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition duration-150"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-400" /> Available Hours
                </label>
                <input
                  type="number"
                  value={availableHours}
                  onChange={(e) => setAvailableHours(e.target.value)}
                  min={1}
                  max={16}
                  className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition duration-150"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 font-mono flex items-center gap-1">
                  <Coffee className="w-3 h-3 text-indigo-400" /> Break Min
                </label>
                <input
                  type="number"
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(e.target.value)}
                  min={5}
                  max={60}
                  className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition duration-150"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 font-mono">Wake-up Time</label>
                <input
                  type="time"
                  value={wakeupTime}
                  onChange={(e) => setWakeupTime(e.target.value)}
                  className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition duration-150"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 font-mono">Sleep Time</label>
                <input
                  type="time"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition duration-150"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 font-mono">Session Length</label>
              <select
                value={sessionLength}
                onChange={(e) => setSessionLength(e.target.value)}
                className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition duration-150 cursor-pointer"
              >
                <option value="25">25 mins (Pomodoro standard)</option>
                <option value="45">45 mins</option>
                <option value="50">50 mins (Optimal concentration)</option>
                <option value="60">60 mins (Standard hour)</option>
                <option value="90">90 mins (Deep Focus block)</option>
              </select>
            </div>

            {error && (
              <div className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 flex items-center gap-2 font-sans">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 font-sans">
                {message}
              </div>
            )}

            <button
              id="generate-planner-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-display py-3 px-4 rounded-xl text-xs transition duration-200 mt-2 shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Analyzing constraints & subjects...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Generate Study Schedule
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Hourly Daily Schedule Output */}
        <div className="lg:col-span-7 bg-[#0e1726]/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2 text-indigo-300 font-display">
                  <Calendar className="w-4 h-4 text-indigo-400" /> Hourly Study Timetable
                </h2>
                <p className="text-xs text-slate-400 font-medium font-sans mt-1">Generated schedule for {date}</p>
              </div>
              {todaySchedule.length > 0 && (
                <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/25 font-mono">
                  Optimized
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-8 h-8 rounded-full border-4 border-indigo-500/30 border-t-indigo-400 animate-spin" />
                <div className="text-center">
                  <p className="text-indigo-300 font-bold font-display text-sm animate-pulse">Running Recall Optimization...</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm font-sans leading-relaxed">
                    Gemini AI is arranging subjects based on difficulty, priority, and exam dates to maximize active recall.
                  </p>
                </div>
              </div>
            ) : todaySchedule.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
                <Clock className="w-8 h-8 text-slate-500" />
                <div>
                  <p className="text-xs font-semibold text-slate-300 font-display">No schedule created for {date}</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm font-sans leading-relaxed">
                    Adjust your preferences on the left and click "Generate Study Schedule" to start planning!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {todaySchedule.map((item, idx) => {
                  const matchingSubject = subjects.find(s => s.name === item.subject);
                  const colorCode = item.isBreak ? '#475569' : matchingSubject?.color || '#6366f1';

                  return (
                    <div
                      key={item.id || idx}
                      className="p-3.5 rounded-xl border border-white/[0.04] bg-slate-900/25 hover:bg-slate-900/45 transition duration-150 flex gap-4"
                    >
                      {/* Time slot indicator */}
                      <div className="flex flex-col items-center justify-center border-r border-white/[0.06] pr-4 min-w-[75px] shrink-0 font-mono text-xs">
                        <span className="font-bold text-slate-200">{item.startTime}</span>
                        <span className="text-slate-500 text-[10px] my-0.5">to</span>
                        <span className="font-bold text-slate-200">{item.endTime}</span>
                      </div>

                      {/* Schedule item payload */}
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colorCode }} />
                          <h3 className="font-bold text-xs text-slate-100 font-display truncate">{item.subject}</h3>
                          
                          {item.isRevision && (
                            <span className="text-[8px] font-bold font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                              Revision Slot
                            </span>
                          )}
                        </div>

                        {item.topic && (
                          <p className="text-[11px] text-slate-400 font-mono font-bold uppercase tracking-wider italic">
                            Topic: {item.topic}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Export utility */}
          {todaySchedule.length > 0 && (
            <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/[0.06] justify-end">
              <button
                onClick={() => {
                  const headers = ['Start Time', 'End Time', 'Subject', 'Topic', 'Revision'];
                  const csvRows = [headers.join(',')];
                  todaySchedule.forEach(it => {
                    csvRows.push([
                      `"${it.startTime}"`,
                      `"${it.endTime}"`,
                      `"${it.subject}"`,
                      `"${it.topic || ''}"`,
                      `"${it.isRevision ? 'Yes' : 'No'}"`
                    ].join(','));
                  });
                  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `study_schedule_${date}.csv`;
                  a.click();
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg border border-white/5 transition flex items-center gap-1.5 font-display cursor-pointer"
              >
                Export CSV
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg transition flex items-center gap-1.5 font-display cursor-pointer"
              >
                Print Schedule
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

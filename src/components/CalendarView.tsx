import React, { useState } from 'react';
import { Subject, ScheduleItem, Task } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Award } from 'lucide-react';

interface CalendarViewProps {
  schedule: ScheduleItem[];
  subjects: Subject[];
  tasks: Task[];
}

export default function CalendarView({ schedule, subjects, tasks }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Helper date calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(currentDate.getDate() - 7);
      setCurrentDate(prevWeek);
    } else {
      const prevDay = new Date(currentDate);
      prevDay.setDate(currentDate.getDate() - 1);
      setCurrentDate(prevDay);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(currentDate.getDate() + 7);
      setCurrentDate(nextWeek);
    } else {
      const nextDay = new Date(currentDate);
      nextDay.setDate(currentDate.getDate() + 1);
      setCurrentDate(nextDay);
    }
  };

  const pad = (n: number) => n.toString().padStart(2, '0');

  // Month View rendering
  const renderMonthDays = () => {
    const days = [];
    // Blank padding days
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="h-28 border border-white/5 bg-slate-950/20 opacity-20" />);
    }

    // Actual calendar days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
      const daySchedules = schedule.filter(it => it.date === dateStr);
      const dayTasks = tasks.filter(t => t.deadline === dateStr);

      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      days.push(
        <div
          key={`day-${day}`}
          className={`h-28 border border-white/5 p-2 bg-slate-950/25 hover:bg-slate-950/50 transition flex flex-col justify-between ${
            isToday ? 'ring-1 ring-indigo-500 bg-indigo-950/30' : ''
          }`}
        >
          <div className="flex items-center justify-between font-mono">
            <span className={`text-[10px] font-bold ${isToday ? 'text-indigo-400 bg-indigo-500/20 px-1.5 py-0.5 rounded-md' : 'text-slate-400'}`}>
              {day}
            </span>
          </div>

          {/* Agenda list for this day */}
          <div className="flex-1 mt-1 space-y-1 overflow-y-auto max-h-20 scrollbar-none pr-0.5">
            {daySchedules.map((sch, sIdx) => {
              const sub = subjects.find(s => s.name === sch.subject);
              return (
                <div
                  key={sIdx}
                  className="text-[8px] font-bold px-1.5 py-0.5 rounded text-white truncate font-display"
                  style={{ backgroundColor: sch.isBreak ? '#475569' : sub?.color || '#6366f1' }}
                  title={`${sch.startTime}-${sch.endTime}: ${sch.subject}`}
                >
                  {sch.startTime} {sch.subject}
                </div>
              );
            })}

            {dayTasks.map((t, tIdx) => (
              <div
                key={tIdx}
                className={`text-[8px] font-bold px-1.5 py-0.5 rounded border truncate font-display ${
                  t.completed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 line-through' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}
                title={`Task: ${t.title}`}
              >
                ✏️ {t.title}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  // Week View rendering
  const renderWeekDays = () => {
    // Find the starting Sunday of the current week
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = currentDate.getDay();
    startOfWeek.setDate(currentDate.getDate() - dayOfWeek);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);

      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const daySchedules = schedule.filter(it => it.date === dateStr);
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      weekDays.push(
        <div
          key={i}
          className={`flex-1 min-h-[400px] border border-white/5 p-3 flex flex-col gap-3 rounded-2xl bg-slate-950/20 hover:bg-slate-950/40 transition ${
            isToday ? 'ring-1 ring-indigo-500 bg-indigo-950/20' : ''
          }`}
        >
          <div className="text-center pb-2 border-b border-white/[0.06]">
            <p className="text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}
            </p>
            <p className={`text-sm font-bold mt-1 font-mono ${isToday ? 'text-indigo-400 bg-indigo-500/20 w-8 h-8 rounded-full flex items-center justify-center mx-auto font-black' : 'text-slate-200'}`}>
              {d.getDate()}
            </p>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px]">
            {daySchedules.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center py-6 italic font-sans">No study slots</p>
            ) : (
              daySchedules.map((sch, sIdx) => {
                const sub = subjects.find(s => s.name === sch.subject);
                return (
                  <div
                    key={sIdx}
                    className="p-2 rounded-xl text-left text-xs border border-white/5"
                    style={{ borderLeft: `3px solid ${sch.isBreak ? '#475569' : sub?.color || '#6366f1'}`, backgroundColor: 'rgba(15,23,42,0.5)' }}
                  >
                    <div className="flex items-center justify-between font-bold text-[9px] text-slate-400 font-mono">
                      <span>{sch.startTime}</span>
                      {sch.isRevision && <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1 rounded font-bold uppercase">Rev</span>}
                    </div>
                    <p className="font-bold text-slate-200 truncate mt-1 text-[11px] font-display">{sch.subject}</p>
                    {sch.topic && <p className="text-[9px] text-slate-400 truncate mt-0.5 italic font-sans">{sch.topic}</p>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      );
    }
    return weekDays;
  };

  // Day View rendering
  const renderDaySchedule = () => {
    const dateStr = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-${pad(currentDate.getDate())}`;
    const daySchedules = schedule.filter(it => it.date === dateStr);

    return (
      <div className="bg-[#0e1726]/30 border border-white/5 rounded-2xl p-6 max-w-2xl mx-auto space-y-4">
        <h3 className="text-sm font-bold text-slate-200 border-b border-white/[0.06] pb-3 flex items-center gap-2 font-display">
          <Clock className="w-4 h-4 text-indigo-400" /> Hourly Focus Schedule for {dateStr}
        </h3>

        {daySchedules.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <CalendarIcon className="w-12 h-12 text-slate-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-300 font-display">No study sessions generated for today.</p>
            <p className="text-[10px] text-slate-500 mt-1 font-sans">Go to the AI Study Planner to schedule study blocks.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {daySchedules.map((sch, idx) => {
              const sub = subjects.find(s => s.name === sch.subject);
              return (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-3 rounded-xl border border-white/[0.04] hover:bg-slate-900/30 transition"
                >
                  <div className="w-20 font-mono text-[10px] font-bold text-indigo-400 text-center shrink-0 border-r border-white/10 pr-3">
                    {sch.startTime} - {sch.endTime}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sch.isBreak ? '#475569' : sub?.color || '#6366f1' }} />
                        <h4 className="font-bold text-slate-200 text-xs font-display">{sch.subject}</h4>
                      </div>
                      {sch.topic && <p className="text-[10px] text-slate-400 mt-1 italic font-sans">{sch.topic}</p>}
                    </div>
                    {sch.isRevision && (
                      <span className="text-[8px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded tracking-widest uppercase font-mono">
                        Revision
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#0e1726]/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl space-y-6">
      {/* Calendar header controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-100 font-display">
            {viewMode === 'month' ? `${months[month]} ${year}` : `Week / Day Focus`}
          </h2>
        </div>

        {/* Navigation toggles */}
        <div className="flex items-center gap-4 font-display">
          <div className="flex rounded-xl bg-slate-950/40 p-1 border border-white/5 text-[10px]">
            {['month', 'week', 'day'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as 'month' | 'week' | 'day')}
                className={`px-3 py-1.5 rounded-lg font-bold capitalize transition cursor-pointer ${
                  viewMode === mode ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-950/40 rounded-xl p-1 border border-white/5">
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar Viewboards */}
      {viewMode === 'month' && (
        <div className="space-y-2">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 text-center font-bold text-[10px] text-slate-500 pb-2 border-b border-white/[0.06] uppercase tracking-widest font-mono">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">{renderMonthDays()}</div>
        </div>
      )}

      {viewMode === 'week' && (
        <div className="flex flex-col md:flex-row gap-2 mt-4">{renderWeekDays()}</div>
      )}

      {viewMode === 'day' && <div className="mt-4">{renderDaySchedule()}</div>}
    </div>
  );
}

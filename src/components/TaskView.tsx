import React, { useState } from 'react';
import { Task, Subject, Priority } from '../types';
import { Plus, Trash2, CheckCircle2, Circle, AlertCircle, Calendar, Sparkles } from 'lucide-react';

interface TaskViewProps {
  tasks: Task[];
  subjects: Subject[];
  onAddTask: (task: Partial<Task>) => void;
  onToggleTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

export default function TaskView({ tasks, subjects, onAddTask, onToggleTask, onDeleteTask }: TaskViewProps) {
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      deadline: deadline || new Date().toISOString().split('T')[0],
      subjectId: subjectId || undefined,
      priority,
      completed: false,
    });

    setTitle('');
    setDeadline('');
    setSubjectId('');
    setPriority('Medium');
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const prioWeight = { High: 3, Medium: 2, Low: 1 };
    return prioWeight[b.priority] - prioWeight[a.priority];
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Create Task Form */}
      <div className="lg:col-span-4 bg-[#0e1726]/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl h-fit">
        <h2 className="text-base font-bold font-display mb-5 flex items-center gap-2 text-slate-100">
          <Plus className="w-4 h-4 text-indigo-400" /> Add Study Task
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 font-mono">Task Title / Description</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Complete DBMS normalization ER diagrams"
              className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition duration-150"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 font-mono">Linked Subject (Optional)</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition duration-150 cursor-pointer"
            >
              <option value="">-- No Linked Subject --</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-indigo-300 mt-2.5 flex items-center gap-1 font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" /> Auto-spaced repetition trigger
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 font-mono">Deadline Date</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition duration-150"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 font-mono">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition duration-150 cursor-pointer"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <button
            id="add-task-btn"
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-display py-2.5 px-4 rounded-xl text-xs transition duration-200 mt-2 shadow shadow-indigo-600/10 cursor-pointer active:scale-98"
          >
            Create Task
          </button>
        </form>
      </div>

      {/* Right Column: Task Tracker Lists */}
      <div className="lg:col-span-8 bg-[#0e1726]/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-4">
          <h2 className="text-base font-bold font-display flex items-center gap-2 text-slate-100">
            <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Pending Task Tracker ({sortedTasks.filter(t => !t.completed).length})
          </h2>
          <div className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-3 py-1 rounded-md font-bold font-mono uppercase tracking-wider">
            +{tasks.filter(t => t.completed).length * 30} XP Earned
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-16 text-slate-400 font-sans">
            <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-300">Your task list is clear!</p>
            <p className="text-[11px] text-slate-500 mt-1">Add a homework assignment or project deadline to get started.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {sortedTasks.map((t) => {
              const matchingSubject = subjects.find((s) => s.id === t.subjectId);
              return (
                <div
                  key={t.id}
                  className={`p-3.5 rounded-2xl border transition duration-150 flex items-center justify-between gap-4 ${
                    t.completed
                      ? 'bg-[#0e1726]/10 border-white/[0.02] opacity-50'
                      : 'bg-[#0e1726]/20 border-white/[0.04] hover:border-indigo-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    {/* Checkbox button */}
                    <button
                      onClick={() => onToggleTask(t)}
                      className="text-slate-500 hover:text-indigo-400 shrink-0 transition cursor-pointer"
                    >
                      {t.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/10" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <p
                        className={`text-xs font-bold text-slate-100 font-display truncate ${
                          t.completed ? 'line-through text-slate-500' : ''
                        }`}
                      >
                        {t.title}
                      </p>

                      <div className="flex flex-wrap items-center gap-2.5 text-[9px] font-mono font-bold">
                        {matchingSubject && (
                          <span
                            className="px-2 py-0.5 rounded text-white"
                            style={{ backgroundColor: matchingSubject.color }}
                          >
                            {matchingSubject.name.toUpperCase()}
                          </span>
                        )}

                        <span
                          className={`px-2 py-0.5 rounded ${
                            t.priority === 'High'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                              : t.priority === 'Medium'
                              ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                              : 'bg-slate-500/15 text-slate-400 border border-slate-500/20'
                          }`}
                        >
                          {t.priority.toUpperCase()}
                        </span>

                        <span className="text-slate-400 flex items-center gap-1 font-medium">
                          <Calendar className="w-2.5 h-2.5" /> DUE: {t.deadline}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <button
                      onClick={() => onDeleteTask(t.id)}
                      className="p-2 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 border border-transparent rounded-lg transition cursor-pointer"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

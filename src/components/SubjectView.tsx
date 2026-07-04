import React, { useState } from 'react';
import { Subject, Difficulty, Priority } from '../types';
import { Plus, Trash2, Calendar, BookOpen, AlertCircle, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';

interface SubjectViewProps {
  subjects: Subject[];
  onAddSubject: (subject: Partial<Subject>) => void;
  onDeleteSubject: (id: string) => void;
  onAnalyzeWeakArea: (subjectName: string, topic: string) => void;
  analysisLoading: boolean;
  analysisResult: string | null;
}

export default function SubjectView({
  subjects,
  onAddSubject,
  onDeleteSubject,
  onAnalyzeWeakArea,
  analysisLoading,
  analysisResult,
}: SubjectViewProps) {
  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [examDate, setExamDate] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [preferredStudyDuration, setPreferredStudyDuration] = useState(60);
  const [color, setColor] = useState('#6366f1'); // Indigo default

  const [activeAnalysisTopic, setActiveAnalysisTopic] = useState<string | null>(null);

  const handleAddTopic = () => {
    if (newTopic.trim() && !weakTopics.includes(newTopic.trim())) {
      setWeakTopics([...weakTopics, newTopic.trim()]);
      setNewTopic('');
    }
  };

  const handleRemoveTopic = (index: number) => {
    setWeakTopics(weakTopics.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddSubject({
      name: name.trim(),
      difficulty,
      priority,
      examDate,
      weakTopics,
      preferredStudyDuration,
      color,
    });

    // Reset Form
    setName('');
    setDifficulty('Medium');
    setPriority('Medium');
    setExamDate('');
    setWeakTopics([]);
    setPreferredStudyDuration(60);
    setColor('#6366f1');
  };

  const colorOptions = [
    '#6366f1', // Indigo
    '#3b82f6', // Blue
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#eab308', // Yellow
    '#f97316', // Orange
    '#ef4444', // Red
    '#ec4899', // Pink
    '#8b5cf6', // Violet
  ];

  return (
    <div className="space-y-6">
      {/* Subject Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-display">
        <div className="bg-gradient-to-br from-indigo-500/10 to-[#0e1726]/40 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl transition-all duration-300 hover:border-indigo-500/20 hover:shadow-indigo-500/5">
          <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold font-mono">Total Subjects</p>
          <p className="text-3xl font-bold text-indigo-400 mt-2">{subjects.length}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-500/10 to-[#0e1726]/40 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl transition-all duration-300 hover:border-rose-500/20 hover:shadow-rose-500/5">
          <p className="text-[10px] text-rose-400 uppercase tracking-widest font-bold font-mono">High Priority</p>
          <p className="text-3xl font-bold text-rose-400 mt-2">
            {subjects.filter((s) => s.priority === 'High').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/10 to-[#0e1726]/40 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl transition-all duration-300 hover:border-emerald-500/20 hover:shadow-emerald-500/5">
          <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold font-mono">Weak Topics Tracked</p>
          <p className="text-3xl font-bold text-emerald-400 mt-2">
            {subjects.reduce((acc, curr) => acc + curr.weakTopics.length, 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Create Subject */}
        <div className="lg:col-span-5 bg-[#0e1726]/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl h-fit">
          <h2 className="text-base font-bold font-display mb-5 flex items-center gap-2 text-slate-100">
            <Plus className="w-4 h-4 text-indigo-400" /> Add New Subject
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 font-mono">Subject Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Python Programming"
                className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition duration-150"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 font-mono">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition duration-150 cursor-pointer"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 font-mono">Exam Date</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition duration-150"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 font-mono">Study Target (Min)</label>
                <input
                  type="number"
                  value={preferredStudyDuration}
                  onChange={(e) => setPreferredStudyDuration(Number(e.target.value))}
                  min={15}
                  max={240}
                  className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition duration-150"
                />
              </div>
            </div>

            {/* Weak Topics */}
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 font-mono">Weak Topics / Pain Points</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g. Decorators, Normalization"
                  className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition duration-150"
                />
                <button
                  type="button"
                  onClick={handleAddTopic}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 rounded-xl text-xs font-bold font-display transition duration-200 flex items-center justify-center cursor-pointer active:scale-95"
                >
                  Add
                </button>
              </div>

              {weakTopics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {weakTopics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 font-mono font-bold"
                    >
                      {topic}
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(idx)}
                        className="text-indigo-400 hover:text-indigo-200 cursor-pointer text-xs ml-0.5"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Color selection */}
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 font-mono">Schedule Label Color</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {colorOptions.map((co) => (
                  <button
                    key={co}
                    type="button"
                    onClick={() => setColor(co)}
                    style={{ backgroundColor: co }}
                    className={`w-6 h-6 rounded-full border-2 transition cursor-pointer ${
                      color === co ? 'border-white scale-115' : 'border-transparent hover:scale-110'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              id="add-subject-btn"
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-display py-2.5 px-4 rounded-xl text-xs transition duration-200 mt-2 shadow shadow-indigo-600/10 cursor-pointer active:scale-98"
            >
              Save Subject
            </button>
          </form>
        </div>

        {/* Right Side: Subjects List & AI Coaching */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0e1726]/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl">
            <h2 className="text-base font-bold font-display mb-4 flex items-center gap-2 text-slate-100">
              <BookOpen className="w-4 h-4 text-indigo-400" /> My Enrolled Subjects ({subjects.length})
            </h2>

            {subjects.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-sans">No subjects registered yet. Add your first subject to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-1">
                {subjects.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-2xl border border-white/[0.04] bg-[#0e1726]/20 hover:bg-slate-900/35 transition duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                        <h3 className="font-bold text-sm text-slate-100 font-display">{sub.name}</h3>
                      </div>

                      <div className="flex flex-wrap gap-2 text-[9px] font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded-md ${
                          sub.difficulty === 'Hard' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          sub.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {sub.difficulty} DIFFICULTY
                        </span>

                        <span className={`px-2 py-0.5 rounded-md ${
                          sub.priority === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          sub.priority === 'Medium' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                          'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}>
                          {sub.priority} PRIORITY
                        </span>

                        {sub.examDate && (
                          <span className="bg-white/[0.03] border border-white/5 text-slate-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" /> EXAM: {sub.examDate}
                          </span>
                        )}
                      </div>

                      {/* Weak Topics list */}
                      {sub.weakTopics.length > 0 && (
                        <div className="pt-2">
                          <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider mb-1.5">Pain points & weak areas:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {sub.weakTopics.map((topic, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  setActiveAnalysisTopic(topic);
                                  onAnalyzeWeakArea(sub.name, topic);
                                }}
                                className="bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/15 hover:border-indigo-500/30 text-indigo-300 text-[9px] px-2 py-0.5 rounded-md transition flex items-center gap-1 cursor-pointer font-bold font-mono uppercase"
                              >
                                {topic}
                                <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 justify-end shrink-0">
                      <button
                        onClick={() => onDeleteSubject(sub.id)}
                        className="p-2.5 text-rose-400 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/25 rounded-xl transition cursor-pointer"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Coaching Panel */}
          {(analysisLoading || analysisResult) && (
            <div className="bg-gradient-to-br from-indigo-950/40 to-[#0e1726]/40 backdrop-blur-md border border-indigo-500/20 p-6 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-bold font-display text-sm flex items-center gap-2 text-indigo-300">
                  <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                  AI Study Coach Advice
                </h3>
                {activeAnalysisTopic && (
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-md font-mono font-bold">
                    STRUGGLING WITH: {activeAnalysisTopic.toUpperCase()}
                  </span>
                )}
              </div>

              {analysisLoading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-8 h-8 rounded-full border-4 border-indigo-500/30 border-t-indigo-400 animate-spin" />
                  <p className="text-xs text-indigo-300 font-bold font-mono">Deconstructing topic, formulating solutions...</p>
                </div>
              ) : (
                <div className="text-slate-200 text-xs leading-relaxed max-h-[300px] overflow-y-auto pr-1 whitespace-pre-line prose prose-invert font-sans">
                  {analysisResult}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

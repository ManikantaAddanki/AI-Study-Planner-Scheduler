import React, { useState, useEffect } from 'react';
import { ClassRecording, Subject, Bookmark } from '../types';
import {
  Video,
  Plus,
  Trash2,
  Search,
  Sparkles,
  Clock,
  Calendar,
  Bookmark as BookmarkIcon,
  ChevronRight,
  GraduationCap,
  CheckCircle,
  BookOpen,
  FileText,
  Volume2,
  RefreshCw,
  ExternalLink,
  Brain,
  HelpCircle,
  ChevronLeft
} from 'lucide-react';

interface RecordingsViewProps {
  subjects: Subject[];
  onTriggerNotification: (msg: string) => void;
  onRefreshUserStats: () => void;
}

// Simple and beautiful custom markdown parser to support bold, lists, and code blocks inline
function SimpleMarkdown({ text }: { text: string }) {
  if (!text) return null;
  
  const lines = text.split('\n');
  return (
    <div className="space-y-2 text-slate-300 text-xs font-sans leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        
        // Headers
        if (trimmed.startsWith('### ')) {
          return <h4 key={idx} className="text-sm font-bold text-indigo-300 font-display mt-4 mb-2">{trimmed.slice(4)}</h4>;
        }
        if (trimmed.startsWith('## ')) {
          return <h3 key={idx} className="text-base font-extrabold text-indigo-400 font-display mt-5 mb-2.5">{trimmed.slice(3)}</h3>;
        }
        if (trimmed.startsWith('# ')) {
          return <h2 key={idx} className="text-lg font-black text-indigo-400 font-display mt-6 mb-3">{trimmed.slice(2)}</h2>;
        }

        // Bullet points
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex gap-2.5 pl-2 py-0.5">
              <span className="text-indigo-400 text-sm leading-none">•</span>
              <p className="flex-1 text-slate-300">{parseInlineStyles(trimmed.slice(2))}</p>
            </div>
          );
        }

        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex gap-2.5 pl-2 py-0.5 font-sans">
              <span className="text-indigo-400 font-bold font-mono text-[10px]">{numMatch[1]}.</span>
              <p className="flex-1 text-slate-300">{parseInlineStyles(numMatch[2])}</p>
            </div>
          );
        }

        // Code block placeholders
        if (trimmed.startsWith('```')) {
          return null; // Skip code formatting tags or wrap logic nicely
        }

        if (trimmed === '') {
          return <div key={idx} className="h-2" />;
        }

        return <p key={idx}>{parseInlineStyles(trimmed)}</p>;
      })}
    </div>
  );
}

// Support bold (`**word**` or `*word*`) and inline code (``code``)
function parseInlineStyles(rawText: string): React.ReactNode {
  let text = rawText;
  const parts: React.ReactNode[] = [];
  
  // Basic regex parser for simplicity
  const boldRegex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;
  
  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(<strong key={match.index} className="text-slate-100 font-semibold">{match[1]}</strong>);
    lastIndex = boldRegex.lastIndex;
  }
  
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? <>{parts}</> : text;
}

export default function RecordingsView({ subjects, onTriggerNotification, onRefreshUserStats }: RecordingsViewProps) {
  const [recordings, setRecordings] = useState<ClassRecording[]>([]);
  const [activeRecording, setActiveRecording] = useState<ClassRecording | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Forms & Adding Mode
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [duration, setDuration] = useState<number>(45);
  const [notes, setNotes] = useState('');
  const [transcript, setTranscript] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Inside Selected recording actions
  const [detailTab, setDetailTab] = useState<'player' | 'summary' | 'quiz'>('player');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  
  // Quiz student inputs
  const [quizAnswers, setQuizAnswers] = useState<string[]>(['', '', '']);
  const [showAnswerKeys, setShowAnswerKeys] = useState(false);

  // Bookmark inputs
  const [bmTime, setBmTime] = useState('');
  const [bmTitle, setBmTitle] = useState('');

  // Fetch recordings
  const fetchRecordings = async () => {
    try {
      const res = await fetch('/api/recordings');
      const data = await res.json();
      setRecordings(data);
      if (data.length > 0 && !activeRecording) {
        setActiveRecording(data[0]);
      }
    } catch (e) {
      console.error('Error fetching class recordings:', e);
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

  const handleCreateNew = () => {
    setIsAdding(true);
    setTitle('');
    setRecordingUrl('');
    setDuration(45);
    setNotes('');
    setTranscript('');
    setSubjectId(subjects[0]?.id || '');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleSaveRecording = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subjectId) {
      onTriggerNotification('Please provide a title and select a subject.');
      return;
    }

    const selectedSub = subjects.find(s => s.id === subjectId);
    const recData: Partial<ClassRecording> = {
      id: activeRecording && !isAdding ? activeRecording.id : undefined,
      subjectId,
      subjectName: selectedSub ? selectedSub.name : 'General',
      title: title.trim(),
      recordingUrl: recordingUrl.trim(),
      date,
      duration: Number(duration),
      notes: notes.trim(),
      transcript: transcript.trim(),
      bookmarks: activeRecording && !isAdding ? activeRecording.bookmarks : []
    };

    try {
      const res = await fetch('/api/recordings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recData),
      });
      const data = await res.json();
      
      onTriggerNotification(activeRecording && !isAdding ? 'Class Recording updated!' : 'Class Recording added successfully!');
      
      // Reload recordings list
      await fetchRecordings();
      setActiveRecording(data);
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this recording?')) return;
    try {
      await fetch(`/api/recordings/${id}`, { method: 'DELETE' });
      onTriggerNotification('Recording deleted.');
      const remaining = recordings.filter(r => r.id !== id);
      setRecordings(remaining);
      setActiveRecording(remaining.length > 0 ? remaining[0] : null);
    } catch (err) {
      console.error(err);
    }
  };

  // AI SUMMARIZER AND QUIZ GENERATION
  const handleAISummarizeAndQuiz = async () => {
    if (!activeRecording) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/recordings/summarize-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeRecording.id }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveRecording(data.recording);
        setRecordings(prev => prev.map(r => r.id === data.recording.id ? data.recording : r));
        setDetailTab('summary');
        onTriggerNotification('AI Coach summarized lecture and generated active recall quiz! Extended syllabus weak topics synced.');
      } else {
        onTriggerNotification('Error generating AI package.');
      }
    } catch (err) {
      console.error(err);
      onTriggerNotification('AI connection error.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // AI GRADER
  const handleAISubmitQuizAnswers = async () => {
    if (!activeRecording) return;
    if (quizAnswers.some(ans => !ans.trim())) {
      onTriggerNotification('Please write an answer for all 3 questions first to test your memory.');
      return;
    }

    setIsGrading(true);
    try {
      const res = await fetch('/api/recordings/grade-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeRecording.id, answers: quizAnswers }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveRecording(data.recording);
        setRecordings(prev => prev.map(r => r.id === data.recording.id ? data.recording : r));
        
        if (data.xpGained > 0) {
          onTriggerNotification(`Congratulations! You scored ${data.score}% and PASSED! +${data.xpGained} XP GAINED!`);
          onRefreshUserStats();
        } else {
          onTriggerNotification(`Quiz graded: ${data.score}%. Retake anytime to improve active memory recall.`);
        }
      }
    } catch (err) {
      console.error(err);
      onTriggerNotification('Grading system error.');
    } finally {
      setIsGrading(false);
    }
  };

  // ADD BOOKMARK
  const handleAddBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecording || !bmTime.trim() || !bmTitle.trim()) return;

    const newBookmark: Bookmark = {
      timestamp: bmTime.trim(),
      title: bmTitle.trim()
    };

    const updatedBookmarks = [...(activeRecording.bookmarks || []), newBookmark].sort((a, b) => {
      return a.timestamp.localeCompare(b.timestamp);
    });

    const updatedRec = {
      ...activeRecording,
      bookmarks: updatedBookmarks
    };

    try {
      const res = await fetch('/api/recordings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRec)
      });
      const data = await res.json();
      setActiveRecording(data);
      setRecordings(prev => prev.map(r => r.id === data.id ? data : r));
      setBmTime('');
      setBmTitle('');
      onTriggerNotification('Time stamp bookmark saved!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBookmark = async (indexToDelete: number) => {
    if (!activeRecording) return;
    const filtered = (activeRecording.bookmarks || []).filter((_, idx) => idx !== indexToDelete);
    const updatedRec = { ...activeRecording, bookmarks: filtered };
    
    try {
      const res = await fetch('/api/recordings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRec)
      });
      const data = await res.json();
      setActiveRecording(data);
      setRecordings(prev => prev.map(r => r.id === data.id ? data : r));
      onTriggerNotification('Bookmark removed.');
    } catch (e) {
      console.error(e);
    }
  };

  // YouTube checker
  const getYoutubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const filteredRecordings = recordings.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.notes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* SIDEBAR: RECORDINGS DIRECTORY LIST */}
      <div className="lg:col-span-4 bg-[#0e1726]/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl shadow-xl space-y-4 h-fit">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h2 className="text-sm font-bold flex items-center gap-2 text-slate-100 font-display">
            <Video className="w-4 h-4 text-indigo-400" /> Class Recordings
          </h2>
          <button
            onClick={handleCreateNew}
            className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-semibold transition cursor-pointer flex items-center gap-1 text-[11px] font-display px-2.5 active:scale-95"
            title="Import/Create Recording"
          >
            <Plus className="w-3.5 h-3.5" /> Import
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search class records or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition duration-150 text-slate-200"
          />
        </div>

        {/* Directory listings */}
        <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
          {filteredRecordings.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-10 italic font-sans">No class recordings logged.</p>
          ) : (
            filteredRecordings.map((rec) => {
              const sub = subjects.find(s => s.id === rec.subjectId);
              return (
                <div
                  key={rec.id}
                  onClick={() => {
                    setActiveRecording(rec);
                    setIsAdding(false);
                    // Reset quiz answers state to match the recording's typed answers if they exist
                    setQuizAnswers(rec.quizAnswers && rec.quizAnswers.length === 3 ? rec.quizAnswers : ['', '', '']);
                    setShowAnswerKeys(false);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-2 text-left ${
                    activeRecording?.id === rec.id && !isAdding
                      ? 'bg-indigo-600/15 border-indigo-500/40'
                      : 'bg-slate-900/20 border-white/[0.04] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sub?.color || '#818cf8' }} />
                        <span className="text-[9px] uppercase tracking-wider font-extrabold font-mono text-slate-400">{rec.subjectName}</span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-100 font-display mt-1 line-clamp-1 leading-tight">{rec.title}</h4>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(rec.id);
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed font-sans">{rec.notes}</p>
                  
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.04] text-[9px] text-slate-500 font-mono font-bold">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> {rec.duration} mins</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> {rec.date}</span>
                    {rec.aiSummary ? (
                      <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold scale-95 origin-right">
                        <Sparkles className="w-2.5 h-2.5 fill-indigo-400/20 animate-pulse" /> AI Ready
                      </span>
                    ) : (
                      <span className="text-slate-600 font-semibold uppercase">Pending summary</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MAIN CANVAS: PLAYER, SUMMARIES, ACTIVE RECALL BOARD */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* ADD / EDIT FORM OVERLAY */}
        {isAdding ? (
          <form onSubmit={handleSaveRecording} className="bg-[#0e1726]/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl space-y-5 animate-fade-in text-left">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
              <h3 className="font-bold font-display text-sm text-slate-100 flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-400" /> Import Class Recording Metadata
              </h3>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs text-slate-400 hover:text-slate-200 font-bold font-display cursor-pointer flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.03]"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">Lecture / Recording Title</label>
                <input
                  type="text"
                  placeholder="e.g. Lecture 4: Python Decorators & Closures"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">Select Course Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50"
                  required
                >
                  <option value="" disabled>-- Choose a Subject --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">Video URL (YouTube link supported)</label>
                <input
                  type="url"
                  placeholder="e.g. https://www.youtube.com/watch?v=FsAPt_9Bf3U"
                  value={recordingUrl}
                  onChange={(e) => setRecordingUrl(e.target.value)}
                  className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">Duration (mins)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                    min="1"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">Class Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">Class Quick Summary / Manual Notes</label>
              <textarea
                placeholder="Write down immediate topics explained by the professor, assignments details, or formulas..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 h-20 resize-none font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold font-mono text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                  <Brain className="w-3.5 h-3.5" /> Paste Class Transcript (Highly Recommended)
                </label>
                <span className="text-[9px] text-slate-500 font-mono">Enables automated AI Active Recall Quizzing</span>
              </div>
              <textarea
                placeholder="If you have an audio transcription file, lecture script, or textbook passage, paste it here. Our AI Coach will use this raw text to generate high-precision summaries and custom recall flashcard questions..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 h-28 resize-none font-mono leading-normal"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold transition duration-200 shadow-lg shadow-indigo-600/10 cursor-pointer active:scale-[0.98]"
            >
              Save Class Recording & Sync Syllabus
            </button>
          </form>
        ) : activeRecording ? (
          // RECORDING CANVAS DETAILS
          <div className="bg-[#0e1726]/40 backdrop-blur-md border border-white/5 rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[500px]">
            
            {/* CANVAS HEADER */}
            <div className="p-6 border-b border-white/[0.05] bg-slate-900/10 flex flex-col md:flex-row justify-between md:items-center gap-4 text-left">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                    {activeRecording.subjectName}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono font-bold flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Played {activeRecording.date}
                  </span>
                </div>
                <h2 className="text-base font-extrabold font-display text-slate-100 mt-2 tracking-tight">
                  {activeRecording.title}
                </h2>
              </div>

              {/* ACTION: AI RUN COACH */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAISummarizeAndQuiz}
                  disabled={isAnalyzing}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-indigo-950 disabled:to-slate-900 text-white text-[11px] font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/5 disabled:text-slate-400 active:scale-95 border-t border-white/10"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" /> Coached Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" /> {activeRecording.aiSummary ? 'Re-Generate AI Kit' : 'Synthesize AI Recall Kit'}
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setTitle(activeRecording.title);
                    setRecordingUrl(activeRecording.recordingUrl);
                    setDuration(activeRecording.duration);
                    setNotes(activeRecording.notes);
                    setTranscript(activeRecording.transcript || '');
                    setSubjectId(activeRecording.subjectId);
                    setDate(activeRecording.date);
                    setIsAdding(true);
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5 text-[11px] font-bold rounded-xl transition cursor-pointer"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* CANVAS TABS FOR MULTI-EXPERIENCE SUB-FEATURES */}
            <div className="flex border-b border-white/[0.04] bg-slate-950/20 px-4">
              {[
                { id: 'player', label: 'Lecture Player & Bookmarks', icon: Video },
                { id: 'summary', label: 'AI Structured Summary', icon: FileText, disabled: !activeRecording.aiSummary },
                { id: 'quiz', label: 'Active Recall Board', icon: GraduationCap, disabled: !activeRecording.aiQuiz }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDetailTab(tab.id as any)}
                    disabled={tab.disabled}
                    className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition border-b-2 font-display relative cursor-pointer ${
                      detailTab === tab.id
                        ? 'border-indigo-500 text-indigo-400 bg-indigo-500/[0.02]'
                        : tab.disabled
                          ? 'border-transparent text-slate-600 cursor-not-allowed'
                          : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.id === 'quiz' && activeRecording.aiQuiz && (
                      <span className={`w-2 h-2 rounded-full absolute top-2 right-2 ${activeRecording.xpAwarded ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* TABS CANVAS VIEWS */}
            <div className="p-6 flex-1 flex flex-col justify-between text-left">
              
              {/* TAB 1: PLAYER & CUSTOM TIMESTAMPS */}
              {detailTab === 'player' && (
                <div className="space-y-6">
                  
                  {/* VIDEO INTEGRATION IFRAME / CASSETTE */}
                  {activeRecording.recordingUrl ? (
                    getYoutubeEmbedUrl(activeRecording.recordingUrl) ? (
                      <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-slate-950">
                        <iframe
                          src={getYoutubeEmbedUrl(activeRecording.recordingUrl)!}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={activeRecording.title}
                        />
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-900/40 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center space-y-4">
                        <Video className="w-12 h-12 text-indigo-400 animate-pulse" />
                        <div>
                          <h4 className="text-sm font-bold font-display text-slate-200">Standard Recording Stream Loaded</h4>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm font-sans mx-auto">
                            The provider requires external player authentication. You can open and stream this recorded class link securely in a new tab:
                          </p>
                        </div>
                        <a
                          href={activeRecording.recordingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
                        >
                          Launch Recording Stream <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )
                  ) : (
                    <div className="p-10 bg-[#0e1726]/10 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center space-y-3">
                      <Volume2 className="w-12 h-12 text-slate-500" />
                      <p className="text-xs font-medium text-slate-300 font-sans">No video stream linked for this class.</p>
                      <p className="text-[10px] text-slate-500 max-w-xs font-sans">
                        You can still bookmark conceptual timestamps, save handwritten notes below, and generate AI Summaries & Active Recall Quizzes!
                      </p>
                    </div>
                  )}

                  {/* DOUBLE COLUMN: HANDWRITTEN NOTES AND TIMELINE BOOKMARKS */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    
                    {/* COL 1: BOOKMARKS (md:col-span-6) */}
                    <div className="md:col-span-6 space-y-4 bg-slate-950/20 p-4 rounded-xl border border-white/[0.04]">
                      <h3 className="text-xs font-bold font-display text-slate-200 flex items-center gap-1.5 border-b border-white/[0.05] pb-2">
                        <BookmarkIcon className="w-4 h-4 text-indigo-400" /> Timestamp Bookmark Timeline
                      </h3>

                      {/* Add Bookmark form */}
                      <form onSubmit={handleAddBookmark} className="grid grid-cols-12 gap-2">
                        <input
                          type="text"
                          placeholder="05:24"
                          value={bmTime}
                          onChange={(e) => setBmTime(e.target.value)}
                          className="col-span-4 bg-slate-950 border border-white/[0.08] rounded-lg px-2 py-1.5 text-center text-[11px] text-slate-200 font-mono focus:outline-none"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Explain index structures..."
                          value={bmTitle}
                          onChange={(e) => setBmTitle(e.target.value)}
                          className="col-span-6 bg-slate-950 border border-white/[0.08] rounded-lg px-3 py-1.5 text-[11px] text-slate-200 focus:outline-none"
                          required
                        />
                        <button
                          type="submit"
                          className="col-span-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center justify-center transition cursor-pointer font-bold text-xs"
                        >
                          +
                        </button>
                      </form>

                      {/* Bookmark listing */}
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                        {!activeRecording.bookmarks || activeRecording.bookmarks.length === 0 ? (
                          <p className="text-[10px] text-slate-500 py-4 italic font-sans text-center">No timestamp bookmarks registered yet.</p>
                        ) : (
                          activeRecording.bookmarks.map((bm, index) => (
                            <div
                              key={index}
                              className="p-2 bg-slate-900/30 border border-white/[0.03] rounded-lg flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded shrink-0">
                                  {bm.timestamp}
                                </span>
                                <span className="font-medium text-slate-200 truncate font-sans">{bm.title}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteBookmark(index)}
                                className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer shrink-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* COL 2: HANDWRITTEN QUICK LECTURE NOTES (md:col-span-6) */}
                    <div className="md:col-span-6 space-y-3 bg-slate-950/20 p-4 rounded-xl border border-white/[0.04] flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-bold font-display text-slate-200 flex items-center gap-1.5 border-b border-white/[0.05] pb-2">
                          <FileText className="w-4 h-4 text-indigo-400" /> Class Lecture Syllabus Notes
                        </h3>
                        <p className="text-[11px] text-slate-300 mt-2.5 leading-relaxed font-sans whitespace-pre-line">
                          {activeRecording.notes || 'No manual notes taken during creation.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-white/[0.05] text-[9px] text-slate-500 font-mono mt-3">
                        Use the "Edit" button in top-right to append transcript details.
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 2: AI SUMMARY CONTAINER */}
              {detailTab === 'summary' && activeRecording.aiSummary && (
                <div className="space-y-4 bg-slate-950/30 p-5 rounded-2xl border border-white/[0.04] max-h-[480px] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                    <h3 className="text-xs font-extrabold font-display text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" /> AI Study Guide & Syllabus Summary
                    </h3>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-widest bg-emerald-500/10 px-2.5 py-0.5 border border-emerald-500/20 rounded">
                      ✔ Sync Complete
                    </span>
                  </div>
                  
                  {/* Dynamic Markdown parsed component */}
                  <SimpleMarkdown text={activeRecording.aiSummary} />
                </div>
              )}

              {/* TAB 3: ACTIVE RECALL MEMORY CHALLENGE BOARD */}
              {detailTab === 'quiz' && activeRecording.aiQuiz && (
                <div className="space-y-6">
                  
                  {/* MEMORY HERO INTRO CARD */}
                  <div className="p-4 rounded-2xl border bg-gradient-to-tr from-indigo-500/10 to-[#0e1726]/10 border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold font-display text-slate-100 flex items-center gap-1.5">
                        <Brain className="w-4 h-4 text-indigo-400" /> Active Recall Memory challenge
                      </h3>
                      <p className="text-[10px] text-slate-400 font-sans max-w-md leading-relaxed">
                        Test your long-term memory retrieval without looking at your study slides. Type in your explanations.
                        Graded by our AI tutor to award **+100 XP** and streak progression.
                      </p>
                    </div>

                    {activeRecording.xpAwarded ? (
                      <div className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-[10px] font-extrabold font-mono uppercase tracking-wider px-3.5 py-1.5 rounded-xl flex items-center gap-1 shrink-0">
                        <CheckCircle className="w-3.5 h-3.5 fill-emerald-500/20" /> Quiz Completed (+100 XP)
                      </div>
                    ) : (
                      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-extrabold font-mono uppercase tracking-wider px-3.5 py-1.5 rounded-xl flex items-center gap-1 shrink-0">
                        <HelpCircle className="w-3.5 h-3.5" /> Pending submission
                      </div>
                    )}
                  </div>

                  {/* ACTIVE RECALL QUESTIONS SCENE */}
                  <div className="space-y-5">
                    {activeRecording.aiQuiz.map((q, idx) => (
                      <div key={idx} className="space-y-2 text-left">
                        <div className="flex items-start gap-2 text-xs">
                          <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] font-mono text-indigo-400 shrink-0 font-extrabold mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="font-bold text-slate-200 font-sans leading-relaxed">{q.question}</p>
                        </div>

                        {/* Input block */}
                        <textarea
                          placeholder="Type your explanation using the Feynman Technique. Describe it simply as if teaching someone..."
                          value={quizAnswers[idx] || ''}
                          disabled={isGrading}
                          onChange={(e) => {
                            const updated = [...quizAnswers];
                            updated[idx] = e.target.value;
                            setQuizAnswers(updated);
                          }}
                          className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/30 h-16 resize-none font-sans leading-normal placeholder-slate-600 focus:ring-1 focus:ring-indigo-500/30"
                        />

                        {/* Reveal individual tutor answer key */}
                        {showAnswerKeys && (
                          <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-[11px] text-slate-400 leading-relaxed font-sans mt-1.5">
                            <strong className="text-indigo-300">Tutor's Correct Explanation Key:</strong>
                            <p className="mt-1">{q.answerKey}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* SUBMISSION BLOCK & FEEDBACK */}
                  <div className="space-y-4 pt-3.5 border-t border-white/[0.05]">
                    
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                      <button
                        onClick={() => setShowAnswerKeys(!showAnswerKeys)}
                        type="button"
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold font-display cursor-pointer underline flex items-center gap-1 px-2.5 py-1 rounded bg-white/[0.02]"
                      >
                        {showAnswerKeys ? 'Hide Solution Guide Keys' : 'View Ideal Answer Keys'}
                      </button>

                      <button
                        onClick={handleAISubmitQuizAnswers}
                        disabled={isGrading || activeRecording.aiQuiz.length === 0}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-[11px] font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10 active:scale-95"
                      >
                        {isGrading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> AI Tutor Grading...
                          </>
                        ) : (
                          <>
                            <GraduationCap className="w-4 h-4" /> Grade and Validate Answers
                          </>
                        )}
                      </button>
                    </div>

                    {/* GRADING FEEDBACK DISPLAY BOX */}
                    {activeRecording.quizGradeFeedback && (
                      <div className="p-5 bg-slate-950/50 rounded-2xl border border-white/[0.06] text-slate-300 space-y-3 mt-4 text-left">
                        <div className="flex items-center justify-between border-b border-white/[0.05] pb-2">
                          <h4 className="text-xs font-bold font-display text-indigo-400 flex items-center gap-1">
                            <GraduationCap className="w-4 h-4 text-indigo-400" /> AI Pedagogical Evaluation report
                          </h4>
                          <span className="text-[10px] text-indigo-300 font-mono font-bold">Graded via gemini-3.5-flash</span>
                        </div>
                        <SimpleMarkdown text={activeRecording.quizGradeFeedback} />
                      </div>
                    )}

                  </div>

                </div>
              )}

            </div>

            {/* CANVAS FOOTER */}
            <div className="p-4 border-t border-white/[0.04] bg-slate-950/20 text-slate-500 text-[10px] font-mono text-center font-bold uppercase tracking-wider">
              Optimize with spaced-interval lectures reviews to boost level progression.
            </div>

          </div>
        ) : (
          // PLACEHOLDER CANVAS WHEN DIRECTORY IS EMPTY
          <div className="bg-[#0e1726]/40 backdrop-blur-md border border-white/5 p-12 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center space-y-5 min-h-[500px]">
            <Video className="w-16 h-16 text-slate-600 animate-pulse" />
            <div>
              <h3 className="text-base font-bold font-display text-slate-200">Interactive Class Recordings Vault</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-sm font-sans mx-auto leading-relaxed">
                Connect and import your Zoom, Google Meet, YouTube, or general lectures files directly. Use Gemini to parse transcripts into study summaries and custom memory flashcards.
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition duration-200 shadow-md shadow-indigo-600/10 cursor-pointer active:scale-95"
            >
              Add Your First Recording
            </button>
          </div>
        )}

      </div>

    </div>
  );
}

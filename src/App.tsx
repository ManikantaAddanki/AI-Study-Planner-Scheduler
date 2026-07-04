import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Subject,
  Task,
  ScheduleItem,
  RevisionSession,
  StudyNote,
} from './types';
import AuthView from './components/AuthView';
import SubjectView from './components/SubjectView';
import PlannerView from './components/PlannerView';
import CalendarView from './components/CalendarView';
import TaskView from './components/TaskView';
import NotesView from './components/NotesView';
import RecordingsView from './components/RecordingsView';
import AnalyticsView from './components/AnalyticsView';
import PomodoroTimer from './components/PomodoroTimer';
import AIChat from './components/AIChat';
import AdminPanel from './components/AdminPanel';
import MockInterviewsView from './components/MockInterviewsView';
import MockQuizzesView from './components/MockQuizzesView';
import WeeklyAssessmentsView from './components/WeeklyAssessmentsView';
import ProblemSolvingView from './components/ProblemSolvingView';

import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  CheckSquare,
  FileText,
  LineChart,
  Clock,
  MessageSquare,
  ShieldAlert,
  Flame,
  Award,
  Star,
  Sparkles,
  Volume2,
  Calendar,
  AlertCircle,
  Bell,
  CheckCircle,
  User as UserIcon,
  Video,
  Users,
  ClipboardList,
  Code2,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Core domain states
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [revisions, setRevisions] = useState<RevisionSession[]>([]);
  const [notes, setNotes] = useState<StudyNote[]>([]);

  // AI states
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  // Notifications
  const [notification, setNotification] = useState<string | null>(null);

  // Fetch all user specific data
  const fetchAllUserData = useCallback(async (userId: string) => {
    try {
      const [subsRes, tasksRes, schRes, revRes, notesRes] = await Promise.all([
        fetch(`/api/subjects?userId=${userId}`),
        fetch(`/api/tasks?userId=${userId}`),
        fetch(`/api/schedules?userId=${userId}`),
        fetch(`/api/revisions?userId=${userId}`),
        fetch(`/api/notes?userId=${userId}`),
      ]);

      const subs = await subsRes.json();
      const tks = await tasksRes.json();
      const sches = await schRes.json();
      const revs = await revRes.json();
      const nts = await notesRes.json();

      setSubjects(subs);
      setTasks(tks);
      setSchedule(sches);
      setRevisions(revs);
      setNotes(nts);
    } catch (e) {
      console.error('Error fetching user data packages:', e);
    }
  }, []);

  // Check initial demo user login state
  useEffect(() => {
    const defaultUserId = 'user-demo';
    // Automatically pre-login demo user for immediate instant preview experience
    const seedDemoUser: User = {
      id: 'user-demo',
      name: 'Demo Student',
      email: 'student@demo.com',
      streak: 5,
      xp: 650,
      level: 3,
      badges: ['Consistent Learner', 'Task Crusher', 'AI Scheduler Pioneer'],
      isAdmin: true,
    };
    setCurrentUser(seedDemoUser);
    fetchAllUserData(defaultUserId);
  }, [fetchAllUserData]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    fetchAllUserData(user.id);
    setActiveTab('dashboard');
    triggerNotification(`Welcome back, ${user.name}!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSubjects([]);
    setTasks([]);
    setSchedule([]);
    setRevisions([]);
    setNotes([]);
    setActiveTab('dashboard');
  };

  const handleUpdateProfile = (name: string, email: string) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, name, email });
    }
  };

  // Notification helper
  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Speech narration helper (Bonus feature!)
  const handleNarrateSchedule = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySlots = schedule.filter((s) => s.date === todayStr && !s.isBreak);
    if (todaySlots.length === 0) {
      speakText("Your schedule for today is empty. Let's generate one with the AI Planner!");
      return;
    }

    const narrationText = `Here is your optimized study agenda for today. First, you will study ${todaySlots
      .map((s) => `${s.subject} focusing on ${s.topic || 'revision'}`)
      .join(', followed by ')}. Let's study hard and level up your XP!`;

    speakText(narrationText);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } else {
      triggerNotification('Speech Synthesis not supported in this browser.');
    }
  };

  // CRUDS
  const handleAddSubject = async (sub: Partial<Subject>) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sub, userId: currentUser.id }),
      });
      const data = await res.json();
      setSubjects((prev) => [...prev, data]);
      triggerNotification(`Subject "${data.name}" added successfully.`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    try {
      await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      triggerNotification('Subject deleted.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTask = async (task: Partial<Task>) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, userId: currentUser.id }),
      });
      const data = await res.json();
      // Check if XP/Levels increased by checking against backend response or updating states
      setTasks((prev) => [...prev, data]);
      triggerNotification(`Task "${data.title}" added successfully.`);
      
      // Update local user details to reflect new XP and Level
      if (currentUser) {
        const uRes = await fetch('/api/admin/users');
        const allU = await uRes.json();
        const updatedMe = allU.find((u: User) => u.id === currentUser.id);
        if (updatedMe) setCurrentUser(updatedMe);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      const updated = { ...task, completed: !task.completed };
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      
      // Update task list
      setTasks((prev) => prev.map((t) => (t.id === task.id ? data : t)));
      
      if (updated.completed) {
        triggerNotification('Task Completed! +30 XP Gained!');
        // Reload user stats for leveling / badges
        if (currentUser) {
          const uRes = await fetch('/api/admin/users');
          const allU = await uRes.json();
          const updatedMe = allU.find((u: User) => u.id === currentUser.id);
          if (updatedMe) setCurrentUser(updatedMe);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      setTasks((prev) => prev.filter((t) => t.id !== id));
      triggerNotification('Task deleted.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveNote = async (note: Partial<StudyNote>) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...note, userId: currentUser.id }),
      });
      const data = await res.json();
      setNotes((prev) => {
        const exists = prev.some((n) => n.id === data.id);
        if (exists) {
          return prev.map((n) => (n.id === data.id ? data : n));
        }
        return [...prev, data];
      });
      triggerNotification('Note saved successfully!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      setNotes((prev) => prev.filter((n) => n.id !== id));
      triggerNotification('Note deleted.');
    } catch (e) {
      console.error(e);
    }
  };

  // AI generators
  const handleGenerateSchedule = async (preferences: any) => {
    if (!currentUser) return null;
    setPlannerLoading(true);
    try {
      const res = await fetch('/api/ai/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...preferences, userId: currentUser.id }),
      });
      const data = await res.json();
      if (data.success) {
        setSchedule((prev) => {
          // Filter out existing schedules for this date
          const dateToReplace = preferences.date;
          const filtered = prev.filter((s) => !(s.userId === currentUser.id && s.date === dateToReplace));
          return [...filtered, ...data.schedule];
        });
        return data.schedule;
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    } finally {
      setPlannerLoading(false);
    }
  };

  const handleAnalyzeWeakArea = async (subjectName: string, topic: string) => {
    setAnalysisLoading(true);
    setAnalysisResult(null);
    try {
      const res = await fetch('/api/ai/weak-area-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectName, topic }),
      });
      const data = await res.json();
      setAnalysisResult(data.analysis);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Render countdown to closest exam in a sleek Bento Card
  const renderExamCountdown = () => {
    const upcomingSubjects = subjects
      .filter((s) => s.examDate && new Date(s.examDate) >= new Date())
      .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());

    if (upcomingSubjects.length === 0) {
      return (
        <div className="bg-[#0e1726]/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col items-center justify-center text-center transition hover:border-white/10">
          <CalendarDays className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-semibold font-display">No upcoming exams tracked.</p>
        </div>
      );
    }

    const nextExam = upcomingSubjects[0];
    const diffTime = new Date(nextExam.examDate).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return (
      <div className="bg-gradient-to-tr from-rose-500/10 to-[#0e1726]/40 backdrop-blur-md p-6 rounded-2xl border border-rose-500/20 shadow-xl transition-all duration-300 hover:border-rose-500/40 hover:shadow-rose-500/5 group flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest font-mono">Exam Countdown</p>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <h3 className="text-base font-bold font-display text-slate-100 mt-2.5 truncate group-hover:text-rose-300 transition-colors">
            {nextExam.name}
          </h3>
        </div>
        <div>
          <div className="flex items-baseline gap-1 mt-4">
            <span className="text-3xl font-bold font-display text-rose-400 tracking-tight">{diffDays}</span>
            <span className="text-xs text-slate-400 font-medium font-sans">days left</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-3">Date: {nextExam.examDate}</p>
        </div>
      </div>
    );
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySchedules = schedule.filter((s) => s.date === todayStr);

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 antialiased font-sans flex flex-col justify-between relative overflow-x-hidden">
      
      {/* GLOBAL BACKGROUND ELEMENTS */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-[#070b13]/80 backdrop-blur-md border-b border-white/[0.06] px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo with clean typography */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/10 transition-transform duration-300 hover:scale-105">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-extrabold font-display tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                AI Study Planner
              </h1>
              <p className="text-[9px] uppercase tracking-widest font-extrabold text-indigo-400 font-mono">
                Coached by Gemini AI
              </p>
            </div>
          </div>

          {/* Gamification indicators if logged in */}
          {currentUser && (
            <div className="hidden sm:flex items-center gap-4 bg-[#0e1726]/50 px-4 py-1.5 rounded-xl border border-white/[0.08] text-xs shadow-md">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-bold text-slate-200 font-display">{currentUser.streak} Day Streak</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-slate-200 font-display">Lv.{currentUser.level}</span>
                <span className="text-[10px] text-slate-400 font-mono">({currentUser.xp} XP)</span>
              </div>
            </div>
          )}

          {/* Settings Profile Button */}
          {currentUser && (
            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 bg-[#0e1726] hover:bg-[#131f33] text-indigo-400 border border-indigo-500/20 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition duration-200 shadow-sm cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span className="font-display">{currentUser.name}</span>
            </button>
          )}
        </div>
      </header>

      {/* REMINDERS/NOTIFICATIONS OVERLAY */}
      {notification && (
        <div className="fixed top-24 right-6 z-50 bg-[#0e1726]/90 border border-indigo-500/30 rounded-2xl p-4 shadow-2xl flex items-center gap-3.5 animate-slide-in max-w-sm backdrop-blur">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold font-display text-slate-200">Study Reminder</p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{notification}</p>
          </div>
        </div>
      )}

      {/* CORE WORKSPACE PANELS */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
        
        {/* Navigation Rail / Sidebar (Sleek Bento Container) */}
        {currentUser && (
          <nav className="lg:col-span-3 space-y-2.5 bg-[#0e1726]/30 backdrop-blur-md border border-white/[0.06] p-4 rounded-2xl shadow-xl shadow-black/20">
            <div className="text-[9px] text-slate-500 uppercase tracking-widest font-black px-3.5 mb-3 font-mono">Workspace Menu</div>
            
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'subjects', label: 'Course Subjects', icon: BookOpen },
              { id: 'planner', label: 'AI Study Scheduler', icon: Sparkles },
              { id: 'calendar', label: 'Academic Calendar', icon: CalendarDays },
              { id: 'tasks', label: 'Study Task Tracker', icon: CheckSquare },
              { id: 'notes', label: 'Course Study Notes', icon: FileText },
              { id: 'recordings', label: 'Class Video Vault', icon: Video },
              { id: 'interviews', label: 'AI Mock Interviews', icon: Users },
              { id: 'quizzes', label: 'MCQ Course Quizzes', icon: Award },
              { id: 'assessments', label: 'Weekly Assessments', icon: ClipboardList },
              { id: 'challenges', label: 'Problem Solver', icon: Code2 },
              { id: 'analytics', label: 'Progress Analytics', icon: LineChart },
              { id: 'pomodoro', label: 'Concentration Timer', icon: Clock },
              { id: 'chat', label: 'Ask StudyBuddy AI', icon: MessageSquare },
              ...(currentUser?.isAdmin ? [{ id: 'admin', label: 'Admin Console', icon: ShieldAlert }] : []),
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 text-left font-display cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/20 border-t border-white/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 transition" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Content canvas */}
        <div className="lg:col-span-9 space-y-6">
          
          {!currentUser ? (
            <AuthView
              user={currentUser}
              onLogin={handleLogin}
              onLogout={handleLogout}
              onUpdateProfile={handleUpdateProfile}
            />
          ) : (
            <>
              {/* Active Sub-module router */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Bento Grid layout for top widgets */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    
                    {/* Widget 1: Countdown - md:col-span-4 */}
                    <div className="md:col-span-4 flex flex-col">
                      {renderExamCountdown()}
                    </div>

                    {/* Widget 2: Today study progress - md:col-span-4 */}
                    <div className="md:col-span-4 bg-[#0e1726]/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col justify-between transition-all duration-300 hover:border-indigo-500/30 hover:shadow-indigo-500/5 group">
                      <div>
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest font-mono">Routine Tracker</p>
                        <h4 className="text-base font-bold font-display text-slate-100 mt-2">Today's Study Progress</h4>
                      </div>
                      <div className="mt-4">
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
                          <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: '40%' }} />
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-2.5 flex justify-between">
                          <span>2 of 5 sessions complete</span>
                          <span className="font-bold text-indigo-400">40%</span>
                        </div>
                      </div>
                    </div>

                    {/* Widget 3: Narrate Agenda helper - md:col-span-4 */}
                    <div className="md:col-span-4 bg-gradient-to-tr from-violet-500/10 to-[#0e1726]/40 backdrop-blur-md p-6 rounded-2xl border border-violet-500/20 shadow-xl flex flex-col justify-between items-start transition-all duration-300 hover:border-violet-500/40 hover:shadow-violet-500/5">
                      <div>
                        <p className="text-[10px] text-violet-400 font-bold uppercase tracking-widest font-mono">Speech Integration</p>
                        <h4 className="text-base font-bold font-display text-slate-100 mt-2">Narrate Schedule</h4>
                        <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed font-sans">
                          Let your AI coach read out today's study timeline aloud.
                        </p>
                      </div>
                      <button
                        onClick={handleNarrateSchedule}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-[10px] font-bold mt-4 flex items-center gap-1.5 transition duration-200 shadow-md shadow-indigo-600/10 cursor-pointer w-full justify-center active:scale-95"
                      >
                        <Volume2 className="w-3.5 h-3.5 animate-bounce" /> Narrate Agenda
                      </button>
                    </div>

                  </div>

                  {/* Middle row Bento Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    
                    {/* Bento Box: Today schedule list - md:col-span-6 */}
                    <div className="md:col-span-6 bg-[#0e1726]/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl flex flex-col justify-between transition-all duration-300 hover:border-indigo-500/20 hover:shadow-indigo-500/5">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
                          <h3 className="font-bold font-display text-sm flex items-center gap-2 text-slate-100">
                            <Clock className="w-4 h-4 text-indigo-400" /> Today's Focus Routine ({todaySchedules.length})
                          </h3>
                          <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md font-mono font-bold">
                            {todayStr}
                          </span>
                        </div>

                        {todaySchedules.length === 0 ? (
                          <div className="text-center py-14 text-slate-400 space-y-3 flex flex-col items-center">
                            <p className="text-xs font-medium text-slate-300 font-sans">Your schedule for today is empty.</p>
                            <button
                              onClick={() => setActiveTab('planner')}
                              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold underline font-display cursor-pointer"
                            >
                              Generate Schedule with AI Planner
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                            {todaySchedules.map((sch) => {
                              const sub = subjects.find((s) => s.name === sch.subject);
                              return (
                                <div key={sch.id} className="p-3 bg-slate-900/30 rounded-xl border border-white/[0.04] flex gap-3 hover:bg-slate-900/50 transition">
                                  <div className="font-mono text-[10px] font-bold text-indigo-300 w-16 border-r border-white/5 pr-2.5 flex items-center justify-center shrink-0">
                                    {sch.startTime}
                                  </div>
                                  <div className="truncate">
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sch.isBreak ? '#475569' : sub?.color || '#6366f1' }} />
                                      <p className="font-bold text-xs text-slate-200 truncate font-display">{sch.subject}</p>
                                    </div>
                                    {sch.topic && <p className="text-[10px] text-slate-400 mt-1 italic font-sans truncate">{sch.topic}</p>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bento Box: Pending tasks quick overview - md:col-span-6 */}
                    <div className="md:col-span-6 bg-[#0e1726]/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl flex flex-col justify-between transition-all duration-300 hover:border-emerald-500/20 hover:shadow-emerald-500/5">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
                          <h3 className="font-bold font-display text-sm flex items-center gap-2 text-slate-100">
                            <CheckSquare className="w-4 h-4 text-emerald-400" /> Pending Tasks ({tasks.filter(t => !t.completed).length})
                          </h3>
                          <button
                            onClick={() => setActiveTab('tasks')}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold font-display cursor-pointer"
                          >
                            View Tracker
                          </button>
                        </div>

                        {tasks.filter(t => !t.completed).length === 0 ? (
                          <div className="text-center py-16 text-slate-500 italic text-xs font-sans">
                            All tasks complete! Great studying!
                          </div>
                        ) : (
                          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                            {tasks
                              .filter((t) => !t.completed)
                              .slice(0, 5)
                              .map((t) => (
                                <div
                                  key={t.id}
                                  onClick={() => handleToggleTask(t)}
                                  className="p-3 bg-slate-900/30 rounded-xl border border-white/[0.04] hover:border-indigo-500/20 cursor-pointer transition flex items-center justify-between gap-3 group"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <CheckSquare className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition shrink-0" />
                                    <span className="font-bold text-xs text-slate-200 truncate font-display group-hover:text-slate-100">{t.title}</span>
                                  </div>
                                  <span className="text-[9px] text-slate-400 shrink-0 font-mono bg-white/[0.03] border border-white/[0.05] px-1.5 py-0.5 rounded">
                                    Due: {t.deadline}
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Active Spaced Repetition Revision reminders block - md:col-span-12 */}
                  <div className="bg-[#0e1726]/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl space-y-4 transition-all duration-300 hover:border-violet-500/20 hover:shadow-violet-500/5">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
                      <h3 className="font-bold font-display text-sm flex items-center gap-2 text-slate-100">
                        <Calendar className="w-4 h-4 text-indigo-400 animate-pulse" /> Active Spaced Repetition Reminders ({revisions.filter(r => !r.completed).length})
                      </h3>
                      <span className="text-[9px] text-slate-400 font-mono bg-white/[0.04] border border-white/10 px-2.5 py-0.5 rounded-full">
                        Cognitive Revision Science
                      </span>
                    </div>

                    {revisions.filter((r) => !r.completed).length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 italic text-center font-sans">
                        No revision slots scheduled yet. Complete connected tasks to trigger automatic spaced repetition.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {revisions
                          .filter((r) => !r.completed)
                          .map((rev) => (
                            <div
                              key={rev.id}
                              className="p-4 bg-slate-900/40 border border-white/[0.05] rounded-xl flex items-center justify-between gap-3 hover:border-indigo-500/20 transition-all"
                            >
                              <div className="min-w-0">
                                <h4 className="font-bold text-xs text-slate-200 truncate font-display">{rev.subjectName}</h4>
                                <p className="text-[10px] text-slate-400 mt-1.5 font-mono">Stage: {rev.stage} days later</p>
                                <p className="text-[9px] text-indigo-400 font-bold mt-1 font-mono">Due: {rev.revisionDate}</p>
                              </div>

                              <button
                                onClick={async () => {
                                  const updated = { ...rev, completed: true };
                                  await fetch('/api/revisions', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(updated),
                                  });
                                  setRevisions((prev) => prev.map((r) => (r.id === rev.id ? updated : r)));
                                  triggerNotification(`Revision complete! +50 XP Gained!`);
                                  
                                  // Update local level details
                                  const uRes = await fetch('/api/admin/users');
                                  const allU = await uRes.json();
                                  const updatedMe = allU.find((u: User) => u.id === currentUser.id);
                                  if (updatedMe) setCurrentUser(updatedMe);
                                }}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg transition shrink-0 cursor-pointer active:scale-95"
                              >
                                Done
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {activeTab === 'subjects' && (
                <SubjectView
                  subjects={subjects}
                  onAddSubject={handleAddSubject}
                  onDeleteSubject={handleDeleteSubject}
                  onAnalyzeWeakArea={handleAnalyzeWeakArea}
                  analysisLoading={analysisLoading}
                  analysisResult={analysisResult}
                />
              )}

              {activeTab === 'planner' && (
                <PlannerView
                  subjects={subjects}
                  onGenerateSchedule={handleGenerateSchedule}
                  schedule={schedule}
                  loading={plannerLoading}
                />
              )}

              {activeTab === 'calendar' && (
                <CalendarView schedule={schedule} subjects={subjects} tasks={tasks} />
              )}

              {activeTab === 'tasks' && (
                <TaskView
                  tasks={tasks}
                  subjects={subjects}
                  onAddTask={handleAddTask}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                />
              )}

              {activeTab === 'notes' && (
                <NotesView notes={notes} onSaveNote={handleSaveNote} onDeleteNote={handleDeleteNote} />
              )}

              {activeTab === 'recordings' && (
                <RecordingsView
                  subjects={subjects}
                  onTriggerNotification={triggerNotification}
                  onRefreshUserStats={async () => {
                    if (currentUser) {
                      const uRes = await fetch('/api/admin/users');
                      const allU = await uRes.json();
                      const updatedMe = allU.find((u: User) => u.id === currentUser.id);
                      if (updatedMe) setCurrentUser(updatedMe);
                    }
                  }}
                />
              )}

              {activeTab === 'interviews' && (
                <MockInterviewsView
                  subjects={subjects}
                  onTriggerNotification={triggerNotification}
                  onRefreshUserStats={async () => {
                    if (currentUser) {
                      const uRes = await fetch('/api/admin/users');
                      const allU = await uRes.json();
                      const updatedMe = allU.find((u: User) => u.id === currentUser.id);
                      if (updatedMe) setCurrentUser(updatedMe);
                    }
                  }}
                />
              )}

              {activeTab === 'quizzes' && (
                <MockQuizzesView
                  subjects={subjects}
                  onTriggerNotification={triggerNotification}
                  onRefreshUserStats={async () => {
                    if (currentUser) {
                      const uRes = await fetch('/api/admin/users');
                      const allU = await uRes.json();
                      const updatedMe = allU.find((u: User) => u.id === currentUser.id);
                      if (updatedMe) setCurrentUser(updatedMe);
                    }
                  }}
                />
              )}

              {activeTab === 'assessments' && (
                <WeeklyAssessmentsView
                  subjects={subjects}
                  onTriggerNotification={triggerNotification}
                  onRefreshUserStats={async () => {
                    if (currentUser) {
                      const uRes = await fetch('/api/admin/users');
                      const allU = await uRes.json();
                      const updatedMe = allU.find((u: User) => u.id === currentUser.id);
                      if (updatedMe) setCurrentUser(updatedMe);
                    }
                  }}
                />
              )}

              {activeTab === 'challenges' && (
                <ProblemSolvingView
                  subjects={subjects}
                  onTriggerNotification={triggerNotification}
                  onRefreshUserStats={async () => {
                    if (currentUser) {
                      const uRes = await fetch('/api/admin/users');
                      const allU = await uRes.json();
                      const updatedMe = allU.find((u: User) => u.id === currentUser.id);
                      if (updatedMe) setCurrentUser(updatedMe);
                    }
                  }}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsView subjects={subjects} tasks={tasks} schedule={schedule} />
              )}

              {activeTab === 'pomodoro' && <PomodoroTimer />}

              {activeTab === 'chat' && <AIChat />}

              {activeTab === 'admin' && currentUser?.isAdmin && <AdminPanel />}

              {activeTab === 'profile' && (
                <AuthView
                  user={currentUser}
                  onLogin={handleLogin}
                  onLogout={handleLogout}
                  onUpdateProfile={handleUpdateProfile}
                />
              )}
            </>
          )}

        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.05] py-4 px-6 bg-[#070b13]/60 shrink-0 text-center text-slate-500 text-[10px] font-mono uppercase tracking-widest relative z-10">
        AI Study Planner &copy; {new Date().getFullYear()}. Optimized for Active Recall and Spaced Repetition.
      </footer>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Subject, WeeklyAssessment, CourseFeedback } from '../types';
import {
  ClipboardList,
  Award,
  ChevronRight,
  CheckCircle,
  Brain,
  ArrowLeft,
  Loader2,
  Send,
  HelpCircle,
  FileCheck,
  CheckCircle2,
  MessageSquare,
  Star,
  Sparkles,
  Plus,
  Calendar,
  TrendingUp,
  Compass,
  ChevronDown
} from 'lucide-react';

interface WeeklyAssessmentsViewProps {
  subjects: Subject[];
  onTriggerNotification: (msg: string) => void;
  onRefreshUserStats: () => Promise<void>;
}

export default function WeeklyAssessmentsView({
  subjects,
  onTriggerNotification,
  onRefreshUserStats
}: WeeklyAssessmentsViewProps) {
  // Nested sub-tab states
  const [subTab, setSubTab] = useState<'tests' | 'feedbacks'>('tests');

  // Assessments States
  const [assessments, setAssessments] = useState<WeeklyAssessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<WeeklyAssessment | null>(null);
  const [essayAnswers, setEssayAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [xpGainedMessage, setXpGainedMessage] = useState<string | null>(null);

  // Assessment Generation States
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [genSubjectId, setGenSubjectId] = useState('');
  const [genWeekNumber, setGenWeekNumber] = useState('1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  // Feedbacks States
  const [feedbacks, setFeedbacks] = useState<CourseFeedback[]>([]);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [fbSubjectId, setFbSubjectId] = useState('');
  const [fbRating, setFbRating] = useState(5);
  const [fbGeneral, setFbGeneral] = useState('');
  const [fbEnjoyed, setFbEnjoyed] = useState('');
  const [fbStruggles, setFbStruggles] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // AI Summary States
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  useEffect(() => {
    fetchAssessments();
    fetchFeedbacks();
  }, []);

  const fetchAssessments = async () => {
    try {
      const res = await fetch('/api/assessments');
      const data = await res.json();
      setAssessments(data);
    } catch (err) {
      console.error('Error fetching weekly assessments:', err);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch('/api/feedbacks');
      const data = await res.json();
      setFeedbacks(data);
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    }
  };

  const handleOpenAssessment = (ass: WeeklyAssessment) => {
    setSelectedAssessment(ass);
    setXpGainedMessage(null);
    if (ass.status === 'pending') {
      setEssayAnswers({});
    }
  };

  const handleAnswerChange = (idx: number, val: string) => {
    setEssayAnswers(prev => ({
      ...prev,
      [idx]: val
    }));
  };

  const handleSubmitAssessment = async () => {
    if (!selectedAssessment) return;

    // Check if answers are complete
    const questionsLength = selectedAssessment.questions.length;
    const answeredCount = Object.values(essayAnswers).filter((a: string) => a && a.trim().length >= 10).length;
    if (answeredCount < questionsLength) {
      onTriggerNotification('Please write a detailed response (at least 10 characters) for every question.');
      return;
    }

    setIsSubmitting(true);
    try {
      const answers = selectedAssessment.questions.map((_, idx) => essayAnswers[idx] || '');

      const res = await fetch('/api/assessments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedAssessment.id,
          answers
        })
      });
      const data = await res.json();
      setSelectedAssessment(data.assessment);
      fetchAssessments();

      if (data.xpGained > 0) {
        setXpGainedMessage(`🎉 Assessment Evaluated! Your score: ${data.assessment.score}/100. Awarded +${data.xpGained} XP!`);
        onRefreshUserStats();
        onTriggerNotification(`Assessment graded: ${data.assessment.score}/100! +${data.xpGained} XP gained!`);
      }
    } catch (err) {
      console.error(err);
      onTriggerNotification('Failed to submit weekly assessment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic Assessment Generation
  const handleGenerateAssessment = async () => {
    if (!genSubjectId) {
      onTriggerNotification('Please select a course to generate an assessment.');
      return;
    }

    setIsGenerating(true);
    setGenerationStep(0);

    // Timed step updates for a highly responsive, custom loader experience
    const steps = [
      'Retrieving subject curriculum mapping...',
      'Reviewing past task performance and weak areas...',
      'Formulating rigorous analytical questions with Gemini...',
      'Calibrating strict grading rubrics...'
    ];

    const timer = setInterval(() => {
      setGenerationStep(prev => {
        if (prev < steps.length - 1) return prev + 1;
        clearInterval(timer);
        return prev;
      });
    }, 1500);

    try {
      const res = await fetch('/api/assessments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: genSubjectId,
          weekNumber: genWeekNumber
        })
      });
      const data = await res.json();
      clearInterval(timer);

      setAssessments(prev => [data, ...prev]);
      setShowGenerateForm(false);
      onTriggerNotification(`Successfully generated: "${data.title}" using Gemini!`);
    } catch (err) {
      clearInterval(timer);
      console.error(err);
      onTriggerNotification('Failed to generate customized academic assessment.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Feedback Submission
  const handleSubmitFeedback = async () => {
    if (!fbSubjectId) {
      onTriggerNotification('Please select a course.');
      return;
    }
    if (!fbGeneral.trim() || !fbEnjoyed.trim() || !fbStruggles.trim()) {
      onTriggerNotification('Please fill in all feedback fields.');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const targetSub = subjects.find(s => s.id === fbSubjectId);
      const res = await fetch('/api/feedbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: fbSubjectId,
          subjectName: targetSub ? targetSub.name : 'Unknown',
          rating: fbRating,
          generalFeedback: fbGeneral,
          enjoyedMost: fbEnjoyed,
          strugglingWith: fbStruggles
        })
      });

      if (res.ok) {
        onTriggerNotification('Your course feedback was registered successfully!');
        setFbGeneral('');
        setFbEnjoyed('');
        setFbStruggles('');
        setShowFeedbackForm(false);
        fetchFeedbacks();
      }
    } catch (err) {
      console.error(err);
      onTriggerNotification('Failed to submit overall course feedback.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // AI Feedback Summary Report
  const handleGenerateAISummary = async () => {
    if (feedbacks.length === 0) {
      onTriggerNotification('No student feedback available to summarize.');
      return;
    }

    setIsGeneratingSummary(true);
    try {
      const res = await fetch('/api/feedbacks/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setAiSummary(data.summary);
      onTriggerNotification('AI Student Feedback Sentiment Report successfully generated!');
    } catch (err) {
      console.error(err);
      onTriggerNotification('Failed to generate AI feedback summary.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div id="weekly-assessments-view-root" className="lg:col-span-9 space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#111c30] to-[#0f172a] rounded-2xl p-6 border border-white/[0.06] relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
        <span className="bg-indigo-500/15 text-indigo-400 text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-full border border-indigo-500/25">
          Curriculum & Feedback Engine
        </span>
        <h1 className="text-2xl font-bold font-display text-white mt-3">Weekly Academic Assessments</h1>
        <p className="text-xs text-slate-400 mt-1.5 max-w-xl leading-relaxed">
          Spin up customized, curriculum-guided assessments for any course on-demand, or provide overall performance feedback on your subjects to draft detailed improvement insights.
        </p>

        {/* Double Nested Tab Controllers */}
        <div className="flex items-center gap-2 mt-6 border-b border-white/[0.08] pb-1">
          <button
            onClick={() => setSubTab('tests')}
            className={`px-4 py-2 text-xs font-black tracking-wider uppercase border-b-2 font-mono transition ${
              subTab === 'tests'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Academic Assessments
          </button>
          <button
            onClick={() => setSubTab('feedbacks')}
            className={`px-4 py-2 text-xs font-black tracking-wider uppercase border-b-2 font-mono transition ${
              subTab === 'feedbacks'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Overall Course Feedbacks
          </button>
        </div>
      </div>

      {subTab === 'tests' ? (
        // ==========================================
        // SUB-TAB: ACADEMIC ASSESSMENTS
        // ==========================================
        <div className="space-y-6">
          {xpGainedMessage && (
            <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-4 text-xs font-bold text-emerald-400 flex items-center gap-3 animate-pulse">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <span>{xpGainedMessage}</span>
            </div>
          )}

          {!selectedAssessment ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-sm font-black text-slate-200 uppercase tracking-wider font-mono">My Assigned Weekly Tests</h2>
                </div>
                
                <button
                  onClick={() => {
                    setShowGenerateForm(!showGenerateForm);
                    if (subjects.length > 0 && !genSubjectId) {
                      setGenSubjectId(subjects[0].id);
                    }
                  }}
                  className="bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase font-mono tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Generate Custom Test</span>
                </button>
              </div>

              {/* Drawer/Form for Dynamic Assessment Generation */}
              {showGenerateForm && (
                <div className="bg-[#0e1726]/50 backdrop-blur-md border border-indigo-500/20 p-5 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                    <h3 className="text-xs font-black uppercase tracking-wider font-mono">Create Customized Gemini Assessment</h3>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Select a course subject. Gemini will retrieve your weak area tracking profiles, past study durations, and curriculum metrics to formulate 3 analytical analytical questions specifically targeting your gaps.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Select Course</label>
                      <select
                        value={genSubjectId}
                        onChange={(e) => setGenSubjectId(e.target.value)}
                        className="w-full bg-[#111a2e]/80 border border-white/[0.08] text-slate-200 p-3 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                      >
                        <option value="" disabled>-- Select a course --</option>
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.difficulty})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Curriculum Week Number</label>
                      <select
                        value={genWeekNumber}
                        onChange={(e) => setGenWeekNumber(e.target.value)}
                        className="w-full bg-[#111a2e]/80 border border-white/[0.08] text-slate-200 p-3 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(w => (
                          <option key={w} value={w}>Week {w} Test</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setShowGenerateForm(false)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-400 px-4 py-2 rounded-lg text-[11px] font-bold uppercase font-mono cursor-pointer transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGenerateAssessment}
                      disabled={isGenerating}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-[11px] font-bold uppercase font-mono flex items-center gap-1.5 cursor-pointer transition"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generate Assessment</span>
                        </>
                      )}
                    </button>
                  </div>

                  {isGenerating && (
                    <div className="border-t border-white/[0.05] pt-3 mt-2 space-y-2">
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Gemini curriculum formulation status...</span>
                        <span>{Math.round((generationStep + 1) * 25)}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-1000"
                          style={{ width: `${(generationStep + 1) * 25}%` }}
                        ></div>
                      </div>
                      <p className="text-[11px] text-indigo-400 italic font-mono animate-pulse">
                        &gt; {[
                          'Retrieving subject curriculum mapping...',
                          'Reviewing past task performance and weak areas...',
                          'Formulating rigorous analytical questions with Gemini...',
                          'Calibrating strict grading rubrics...'
                        ][generationStep]}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {assessments.length === 0 ? (
                <div className="bg-[#0e1726]/30 backdrop-blur-md border border-white/[0.06] rounded-2xl p-12 text-center text-slate-500 text-xs">
                  No weekly assessments assigned. Create subject courses or generate custom tests to spin up curriculum evaluations!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assessments.map(ass => {
                    const isSubmitted = ass.status === 'submitted';
                    return (
                      <div
                        key={ass.id}
                        onClick={() => handleOpenAssessment(ass)}
                        className="bg-[#0e1726]/30 backdrop-blur-md border border-white/[0.06] p-5 rounded-2xl hover:border-indigo-500/30 cursor-pointer flex flex-col justify-between hover:shadow-lg hover:shadow-black/10 transition duration-200 group"
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <span className="text-[9px] font-black font-mono uppercase bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/15">
                              Week {ass.weekNumber} Test
                            </span>
                            
                            <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded border ${
                              isSubmitted
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/15 animate-pulse'
                            }`}>
                              {isSubmitted ? `SUBMITTED: ${ass.score}%` : 'PENDING'}
                            </span>
                          </div>

                          <h3 className="text-xs font-bold text-slate-200 mt-3 group-hover:text-white transition line-clamp-1">
                            {ass.title}
                          </h3>
                          <p className="text-[10px] text-slate-400 mt-1 font-mono uppercase">
                            {ass.subjectName}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                            {ass.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/[0.04] text-[10px] text-slate-500">
                          <span>Assigned date: {ass.date}</span>
                          <div className="flex items-center gap-1 text-indigo-400 font-bold group-hover:translate-x-0.5 transition">
                            <span>{isSubmitted ? 'Review Feedback' : 'Start Assessment'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          ) : (
            /* Detailed assessment submission terminal */
            <div className="bg-[#0e1726]/30 backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 space-y-6 shadow-2xl">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedAssessment(null);
                      fetchAssessments();
                    }}
                    className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-white/[0.04] transition animate-none"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest font-mono">
                      Weekly Academic Testing
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {selectedAssessment.title}
                    </h3>
                  </div>
                </div>

                <span className={`text-[10px] font-black font-mono px-3 py-1 rounded-full border ${
                  selectedAssessment.status === 'submitted'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/25 animate-pulse'
                }`}>
                  {selectedAssessment.status === 'submitted' ? `GRADED: ${selectedAssessment.score}%` : 'IN PROGRESS'}
                </span>
              </div>

              {selectedAssessment.status === 'pending' ? (
                /* Open-ended Essay Questionnaire Form */
                <div className="space-y-6">
                  
                  <div className="bg-[#111a2e]/60 border border-white/[0.04] p-5 rounded-xl">
                    <h4 className="text-xs font-black uppercase tracking-wider font-mono text-indigo-400 mb-1">Testing Guidelines</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Provide cohesive, mathematically or conceptually sound explanations. The AI grader acts as a strict academic reviewer evaluating clarity, depth of knowledge, and correctness.
                    </p>
                  </div>

                  <div className="space-y-5">
                    {selectedAssessment.questions.map((q, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-300 leading-relaxed">
                            Q{idx + 1}. {q}
                          </label>
                          <span className="text-[10px] font-mono text-slate-500">
                            Answer {idx + 1} of {selectedAssessment.questions.length}
                          </span>
                        </div>

                        <textarea
                          value={essayAnswers[idx] || ''}
                          onChange={(e) => handleAnswerChange(idx, e.target.value)}
                          rows={4}
                          placeholder="Type your deep analytical response here..."
                          className="w-full bg-[#111a2e]/60 border border-white/[0.08] rounded-xl p-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all font-sans leading-relaxed"
                        />
                        
                        <div className="text-right text-[10px] text-slate-500 font-mono">
                          {(essayAnswers[idx] || '').trim().length} characters (min 10)
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Submit panel */}
                  <div className="flex items-center justify-between border-t border-white/[0.06] pt-4">
                    <button
                      onClick={() => setSelectedAssessment(null)}
                      className="bg-[#111a2e]/60 hover:bg-slate-700 text-slate-300 px-6 py-2.5 rounded-xl font-bold font-display text-xs cursor-pointer transition"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleSubmitAssessment}
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-40 text-white px-7 py-3 rounded-xl font-bold font-display text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer transition"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting essays for academic grading...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Weekly Assessment</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              ) : (
                /* Submitted Essay review & Grading feedback */
                <div className="space-y-6">
                  
                  {/* Grading scorecard badge */}
                  <div className="bg-[#111a2e]/60 border border-white/[0.04] p-5 rounded-2xl flex items-center gap-6 shadow-md">
                    <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 flex items-center justify-center bg-indigo-600/10 flex-shrink-0">
                      <div className="text-center">
                        <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">GPA Rating</p>
                        <p className="text-2xl font-black text-indigo-400 font-display mt-0.5">{selectedAssessment.score}%</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider font-mono text-indigo-400">
                        Graded Successfully by AI Professor
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                        Below is your final academic grade evaluation and scorecard. Read through the professor's notes to correct gaps in formulas, systems, or logical deduction.
                      </p>
                    </div>
                  </div>

                  {/* Submitted Answers List */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider font-mono text-slate-400">
                      My Essay Submissions
                    </h4>

                    {selectedAssessment.questions.map((q, idx) => {
                      const ans = selectedAssessment.studentAnswers ? selectedAssessment.studentAnswers[idx] : '';
                      return (
                        <div key={idx} className="bg-[#111a2e]/20 border border-white/[0.04] p-5 rounded-xl space-y-2">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest font-mono">
                            Question {idx + 1}: {q}
                          </p>
                          <p className="text-xs text-slate-300 italic whitespace-pre-wrap leading-relaxed">
                            "{ans || 'No response recorded.'}"
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Professor Notes Feedback Block */}
                  {selectedAssessment.gradeFeedback && (
                    <div className="bg-[#111a2e]/60 border border-indigo-500/20 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center gap-2 text-indigo-400">
                        <FileCheck className="w-5 h-5" />
                        <h4 className="text-xs font-black uppercase tracking-wider font-mono">Professor's Graded Feedback Sheet</h4>
                      </div>

                      <div className="border-t border-white/[0.06] pt-4 text-slate-300 text-xs leading-relaxed prose prose-invert max-w-none">
                        <div className="markdown-body">
                          {selectedAssessment.gradeFeedback.split('\n').map((line, lIdx) => {
                            if (line.startsWith('### ')) {
                              return <h4 key={lIdx} className="text-xs font-black uppercase text-slate-200 tracking-wider font-mono mt-4 mb-2">{line.replace('### ', '')}</h4>;
                            } else if (line.startsWith('- ')) {
                              return <li key={lIdx} className="ml-4 list-disc mt-1 text-slate-300">{line.replace('- ', '')}</li>;
                            } else {
                              return <p key={lIdx} className="mt-1 text-slate-300">{line}</p>;
                            }
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Return link */}
                  <div className="text-center pt-2">
                    <button
                      onClick={() => {
                        setSelectedAssessment(null);
                        fetchAssessments();
                      }}
                      className="bg-slate-700 hover:bg-slate-600 font-bold font-display text-xs text-white px-8 py-3 rounded-xl cursor-pointer transition"
                    >
                      Return to Assessments Directory
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}
        </div>
      ) : (
        // ==========================================
        // SUB-TAB: OVERALL COURSE FEEDBACKS
        // ==========================================
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-black text-slate-200 uppercase tracking-wider font-mono">Student Overall Course Feedbacks</h2>
            </div>

            <div className="flex items-center gap-2">
              {feedbacks.length > 0 && (
                <button
                  onClick={handleGenerateAISummary}
                  disabled={isGeneratingSummary}
                  className="bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase font-mono tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isGeneratingSummary ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Feedback summary</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => {
                  setShowFeedbackForm(!showFeedbackForm);
                  if (subjects.length > 0 && !fbSubjectId) {
                    setFbSubjectId(subjects[0].id);
                  }
                }}
                className="bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase font-mono tracking-wider flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Write Feedback</span>
              </button>
            </div>
          </div>

          {/* Dynamic AI Summary Report display */}
          {aiSummary && (
            <div className="bg-gradient-to-br from-[#10223e] to-[#0d1624] border-2 border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
              <div className="flex items-start justify-between pb-4 border-b border-white/[0.06] mb-4">
                <div className="flex items-center gap-2 text-indigo-300">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider font-mono">Gemini AI Student Sentiment & Curriculum Roadmap</h3>
                </div>
                <button
                  onClick={() => setAiSummary(null)}
                  className="text-slate-500 hover:text-slate-300 text-xs font-mono"
                >
                  Clear Report
                </button>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed space-y-4 max-w-none prose prose-invert font-sans">
                {aiSummary.split('\n').map((line, lIdx) => {
                  if (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ')) {
                    return (
                      <h4 key={lIdx} className="text-xs font-black uppercase text-indigo-400 tracking-wider font-mono mt-4 mb-2 border-b border-indigo-500/10 pb-1">
                        {line.replace(/#+\s*/, '')}
                      </h4>
                    );
                  } else if (line.startsWith('- ') || line.startsWith('* ')) {
                    return <li key={lIdx} className="ml-4 list-disc mt-1 text-slate-300">{line.replace(/^[-*]\s*/, '')}</li>;
                  } else if (line.trim() === '') {
                    return <div key={lIdx} className="h-2" />;
                  } else {
                    return <p key={lIdx} className="mt-1">{line}</p>;
                  }
                })}
              </div>
            </div>
          )}

          {/* Write course feedback card */}
          {showFeedbackForm && (
            <div className="bg-[#0e1726]/50 backdrop-blur-md border border-indigo-500/20 p-5 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="flex items-center gap-2 text-indigo-400">
                <MessageSquare className="w-4 h-4" />
                <h3 className="text-xs font-black uppercase tracking-wider font-mono">Add Course Feedback</h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Provide structured overall feedback to register your sentiment about this curriculum.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Select Course</label>
                  <select
                    value={fbSubjectId}
                    onChange={(e) => setFbSubjectId(e.target.value)}
                    className="w-full bg-[#111a2e]/80 border border-white/[0.08] text-slate-200 p-3 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="" disabled>-- Select Course --</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Overall Rating</label>
                  <div className="flex items-center gap-1.5 h-12">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setFbRating(star)}
                        className="text-slate-400 hover:text-amber-400 transition"
                      >
                        <Star className={`w-6 h-6 ${star <= fbRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                      </button>
                    ))}
                    <span className="text-xs font-black font-mono text-slate-300 ml-2">({fbRating}/5 stars)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">General Course Sentiment & Thoughts</label>
                  <textarea
                    value={fbGeneral}
                    onChange={(e) => setFbGeneral(e.target.value)}
                    rows={2}
                    placeholder="E.g., How would you describe the course experience overall?"
                    className="w-full bg-[#111a2e]/60 border border-white/[0.08] rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">What did you enjoy most?</label>
                  <textarea
                    value={fbEnjoyed}
                    onChange={(e) => setFbEnjoyed(e.target.value)}
                    rows={2}
                    placeholder="E.g., The AI quiz features, the professor lectures, spacing interval schedules..."
                    className="w-full bg-[#111a2e]/60 border border-white/[0.08] rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">What concepts are you still struggling with?</label>
                  <textarea
                    value={fbStruggles}
                    onChange={(e) => setFbStruggles(e.target.value)}
                    rows={2}
                    placeholder="E.g., Chaining decorators, normal database rules, matrix geometry..."
                    className="w-full bg-[#111a2e]/60 border border-white/[0.08] rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowFeedbackForm(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-400 px-4 py-2 rounded-lg text-[11px] font-bold uppercase font-mono cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  disabled={isSubmittingFeedback}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-[11px] font-bold uppercase font-mono flex items-center gap-1.5 cursor-pointer transition"
                >
                  {isSubmittingFeedback ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Overall Feedback</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Feedbacks Directory */}
          {feedbacks.length === 0 ? (
            <div className="bg-[#0e1726]/30 backdrop-blur-md border border-white/[0.06] rounded-2xl p-12 text-center text-slate-500 text-xs">
              No course feedback registered. Select 'Write Feedback' to review your overall subject course experiences!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedbacks.map(fb => (
                <div
                  key={fb.id}
                  className="bg-[#0e1726]/30 backdrop-blur-md border border-white/[0.06] p-5 rounded-2xl space-y-4 hover:border-indigo-500/20 hover:shadow-lg hover:shadow-black/15 transition duration-200"
                >
                  <div className="flex items-start justify-between border-b border-white/[0.04] pb-3">
                    <div>
                      <h3 className="text-xs font-bold text-slate-200">{fb.subjectName}</h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Registered: {fb.date}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${star <= fb.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed">
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black font-mono text-indigo-400 uppercase tracking-widest">General Sentiment</p>
                      <p className="text-slate-300 italic">"{fb.generalFeedback}"</p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-1 border-t border-white/[0.03]">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black font-mono text-emerald-400 uppercase tracking-widest">Loved Most</p>
                        <p className="text-slate-400 text-[11px]">{fb.enjoyedMost}</p>
                      </div>

                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black font-mono text-rose-400 uppercase tracking-widest">Struggling With</p>
                        <p className="text-slate-400 text-[11px]">{fb.strugglingWith}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
}

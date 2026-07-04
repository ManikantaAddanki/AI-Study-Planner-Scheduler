import React, { useState, useEffect } from 'react';
import { Subject, MockQuizSession } from '../types';
import { Award, Brain, Loader2, Play, Trash2, CheckCircle2, XCircle, ArrowLeft, ArrowRight, HelpCircle, ChevronRight, FileCheck } from 'lucide-react';

interface MockQuizzesViewProps {
  subjects: Subject[];
  onTriggerNotification: (msg: string) => void;
  onRefreshUserStats: () => Promise<void>;
}

export default function MockQuizzesView({ subjects, onTriggerNotification, onRefreshUserStats }: MockQuizzesViewProps) {
  const [quizzes, setQuizzes] = useState<MockQuizSession[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<MockQuizSession | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [xpGainedMessage, setXpGainedMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await fetch('/api/quizzes');
      const data = await res.json();
      setQuizzes(data);
    } catch (err) {
      console.error('Error fetching mock quizzes:', err);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!selectedSubjectId) {
      onTriggerNotification('Please select a course to generate a mock quiz.');
      return;
    }
    const subject = subjects.find(s => s.id === selectedSubjectId);
    if (!subject) return;

    setIsGenerating(true);
    setXpGainedMessage(null);
    try {
      const res = await fetch('/api/quizzes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: subject.id,
          subjectName: subject.name
        })
      });
      const data = await res.json();
      setActiveQuiz(data);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      fetchQuizzes();
      onTriggerNotification(`MCQ Quiz of 5 questions generated for ${subject.name}!`);
    } catch (err) {
      console.error(err);
      onTriggerNotification('Failed to generate mock quiz.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIdx]: optionIdx
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;

    // Check if all questions are answered
    const unansweredCount = activeQuiz.questions.length - Object.keys(selectedAnswers).length;
    if (unansweredCount > 0) {
      if (!confirm(`You have ${unansweredCount} unanswered questions. Submit anyway?`)) return;
    }

    setIsSubmitting(true);
    try {
      // Map dictionary to array indices (defaulting to -1 if unanswered)
      const userAnswers = activeQuiz.questions.map((_, idx) => 
        selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1
      );

      const res = await fetch('/api/quizzes/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeQuiz.id,
          userAnswers
        })
      });
      const data = await res.json();
      setActiveQuiz(data.session);
      fetchQuizzes();

      if (data.xpGained > 0) {
        setXpGainedMessage(`🎉 Quiz Completed! You scored ${data.session.score}% and awarded +${data.xpGained} XP!`);
        onRefreshUserStats();
        onTriggerNotification(`MCQ Quiz Scored: ${data.session.score}%! Gained +${data.xpGained} XP!`);
      }
    } catch (err) {
      console.error(err);
      onTriggerNotification('Error submitting quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuiz = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this quiz history?')) return;

    try {
      await fetch(`/api/quizzes/${id}`, { method: 'DELETE' });
      if (activeQuiz?.id === id) {
        setActiveQuiz(null);
      }
      fetchQuizzes();
      onTriggerNotification('Quiz history deleted.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="mock-quizzes-view-root" className="lg:col-span-9 space-y-6">
      
      {/* Dynamic Banner */}
      <div className="bg-gradient-to-r from-[#111c30] to-[#2e1065] rounded-2xl p-6 border border-white/[0.06] relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl -z-10"></div>
        <span className="bg-violet-500/15 text-violet-400 text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-full border border-violet-500/25">
          MCQ Mock Quizzes
        </span>
        <h1 className="text-2xl font-bold font-display text-white mt-3">Interactive MCQ Quizzes</h1>
        <p className="text-xs text-slate-400 mt-1.5 max-w-xl leading-relaxed">
          Challenge your conceptual understanding! Select any course and generate 5 specialized multiple-choice questions with dynamic instant grading and complete solution explanations.
        </p>
      </div>

      {xpGainedMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-4 text-xs font-bold text-emerald-400 flex items-center gap-3 animate-pulse">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span>{xpGainedMessage}</span>
        </div>
      )}

      {!activeQuiz ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Setup Quiz Configurator */}
          <div className="md:col-span-5 bg-[#0e1726]/30 backdrop-blur-md border border-white/[0.06] p-6 rounded-2xl space-y-5">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-400" />
              <h2 className="text-sm font-black text-slate-200 uppercase tracking-wider font-mono">Create Mock Quiz</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-2">
                  Select Course
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full bg-[#111a2e]/60 border border-white/[0.08] rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-violet-500 transition-all"
                >
                  <option value="">-- Choose Course --</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleGenerateQuiz}
                disabled={isGenerating || !selectedSubjectId}
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-40 font-bold font-display text-xs text-white py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 cursor-pointer transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Compiling 5 Custom MCQs...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Generate custom quiz</span>
                  </>
                )}
              </button>
            </div>

            {/* List of Previous Quizzes */}
            <div className="pt-4 border-t border-white/[0.06] space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">
                My Quiz History
              </p>

              {quizzes.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-[11px]">
                  No past quiz sessions available.
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {quizzes.map(qz => (
                    <div
                      key={qz.id}
                      onClick={() => {
                        setActiveQuiz(qz);
                        setXpGainedMessage(null);
                      }}
                      className="bg-[#111a2e]/40 hover:bg-[#111a2e]/80 border border-white/[0.04] p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-200 truncate">{qz.subjectName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{qz.date} • {qz.questions.length} Questions</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {qz.status === 'completed' ? (
                          <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded border ${
                            (qz.score || 0) >= 70
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {qz.score}%
                          </span>
                        ) : (
                          <span className="text-[10px] font-black font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse">
                            ACTIVE
                          </span>
                        )}
                        <button
                          onClick={(e) => handleDeleteQuiz(qz.id, e)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-white/[0.04] transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Interactive Guides and Track list */}
          <div className="md:col-span-7 bg-[#0e1726]/30 backdrop-blur-md border border-white/[0.06] p-6 rounded-2xl flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-violet-400" />
                  <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider font-mono">Mock Quiz Domains</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subjects.map(sub => (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSubjectId(sub.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-28 relative overflow-hidden ${
                      selectedSubjectId === sub.id
                        ? 'bg-violet-600/10 border-violet-500 shadow-md shadow-violet-500/5'
                        : 'bg-[#111a2e]/40 border-white/[0.04] hover:bg-[#111a2e]/70'
                    }`}
                  >
                    <div
                      className="absolute top-0 right-0 w-12 h-12 rounded-full blur-xl opacity-30"
                      style={{ backgroundColor: sub.color }}
                    ></div>
                    
                    <div>
                      <div className="w-2.5 h-2.5 rounded-full mb-2" style={{ backgroundColor: sub.color }}></div>
                      <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{sub.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono uppercase">{sub.weakTopics?.length || 0} Weak Topics</p>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-slate-500 pt-2 border-t border-white/[0.04]">
                      <span>Exam: {sub.examDate}</span>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#111a2e]/60 border border-white/[0.04] p-4 rounded-xl mt-5">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-300">How is the quiz scored?</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Every quiz contains 5 questions. Scoring points are calculated at 25 XP per correct option. Detailed solutions and explanations will be shown instantly once submitted.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* MCQ Quiz Questionnaire View */
        <div className="bg-[#0e1726]/30 backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 shadow-2xl space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveQuiz(null);
                  fetchQuizzes();
                }}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-white/[0.04] transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                  Course Challenge
                </p>
                <h3 className="text-sm font-bold text-white">
                  {activeQuiz.title} ({activeQuiz.subjectName})
                </h3>
              </div>
            </div>

            <div className="text-right">
              <span className={`text-[10px] font-black font-mono px-3 py-1 rounded-full border ${
                activeQuiz.status === 'completed'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                  : 'bg-violet-500/10 text-violet-400 border-violet-500/25 animate-pulse'
              }`}>
                {activeQuiz.status === 'completed' ? `SCORE: ${activeQuiz.score}%` : 'LIVE MCQ'}
              </span>
            </div>
          </div>

          {activeQuiz.status === 'active' ? (
            /* Active MCQ Form */
            <div className="space-y-6">
              
              {/* Question card */}
              <div className="bg-[#111a2e]/60 border border-white/[0.04] p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black font-mono text-violet-400 uppercase tracking-widest">
                    Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-100 leading-relaxed mt-1">
                  {activeQuiz.questions[currentQuestionIndex].question}
                </h3>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-3">
                {activeQuiz.questions[currentQuestionIndex].options.map((opt, oIdx) => {
                  const isSelected = selectedAnswers[currentQuestionIndex] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectOption(currentQuestionIndex, oIdx)}
                      className={`w-full text-left p-4 rounded-xl border text-xs font-medium cursor-pointer flex items-center justify-between transition-all duration-150 ${
                        isSelected
                          ? 'bg-violet-600/10 border-violet-500 text-white shadow-md shadow-violet-500/5'
                          : 'bg-[#111a2e]/40 border-white/[0.04] text-slate-300 hover:bg-[#111a2e]/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold border ${
                          isSelected
                            ? 'bg-violet-600 text-white border-violet-400'
                            : 'bg-[#0e1726]/40 text-slate-400 border-white/[0.06]'
                        }`}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      
                      {isSelected && <FileCheck className="w-4 h-4 text-violet-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Progress Slider Bar */}
              <div className="w-full bg-[#111a2e]/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-violet-600 h-1.5 transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%` }}
                ></div>
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="bg-slate-700/50 hover:bg-slate-700 disabled:opacity-40 text-slate-300 px-4 py-2.5 rounded-xl font-bold font-display text-xs flex items-center gap-2 cursor-pointer transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl font-bold font-display text-xs flex items-center gap-2 cursor-pointer transition"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white px-6 py-2.5 rounded-xl font-bold font-display text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting responses...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Submit Quiz</span>
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>
          ) : (
            /* Completed Quiz Review Panel */
            <div className="space-y-6">
              
              {/* Performance Indicator */}
              <div className="bg-[#111a2e]/60 border border-white/[0.04] p-5 rounded-2xl flex items-center gap-6">
                <div className="w-24 h-24 rounded-full border-4 border-violet-500/20 flex items-center justify-center bg-violet-600/10">
                  <div className="text-center">
                    <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Score</p>
                    <p className="text-2xl font-black text-violet-400 font-display mt-0.5">{activeQuiz.score}%</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider font-mono text-violet-400">
                    Challenge Completed Successfully
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Below is the structured question-by-question review of your MCQ quiz. Solutions are expanded below with thorough compiler and logic explanations.
                  </p>
                </div>
              </div>

              {/* Itemized Questions Review Sheet */}
              <div className="space-y-4">
                {activeQuiz.questions.map((q, idx) => {
                  const studentAnswer = activeQuiz.userAnswers ? activeQuiz.userAnswers[idx] : -1;
                  const isCorrect = studentAnswer === q.correctAnswerIndex;
                  return (
                    <div
                      key={idx}
                      className={`border p-5 rounded-2xl space-y-4 bg-[#111a2e]/40 ${
                        isCorrect
                          ? 'border-emerald-500/20 hover:border-emerald-500/40'
                          : 'border-rose-500/20 hover:border-rose-500/40'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 pr-2">
                          <span className="text-[9px] font-black font-mono uppercase tracking-widest text-slate-500">
                            Question {idx + 1}
                          </span>
                          <h4 className="text-xs font-bold text-slate-200 mt-1 leading-relaxed">
                            {q.question}
                          </h4>
                        </div>
                        <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded border flex-shrink-0 flex items-center gap-1.5 ${
                          isCorrect
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {isCorrect ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>CORRECT</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>INCORRECT</span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* Options List */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt, oIdx) => {
                          const isStudentOption = studentAnswer === oIdx;
                          const isCorrectOption = q.correctAnswerIndex === oIdx;
                          return (
                            <div
                              key={oIdx}
                              className={`p-3 rounded-lg text-[11px] font-medium border flex items-center justify-between ${
                                isCorrectOption
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                  : isStudentOption
                                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                                    : 'bg-[#0e1726]/30 border-white/[0.04] text-slate-400'
                              }`}
                            >
                              <span>{opt}</span>
                              {isCorrectOption && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                              {!isCorrectOption && isStudentOption && <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />}
                            </div>
                          );
                        })}
                      </div>

                      {/* Solution Explanation */}
                      <div className="bg-[#0e1726]/40 p-4 rounded-xl border border-white/[0.04]">
                        <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest font-mono">
                          Tutor Solution & Explanation
                        </p>
                        <p className="text-[11px] text-slate-300 leading-relaxed mt-1.5">
                          {q.explanation}
                        </p>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Review actions */}
              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    setActiveQuiz(null);
                    fetchQuizzes();
                  }}
                  className="bg-slate-700 hover:bg-slate-600 font-bold font-display text-xs text-white px-8 py-3 rounded-xl cursor-pointer transition"
                >
                  Return to Quizzes Dashboard
                </button>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}

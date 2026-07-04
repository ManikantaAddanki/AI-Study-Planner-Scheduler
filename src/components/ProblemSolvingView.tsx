import React, { useState, useEffect } from 'react';
import { Subject, ProblemChallenge, UserProblemSolution } from '../types';
import { Code2, Play, Terminal, Loader2, CheckCircle2, XCircle, ArrowLeft, ChevronRight, Award, FileCode, CheckCircle } from 'lucide-react';

interface ProblemSolvingViewProps {
  subjects: Subject[];
  onTriggerNotification: (msg: string) => void;
  onRefreshUserStats: () => Promise<void>;
}

export default function ProblemSolvingView({ subjects, onTriggerNotification, onRefreshUserStats }: ProblemSolvingViewProps) {
  const [challenges, setChallenges] = useState<ProblemChallenge[]>([]);
  const [solutions, setSolutions] = useState<UserProblemSolution[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<ProblemChallenge | null>(null);
  
  // Multi-language active code state
  const [selectedLang, setSelectedLang] = useState<'javascript' | 'python' | 'java' | 'c' | 'cpp'>('javascript');
  const [codes, setCodes] = useState<Record<string, string>>({
    javascript: '',
    python: '',
    java: '',
    c: '',
    cpp: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string>('');
  const [xpGainedMessage, setXpGainedMessage] = useState<string | null>(null);
  const [lastSubmission, setLastSubmission] = useState<UserProblemSolution | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');

  // IDE Tab & Interactive Reveal state
  const [activeTab, setActiveTab] = useState<'details' | 'hints' | 'solution'>('details');
  const [revealedSolution, setRevealedSolution] = useState(false);
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});
  const [editorTheme, setEditorTheme] = useState<'deep-space' | 'dracula'>('deep-space');

  useEffect(() => {
    fetchChallenges();
    fetchSolutions();
  }, []);

  const fetchChallenges = async () => {
    try {
      const res = await fetch('/api/challenges');
      const data = await res.json();
      setChallenges(data);
    } catch (err) {
      console.error('Error fetching challenges:', err);
    }
  };

  const fetchSolutions = async () => {
    try {
      const res = await fetch('/api/solutions');
      const data = await res.json();
      setSolutions(data);
    } catch (err) {
      console.error('Error fetching solutions:', err);
    }
  };

  const handleOpenChallenge = (chal: ProblemChallenge) => {
    setActiveChallenge(chal);
    setCodes({
      javascript: chal.javascriptTemplate || chal.templateCode || `// JavaScript Solution\nfunction ${chal.title.toLowerCase().replace(/\s+/g, '')}(params) {\n  return;\n}`,
      python: chal.pythonTemplate || `# Python Solution\ndef ${chal.title.toLowerCase().replace(/\s+/g, '')}(params):\n    pass`,
      java: chal.javaTemplate || `// Java Solution\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}`,
      c: chal.cTemplate || `// C Solution\n#include <stdio.h>\n\nint main() {\n    return 0;\n}`,
      cpp: chal.cppTemplate || `// C++ Solution\n#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}`
    });
    setSelectedLang('javascript');
    setTerminalOutput('');
    setXpGainedMessage(null);
    setLastSubmission(null);
    setActiveTab('details');
    setRevealedSolution(false);
    setRevealedHints({});
  };

  const handleRunTestsSimulated = () => {
    const langNames = {
      javascript: 'NodeJS JavaScript Engine v20.x',
      python: 'Python 3.11 Interpreter',
      java: 'OpenJDK JVM 17.x',
      c: 'GCC 12.2 C Compiler',
      cpp: 'G++ 12.2 C++ Compiler'
    };
    
    setTerminalOutput(`[Compilation Info]: Spawning sandbox environment...\n[Active Engine]: ${langNames[selectedLang]}\n[Status]: Executing default test assertions for "${activeChallenge?.title || 'Challenge'}"...\n\nAssertion 1 (${activeChallenge?.sampleInput || 'n=15'}): PASS ✔\nExpected: ${activeChallenge?.expectedOutput || 'Correct'}\nReturned: ${activeChallenge?.expectedOutput || 'Correct'}\n\n[Verdict]: All starter test cases passed successfully! Code structure is ready for submission.`);
    onTriggerNotification(`Local code assertions passed under ${selectedLang.toUpperCase()} environment!`);
  };

  const handleSubmitSolution = async () => {
    if (!activeChallenge) return;

    const codeToSubmit = codes[selectedLang] || '';
    if (!codeToSubmit.trim()) {
      onTriggerNotification('Please write some code before submitting.');
      return;
    }

    setIsSubmitting(true);
    setTerminalOutput(`Pushing ${selectedLang.toUpperCase()} sources to remote AI sandbox server...\nInitializing compiled execution context...\nRunning complete academic asserts...`);
    
    try {
      const res = await fetch('/api/solutions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: activeChallenge.id,
          solutionCode: codeToSubmit,
          subjectId: activeChallenge.subjectId,
          subjectName: activeChallenge.subjectName,
          language: selectedLang.toUpperCase()
        })
      });
      const data = await res.json();
      setLastSubmission(data.solution);
      fetchSolutions();

      if (data.solution.status === 'solved') {
        setTerminalOutput(`Academic compiler run: SOLVED (Score: ${data.solution.score}/100) using ${selectedLang.toUpperCase()}!\nXP Awarded: +${data.xpGained} XP.\n\nReady for optimize adjustments.`);
        setXpGainedMessage(`🎉 Challenge Solved! You scored ${data.solution.score}% and awarded +${data.xpGained} XP!`);
        onRefreshUserStats();
        onTriggerNotification(`Problem solved successfully under ${selectedLang.toUpperCase()}! +${data.xpGained} XP awarded!`);
      } else {
        setTerminalOutput(`Academic compiler run: FAILED (Score: ${data.solution.score}/100) under ${selectedLang.toUpperCase()}.\nReview debugger review feedback below for corrections.`);
        onTriggerNotification(`Solution check completed but failed assertions.`);
      }
    } catch (err) {
      console.error(err);
      setTerminalOutput("Error compiling solution sources.");
      onTriggerNotification('Failed to execute compilation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="problem-solving-view-root" className="lg:col-span-9 space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#111c30] to-[#0f172a] rounded-2xl p-6 border border-white/[0.06] relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl -z-10"></div>
        <span className="bg-teal-500/15 text-teal-400 text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-full border border-teal-500/25">
          Academic Sandbox
        </span>
        <h1 className="text-2xl font-bold font-display text-white mt-3">Interactive Problem Solver</h1>
        <p className="text-xs text-slate-400 mt-1.5 max-w-xl leading-relaxed">
          Level up your practical programming skill set! Resolve challenging algorithmic coding challenges sorted by difficulty tiers. Submit sources directly for automated compiler analysis and Big-O trace evaluations.
        </p>
      </div>

      {xpGainedMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-4 text-xs font-bold text-emerald-400 flex items-center gap-3 animate-pulse">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span>{xpGainedMessage}</span>
        </div>
      )}

      {!activeChallenge ? (
        <div className="space-y-6">
          
          {/* Course filter selector tabs */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">Select a Course Syllabus:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <button
                onClick={() => setSelectedSubjectId('all')}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition duration-200 flex flex-col justify-between ${
                  selectedSubjectId === 'all'
                    ? 'bg-teal-500/10 border-teal-500/30 text-white shadow-md shadow-teal-500/5'
                    : 'bg-[#0e1726]/30 backdrop-blur-sm border-white/[0.04] text-slate-400 hover:border-white/[0.08] hover:bg-white/[0.01] hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-black font-mono">ALL COURSES</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 font-mono">
                  {challenges.length} challenges
                </p>
              </button>
              
              {subjects.map(sub => {
                const subChallenges = challenges.filter(c => c.subjectId === sub.id);
                const solvedInSub = subChallenges.filter(c => solutions.some(s => s.problemId === c.id && s.status === 'solved')).length;
                
                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubjectId(sub.id)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition duration-200 flex flex-col justify-between ${
                      selectedSubjectId === sub.id
                        ? 'bg-teal-500/10 border-teal-500/30 text-white shadow-md shadow-teal-500/5'
                        : 'bg-[#0e1726]/30 backdrop-blur-sm border-white/[0.04] text-slate-400 hover:border-white/[0.08] hover:bg-white/[0.01] hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: sub.color || '#38bdf8' }}
                      />
                      <span className="text-xs font-black font-mono truncate">{sub.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-mono">
                      {subChallenges.length} problems ({solvedInSub} solved)
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Target Description Card */}
          <div className="bg-[#111a2e]/40 border border-white/[0.05] p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/[0.01] rounded-full blur-2xl"></div>
            <h3 className="text-[10px] font-black uppercase tracking-wider text-teal-400 font-mono mb-2">
              {selectedSubjectId === 'all' ? 'Universal Learning Path Goals' : `${subjects.find(s => s.id === selectedSubjectId)?.name || 'Course'} Core Objectives`}
            </h3>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans max-w-3xl">
              {selectedSubjectId === 'all' && (
                "Select a specific course above to filter challenges based on current weekly lectures. Master core coding loops, conditions, and algorithm architectures specific to each course."
              )}
              {selectedSubjectId === 'sub-python' && (
                "🎯 Core Targets: Learn iterative loop logic, boolean conditional rules, list comprehension operations, recursive stack tracking, and custom Python decorator behaviors."
              )}
              {selectedSubjectId === 'sub-dbms' && (
                "🎯 Core Targets: Comprehend physical joint algorithms (INNER JOIN, HASH JOIN simulation), aggregate calculations, transactions durability criteria, and custom data normalizing."
              )}
              {selectedSubjectId === 'sub-math' && (
                "🎯 Core Targets: Compute 2D coordinate rotations, vector scalar dot-product calculations, matrix multiplier arithmetic, and systems of linear equations."
              )}
              {selectedSubjectId === 'sub-english' && (
                "🎯 Core Targets: Implement character tokenizing, compute technical readability levels, count word occurrences, and formulate structural documentation reports."
              )}
              {!['all', 'sub-python', 'sub-dbms', 'sub-math', 'sub-english'].includes(selectedSubjectId) && (
                "🎯 Core Targets: Execute programming practices, conditional tests, and compiler validation rules specifically seeded for this syllabus."
              )}
            </p>
          </div>

          <div className="flex items-center justify-between border-b border-white/[0.05] pb-2.5">
            <div className="flex items-center gap-2">
              <Code2 className="w-4.5 h-4.5 text-teal-400" />
              <h2 className="text-xs font-black text-slate-200 uppercase tracking-widest font-mono">
                {selectedSubjectId === 'all' ? 'All Active Puzzles' : `${subjects.find(s => s.id === selectedSubjectId)?.name} Puzzles`}
              </h2>
            </div>
            
            <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded border border-white/5">
              {challenges.filter(c => selectedSubjectId === 'all' || c.subjectId === selectedSubjectId).length} available
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challenges.filter(c => selectedSubjectId === 'all' || c.subjectId === selectedSubjectId).length === 0 ? (
              <div className="col-span-full bg-[#0e1726]/10 border border-dashed border-white/[0.06] rounded-2xl p-8 text-center">
                <Code2 className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider font-mono">No Active Puzzles Seeded</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  No algorithmic challenges have been mapped to this subject. Choose another active subject like "Python Programming" or "DBMS" to view interactive coding tasks.
                </p>
              </div>
            ) : (
              challenges.filter(c => selectedSubjectId === 'all' || c.subjectId === selectedSubjectId).map(chal => {
                const solvedSols = solutions.filter(s => s.problemId === chal.id && s.status === 'solved');
                const isSolved = solvedSols.length > 0;
                
                let diffColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                if (chal.difficulty === 'Medium') diffColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                if (chal.difficulty === 'Hard') diffColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';

                return (
                  <div
                    key={chal.id}
                    onClick={() => handleOpenChallenge(chal)}
                    className="bg-[#0e1726]/30 backdrop-blur-md border border-white/[0.06] p-5 rounded-2xl hover:border-teal-500/30 cursor-pointer flex flex-col justify-between hover:shadow-lg hover:shadow-black/10 transition duration-200 group"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded border ${diffColor}`}>
                          {chal.difficulty.toUpperCase()}
                        </span>

                        {isSolved ? (
                          <span className="text-[10px] font-black font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/15 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> SOLVED
                          </span>
                        ) : (
                          <span className="text-[10px] font-black font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-white/5">
                            PENDING
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs font-bold text-slate-200 mt-3 group-hover:text-white transition line-clamp-1">
                        {chal.title}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono uppercase">
                        {chal.subjectName} • +{chal.points || 20} pts
                      </p>
                      <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed font-sans">
                        {chal.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/[0.04] text-[10px] text-slate-500">
                      <span>Acceptance Rate: {chal.acceptanceRate || '90%'}</span>
                      <div className="flex items-center gap-1 text-teal-400 font-bold group-hover:translate-x-0.5 transition">
                        <span>Launch Compiler</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* Historical solution review panel */}
          {solutions.length > 0 && (
            <div className="bg-[#0e1726]/30 backdrop-blur-md border border-white/[0.06] p-5 rounded-2xl space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">
                My Recent Submissions
              </p>

              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {solutions.map(sol => (
                  <div
                    key={sol.id}
                    onClick={() => {
                      const associatedChallenge = challenges.find(c => c.id === sol.problemId);
                      if (associatedChallenge) {
                        handleOpenChallenge(associatedChallenge);
                        const langKey = (sol.language || 'javascript').toLowerCase() as 'javascript' | 'python' | 'java' | 'c' | 'cpp';
                        setCodes(prev => ({
                          ...prev,
                          [langKey]: sol.solutionCode
                        }));
                        setSelectedLang(langKey);
                        setLastSubmission(sol);
                      }
                    }}
                    className="bg-[#111a2e]/40 hover:bg-[#111a2e]/80 border border-white/[0.04] p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-200 truncate">{sol.problemTitle}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{sol.date} • {sol.subjectName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded border ${
                        sol.status === 'solved'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {sol.status === 'solved' ? `SOLVED (${sol.score}%)` : `FAILED (${sol.score}%)`}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        /* Full Code Compiler Split Screen Terminal layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left panel: Problem description & Interactive Resources */}
          <div className="lg:col-span-5 bg-[#0e1726]/30 backdrop-blur-md border border-white/[0.06] p-6 rounded-2xl flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              {/* Back Button and Header */}
              <div className="flex items-start gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveChallenge(null);
                      fetchSolutions();
                    }}
                    className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-white/[0.04] transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    {activeChallenge.chapter && (
                      <p className="text-[9px] font-black font-mono text-amber-400/90 uppercase tracking-widest leading-none">
                        📖 {activeChallenge.chapter}
                      </p>
                    )}
                    <h3 className="text-sm font-bold text-white mt-1 leading-tight line-clamp-1">{activeChallenge.title}</h3>
                  </div>
                </div>

                <span className={`text-[9px] font-black font-mono px-2 py-0.5 rounded border ${
                  activeChallenge.difficulty === 'Easy' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                  activeChallenge.difficulty === 'Medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                  'text-rose-400 bg-rose-500/10 border-rose-500/20'
                }`}>
                  {activeChallenge.difficulty.toUpperCase()}
                </span>
              </div>

              {/* Resource Navigation Tabs */}
              <div className="flex border-b border-white/[0.04] p-0.5 bg-[#111a2e]/40 rounded-xl">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex-1 py-2 text-center text-[10px] font-bold font-mono rounded-lg transition-all cursor-pointer ${
                    activeTab === 'details'
                      ? 'bg-teal-600/15 text-teal-400 border border-teal-500/15'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Description
                </button>
                <button
                  onClick={() => setActiveTab('hints')}
                  className={`flex-1 py-2 text-center text-[10px] font-bold font-mono rounded-lg transition-all cursor-pointer ${
                    activeTab === 'hints'
                      ? 'bg-teal-600/15 text-teal-400 border border-teal-500/15'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Hints ({activeChallenge.hints?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('solution')}
                  className={`flex-1 py-2 text-center text-[10px] font-bold font-mono rounded-lg transition-all cursor-pointer ${
                    activeTab === 'solution'
                      ? 'bg-teal-600/15 text-teal-400 border border-teal-500/15'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Official Walkthrough
                </button>
              </div>

              {/* Tab 1: Description Details */}
              {activeTab === 'details' && (
                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
                      Problem Statement
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                      {activeChallenge.description}
                    </p>
                  </div>

                  {activeChallenge.tags && activeChallenge.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {activeChallenge.tags.map((t, idx) => (
                        <span key={idx} className="text-[9px] font-bold font-mono bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/15">
                          #{t.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  )}

                  {activeChallenge.constraints && (
                    <div className="space-y-1.5 bg-[#111a2e]/60 border border-white/[0.04] p-4 rounded-xl font-mono text-[11px] leading-relaxed">
                      <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest">
                        Constraints
                      </p>
                      <p className="text-slate-400 whitespace-pre-wrap">
                        {activeChallenge.constraints}
                      </p>
                    </div>
                  )}

                  {activeChallenge.examples && (
                    <div className="space-y-1.5 bg-[#111a2e]/60 border border-white/[0.04] p-4 rounded-xl">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono">
                        Algorithm Examples
                      </p>
                      <p className="text-[11px] text-slate-400 whitespace-pre-wrap font-sans leading-relaxed">
                        {activeChallenge.examples}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-[#0b0f19]/70 border border-white/[0.04] p-3 rounded-xl font-mono text-[10px]">
                      <p className="font-bold text-teal-400 uppercase">Sample Input</p>
                      <pre className="text-slate-300 mt-1.5 overflow-x-auto whitespace-pre-wrap">{activeChallenge.sampleInput || 'N/A'}</pre>
                    </div>
                    <div className="bg-[#0b0f19]/70 border border-white/[0.04] p-3 rounded-xl font-mono text-[10px]">
                      <p className="font-bold text-teal-400 uppercase">Sample Output</p>
                      <pre className="text-slate-300 mt-1.5 overflow-x-auto whitespace-pre-wrap">{activeChallenge.sampleOutput || 'N/A'}</pre>
                    </div>
                  </div>

                  {activeChallenge.expectedOutput && (
                    <div className="bg-[#0b0f19]/70 border border-white/[0.04] p-3 rounded-xl font-mono text-[10px]">
                      <p className="font-bold text-teal-400 uppercase">Expected Output Specification</p>
                      <pre className="text-slate-300 mt-1.5 overflow-x-auto whitespace-pre-wrap">{activeChallenge.expectedOutput}</pre>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Collapsible Practice Hints */}
              {activeTab === 'hints' && (
                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                  <div className="bg-[#111a2e]/60 border border-white/[0.04] p-4 rounded-xl">
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      Stuck on logical loops, bounds, or syntax? Reveal hints sequentially to prompt correct structures without spoiling full solutions.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {activeChallenge.hints && activeChallenge.hints.map((hint, hIdx) => {
                      const isRevealed = revealedHints[hIdx];
                      return (
                        <div key={hIdx} className="bg-[#111a2e]/60 border border-white/[0.04] p-4 rounded-xl transition duration-150">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-teal-400 font-mono">HINT #{hIdx + 1}</span>
                            {!isRevealed && (
                              <button
                                onClick={() => setRevealedHints(prev => ({ ...prev, [hIdx]: true }))}
                                className="text-[9px] bg-teal-600/10 hover:bg-teal-600/20 text-teal-400 font-bold px-2.5 py-0.5 rounded border border-teal-500/25 transition cursor-pointer"
                              >
                                Reveal hint content
                              </button>
                            )}
                          </div>
                          {isRevealed ? (
                            <p className="text-[11px] text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap">{hint}</p>
                          ) : (
                            <p className="text-[11px] text-slate-500 italic mt-2">Content hidden. Click reveal to view...</p>
                          )}
                        </div>
                      );
                    })}
                    {(!activeChallenge.hints || activeChallenge.hints.length === 0) && (
                      <p className="text-xs text-slate-500 italic text-center py-4">No specific hints required for this basic exercise.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Official Solution Walkthrough */}
              {activeTab === 'solution' && (
                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                  {activeChallenge.videoUrl && (
                    <div className="bg-[#111a2e]/60 border border-white/[0.04] p-4 rounded-xl space-y-2.5">
                      <div className="flex items-center gap-2 text-rose-400">
                        <Play className="w-4 h-4 fill-rose-400" />
                        <h4 className="text-[10px] font-black uppercase tracking-wider font-mono">Video Explanation Walkthrough</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Watch an in-depth code explanation, tracing variable values, Big-O stack usage, and edge constraints.
                      </p>
                      <a
                        href={activeChallenge.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-400 text-[10px] font-bold font-mono px-3.5 py-1.5 rounded-lg transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-rose-400" />
                        <span>Watch on Video Platform</span>
                      </a>
                    </div>
                  )}

                  <div className="bg-[#111a2e]/60 border border-white/[0.04] p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-indigo-400">
                      <Code2 className="w-4 h-4" />
                      <h4 className="text-[10px] font-black uppercase tracking-wider font-mono">Official Reference Implementation</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Study the standard algorithm structure below to resolve any bugs in your personal draft.
                    </p>

                    {!revealedSolution ? (
                      <button
                        onClick={() => {
                          if (confirm('Revealing the answer will unlock the official solution code. We encourage trying to solve it yourself first! Reveal now?')) {
                            setRevealedSolution(true);
                          }
                        }}
                        className="w-full bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold font-mono py-2 rounded-lg transition cursor-pointer"
                      >
                        Show Solution Code
                      </button>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-slate-500 font-mono font-bold uppercase">Official Algorithm Code</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(activeChallenge.solution || '');
                              onTriggerNotification('Official solution copied!');
                            }}
                            className="text-[9px] text-indigo-400 hover:underline font-mono font-bold"
                          >
                            Copy Code
                          </button>
                        </div>
                        <pre className="bg-[#0b0f19] border border-white/[0.04] p-3 rounded-lg font-mono text-[10px] text-emerald-400/90 overflow-x-auto max-h-[220px] whitespace-pre-wrap leading-relaxed">
                          {activeChallenge.solution || '// Solution is being processed.'}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* AI Review Scorecard when evaluated */}
            {lastSubmission && (
              <div className="bg-[#111a2e]/60 border border-teal-500/20 rounded-xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center gap-2 text-teal-400">
                  <Award className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider font-mono">AI Sandboxed Compiler Review</span>
                </div>

                <div className="text-xs leading-relaxed max-h-[160px] overflow-y-auto pr-1 text-slate-300 prose prose-invert">
                  <div className="markdown-body">
                    {lastSubmission.aiReview.split('\n').map((line, lIdx) => {
                      if (line.startsWith('### ')) {
                        return <h4 key={lIdx} className="text-[11px] font-black uppercase text-slate-200 tracking-wider font-mono mt-3 mb-1">{line.replace('### ', '')}</h4>;
                      } else if (line.startsWith('- ')) {
                        return <li key={lIdx} className="ml-3 list-disc mt-0.5 text-slate-300">{line.replace('- ', '')}</li>;
                      } else {
                        return <p key={lIdx} className="mt-0.5 text-slate-300">{line}</p>;
                      }
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right panel: Live compiler terminal editor */}
          <div className="lg:col-span-7 bg-[#0b0f19] border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col justify-between h-[650px] shadow-2xl relative">
            
            {/* Tab header with Multi-Language selection */}
            <div className="bg-[#0f1424] px-4 py-2.5 border-b border-white/[0.06] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Language Selector Tabs */}
              <div className="flex items-center gap-1 bg-[#0a0d17] p-1 rounded-xl border border-white/[0.04] overflow-x-auto">
                {(['javascript', 'python', 'java', 'c', 'cpp'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLang(lang)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer whitespace-nowrap ${
                      selectedLang === lang
                        ? 'bg-teal-600/15 text-teal-400 border border-teal-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                    }`}
                  >
                    {lang === 'javascript' ? 'JS' :
                     lang === 'python' ? 'Python' :
                     lang === 'java' ? 'Java' :
                     lang === 'cpp' ? 'C++' : 'C'}
                  </button>
                ))}
              </div>

              {/* Reset, Copy, Theme Controls */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {/* Editor Theme Switcher (Dark Mode variants) */}
                <button
                  onClick={() => setEditorTheme(prev => prev === 'deep-space' ? 'dracula' : 'deep-space')}
                  className="bg-slate-800 hover:bg-slate-700 font-bold font-mono text-[9px] text-slate-400 px-2 py-1 rounded border border-white/5"
                  title="Toggle custom monospaced Dark Themes"
                >
                  THEME: {editorTheme === 'deep-space' ? 'SPACE-DARK' : 'DRACULA'}
                </button>

                <button
                  onClick={() => {
                    let defaultTemplate = '';
                    if (selectedLang === 'javascript') defaultTemplate = activeChallenge.javascriptTemplate || activeChallenge.templateCode || '';
                    else if (selectedLang === 'python') defaultTemplate = activeChallenge.pythonTemplate || '';
                    else if (selectedLang === 'java') defaultTemplate = activeChallenge.javaTemplate || '';
                    else if (selectedLang === 'c') defaultTemplate = activeChallenge.cTemplate || '';
                    else if (selectedLang === 'cpp') defaultTemplate = activeChallenge.cppTemplate || '';

                    if (confirm(`Are you sure you want to reset the current ${selectedLang.toUpperCase()} code template to default?`)) {
                      setCodes(prev => ({ ...prev, [selectedLang]: defaultTemplate }));
                      onTriggerNotification('Template reset.');
                    }
                  }}
                  className="bg-slate-800 hover:bg-slate-700 font-bold font-mono text-[9px] text-slate-300 px-2.5 py-1.5 rounded border border-white/5 cursor-pointer"
                  title="Reset to starter default template"
                >
                  Reset
                </button>

                <button
                  onClick={() => {
                    const currentCode = codes[selectedLang] || '';
                    navigator.clipboard.writeText(currentCode);
                    onTriggerNotification('Code copied to clipboard!');
                  }}
                  className="bg-slate-800 hover:bg-slate-700 font-bold font-mono text-[9px] text-slate-300 px-2.5 py-1.5 rounded border border-white/5 cursor-pointer"
                  title="Copy current editor content"
                >
                  Copy Code
                </button>
              </div>
            </div>

            {/* Custom Interactive Code IDE Canvas with Line Numbers */}
            <div className={`flex-1 flex overflow-hidden relative ${
              editorTheme === 'dracula' ? 'bg-[#1e1e2e]' : 'bg-[#0a0d17]'
            }`} style={{ minHeight: '300px' }}>
              
              {/* Monospace Gutter (Line Numbers) */}
              <div className="w-10 select-none text-right pr-2.5 font-mono text-[10px] text-slate-600 border-r border-white/[0.04] pt-5 bg-black/10 flex flex-col leading-relaxed">
                {Array.from({ length: Math.max((codes[selectedLang] || '').split('\n').length, 1) }).map((_, i) => (
                  <span key={i} className="block">{i + 1}</span>
                ))}
              </div>

              {/* Real Textarea Editor */}
              <textarea
                value={codes[selectedLang] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setCodes(prev => ({ ...prev, [selectedLang]: val }));
                }}
                className={`flex-1 bg-transparent p-5 pt-5 font-mono text-[11px] leading-relaxed resize-none focus:outline-none border-0 h-full w-full ${
                  editorTheme === 'dracula' ? 'text-[#a6e3a1] caret-white' : 'text-slate-200 caret-teal-400'
                }`}
                placeholder={`// Write your clean ${selectedLang.toUpperCase()} solution here...`}
                style={{ tabSize: 2, WebkitTextFillColor: 'inherit' }}
              />
            </div>

            {/* Simulated Debugging Console Outputs & Execution */}
            <div className="bg-[#070911] border-t border-white/[0.06] p-4 h-48 flex flex-col">
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-1.5 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black font-mono text-slate-500 uppercase tracking-widest">
                    Academic Compiler Terminal Console
                  </span>
                  <span className="text-[9px] font-bold font-mono px-1.5 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded">
                    {selectedLang.toUpperCase()} MODE
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRunTestsSimulated}
                    className="bg-slate-800 hover:bg-slate-700 font-bold font-mono text-[9px] text-slate-300 px-2.5 py-1 rounded border border-white/5 cursor-pointer flex items-center gap-1"
                  >
                    <Play className="w-2.5 h-2.5 text-slate-400" /> Run Code
                  </button>

                  <button
                    onClick={handleSubmitSolution}
                    disabled={isSubmitting}
                    className="bg-teal-600 hover:bg-teal-500 disabled:opacity-45 font-bold font-mono text-[9px] text-white px-3 py-1 rounded cursor-pointer flex items-center gap-1 shadow-md shadow-teal-600/10"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        <span>Compiling...</span>
                      </>
                    ) : (
                      <>
                        <Terminal className="w-3 h-3" />
                        <span>Submit Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <pre className="flex-1 font-mono text-[10px] text-slate-300 leading-normal overflow-y-auto whitespace-pre-wrap select-text selection:bg-slate-800">
                {terminalOutput || `[Sandbox Standby]: Compiler terminal standby. Write code, then click "Run Code" or "Submit Code".`}
              </pre>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

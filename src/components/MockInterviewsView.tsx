import React, { useState, useEffect, useRef } from 'react';
import { Subject, MockInterviewSession, User } from '../types';
import { Sparkles, MessageSquare, Plus, Award, ChevronRight, CheckCircle, Brain, Play, Trash2, Send, Loader2, ArrowLeft, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';

interface MockInterviewsViewProps {
  subjects: Subject[];
  onTriggerNotification: (msg: string) => void;
  onRefreshUserStats: () => Promise<void>;
}

export default function MockInterviewsView({ subjects, onTriggerNotification, onRefreshUserStats }: MockInterviewsViewProps) {
  const [sessions, setSessions] = useState<MockInterviewSession[]>([]);
  const [activeSession, setActiveSession] = useState<MockInterviewSession | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [userResponse, setUserResponse] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [xpGainedMessage, setXpGainedMessage] = useState<string | null>(null);
  
  // Voice Assistance state
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<number | null>(null);
  const [autoRead, setAutoRead] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Stop speaking and listening when switching sessions or unmounting
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [activeSession?.id]);

  // Handle Speech Recognition Toggle
  const toggleListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onTriggerNotification('Voice input (Speech Recognition) is not supported in this browser. Please use Chrome or Safari.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript;
          if (resultText) {
            setUserResponse(prev => prev ? prev + ' ' + resultText : resultText);
            onTriggerNotification(`Captured: "${resultText}"`);
          }
        };

        rec.onerror = (e: any) => {
          console.error('Speech recognition error:', e);
          setIsListening(false);
          onTriggerNotification('Voice input failed or timed out. Please try again or type manually.');
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (err) {
        console.error(err);
        setIsListening(false);
      }
    }
  };

  // Handle Text To Speech (TTS)
  const speakText = (text: string, msgIdx: number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      onTriggerNotification('Text-To-Speech is not supported in this browser.');
      return;
    }

    // If already speaking this message, stop it
    if (speakingMsgId === msgIdx) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    // Cancel any existing playback
    window.speechSynthesis.cancel();

    // Clean up text of markdown markers if necessary for a cleaner speech
    const cleanText = text
      .replace(/###/g, '')
      .replace(/\*\*/g, '')
      .replace(/- /g, ', ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Attempt to select a clear English voice if available
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Natural')));
    if (premiumVoice) {
      utterance.voice = premiumVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setSpeakingMsgId(null);
    };

    utterance.onerror = () => {
      setSpeakingMsgId(null);
    };

    setSpeakingMsgId(msgIdx);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Trigger auto-read of new interviewer messages
  useEffect(() => {
    if (!activeSession) return;
    const lastMsgIdx = activeSession.messages.length - 1;
    if (lastMsgIdx >= 0) {
      const lastMsg = activeSession.messages[lastMsgIdx];
      if (lastMsg.role === 'interviewer' && autoRead) {
        // Wait slightly for layout to settle, then read out
        const timer = setTimeout(() => {
          speakText(lastMsg.content, lastMsgIdx);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [activeSession?.messages?.length]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSession?.messages, isSending]);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/interviews');
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      console.error('Error fetching mock interviews:', err);
    }
  };

  const handleStartInterview = async () => {
    if (!selectedSubjectId) {
      onTriggerNotification('Please select a course to start your interview.');
      return;
    }
    const subject = subjects.find(s => s.id === selectedSubjectId);
    if (!subject) return;

    setIsStarting(true);
    setXpGainedMessage(null);
    try {
      const res = await fetch('/api/interviews/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: subject.id,
          subjectName: subject.name
        })
      });
      const data = await res.json();
      setActiveSession(data);
      fetchSessions();
      onTriggerNotification(`Technical Mock Interview started for ${subject.name}!`);
    } catch (err) {
      console.error(err);
      onTriggerNotification('Failed to start interview.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!activeSession || !userResponse.trim() || isSending) return;

    const responseText = userResponse;
    setUserResponse('');
    setIsSending(true);

    try {
      const res = await fetch('/api/interviews/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeSession.id,
          content: responseText
        })
      });
      const data = await res.json();
      setActiveSession(data.session);
      fetchSessions();

      if (data.xpGained > 0) {
        setXpGainedMessage(`🎉 Interview Completed! You scored ${data.session.score}/100 and gained +${data.xpGained} XP!`);
        onRefreshUserStats();
        onTriggerNotification(`Mock Interview scored: ${data.session.score}/100! +${data.xpGained} XP awarded!`);
      }
    } catch (err) {
      console.error(err);
      onTriggerNotification('Error sending message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this interview history?')) return;

    try {
      await fetch(`/api/interviews/${id}`, { method: 'DELETE' });
      if (activeSession?.id === id) {
        setActiveSession(null);
      }
      fetchSessions();
      onTriggerNotification('Interview session deleted.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="mock-interviews-view-root" className="lg:col-span-9 space-y-6">
      
      {/* Premium Display Banner */}
      <div className="bg-gradient-to-r from-[#111c30] to-[#1e1b4b] rounded-2xl p-6 border border-white/[0.06] relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
        <span className="bg-indigo-500/15 text-indigo-400 text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-full border border-indigo-500/25">
          Practice by Techstack
        </span>
        <h1 className="text-2xl font-bold font-display text-white mt-3">Choose Your Mock Interview</h1>
        <p className="text-xs text-slate-400 mt-1.5 max-w-xl leading-relaxed">
          Pick a category, select a focused topic, and start practicing immediately. Each interview is tailored to real-world scenarios and curriculum demands, evaluated in real time by Gemini AI.
        </p>
      </div>

      {xpGainedMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-4 text-xs font-bold text-emerald-400 flex items-center gap-3 animate-pulse">
          <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span>{xpGainedMessage}</span>
        </div>
      )}

      {!activeSession ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Setup / Configuration Panel */}
          <div className="md:col-span-5 bg-[#0e1726]/30 backdrop-blur-md border border-white/[0.06] p-6 rounded-2xl space-y-5">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-black text-slate-200 uppercase tracking-wider font-mono">Launch Session</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-2">
                  Select Course / Subject
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full bg-[#111a2e]/60 border border-white/[0.08] rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
                >
                  <option value="">-- Choose Course --</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleStartInterview}
                disabled={isStarting || !selectedSubjectId}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 font-bold font-display text-xs text-white py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer transition-all"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Spinning up AI Interviewer...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start Mock Interview</span>
                  </>
                )}
              </button>
            </div>

            {/* List of Previous Sessions */}
            <div className="pt-4 border-t border-white/[0.06] space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">
                My Interview History
              </p>

              {sessions.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-[11px]">
                  No past interview attempts yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {sessions.map(sess => (
                    <div
                      key={sess.id}
                      onClick={() => {
                        setActiveSession(sess);
                        setXpGainedMessage(null);
                      }}
                      className="bg-[#111a2e]/40 hover:bg-[#111a2e]/80 border border-white/[0.04] p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-200 truncate">{sess.subjectName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{sess.date} • {sess.messages.length} lines</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {sess.status === 'completed' ? (
                          <span className="text-[10px] font-black font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                            {sess.score}%
                          </span>
                        ) : (
                          <span className="text-[10px] font-black font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse">
                            ACTIVE
                          </span>
                        )}
                        <button
                          onClick={(e) => handleDeleteSession(sess.id, e)}
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

          {/* Interactive Information Panel / Tracks */}
          <div className="md:col-span-7 bg-[#0e1726]/30 backdrop-blur-md border border-white/[0.06] p-6 rounded-2xl flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider font-mono">Available Job & Subject Tracks</h3>
                </div>
                <span className="text-[10px] bg-indigo-500/15 text-indigo-400 font-bold px-2 py-0.5 rounded border border-indigo-500/20">
                  {subjects.length} active courses
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subjects.map(sub => (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSubjectId(sub.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-28 relative overflow-hidden ${
                      selectedSubjectId === sub.id
                        ? 'bg-indigo-600/10 border-indigo-500 shadow-md shadow-indigo-500/5'
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
                      <p className="text-[10px] text-slate-400 mt-1 font-mono uppercase">{sub.difficulty} Tier</p>
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
                <Brain className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-300">How does AI Evaluator work?</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Gemini acts as your senior technical interviewer. It reacts dynamically to your answers, probes into your conceptual loopholes, and calculates an itemized scorecard once completed.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* Full Screen Chat Room & Messenger Flow */
        <div className="bg-[#0e1726]/30 backdrop-blur-md border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col h-[650px] shadow-2xl">
          
          {/* Chat Header */}
          <div className="px-6 py-4 bg-[#111a2e]/80 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveSession(null);
                  fetchSessions();
                }}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-white/[0.04] transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest font-mono">
                  Active Tech Interview
                </h3>
                <h2 className="text-sm font-bold text-white leading-tight">
                  {activeSession.subjectName}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 mr-1">
                <button
                  onClick={() => setAutoRead(!autoRead)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold font-mono transition-all border ${
                    autoRead 
                      ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20' 
                      : 'bg-slate-800/60 text-slate-400 border-white/[0.04]'
                  }`}
                  title="Toggle Auto Read AI Messages aloud"
                >
                  {autoRead ? <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{autoRead ? 'AUTO-VOICE: ON' : 'AUTO-VOICE: OFF'}</span>
                </button>
              </div>

              <span className={`text-[10px] font-black font-mono px-3 py-1.5 rounded-full border ${
                activeSession.status === 'completed'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25 animate-pulse'
              }`}>
                {activeSession.status === 'completed' ? `FINISHED: ${activeSession.score}%` : 'IN PROGRESS'}
              </span>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeSession.messages.map((msg, idx) => {
              const isAI = msg.role === 'interviewer';
              return (
                <div key={idx} className={`flex items-start gap-4.5 ${isAI ? '' : 'flex-row-reverse'}`}>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black border ${
                    isAI
                      ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20'
                      : 'bg-slate-700/30 text-slate-300 border-white/[0.06]'
                  }`}>
                    {isAI ? 'AI' : 'ME'}
                  </div>
                  
                  <div className="space-y-1 max-w-[75%]">
                    <div className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                      isAI
                        ? 'bg-[#111a2e]/70 border border-white/[0.04] text-slate-200 rounded-tl-none'
                        : 'bg-indigo-600 text-white rounded-tr-none border border-indigo-500/10'
                    }`}>
                      {msg.content}
                    </div>
                    <div className={`flex items-center gap-2 mt-0.5 text-[9px] text-slate-500 px-1 ${isAI ? 'justify-start' : 'justify-end'}`}>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isAI && (
                        <button
                          onClick={() => speakText(msg.content, idx)}
                          className={`flex items-center gap-1 hover:text-indigo-400 font-mono font-bold transition-colors ${
                            speakingMsgId === idx ? 'text-indigo-400' : ''
                          }`}
                          title={speakingMsgId === idx ? 'Stop playing voice' : 'Listen to response'}
                        >
                          {speakingMsgId === idx ? (
                            <>
                              <VolumeX className="w-3 h-3 text-rose-400 animate-pulse" />
                              <span className="text-rose-400">Stop Reading</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3" />
                              <span>Listen Voice</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-start gap-4.5">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
                  AI
                </div>
                <div className="bg-[#111a2e]/70 border border-white/[0.04] p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span className="text-xs text-slate-400 font-mono">Analyzing and generating follow-up...</span>
                </div>
              </div>
            )}

            {activeSession.status === 'completed' && activeSession.feedback && (
              <div className="bg-[#111a2e]/50 border border-indigo-500/20 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Award className="w-5 h-5" />
                  <h4 className="text-xs font-black uppercase tracking-wider font-mono">Official Scorecard & AI Review</h4>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="bg-[#0e1726]/40 border border-white/[0.06] rounded-xl p-4 text-center min-w-28">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Accuracy Rating</p>
                    <p className="text-3xl font-black text-indigo-400 font-display mt-1">{activeSession.score}%</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">Interview Evaluation Completed</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-lg leading-relaxed">
                      Below is the final report compiled by your AI Interview Tutor. Gaps have been summarized into topics that will automatically sync with your Weak Topics lists on the main scheduler dashboards!
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/[0.06] pt-4 text-slate-300 text-xs leading-relaxed prose prose-invert max-w-none">
                  <div className="markdown-body">
                    {activeSession.feedback.split('\n').map((line, lIdx) => {
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

            <div ref={messagesEndRef} />
          </div>

          {/* Interactive Chat Input or Completed Back-button */}
          {activeSession.status === 'active' ? (
            <div className="p-4 bg-[#111a2e]/80 border-t border-white/[0.06]">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={userResponse}
                    onChange={(e) => setUserResponse(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                    disabled={isSending}
                    placeholder={isListening ? "Listening... Speak now!" : "Type or speak your reply to the interviewer..."}
                    className="flex-1 bg-[#0e1726]/60 border border-white/[0.08] text-xs text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={isSending}
                    className={`p-3 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer transition-all border ${
                      isListening
                        ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border-rose-500/30 animate-pulse'
                        : 'bg-[#0e1726]/60 hover:bg-[#0e1726]/90 text-indigo-400 border-white/[0.08]'
                    }`}
                    title={isListening ? 'Listening... Click to Stop' : 'Dictate your answer (Voice Assistance)'}
                  >
                    {isListening ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!userResponse.trim() || isSending}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-45 text-white p-3 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                {isListening && (
                  <p className="text-[10px] text-rose-400 font-bold font-mono animate-pulse px-1">
                    ● Speech-To-Text Active: Speak clearly. The system will auto-capture your voice input.
                  </p>
                )}
                {!isListening && (
                  <p className="text-[10px] text-slate-500 px-1 font-mono flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Voice Assistance Ready: Click the microphone to dictate, or click 'Listen Voice' on AI cards.</span>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[#111a2e]/80 border-t border-white/[0.06] text-center">
              <button
                onClick={() => {
                  setActiveSession(null);
                  fetchSessions();
                }}
                className="bg-slate-700 hover:bg-slate-600 font-bold font-display text-xs text-white px-6 py-2.5 rounded-xl cursor-pointer transition"
              >
                Back to Interview Tracks
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

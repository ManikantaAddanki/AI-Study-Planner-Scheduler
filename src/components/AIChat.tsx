import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, BrainCircuit } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I am **StudyBuddy**, your AI academic advisor. I know your enrolled subjects and tasks. Ask me to plan your day, explain a difficult topic, or help you prepare for an upcoming exam!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    if (!customText) {
      setInput('');
    }

    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      text: textToSend.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const chatPayload = [...messages, userMsg].map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatPayload }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Server connection failed');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-ai`,
          role: 'model',
          text: data.text,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-ai-err`,
          role: 'model',
          text: "I'm having trouble connecting to the brain servers. Let's study DBMS Normalization or Python Decorators! Ask me details.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestionChips = [
    'What should I study today?',
    "I'm weak in DBMS, help!",
    'I have an exam tomorrow',
    'Give me a study motivation quote!',
  ];

  return (
    <div className="bg-[#0e1726]/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl flex flex-col h-[550px] max-w-2xl mx-auto">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-md">
            <BrainCircuit className="w-5 h-5 text-indigo-100" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 font-display">
              StudyBuddy AI Coach <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
            </h2>
            <p className="text-[9px] text-emerald-400 font-bold font-mono uppercase tracking-wider">Online & Academic Advisor</p>
          </div>
        </div>
      </div>

      {/* Messages Canvas */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin">
        {messages.map((m) => {
          const isAI = m.role === 'model';
          return (
            <div
              key={m.id}
              className={`flex gap-3 max-w-[85%] ${isAI ? 'self-start' : 'self-end ml-auto flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm ${
                  isAI ? 'bg-gradient-to-tr from-indigo-600 to-indigo-800' : 'bg-gradient-to-tr from-amber-500 to-rose-500'
                }`}
              >
                {isAI ? <Bot className="w-4 h-4 text-indigo-100" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Box */}
              <div
                className={`p-3.5 rounded-2xl text-[11px] leading-relaxed whitespace-pre-line border font-sans ${
                  isAI
                    ? 'bg-slate-950/20 border-white/[0.04] text-slate-200'
                    : 'bg-indigo-600 border-indigo-500 text-white shadow-md font-medium'
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-[80%] self-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-800 flex items-center justify-center text-white shrink-0">
              <Bot className="w-4 h-4 text-indigo-100" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/10 border border-white/[0.04] text-slate-400 text-[11px] flex items-center gap-2 font-mono">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="font-bold">Formulating advice...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length < 3 && !loading && (
        <div className="flex flex-wrap gap-2 py-3 border-t border-white/[0.04] shrink-0 font-mono">
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/15 hover:border-indigo-500/30 text-indigo-300 text-[9px] px-3 py-1.5 rounded-md transition font-bold uppercase tracking-wider cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Inputs panel */}
      <div className="flex gap-2.5 pt-3 border-t border-white/[0.06] shrink-0">
        <input
          type="text"
          placeholder="Ask StudyBuddy anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          className="w-full bg-slate-950/40 border border-white/[0.08] rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition duration-150"
        />
        <button
          id="chat-send-btn"
          onClick={() => handleSendMessage()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-xl text-xs font-semibold transition flex items-center justify-center shadow shadow-indigo-600/10 cursor-pointer active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

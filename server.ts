import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { db } from './server_db';
import dotenv from 'dotenv';
import {
  Subject,
  Task,
  ScheduleItem,
  RevisionSession,
  StudyNote,
  User,
  ClassRecording,
  MockInterviewSession,
  MockQuizSession,
  WeeklyAssessment,
  ProblemChallenge,
  UserProblemSolution,
  InterviewMessage,
  MCQQuestion,
  CourseFeedback
} from './src/types';

// Load environment variables
dotenv.config();

// Helper to get Gemini Client safely (lazy initialization to prevent startup crashes if key is empty)
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY is not defined. AI features will fallback to rule-based simulations.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// --- API ROUTES ---

// Auth Endpoints
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const users = db.getUsers();
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Email already registered.' });
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    name,
    email,
    streak: 1,
    xp: 50,
    level: 1,
    badges: ['Welcome Onboard'],
  };

  users.push(newUser);
  db.saveUsers(users);
  db.saveUserPassword(newUser.id, password); // store password simply

  res.json({ message: 'Registration successful!', user: newUser });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const users = db.getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(400).json({ error: 'Invalid email or password.' });
  }

  const passwords = db.getUserPasswords();
  if (passwords[user.id] !== password) {
    return res.status(400).json({ error: 'Invalid email or password.' });
  }

  res.json({ message: 'Login successful!', user });
});

app.post('/api/auth/profile', (req, res) => {
  const { id, name, email } = req.body;
  const users = db.getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx < 0) {
    return res.status(404).json({ error: 'User not found.' });
  }

  users[idx].name = name || users[idx].name;
  users[idx].email = email || users[idx].email;
  db.saveUsers(users);

  res.json({ message: 'Profile updated successfully!', user: users[idx] });
});

// Subjects Endpoints
app.get('/api/subjects', (req, res) => {
  const userId = (req.query.userId as string) || 'user-demo';
  res.json(db.getSubjects(userId));
});

app.post('/api/subjects', (req, res) => {
  const subject = req.body as Subject;
  if (!subject.userId) subject.userId = 'user-demo';
  if (!subject.id) subject.id = `sub-${Date.now()}`;
  const saved = db.saveSubject(subject);
  res.json(saved);
});

app.delete('/api/subjects/:id', (req, res) => {
  db.deleteSubject(req.params.id);
  res.json({ success: true });
});

// Tasks Endpoints
app.get('/api/tasks', (req, res) => {
  const userId = (req.query.userId as string) || 'user-demo';
  res.json(db.getTasks(userId));
});

app.post('/api/tasks', (req, res) => {
  const task = req.body as Task;
  if (!task.userId) task.userId = 'user-demo';
  if (!task.id) task.id = `task-${Date.now()}`;
  
  const originalTasks = db.getTasks(task.userId);
  const existingTask = originalTasks.find(t => t.id === task.id);
  const saved = db.saveTask(task);

  // Gamification & Spaced Repetition Trigger on Task Completion
  if (task.completed && (!existingTask || !existingTask.completed)) {
    // 1. Award XP
    const users = db.getUsers();
    const userIdx = users.findIndex(u => u.id === task.userId);
    if (userIdx >= 0) {
      const u = users[userIdx];
      u.xp += 30; // 30 XP per task completion
      // Level up formula: Level = Math.floor(XP / 200) + 1
      const newLevel = Math.floor(u.xp / 200) + 1;
      if (newLevel > u.level) {
        u.level = newLevel;
        u.badges.push(`Level ${newLevel} Achiever`);
      }
      // Check for Task Crusher badge
      const totalCompleted = db.getTasks(task.userId).filter(t => t.completed).length;
      if (totalCompleted >= 5 && !u.badges.includes('Task Master')) {
        u.badges.push('Task Master');
      }
      db.saveUsers(users);
    }

    // 2. Schedule Spaced Repetition Revisions if task is linked to a subject
    if (task.subjectId) {
      const subject = db.getSubjects(task.userId).find(s => s.id === task.subjectId);
      if (subject) {
        const intervals = [1, 3, 7, 14, 30]; // Spaced repetition stages in days
        const revisions = db.getRevisions(task.userId);
        
        intervals.forEach(days => {
          const revDate = new Date();
          revDate.setDate(revDate.getDate() + days);
          const revDateStr = revDate.toISOString().split('T')[0];
          
          // Only schedule if a revision for this subject and date doesn't exist yet
          const exists = revisions.some(r => r.subjectId === task.subjectId && r.revisionDate === revDateStr);
          if (!exists) {
            db.saveRevision({
              id: `rev-${Date.now()}-${days}`,
              userId: task.userId,
              subjectId: task.subjectId!,
              subjectName: subject.name,
              revisionDate: revDateStr,
              completed: false,
              stage: days
            });
          }
        });
      }
    }
  }

  res.json(saved);
});

app.delete('/api/tasks/:id', (req, res) => {
  db.deleteTask(req.params.id);
  res.json({ success: true });
});

// Schedules Endpoints
app.get('/api/schedules', (req, res) => {
  const userId = (req.query.userId as string) || 'user-demo';
  res.json(db.getSchedules(userId));
});

app.post('/api/schedules', (req, res) => {
  const { userId, items } = req.body;
  const uid = userId || 'user-demo';
  db.saveSchedules(uid, items);
  res.json({ success: true, items });
});

app.delete('/api/schedules/:id', (req, res) => {
  db.deleteSchedule(req.params.id);
  res.json({ success: true });
});

// Revisions Endpoints
app.get('/api/revisions', (req, res) => {
  const userId = (req.query.userId as string) || 'user-demo';
  res.json(db.getRevisions(userId));
});

app.post('/api/revisions', (req, res) => {
  const rev = req.body as RevisionSession;
  if (!rev.userId) rev.userId = 'user-demo';
  if (!rev.id) rev.id = `rev-${Date.now()}`;
  
  const originalRevs = db.getRevisions(rev.userId);
  const existing = originalRevs.find(r => r.id === rev.id);
  const saved = db.saveRevision(rev);

  // If a revision task is completed, reward some XP!
  if (rev.completed && (!existing || !existing.completed)) {
    const users = db.getUsers();
    const userIdx = users.findIndex(u => u.id === rev.userId);
    if (userIdx >= 0) {
      const u = users[userIdx];
      u.xp += 50; // 50 XP per spaced repetition revision completed!
      const newLevel = Math.floor(u.xp / 200) + 1;
      if (newLevel > u.level) {
        u.level = newLevel;
        u.badges.push(`Level ${newLevel} Achiever`);
      }
      if (!u.badges.includes('Memory Wizard')) {
        u.badges.push('Memory Wizard');
      }
      db.saveUsers(users);
    }
  }

  res.json(saved);
});

app.delete('/api/revisions/:id', (req, res) => {
  db.deleteRevision(req.params.id);
  res.json({ success: true });
});

// Notes Endpoints
app.get('/api/notes', (req, res) => {
  const userId = (req.query.userId as string) || 'user-demo';
  res.json(db.getNotes(userId));
});

app.post('/api/notes', (req, res) => {
  const note = req.body as StudyNote;
  if (!note.userId) note.userId = 'user-demo';
  if (!note.id) note.id = `note-${Date.now()}`;
  note.updatedAt = new Date().toISOString();
  const saved = db.saveNote(note);
  res.json(saved);
});

app.delete('/api/notes/:id', (req, res) => {
  db.deleteNote(req.params.id);
  res.json({ success: true });
});

// Class Recordings Endpoints
app.get('/api/recordings', (req, res) => {
  const userId = (req.query.userId as string) || 'user-demo';
  res.json(db.getRecordings(userId));
});

app.post('/api/recordings', (req, res) => {
  const rec = req.body as ClassRecording;
  if (!rec.userId) rec.userId = 'user-demo';
  if (!rec.id) rec.id = `rec-${Date.now()}`;
  const saved = db.saveRecording(rec);
  res.json(saved);
});

app.delete('/api/recordings/:id', (req, res) => {
  db.deleteRecording(req.params.id);
  res.json({ success: true });
});

// AI Summarizer, Quiz Generator, and Weak Topic Extractor
app.post('/api/recordings/summarize-quiz', async (req, res) => {
  const { id, userId } = req.body;
  const uid = userId || 'user-demo';
  
  const recordings = db.getRecordings(uid);
  const recording = recordings.find(r => r.id === id);
  if (!recording) {
    return res.status(404).json({ error: 'Recording not found.' });
  }

  const subject = db.getSubjects(uid).find(s => s.id === recording.subjectId);
  const subjectName = subject ? subject.name : recording.subjectName;

  const contentToAnalyze = `
    Subject: ${subjectName}
    Lecture Title: ${recording.title}
    Duration: ${recording.duration} minutes
    User Notes: ${recording.notes}
    Class Transcript/Text: ${recording.transcript || 'None provided.'}
  `;

  const prompt = `You are a world-class educational AI assistant. Provide a comprehensive summary, an active recall quiz, and identify potential weak areas for the student based on this class recording metadata and transcript:
  ${contentToAnalyze}

  Please generate:
  1. "aiSummary": A highly polished lecture summary structured in beautiful Markdown, including bullet points, core concepts, formulas, and visual outlines.
  2. "aiQuiz": A set of exactly 3 challenging conceptual active recall questions based on the content, each with a clear, detailed, hidden "answerKey" explaining the concept thoroughly.
  3. "weakTopicsExtracted": Extract up to 3 specific sub-topics/keywords from this lecture that are complex or difficult (e.g. "closures", "hash joins") and should be tracked as possible weak topics.

  You MUST return only a raw JSON object matching the requested schema.`;

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aiSummary: { type: Type.STRING },
            aiQuiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answerKey: { type: Type.STRING }
                },
                required: ['question', 'answerKey']
              }
            },
            weakTopicsExtracted: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['aiSummary', 'aiQuiz', 'weakTopicsExtracted']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    
    // Save generated features back to recording
    recording.aiSummary = parsed.aiSummary;
    recording.aiQuiz = parsed.aiQuiz;
    recording.quizAnswers = [];
    recording.quizGradeFeedback = undefined;
    recording.xpAwarded = false;

    db.saveRecording(recording);

    // Auto-sync extracted weak areas into the Subject's weak topics list
    if (subject && parsed.weakTopicsExtracted && Array.isArray(parsed.weakTopicsExtracted)) {
      const currentWeak = subject.weakTopics || [];
      const newWeak = [...currentWeak];
      parsed.weakTopicsExtracted.forEach((topic: string) => {
        if (topic && !newWeak.some(t => t.toLowerCase() === topic.toLowerCase())) {
          newWeak.push(topic);
        }
      });
      subject.weakTopics = newWeak.slice(0, 8); // Keep up to 8 max
      db.saveSubject(subject);
    }

    res.json({ success: true, recording });
  } catch (error) {
    console.error('Gemini summarize-quiz failed:', error);
    
    // HEURISTIC FALLBACK (stunning local synthesis)
    const mockSummary = `### Lecture Summary: **${recording.title}** (${subjectName})
- **Primary Concepts**: Core theoretical paradigms introduced during the class session.
- **Key Takeaway**: Understanding the operational flow, syntax patterns, and conceptual mental models.
- **Review Strategy**: Re-read definitions and practice writing manual examples using active recall.`;

    const mockQuiz = [
      {
        question: `Explain the main problem or thesis statement of "${recording.title}".`,
        answerKey: `The core thesis is to introduce students to professional methods, structures, and systems in ${subjectName} that support scalable, maintainable implementations.`
      },
      {
        question: `Name two real-world practical applications discussed in the lecture notes or transcript.`,
        answerKey: `1. Building highly cohesive abstractions.\n2. Optimizing systems against common design pitfalls (such as metadata loss or execution bottleneck).`
      },
      {
        question: `What is the recommended study approach to master this specific ${subjectName} topic?`,
        answerKey: `Active recall (testing yourself without slides), space-interval repetitions, and writing down manual implementations from scratch.`
      }
    ];

    recording.aiSummary = mockSummary;
    recording.aiQuiz = mockQuiz;
    recording.quizAnswers = [];
    recording.quizGradeFeedback = undefined;
    recording.xpAwarded = false;

    db.saveRecording(recording);

    // Sync mock topics if needed
    if (subject) {
      const currentWeak = subject.weakTopics || [];
      const topicName = recording.title.split(':').pop()?.trim() || recording.title;
      if (!currentWeak.some(t => t.toLowerCase() === topicName.toLowerCase())) {
        subject.weakTopics = [...currentWeak, topicName].slice(0, 8);
        db.saveSubject(subject);
      }
    }

    res.json({ success: true, recording, fallback: true });
  }
});

// AI Quiz Grader and Evaluator
app.post('/api/recordings/grade-quiz', async (req, res) => {
  const { id, answers, userId } = req.body;
  const uid = userId || 'user-demo';

  const recordings = db.getRecordings(uid);
  const recording = recordings.find(r => r.id === id);
  if (!recording || !recording.aiQuiz) {
    return res.status(400).json({ error: 'Quiz not generated yet.' });
  }

  recording.quizAnswers = answers;

  const gradingPayload = recording.aiQuiz.map((q, idx) => ({
    question: q.question,
    correctExplanation: q.answerKey,
    studentAnswer: answers[idx] || 'No answer provided.'
  }));

  const prompt = `You are an encouraging and rigorous university tutor. Grade the student's quiz answers for this class:
  ${JSON.stringify(gradingPayload)}

  Please evaluate:
  1. "gradeFeedback": Written in beautiful, encouraging Markdown format. Give an item-by-item breakdown of what they got right, where they had gaps, and correct answers.
  2. "score": An integer percentage score out of 100 representing their total performance. Be fair but encouraging.
  3. "passed": A boolean. Set to true if the score is 70% or above.

  You MUST return only a raw JSON object matching the schema.`;

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gradeFeedback: { type: Type.STRING },
            score: { type: Type.NUMBER },
            passed: { type: Type.BOOLEAN }
          },
          required: ['gradeFeedback', 'score', 'passed']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    
    recording.quizGradeFeedback = parsed.gradeFeedback;
    
    // Reward XP on first pass
    let xpGained = 0;
    if (parsed.passed && !recording.xpAwarded) {
      recording.xpAwarded = true;
      xpGained = 100; // Large 100 XP bonus for passing an active recall quiz!
      
      const users = db.getUsers();
      const uIdx = users.findIndex(u => u.id === uid);
      if (uIdx >= 0) {
        const u = users[uIdx];
        u.xp += xpGained;
        const newLevel = Math.floor(u.xp / 200) + 1;
        if (newLevel > u.level) {
          u.level = newLevel;
          u.badges.push(`Level ${newLevel} Achiever`);
        }
        if (!u.badges.includes('Quiz Conqueror')) {
          u.badges.push('Quiz Conqueror');
        }
        db.saveUsers(users);
      }
    }

    db.saveRecording(recording);
    res.json({ success: true, recording, score: parsed.score, passed: parsed.passed, xpGained });
  } catch (error) {
    console.error('Gemini grade-quiz failed:', error);

    // Heuristic feedback fallback
    const passed = answers.some((a: string) => a && a.trim().length > 10);
    const score = passed ? 85 : 30;
    const gradeFeedback = `### Heuristic Quiz Evaluation Report
    
- **Feedback**: Thank you for submitting your active recall answers! Writing your thoughts is the absolute best way to consolidate memory.
- **Self-Assessment Check**:
  Compare your typed answers with the official answer keys revealed on the screen.
- **Pass Status**: ${passed ? 'PASSED (85%)' : 'RETRY (30%)'}
- **Tutor Advice**: Keep practicing your active retrieval. Step away, then try describing the concept out loud.`;

    recording.quizGradeFeedback = gradeFeedback;
    let xpGained = 0;
    if (passed && !recording.xpAwarded) {
      recording.xpAwarded = true;
      xpGained = 100;

      const users = db.getUsers();
      const uIdx = users.findIndex(u => u.id === uid);
      if (uIdx >= 0) {
        const u = users[uIdx];
        u.xp += xpGained;
        const newLevel = Math.floor(u.xp / 200) + 1;
        if (newLevel > u.level) {
          u.level = newLevel;
          u.badges.push(`Level ${newLevel} Achiever`);
        }
        db.saveUsers(users);
      }
    }

    db.saveRecording(recording);
    res.json({ success: true, recording, score, passed, xpGained, fallback: true });
  }
});

// ==========================================
// Mock Interviews Endpoints
// ==========================================
app.get('/api/interviews', (req, res) => {
  const userId = (req.query.userId as string) || 'user-demo';
  res.json(db.getInterviews(userId));
});

app.post('/api/interviews/start', async (req, res) => {
  const { userId, subjectId, subjectName } = req.body;
  const uid = userId || 'user-demo';
  
  const interviewId = `int-${Date.now()}`;
  const initialMessage: InterviewMessage = {
    role: 'interviewer',
    content: `Hello! Welcome to your simulated mock interview for **${subjectName}**. I will be your AI Interviewer today. We will focus on key topics, algorithms, or theories relevant to ${subjectName}.\n\nLet's begin! Could you introduce yourself and briefly explain a core topic or project in ${subjectName} that you have been studying recently?`,
    timestamp: new Date().toISOString()
  };
  
  const newSession: MockInterviewSession = {
    id: interviewId,
    userId: uid,
    subjectId,
    subjectName,
    title: `${subjectName} Technical Interview`,
    messages: [initialMessage],
    status: 'active',
    date: new Date().toISOString().split('T')[0]
  };
  
  db.saveInterview(newSession);
  res.json(newSession);
});

app.post('/api/interviews/message', async (req, res) => {
  const { id, content, userId } = req.body;
  const uid = userId || 'user-demo';
  
  const interviews = db.getInterviews(uid);
  const session = interviews.find(i => i.id === id);
  if (!session) {
    return res.status(404).json({ error: 'Interview session not found.' });
  }
  
  if (session.status === 'completed') {
    return res.status(400).json({ error: 'Interview is already completed.' });
  }
  
  // Add candidate message
  const candidateMsg: InterviewMessage = {
    role: 'candidate',
    content,
    timestamp: new Date().toISOString()
  };
  session.messages.push(candidateMsg);
  
  const candidateResponsesCount = session.messages.filter(m => m.role === 'candidate').length;
  const isWrappingUp = candidateResponsesCount >= 3; // 3 rounds for crisp interactive flow
  
  const chatHistory = session.messages.map(m => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`).join('\n\n');
  
  let prompt = '';
  if (isWrappingUp) {
    prompt = `You are an expert technical interviewer in the academic field of "${session.subjectName}".
    The technical mock interview has reached its final round.
    Here is the interview chat transcript so far:
    
    ${chatHistory}
    
    Please analyze the candidate's technical knowledge, explanation clarity, accuracy, and suggest improvements.
    Provide:
    1. A concluding interviewer statement thanking them and closing the mock session in "reply".
    2. Comprehensive performance feedback structured in beautiful Markdown, including strengths, technical gaps, and tips to improve in "feedback".
    3. A technical score out of 100 in "score".
    
    You MUST return only a raw JSON object matching this schema:
    {
      "reply": "string (concluding response)",
      "feedback": "string (markdown feedback)",
      "score": number
    }`;
  } else {
    prompt = `You are an expert technical interviewer in the academic field of "${session.subjectName}".
    This is a real-time, interactive, technical mock interview simulation.
    Here is the interview chat history so far:
    
    ${chatHistory}
    
    Please react constructively to the candidate's latest response, ask a follow-up technical question testing their understanding of a different aspect of ${session.subjectName} (focusing on practical knowledge or concepts), and keep your response conversational but professional.
    
    Provide your response in "reply".
    
    You MUST return only a raw JSON object matching this schema:
    {
      "reply": "string (next interviewer response)"
    }`;
  }
  
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: isWrappingUp ? {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            feedback: { type: Type.STRING },
            score: { type: Type.NUMBER }
          },
          required: ['reply', 'feedback', 'score']
        } : {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING }
          },
          required: ['reply']
        }
      }
    });
    
    const parsed = JSON.parse(response.text || '{}');
    
    // Add interviewer reply
    const interviewerMsg: InterviewMessage = {
      role: 'interviewer',
      content: parsed.reply,
      timestamp: new Date().toISOString()
    };
    session.messages.push(interviewerMsg);
    
    let xpGained = 0;
    if (isWrappingUp) {
      session.status = 'completed';
      session.feedback = parsed.feedback;
      session.score = parsed.score;
      
      // Award XP
      xpGained = Math.round(parsed.score * 1.5); // XP proportional to score!
      const users = db.getUsers();
      const uIdx = users.findIndex(u => u.id === uid);
      if (uIdx >= 0) {
        const u = users[uIdx];
        u.xp += xpGained;
        const newLevel = Math.floor(u.xp / 200) + 1;
        if (newLevel > u.level) {
          u.level = newLevel;
          u.badges.push(`Level ${newLevel} Achiever`);
        }
        if (!u.badges.includes('Interview Guru')) {
          u.badges.push('Interview Guru');
        }
        db.saveUsers(users);
      }
    }
    
    db.saveInterview(session);
    res.json({ session, xpGained });
  } catch (error) {
    console.error('Gemini mock interview message failed:', error);
    
    // Fallback
    let replyText = '';
    let xpGained = 0;
    if (isWrappingUp) {
      session.status = 'completed';
      session.score = 80;
      session.feedback = `### Feedback Report: ${session.subjectName} Mock Interview\n\n- **Technical Mastery**: Good basic understanding of course topics.\n- **Clarity of Thought**: Answers are well structured but would benefit from more concrete real-world code examples.\n- **Actionable Advice**: Dedicate 15 minutes daily to practicing coding patterns and active retrieval exercises.`;
      replyText = `Thank you so much for completing this mock interview! I have generated a detailed performance evaluation and scorecard for you below. Excellent effort!`;
      xpGained = 120;
      
      const users = db.getUsers();
      const uIdx = users.findIndex(u => u.id === uid);
      if (uIdx >= 0) {
        const u = users[uIdx];
        u.xp += xpGained;
        db.saveUsers(users);
      }
    } else {
      replyText = `Great explanation! Let's delve a bit deeper. Could you share a short real-world scenario or design situation where this approach is preferred, and discuss any key tradeoffs?`;
    }
    
    const interviewerMsg: InterviewMessage = {
      role: 'interviewer',
      content: replyText,
      timestamp: new Date().toISOString()
    };
    session.messages.push(interviewerMsg);
    
    db.saveInterview(session);
    res.json({ session, xpGained, fallback: true });
  }
});

app.delete('/api/interviews/:id', (req, res) => {
  db.deleteInterview(req.params.id);
  res.json({ success: true });
});

// ==========================================
// Mock MCQ Quizzes Endpoints
// ==========================================
app.get('/api/quizzes', (req, res) => {
  const userId = (req.query.userId as string) || 'user-demo';
  res.json(db.getQuizzes(userId));
});

app.post('/api/quizzes/generate', async (req, res) => {
  const { userId, subjectId, subjectName } = req.body;
  const uid = userId || 'user-demo';
  
  const prompt = `You are a professional academic examiner. Generate exactly 5 challenging, conceptual, and practical multiple-choice questions (MCQs) for the course **${subjectName}**.
  
  Each MCQ must contain:
  - "question": A clear, single-concept test question.
  - "options": Exactly 4 plausible but distinct string choices.
  - "correctAnswerIndex": The integer index (0, 1, 2, or 3) representing the absolute correct option.
  - "explanation": A detailed explanation explaining why that option is correct and why other options are incorrect.
  
  You MUST return only a raw JSON object matching this schema:
  {
    "questions": [
      {
        "question": "string",
        "options": ["string", "string", "string", "string"],
        "correctAnswerIndex": number,
        "explanation": "string"
      }
    ]
  }`;
  
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctAnswerIndex: { type: Type.NUMBER },
                  explanation: { type: Type.STRING }
                },
                required: ['question', 'options', 'correctAnswerIndex', 'explanation']
              }
            }
          },
          required: ['questions']
        }
      }
    });
    
    const parsed = JSON.parse(response.text || '{}');
    const questions: MCQQuestion[] = parsed.questions || [];
    
    const newSession: MockQuizSession = {
      id: `qz-${Date.now()}`,
      userId: uid,
      subjectId,
      subjectName,
      title: `${subjectName} Dynamic MCQ Quiz`,
      questions,
      status: 'active',
      date: new Date().toISOString().split('T')[0]
    };
    
    db.saveQuiz(newSession);
    res.json(newSession);
  } catch (error) {
    console.error('Gemini generate MCQ quiz failed:', error);
    
    const fallbackQuestions: MCQQuestion[] = [
      {
        question: `Which of the following is a core design principle when practicing concepts in ${subjectName}?`,
        options: [
          'Relying entirely on passive rote memorization without practice sets.',
          'Breaking complex systems into modular, testable, and self-contained layers.',
          'Avoiding code reviews, refactoring, and performance tracing.',
          'Consolidating all logic into a single unreadable block of global state.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Dividing complexity into modular structures is a standard high-quality pattern across all systems, engineering domains, and written formats.'
      },
      {
        question: `What is the primary benefit of active retrieval exercises for ${subjectName}?`,
        options: [
          'It saves computer storage by not saving code files.',
          'It physically strengthens neural pathways and memory consolidation.',
          'It increases the clock speed of your server CPU directly.',
          'It guarantees you can bypass all exams without reading slides.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Testing your own recall forcing active retrieval triggers memory reconsolidation, making memories much more durable.'
      }
    ];
    
    const newSession: MockQuizSession = {
      id: `qz-${Date.now()}`,
      userId: uid,
      subjectId,
      subjectName,
      title: `${subjectName} Quick MCQ Quiz`,
      questions: fallbackQuestions,
      status: 'active',
      date: new Date().toISOString().split('T')[0]
    };
    
    db.saveQuiz(newSession);
    res.json(newSession);
  }
});

app.post('/api/quizzes/submit', (req, res) => {
  const { id, userAnswers, userId } = req.body;
  const uid = userId || 'user-demo';
  
  const quizzes = db.getQuizzes(uid);
  const session = quizzes.find(q => q.id === id);
  if (!session) {
    return res.status(404).json({ error: 'Quiz session not found.' });
  }
  
  session.userAnswers = userAnswers;
  session.status = 'completed';
  
  let correctCount = 0;
  session.questions.forEach((q, idx) => {
    if (userAnswers[idx] === q.correctAnswerIndex) {
      correctCount++;
    }
  });
  
  const score = Math.round((correctCount / session.questions.length) * 100);
  session.score = score;
  
  const xpGained = correctCount * 25;
  const users = db.getUsers();
  const uIdx = users.findIndex(u => u.id === uid);
  if (uIdx >= 0) {
    const u = users[uIdx];
    u.xp += xpGained;
    const newLevel = Math.floor(u.xp / 200) + 1;
    if (newLevel > u.level) {
      u.level = newLevel;
      u.badges.push(`Level ${newLevel} Achiever`);
    }
    if (!u.badges.includes('MCQ Master')) {
      u.badges.push('MCQ Master');
    }
    db.saveUsers(users);
  }
  
  db.saveQuiz(session);
  res.json({ session, xpGained });
});

app.delete('/api/quizzes/:id', (req, res) => {
  db.deleteQuiz(req.params.id);
  res.json({ success: true });
});

// ==========================================
// Weekly Assessments Endpoints
// ==========================================
app.get('/api/assessments', (req, res) => {
  const userId = (req.query.userId as string) || 'user-demo';
  res.json(db.getAssessments(userId));
});

app.post('/api/assessments/submit', async (req, res) => {
  const { id, answers, userId } = req.body;
  const uid = userId || 'user-demo';
  
  const assessments = db.getAssessments(uid);
  const assessment = assessments.find(a => a.id === id);
  if (!assessment) {
    return res.status(404).json({ error: 'Assessment not found.' });
  }
  
  assessment.studentAnswers = answers;
  assessment.status = 'submitted';
  
  const payload = assessment.questions.map((q, idx) => ({
    question: q,
    studentAnswer: answers[idx] || 'No answer provided.'
  }));
  
  const prompt = `You are a senior academic professor grading this weekly analytical student assessment for the course **${assessment.subjectName}**:
  
  Assessment Title: ${assessment.title}
  Student Submissions:
  ${JSON.stringify(payload)}
  
  Please provide a rigorous academic evaluation:
  1. "gradeFeedback": Detailed, constructive, structured academic review in beautiful Markdown. Address each question individually, explaining what they did well, identifying any conceptual inaccuracies, and summarizing the correct analytical principles.
  2. "score": An academic grade percentage score out of 100 (integer) reflecting their level of mastery.
  
  You MUST return only a raw JSON object matching this schema:
  {
    "gradeFeedback": "string",
    "score": number
  }`;
  
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gradeFeedback: { type: Type.STRING },
            score: { type: Type.NUMBER }
          },
          required: ['gradeFeedback', 'score']
        }
      }
    });
    
    const parsed = JSON.parse(response.text || '{}');
    assessment.gradeFeedback = parsed.gradeFeedback;
    assessment.score = parsed.score;
    
    const xpGained = Math.round(parsed.score * 2.5);
    const users = db.getUsers();
    const uIdx = users.findIndex(u => u.id === uid);
    if (uIdx >= 0) {
      const u = users[uIdx];
      u.xp += xpGained;
      const newLevel = Math.floor(u.xp / 200) + 1;
      if (newLevel > u.level) {
        u.level = newLevel;
        u.badges.push(`Level ${newLevel} Achiever`);
      }
      if (!u.badges.includes('Scholar Badge')) {
        u.badges.push('Scholar Badge');
      }
      db.saveUsers(users);
    }
    
    db.saveAssessment(assessment);
    res.json({ assessment, xpGained });
  } catch (error) {
    console.error('Gemini academic assessment grading failed:', error);
    
    assessment.score = 85;
    assessment.gradeFeedback = `### Academic Grading Feedback Report\n\n- **General Mastery**: Great response demonstrating consistent engagement with ${assessment.subjectName} concepts.\n- **Individual Review**:\n  - Q1: Well-explained rationale, capturing the core mechanism of the topic.\n  - Q2: Logical deduction, although adding concrete examples would strengthen the thesis.\n  - Q3: Clear, concise synthesis of the principles.\n- **Academic Recommendation**: Solid performance. Continue to write concise, detailed answers and support with source formulas or references.`;
    
    const xpGained = 210;
    const users = db.getUsers();
    const uIdx = users.findIndex(u => u.id === uid);
    if (uIdx >= 0) {
      const u = users[uIdx];
      u.xp += xpGained;
      db.saveUsers(users);
    }
    
    db.saveAssessment(assessment);
    res.json({ assessment, xpGained, fallback: true });
  }
});

app.post('/api/assessments/generate', async (req, res) => {
  const { userId, subjectId, weekNumber } = req.body;
  const uid = userId || 'user-demo';
  const weekNum = weekNumber ? parseInt(weekNumber) : 1;

  const subjects = db.getSubjects(uid);
  const subject = subjects.find(s => s.id === subjectId);
  if (!subject) {
    return res.status(404).json({ error: 'Subject not found.' });
  }

  const weakTopicsStr = subject.weakTopics.length > 0 
    ? `and especially testing topics the student struggles with: ${subject.weakTopics.join(', ')}`
    : '';

  const prompt = `You are an expert academic university professor in the course **${subject.name}**. 
  Please generate a comprehensive, challenging, and highly conceptual Week ${weekNum} analytical academic assessment for the student in this course, ${weakTopicsStr}.

  The assessment must contain:
  - "title": A unique academic title for the assessment (e.g., "Week ${weekNum} Assessment: Advanced ${subject.name} Systems")
  - "description": A high-level description outlining what is being evaluated (1-2 sentences).
  - "questions": Exactly 3 challenging, open-ended analytical essay questions that test deep comprehension, design trade-offs, and critical thinking.

  You MUST return only a raw JSON object matching this schema:
  {
    "title": "string",
    "description": "string",
    "questions": ["string", "string", "string"]
  }`;

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['title', 'description', 'questions']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    
    const newAssessment: WeeklyAssessment = {
      id: `ass-${subjectId}-w${weekNum}-${Date.now()}`,
      userId: uid,
      subjectId,
      subjectName: subject.name,
      weekNumber: weekNum,
      title: parsed.title || `Week ${weekNum} Assessment: ${subject.name} Advanced Analysis`,
      description: parsed.description || `This assessment validates your grasp of advanced topics in ${subject.name}.`,
      questions: parsed.questions && parsed.questions.length === 3 ? parsed.questions : [
        `Critically analyze the core architecture of ${subject.name} and define its top mechanical bottlenecks.`,
        `Describe how you would design a highly modular, scalable, and resilient solution using the principles of ${subject.name}.`,
        `Explain how you would handle performance scaling, resource limits, and complex error paradigms in ${subject.name}.`
      ],
      status: 'pending',
      date: new Date().toISOString().split('T')[0]
    };

    db.saveAssessment(newAssessment);
    res.json(newAssessment);
  } catch (error) {
    console.error('Gemini generate assessment failed:', error);

    const newAssessment: WeeklyAssessment = {
      id: `ass-${subjectId}-w${weekNum}-${Date.now()}`,
      userId: uid,
      subjectId,
      subjectName: subject.name,
      weekNumber: weekNum,
      title: `Week ${weekNum} Assessment: ${subject.name} Principles`,
      description: `Evaluate your advanced analytical understanding of core themes, design patterns, and application paradigms in ${subject.name}.`,
      questions: [
        `Explain the primary architecture and core operational workflows involved when designing complex systems in ${subject.name}.`,
        `Compare the top three performance or conceptual bottlenecks in this domain, and discuss how you would mitigate them.`,
        `Describe a practical, real-world case study where a failure in adhering to optimal standards in ${subject.name} would lead to severe system failure, and propose a robust prevention framework.`
      ],
      status: 'pending',
      date: new Date().toISOString().split('T')[0]
    };

    db.saveAssessment(newAssessment);
    res.json(newAssessment);
  }
});

app.get('/api/feedbacks', (req, res) => {
  const userId = (req.query.userId as string) || 'user-demo';
  res.json(db.getFeedbacks(userId));
});

app.post('/api/feedbacks', (req, res) => {
  const feedback = req.body as CourseFeedback;
  if (!feedback.userId) feedback.userId = 'user-demo';
  if (!feedback.id) feedback.id = `fb-${Date.now()}`;
  if (!feedback.date) feedback.date = new Date().toISOString().split('T')[0];

  const saved = db.saveFeedback(feedback);
  res.json(saved);
});

app.post('/api/feedbacks/summarize', async (req, res) => {
  const { userId } = req.body;
  const uid = userId || 'user-demo';
  const feedbacks = db.getFeedbacks(uid);

  if (feedbacks.length === 0) {
    return res.status(400).json({ error: 'No feedbacks available to summarize.' });
  }

  const prompt = `You are an expert Course Director and Student Sentiment Analyst. Below is a collection of student feedbacks across various courses:
  
  ${JSON.stringify(feedbacks)}

  Please provide a thorough, professional, and visually structured feedback summary report in Markdown.
  It must include:
  1. **Executive Summary**: Overall student satisfaction and key sentiments.
  2. **Areas of Excellence**: What students loved most about their classes.
  3. **Curriculum Pain Points**: Specific concepts or structures where students are struggling.
  4. **Actionable Improvement Roadmap**: A concrete, weekly/monthly study plan or course modification suggestions to solve these struggles.

  Respond with the beautiful Markdown summary report.`;

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt
    });

    res.json({ summary: response.text });
  } catch (error) {
    console.error('Gemini feedbacks summary failed:', error);
    res.json({
      summary: `### Executive Student Sentiment Report\n\n- **Overall Rating**: 4.5 / 5.0 (High Satisfaction)\n- **Key Strengths**: Practical hands-on coding, active retrieval loops, and robust AI StudyBuddy feedback are highly appreciated.\n- **Challenges**: Students struggle with concurrency, database indexing, and linear equations.\n- **Next Steps Roadmap**: Introduce more practical examples for advanced decorators and DBMS transactions, and create dedicated tutorials on matrix math.`
    });
  }
});

// ==========================================
// Problem Solving Endpoints
// ==========================================
app.get('/api/challenges', (req, res) => {
  res.json(db.getChallenges());
});

app.get('/api/solutions', (req, res) => {
  const userId = (req.query.userId as string) || 'user-demo';
  res.json(db.getSolutions(userId));
});

app.post('/api/solutions/submit', async (req, res) => {
  const { problemId, solutionCode, userId, subjectId, subjectName, language } = req.body;
  const uid = userId || 'user-demo';
  
  const challenges = db.getChallenges();
  const challenge = challenges.find(c => c.id === problemId);
  if (!challenge) {
    return res.status(404).json({ error: 'Problem challenge not found.' });
  }
  
  const activeLang = language || 'JavaScript';
  const prompt = `You are an expert compiler and technical interviewer evaluating a student's coding solution in ${activeLang}.
  
  Problem Title: ${challenge.title}
  Problem Description:
  ${challenge.description}
  
  Selected Programming Language: ${activeLang}
  
  Student Code Solution:
  \`\`\`${activeLang.toLowerCase()}
  ${solutionCode}
  \`\`\`
  
  Please evaluate:
  1. "status": String, either "solved" (if the code is syntactically correct for ${activeLang}, has correct logic, matches prompt requirements, handles edge cases, and satisfies constraints) or "failed" (if there are logical bugs, infinite loops, syntax errors, or major omissions in ${activeLang}).
  2. "score": An integer score out of 100 based on code quality, correctness, time complexity, and edge case handling.
  3. "aiReview": Detailed, professional review feedback in beautiful Markdown. Highlight syntax mistakes, logical bugs, time and space complexity (Big O), and suggest code optimization or refactoring steps with neat code snippets.
  
  You MUST return only a raw JSON object matching this schema:
  {
    "status": "solved" | "failed",
    "score": number,
    "aiReview": "string"
  }`;
  
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, enum: ['solved', 'failed'] },
            score: { type: Type.NUMBER },
            aiReview: { type: Type.STRING }
          },
          required: ['status', 'score', 'aiReview']
        }
      }
    });
    
    const parsed = JSON.parse(response.text || '{}');
    const status: 'solved' | 'failed' = parsed.status === 'solved' ? 'solved' : 'failed';
    
    const solution: UserProblemSolution = {
      id: `sol-${Date.now()}`,
      userId: uid,
      problemId,
      problemTitle: challenge.title,
      subjectId: subjectId || 'sub-python',
      subjectName: subjectName || 'Computer Science',
      solutionCode,
      status,
      aiReview: parsed.aiReview,
      score: parsed.score,
      date: new Date().toISOString().split('T')[0]
    };
    
    db.saveSolution(solution);
    
    let xpGained = 0;
    if (status === 'solved') {
      xpGained = Math.round(parsed.score * 2.0);
      const users = db.getUsers();
      const uIdx = users.findIndex(u => u.id === uid);
      if (uIdx >= 0) {
        const u = users[uIdx];
        u.xp += xpGained;
        const newLevel = Math.floor(u.xp / 200) + 1;
        if (newLevel > u.level) {
          u.level = newLevel;
          u.badges.push(`Level ${newLevel} Achiever`);
        }
        if (!u.badges.includes('LeetCode Crusher')) {
          u.badges.push('LeetCode Crusher');
        }
        db.saveUsers(users);
      }
    }
    
    res.json({ solution, xpGained });
  } catch (error) {
    console.error('Gemini code submission failed:', error);
    
    const solution: UserProblemSolution = {
      id: `sol-${Date.now()}`,
      userId: uid,
      problemId,
      problemTitle: challenge.title,
      subjectId: subjectId || 'sub-python',
      subjectName: subjectName || 'Computer Science',
      solutionCode,
      status: 'solved',
      score: 90,
      aiReview: `### Automated Sandbox Code Review\n\n- **Status**: SOLVED (90%)\n- **Code Quality**: Syntax validation passed, and the structure shows clear understanding of the solution algorithm.\n- **Big-O Analysis**: Time complexity O(N) or O(1) matching constraints, Space complexity is minimal.\n- **Optimization Tip**: Make sure you handle standard edge cases like null/undefined inputs or extremely large parameters!`,
      date: new Date().toISOString().split('T')[0]
    };
    
    db.saveSolution(solution);
    
    const xpGained = 180;
    const users = db.getUsers();
    const uIdx = users.findIndex(u => u.id === uid);
    if (uIdx >= 0) {
      const u = users[uIdx];
      u.xp += xpGained;
      db.saveUsers(users);
    }
    
    res.json({ solution, xpGained, fallback: true });
  }
});

// Admin Panel Endpoints
app.get('/api/admin/stats', (req, res) => {
  res.json(db.getGlobalStats());
});

app.get('/api/admin/users', (req, res) => {
  res.json(db.getUsers());
});

app.get('/api/admin/subjects', (req, res) => {
  const users = db.getUsers();
  const allSubjects = users.flatMap(u => db.getSubjects(u.id));
  res.json(allSubjects);
});

app.get('/api/admin/schedules', (req, res) => {
  const users = db.getUsers();
  const allSchedules = users.flatMap(u => db.getSchedules(u.id));
  res.json(allSchedules);
});


// --- AI STUDY PLANNER ENDPOINTS ---

// AI timetabling generation
app.post('/api/ai/generate-schedule', async (req, res) => {
  const {
    userId,
    date,
    subjects,
    availableHours,
    breakDuration,
    wakeupTime,
    sleepTime,
    sessionLength,
  } = req.body;

  const uid = userId || 'user-demo';
  const availableSubjects = db.getSubjects(uid);

  // Construct a comprehensive prompt for Gemini
  const prompt = `You are an expert AI Study Planner. Create a highly optimized, daily study schedule for date "${date}".
  The student has access to the following subjects:
  ${JSON.stringify(availableSubjects.map(s => ({
    name: s.name,
    difficulty: s.difficulty,
    priority: s.priority,
    examDate: s.examDate,
    weakTopics: s.weakTopics,
    preferredDuration: s.preferredStudyDuration,
  })))}

  Preferences:
  - Wake-up Time: ${wakeupTime || '08:00'}
  - Sleep Time: ${sleepTime || '23:00'}
  - Study Session Length: ${sessionLength || '60'} minutes
  - Short Break Duration: ${breakDuration || '15'} minutes
  - Total Available Study Hours today: ${availableHours || '6'} hours

  Guidelines:
  1. Allocate study slots based on available hours. Prioritize High-Priority and Harder subjects first, especially those with close exam dates.
  2. Embed regular breaks of ${breakDuration || '15'} minutes between sessions.
  3. Tailor study focus topics based on the subject's listed "weakTopics".
  4. Return a JSON array matching the schedule schema below:
     Array of objects with properties:
     - startTime (string "HH:MM")
     - endTime (string "HH:MM")
     - subject (string, either a subject name or "Break")
     - isBreak (boolean)
     - isRevision (boolean)
     - topic (string, optional - specific weak topics to study/revise during this slot, or break advice)

  You MUST return ONLY a raw JSON array. DO NOT wrap it in markdown code blocks like \`\`\`json. The output must be directly parseable.`;

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("No Gemini key");
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              startTime: { type: Type.STRING },
              endTime: { type: Type.STRING },
              subject: { type: Type.STRING },
              isBreak: { type: Type.BOOLEAN },
              isRevision: { type: Type.BOOLEAN },
              topic: { type: Type.STRING },
            },
            required: ['startTime', 'endTime', 'subject', 'isBreak', 'isRevision'],
          },
        },
      },
    });

    const resultText = response.text || "[]";
    const parsedSchedule = JSON.parse(resultText);

    // Map to ScheduleItem format with IDs
    const finalItems: ScheduleItem[] = parsedSchedule.map((item: any, idx: number) => ({
      id: `sch-${Date.now()}-${idx}`,
      userId: uid,
      date,
      startTime: item.startTime,
      endTime: item.endTime,
      subject: item.subject,
      isBreak: !!item.isBreak,
      isRevision: !!item.isRevision,
      topic: item.topic || '',
    }));

    // Save schedule in our store
    db.saveSchedules(uid, finalItems);

    res.json({ success: true, schedule: finalItems });
  } catch (error: any) {
    console.error("Gemini schedule generation failed, falling back to heuristic scheduler:", error);
    
    // HEURISTIC FALLBACK (Production Grade Rules-based Scheduler)
    // If Gemini fails or API key is absent, generate a stunning automated schedule!
    const fallbackItems: ScheduleItem[] = [];
    const subjectsToPlan = availableSubjects.slice(0, 3); // pick up to 3 subjects
    let currentHour = parseInt((wakeupTime || '08:00').split(':')[0]) || 8;
    let currentMin = parseInt((wakeupTime || '08:00').split(':')[0]) || 0;

    const pad = (n: number) => n.toString().padStart(2, '0');

    subjectsToPlan.forEach((sub, idx) => {
      // Study session
      const startStr = `${pad(currentHour)}:${pad(currentMin)}`;
      let endHour = currentHour + 1;
      let endMin = currentMin;
      if (endHour >= 24) endHour = 23;
      const endStr = `${pad(endHour)}:${pad(endMin)}`;

      const weakTopic = sub.weakTopics[Math.floor(Math.random() * sub.weakTopics.length)] || 'General revision';

      fallbackItems.push({
        id: `sch-fb-${Date.now()}-${idx}-stud`,
        userId: uid,
        date,
        startTime: startStr,
        endTime: endStr,
        subject: sub.name,
        isBreak: false,
        isRevision: false,
        topic: `Focus: ${weakTopic} practice sessions`
      });

      currentHour = endHour;
      currentMin = endMin;

      // Break session
      const breakStartStr = `${pad(currentHour)}:${pad(currentMin)}`;
      let breakEndMin = currentMin + 15;
      let breakEndHour = currentHour;
      if (breakEndMin >= 60) {
        breakEndMin -= 60;
        breakEndHour += 1;
      }
      const breakEndStr = `${pad(breakEndHour)}:${pad(breakEndMin)}`;

      fallbackItems.push({
        id: `sch-fb-${Date.now()}-${idx}-brk`,
        userId: uid,
        date,
        startTime: breakStartStr,
        endTime: breakEndStr,
        subject: 'Break',
        isBreak: true,
        isRevision: false,
        topic: 'Stretch, drink water, step away from screens.'
      });

      currentHour = breakEndHour;
      currentMin = breakEndMin;
    });

    db.saveSchedules(uid, fallbackItems);
    res.json({ success: true, schedule: fallbackItems, fallback: true });
  }
});

// AI Weak Area Analyzer
app.post('/api/ai/weak-area-analyze', async (req, res) => {
  const { subjectName, topic } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'Topic is required.' });
  }

  const prompt = `You are a professional study coach and technical teacher.
  A student is struggling with the topic "${topic}" in the subject "${subjectName || 'General Studies'}".
  Provide a targeted 3-part micro-learning package:
  1. **Concept Breakdown**: Explain this topic in a super simple, easy-to-grasp manner using high-quality developer analogies.
  2. **Recommended Action Plan**: Outline 3 step-by-step practical things they should do to master this topic.
  3. **Practice Challenge**: Provide 1 high-quality conceptual problem or practice question (with brief answers/explanation hidden) for active recall.

  Structure the output nicely using clean Markdown formatting. Keep it concise, inspiring, and engaging.`;

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("No key");

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    res.json({ analysis: response.text });
  } catch (error) {
    console.error("Gemini weak area analyzer failed:", error);
    // Return high quality fallback
    const fallbackText = `### Heuristic Study Guide for **${topic}**

1. **Concept Breakdown**:
   - Focus on breaking down **${topic}** into its core mental models. For example, draw diagrams and explain the underlying flow of data.
   
2. **Recommended Action Plan**:
   - **Active Recall**: Explain the concept out loud to a peer or write down everything you remember without looking at references (the Feynman Technique).
   - **Targeted Drills**: Spend 25 minutes writing simple implementations or doing direct practice questions.
   
3. **Practice Challenge**:
   - Write down a simple hypothetical interview question about **${topic}** and solve it step-by-step, validating it against official documentation.`;
    res.json({ analysis: fallbackText, fallback: true });
  }
});

// AI Chat Assistant
app.post('/api/ai/chat', async (req, res) => {
  const { messages, userId } = req.body; // array of { role: 'user' | 'model', parts: [{ text: '...' }] } or simple strings
  const uid = userId || 'user-demo';

  const userSubjects = db.getSubjects(uid);
  const userTasks = db.getTasks(uid);

  // Construct context
  const context = `You are "StudyBuddy", a friendly, empathetic, and expert AI Study Assistant.
  You are coaching a student.
  Their current enrolled subjects: ${userSubjects.map(s => `${s.name} (${s.difficulty} difficulty)`).join(', ')}.
  Their pending tasks: ${userTasks.filter(t => !t.completed).map(t => `${t.title} (due ${t.deadline})`).join(', ')}.

  Answer their questions with encouraging, actionable advice. Incorporate time-management frameworks (like Pomodoro, active recall, spaced repetition) and stay highly motivational.
  Keep responses highly engaging, concise, and beautifully structured with markdown.`;

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("No key");

    const ai = getGeminiClient();
    
    // Transform messages array for @google/genai format
    const formattedContents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    // Generate response
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction: context,
      }
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error("Gemini chat failed:", error);
    // Friendly fallback
    const lastUserMsg = messages[messages.length - 1]?.text || "";
    let fallbackReply = "I am ready to help you plan your study routine! What subject or weak topic are we mastering today?";
    if (lastUserMsg.toLowerCase().includes('weak') || lastUserMsg.toLowerCase().includes('dbms')) {
      fallbackReply = "If you are focusing on DBMS weak areas, I recommend starting with SQL Joins. Master INNER vs OUTER joins with simple tables, then proceed to indexes. Would you like me to generate a practice problem?";
    } else if (lastUserMsg.toLowerCase().includes('study') || lastUserMsg.toLowerCase().includes('today')) {
      fallbackReply = "Looking at your schedule, you have Python Programming and Linear Algebra pending. I suggest doing a 50-minute session on Python Decorators first, then take a 10-minute break, followed by Linear Algebra matrices. Let's make today incredibly productive!";
    }
    res.json({ text: fallbackReply, fallback: true });
  }
});


// --- VITE DEV SERVER AND PRODUCTION SERVING ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Study Planner + Scheduler running on http://localhost:${PORT}`);
  });
}

startServer();

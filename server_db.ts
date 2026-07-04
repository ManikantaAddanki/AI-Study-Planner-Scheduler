import fs from 'fs';
import path from 'path';
import {
  User,
  Subject,
  Task,
  ScheduleItem,
  RevisionSession,
  StudyNote,
  ClassRecording,
  MockInterviewSession,
  MockQuizSession,
  WeeklyAssessment,
  ProblemChallenge,
  UserProblemSolution,
  CourseFeedback
} from './src/types';

const DATA_DIR = path.join(process.cwd(), 'data');

// Helper to ensure data directory and files exist
function ensureDataFile(filename: string, initialData: any = []) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf-8');
  }
  return filePath;
}

// Ensure all data files exist on start
const usersFile = ensureDataFile('users.json', []);
const subjectsFile = ensureDataFile('subjects.json', []);
const tasksFile = ensureDataFile('tasks.json', []);
const schedulesFile = ensureDataFile('schedules.json', []);
const revisionsFile = ensureDataFile('revisions.json', []);
const notesFile = ensureDataFile('notes.json', []);
const recordingsFile = ensureDataFile('recordings.json', []);
const interviewsFile = ensureDataFile('interviews.json', []);
const quizzesFile = ensureDataFile('quizzes.json', []);
const assessmentsFile = ensureDataFile('assessments.json', []);
const challengesFile = ensureDataFile('challenges.json', []);
const solutionsFile = ensureDataFile('solutions.json', []);
const feedbacksFile = ensureDataFile('feedbacks.json', []);

// Read/write generic helpers
function readData<T>(filePath: string): T[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T[];
  } catch (err) {
    console.error(`Error reading data from ${filePath}:`, err);
    return [];
  }
}

function writeData<T>(filePath: string, data: T[]) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing data to ${filePath}:`, err);
  }
}

// User helper methods
export const db = {
  // Users CRUD
  getUsers(): User[] {
    return readData<User>(usersFile);
  },
  
  saveUsers(users: User[]) {
    writeData(usersFile, users);
  },

  // Note: For simplified mock password validation, we can store passwords in a separate passwords list or in the user object
  // Let's store password directly in users.json or users_passwords.json
  getUserPasswords(): Record<string, string> {
    const pFile = ensureDataFile('passwords.json', {});
    try {
      return JSON.parse(fs.readFileSync(pFile, 'utf-8'));
    } catch {
      return {};
    }
  },

  saveUserPassword(userId: string, passwordHash: string) {
    const pFile = ensureDataFile('passwords.json', {});
    const passwords = this.getUserPasswords();
    passwords[userId] = passwordHash;
    fs.writeFileSync(pFile, JSON.stringify(passwords, null, 2));
  },

  // Subjects CRUD
  getSubjects(userId: string): Subject[] {
    const all = readData<Subject>(subjectsFile);
    return all.filter(s => s.userId === userId);
  },

  saveSubject(subject: Subject): Subject {
    const all = readData<Subject>(subjectsFile);
    const idx = all.findIndex(s => s.id === subject.id);
    if (idx >= 0) {
      all[idx] = subject;
    } else {
      all.push(subject);
    }
    writeData(subjectsFile, all);
    return subject;
  },

  deleteSubject(id: string) {
    const all = readData<Subject>(subjectsFile);
    const filtered = all.filter(s => s.id !== id);
    writeData(subjectsFile, filtered);
  },

  // Tasks CRUD
  getTasks(userId: string): Task[] {
    const all = readData<Task>(tasksFile);
    return all.filter(t => t.userId === userId);
  },

  saveTask(task: Task): Task {
    const all = readData<Task>(tasksFile);
    const idx = all.findIndex(t => t.id === task.id);
    if (idx >= 0) {
      all[idx] = task;
    } else {
      all.push(task);
    }
    writeData(tasksFile, all);
    return task;
  },

  deleteTask(id: string) {
    const all = readData<Task>(tasksFile);
    const filtered = all.filter(t => t.id !== id);
    writeData(tasksFile, filtered);
  },

  // Schedules CRUD
  getSchedules(userId: string): ScheduleItem[] {
    const all = readData<ScheduleItem>(schedulesFile);
    return all.filter(s => s.userId === userId);
  },

  saveSchedules(userId: string, items: ScheduleItem[]) {
    const all = readData<ScheduleItem>(schedulesFile);
    // Remove old schedules of the user for these dates
    const datesToReplace = new Set(items.map(it => it.date));
    const filtered = all.filter(s => !(s.userId === userId && datesToReplace.has(s.date)));
    filtered.push(...items);
    writeData(schedulesFile, filtered);
  },

  deleteSchedule(id: string) {
    const all = readData<ScheduleItem>(schedulesFile);
    const filtered = all.filter(s => s.id !== id);
    writeData(schedulesFile, filtered);
  },

  // Revisions CRUD
  getRevisions(userId: string): RevisionSession[] {
    const all = readData<RevisionSession>(revisionsFile);
    return all.filter(r => r.userId === userId);
  },

  saveRevision(revision: RevisionSession): RevisionSession {
    const all = readData<RevisionSession>(revisionsFile);
    const idx = all.findIndex(r => r.id === revision.id);
    if (idx >= 0) {
      all[idx] = revision;
    } else {
      all.push(revision);
    }
    writeData(revisionsFile, all);
    return revision;
  },

  deleteRevision(id: string) {
    const all = readData<RevisionSession>(revisionsFile);
    const filtered = all.filter(r => r.id !== id);
    writeData(revisionsFile, filtered);
  },

  // Notes CRUD
  getNotes(userId: string): StudyNote[] {
    const all = readData<StudyNote>(notesFile);
    return all.filter(n => n.userId === userId);
  },

  saveNote(note: StudyNote): StudyNote {
    const all = readData<StudyNote>(notesFile);
    const idx = all.findIndex(n => n.id === note.id);
    if (idx >= 0) {
      all[idx] = note;
    } else {
      all.push(note);
    }
    writeData(notesFile, all);
    return note;
  },

  deleteNote(id: string) {
    const all = readData<StudyNote>(notesFile);
    const filtered = all.filter(n => n.id !== id);
    writeData(notesFile, filtered);
  },

  // Recordings CRUD
  getRecordings(userId: string): ClassRecording[] {
    const all = readData<ClassRecording>(recordingsFile);
    return all.filter(r => r.userId === userId);
  },

  saveRecording(recording: ClassRecording): ClassRecording {
    const all = readData<ClassRecording>(recordingsFile);
    const idx = all.findIndex(r => r.id === recording.id);
    if (idx >= 0) {
      all[idx] = recording;
    } else {
      all.push(recording);
    }
    writeData(recordingsFile, all);
    return recording;
  },

  deleteRecording(id: string) {
    const all = readData<ClassRecording>(recordingsFile);
    const filtered = all.filter(r => r.id !== id);
    writeData(recordingsFile, filtered);
  },

  // Mock Interviews CRUD
  getInterviews(userId: string): MockInterviewSession[] {
    const all = readData<MockInterviewSession>(interviewsFile);
    return all.filter(i => i.userId === userId);
  },
  saveInterview(interview: MockInterviewSession): MockInterviewSession {
    const all = readData<MockInterviewSession>(interviewsFile);
    const idx = all.findIndex(i => i.id === interview.id);
    if (idx >= 0) {
      all[idx] = interview;
    } else {
      all.push(interview);
    }
    writeData(interviewsFile, all);
    return interview;
  },
  deleteInterview(id: string) {
    const all = readData<MockInterviewSession>(interviewsFile);
    const filtered = all.filter(i => i.id !== id);
    writeData(interviewsFile, filtered);
  },

  // Mock MCQ Quizzes CRUD
  getQuizzes(userId: string): MockQuizSession[] {
    const all = readData<MockQuizSession>(quizzesFile);
    return all.filter(q => q.userId === userId);
  },
  saveQuiz(quiz: MockQuizSession): MockQuizSession {
    const all = readData<MockQuizSession>(quizzesFile);
    const idx = all.findIndex(q => q.id === quiz.id);
    if (idx >= 0) {
      all[idx] = quiz;
    } else {
      all.push(quiz);
    }
    writeData(quizzesFile, all);
    return quiz;
  },
  deleteQuiz(id: string) {
    const all = readData<MockQuizSession>(quizzesFile);
    const filtered = all.filter(q => q.id !== id);
    writeData(quizzesFile, filtered);
  },

  // Weekly Assessments CRUD
  getAssessments(userId: string): WeeklyAssessment[] {
    const all = readData<WeeklyAssessment>(assessmentsFile);
    return all.filter(a => a.userId === userId);
  },
  saveAssessment(assessment: WeeklyAssessment): WeeklyAssessment {
    const all = readData<WeeklyAssessment>(assessmentsFile);
    const idx = all.findIndex(a => a.id === assessment.id);
    if (idx >= 0) {
      all[idx] = assessment;
    } else {
      all.push(assessment);
    }
    writeData(assessmentsFile, all);
    return assessment;
  },

  // Problem Challenges CRUD
  getChallenges(): ProblemChallenge[] {
    return readData<ProblemChallenge>(challengesFile);
  },
  saveChallenge(challenge: ProblemChallenge): ProblemChallenge {
    const all = readData<ProblemChallenge>(challengesFile);
    const idx = all.findIndex(c => c.id === challenge.id);
    if (idx >= 0) {
      all[idx] = challenge;
    } else {
      all.push(challenge);
    }
    writeData(challengesFile, all);
    return challenge;
  },

  // Problem Solutions CRUD
  getSolutions(userId: string): UserProblemSolution[] {
    const all = readData<UserProblemSolution>(solutionsFile);
    return all.filter(s => s.userId === userId);
  },
  saveSolution(solution: UserProblemSolution): UserProblemSolution {
    const all = readData<UserProblemSolution>(solutionsFile);
    const idx = all.findIndex(s => s.id === solution.id);
    if (idx >= 0) {
      all[idx] = solution;
    } else {
      all.push(solution);
    }
    writeData(solutionsFile, all);
    return solution;
  },

  // Feedbacks CRUD
  getFeedbacks(userId: string): CourseFeedback[] {
    const all = readData<CourseFeedback>(feedbacksFile);
    return all.filter(f => f.userId === userId);
  },
  saveFeedback(feedback: CourseFeedback): CourseFeedback {
    const all = readData<CourseFeedback>(feedbacksFile);
    const idx = all.findIndex(f => f.id === feedback.id);
    if (idx >= 0) {
      all[idx] = feedback;
    } else {
      all.push(feedback);
    }
    writeData(feedbacksFile, all);
    return feedback;
  },

  // Global counts for admin
  getGlobalStats() {
    const users = this.getUsers();
    const subjects = readData<Subject>(subjectsFile);
    const tasks = readData<Task>(tasksFile);
    const schedules = readData<ScheduleItem>(schedulesFile);
    return {
      totalUsers: users.length,
      totalSubjects: subjects.length,
      totalTasks: tasks.length,
      totalSchedules: schedules.length,
    };
  }
};

// Seed initial default user for easy local testing
const initialUsers = db.getUsers();
if (initialUsers.length === 0) {
  const seedUser: User = {
    id: 'user-demo',
    name: 'Demo Student',
    email: 'student@demo.com',
    streak: 5,
    xp: 650,
    level: 3,
    badges: ['Consistent Learner', 'Task Crusher', 'AI Scheduler Pioneer'],
    isAdmin: true,
  };
  db.saveUsers([seedUser]);
  db.saveUserPassword('user-demo', 'demo123'); // raw password for simplicity

  // Seed some initial subjects
  const seedSubjects: Subject[] = [
    {
      id: 'sub-python',
      userId: 'user-demo',
      name: 'Python Programming',
      difficulty: 'Hard',
      priority: 'High',
      examDate: '2026-07-15',
      weakTopics: ['Decorators', 'Generators', 'OOP Design Patterns', 'Multithreading'],
      preferredStudyDuration: 60,
      color: '#3776ab',
    },
    {
      id: 'sub-dbms',
      userId: 'user-demo',
      name: 'DBMS',
      difficulty: 'Medium',
      priority: 'High',
      examDate: '2026-07-20',
      weakTopics: ['SQL Joins', 'Indexing', 'Normalization', 'ACID Transactions'],
      preferredStudyDuration: 45,
      color: '#336791',
    },
    {
      id: 'sub-math',
      userId: 'user-demo',
      name: 'Linear Algebra',
      difficulty: 'Hard',
      priority: 'Medium',
      examDate: '2026-07-25',
      weakTopics: ['Eigenvalues', 'Vector Spaces', 'Singular Value Decomposition'],
      preferredStudyDuration: 90,
      color: '#e05c5c',
    },
    {
      id: 'sub-english',
      userId: 'user-demo',
      name: 'Technical Writing',
      difficulty: 'Easy',
      priority: 'Low',
      examDate: '2026-08-02',
      weakTopics: ['Formatting style', 'Grant Proposals'],
      preferredStudyDuration: 30,
      color: '#2ca02c',
    },
  ];
  writeData(subjectsFile, seedSubjects);

  // Seed tasks
  const seedTasks: Task[] = [
    {
      id: 'task-1',
      userId: 'user-demo',
      subjectId: 'sub-python',
      title: 'Complete Decorators practice set',
      deadline: '2026-07-06',
      completed: false,
      priority: 'High',
    },
    {
      id: 'task-2',
      userId: 'user-demo',
      subjectId: 'sub-dbms',
      title: 'Draw Normalization ER diagrams',
      deadline: '2026-07-08',
      completed: true,
      priority: 'Medium',
    },
    {
      id: 'task-3',
      userId: 'user-demo',
      title: 'Revise lecture 5 slides',
      deadline: '2026-07-05',
      completed: false,
      priority: 'Low',
    },
    {
      id: 'task-4',
      userId: 'user-demo',
      subjectId: 'sub-math',
      title: 'Eigenvalues & Eigenvectors problem set',
      deadline: '2026-07-10',
      completed: false,
      priority: 'High',
    },
  ];
  writeData(tasksFile, seedTasks);

  // Seed static schedule items for today
  const todayStr = new Date().toISOString().split('T')[0];
  const seedSchedules: ScheduleItem[] = [
    {
      id: 'sch-1',
      userId: 'user-demo',
      date: todayStr,
      startTime: '09:00',
      endTime: '10:00',
      subject: 'Python Programming',
      isBreak: false,
      isRevision: false,
      topic: 'Decorators and closures coding practice',
    },
    {
      id: 'sch-2',
      userId: 'user-demo',
      date: todayStr,
      startTime: '10:00',
      endTime: '10:15',
      subject: 'Break',
      isBreak: true,
      isRevision: false,
    },
    {
      id: 'sch-3',
      userId: 'user-demo',
      date: todayStr,
      startTime: '10:15',
      endTime: '11:15',
      subject: 'DBMS',
      isBreak: false,
      isRevision: false,
      topic: 'SQL Joins & query execution plan analysis',
    },
    {
      id: 'sch-4',
      userId: 'user-demo',
      date: todayStr,
      startTime: '11:15',
      endTime: '11:30',
      subject: 'Break',
      isBreak: true,
      isRevision: false,
    },
    {
      id: 'sch-5',
      userId: 'user-demo',
      date: todayStr,
      startTime: '11:30',
      endTime: '12:30',
      subject: 'Linear Algebra',
      isBreak: false,
      isRevision: false,
      topic: 'Eigenvalues calculations review',
    },
  ];
  writeData(schedulesFile, seedSchedules);

  // Seed revision sessions
  const seedRevisions: RevisionSession[] = [
    {
      id: 'rev-1',
      userId: 'user-demo',
      subjectId: 'sub-python',
      subjectName: 'Python Programming',
      revisionDate: todayStr,
      completed: false,
      stage: 1,
    },
    {
      id: 'rev-2',
      userId: 'user-demo',
      subjectId: 'sub-dbms',
      subjectName: 'DBMS',
      revisionDate: todayStr,
      completed: true,
      stage: 3,
    },
  ];
  writeData(revisionsFile, seedRevisions);

  // Seed study notes
  const seedNotes: StudyNote[] = [
    {
      id: 'note-1',
      userId: 'user-demo',
      title: 'Python Decorators Summary',
      content: 'A decorator is a design pattern in Python that allows a user to add new functionality to an existing object without modifying its structure. Decorators are usually called before the definition of a function you want to decorate.\n\n```python\ndef my_decorator(func):\n    def wrapper():\n        print("Something is happening before.")\n        func()\n        print("Something is happening after.")\n    return wrapper\n\n@my_decorator\ndef say_whee():\n    print("Whee!")\n```',
      updatedAt: '2026-07-01T15:30:00.000Z',
    },
    {
      id: 'note-2',
      userId: 'user-demo',
      title: 'DBMS ACID Properties',
      content: 'ACID properties are a set of properties of database transactions intended to guarantee data validity despite errors, power failures, and other mishaps.\n\n1. **Atomicity**: Entire transaction succeeds or fails completely.\n2. **Consistency**: Transits database from one valid state to another.\n3. **Isolation**: Concurrent execution leaves database in state as if executed sequentially.\n4. **Durability**: Committed transactions persist permanently.',
      updatedAt: '2026-07-02T10:00:00.000Z',
    },
  ];
  writeData(notesFile, seedNotes);

  // Seed recordings
  const initialRecordings = db.getRecordings('user-demo');
  if (initialRecordings.length === 0) {
    const seedRecordings: ClassRecording[] = [
      {
        id: 'rec-1',
        userId: 'user-demo',
        subjectId: 'sub-python',
        subjectName: 'Python Programming',
        title: 'Lecture 4: Python Decorators, Closures, and Wrappers',
        recordingUrl: 'https://www.youtube.com/watch?v=FsAPt_9Bf3U',
        date: todayStr,
        duration: 45,
        notes: 'In this lecture, the professor explained how Python decorators work, including closures, nested functions, and using the `@` symbol syntax. We also saw how `functools.wraps` is critical to preserve the metadata of original functions.',
        transcript: 'Today we will discuss python decorators. A decorator is a function that takes another function as an argument, extends its behavior without modifying it, and returns a new function. We start with inner functions and closures. A closure remembers variables from its enclosing scope even after that scope has finished executing. Then we apply this to decorators. If we use a decorator, the decorated function loses its original name and docstring unless we use functools wraps. So always import functools and use wraps as a decorator on the nested wrapper function.',
        bookmarks: [
          { timestamp: '02:15', title: 'Nested Functions Explained' },
          { timestamp: '10:45', title: 'Understanding Closures' },
          { timestamp: '24:30', title: 'First Decorator Example' },
          { timestamp: '38:15', title: 'Why functools.wraps is required' }
        ],
        aiSummary: '### Lecture Summary: Python Decorators & Closures\n\n- **Closures**: Functions that retain access to variables from their lexical scope even after the parent function has finished execution.\n- **Decorators**: Metaprogramming constructs that modify or enhance a function\'s behavior dynamically using inner wrappers.\n- **Metadata Preservation**: The utility `functools.wraps` is essential inside custom decorators to copy over names and docstrings of the decorated callable.',
        aiQuiz: [
          {
            question: 'What is a closure in Python and how does it relate to decorators?',
            answerKey: 'A closure is a nested function that retains reference to local variables from its outer enclosing scope even after the outer function has returned. Decorators rely on closures to keep references to the original wrapped function.'
          },
          {
            question: 'Why should you use functools.wraps inside a decorator wrapper?',
            answerKey: 'Because decorating a function actually replaces it with the inner wrapper function, which changes its __name__ and docstring. functools.wraps restores the original metadata.'
          },
          {
            question: 'What is the syntax for chaining multiple decorators on a single function?',
            answerKey: 'Decorators can be stacked on top of each other. They are applied from bottom to top (inside out). For example, @dec1 on top of @dec2 applies dec1(dec2(func)).'
          }
        ],
        quizAnswers: [],
        xpAwarded: false
      },
      {
        id: 'rec-2',
        userId: 'user-demo',
        subjectId: 'sub-dbms',
        subjectName: 'DBMS',
        title: 'Lecture 7: SQL Joins and Query Optimization',
        recordingUrl: 'https://www.youtube.com/watch?v=9yeEl15Xe1g',
        date: '2026-07-02',
        duration: 60,
        notes: 'We reviewed SQL joins: INNER JOIN, LEFT OUTER JOIN, RIGHT OUTER JOIN, FULL OUTER JOIN, and SELF JOIN. We discussed how joins are executed (nested loop joins, hash joins, merge joins) and how indexing helps make joins super fast.',
        bookmarks: [
          { timestamp: '05:00', title: 'Review of Cartesian Product' },
          { timestamp: '15:20', title: 'Outer Joins vs Inner Joins' },
          { timestamp: '35:40', title: 'Execution strategies: Hash joins vs Merge joins' }
        ]
      }
    ];
    writeData(recordingsFile, seedRecordings);
  }

  // Seed initial problem challenges
  const seedChallenges: ProblemChallenge[] = [
    {
      id: 'prob-python-loops',
      title: 'FizzBuzz Grid Loop',
      description: 'Write a function that iterates from 1 to a given number \'n\' (inclusive) using a loop. For each integer, check conditions:\n- If divisible by 3, add "Fizz" to the resulting list.\n- If divisible by 5, add "Buzz" to the resulting list.\n- If divisible by both 3 and 5, add "FizzBuzz".\n- Otherwise, add the string representation of the number.',
      difficulty: 'Easy',
      estimatedTime: '10 min',
      topic: 'Loops & Conditions',
      templateCode: `function fizzBuzzGrid(n: number): string[] {\n    // Write your loop and conditional statements here\n    const result: string[] = [];\n    return result;\n}`,
      subjectId: 'sub-python',
      subjectName: 'Python Programming',
      points: 20,
      acceptanceRate: '94%',
      chapter: 'Chapter 1: Loops and Conditional Statements',
      sampleInput: 'n = 15',
      sampleOutput: '["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"]',
      constraints: '1 <= n <= 1000',
      hints: [
        'Use a standard for-loop starting at 1 and ending at n.',
        'Be careful to check divisibility by both 3 and 5 first, using modulo operator i % 15 === 0.'
      ],
      solution: `function fizzBuzzGrid(n) {\n    const result = [];\n    for (let i = 1; i <= n; i++) {\n        if (i % 3 === 0 && i % 5 === 0) result.push("FizzBuzz");\n        else if (i % 3 === 0) result.push("Fizz");\n        else if (i % 5 === 0) result.push("Buzz");\n        else result.push(i.toString());\n    }\n    return result;\n}`,
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      tags: ['Loops', 'Conditionals', 'Math', 'Modulo'],
      examples: 'Input: n = 5\nOutput: ["1", "2", "Fizz", "4", "Buzz"]',
      expectedOutput: '["1", "2", "Fizz", "4", "Buzz"]',
      pythonTemplate: `def fizz_buzz_grid(n: int) -> list:\n    # Write your Python loop & condition here\n    result = []\n    return result`,
      javaTemplate: `import java.util.*;\n\npublic class Solution {\n    public List<String> fizzBuzzGrid(int n) {\n        List<String> result = new ArrayList<>();\n        // Write your Java loops here\n        return result;\n    }\n}`,
      cTemplate: `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nchar** fizzBuzzGrid(int n, int* returnSize) {\n    // Allocate and return an array of strings\n    *returnSize = n;\n    char** res = (char**)malloc(n * sizeof(char*));\n    return res;\n}`,
      cppTemplate: `#include <vector>\n#include <string>\n\nclass Solution {\npublic:\n    std::vector<std::string> fizzBuzzGrid(int n) {\n        std::vector<std::string> result;\n        return result;\n    }\n};`,
      javascriptTemplate: `function fizzBuzzGrid(n) {\n    // Write your loop and conditional statements here\n    const result = [];\n    return result;\n}`
    },
    {
      id: 'prob-python-even-squares',
      title: 'Even Squares Sum Filter',
      description: 'Implement an active iteration loop to process an array of numbers. Filter out odd numbers, square the remaining even numbers, and return the sum of those squared even values. If there are no even numbers, return 0.',
      difficulty: 'Easy',
      estimatedTime: '12 min',
      topic: 'Loops & List Processing',
      templateCode: `function sumOfEvenSquares(nums: number[]): number {\n    // Write your loop & filter logic here\n    return 0;\n}`,
      subjectId: 'sub-python',
      subjectName: 'Python Programming',
      points: 20,
      acceptanceRate: '88%',
      chapter: 'Chapter 2: Sequences & Advanced Iterations',
      sampleInput: 'nums = [1, 2, 3, 4]',
      sampleOutput: '20',
      constraints: '0 <= nums.length <= 10^5\n-1000 <= nums[i] <= 1000',
      hints: [
        'Iterate over the array and use the modulo operator (%) to find even numbers.',
        'Square each even number (num * num) and accumulate the values in a running sum variable.'
      ],
      solution: `function sumOfEvenSquares(nums) {\n    let sum = 0;\n    for (let x of nums) {\n        if (x % 2 === 0) {\n            sum += x * x;\n        }\n    }\n    return sum;\n}`,
      videoUrl: '',
      tags: ['Arrays', 'Filters', 'Map-Reduce', 'Math'],
      examples: 'Input: nums = [1, 2, 3, 4]\nExplanation: Even numbers are 2 and 4. 2^2 + 4^2 = 4 + 16 = 20.',
      expectedOutput: '20',
      pythonTemplate: `def sum_of_even_squares(nums: list) -> int:\n    # Write Python list filtering / loop here\n    return 0`,
      javaTemplate: `public class Solution {\n    public int sumOfEvenSquares(int[] nums) {\n        // Write Java loops here\n        return 0;\n    }\n}`,
      cTemplate: `#include <stdio.h>\n\nint sumOfEvenSquares(int* nums, int numsSize) {\n    // Write C iterative accumulator loop here\n    return 0;\n}`,
      cppTemplate: `#include <vector>\n\nclass Solution {\npublic:\n    int sumOfEvenSquares(std::vector<int>& nums) {\n        return 0;\n    }\n};`,
      javascriptTemplate: `function sumOfEvenSquares(nums) {\n    // Write your loop & filter logic here\n    return 0;\n}`
    },
    {
      id: 'prob-python-fibonacci',
      title: 'Fibonacci Series Iterative Generator',
      description: 'Generate an array containing the first \'n\' numbers of the Fibonacci sequence using an iterative loop. If n <= 0, return an empty array. If n === 1, return [0]. Remember, F(0) = 0, F(1) = 1, and F(k) = F(k-1) + F(k-2).',
      difficulty: 'Medium',
      estimatedTime: '18 min',
      topic: 'Iterative Algorithms',
      templateCode: `function fibonacciSeries(n: number): number[] {\n    // Write your loop structure here\n    return [];\n}`,
      subjectId: 'sub-python',
      subjectName: 'Python Programming',
      points: 40,
      acceptanceRate: '81%',
      chapter: 'Chapter 3: Iterative Design Patterns & Stacks',
      sampleInput: 'n = 6',
      sampleOutput: '[0, 1, 1, 2, 3, 5]',
      constraints: '0 <= n <= 50',
      hints: [
        'Initialize the first two numbers as 0 and 1.',
        'Use a loop running from i = 2 up to n, pushing the sum of the last two items.'
      ],
      solution: `function fibonacciSeries(n) {\n    if (n <= 0) return [];\n    if (n === 1) return [0];\n    const series = [0, 1];\n    for (let i = 2; i < n; i++) {\n        series.push(series[i - 1] + series[i - 2]);\n    }\n    return series;\n}`,
      videoUrl: 'https://www.youtube.com/embed/z9G0L6Qc360',
      tags: ['Recursion', 'Iteration', 'Algorithms', 'Fibonacci'],
      examples: 'Input: n = 4\nOutput: [0, 1, 1, 2]',
      expectedOutput: '[0, 1, 1, 2]',
      pythonTemplate: `def fibonacci_series(n: int) -> list:\n    # Write Python dynamic array loops here\n    return []`,
      javaTemplate: `import java.util.*;\n\npublic class Solution {\n    public List<Integer> fibonacciSeries(int n) {\n        List<Integer> result = new ArrayList<>();\n        return result;\n    }\n}`,
      cTemplate: `#include <stdio.h>\n#include <stdlib.h>\n\nint* fibonacciSeries(int n, int* returnSize) {\n    // Allocate C array for sequence\n    *returnSize = n > 0 ? n : 0;\n    if (n <= 0) return NULL;\n    int* res = (int*)malloc(n * sizeof(int));\n    return res;\n}`,
      cppTemplate: `#include <vector>\n\nclass Solution {\npublic:\n    std::vector<int> fibonacciSeries(int n) {\n        return {};\n    }\n};`,
      javascriptTemplate: `function fibonacciSeries(n) {\n    // Write your loop structure here\n    return [];\n}`
    },
    {
      id: 'prob-dbms-inner-join',
      title: 'Database: Simulated Relational INNER JOIN',
      description: 'You have two relational mock tables represented as arrays of objects: \'users\' (each has \'id\' and \'name\') and \'orders\' (each has \'orderId\', \'userId\', and \'amount\'). Write an INNER JOIN simulator function that returns a merged array of combined objects where user \'id\' matches order \'userId\'.',
      difficulty: 'Medium',
      estimatedTime: '20 min',
      topic: 'Relational Joins',
      templateCode: `interface UserRow { id: number; name: string; }\ninterface OrderRow { orderId: number; userId: number; amount: number; }\n\nfunction innerJoinSimulate(users: UserRow[], orders: OrderRow[]): any[] {\n    // Match IDs and return combined records\n    return [];\n}`,
      subjectId: 'sub-dbms',
      subjectName: 'DBMS',
      points: 40,
      acceptanceRate: '75%',
      chapter: 'Chapter 2: Relational Calculus and Queries',
      sampleInput: 'users = [{id: 1, name: "Alice"}, {id: 2, name: "Bob"}], orders = [{orderId: 101, userId: 1, amount: 250}]',
      sampleOutput: '[{id: 1, name: "Alice", orderId: 101, amount: 250}]',
      constraints: '0 <= users.length <= 1000\n0 <= orders.length <= 1000',
      hints: [
        'You can use a nested loop to compare each user id against each order userId.',
        'To optimize, build a hash map of user records keyed by user.id for O(N + M) join time.'
      ],
      solution: `function innerJoinSimulate(users, orders) {\n    const userMap = {};\n    users.forEach(u => userMap[u.id] = u);\n    const result = [];\n    orders.forEach(o => {\n        const u = userMap[o.userId];\n        if (u) {\n            result.push({ ...u, ...o });\n        }\n    });\n    return result;\n}`,
      videoUrl: '',
      tags: ['DBMS', 'Relational', 'Hash-Join', 'Hashing'],
      examples: 'Standard SQL operation: SELECT * FROM users JOIN orders ON users.id = orders.userId;',
      expectedOutput: '[{"id":1,"name":"Alice","orderId":101,"amount":250}]',
      pythonTemplate: `def inner_join_simulate(users: list, orders: list) -> list:\n    # Simulate SQL inner join using python dictionary or list matching\n    return []`,
      javaTemplate: `import java.util.*;\n\npublic class Solution {\n    public List<Map<String, Object>> innerJoinSimulate(List<Map<String, Object>> users, List<Map<String, Object>> orders) {\n        List<Map<String, Object>> result = new ArrayList<>();\n        return result;\n    }\n}`,
      cTemplate: `// C language simulation is skipped / handles generic structures`,
      cppTemplate: `#include <vector>\n#include <map>\n#include <string>\n\nclass Solution {\npublic:\n    std::vector<std::map<std::string, std::string>> innerJoinSimulate() {\n        return {};\n    }\n};`,
      javascriptTemplate: `function innerJoinSimulate(users, orders) {\n    // Match IDs and return combined records\n    return [];\n}`
    },
    {
      id: 'prob-dbms-aggregate',
      title: 'Database: Group-By Category Aggregation',
      description: 'Given an array of transactions containing { category: string, amount: number }, write a function to calculate the total sum of transactions grouped by category. Return an object mapping categories to their sum totals.',
      difficulty: 'Easy',
      estimatedTime: '10 min',
      topic: 'Aggregation Algorithms',
      templateCode: `interface Tx { category: string; amount: number; }\n\nfunction groupBySum(transactions: Tx[]): Record<string, number> {\n    // Group by category and compute SUM totals\n    return {};\n}`,
      subjectId: 'sub-dbms',
      subjectName: 'DBMS',
      points: 25,
      acceptanceRate: '92%',
      chapter: 'Chapter 3: Query Aggregation & Indices',
      sampleInput: 'transactions = [{category: "Food", amount: 12}, {category: "Tech", amount: 1500}, {category: "Food", amount: 18}]',
      sampleOutput: '{"Food": 30, "Tech": 1500}',
      constraints: '0 <= transactions.length <= 10^5',
      hints: [
        'Iterate over each transaction row.',
        'Use an accumulator map (object). If category is not present, initialize it with 0 and add the amount.'
      ],
      solution: `function groupBySum(transactions) {\n    const map = {};\n    for (let t of transactions) {\n        map[t.category] = (map[t.category] || 0) + t.amount;\n    }\n    return map;\n}`,
      videoUrl: '',
      tags: ['DBMS', 'Hash Map', 'Aggregation', 'Reduce'],
      examples: 'Input: [{category: "Rent", amount: 1000}, {category: "Rent", amount: 50}]\nOutput: {"Rent": 1050}',
      expectedOutput: '{"Rent": 1050}',
      pythonTemplate: `def group_by_sum(transactions: list) -> dict:\n    # Python transaction aggregate dictionary summing\n    res = {}\n    return res`,
      javaTemplate: `import java.util.*;\n\npublic class Solution {\n    public Map<String, Double> groupBySum(List<Map<String, Object>> transactions) {\n        Map<String, Double> result = new HashMap<>();\n        return result;\n    }\n}`,
      cTemplate: `// C Language aggregate structure`,
      cppTemplate: `#include <vector>\n#include <string>\n#include <map>\n\nclass Solution {\npublic:\n    std::map<std::string, double> groupBySum() {\n        return {};\n    }\n};`,
      javascriptTemplate: `function groupBySum(transactions) {\n    // Group by category and compute SUM totals\n    return {};\n}`
    },
    {
      id: 'prob-math-matrix-multiply',
      title: 'Math: 2x2 Matrix Multiplication',
      description: 'Write a function to perform matrix multiplication on two 2x2 matrices represented as 2D arrays of numbers. Return the resulting 2x2 matrix as a 2D array. Keep in mind: C_ij = A_i1 * B_1j + A_i2 * B_2j.',
      difficulty: 'Medium',
      estimatedTime: '25 min',
      topic: 'Matrices & Vectors',
      templateCode: `function multiply2x2(matrixA: number[][], matrixB: number[][]): number[][] {\n    // Implement matrix product rows times columns\n    return [[0, 0], [0, 0]];\n}`,
      subjectId: 'sub-math',
      subjectName: 'Linear Algebra',
      points: 50,
      acceptanceRate: '68%',
      chapter: 'Chapter 2: Matrices, Space Transformations & Projections',
      sampleInput: 'matrixA = [[1, 2], [3, 4]], matrixB = [[2, 0], [1, 2]]',
      sampleOutput: '[[4, 4], [10, 8]]',
      constraints: 'Matrix values are integers between -100 and 100',
      hints: [
        'Recall dot product of row i of matrix A with column j of matrix B.',
        'Row 0 Col 0 is A[0][0]*B[0][0] + A[0][1]*B[1][0] = 1*2 + 2*1 = 4.'
      ],
      solution: `function multiply2x2(matrixA, matrixB) {\n    const r = [[0, 0], [0, 0]];\n    r[0][0] = matrixA[0][0] * matrixB[0][0] + matrixA[0][1] * matrixB[1][0];\n    r[0][1] = matrixA[0][0] * matrixB[0][1] + matrixA[0][1] * matrixB[1][1];\n    r[1][0] = matrixA[1][0] * matrixB[0][0] + matrixA[1][1] * matrixB[1][0];\n    r[1][1] = matrixA[1][0] * matrixB[0][1] + matrixA[1][1] * matrixB[1][1];\n    return r;\n}`,
      videoUrl: '',
      tags: ['Linear Algebra', 'Matrices', 'Arrays', 'Multiplication'],
      examples: 'Input: [[1, 0], [0, 1]] (identity) times [[5, 6], [7, 8]] returns [[5, 6], [7, 8]]',
      expectedOutput: '[[5, 6], [7, 8]]',
      pythonTemplate: `def multiply_2x2(matrix_a: list, matrix_b: list) -> list:\n    # Multiply 2x2 matrices in Python\n    return [[0, 0], [0, 0]]`,
      javaTemplate: `public class Solution {\n    public int[][] multiply2x2(int[][] matrixA, int[][] matrixB) {\n        return new int[][]{{0,0},{0,0}};\n    }\n}`,
      cTemplate: `// C language matrix multiplication`,
      cppTemplate: `#include <vector>\n\nclass Solution {\npublic:\n    std::vector<std::vector<int>> multiply2x2(std::vector<std::vector<int>>& matrixA, std::vector<std::vector<int>>& matrixB) {\n        return {{0,0},{0,0}};\n    }\n};`,
      javascriptTemplate: `function multiply2x2(matrixA, matrixB) {\n    return [[0, 0], [0, 0]];\n}`
    },
    {
      id: 'prob-math-dot-product',
      title: 'Vector Dot Product',
      description: 'Given two vectors of the same dimension represented as 1D arrays \'vecA\' and \'vecB\', calculate and return their algebraic dot product (scalar product) using a loop. Return 0 if dimensions are mismatched or empty.',
      difficulty: 'Easy',
      estimatedTime: '10 min',
      topic: 'Vector Algebra',
      templateCode: `function dotProduct(vecA: number[], vecB: number[]): number {\n    // Calculate scalar dot product\n    return 0;\n}`,
      subjectId: 'sub-math',
      subjectName: 'Linear Algebra',
      points: 20,
      acceptanceRate: '96%',
      chapter: 'Chapter 1: Vectors, Spaces & Basis Coordinates',
      sampleInput: 'vecA = [1, 3, -5], vecB = [4, -2, -1]',
      sampleOutput: '3',
      constraints: 'vecA.length === vecB.length\n0 <= vecA.length <= 1000',
      hints: [
        'Iterate through the indices from 0 to length - 1.',
        'Multiply elements at the same index and keep adding them to a running scalar sum.'
      ],
      solution: `function dotProduct(vecA, vecB) {\n    if (vecA.length !== vecB.length) return 0;\n    let sum = 0;\n    for (let i = 0; i < vecA.length; i++) {\n        sum += vecA[i] * vecB[i];\n    }\n    return sum;\n}`,
      videoUrl: '',
      tags: ['Vector Algebra', 'Math', 'Linear Algebra', 'Accumulate'],
      examples: 'Input: vecA = [1, 2], vecB = [3, 4] -> 1*3 + 2*4 = 11',
      expectedOutput: '11',
      pythonTemplate: `def dot_product(vec_a: list, vec_b: list) -> float:\n    # Python loop scalar product\n    return 0.0`,
      javaTemplate: `public class Solution {\n    public double dotProduct(double[] vecA, double[] vecB) {\n        return 0.0;\n    }\n}`,
      cTemplate: `double dotProduct(double* vecA, double* vecB, int size) {\n    return 0.0;\n}`,
      cppTemplate: `#include <vector>\n\nclass Solution {\npublic:\n    double dotProduct(const std::vector<double>& vecA, const std::vector<double>& vecB) {\n        return 0.0;\n    }\n};`,
      javascriptTemplate: `function dotProduct(vecA, vecB) {\n    return 0;\n}`
    },
    {
      id: 'prob-english-count',
      title: 'Word & Sentence Count Metrics',
      description: 'To evaluate readability scores of technical documents, write a text analyzer that returns the count of words and count of sentences in a given paragraphs string. A word is any space-separated sequence, and a sentence ends with a period \'.\', exclamation mark \'!\', or question mark \'?\'.',
      difficulty: 'Easy',
      estimatedTime: '15 min',
      topic: 'String Tokenization',
      templateCode: `function analyzeTextMetrics(text: string): { words: number; sentences: number } {\n    // Parse text and return metric counts\n    return { words: 0, sentences: 0 };\n}`,
      subjectId: 'sub-english',
      subjectName: 'Technical Writing',
      points: 30,
      acceptanceRate: '89%',
      chapter: 'Chapter 2: Structural Readability & Syntax Metrics',
      sampleInput: 'text = "Hello student! Are you ready? Let us compile code."',
      sampleOutput: '{"words": 10, "sentences": 3}',
      constraints: '0 <= text.length <= 10^5',
      hints: [
        'Count words by splitting the text on spaces. Filter out any empty items.',
        'Count sentences by counting occurrences of character terminal delimiters (\'.\', \'!\', \'?\').'
      ],
      solution: `function analyzeTextMetrics(text) {\n    if (!text.trim()) return { words: 0, sentences: 0 };\n    const wordsList = text.trim().split(/\\s+/).filter(w => w.length > 0);\n    const words = wordsList.length;\n    let sentences = 0;\n    for (let char of text) {\n        if (char === \'.\' || char === \'!\' || char === \'?\') {\n            sentences++;\n        }\n    }\n    return { words, sentences: sentences || 1 };\n}`,
      videoUrl: '',
      tags: ['String Manipulation', 'NLP', 'Parsing'],
      examples: 'Input: "Write reports. Save docs!" -> Words: 4, Sentences: 2',
      expectedOutput: '{"words": 4, "sentences": 2}',
      pythonTemplate: `def analyze_text_metrics(text: str) -> dict:\n    # Python string parser\n    return {"words": 0, "sentences": 0}`,
      javaTemplate: `import java.util.*;\n\npublic class Solution {\n    public Map<String, Integer> analyzeTextMetrics(String text) {\n        Map<String, Integer> result = new HashMap<>();\n        return result;\n    }\n}`,
      cTemplate: `// C string parser`,
      cppTemplate: `#include <string>\n#include <map>\n\nclass Solution {\npublic:\n    std::map<std::string, int> analyzeTextMetrics(std::string text) {\n        return {};\n    }\n};`,
      javascriptTemplate: `function analyzeTextMetrics(text) {\n    return { words: 0, sentences: 0 };\n}`
    }
  ];
  writeData(challengesFile, seedChallenges);

  // Seed weekly assessments
  const seedAssessments: WeeklyAssessment[] = [
    {
      id: 'ass-python-w1',
      userId: 'user-demo',
      subjectId: 'sub-python',
      subjectName: 'Python Programming',
      weekNumber: 1,
      title: 'Week 1 Assessment: Closures & Advanced Decorators',
      description: 'This assessment validates your grasp of lexical scope, nested namespaces, closures, function wrapper structures, and chaining decorators.',
      questions: [
        'Describe lexical environment and explain how a closure remembers its outer scope variables in Python.',
        'Why do decorated functions lose their __name__ and docstring attributes? Explain how functools.wraps solves this.',
        'Write out a custom python decorator @time_logger that logs the execution duration of any function it decorates.'
      ],
      status: 'pending',
      date: todayStr
    },
    {
      id: 'ass-dbms-w1',
      userId: 'user-demo',
      subjectId: 'sub-dbms',
      subjectName: 'DBMS',
      weekNumber: 1,
      title: 'Week 1 Assessment: Relational Algebra & Joins',
      description: 'Analyze physical database operators, Cartesian products, inner/outer joins, and how indexes speed up table unions.',
      questions: [
        'Compare Cartesian Product (CROSS JOIN) with INNER JOIN conceptually and computationally.',
        'Differentiate between Nested Loop Join, Hash Join, and Sort-Merge Join execution strategies.',
        'How does a B-Tree index specifically speed up a join condition like A.id = B.foreign_id?'
      ],
      status: 'pending',
      date: todayStr
    },
    {
      id: 'ass-math-w1',
      userId: 'user-demo',
      subjectId: 'sub-math',
      subjectName: 'Linear Algebra',
      weekNumber: 1,
      title: 'Week 1 Assessment: Linear Systems & Vector Spaces',
      description: 'Test your understanding of linear independence, subspace spanning, and kernel matrices.',
      questions: [
        'Explain the geometric interpretation of a linearly independent set of vectors in 3D space.',
        'Define the Span of a set of vectors and explain the condition for a subset to form a valid Subspace.',
        'What is the relation between the Null Space (Kernel) of a matrix A and the existence of unique solutions to Ax = b?'
      ],
      status: 'pending',
      date: todayStr
    },
    {
      id: 'ass-english-w1',
      userId: 'user-demo',
      subjectId: 'sub-english',
      subjectName: 'Technical Writing',
      weekNumber: 1,
      title: 'Week 1 Assessment: Audience & Clarity Analysis',
      description: 'Focuses on writing active style guides, plain text specifications, and target formatting analysis.',
      questions: [
        'How does technical communication change when targeting an executive board vs. active engineering team?',
        'Give an example of transforming a passive-voice bloated sentence into clear active-voice phrasing.',
        'What are the core styling structural elements required to write a successful project grant proposal?'
      ],
      status: 'pending',
      date: todayStr
    }
  ];
  writeData(assessmentsFile, seedAssessments);

  // Seed feedbacks
  const initialFeedbacks = db.getFeedbacks('user-demo');
  if (initialFeedbacks.length === 0) {
    const seedFeedbacks: CourseFeedback[] = [
      {
        id: 'fb-1',
        userId: 'user-demo',
        subjectId: 'sub-python',
        subjectName: 'Python Programming',
        rating: 5,
        generalFeedback: 'The class is extremely practical and hands-on. I love learning advanced decorators and generators because it makes my code so much cleaner.',
        enjoyedMost: 'Practical coding exercises with the AI StudyBuddy and the detailed feedback on mock interviews.',
        strugglingWith: 'Multithreading and multiprocessing concepts are still a bit challenging.',
        date: todayStr
      },
      {
        id: 'fb-2',
        userId: 'user-demo',
        subjectId: 'sub-dbms',
        subjectName: 'DBMS',
        rating: 4,
        generalFeedback: 'Database design concepts are well explained. Understanding normalization through ER mapping exercises has been super helpful.',
        enjoyedMost: 'Query execution plan analysis and learning about B-Tree index structure.',
        strugglingWith: 'ACID transactions and concurrency control isolation levels.',
        date: todayStr
      }
    ];
    writeData(feedbacksFile, seedFeedbacks);
  }
}

// Unconditionally refresh challenges.json to populate newly added chapter, hints, examples, videoUrl, and multi-language code templates
const freshChallenges: ProblemChallenge[] = [
  {
    id: 'prob-python-loops',
    title: 'FizzBuzz Grid Loop',
    description: 'Write a function that iterates from 1 to a given number \'n\' (inclusive) using a loop. For each integer, check conditions:\n- If divisible by 3, add "Fizz" to the resulting list.\n- If divisible by 5, add "Buzz" to the resulting list.\n- If divisible by both 3 and 5, add "FizzBuzz".\n- Otherwise, add the string representation of the number.',
    difficulty: 'Easy',
    estimatedTime: '10 min',
    topic: 'Loops & Conditions',
    templateCode: `function fizzBuzzGrid(n: number): string[] {\n    // Write your loop and conditional statements here\n    const result: string[] = [];\n    return result;\n}`,
    subjectId: 'sub-python',
    subjectName: 'Python Programming',
    points: 20,
    acceptanceRate: '94%',
    chapter: 'Chapter 1: Loops and Conditional Statements',
    sampleInput: 'n = 15',
    sampleOutput: '["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"]',
    constraints: '1 <= n <= 1000',
    hints: [
      'Use a standard for-loop starting at 1 and ending at n.',
      'Be careful to check divisibility by both 3 and 5 first, using modulo operator i % 15 === 0.'
    ],
    solution: `function fizzBuzzGrid(n) {\n    const result = [];\n    for (let i = 1; i <= n; i++) {\n        if (i % 3 === 0 && i % 5 === 0) result.push("FizzBuzz");\n        else if (i % 3 === 0) result.push("Fizz");\n        else if (i % 5 === 0) result.push("Buzz");\n        else result.push(i.toString());\n    }\n    return result;\n}`,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    tags: ['Loops', 'Conditionals', 'Math', 'Modulo'],
    examples: 'Input: n = 5\nOutput: ["1", "2", "Fizz", "4", "Buzz"]',
    expectedOutput: '["1", "2", "Fizz", "4", "Buzz"]',
    pythonTemplate: `def fizz_buzz_grid(n: int) -> list:\n    # Write your Python loop & condition here\n    result = []\n    return result`,
    javaTemplate: `import java.util.*;\n\npublic class Solution {\n    public List<String> fizzBuzzGrid(int n) {\n        List<String> result = new ArrayList<>();\n        // Write your Java loops here\n        return result;\n    }\n}`,
    cTemplate: `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nchar** fizzBuzzGrid(int n, int* returnSize) {\n    // Allocate and return an array of strings\n    *returnSize = n;\n    char** res = (char**)malloc(n * sizeof(char*));\n    return res;\n}`,
    cppTemplate: `#include <vector>\n#include <string>\n\nclass Solution {\npublic:\n    std::vector<std::string> fizzBuzzGrid(int n) {\n        std::vector<std::string> result;\n        return result;\n    }\n};`,
    javascriptTemplate: `function fizzBuzzGrid(n) {\n    // Write your loop and conditional statements here\n    const result = [];\n    return result;\n}`
  },
  {
    id: 'prob-python-even-squares',
    title: 'Even Squares Sum Filter',
    description: 'Implement an active iteration loop to process an array of numbers. Filter out odd numbers, square the remaining even numbers, and return the sum of those squared even values. If there are no even numbers, return 0.',
    difficulty: 'Easy',
    estimatedTime: '12 min',
    topic: 'Loops & List Processing',
    templateCode: `function sumOfEvenSquares(nums: number[]): number {\n    // Write your loop & filter logic here\n    return 0;\n}`,
    subjectId: 'sub-python',
    subjectName: 'Python Programming',
    points: 20,
    acceptanceRate: '88%',
    chapter: 'Chapter 2: Sequences & Advanced Iterations',
    sampleInput: 'nums = [1, 2, 3, 4]',
    sampleOutput: '20',
    constraints: '0 <= nums.length <= 10^5\n-1000 <= nums[i] <= 1000',
    hints: [
      'Iterate over the array and use the modulo operator (%) to find even numbers.',
      'Square each even number (num * num) and accumulate the values in a running sum variable.'
    ],
    solution: `function sumOfEvenSquares(nums) {\n    let sum = 0;\n    for (let x of nums) {\n        if (x % 2 === 0) {\n            sum += x * x;\n        }\n    }\n    return sum;\n}`,
    videoUrl: '',
    tags: ['Arrays', 'Filters', 'Map-Reduce', 'Math'],
    examples: 'Input: nums = [1, 2, 3, 4]\nExplanation: Even numbers are 2 and 4. 2^2 + 4^2 = 4 + 16 = 20.',
    expectedOutput: '20',
    pythonTemplate: `def sum_of_even_squares(nums: list) -> int:\n    # Write Python list filtering / loop here\n    return 0`,
    javaTemplate: `public class Solution {\n    public int sumOfEvenSquares(int[] nums) {\n        // Write Java loops here\n        return 0;\n    }\n}`,
    cTemplate: `#include <stdio.h>\n\nint sumOfEvenSquares(int* nums, int numsSize) {\n    // Write C iterative accumulator loop here\n    return 0;\n}`,
    cppTemplate: `#include <vector>\n\nclass Solution {\npublic:\n    int sumOfEvenSquares(std::vector<int>& nums) {\n        return 0;\n    }\n};`,
    javascriptTemplate: `function sumOfEvenSquares(nums) {\n    // Write your loop & filter logic here\n    return 0;\n}`
  },
  {
    id: 'prob-python-fibonacci',
    title: 'Fibonacci Series Iterative Generator',
    description: 'Generate an array containing the first \'n\' numbers of the Fibonacci sequence using an iterative loop. If n <= 0, return an empty array. If n === 1, return [0]. Remember, F(0) = 0, F(1) = 1, and F(k) = F(k-1) + F(k-2).',
    difficulty: 'Medium',
    estimatedTime: '18 min',
    topic: 'Iterative Algorithms',
    templateCode: `function fibonacciSeries(n: number): number[] {\n    // Write your loop structure here\n    return [];\n}`,
    subjectId: 'sub-python',
    subjectName: 'Python Programming',
    points: 40,
    acceptanceRate: '81%',
    chapter: 'Chapter 3: Iterative Design Patterns & Stacks',
    sampleInput: 'n = 6',
    sampleOutput: '[0, 1, 1, 2, 3, 5]',
    constraints: '0 <= n <= 50',
    hints: [
      'Initialize the first two numbers as 0 and 1.',
      'Use a loop running from i = 2 up to n, pushing the sum of the last two items.'
    ],
    solution: `function fibonacciSeries(n) {\n    if (n <= 0) return [];\n    if (n === 1) return [0];\n    const series = [0, 1];\n    for (let i = 2; i < n; i++) {\n        series.push(series[i - 1] + series[i - 2]);\n    }\n    return series;\n}`,
    videoUrl: 'https://www.youtube.com/embed/z9G0L6Qc360',
    tags: ['Recursion', 'Iteration', 'Algorithms', 'Fibonacci'],
    examples: 'Input: n = 4\nOutput: [0, 1, 1, 2]',
    expectedOutput: '[0, 1, 1, 2]',
    pythonTemplate: `def fibonacci_series(n: int) -> list:\n    # Write Python dynamic array loops here\n    return []`,
    javaTemplate: `import java.util.*;\n\npublic class Solution {\n    public List<Integer> fibonacciSeries(int n) {\n        List<Integer> result = new ArrayList<>();\n        return result;\n    }\n}`,
    cTemplate: `#include <stdio.h>\n#include <stdlib.h>\n\nint* fibonacciSeries(int n, int* returnSize) {\n    // Allocate C array for sequence\n    *returnSize = n > 0 ? n : 0;\n    if (n <= 0) return NULL;\n    int* res = (int*)malloc(n * sizeof(int));\n    return res;\n}`,
    cppTemplate: `#include <vector>\n\nclass Solution {\npublic:\n    std::vector<int> fibonacciSeries(int n) {\n        return {};\n    }\n};`,
    javascriptTemplate: `function fibonacciSeries(n) {\n    // Write your loop structure here\n    return [];\n}`
  },
  {
    id: 'prob-dbms-inner-join',
    title: 'Database: Simulated Relational INNER JOIN',
    description: 'You have two relational mock tables represented as arrays of objects: \'users\' (each has \'id\' and \'name\') and \'orders\' (each has \'orderId\', \'userId\', and \'amount\'). Write an INNER JOIN simulator function that returns a merged array of combined objects where user \'id\' matches order \'userId\'.',
    difficulty: 'Medium',
    estimatedTime: '20 min',
    topic: 'Relational Joins',
    templateCode: `interface UserRow { id: number; name: string; }\ninterface OrderRow { orderId: number; userId: number; amount: number; }\n\nfunction innerJoinSimulate(users: UserRow[], orders: OrderRow[]): any[] {\n    // Match IDs and return combined records\n    return [];\n}`,
    subjectId: 'sub-dbms',
    subjectName: 'DBMS',
    points: 40,
    acceptanceRate: '75%',
    chapter: 'Chapter 2: Relational Calculus and Queries',
    sampleInput: 'users = [{id: 1, name: "Alice"}, {id: 2, name: "Bob"}], orders = [{orderId: 101, userId: 1, amount: 250}]',
    sampleOutput: '[{id: 1, name: "Alice", orderId: 101, amount: 250}]',
    constraints: '0 <= users.length <= 1000\n0 <= orders.length <= 1000',
    hints: [
      'You can use a nested loop to compare each user id against each order userId.',
      'To optimize, build a hash map of user records keyed by user.id for O(N + M) join time.'
    ],
    solution: `function innerJoinSimulate(users, orders) {\n    const userMap = {};\n    users.forEach(u => userMap[u.id] = u);\n    const result = [];\n    orders.forEach(o => {\n        const u = userMap[o.userId];\n        if (u) {\n            result.push({ ...u, ...o });\n        }\n    });\n    return result;\n}`,
    videoUrl: '',
    tags: ['DBMS', 'Relational', 'Hash-Join', 'Hashing'],
    examples: 'Standard SQL operation: SELECT * FROM users JOIN orders ON users.id = orders.userId;',
    expectedOutput: '[{"id":1,"name":"Alice","orderId":101,"amount":250}]',
    pythonTemplate: `def inner_join_simulate(users: list, orders: list) -> list:\n    # Simulate SQL inner join using python dictionary or list matching\n    return []`,
    javaTemplate: `import java.util.*;\n\npublic class Solution {\n    public List<Map<String, Object>> innerJoinSimulate(List<Map<String, Object>> users, List<Map<String, Object>> orders) {\n        List<Map<String, Object>> result = new ArrayList<>();\n        return result;\n    }\n}`,
    cTemplate: `// C language simulation is skipped / handles generic structures`,
    cppTemplate: `#include <vector>\n#include <map>\n#include <string>\n\nclass Solution {\npublic:\n    std::vector<std::map<std::string, std::string>> innerJoinSimulate() {\n        return {};\n    }\n};`,
    javascriptTemplate: `function innerJoinSimulate(users, orders) {\n    // Match IDs and return combined records\n    return [];\n}`
  },
  {
    id: 'prob-dbms-aggregate',
    title: 'Database: Group-By Category Aggregation',
    description: 'Given an array of transactions containing { category: string, amount: number }, write a function to calculate the total sum of transactions grouped by category. Return an object mapping categories to their sum totals.',
    difficulty: 'Easy',
    estimatedTime: '10 min',
    topic: 'Aggregation Algorithms',
    templateCode: `interface Tx { category: string; amount: number; }\n\nfunction groupBySum(transactions: Tx[]): Record<string, number> {\n    // Group by category and compute SUM totals\n    return {};\n}`,
    subjectId: 'sub-dbms',
    subjectName: 'DBMS',
    points: 25,
    acceptanceRate: '92%',
    chapter: 'Chapter 3: Query Aggregation & Indices',
    sampleInput: 'transactions = [{category: "Food", amount: 12}, {category: "Tech", amount: 1500}, {category: "Food", amount: 18}]',
    sampleOutput: '{"Food": 30, "Tech": 1500}',
    constraints: '0 <= transactions.length <= 10^5',
    hints: [
      'Iterate over each transaction row.',
      'Use an accumulator map (object). If category is not present, initialize it with 0 and add the amount.'
    ],
    solution: `function groupBySum(transactions) {\n    const map = {};\n    for (let t of transactions) {\n        map[t.category] = (map[t.category] || 0) + t.amount;\n    }\n    return map;\n}`,
    videoUrl: '',
    tags: ['DBMS', 'Hash Map', 'Aggregation', 'Reduce'],
    examples: 'Input: [{category: "Rent", amount: 1000}, {category: "Rent", amount: 50}]\nOutput: {"Rent": 1050}',
    expectedOutput: '{"Rent": 1050}',
    pythonTemplate: `def group_by_sum(transactions: list) -> dict:\n    # Python transaction aggregate dictionary summing\n    res = {}\n    return res`,
    javaTemplate: `import java.util.*;\n\npublic class Solution {\n    public Map<String, Double> groupBySum(List<Map<String, Object>> transactions) {\n        Map<String, Double> result = new HashMap<>();\n        return result;\n    }\n}`,
    cTemplate: `// C Language aggregate structure`,
    cppTemplate: `#include <vector>\n#include <string>\n#include <map>\n\nclass Solution {\npublic:\n    std::map<std::string, double> groupBySum() {\n        return {};\n    }\n};`,
    javascriptTemplate: `function groupBySum(transactions) {\n    // Group by category and compute SUM totals\n    return {};\n}`
  },
  {
    id: 'prob-math-matrix-multiply',
    title: 'Math: 2x2 Matrix Multiplication',
    description: 'Write a function to perform matrix multiplication on two 2x2 matrices represented as 2D arrays of numbers. Return the resulting 2x2 matrix as a 2D array. Keep in mind: C_ij = A_i1 * B_1j + A_i2 * B_2j.',
    difficulty: 'Medium',
    estimatedTime: '25 min',
    topic: 'Matrices & Vectors',
    templateCode: `function multiply2x2(matrixA: number[][], matrixB: number[][]): number[][] {\n    // Implement matrix product rows times columns\n    return [[0, 0], [0, 0]];\n}`,
    subjectId: 'sub-math',
    subjectName: 'Linear Algebra',
    points: 50,
    acceptanceRate: '68%',
    chapter: 'Chapter 2: Matrices, Space Transformations & Projections',
    sampleInput: 'matrixA = [[1, 2], [3, 4]], matrixB = [[2, 0], [1, 2]]',
    sampleOutput: '[[4, 4], [10, 8]]',
    constraints: 'Matrix values are integers between -100 and 100',
    hints: [
      'Recall dot product of row i of matrix A with column j of matrix B.',
      'Row 0 Col 0 is A[0][0]*B[0][0] + A[0][1]*B[1][0] = 1*2 + 2*1 = 4.'
    ],
    solution: `function multiply2x2(matrixA, matrixB) {\n    const r = [[0, 0], [0, 0]];\n    r[0][0] = matrixA[0][0] * matrixB[0][0] + matrixA[0][1] * matrixB[1][0];\n    r[0][1] = matrixA[0][0] * matrixB[0][1] + matrixA[0][1] * matrixB[1][1];\n    r[1][0] = matrixA[1][0] * matrixB[0][0] + matrixA[1][1] * matrixB[1][0];\n    r[1][1] = matrixA[1][0] * matrixB[0][1] + matrixA[1][1] * matrixB[1][1];\n    return r;\n}`,
    videoUrl: '',
    tags: ['Linear Algebra', 'Matrices', 'Arrays', 'Multiplication'],
    examples: 'Input: [[1, 0], [0, 1]] (identity) times [[5, 6], [7, 8]] returns [[5, 6], [7, 8]]',
    expectedOutput: '[[5, 6], [7, 8]]',
    pythonTemplate: `def multiply_2x2(matrix_a: list, matrix_b: list) -> list:\n    # Multiply 2x2 matrices in Python\n    return [[0, 0], [0, 0]]`,
    javaTemplate: `public class Solution {\n    public int[][] multiply2x2(int[][] matrixA, int[][] matrixB) {\n        return new int[][]{{0,0},{0,0}};\n    }\n}`,
    cTemplate: `// C language matrix multiplication`,
    cppTemplate: `#include <vector>\n\nclass Solution {\npublic:\n    std::vector<std::vector<int>> multiply2x2(std::vector<std::vector<int>>& matrixA, std::vector<std::vector<int>>& matrixB) {\n        return {{0,0},{0,0}};\n    }\n};`,
    javascriptTemplate: `function multiply2x2(matrixA, matrixB) {\n    return [[0, 0], [0, 0]];\n}`
  },
  {
    id: 'prob-math-dot-product',
    title: 'Vector Dot Product',
    description: 'Given two vectors of the same dimension represented as 1D arrays \'vecA\' and \'vecB\', calculate and return their algebraic dot product (scalar product) using a loop. Return 0 if dimensions are mismatched or empty.',
    difficulty: 'Easy',
    estimatedTime: '10 min',
    topic: 'Vector Algebra',
    templateCode: `function dotProduct(vecA: number[], vecB: number[]): number {\n    // Calculate scalar dot product\n    return 0;\n}`,
    subjectId: 'sub-math',
    subjectName: 'Linear Algebra',
    points: 20,
    acceptanceRate: '96%',
    chapter: 'Chapter 1: Vectors, Spaces & Basis Coordinates',
    sampleInput: 'vecA = [1, 3, -5], vecB = [4, -2, -1]',
    sampleOutput: '3',
    constraints: 'vecA.length === vecB.length\n0 <= vecA.length <= 1000',
    hints: [
      'Iterate through the indices from 0 to length - 1.',
      'Multiply elements at the same index and keep adding them to a running scalar sum.'
    ],
    solution: `function dotProduct(vecA, vecB) {\n    if (vecA.length !== vecB.length) return 0;\n    let sum = 0;\n    for (let i = 0; i < vecA.length; i++) {\n        sum += vecA[i] * vecB[i];\n    }\n    return sum;\n}`,
    videoUrl: '',
    tags: ['Vector Algebra', 'Math', 'Linear Algebra', 'Accumulate'],
    examples: 'Input: vecA = [1, 2], vecB = [3, 4] -> 1*3 + 2*4 = 11',
    expectedOutput: '11',
    pythonTemplate: `def dot_product(vec_a: list, vec_b: list) -> float:\n    # Python loop scalar product\n    return 0.0`,
    javaTemplate: `public class Solution {\n    public double dotProduct(double[] vecA, double[] vecB) {\n        return 0.0;\n    }\n}`,
    cTemplate: `double dotProduct(double* vecA, double* vecB, int size) {\n    return 0.0;\n}`,
    cppTemplate: `#include <vector>\n\nclass Solution {\npublic:\n    double dotProduct(const std::vector<double>& vecA, const std::vector<double>& vecB) {\n        return 0.0;\n    }\n};`,
    javascriptTemplate: `function dotProduct(vecA, vecB) {\n    return 0;\n}`
  },
  {
    id: 'prob-english-count',
    title: 'Word & Sentence Count Metrics',
    description: 'To evaluate readability scores of technical documents, write a text analyzer that returns the count of words and count of sentences in a given paragraphs string. A word is any space-separated sequence, and a sentence ends with a period \'.\', exclamation mark \'!\', or question mark \'?\'.',
    difficulty: 'Easy',
    estimatedTime: '15 min',
    topic: 'String Tokenization',
    templateCode: `function analyzeTextMetrics(text: string): { words: number; sentences: number } {\n    // Parse text and return metric counts\n    return { words: 0, sentences: 0 };\n}`,
    subjectId: 'sub-english',
    subjectName: 'Technical Writing',
    points: 30,
    acceptanceRate: '89%',
    chapter: 'Chapter 2: Structural Readability & Syntax Metrics',
    sampleInput: 'text = "Hello student! Are you ready? Let us compile code."',
    sampleOutput: '{"words": 10, "sentences": 3}',
    constraints: '0 <= text.length <= 10^5',
    hints: [
      'Count words by splitting the text on spaces. Filter out any empty items.',
      'Count sentences by counting occurrences of character terminal delimiters (\'.\', \'!\', \'?\').'
    ],
    solution: `function analyzeTextMetrics(text) {\n    if (!text.trim()) return { words: 0, sentences: 0 };\n    const wordsList = text.trim().split(/\\s+/).filter(w => w.length > 0);\n    const words = wordsList.length;\n    let sentences = 0;\n    for (let char of text) {\n        if (char === \'.\' || char === \'!\' || char === \'?\') {\n            sentences++;\n        }\n    }\n    return { words, sentences: sentences || 1 };\n}`,
    videoUrl: '',
    tags: ['String Manipulation', 'NLP', 'Parsing'],
    examples: 'Input: "Write reports. Save docs!" -> Words: 4, Sentences: 2',
    expectedOutput: '{"words": 4, "sentences": 2}',
    pythonTemplate: `def analyze_text_metrics(text: str) -> dict:\n    # Python string parser\n    return {"words": 0, "sentences": 0}`,
    javaTemplate: `import java.util.*;\n\npublic class Solution {\n    public Map<String, Integer> analyzeTextMetrics(String text) {\n        Map<String, Integer> result = new HashMap<>();\n        return result;\n    }\n}`,
    cTemplate: `// C string parser`,
    cppTemplate: `#include <string>\n#include <map>\n\nclass Solution {\npublic:\n    std::map<std::string, int> analyzeTextMetrics(std::string text) {\n        return {};\n    }\n};`,
    javascriptTemplate: `function analyzeTextMetrics(text) {\n    return { words: 0, sentences: 0 };\n}`
  }
];

writeData(challengesFile, freshChallenges);


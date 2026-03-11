import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Subject {
  id: string;
  name: string;
  icon: string;
  questionsCount: number;
}

export interface Question {
  id: string;
  subjectId: string;
  content: string;
  type: 'multiple-choice';
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Session {
  id: string;
  subjectId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  date: string;
}

export interface AppState {
  subjects: Subject[];
  questions: Question[];
  sessions: Session[];
  progress: {
    totalAttempts: number;
    averageScore: number;
    streakDays: number;
    weakTopics: string[];
  };
  settings: {
    soundEnabled: boolean;
    autoSave: boolean;
    apiKey: string;
    model: string;
  };
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  addSubject: (subject: Subject) => void;
  deleteSubject: (id: string) => void;
  addQuestion: (question: Question) => void;
  addQuestions: (questions: Question[]) => void;
  updateQuestion: (id: string, question: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
  addSession: (session: Session) => void;
  resetData: () => void;
}

const initialDemoSubjects: Subject[] = [
  { id: 'sub-1', name: 'Toán Học', icon: 'calculator', questionsCount: 5 },
  { id: 'sub-2', name: 'Lịch Sử', icon: 'book', questionsCount: 5 },
  { id: 'sub-3', name: 'Khoa Học', icon: 'flask-conical', questionsCount: 5 },
];

const initialDemoQuestions: Question[] = [
  {
    id: 'q-1', subjectId: 'sub-1', content: '1 + 1 bằng mấy?', type: 'multiple-choice',
    options: ['1', '2', '3', '4'], correctAnswer: 1, explanation: 'Phép cộng cơ bản.', difficulty: 'easy'
  },
  {
    id: 'q-2', subjectId: 'sub-1', content: 'Căn bậc hai của 16 là?', type: 'multiple-choice',
    options: ['2', '4', '8', '16'], correctAnswer: 1, explanation: '4 * 4 = 16.', difficulty: 'easy'
  },
  {
    id: 'q-3', subjectId: 'sub-1', content: 'Đạo hàm của x^2 là?', type: 'multiple-choice',
    options: ['x', '2x', 'x^2', '2'], correctAnswer: 1, explanation: 'Quy tắc đạo hàm cơ bản.', difficulty: 'medium'
  },
  {
    id: 'q-4', subjectId: 'sub-1', content: 'Tích phân của 2x là?', type: 'multiple-choice',
    options: ['x^2', 'x', '2', 'x^2 + C'], correctAnswer: 3, explanation: 'Tích phân bất định cần có hằng số C.', difficulty: 'medium'
  },
  {
    id: 'q-5', subjectId: 'sub-1', content: 'Số Pi xấp xỉ bằng?', type: 'multiple-choice',
    options: ['3.14', '3.15', '3.16', '3.17'], correctAnswer: 0, explanation: 'Giá trị xấp xỉ của Pi là 3.14159...', difficulty: 'easy'
  },
];

function calculateProgress(sessions: Session[], subjects: Subject[], questions: Question[]) {
  const totalAttempts = sessions.length;
  const averageScore = totalAttempts > 0
    ? Math.round(sessions.reduce((sum, s) => sum + (s.correctAnswers / Math.max(s.totalQuestions, 1)) * 100, 0) / totalAttempts)
    : 0;

  // Calculate streak days
  const uniqueDays = [...new Set(sessions.map(s => s.date.split('T')[0]))].sort().reverse();
  let streakDays = 0;
  const today = new Date().toISOString().split('T')[0];
  for (let i = 0; i < uniqueDays.length; i++) {
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() - i);
    const expected = expectedDate.toISOString().split('T')[0];
    if (uniqueDays[i] === expected) {
      streakDays++;
    } else {
      break;
    }
  }

  // Find weak topics (subjects with lowest average score)
  const subjectScores: Record<string, { total: number; count: number }> = {};
  sessions.forEach(s => {
    if (!subjectScores[s.subjectId]) {
      subjectScores[s.subjectId] = { total: 0, count: 0 };
    }
    subjectScores[s.subjectId].total += (s.correctAnswers / Math.max(s.totalQuestions, 1)) * 100;
    subjectScores[s.subjectId].count++;
  });

  const weakTopics = Object.entries(subjectScores)
    .map(([id, data]) => ({ id, avg: data.total / data.count }))
    .filter(s => s.avg < 60)
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 3)
    .map(s => subjects.find(sub => sub.id === s.id)?.name || s.id);

  return { totalAttempts, averageScore, streakDays, weakTopics };
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      subjects: initialDemoSubjects,
      questions: initialDemoQuestions,
      sessions: [],
      progress: {
        totalAttempts: 0,
        averageScore: 0,
        streakDays: 0,
        weakTopics: [],
      },
      settings: {
        soundEnabled: true,
        autoSave: true,
        apiKey: '',
        model: 'gemini-2.5-flash',
      },
      setApiKey: (key) => set((state) => ({ settings: { ...state.settings, apiKey: key } })),
      setModel: (model) => set((state) => ({ settings: { ...state.settings, model } })),
      addSubject: (subject) => set((state) => ({ subjects: [...state.subjects, subject] })),
      deleteSubject: (id) => set((state) => ({
        subjects: state.subjects.filter((s) => s.id !== id),
        questions: state.questions.filter((q) => q.subjectId !== id),
      })),
      addQuestion: (question) => set((state) => ({ questions: [...state.questions, question] })),
      addQuestions: (questions) => set((state) => ({ questions: [...state.questions, ...questions] })),
      updateQuestion: (id, question) => set((state) => ({
        questions: state.questions.map((q) => (q.id === id ? { ...q, ...question } : q)),
      })),
      deleteQuestion: (id) => set((state) => ({
        questions: state.questions.filter((q) => q.id !== id),
      })),
      addSession: (session) => set((state) => {
        const newSessions = [...state.sessions, session];
        const progress = calculateProgress(newSessions, state.subjects, state.questions);
        return { sessions: newSessions, progress };
      }),
      resetData: () => set({
        subjects: initialDemoSubjects,
        questions: initialDemoQuestions,
        sessions: [],
        progress: { totalAttempts: 0, averageScore: 0, streakDays: 0, weakTopics: [] },
      }),
    }),
    {
      name: 'caro-edu-storage',
    }
  )
);

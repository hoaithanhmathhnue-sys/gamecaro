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
    boardSize: 4 | 5 | 6;
  };
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setBoardSize: (size: 4 | 5 | 6) => void;
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
  { id: 'sub-1', name: 'Toán Học', icon: 'calculator', questionsCount: 10 },
  { id: 'sub-2', name: 'Lịch Sử', icon: 'book', questionsCount: 10 },
  { id: 'sub-3', name: 'Tin Học', icon: 'flask-conical', questionsCount: 10 },
];

const initialDemoQuestions: Question[] = [
  // ===== TOÁN HỌC (10 câu) =====
  {
    id: 'q-1', subjectId: 'sub-1', content: '$1 + 1$ bằng mấy?', type: 'multiple-choice',
    options: ['1', '2', '3', '4'], correctAnswer: 1, explanation: 'Phép cộng cơ bản.', difficulty: 'easy'
  },
  {
    id: 'q-2', subjectId: 'sub-1', content: '$\\sqrt{16}$ bằng bao nhiêu?', type: 'multiple-choice',
    options: ['2', '4', '8', '16'], correctAnswer: 1, explanation: '$4 \\times 4 = 16$.', difficulty: 'easy'
  },
  {
    id: 'q-3', subjectId: 'sub-1', content: 'Đạo hàm của $x^2$ là?', type: 'multiple-choice',
    options: ['$x$', '$2x$', '$x^2$', '$2$'], correctAnswer: 1, explanation: 'Quy tắc đạo hàm: $(x^n)\' = nx^{n-1}$.', difficulty: 'medium'
  },
  {
    id: 'q-4', subjectId: 'sub-1', content: '$\\int 2x \\, dx$ bằng?', type: 'multiple-choice',
    options: ['$x^2$', '$x$', '$2$', '$x^2 + C$'], correctAnswer: 3, explanation: 'Tích phân bất định cần có hằng số $C$.', difficulty: 'medium'
  },
  {
    id: 'q-5', subjectId: 'sub-1', content: 'Số $\\pi$ xấp xỉ bằng?', type: 'multiple-choice',
    options: ['3.14', '3.15', '3.16', '3.17'], correctAnswer: 0, explanation: 'Giá trị xấp xỉ của $\\pi$ là 3.14159...', difficulty: 'easy'
  },
  {
    id: 'q-6', subjectId: 'sub-1', content: 'Giải phương trình $2x + 6 = 0$', type: 'multiple-choice',
    options: ['$x = 3$', '$x = -3$', '$x = 6$', '$x = -6$'], correctAnswer: 1, explanation: '$2x = -6 \\Rightarrow x = -3$.', difficulty: 'easy'
  },
  {
    id: 'q-7', subjectId: 'sub-1', content: '$5! = ?$', type: 'multiple-choice',
    options: ['60', '100', '120', '150'], correctAnswer: 2, explanation: '$5! = 5 \\times 4 \\times 3 \\times 2 \\times 1 = 120$.', difficulty: 'easy'
  },
  {
    id: 'q-8', subjectId: 'sub-1', content: 'Diện tích hình tròn bán kính $r$ là?', type: 'multiple-choice',
    options: ['$2\\pi r$', '$\\pi r^2$', '$\\pi d$', '$4\\pi r^2$'], correctAnswer: 1, explanation: 'Công thức diện tích hình tròn $S = \\pi r^2$.', difficulty: 'easy'
  },
  {
    id: 'q-9', subjectId: 'sub-1', content: '$\\log_2 8 = ?$', type: 'multiple-choice',
    options: ['2', '3', '4', '8'], correctAnswer: 1, explanation: '$2^3 = 8$ nên $\\log_2 8 = 3$.', difficulty: 'medium'
  },
  {
    id: 'q-10', subjectId: 'sub-1', content: 'Giới hạn $\\lim_{x \\to 0} \\frac{\\sin x}{x} = ?$', type: 'multiple-choice',
    options: ['0', '1', '$\\infty$', 'Không tồn tại'], correctAnswer: 1, explanation: 'Đây là giới hạn cơ bản nổi tiếng.', difficulty: 'hard'
  },

  // ===== LỊCH SỬ (10 câu) =====
  {
    id: 'q-11', subjectId: 'sub-2', content: 'Cách mạng tháng Tám diễn ra năm nào?', type: 'multiple-choice',
    options: ['1944', '1945', '1946', '1954'], correctAnswer: 1, explanation: 'Cách mạng tháng Tám năm 1945.', difficulty: 'easy'
  },
  {
    id: 'q-12', subjectId: 'sub-2', content: 'Ai là người đọc Tuyên ngôn Độc lập ngày 2/9/1945?', type: 'multiple-choice',
    options: ['Võ Nguyên Giáp', 'Hồ Chí Minh', 'Phạm Văn Đồng', 'Trường Chinh'], correctAnswer: 1, explanation: 'Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập tại Quảng trường Ba Đình.', difficulty: 'easy'
  },
  {
    id: 'q-13', subjectId: 'sub-2', content: 'Chiến thắng Điện Biên Phủ diễn ra năm nào?', type: 'multiple-choice',
    options: ['1953', '1954', '1955', '1956'], correctAnswer: 1, explanation: 'Chiến thắng Điện Biên Phủ ngày 7/5/1954.', difficulty: 'easy'
  },
  {
    id: 'q-14', subjectId: 'sub-2', content: 'Trận Bạch Đằng năm 938 do ai chỉ huy?', type: 'multiple-choice',
    options: ['Lý Thường Kiệt', 'Ngô Quyền', 'Trần Hưng Đạo', 'Lê Lợi'], correctAnswer: 1, explanation: 'Ngô Quyền đánh tan quân Nam Hán trên sông Bạch Đằng năm 938.', difficulty: 'medium'
  },
  {
    id: 'q-15', subjectId: 'sub-2', content: 'Nhà Trần tồn tại trong khoảng thời gian nào?', type: 'multiple-choice',
    options: ['1009 - 1225', '1225 - 1400', '1428 - 1527', '1558 - 1777'], correctAnswer: 1, explanation: 'Nhà Trần (1225 - 1400).', difficulty: 'medium'
  },
  {
    id: 'q-16', subjectId: 'sub-2', content: 'Khởi nghĩa Lam Sơn do ai lãnh đạo?', type: 'multiple-choice',
    options: ['Trần Hưng Đạo', 'Quang Trung', 'Lê Lợi', 'Nguyễn Huệ'], correctAnswer: 2, explanation: 'Lê Lợi lãnh đạo khởi nghĩa Lam Sơn (1418 - 1427).', difficulty: 'easy'
  },
  {
    id: 'q-17', subjectId: 'sub-2', content: 'Hiệp định Genève được ký năm nào?', type: 'multiple-choice',
    options: ['1945', '1954', '1968', '1973'], correctAnswer: 1, explanation: 'Hiệp định Genève ký ngày 21/7/1954.', difficulty: 'medium'
  },
  {
    id: 'q-18', subjectId: 'sub-2', content: 'Phong trào Đông Du do ai khởi xướng?', type: 'multiple-choice',
    options: ['Phan Bội Châu', 'Phan Châu Trinh', 'Nguyễn Ái Quốc', 'Huỳnh Thúc Kháng'], correctAnswer: 0, explanation: 'Phan Bội Châu khởi xướng phong trào Đông Du (1905-1909).', difficulty: 'medium'
  },
  {
    id: 'q-19', subjectId: 'sub-2', content: 'Chiến dịch Hồ Chí Minh diễn ra năm nào?', type: 'multiple-choice',
    options: ['1973', '1974', '1975', '1976'], correctAnswer: 2, explanation: 'Chiến dịch Hồ Chí Minh (tháng 4/1975) giải phóng miền Nam.', difficulty: 'easy'
  },
  {
    id: 'q-20', subjectId: 'sub-2', content: 'Vua nào lập ra nhà Lý?', type: 'multiple-choice',
    options: ['Lý Thái Tổ', 'Lý Thái Tông', 'Lý Nhân Tông', 'Lý Thường Kiệt'], correctAnswer: 0, explanation: 'Lý Công Uẩn (Lý Thái Tổ) lập ra nhà Lý năm 1009.', difficulty: 'medium'
  },

  // ===== TIN HỌC (10 câu) =====
  {
    id: 'q-21', subjectId: 'sub-3', content: 'Đơn vị nhỏ nhất của dữ liệu trong máy tính là gì?', type: 'multiple-choice',
    options: ['Byte', 'Bit', 'Kilobyte', 'Megabyte'], correctAnswer: 1, explanation: 'Bit (Binary Digit) là đơn vị nhỏ nhất, có giá trị 0 hoặc 1.', difficulty: 'easy'
  },
  {
    id: 'q-22', subjectId: 'sub-3', content: '1 Byte bằng bao nhiêu Bit?', type: 'multiple-choice',
    options: ['4', '8', '16', '32'], correctAnswer: 1, explanation: '1 Byte = 8 Bit.', difficulty: 'easy'
  },
  {
    id: 'q-23', subjectId: 'sub-3', content: 'CPU là viết tắt của?', type: 'multiple-choice',
    options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Core Processing Unit'], correctAnswer: 0, explanation: 'CPU = Central Processing Unit (Bộ xử lý trung tâm).', difficulty: 'easy'
  },
  {
    id: 'q-24', subjectId: 'sub-3', content: 'Ngôn ngữ lập trình nào được gọi là "ngôn ngữ mẹ"?', type: 'multiple-choice',
    options: ['Python', 'Java', 'C', 'JavaScript'], correctAnswer: 2, explanation: 'Ngôn ngữ C được xem là nền tảng cho nhiều ngôn ngữ hiện đại.', difficulty: 'medium'
  },
  {
    id: 'q-25', subjectId: 'sub-3', content: 'Hệ điều hành nào là mã nguồn mở?', type: 'multiple-choice',
    options: ['Windows', 'macOS', 'Linux', 'iOS'], correctAnswer: 2, explanation: 'Linux là hệ điều hành mã nguồn mở phổ biến nhất.', difficulty: 'easy'
  },
  {
    id: 'q-26', subjectId: 'sub-3', content: 'HTML là viết tắt của?', type: 'multiple-choice',
    options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Language', 'Home Tool Markup Language'], correctAnswer: 0, explanation: 'HTML = HyperText Markup Language.', difficulty: 'easy'
  },
  {
    id: 'q-27', subjectId: 'sub-3', content: 'Trong lập trình, vòng lặp "for" dùng để?', type: 'multiple-choice',
    options: ['Khai báo biến', 'Lặp lại khối lệnh', 'Định nghĩa hàm', 'Import thư viện'], correctAnswer: 1, explanation: 'Vòng lặp for dùng để thực hiện lặp lại một khối lệnh theo số lần xác định.', difficulty: 'easy'
  },
  {
    id: 'q-28', subjectId: 'sub-3', content: 'Số $1010_2$ (hệ nhị phân) đổi sang hệ thập phân bằng?', type: 'multiple-choice',
    options: ['8', '10', '12', '14'], correctAnswer: 1, explanation: '$1 \\times 2^3 + 0 \\times 2^2 + 1 \\times 2^1 + 0 \\times 2^0 = 8 + 2 = 10$.', difficulty: 'medium'
  },
  {
    id: 'q-29', subjectId: 'sub-3', content: 'RAM là bộ nhớ loại gì?', type: 'multiple-choice',
    options: ['Bộ nhớ chỉ đọc', 'Bộ nhớ truy cập ngẫu nhiên', 'Bộ nhớ ngoài', 'Bộ nhớ cache'], correctAnswer: 1, explanation: 'RAM = Random Access Memory (Bộ nhớ truy cập ngẫu nhiên).', difficulty: 'easy'
  },
  {
    id: 'q-30', subjectId: 'sub-3', content: 'Thuật toán sắp xếp nào có độ phức tạp trung bình $O(n \\log n)$?', type: 'multiple-choice',
    options: ['Bubble Sort', 'Selection Sort', 'Merge Sort', 'Insertion Sort'], correctAnswer: 2, explanation: 'Merge Sort có độ phức tạp $O(n \\log n)$ trong mọi trường hợp.', difficulty: 'hard'
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
        boardSize: 4,
      },
      setApiKey: (key) => set((state) => ({ settings: { ...state.settings, apiKey: key } })),
      setModel: (model) => set((state) => ({ settings: { ...state.settings, model } })),
      setBoardSize: (size) => set((state) => ({ settings: { ...state.settings, boardSize: size } })),
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

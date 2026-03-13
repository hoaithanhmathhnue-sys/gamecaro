import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, Question } from '../store/useStore';
import Swal from 'sweetalert2';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Clock, User, Users } from 'lucide-react';
import QuestionModal from '../components/QuestionModal';

export default function Game() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { questions, addSession, settings } = useStore();
  const BOARD_SIZE = settings.boardSize;
  const WIN_CONDITION = BOARD_SIZE;
  
  const [board, setBoard] = useState<(string | null)[]>(Array(BOARD_SIZE * BOARD_SIZE).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [startTime] = useState(Date.now());

  const subjectQuestions = questions.filter(q => q.subjectId === subjectId);

  useEffect(() => {
    if (subjectQuestions.length === 0) {
      Swal.fire('Lỗi', 'Chủ đề này chưa có câu hỏi nào!', 'error').then(() => navigate('/'));
    }
  }, [subjectQuestions, navigate]);

  // Reset board when boardSize changes
  useEffect(() => {
    setBoard(Array(BOARD_SIZE * BOARD_SIZE).fill(null));
    setWinner(null);
    setScores({ X: 0, O: 0 });
    setCurrentPlayer('X');
  }, [BOARD_SIZE]);

  const checkWin = (boardState: (string | null)[], player: string) => {
    const checkDirection = (index: number, dx: number, dy: number) => {
      let count = 0;
      let x = index % BOARD_SIZE;
      let y = Math.floor(index / BOARD_SIZE);

      while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE && boardState[y * BOARD_SIZE + x] === player) {
        count++;
        x += dx;
        y += dy;
      }
      return count;
    };

    for (let i = 0; i < boardState.length; i++) {
      if (boardState[i] === player) {
        if (
          checkDirection(i, 1, 0) >= WIN_CONDITION || // Horizontal
          checkDirection(i, 0, 1) >= WIN_CONDITION || // Vertical
          checkDirection(i, 1, 1) >= WIN_CONDITION || // Diagonal \
          checkDirection(i, 1, -1) >= WIN_CONDITION   // Diagonal /
        ) {
          return true;
        }
      }
    }
    return false;
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner) return;
    
    // Pick a random question
    const randomQ = subjectQuestions[Math.floor(Math.random() * subjectQuestions.length)];
    setCurrentQuestion(randomQ);
    setSelectedCell(index);
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect && selectedCell !== null) {
      const newBoard = [...board];
      newBoard[selectedCell] = currentPlayer;
      setBoard(newBoard);
      
      setScores(prev => ({ ...prev, [currentPlayer]: prev[currentPlayer] + 1 }));

      if (checkWin(newBoard, currentPlayer)) {
        setWinner(currentPlayer);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        
        // Save session
        addSession({
          id: Date.now().toString(),
          subjectId: subjectId || '',
          score: scores[currentPlayer] + 1,
          totalQuestions: scores.X + scores.O + 1,
          correctAnswers: scores[currentPlayer] + 1,
          timeSpent: Math.floor((Date.now() - startTime) / 1000),
          date: new Date().toISOString()
        });
        
        Swal.fire({
          title: `Đội ${currentPlayer} Chiến Thắng! 🎉`,
          text: 'Chúc mừng bạn đã hoàn thành xuất sắc!',
          icon: 'success',
          confirmButtonText: 'Chơi lại',
          showCancelButton: true,
          cancelButtonText: 'Về trang chủ'
        }).then((result) => {
          if (result.isConfirmed) {
            setBoard(Array(BOARD_SIZE * BOARD_SIZE).fill(null));
            setWinner(null);
            setScores({ X: 0, O: 0 });
            setCurrentPlayer('X');
          } else {
            navigate('/');
          }
        });
      } else {
        setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
      }
    } else {
      // Incorrect answer, just switch turn
      Swal.fire({
        title: 'Rất tiếc!',
        text: 'Câu trả lời chưa chính xác. Mất lượt!',
        icon: 'error',
        timer: 2000,
        showConfirmButton: false
      });
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
    
    setSelectedCell(null);
    setCurrentQuestion(null);
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col">
      <header className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại</span>
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Caro {BOARD_SIZE}x{BOARD_SIZE} Đối Kháng</h1>
        <div className="w-24"></div> {/* Spacer */}
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Lượt chơi hiện tại
            </h3>
            <div className={`p-4 rounded-xl text-center font-bold text-2xl transition-colors ${
              currentPlayer === 'X' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'
            }`}>
              Đội {currentPlayer}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Tỉ số</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-blue-600 text-xl">Đội X</span>
              <span className="font-bold text-2xl">{scores.X}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-rose-600 text-xl">Đội O</span>
              <span className="font-bold text-2xl">{scores.O}</span>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-2xl p-6 text-white shadow-lg">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Luật chơi
            </h3>
            <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside">
              <li>Chọn 1 ô trống trên bàn cờ</li>
              <li>Trả lời đúng câu hỏi để chiếm ô</li>
              <li>Trả lời sai sẽ mất lượt</li>
              <li>Đội đầu tiên có {WIN_CONDITION} ô liên tiếp (ngang, dọc, chéo) sẽ thắng</li>
            </ul>
          </div>
        </div>

        {/* Game Board */}
        <div className="lg:col-span-3 flex items-center justify-center bg-white rounded-3xl shadow-sm border border-slate-100 p-4 md:p-8">
          <div 
            className="grid gap-1 md:gap-2 bg-slate-200 p-2 rounded-xl w-full max-w-2xl aspect-square"
            style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}
          >
            {board.map((cell, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: cell ? 1 : 0.95 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleCellClick(index)}
                disabled={cell !== null || winner !== null}
                className={`
                  w-full h-full rounded-lg md:rounded-xl flex items-center justify-center font-black transition-all
                  ${BOARD_SIZE <= 4 ? 'text-3xl md:text-5xl' : BOARD_SIZE <= 5 ? 'text-2xl md:text-4xl' : 'text-xl md:text-3xl'}
                  ${cell === null ? 'bg-white hover:bg-slate-50 cursor-pointer shadow-sm' : ''}
                  ${cell === 'X' ? 'bg-blue-500 text-white shadow-md' : ''}
                  ${cell === 'O' ? 'bg-rose-500 text-white shadow-md' : ''}
                `}
              >
                {cell && (
                  <motion.span
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    {cell}
                  </motion.span>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {currentQuestion && (
          <QuestionModal 
            question={currentQuestion} 
            onAnswer={handleAnswer} 
            onClose={() => {
              setCurrentQuestion(null);
              setSelectedCell(null);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

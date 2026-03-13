import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Question } from '../store/useStore';
import { X, Clock, CheckCircle2, XCircle } from 'lucide-react';
import MathText from './MathText';

const QUESTION_TIME_LIMIT_SECONDS = 30;
const TIMEOUT_REVEAL_DELAY_MS = 2000;
const ANSWER_REVEAL_DELAY_MS = 2500;

interface Props {
  question: Question;
  onAnswer: (isCorrect: boolean) => void;
  onClose: () => void;
}

export default function QuestionModal({ question, onAnswer, onClose }: Props) {
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT_SECONDS);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    if (timeLeft > 0 && !isRevealed) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isRevealed) {
      handleTimeOut();
    }
  }, [timeLeft, isRevealed]);

  const handleTimeOut = () => {
    setIsRevealed(true);
    setTimeout(() => onAnswer(false), TIMEOUT_REVEAL_DELAY_MS);
  };

  const handleSelect = (index: number) => {
    if (isRevealed) return;
    setSelectedOption(index);
    setIsRevealed(true);

    const isCorrect = index === question.correctAnswer;

    setTimeout(() => {
      onAnswer(isCorrect);
    }, ANSWER_REVEAL_DELAY_MS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3 text-amber-600 font-bold bg-amber-100 px-4 py-2 rounded-full">
            <Clock className="w-5 h-5" />
            <span className="text-lg">{timeLeft}s</span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto flex-1">
          <div className="mb-8">
            <MathText as="div" className="text-lg font-semibold text-slate-800">{question.content}</MathText>
          </div>

          <div className="space-y-3">
            {question.options.map((option, index) => {
              let buttonClass = "w-full text-left p-4 rounded-xl border-2 transition-all font-medium text-lg flex items-center justify-between ";

              if (!isRevealed) {
                buttonClass += "border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700";
              } else {
                if (index === question.correctAnswer) {
                  buttonClass += "border-emerald-500 bg-emerald-50 text-emerald-700";
                } else if (index === selectedOption) {
                  buttonClass += "border-rose-500 bg-rose-50 text-rose-700";
                } else {
                  buttonClass += "border-slate-200 opacity-50 text-slate-500";
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleSelect(index)}
                  disabled={isRevealed}
                  className={buttonClass}
                >
                  <MathText>{`${String.fromCharCode(65 + index)}. ${option}`}</MathText>
                  {isRevealed && index === question.correctAnswer && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                  {isRevealed && index === selectedOption && index !== question.correctAnswer && <XCircle className="w-6 h-6 text-rose-500" />}
                </button>
              );
            })}
          </div>

          {isRevealed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800"
            >
              <h4 className="font-bold mb-1 flex items-center gap-2">
                Giải thích:
              </h4>
              <MathText as="p" className="text-sm">{question.explanation}</MathText>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

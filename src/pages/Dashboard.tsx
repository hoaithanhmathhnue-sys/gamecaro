import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { BookOpen, Trophy, Target, TrendingUp, PlayCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { subjects, questions, progress } = useStore();

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Xin chào! 👋</h1>
          <p className="text-slate-500 mt-1">Sẵn sàng cho thử thách hôm nay chưa?</p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Target} label="Số trận đã chơi" value={progress.totalAttempts.toString()} color="bg-blue-50 text-blue-600" />
        <StatCard icon={Trophy} label="Điểm trung bình" value={`${progress.averageScore}%`} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={TrendingUp} label="Chuỗi ngày học" value={`${progress.streakDays} ngày`} color="bg-orange-50 text-orange-600" />
        <StatCard icon={BookOpen} label="Chủ đề yếu" value={progress.weakTopics.length > 0 ? progress.weakTopics[0] : 'Không có'} color="bg-rose-50 text-rose-600" />
      </div>

      {/* Subjects Grid */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Chọn môn học để thi đấu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject, index) => {
            const questionCount = questions.filter(q => q.subjectId === subject.id).length;
            return (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                    {questionCount} câu hỏi
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{subject.name}</h3>

                <Link
                  to={`/game/${subject.id}`}
                  className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                >
                  <PlayCircle className="w-5 h-5" />
                  Bắt đầu chơi
                </Link>
              </motion.div>
            );
          })}
          {subjects.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
              <p className="text-slate-500">Chưa có môn học nào. Hãy vào Quản trị để thêm môn học.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>, label: string, value: string, color: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}


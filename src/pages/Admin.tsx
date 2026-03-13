import { useState } from 'react';
import { useStore, Question, Subject } from '../store/useStore';
import { Plus, Upload, Trash2, Edit, FileText, Bot, FileUp, Save, X, FolderPlus, Printer } from 'lucide-react';
import Swal from 'sweetalert2';
import { extractTextFromFile, parseQuestionsFromText } from '../utils/fileParser';
import { motion } from 'motion/react';
import { exportExamToHTML } from '../utils/exportExam';
import MathText from '../components/MathText';

export default function Admin() {
  const { subjects, questions, addSubject, addQuestion, deleteQuestion, updateQuestion } = useStore();
  const [activeTab, setActiveTab] = useState<'list' | 'import' | 'subjects'>('list');
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id || '');
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Question>>({});
  const [importCount, setImportCount] = useState(10);
  const [importDifficulty, setImportDifficulty] = useState('mixed');

  // New subject form
  const [newSubjectName, setNewSubjectName] = useState('');

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) {
      Swal.fire('Lỗi', 'Vui lòng nhập tên môn học!', 'warning');
      return;
    }

    const newSubject: Subject = {
      id: `sub-${Date.now()}`,
      name: newSubjectName.trim(),
      icon: 'book',
      questionsCount: 0,
    };

    addSubject(newSubject);
    setNewSubjectName('');
    setSelectedSubject(newSubject.id);
    Swal.fire('Thành công', `Đã thêm môn học "${newSubject.name}"!`, 'success');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await extractTextFromFile(file);
      setImportText(text);
      Swal.fire('Thành công', `Đã đọc file ${file.name}. Vui lòng kiểm tra nội dung và bấm Trích xuất.`, 'success');
    } catch (error: any) {
      console.error(error);
      Swal.fire('Lỗi', error.message || 'Không thể đọc file.', 'error');
    }

    // Reset input
    e.target.value = '';
  };

  // Trích xuất trực tiếp từ file (upload + AI parse 1 bước)
  const handleDirectFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { settings } = useStore.getState();
    if (!settings.apiKey) {
      Swal.fire('Lỗi', 'Vui lòng nhập API Key trong phần Cài đặt trước!', 'warning');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const text = await extractTextFromFile(file);
      if (!text.trim()) throw new Error('File không có nội dung hoặc không đọc được.');

      const parsed = await parseQuestionsFromText(settings.apiKey, text, importCount, importDifficulty);
      if (parsed.length === 0) throw new Error('Không tìm thấy câu hỏi trắc nghiệm trong file.');

      parsed.forEach((q: any) => {
        addQuestion({
          id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          subjectId: selectedSubject,
          content: q.content,
          type: 'multiple-choice',
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || 'Không có giải thích',
          difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium'
        });
      });

      Swal.fire('Thành công', `Đã nạp ${parsed.length} câu hỏi từ file "${file.name}"!`, 'success');
    } catch (error: any) {
      console.error(error);
      Swal.fire('Lỗi', error.message || 'Không thể phân tích file.', 'error');
    }

    setIsUploading(false);
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      Swal.fire('Lỗi', 'Vui lòng nhập nội dung cần trích xuất!', 'warning');
      return;
    }

    const { settings } = useStore.getState();
    if (!settings.apiKey) {
      Swal.fire('Lỗi', 'Vui lòng nhập API Key trong phần Cài đặt trước!', 'warning');
      return;
    }

    setIsImporting(true);

    try {
      const parsed = await parseQuestionsFromText(settings.apiKey, importText, importCount, importDifficulty);

      if (parsed.length > 0) {
        parsed.forEach((q: any) => {
          addQuestion({
            id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            subjectId: selectedSubject,
            content: q.content,
            type: 'multiple-choice',
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || 'Không có giải thích',
            difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium'
          });
        });

        Swal.fire('Thành công', `Đã thêm ${parsed.length} câu hỏi!`, 'success');
        setImportText('');
        setActiveTab('list');
      } else {
        Swal.fire('Lỗi', 'Không tìm thấy câu hỏi nào trong văn bản.', 'warning');
      }
    } catch (error: any) {
      console.error(error);
      Swal.fire('Lỗi', error.message || 'Không thể phân tích dữ liệu từ AI. Vui lòng thử lại.', 'error');
    }

    setIsImporting(false);
  };

  const handleEdit = (question: Question) => {
    setEditingId(question.id);
    setEditData({
      content: question.content,
      options: [...question.options],
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      difficulty: question.difficulty,
    });
  };

  const handleSaveEdit = () => {
    if (!editingId || !editData.content?.trim()) return;
    updateQuestion(editingId, editData);
    setEditingId(null);
    setEditData({});
    Swal.fire({ title: 'Đã lưu!', icon: 'success', timer: 1200, showConfirmButton: false });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = (id: string) => {
    Swal.fire({
      title: 'Xóa câu hỏi?',
      text: "Hành động này không thể hoàn tác!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteQuestion(id);
        Swal.fire('Đã xóa!', 'Câu hỏi đã được xóa.', 'success');
      }
    });
  };

  const filteredQuestions = questions.filter(q => q.subjectId === selectedSubject);
  const currentSubjectName = subjects.find(s => s.id === selectedSubject)?.name || 'Đề thi';

  const handleExportExam = (showAnswers: boolean) => {
    if (filteredQuestions.length === 0) {
      Swal.fire('Lỗi', 'Chưa có câu hỏi nào để xuất!', 'warning');
      return;
    }
    exportExamToHTML(filteredQuestions, currentSubjectName, { showAnswers });
    Swal.fire({ title: 'Đã xuất!', text: `File HTML đã được tải xuống.`, icon: 'success', timer: 1500, showConfirmButton: false });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Quản trị Kho Câu Hỏi</h1>
          <p className="text-slate-500 mt-1">Quản lý và thêm mới câu hỏi cho các môn học</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExportExam(false)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-sm font-medium transition-colors"
          >
            <Printer className="w-4 h-4" />
            Xuất đề thi
          </button>
          <button
            onClick={() => handleExportExam(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-sm font-medium transition-colors"
          >
            <Printer className="w-4 h-4" />
            Xuất kèm đáp án
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100">
          <button
            className={`flex-1 py-4 font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'list' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('list')}
          >
            <FileText className="w-5 h-5" />
            Danh sách câu hỏi
          </button>
          <button
            className={`flex-1 py-4 font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'import' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('import')}
          >
            <Bot className="w-5 h-5" />
            Trích xuất AI
          </button>
          <button
            className={`flex-1 py-4 font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'subjects' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('subjects')}
          >
            <FolderPlus className="w-5 h-5" />
            Môn học
          </button>
        </div>

        <div className="p-6">
          {activeTab !== 'subjects' && (
            <div className="mb-6 flex items-center gap-4">
              <label className="font-medium text-slate-700">Chọn môn học:</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({questions.filter(q => q.subjectId === s.id).length} câu)</option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'list' && (
            <div className="space-y-4">
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                  <p className="text-slate-500">Chưa có câu hỏi nào cho môn học này.</p>
                </div>
              ) : (
                filteredQuestions.map((q, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={q.id}
                    className="p-4 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors group"
                  >
                    {editingId === q.id ? (
                      // Edit mode
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-slate-600 mb-1 block">Câu hỏi</label>
                          <textarea
                            value={editData.content || ''}
                            onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            rows={2}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {editData.options?.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="correctAnswer"
                                checked={editData.correctAnswer === i}
                                onChange={() => setEditData({ ...editData, correctAnswer: i })}
                                className="w-4 h-4 text-blue-600"
                              />
                              <input
                                value={opt}
                                onChange={(e) => {
                                  const newOptions = [...(editData.options || [])];
                                  newOptions[i] = e.target.value;
                                  setEditData({ ...editData, options: newOptions });
                                }}
                                className={`flex-1 px-3 py-1.5 rounded-lg border ${editData.correctAnswer === i ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'} focus:ring-2 focus:ring-blue-500 outline-none text-sm`}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            value={editData.explanation || ''}
                            onChange={(e) => setEditData({ ...editData, explanation: e.target.value })}
                            placeholder="Giải thích..."
                            className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <select
                            value={editData.difficulty || 'medium'}
                            onChange={(e) => setEditData({ ...editData, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none"
                          >
                            <option value="easy">Dễ</option>
                            <option value="medium">Trung bình</option>
                            <option value="hard">Khó</option>
                          </select>
                          <button onClick={handleSaveEdit} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1">
                            <Save className="w-4 h-4" /> Lưu
                          </button>
                          <button onClick={handleCancelEdit} className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 flex items-center gap-1">
                            <X className="w-4 h-4" /> Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MathText className="font-bold text-slate-800">{q.content}</MathText>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${q.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                              q.difficulty === 'hard' ? 'bg-rose-100 text-rose-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>{q.difficulty === 'easy' ? 'Dễ' : q.difficulty === 'hard' ? 'Khó' : 'TB'}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {q.options.map((opt, i) => (
                              <div key={i} className={`px-3 py-1.5 rounded-lg ${i === q.correctAnswer ? 'bg-emerald-100 text-emerald-700 font-medium' : 'bg-slate-100 text-slate-600'}`}>
                                <MathText>{`${String.fromCharCode(65 + i)}. ${opt}`}</MathText>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(q)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(q.id)} className="p-2 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-6">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm">
                <p className="font-bold mb-1 flex items-center gap-2"><Bot className="w-4 h-4" /> Hướng dẫn trích xuất</p>
                <p>Dán nội dung văn bản chứa câu hỏi hoặc tải lên file DOCX/PDF. AI sẽ tự động phân tích và trích xuất câu hỏi trắc nghiệm.</p>
              </div>

              {/* Cài đặt trích xuất */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Số câu hỏi tối đa</label>
                  <input
                    type="number"
                    value={importCount}
                    onChange={(e) => setImportCount(Number(e.target.value))}
                    min={1}
                    max={50}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Độ khó</label>
                  <select
                    value={importDifficulty}
                    onChange={(e) => setImportDifficulty(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="mixed">🎲 Hỗn hợp</option>
                    <option value="easy">🟢 Dễ</option>
                    <option value="medium">🟡 Trung bình</option>
                    <option value="hard">🔴 Khó</option>
                  </select>
                </div>
              </div>

              {/* Upload file trực tiếp */}
              <div className="flex gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 border-2 border-dashed border-purple-200 hover:bg-purple-100 rounded-xl font-medium transition-colors cursor-pointer">
                  <FileUp className="w-5 h-5" />
                  {isUploading ? 'Đang xử lý file...' : 'Tải file lên & Trích xuất ngay'}
                  <input type="file" accept=".docx,.pdf" onChange={handleDirectFileImport} disabled={isUploading} className="hidden" />
                </label>
                <label className="flex items-center gap-2 px-4 py-3 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-xl font-medium transition-colors cursor-pointer shrink-0">
                  <Upload className="w-4 h-4" />
                  Đọc file vào ô text
                  <input type="file" accept=".docx,.pdf" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Dán nội dung câu hỏi vào đây hoặc tải file lên..."
                className="w-full h-64 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              ></textarea>

              <button
                onClick={handleImport}
                disabled={isImporting || !importText.trim()}
                className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-colors"
              >
                {isImporting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang xử lý bằng AI...
                  </>
                ) : (
                  <>
                    <Bot className="w-5 h-5" />
                    Trích xuất từ văn bản
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'subjects' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl">
                <p className="font-bold mb-1 flex items-center gap-2"><FolderPlus className="w-4 h-4" /> Thêm môn học mới</p>
                <p className="text-sm">Tạo môn học để bắt đầu thêm câu hỏi.</p>
              </div>

              <div className="flex gap-3">
                <input
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                  placeholder="Tên môn học mới (VD: Tiếng Anh, Địa Lý...)"
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  onClick={handleAddSubject}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Thêm
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-slate-700">Danh sách môn học hiện tại</h3>
                {subjects.map((s) => {
                  const count = questions.filter(q => q.subjectId === s.id).length;
                  return (
                    <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <span className="font-medium text-slate-800">{s.name}</span>
                        <span className="ml-3 text-sm text-slate-500">{count} câu hỏi</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

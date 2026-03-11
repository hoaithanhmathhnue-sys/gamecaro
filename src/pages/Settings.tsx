import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Key, Save, Eye, EyeOff, Bot, Download, Upload, Database, ExternalLink, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { motion } from 'motion/react';

export default function Settings() {
  const { settings, setApiKey, setModel, resetData, subjects, questions } = useStore();
  const [apiKeyInput, setApiKeyInput] = useState(settings.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState(settings.model);

  const handleSave = () => {
    setApiKey(apiKeyInput);
    setModel(selectedModel);
    Swal.fire({
      title: 'Thành công!',
      text: 'Đã lưu cài đặt.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleExport = () => {
    const dataStr = JSON.stringify({ subjects, questions }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caroedu-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.subjects && data.questions) {
          useStore.setState({ subjects: data.subjects, questions: data.questions });
          Swal.fire('Thành công', 'Đã khôi phục dữ liệu!', 'success');
        } else {
          throw new Error('Invalid format');
        }
      } catch (error) {
        Swal.fire('Lỗi', 'File không hợp lệ.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    Swal.fire({
      title: 'Xóa toàn bộ dữ liệu?',
      text: 'Tất cả môn học, câu hỏi và lịch sử sẽ bị xóa. Hành động này không thể hoàn tác!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Xóa tất cả',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        resetData();
        Swal.fire('Đã xóa!', 'Dữ liệu đã được khôi phục về mặc định.', 'success');
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-800">Cài đặt hệ thống</h1>
        <p className="text-slate-500 mt-1">Cấu hình API Key và quản lý dữ liệu</p>
      </header>

      <div className="grid gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Key className="w-6 h-6 text-blue-600" />
            Cấu hình Gemini AI
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Nhập Gemini API Key của bạn..."
                  className="w-full pl-4 pr-12 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600"
                >
                  {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-500">
                  API Key được lưu trữ an toàn trên trình duyệt của bạn (LocalStorage).
                </p>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Lấy API Key miễn phí
                </a>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mô hình AI</label>
              <div className="relative">
                <Bot className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Khuyên dùng, cân bằng)</option>
                  <option value="gemini-3-flash-preview">Gemini 3 Flash Preview (Reasoning mạnh)</option>
                  <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Nhanh, tiết kiệm)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Chính xác cao nhất)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="mt-6 flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
            >
              <Save className="w-5 h-5" />
              Lưu cài đặt
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-600" />
            Quản lý dữ liệu
          </h2>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-medium transition-colors"
            >
              <Download className="w-5 h-5" />
              Sao lưu dữ liệu
            </button>

            <label className="flex items-center gap-2 px-6 py-3 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl font-medium transition-colors cursor-pointer">
              <Upload className="w-5 h-5" />
              Khôi phục dữ liệu
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>

            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl font-medium transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              Xóa toàn bộ dữ liệu
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

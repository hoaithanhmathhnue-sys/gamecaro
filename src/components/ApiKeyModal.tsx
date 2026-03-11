import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Key, ExternalLink, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ApiKeyModal() {
    const { settings, setApiKey } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const [keyInput, setKeyInput] = useState('');

    useEffect(() => {
        if (!settings.apiKey) {
            setIsOpen(true);
        }
    }, [settings.apiKey]);

    const handleSave = () => {
        if (!keyInput.trim()) return;
        setApiKey(keyInput.trim());
        setIsOpen(false);
        setKeyInput('');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                >
                    <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                <Key className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Cấu hình API Key</h2>
                                <p className="text-blue-100 text-sm">Bắt buộc để sử dụng tính năng AI</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-5">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <h3 className="font-bold text-blue-800 mb-2 text-sm flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" />
                                Hướng dẫn lấy API Key miễn phí
                            </h3>
                            <ol className="text-sm text-blue-700 space-y-1.5 list-decimal list-inside">
                                <li>Truy cập Google AI Studio</li>
                                <li>Đăng nhập bằng tài khoản Google</li>
                                <li>Nhấn <b>"Create API key"</b></li>
                                <li>Sao chép key và dán vào ô bên dưới</li>
                            </ol>
                            <a
                                href="https://aistudio.google.com/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Mở Google AI Studio
                            </a>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Gemini API Key
                            </label>
                            <input
                                type="password"
                                value={keyInput}
                                onChange={(e) => setKeyInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                placeholder="AIza..."
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg"
                                autoFocus
                            />
                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                Key được lưu trên trình duyệt của bạn, không gửi đi bất kỳ đâu khác.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleSave}
                                disabled={!keyInput.trim()}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-colors"
                            >
                                Lưu API Key
                            </button>
                            {settings.apiKey && (
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-3 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

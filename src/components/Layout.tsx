import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, Settings, Database, Brain, Menu, X, Key } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store/useStore';

export default function Layout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { settings } = useStore();

  const navItems = [
    { path: '/', label: 'Trang chủ', icon: Home },
    { path: '/admin', label: 'Quản trị', icon: Database },
    { path: '/settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white shadow-sm">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
          <Brain className="w-6 h-6" />
          <span>CaroEdu</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/settings" className={`p-2 rounded-full ${settings.apiKey ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'}`}>
            <Key className="w-5 h-5" />
          </Link>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[5] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${isMobileMenuOpen ? 'block' : 'hidden'} 
        md:block w-full md:w-64 bg-white shadow-lg flex-shrink-0 z-10
        fixed md:sticky top-0 h-screen overflow-y-auto flex flex-col
      `}>
        <div className="p-6 hidden md:flex items-center gap-3 text-blue-600 font-bold text-2xl border-b border-slate-100">
          <Brain className="w-8 h-8" />
          <span>CaroEdu</span>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                  }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 hidden md:block">
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${settings.apiKey
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 animate-pulse'
              }`}
          >
            <Key className="w-5 h-5" />
            <div className="flex flex-col">
              <span className="font-medium text-sm">API Key</span>
              <span className="text-xs opacity-80">{settings.apiKey ? 'Đã kết nối' : 'Chưa cấu hình'}</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        <Outlet />
      </main>
    </div>
  );
}

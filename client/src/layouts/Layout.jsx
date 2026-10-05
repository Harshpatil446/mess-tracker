import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { SettingsModal } from '../components/SettingsModal';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { LayoutDashboard, History, LogOut, User as UserIcon, Sun, Moon, Download, Palette, ChevronDown, Bell } from 'lucide-react';

export const Layout = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const themes = [
    { id: 'light', label: 'Light', color: 'bg-gray-200 border-gray-300' },
    { id: 'dark', label: 'Dark', color: 'bg-gray-700 border-gray-600' },
    { id: 'blue', label: 'Blue', color: 'bg-slate-800 border-slate-700' },
    { id: 'pink', label: 'Pink', color: 'bg-rose-800 border-rose-700' },
    { id: 'black', label: 'OLED', color: 'bg-black border-gray-800' },
    { id: 'purple', label: 'Purple', color: 'bg-purple-900 border-purple-800' }
  ];

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setTimeout(() => setIsSettingsOpen(true), 500); // Small delay to let install finish
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/50 sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex-shrink-0 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <Link to="/" className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white transition-colors whitespace-nowrap hidden min-[380px]:block">Mess Tracker</Link>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-6">
            {/* Desktop Navigation Links */}
            <nav className="hidden sm:flex items-center gap-6">
              <Link to="/" className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}>
                Dashboard
              </Link>
              <Link to="/history" className={`text-sm font-medium transition-colors ${isActive('/history') ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}>
                History
              </Link>
            </nav>
            
            {deferredPrompt && (
              <button
                onClick={handleInstall}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full font-semibold text-[10px] sm:text-sm hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors shadow-sm"
                title="Install App"
              >
                <Download size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Install</span>
              </button>
            )}

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 text-gray-500 hover:text-emerald-500 bg-gray-100 dark:bg-gray-700/80 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm"
              title="Notification Settings"
            >
              <Bell size={16} />
            </button>

            <div className="relative">
              <button
                onClick={() => setIsThemeOpen(!isThemeOpen)}
                className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700/80 text-gray-700 dark:text-gray-200 text-xs sm:text-sm font-semibold py-1.5 px-3 rounded-full border border-gray-200 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-500 focus:outline-none transition-all shadow-sm group"
              >
                <Palette size={14} className="text-gray-500 dark:text-gray-400 group-hover:text-emerald-500 transition-colors" />
                <span className="capitalize w-10 text-left">{theme === 'black' ? 'OLED' : theme}</span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {isThemeOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsThemeOpen(false)} />
                  <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-lg shadow-gray-200/50 dark:shadow-black/50 border border-gray-100 dark:border-gray-700 overflow-hidden z-50 py-1 transition-all">
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTheme(t.id);
                          setIsThemeOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors ${
                          theme === t.id 
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full border ${t.color}`} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full transition-colors">
              <UserIcon size={16} />
              <span className="text-sm font-medium">{user.name}</span>
            </div>
            <button
              onClick={logout}
              className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 pb-24 sm:pb-6 text-gray-900 dark:text-gray-100">
        <Outlet />
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Bottom Navigation for Mobile / Side Nav for Desktop */}
      <div className="fixed bottom-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sm:hidden z-10 transition-colors duration-200">
        <div className="flex justify-around p-3">
          <Link
            to="/"
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
              isActive('/') ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <LayoutDashboard size={24} />
            <span className="text-[10px] font-medium">Dashboard</span>
          </Link>
          <Link
            to="/history"
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
              isActive('/history') ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <History size={24} />
            <span className="text-[10px] font-medium">History</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

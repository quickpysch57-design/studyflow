import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui';
import {
  HomeIcon,
  CalendarDaysIcon,
  BookOpenIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ClockIcon,
  ChartBarIcon,
  SparklesIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon, shortcut: '1' },
  { name: 'Planner', href: '/planner', icon: CalendarDaysIcon, shortcut: '2' },
  { name: 'Subjects', href: '/subjects', icon: BookOpenIcon, shortcut: '3' },
  { name: 'Tasks', href: '/tasks', icon: CheckCircleIcon, shortcut: '4' },
  { name: 'Exams', href: '/exams', icon: AcademicCapIcon, shortcut: '5' },
  { name: 'Notes', href: '/notes', icon: DocumentTextIcon, shortcut: '6' },
  { name: 'Focus', href: '/focus', icon: ClockIcon, shortcut: '7' },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, shortcut: '8' },
  { name: 'AI Assistant', href: '/ai', icon: SparklesIcon, shortcut: '9' },
  { name: 'Calendar', href: '/calendar', icon: CalendarDaysIcon, shortcut: '0' },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, shortcut: 's' }
];

const mobileNavigation = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Planner', href: '/planner', icon: CalendarDaysIcon },
  { name: 'Tasks', href: '/tasks', icon: CheckCircleIcon },
  { name: 'Focus', href: '/focus', icon: ClockIcon },
  { name: 'Profile', href: '/settings', icon: UserCircleIcon }
];

export function Layout() {
  const { user, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setQuickAddOpen(false);
        setSidebarOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setQuickAddOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    setTheme(themes[(currentIndex + 1) % themes.length]);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-surface-950">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 glass-strong border-r border-surface-700/50 transform transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Main navigation"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between h-16 px-4 border-b border-surface-700/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <BookOpenIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-heading-md font-bold text-surface-50">StudyFlow</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href ||
                (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive: active }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-body-sm font-medium transition-all duration-150
                    ${active
                      ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                      : 'text-surface-400 hover:bg-surface-800 hover:text-surface-100'
                    }
                  `}
                  title={`${item.name} (⌘${item.shortcut})`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <span>{item.name}</span>
                  <kbd className="hidden lg:inline-flex ml-auto px-1.5 py-0.5 text-xs text-surface-500 bg-surface-800 rounded">
                    ⌘{item.shortcut}
                  </kbd>
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-surface-700/50">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium text-surface-50 truncate">{user?.name}</p>
                <p className="text-body-xs text-surface-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 glass border-b border-surface-700/50">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                <Bars3Icon className="h-6 w-6" />
              </Button>

              <div className="hidden sm:block w-72 lg:w-96">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-500" />
                  <input
                    type="search"
                    placeholder="Search subjects, tasks, notes... (⌘K)"
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-800 border border-surface-700 text-surface-50 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-body-sm"
                    onClick={() => setSearchOpen(true)}
                    readOnly
                    aria-label="Global search"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                aria-label={`Current theme: ${theme}. Click to cycle.`}
                className="hidden sm:flex"
              >
                {resolvedTheme === 'dark' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setQuickAddOpen(true)}
                className="hidden sm:flex"
              >
                <PlusCircleIcon className="h-5 w-5" />
                <span>Quick Add</span>
              </Button>

              <Button variant="ghost" size="sm" onClick={logout}>
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      <QuickAddModal isOpen={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  );
}

function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl animate-in">
        <div className="glass-strong rounded-2xl border border-surface-700/50 overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-surface-700/50">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-500" />
              <input
                type="search"
                placeholder="Search everywhere... (Esc to close)"
                autoFocus
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-surface-50 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-body-md"
                onKeyDown={(e) => e.key === 'Escape' && onClose()}
              />
            </div>
            <p className="mt-2 text-body-xs text-surface-500 text-center">
              Press <kbd className="px-1.5 py-0.5 bg-surface-800 rounded text-surface-400">⌘K</kbd> to open, <kbd className="px-1.5 py-0.5 bg-surface-800 rounded text-surface-400">Esc</kbd> to close
            </p>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            <p className="text-body-sm text-surface-400 text-center py-8">Search results will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAddModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const items = [
    { name: 'Task', icon: CheckCircleIcon, href: '/tasks?new=true', color: 'text-blue-400' },
    { name: 'Study Session', icon: ClockIcon, href: '/planner?new=session', color: 'text-green-400' },
    { name: 'Subject', icon: BookOpenIcon, href: '/subjects?new=true', color: 'text-purple-400' },
    { name: 'Exam', icon: AcademicCapIcon, href: '/exams?new=true', color: 'text-red-400' },
    { name: 'Note', icon: DocumentTextIcon, href: '/notes?new=true', color: 'text-yellow-400' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm animate-in">
        <div className="glass-strong rounded-2xl border border-surface-700/50 overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-surface-700/50 flex items-center justify-between">
            <h3 className="text-heading-sm font-semibold text-surface-50">Quick Add</h3>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </div>
          <div className="p-2">
            {items.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-body-sm font-medium text-surface-300 hover:bg-surface-800 hover:text-surface-50 transition-colors"
                onClick={onClose}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color} bg-opacity-10`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span>{item.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
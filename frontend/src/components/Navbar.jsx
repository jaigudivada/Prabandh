import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import branding from '../config/branding';
import {
  Menu,
  Bell,
  LayoutDashboard,
  PlusCircle,
  User,
  Settings,
  AlertTriangle,
  LogOut,
  Shield,
  BarChart3,
  Bug,
  Sun,
  Moon,
  ChevronRight,
} from 'lucide-react';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [userOpen, setUserOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get('/api/notifications').then(setNotifications).catch(() => {});
    const interval = setInterval(() => {
      api.get('/api/notifications').then(setNotifications).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdowns on Escape
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setNotifOpen(false);
        setUserOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setNotifOpen(false);
    setUserOpen(false);
  }, [location.pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!notifOpen && !userOpen) return;
    const handleClick = (e) => {
      if (!e.target.closest('[data-dropdown]')) {
        setNotifOpen(false);
        setUserOpen(false);
      }
    };
    window.addEventListener('click', handleClick, { capture: true });
    return () => window.removeEventListener('click', handleClick, { capture: true });
  }, [notifOpen, userOpen]);

  const navLinks = useMemo(() => {
    const role = user?.role;
    if (role === 'ADMIN') {
      return [
        { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
        { to: '/admin/website-reports', label: 'Website Reports', icon: Bug },
        { to: '/admin/settings', label: 'Settings', icon: Settings },
      ];
    }
    if (role === 'OFFICIAL') {
      return [
        { to: '/official', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/official/issues', label: 'Issues', icon: AlertTriangle },
        { to: '/official/reports', label: 'Reports', icon: BarChart3 },
        { to: '/official/settings', label: 'Settings', icon: Settings },
      ];
    }
    if (role === 'SUPERVISOR') {
      return [
        { to: '/supervisor', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/supervisor/issues', label: 'Issues', icon: AlertTriangle },
        { to: '/supervisor/reports', label: 'Reports', icon: BarChart3 },
        { to: '/supervisor/settings', label: 'Settings', icon: Settings },
      ];
    }
    return [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      ...(user?.role === 'USER' ? [{ to: '/issues/new', label: 'Report Issue', icon: PlusCircle }] : []),
      { to: '/profile', label: 'Profile', icon: User },
      { to: '/settings', label: 'Settings', icon: Settings },
    ];
  }, [user?.role]);

  const unread = notifications.filter((n) => !n.isRead);
  const earlier = notifications.filter((n) => n.isRead);
  const unreadCount = unread.length;

  const markRead = async (id) => {
    await api.patch(`/api/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleLogout = () => {
    logout();
    setUserOpen(false);
    navigate('/login');
  };

  const getRoleLabel = () => {
    const role = user?.role;
    if (role === 'ADMIN') return 'Admin';
    if (role === 'SUPERVISOR') return 'Supervisor';
    if (role === 'OFFICIAL') return 'Official';
    if (role === 'USER') return 'User';
    return '';
  };

  const getDashboardPath = () => {
    const role = user?.role;
    if (role === 'ADMIN') return '/admin';
    if (role === 'SUPERVISOR') return '/supervisor';
    if (role === 'OFFICIAL') return '/official';
    return '/';
  };

  const getPageLabel = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    const rolePrefixes = ['admin', 'supervisor', 'official'];
    const pageSegments = segments.filter(s => !rolePrefixes.includes(s));
    if (pageSegments.length === 0) return 'Dashboard';
    return pageSegments.map(s => s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join(' > ');
  };

  return (
    <nav aria-label="Primary navigation" className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-lg supports-[backdrop-filter]:bg-white/70 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/95 transition-colors">
      <div className="mx-auto flex max-w-7xl flex-col px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-2 sm:h-16 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile hamburger - toggles sidebar drawer on mobile/tablet */}
            <button
              type="button"
              onClick={onMenuClick}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-all duration-200 hover:border-zinc-300 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-900 lg:hidden"
              aria-label="Open navigation menu"
              aria-expanded="false"
              aria-controls="sidebar-navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <Shield className="h-6 w-6 text-primary-700 sm:h-7 sm:w-7" />
              <div className="hidden xs:block sm:block">
                <p className="text-sm font-bold text-zinc-950 dark:text-white">{branding.ui.navTitle}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{branding.ui.navSubtitle}</p>
              </div>
            </div>
          </div>

          {/* Desktop navigation links */}
          <div className="hidden lg:flex lg:flex-1 lg:justify-center xl:justify-start">
            <div className="flex min-w-0 max-w-full flex-wrap items-center gap-1.5 rounded-3xl bg-zinc-100 px-2 py-1.5 shadow-sm dark:bg-zinc-900/80">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `navbar-link px-3 py-2 text-xs xl:text-sm ${isActive ? 'navbar-link-active shadow-sm ring-1 ring-primary-200 dark:bg-primary-900/20 dark:text-primary-300' : 'text-zinc-600 hover:bg-white hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white'}`
                  }
                >
                  <link.icon className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
                  <span className="hidden xl:inline">{link.label}</span>
                  <span className="inline xl:hidden">{link.label.replace(/ .*/, '')}</span>
                </NavLink>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2" data-dropdown="true">
            {/* Theme toggle */}
            <button
              onClick={toggleDarkMode}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-all duration-200 hover:border-zinc-300 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>

            {/* Notifications */}
            <div className="relative" data-dropdown="true">
              <button
                onClick={(e) => { e.stopPropagation(); setNotifOpen((value) => !value); }}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-all duration-200 hover:border-zinc-300 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
                aria-label="Toggle notifications"
                aria-expanded={notifOpen}
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                  <div className="dropdown-mobile-safe sm:absolute sm:right-0 sm:left-auto sm:w-80 w-auto z-40 rounded-[28px] border border-slate-200 bg-white shadow-xl overflow-hidden dark:border-slate-800 dark:bg-zinc-950 animate-in max-h-[80vh] flex flex-col">
                    <div className="border-b border-slate-200/80 px-4 py-3 dark:border-slate-800 shrink-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-800 dark:text-slate-400">{unreadCount} unread</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Latest updates delivered in a clean, grouped list.</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-8 text-center">
                          <Bell className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                          <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">You will see alerts here as activity arrives.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {unread.length > 0 && (
                            <div className="space-y-2 rounded-3xl bg-slate-50 p-2 dark:bg-slate-900">
                              <p className="px-3 text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Unread</p>
                              {unread.map((n) => (
                                <button
                                  key={n.id}
                                  onClick={() => markRead(n.id)}
                                  className="flex w-full items-start gap-3 rounded-[24px] border border-primary-100 bg-white px-4 py-3 text-left text-sm font-medium text-slate-900 transition hover:bg-primary-50 dark:border-primary-900/30 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-primary-900/20"
                                >
                                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary-600" />
                                  <span>{n.message}</span>
                                </button>
                              ))}
                            </div>
                          )}
                          {earlier.length > 0 && (
                            <div className="space-y-2 rounded-3xl bg-slate-50 p-2 dark:bg-slate-900">
                              <p className="px-3 text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Earlier</p>
                              {earlier.map((n) => (
                                <button
                                  key={n.id}
                                  onClick={() => markRead(n.id)}
                                  className="flex w-full items-start gap-3 rounded-[24px] px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-400" />
                                  <span>{n.message}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User dropdown (desktop) */}
            <div className="relative hidden sm:block" data-dropdown="true">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setUserOpen((value) => !value); }}
                className="relative inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all duration-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
              >
                <span className="max-w-[120px] truncate">{user?.name}</span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{user?.role}</span>
              </button>
              {userOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setUserOpen(false)} />
                  <div className="user-dropdown-mobile sm:absolute sm:right-0 sm:left-auto sm:w-48 sm:top-full sm:mt-2 sm:translate-y-0 w-auto z-40 rounded-[28px] border border-slate-200 bg-white shadow-xl overflow-hidden dark:border-slate-800 dark:bg-zinc-950 animate-in">
                    <div className="p-2">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        {location.pathname !== '/login' && location.pathname !== '/register' && user && (
          <div className="hidden items-center gap-2 rounded-3xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 md:flex">
            <Link to={getDashboardPath()} className="font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">{getRoleLabel()}</Link>
            <span className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              <ChevronRight className="h-3 w-3" />
              <span className="text-zinc-900 dark:text-white">{getPageLabel()}</span>
            </span>
          </div>
        )}
      </div>
    </nav>
  );
}
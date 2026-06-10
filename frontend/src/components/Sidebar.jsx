import { useEffect, useRef, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  BarChart3,
  Settings,
  User,
  AlertTriangle,
  Bug,
  Shield,
  X,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import branding from '../config/branding';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const sidebarRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousActiveElement = useRef(null);

  const getNavLinks = () => {
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
        { to: '/official/profile', label: 'Profile', icon: User },
        { to: '/official/settings', label: 'Settings', icon: Settings },
      ];
    }
    if (role === 'SUPERVISOR') {
      return [
        { to: '/supervisor', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/supervisor/issues', label: 'Issues', icon: AlertTriangle },
        { to: '/supervisor/reports', label: 'Reports', icon: BarChart3 },
        { to: '/supervisor/profile', label: 'Profile', icon: User },
        { to: '/supervisor/settings', label: 'Settings', icon: Settings },
      ];
    }
    return [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/issues/new', label: 'Report Issue', icon: PlusCircle },
      { to: '/profile', label: 'Profile', icon: User },
      { to: '/settings', label: 'Settings', icon: Settings },
    ];
  };

  const navLinks = getNavLinks();

  // Close sidebar on route change (mobile/tablet)
  useEffect(() => {
    if (!isOpen) return;
    // Only auto-close on mobile/tablet
    if (window.innerWidth < 1024) {
      onClose?.();
    }
  }, [location.pathname]);

  // Escape key closes sidebar
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trapping
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement;

    // Focus the close button when sidebar opens
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 100);

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      const focusableElements = sidebarRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleTabKey);
    return () => {
      window.removeEventListener('keydown', handleTabKey);
      // Restore focus when sidebar closes
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose]);

  const handleLogout = () => {
    logout();
    onClose?.();
  };

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      onClose?.();
    }
  };

  // Determine if sidebar should be rendered as overlay (mobile/tablet)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  return (
    <>
      {/* Overlay for mobile/tablet */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm animate-fade-in lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        ref={sidebarRef}
        role="navigation"
        aria-label="Main navigation"
        aria-modal={isOpen && !isMobile ? undefined : 'true'}
        className={`
          sidebar-panel flex h-fit flex-col gap-5 p-5

          /* Desktop: static positioned, always visible */
          lg:static lg:block lg:h-auto lg:shadow-sm

          /* Mobile/Tablet: fixed drawer */
          fixed inset-y-0 left-0 z-50 w-72 md:w-80
          overflow-y-auto shadow-2xl
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:transform-none lg:shadow-sm
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary-700 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-950 dark:text-white truncate">{branding.ui.navTitle}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{branding.ui.navSubtitle}</p>
            </div>
          </div>

          {/* Close button - only visible on mobile/tablet */}
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="lg:hidden touch-friendly rounded-2xl text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section title - desktop only */}
        <div className="hidden lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">{branding.ui.sidebarTitle}</p>
          <h2 className="mt-3 text-xl font-semibold text-zinc-950 dark:text-white">{branding.ui.sidebarSubtitle}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">Quick access to your most used pages.</p>
        </div>

        {/* Navigation links */}
        <nav className="flex flex-col gap-1.5">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/' || link.to === '/admin' || link.to === '/official' || link.to === '/supervisor'}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `group navbar-link ${
                  isActive
                    ? 'navbar-link-active shadow-sm ring-1 ring-primary-200 dark:bg-primary-900/20 dark:text-primary-300'
                    : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white'
                }`
              }
              aria-current={({ isActive }) => isActive ? 'page' : undefined}
            >
              <link.icon className="h-4 w-4 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer - mobile/tablet only */}
        <div className="mt-auto space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800 lg:hidden">
          <button
            onClick={() => { toggleDarkMode(); }}
            className="flex w-full items-center justify-between rounded-3xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
          >
            <span>Theme</span>
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">Signed in as</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 truncate">{user?.name}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-500">{user?.role}</p>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center rounded-3xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
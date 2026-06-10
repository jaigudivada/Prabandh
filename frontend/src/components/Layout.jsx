import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function Layout() {
  const location = useLocation();
  const mainRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change for mobile/tablet
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // Body scroll locking when sidebar is open on mobile/tablet
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 1024) {
      document.body.classList.add('scroll-locked');
    } else {
      document.body.classList.remove('scroll-locked');
    }
    return () => document.body.classList.remove('scroll-locked');
  }, [sidebarOpen]);

  // Close sidebar on window resize from mobile to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.classList.add('page-transition');
      const timer = setTimeout(() => {
        mainRef.current?.classList.remove('page-transition');
      }, 260);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <Navbar onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      {/* Content area with sidebar awareness */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col lg:flex-row lg:gap-6 lg:px-8 lg:py-8">
        {/* Sidebar: 
            - Desktop (>=1024px): static column, always visible
            - Tablet/Mobile (<1024px): fixed drawer controlled by sidebarOpen state
        */}
        <aside className="relative lg:block lg:w-72 lg:shrink-0">
          {/* Desktop spacer to maintain layout when sidebar is fixed on mobile */}
          <div className="hidden lg:block">
            <Sidebar isOpen={true} onClose={() => {}} />
          </div>
          <div className="block lg:hidden">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          </div>
        </aside>

        {/* Main content area */}
        <main
          ref={mainRef}
          className="min-w-0 flex-1 mx-0 lg:mx-0 rounded-none lg:rounded-[32px] bg-white/90 p-4 shadow-sm shadow-zinc-200/50 backdrop-blur transition-all duration-300 dark:bg-zinc-900/90 dark:shadow-none sm:p-6 lg:p-8 lg:m-4 lg:ml-0"
        >
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
}
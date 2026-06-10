import React, { useEffect, useState } from 'react';
import branding from '../config/branding';

export default function Preloader({ onComplete }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [showAttribution, setShowAttribution] = useState(false);

  useEffect(() => {
    // Staggered fade-in for attribution after main elements appear
    const attributionTimer = setTimeout(() => {
      setShowAttribution(true);
    }, 800);

    // Simulate loading completion after a short delay
    const exitTimer = setTimeout(() => {
      setIsExiting(true);

      // Allow exit animation to complete before removing
      setTimeout(() => {
        setIsVisible(false);
        if (onComplete) onComplete();
      }, 500);
    }, 2200);

    return () => {
      clearTimeout(attributionTimer);
      clearTimeout(exitTimer);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  const { project, attribution } = branding;

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex items-center justify-center
        bg-slate-50 dark:bg-slate-950
        transition-opacity duration-500 ease-out
        ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}
      `}
    >
      <div className="flex flex-col items-center justify-center gap-8 sm:gap-10">
        {/* Single centered container for logo and spinner */}
        <div className="relative flex items-center justify-center">
          {/* Spinner container - absolute positioned to share center */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Outer ring */}
            <div
              className="absolute w-36 h-36 rounded-full border-2 border-primary-200 dark:border-primary-800"
              style={{
                animation: 'spin 3s linear infinite',
                borderTopColor: 'transparent',
                borderBottomColor: 'transparent',
                transformOrigin: 'center',
              }}
            />
            {/* Inner ring */}
            <div
              className="absolute w-28 h-28 rounded-full border-2 border-primary-300 dark:border-primary-700"
              style={{
                animation: 'spin 2s linear infinite reverse',
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                transformOrigin: 'center',
              }}
            />
          </div>

          {/* Logo - perfectly centered */}
          <div
            className="relative z-10 flex items-center justify-center"
            style={{
              animation: 'pulse 2s ease-in-out infinite',
              transformOrigin: 'center',
            }}
          >
            <img
              src="/logo.png"
              alt="Prabandh - Campus Issue Management"
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
            />
          </div>
        </div>

        {/* Branding text hierarchy */}
        <div className="text-center">
          {/* PRABANDH — Primary branding */}
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
            style={{
              animation: 'fadeInUp 0.6s ease-out 0.2s both',
            }}
          >
            {project.name}
          </h1>

          {/* Issue Management Portal — Subtitle */}
          <p
            className="mt-1 text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400 tracking-wide"
            style={{
              animation: 'fadeInUp 0.6s ease-out 0.4s both',
            }}
          >
            {project.subtitle}
          </p>

          {/* A JAI VERSE Product — Attribution with fade-in only */}
          <p
            className={`mt-4 text-xs sm:text-sm font-medium tracking-wider transition-all duration-700 ease-out ${
              showAttribution
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-2'
            } text-slate-400 dark:text-slate-500`}
          >
            {attribution.text}
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.03); opacity: 0.95; }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
/**
 * LogoPreloader Component
 * Animated logo preloader with sequential letter animations
 * Based on the Vatkin's Boutique logo design
 */

import { useEffect, useState } from 'react';

interface LogoPreloaderProps {
  /** Optional text to show below the logo */
  text?: string;
  /** Whether to show full screen overlay */
  fullScreen?: boolean;
  /** Callback when animation completes (optional) */
  onComplete?: () => void;
}

export function LogoPreloader({
  text,
  fullScreen = true,
  onComplete,
}: LogoPreloaderProps) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Animation stages timing
    const timers = [
      setTimeout(() => setStage(1), 100),   // Green square appears
      setTimeout(() => setStage(2), 400),   // 'ס appears in square
      setTimeout(() => setStage(3), 700),   // ותקין appears
      setTimeout(() => setStage(4), 1000),  // בוטיק appears
      setTimeout(() => setStage(5), 1400),  // Full logo assembled
    ];

    // Call onComplete after full animation
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 1800);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const content = (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Logo Animation Container */}
      <div className="flex items-center justify-center h-20 overflow-hidden" dir="rtl">
        {/* ותקין - Right side text */}
        <div
          className={`
            text-4xl font-bold text-[#1a1a1a] tracking-wide
            transition-all duration-500 ease-out
            ${stage >= 3 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
          `}
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          ותקין
        </div>

        {/* Green Square with 'ס */}
        <div
          className={`
            relative mx-1 flex items-center justify-center
            transition-all duration-500 ease-out
            ${stage >= 1 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
          `}
        >
          {/* Green Background Square */}
          <div
            className={`
              w-14 h-14 bg-[#9CAD3C] rounded-sm
              transition-all duration-300
              ${stage >= 5 ? '' : 'animate-pulse'}
            `}
          />
          {/* 'ס Character */}
          <span
            className={`
              absolute text-4xl font-bold text-[#1a1a1a]
              transition-all duration-400 ease-out
              ${stage >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
            `}
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            'ס
          </span>
        </div>

        {/* בוטיק - Left side text */}
        <div
          className={`
            text-4xl font-bold text-[#1a1a1a] tracking-wide
            transition-all duration-500 ease-out
            ${stage >= 4 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
          `}
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          בוטיק
        </div>
      </div>

      {/* Loading dots animation */}
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-[#3d817a]"
            style={{
              animation: 'bounce 1s infinite',
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>

      {/* Optional text */}
      {text && (
        <p
          className={`
            text-gray-500 text-sm
            transition-opacity duration-500
            ${stage >= 3 ? 'opacity-100' : 'opacity-0'}
          `}
        >
          {text}
        </p>
      )}

      {/* CSS for bounce animation */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {content}
    </div>
  );
}

/**
 * Mini version for inline loading states
 */
export function LogoPreloaderMini() {
  return (
    <div className="flex items-center gap-3">
      {/* Mini green square */}
      <div className="relative w-8 h-8 flex items-center justify-center">
        <div className="w-full h-full bg-[#9CAD3C] rounded-sm animate-pulse" />
        <span
          className="absolute text-lg font-bold text-[#1a1a1a]"
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          'ס
        </span>
      </div>
      {/* Loading dots */}
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#3d817a]"
            style={{
              animation: 'bounce 1s infinite',
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}

/**
 * Premium version with floating particles effect
 */
export function LogoPreloaderPremium({
  text,
  fullScreen = true,
}: LogoPreloaderProps) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 200),
      setTimeout(() => setStage(2), 500),
      setTimeout(() => setStage(3), 800),
      setTimeout(() => setStage(4), 1100),
      setTimeout(() => setStage(5), 1500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Generate random particles
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 200 - 100,
    y: Math.random() * 200 - 100,
    size: Math.random() * 8 + 4,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
  }));

  const content = (
    <div className="relative flex flex-col items-center justify-center gap-8">
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `calc(50% + ${p.x}px)`,
              top: `calc(50% + ${p.y}px)`,
              backgroundColor: p.id % 3 === 0 ? '#9CAD3C' : p.id % 3 === 1 ? '#3d817a' : '#043841',
              opacity: stage >= 1 ? 0.6 : 0,
              animation: stage >= 1 ? `float ${p.duration}s ease-in-out infinite` : 'none',
              animationDelay: `${p.delay}s`,
              transition: 'opacity 0.5s ease-out',
            }}
          />
        ))}
      </div>

      {/* Glow effect behind logo */}
      <div
        className={`
          absolute w-40 h-40 rounded-full
          transition-all duration-1000 ease-out
          ${stage >= 1 ? 'opacity-30 scale-100' : 'opacity-0 scale-50'}
        `}
        style={{
          background: 'radial-gradient(circle, #9CAD3C 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Logo Animation Container */}
      <div className="relative flex items-center justify-center h-24 z-10" dir="rtl">
        {/* ותקין - Right side text */}
        <div
          className={`
            text-5xl font-bold text-[#1a1a1a] tracking-wide
            transition-all duration-700 ease-out
            ${stage >= 3 ? 'opacity-100 translate-x-0 blur-0' : 'opacity-0 translate-x-8 blur-sm'}
          `}
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          ותקין
        </div>

        {/* Green Square with 'ס */}
        <div
          className={`
            relative mx-2 flex items-center justify-center
            transition-all duration-600 ease-out
            ${stage >= 1 ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 rotate-180'}
          `}
        >
          {/* Animated border */}
          <div
            className={`
              absolute inset-0 rounded-md
              ${stage >= 2 && stage < 5 ? 'animate-spin-slow' : ''}
            `}
            style={{
              background: stage >= 2 ? 'conic-gradient(from 0deg, #9CAD3C, #3d817a, #043841, #9CAD3C)' : 'transparent',
              padding: 3,
              opacity: stage >= 5 ? 0 : 1,
              transition: 'opacity 0.3s',
            }}
          >
            <div className="w-full h-full bg-white rounded-md" />
          </div>
          
          {/* Green Background Square */}
          <div className="w-16 h-16 bg-[#9CAD3C] rounded-md shadow-lg" />
          
          {/* 'ס Character */}
          <span
            className={`
              absolute text-5xl font-bold text-[#1a1a1a]
              transition-all duration-500 ease-out
              ${stage >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
            `}
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            'ס
          </span>
        </div>

        {/* בוטיק - Left side text */}
        <div
          className={`
            text-5xl font-bold text-[#1a1a1a] tracking-wide
            transition-all duration-700 ease-out
            ${stage >= 4 ? 'opacity-100 translate-x-0 blur-0' : 'opacity-0 -translate-x-8 blur-sm'}
          `}
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          בוטיק
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#9CAD3C] via-[#3d817a] to-[#043841] rounded-full transition-all duration-500"
          style={{ width: `${stage * 20}%` }}
        />
      </div>

      {/* Optional text */}
      {text && (
        <p
          className={`
            text-gray-500 text-sm
            transition-all duration-500
            ${stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          {text}
        </p>
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-20px) scale(1.2);
            opacity: 0.3;
          }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gray-100 z-50">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {content}
    </div>
  );
}

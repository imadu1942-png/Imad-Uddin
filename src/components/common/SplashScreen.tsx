import React, { useState, useEffect } from 'react';
import officialLogo from '../../assets/images/official_logo_1790499886861.jpg';

interface SplashScreenProps {
  onComplete: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  durationMs = 4200,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    const startTime = performance.now();
    let animationFrameId: number;
    let completedTimeoutId: NodeJS.Timeout;
    let fadeTimeoutId: NodeJS.Timeout;

    const updateProgress = (now: number) => {
      const elapsed = now - startTime;
      const currentProgress = Math.min(100, Math.floor((elapsed / durationMs) * 100));
      setProgress(currentProgress);

      if (currentProgress < 100) {
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        setProgress(100);
        // Clearly show 100% for a moment before smoothly fading out
        completedTimeoutId = setTimeout(() => {
          setIsFadingOut(true);
          fadeTimeoutId = setTimeout(() => {
            onComplete();
          }, 500); // Smooth 500ms fade transition into entry page
        }, 250);
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (completedTimeoutId) clearTimeout(completedTimeoutId);
      if (fadeTimeoutId) clearTimeout(fadeTimeoutId);
    };
  }, [durationMs, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white px-4 selection:bg-none transition-opacity duration-500 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#000000' }}
    >
      {/* Background subtle radial glow matching the logo's Islamic emerald green */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-950/30 via-black to-black pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center max-w-sm sm:max-w-md w-full text-center">
        {/* Official Logo Container - exact proportions, no crop, no stretch, no distortion */}
        <div className="w-48 h-48 sm:w-60 sm:h-60 md:w-68 md:h-68 aspect-square relative flex items-center justify-center mb-6">
          <img
            src={officialLogo}
            alt="আশেকানে গাউছিয়া অফিসিয়াল লোগো"
            className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(16,185,129,0.25)]"
            referrerPolicy="no-referrer"
            loading="eager"
          />
        </div>

        {/* Organization Name */}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
          আশেকানে গাউছিয়া
        </h1>
        <p className="text-xs sm:text-sm text-emerald-400 font-medium mb-6">
          হাদিয়া, মাহফিল ও আয়-ব্যয়ের হিসাব
        </p>

        {/* Smooth Loading Progress Bar */}
        <div className="w-56 sm:w-64 max-w-[80vw] space-y-2.5">
          <div className="w-full h-2 bg-stone-900 rounded-full overflow-hidden border border-emerald-900/40 p-[1px] shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.6)] transition-all duration-75 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Loading Text strictly matching prompt requirement: "লোড হচ্ছে... 0%" -> "লোড হচ্ছে... 100%" */}
          <div className="text-xs sm:text-sm font-medium text-stone-300 tracking-wide">
            লোড হচ্ছে... {progress}%
          </div>
        </div>
      </div>
    </div>
  );
};

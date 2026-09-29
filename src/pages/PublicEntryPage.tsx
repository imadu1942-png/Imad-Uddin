import React, { useState } from 'react';
import { ArrowRight, Shield } from 'lucide-react';
import { IslamicDomeLogo } from '../components/common/IslamicDomeLogo';
import { PublicViewSettings, DEFAULT_PUBLIC_VIEW_SETTINGS } from '../types/database.types';
import { getThemeStyles } from '../utils/themeHelper';

interface PublicEntryPageProps {
  onEnterAsGuest: (name: string) => void;
  onOpenAdminLogin: () => void;
  settings?: PublicViewSettings;
}

export const PublicEntryPage: React.FC<PublicEntryPageProps> = ({
  onEnterAsGuest,
  onOpenAdminLogin,
  settings = DEFAULT_PUBLIC_VIEW_SETTINGS,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const currentSettings = settings || DEFAULT_PUBLIC_VIEW_SETTINGS;
  const themeStyles = getThemeStyles(currentSettings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim() || 'সম্মানিত অতিথি';
    setError('');
    onEnterAsGuest(trimmed);
  };

  return (
    <div className={`min-h-screen ${themeStyles.entryBgClass} flex flex-col justify-between items-center p-4 sm:p-6 selection:bg-emerald-500 selection:text-white transition-colors duration-300`}>
      {/* Top spacer */}
      <div className="w-full pt-4 sm:pt-8" />

      {/* Main Card */}
      <div className="w-full max-w-md mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-black border-2 border-emerald-500/40 p-1 mb-4 shadow-xl shadow-emerald-950/60 overflow-hidden">
            {currentSettings.logoUrl ? (
              <img
                src={currentSettings.logoUrl}
                alt={currentSettings.orgName}
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback to dome logo if custom image fails to load
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <IslamicDomeLogo className="w-full h-full object-contain" />
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {currentSettings.orgName}
          </h1>
          {currentSettings.subtitle && (
            <p className="text-sm sm:text-base text-emerald-300/90 mt-1.5 font-medium">
              {currentSettings.subtitle}
            </p>
          )}
        </div>

        {/* Public Entry Card */}
        <div className={`bg-stone-900/90 backdrop-blur-md rounded-2xl border ${themeStyles.entryCardBorderClass} shadow-2xl p-6 sm:p-8 text-stone-100`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="guest-name-input" className="block text-xs font-medium text-stone-300 mb-2">
                {currentSettings.welcomeMessage || 'স্বাগতম! আপনার পরিচয় দিন:'}
              </label>
              <input
                id="guest-name-input"
                type="text"
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="আপনার নাম এখানে দিন"
                className="w-full h-12 px-4 bg-stone-950/70 border border-stone-700 rounded-xl text-sm sm:text-base text-stone-100 placeholder-stone-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-inner"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-400 font-medium">{error}</p>
            )}

            <button
              type="submit"
              style={{ backgroundColor: currentSettings.accentColor }}
              className="w-full h-12 hover:opacity-90 active:scale-[0.99] text-white font-semibold text-sm sm:text-base rounded-xl transition-all shadow-lg shadow-black/40 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>প্রবেশ করুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Admin / Cashier Login Link */}
          <div className="mt-8 pt-5 border-t border-stone-800 text-center">
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-emerald-300 transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-stone-800/60"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>অ্যাডমিন / ক্যাশিয়ার লগইন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-4 text-xs text-stone-500">
        {currentSettings.footerText || `© ${new Date().getFullYear()} ${currentSettings.orgName}। সর্বস্বত্ব সংরক্ষিত।`}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ArrowRight, Shield } from 'lucide-react';
import { IslamicDomeLogo } from '../components/common/IslamicDomeLogo';

interface PublicEntryPageProps {
  onEnterAsGuest: (name: string) => void;
  onOpenAdminLogin: () => void;
}

export const PublicEntryPage: React.FC<PublicEntryPageProps> = ({
  onEnterAsGuest,
  onOpenAdminLogin,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('অনুগ্রহ করে আপনার নাম লিখুন।');
      return;
    }
    setError('');
    onEnterAsGuest(trimmed);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-stone-900 to-stone-950 flex flex-col justify-between items-center p-4 sm:p-6 selection:bg-emerald-500 selection:text-white">
      {/* Top spacer */}
      <div className="w-full pt-4 sm:pt-8" />

      {/* Main Card */}
      <div className="w-full max-w-md mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-800/40 border border-emerald-500/30 text-emerald-400 mb-4 shadow-xl shadow-emerald-950/60 backdrop-blur-xs">
            <IslamicDomeLogo className="w-9 h-9 text-emerald-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            আশেকানে গাউছিয়া
          </h1>
          <p className="text-sm sm:text-base text-emerald-300/90 mt-1.5 font-medium">
            হাদিয়া, মাহফিল ও আয়-ব্যয়ের হিসাব
          </p>
        </div>

        {/* Public Entry Card */}
        <div className="bg-stone-900/90 backdrop-blur-md rounded-2xl border border-stone-700/60 shadow-2xl p-6 sm:p-8 text-stone-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="guest-name-input" className="block text-xs font-medium text-stone-300 mb-2">
                স্বাগতম! আপনার পরিচয় দিন:
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
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-semibold text-sm sm:text-base rounded-xl transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 cursor-pointer"
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
        © {new Date().getFullYear()} আশেকানে গাউছিয়া। সর্বস্বত্ব সংরক্ষিত।
      </div>
    </div>
  );
};

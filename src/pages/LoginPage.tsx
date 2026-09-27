import React, { useState } from 'react';
import { Lock, Mail, Shield, Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react';
import { IslamicDomeLogo } from '../components/common/IslamicDomeLogo';

interface LoginPageProps {
  onSignIn: (email: string, password: string) => Promise<any>;
  onBack: () => void;
  isLoading: boolean;
  authError?: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSignIn,
  onBack,
  isLoading,
  authError,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড উভয়ই প্রদান করুন।');
      return;
    }

    setSubmitting(true);

    try {
      await onSignIn(email, password);
    } catch (err: any) {
      setErrorMessage(err?.message || 'লগইন ব্যর্থ হয়েছে। ইমেইল ও পাসওয়ার্ড পুনরায় যাচাই করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-stone-900 to-stone-950 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-emerald-500 selection:text-white">
      {/* Container */}
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300 hover:text-white transition-colors cursor-pointer bg-stone-900/60 hover:bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-800 backdrop-blur-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>পাবলিক এন্ট্রিতে ফিরে যান</span>
          </button>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-black border-2 border-emerald-500/40 p-1 mb-3 shadow-lg shadow-emerald-950/50 overflow-hidden">
            <IslamicDomeLogo className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            অ্যাডমিন / ক্যাশিয়ার লগইন
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            আশেকানে গাউছিয়া - অনুমোদিত দায়িত্বপ্রাপ্তদের প্রবেশদ্বার
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-stone-900/90 backdrop-blur-md rounded-2xl border border-stone-700/60 shadow-2xl p-6 sm:p-8 text-stone-100">
          {/* Alerts */}
          {(errorMessage || authError) && (
            <div className="mb-5 p-3.5 bg-rose-950/80 border border-rose-800/80 text-rose-200 rounded-xl text-xs sm:text-sm flex items-start gap-2.5">
              <span className="text-rose-400 font-bold text-base leading-none">!</span>
              <p className="leading-snug">{errorMessage || authError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                নিবন্ধিত ইমেইল ঠিকানা <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full h-11 pl-10 pr-3.5 bg-stone-950/60 border border-stone-700 rounded-xl text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                পাসওয়ার্ড <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="আপনার পাসওয়ার্ড লিখুন"
                  className="w-full h-11 pl-10 pr-10 bg-stone-950/60 border border-stone-700 rounded-xl text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full h-11 mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting || isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>যাচাই করা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>লগইন করুন</span>
                </>
              )}
            </button>
          </form>

          {/* Secure info */}
          <div className="mt-6 pt-5 border-t border-stone-800 text-center">
            <p className="text-xs text-stone-500 flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              Supabase Auth ও RLS পলিসি সুরক্ষিত
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

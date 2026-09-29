import React from 'react';
import { HeartHandshake, Receipt, CalendarPlus, Zap } from 'lucide-react';

interface QuickEntrySectionProps {
  onQuickDonation: () => void;
  onQuickExpense: () => void;
  onQuickMahfil: () => void;
  canEdit: boolean;
}

export const QuickEntrySection: React.FC<QuickEntrySectionProps> = ({
  onQuickDonation,
  onQuickExpense,
  onQuickMahfil,
  canEdit,
}) => {
  if (!canEdit) return null;

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-xs space-y-3">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Zap className="w-4 h-4 fill-emerald-700 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight">
              দ্রুত ভুক্তি (Quick Entry)
            </h3>
            <p className="text-[11px] sm:text-xs text-stone-500">
              এক ক্লিকে নতুন হাদিয়া, খরচ বা মাহফিল যোগ করুন
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md hidden sm:inline-block">
          অ্যাডমিন ও ক্যাশিয়ার
        </span>
      </div>

      {/* 3 Large Touch-Friendly Actions on Mobile & Desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1">
        {/* 1. + হাদিয়া যোগ করুন */}
        <button
          type="button"
          onClick={onQuickDonation}
          className="group relative min-h-[58px] sm:min-h-[56px] px-4 py-3 bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 active:scale-[0.98] text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-between sm:justify-center gap-3 border border-emerald-600/30 text-left sm:text-center"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-4 h-4 text-emerald-100" />
            </div>
            <div>
              <span className="text-sm font-bold block tracking-tight">
                + হাদিয়া যোগ করুন
              </span>
              <span className="text-[10px] text-emerald-200/90 block sm:hidden">
                দান বা চাঁদা সংগ্রহ
              </span>
            </div>
          </div>
          <span className="text-xs text-emerald-200 font-bold sm:hidden">→</span>
        </button>

        {/* 2. + খরচ যোগ করুন */}
        <button
          type="button"
          onClick={onQuickExpense}
          className="group relative min-h-[58px] sm:min-h-[56px] px-4 py-3 bg-gradient-to-r from-rose-700 to-rose-800 hover:from-rose-800 hover:to-rose-900 active:scale-[0.98] text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-between sm:justify-center gap-3 border border-rose-600/30 text-left sm:text-center"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4 text-rose-100" />
            </div>
            <div>
              <span className="text-sm font-bold block tracking-tight">
                + খরচ যোগ করুন
              </span>
              <span className="text-[10px] text-rose-200/90 block sm:hidden">
                ব্যয় ও ভাউচার লিপিবদ্ধ
              </span>
            </div>
          </div>
          <span className="text-xs text-rose-200 font-bold sm:hidden">→</span>
        </button>

        {/* 3. + মাহফিল যোগ করুন */}
        <button
          type="button"
          onClick={onQuickMahfil}
          className="group relative min-h-[58px] sm:min-h-[56px] px-4 py-3 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 active:scale-[0.98] text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-between sm:justify-center gap-3 border border-teal-600/30 text-left sm:text-center"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <CalendarPlus className="w-4 h-4 text-teal-100" />
            </div>
            <div>
              <span className="text-sm font-bold block tracking-tight">
                + মাহফিল যোগ করুন
              </span>
              <span className="text-[10px] text-teal-200/90 block sm:hidden">
                নতুন দ্বীনি মাহফিল তৈরি
              </span>
            </div>
          </div>
          <span className="text-xs text-teal-200 font-bold sm:hidden">→</span>
        </button>
      </div>
    </div>
  );
};

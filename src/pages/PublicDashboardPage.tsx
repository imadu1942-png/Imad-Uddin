import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { databaseService } from '../services/databaseService';
import { PublicSummary, PublicViewSettings, DEFAULT_PUBLIC_VIEW_SETTINGS } from '../types/database.types';
import { StatCard } from '../components/common/StatCard';
import { OrgMembersSection } from '../components/public/OrgMembersSection';
import { formatCurrency, toBengaliNumber, formatBengaliDate } from '../utils/formatters';
import { getThemeStyles } from '../utils/themeHelper';
import { IslamicDomeLogo } from '../components/common/IslamicDomeLogo';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Wallet,
  CalendarDays,
  MapPin,
  FileText,
  AlertTriangle,
  RefreshCw,
  CalendarRange,
  Building2,
} from 'lucide-react';

const BENGALI_MONTH_LABELS: Record<number, string> = {
  1: '১. জানুয়ারি',
  2: '২. ফেব্রুয়ারি',
  3: '৩. মার্চ',
  4: '৪. এপ্রিল',
  5: '৫. মে',
  6: '৬. জুন',
  7: '৭. জুলাই',
  8: '৮. আগস্ট',
  9: '৯. সেপ্টেম্বর',
  10: '১০. অক্টোবর',
  11: '১১. নভেম্বর',
  12: '১২. ডিসেম্বর',
};

interface PublicDashboardPageProps {
  guestName?: string;
  settings?: PublicViewSettings;
  activeSection?: 'financial' | 'members';
  onSectionChange?: (section: 'financial' | 'members') => void;
}

export const PublicDashboardPage: React.FC<PublicDashboardPageProps> = ({
  guestName,
  settings = DEFAULT_PUBLIC_VIEW_SETTINGS,
  activeSection,
  onSectionChange,
}) => {
  const [data, setData] = useState<PublicSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [internalSection, setInternalSection] = useState<'financial' | 'members'>(activeSection || 'financial');

  useEffect(() => {
    if (activeSection) {
      setInternalSection(activeSection);
    }
  }, [activeSection]);

  const currentSection = activeSection || internalSection;

  const handleSwitchSection = (sec: 'financial' | 'members') => {
    setInternalSection(sec);
    if (onSectionChange) {
      onSectionChange(sec);
    }
  };

  const currentSettings = settings || DEFAULT_PUBLIC_VIEW_SETTINGS;
  const themeStyles = getThemeStyles(currentSettings);

  const fetchPublicSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!supabase) {
        throw new Error('ডাটাবেস সংযোগ কনফিগার করা হয়নি। অনুগ্রহ করে ইন্টারনেট ও পরিবেশ ভ্যারিয়েবল পরীক্ষা করুন।');
      }

      // Invoke getPublicSummary with RPC support and direct table aggregation fallback
      const summary = await databaseService.getPublicSummary();

      if (!summary) {
        throw new Error('ডাটাবেস থেকে কোনো তথ্য পাওয়া যায়নি।');
      }

      setData(summary);
      setError(null);
    } catch (err: any) {
      console.error('Public data loading failure:', err);
      setError(err?.message || 'হিসাব লোড করা যাচ্ছে না। আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Immediately call get_public_summary() when Public View opens
  useEffect(() => {
    fetchPublicSummary();
  }, [fetchPublicSummary]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className={`rounded-2xl p-5 sm:p-6 text-white shadow-sm transition-all duration-300 ${themeStyles.headerContainerClass}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            {/* Logo */}
            <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/20 p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-inner">
              {currentSettings.logoUrl ? (
                <img
                  src={currentSettings.logoUrl}
                  alt={currentSettings.orgName}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <IslamicDomeLogo className="w-full h-full object-contain" />
              )}
            </div>

            <div>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border mb-1.5 ${themeStyles.badgeClass}`}>
                <span>পাবলিক আর্থিক খতিয়ান</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {guestName ? `${guestName}, স্বাগতম!` : `${currentSettings.orgName} আর্থিক বিবরণী`}
              </h2>
              <p className="text-white/85 text-xs sm:text-sm mt-0.5 max-w-xl leading-relaxed">
                {currentSettings.subtitle || `${currentSettings.orgName}-এর সকল দান, মাহফিল ফান্ড ও ব্যয়ের সামগ্রিক হিসাব ও স্বচ্ছ বিবরণী।`}
              </p>
            </div>
          </div>

          <div className="shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={fetchPublicSummary}
              disabled={isLoading}
              style={{ backgroundColor: currentSettings.accentColor }}
              className="inline-flex items-center gap-2 px-3.5 py-2 hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-opacity cursor-pointer border border-white/20"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>হিসাব রিফ্রেশ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Public Navigation Tabs: Financial Accounts & Organizational Members */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => handleSwitchSection('financial')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            currentSection === 'financial'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 bg-white border border-stone-200'
          }`}
        >
          <Wallet className="w-4 h-4 text-emerald-500" />
          <span>আর্থিক বিবরণী ও খতিয়ান</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchSection('members')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            currentSection === 'members'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 bg-white border border-stone-200'
          }`}
        >
          <Users className="w-4 h-4 text-teal-500" />
          <span>সংগঠনের সদস্যবৃন্দ</span>
        </button>
      </div>

      {/* Render Selected Public Section */}
      {currentSection === 'members' ? (
        <OrgMembersSection themeAccentColor={currentSettings.accentColor} />
      ) : isLoading ? (
        /* Loading State: explicitly required to show "হিসাব লোড হচ্ছে..." and not show 0 initially */
        <div className="bg-white rounded-2xl border border-stone-200/90 p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-3 min-h-[340px]">
          <div className="w-10 h-10 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin" />
          <h3 className="text-base font-bold text-stone-800">
            হিসাব লোড হচ্ছে...
          </h3>
          <p className="text-xs text-stone-500 max-w-md">
            সুপাবেস ডাটাবেস থেকে সার্বজনীন আর্থিক বিবরণী সংগ্রহ করা হচ্ছে
          </p>
        </div>
      ) : error ? (
        /* Error State */
        <div className="bg-rose-50/90 rounded-2xl border border-rose-200 p-8 text-center shadow-xs flex flex-col items-center justify-center space-y-3 min-h-[280px]">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xl">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="text-base font-bold text-rose-900">
            হিসাব লোড করা যাচ্ছে না। আবার চেষ্টা করুন।
          </h3>
          <p className="text-xs text-rose-700 max-w-md leading-relaxed font-mono">
            {error}
          </p>
          <button
            type="button"
            onClick={fetchPublicSummary}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>আবার চেষ্টা করুন</span>
          </button>
        </div>
      ) : data ? (
        /* Real Supabase Summary Render */
        <div className="space-y-8">
          {/* Section 1: Active Member Count & Current Month Financial Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-stone-800 flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-emerald-700" />
                <span>চলতি মাসের আর্থিক পরিস্থিতি ও সদস্য তথ্য</span>
              </h3>
              <span className="text-xs text-stone-500">
                স্বয়ংক্রিয় হিসাব
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* 1. Active member count */}
              <div className="rounded-xl p-4 sm:p-5 border border-stone-200/80 shadow-xs bg-white border-l-4 border-l-teal-600">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-medium text-stone-600">
                    সক্রিয় সদস্য সংখ্যা
                  </span>
                  <Users className="w-4 h-4 text-teal-600 shrink-0" />
                </div>
                <div className="mt-2.5 flex items-baseline">
                  <span className="text-xl sm:text-2xl font-bold tracking-tight text-teal-800">
                    {toBengaliNumber(data.member_count)} <span className="text-xs font-normal text-stone-500">জন</span>
                  </span>
                </div>
                <div className="mt-1 text-xs text-stone-500">
                  সংগঠনের নিবন্ধিত সদস্য
                </div>
              </div>

              {/* 2. Current month total income */}
              <StatCard
                label="চলতি মাসের মোট আয়"
                amount={data.current_month?.income ?? 0}
                variant="emerald"
                subtitle="চলতি মাসে সংগৃহীত দান"
                icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
              />

              {/* 3. Current month total expense */}
              <StatCard
                label="চলতি মাসের মোট খরচ"
                amount={data.current_month?.expense ?? 0}
                variant="rose"
                subtitle="চলতি মাসের সমুদয় ব্যয়"
                icon={<TrendingDown className="w-4 h-4 text-rose-600" />}
              />

              {/* 4. Current month balance */}
              <StatCard
                label="চলতি মাসের উদ্বৃত্ত / ব্যালেন্স"
                amount={data.current_month?.balance ?? 0}
                variant="teal"
                subtitle="মাসের নীট অবশিষ্ট তহবিল"
                icon={<Wallet className="w-4 h-4 text-teal-700" />}
              />
            </div>
          </div>

          {/* Section 2: Current Year Financial Summary */}
          <div className="space-y-3">
            <h3 className="text-sm sm:text-base font-bold text-stone-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>চলতি বছরের সামগ্রিক আয়-ব্যয়</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* 5. Current year total income */}
              <StatCard
                label="চলতি বছরের মোট আয়"
                amount={data.current_year?.income ?? 0}
                variant="emerald"
                subtitle="পঞ্জিকাবর্ষে সর্বমোট প্রাপ্তি"
              />

              {/* 6. Current year total expense */}
              <StatCard
                label="চলতি বছরের মোট খরচ"
                amount={data.current_year?.expense ?? 0}
                variant="rose"
                subtitle="পঞ্জিকাবর্ষে সর্বমোট ব্যয়"
              />

              {/* 7. Current year balance */}
              <StatCard
                label="চলতি বছরের মোট ব্যালেন্স"
                amount={data.current_year?.balance ?? 0}
                variant="stone"
                subtitle="বাৎসরিক নীট উদ্বৃত্ত তহবিল"
              />
            </div>
          </div>

          {/* Section 3: Upcoming Mahfil Information */}
          <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-5 space-y-4">
            <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-700" />
                <span>আসন্ন মাহফিল সমুহ</span>
              </h3>
              <span className="text-xs text-stone-500 font-medium">
                সর্বশেষ নির্ধারিত সূচি
              </span>
            </div>

            {(!data.upcoming_mahfils || data.upcoming_mahfils.length === 0) ? (
              <div className="p-6 text-center text-xs text-stone-500 bg-stone-50 rounded-xl">
                বর্তমানে কোনো আসন্ন মাহফিলের তারিখ নির্ধারিত নেই।
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.upcoming_mahfils.map((mahfil) => (
                  <div
                    key={String(mahfil.id)}
                    className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-stone-900">
                        {mahfil.name}
                      </h4>
                      <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200">
                        আসন্ন
                      </span>
                    </div>

                    <div className="text-xs text-stone-600 space-y-1">
                      <div className="flex items-center gap-1.5 text-stone-700">
                        <CalendarDays className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>তারিখ: <strong>{formatBengaliDate(mahfil.event_date) || mahfil.event_date}</strong></span>
                      </div>

                      {mahfil.location && (
                        <div className="flex items-start gap-1.5 text-stone-600">
                          <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                          <span>স্থান: {mahfil.location}</span>
                        </div>
                      )}

                      {mahfil.description && (
                        <div className="flex items-start gap-1.5 text-stone-600 pt-1">
                          <FileText className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                          <p className="line-clamp-2">{mahfil.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Mahfil-wise Financial Summary */}
          <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-5 space-y-4">
            <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-700" />
                <span>মাহফিলভিত্তিক আয়, ব্যয় ও ব্যালেন্স খতিয়ান</span>
              </h3>
              <span className="text-xs text-stone-500">
                মাহফিল ওয়ারি হিসাব
              </span>
            </div>

            {(!data.mahfil_summary || data.mahfil_summary.length === 0) ? (
              <div className="p-6 text-center text-xs text-stone-500 bg-stone-50 rounded-xl">
                কোনো মাহফিলের আর্থিক তথ্য পাওয়া যায়নি।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50/80 text-stone-700">
                      <th className="py-2.5 px-3 font-semibold">মাহফিলের নাম</th>
                      <th className="py-2.5 px-3 font-semibold">তারিখ ও স্থান</th>
                      <th className="py-2.5 px-3 font-semibold text-right text-emerald-800">মোট আয়</th>
                      <th className="py-2.5 px-3 font-semibold text-right text-rose-800">মোট ব্যয়</th>
                      <th className="py-2.5 px-3 font-semibold text-right text-stone-900">ব্যালেন্স / উদ্বৃত্ত</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {data.mahfil_summary.map((item) => (
                      <tr key={String(item.id)} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3 px-3 font-medium text-stone-900">
                          {item.name}
                        </td>
                        <td className="py-3 px-3 text-stone-600 text-xs">
                          <div>{formatBengaliDate(item.event_date) || item.event_date}</div>
                          {item.location && <div className="text-stone-400">{item.location}</div>}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-emerald-700 whitespace-nowrap">
                          {formatCurrency(item.income)}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-rose-700 whitespace-nowrap">
                          {formatCurrency(item.expense)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold whitespace-nowrap">
                          <span className={item.balance < 0 ? 'text-rose-600' : 'text-stone-900'}>
                            {formatCurrency(item.balance)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 5: Current Year's Month-by-Month Summary */}
          <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-5 space-y-4">
            <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-emerald-700" />
                <span>চলতি বছরের মাসভিত্তিক আয়-ব্যয়ের বিবরণী</span>
              </h3>
              <span className="text-xs text-stone-500">
                ১২ মাসের পূর্ণ খতিয়ান
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/80 text-stone-700">
                    <th className="py-2.5 px-3 font-semibold">মাস</th>
                    <th className="py-2.5 px-3 font-semibold text-right text-emerald-800">মোট আয় (হাদিয়া)</th>
                    <th className="py-2.5 px-3 font-semibold text-right text-rose-800">মোট ব্যয়</th>
                    <th className="py-2.5 px-3 font-semibold text-right text-stone-900">নীট ব্যালেন্স / উদ্বৃত্ত</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((monthNum) => {
                    const row = data.yearly_monthly_summary?.find((m) => Number(m.month) === monthNum) || {
                      month: monthNum,
                      income: 0,
                      expense: 0,
                      balance: 0,
                    };
                    const isNonZero = (row.income > 0 || row.expense > 0);

                    return (
                      <tr
                        key={monthNum}
                        className={`transition-colors ${isNonZero ? 'bg-emerald-50/20 font-medium' : 'hover:bg-stone-50/60'}`}
                      >
                        <td className="py-2.5 px-3 text-stone-800">
                          {BENGALI_MONTH_LABELS[monthNum] || `মাস ${toBengaliNumber(monthNum)}`}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-emerald-700 whitespace-nowrap">
                          {formatCurrency(row.income)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-rose-700 whitespace-nowrap">
                          {formatCurrency(row.expense)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold whitespace-nowrap">
                          <span className={row.balance < 0 ? 'text-rose-600' : row.balance > 0 ? 'text-emerald-800' : 'text-stone-500'}>
                            {formatCurrency(row.balance)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-stone-300 bg-stone-100 font-bold text-stone-900 text-xs sm:text-sm">
                    <td className="py-3 px-3">বাৎসরিক সর্বমোট</td>
                    <td className="py-3 px-3 text-right text-emerald-800 whitespace-nowrap">
                      {formatCurrency(data.current_year?.income ?? 0)}
                    </td>
                    <td className="py-3 px-3 text-right text-rose-800 whitespace-nowrap">
                      {formatCurrency(data.current_year?.expense ?? 0)}
                    </td>
                    <td className="py-3 px-3 text-right text-stone-900 whitespace-nowrap">
                      {formatCurrency(data.current_year?.balance ?? 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {/* Public Footer */}
      <div className="pt-6 pb-2 text-center text-xs text-stone-500 border-t border-stone-200">
        <p>{currentSettings.footerText || `© ${new Date().getFullYear()} ${currentSettings.orgName}। সর্বস্বত্ব সংরক্ষিত।`}</p>
        <p className="text-[11px] text-stone-400 mt-1">পাবলিক ভিউ • আর্থিক স্বচ্ছতা ও জবাবদিহিতা</p>
      </div>
    </div>
  );
};

import React from 'react';
import { StatCard } from '../components/common/StatCard';
import { EmptyState } from '../components/common/EmptyState';
import { Donation, Expense, Mahfil, DashboardStats } from '../types/database.types';
import { formatCurrency, formatBengaliDate, getPaymentMethodLabel } from '../utils/formatters';
import {
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  MapPin,
  ArrowRight,
  HeartHandshake,
  Receipt,
  PlusCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { NavItemKey } from '../components/navigation/Sidebar';
import { QuickEntrySection } from '../components/quickEntry/QuickEntrySection';

interface DashboardPageProps {
  stats: DashboardStats | null;
  donations: Donation[];
  expenses: Expense[];
  mahfils: Mahfil[];
  onNavigate: (tab: NavItemKey) => void;
  onAddDonation: () => void;
  onAddExpense: () => void;
  onAddMahfil: () => void;
  onSelectMahfil: (mahfil: Mahfil) => void;
  onQuickEntry?: (type: 'donation' | 'expense' | 'mahfil') => void;
  canEdit: boolean;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  donations,
  expenses,
  mahfils,
  onNavigate,
  onAddDonation,
  onAddExpense,
  onAddMahfil,
  onSelectMahfil,
  onQuickEntry,
  canEdit,
  isLoading = false,
  error = null,
  onRetry,
}) => {
  const hasRecords = donations.length > 0 || expenses.length > 0 || mahfils.length > 0;

  // Relevant upcoming/recent Mahfils needed by the current Dashboard
  const relevantMahfils = React.useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return [...mahfils]
      .sort((a, b) => {
        const aUpcoming = (a.date || '') >= todayStr;
        const bUpcoming = (b.date || '') >= todayStr;
        if (aUpcoming && !bUpcoming) return -1;
        if (!aUpcoming && bUpcoming) return 1;
        return (b.date || '').localeCompare(a.date || '');
      })
      .slice(0, 4);
  }, [mahfils]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome with Quick Actions */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl p-5 sm:p-6 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-emerald-300 text-xs font-semibold tracking-wider uppercase">
              আর্থিক ড্যাশবোর্ড
            </span>
            <h2 className="text-xl sm:text-2xl font-bold mt-1">
              হাদিয়া ও খরচ ব্যবস্থাপনা
            </h2>
            <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              সংগঠনের সকল দান, মাহফিল ফান্ড এবং ব্যয়ের স্বচ্ছ ও নির্ভুল হিসাবরক্ষণ।
            </p>
          </div>

          {canEdit && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onAddDonation}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <HeartHandshake className="w-4 h-4" />
                হাদিয়া গ্রহণ
              </button>
              <button
                type="button"
                onClick={onAddExpense}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-600/90 hover:bg-rose-500 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                খরচ লিপিবদ্ধ
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Entry Section for Admin and Cashier (3 large touch-friendly actions on mobile/desktop) */}
      {canEdit && onQuickEntry && (
        <QuickEntrySection
          onQuickDonation={() => onQuickEntry('donation')}
          onQuickExpense={() => onQuickEntry('expense')}
          onQuickMahfil={() => onQuickEntry('mahfil')}
          canEdit={canEdit}
        />
      )}

      {/* Loading State as required by prompt */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-stone-200/90 p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-3 min-h-[320px]">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <h3 className="text-base font-bold text-stone-800">
            হিসাব লোড হচ্ছে...
          </h3>
          <p className="text-xs text-stone-500 max-w-md">
            সুপাবেস ডাটাবেস থেকে সর্বশেষ আর্থিক রেকর্ড ও খতিয়ান সংগ্রহ করা হচ্ছে
          </p>
        </div>
      ) : error ? (
        /* Error State as required by prompt */
        <div className="bg-rose-50/90 rounded-2xl border border-rose-200 p-8 text-center shadow-xs flex flex-col items-center justify-center space-y-3 min-h-[260px]">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xl">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="text-base font-bold text-rose-900">
            হিসাব লোড করা যাচ্ছে না। আবার চেষ্টা করুন।
          </h3>
          <p className="text-xs text-rose-700 max-w-md leading-relaxed">
            {error}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>আবার চেষ্টা করুন</span>
            </button>
          )}
        </div>
      ) : (
        /* Loaded Content: Main 7 Financial Cards */
        <>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-stone-800">
                সামগ্রিক আর্থিক পরিসংখ্যান
              </h3>
              <span className="text-xs text-stone-500">
                স্বয়ংক্রিয়ভাবে হিসাবকৃত
              </span>
            </div>

            {/* Today & This Month grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                label="আজকের মোট হাদিয়া"
                amount={stats?.todayDonations || 0}
                variant="emerald"
                subtitle="আজকের সংগৃহীত হাদিয়া"
                icon={<Clock className="w-4 h-4" />}
              />

              <StatCard
                label="এই মাসের মোট হাদিয়া"
                amount={stats?.thisMonthDonations || 0}
                variant="emerald"
                subtitle="চলতি মাসের সকল দান"
                icon={<TrendingUp className="w-4 h-4" />}
              />

              <StatCard
                label="এই মাসের মোট খরচ"
                amount={stats?.thisMonthExpenses || 0}
                variant="rose"
                subtitle="চলতি মাসের মোট ব্যয়"
                icon={<TrendingDown className="w-4 h-4" />}
              />

              <StatCard
                label="এই মাসের বর্তমান ব্যালেন্স"
                amount={stats?.thisMonthBalance || 0}
                variant="teal"
                subtitle="মাসের অবশিষ্ট তহবিল"
                icon={<Wallet className="w-4 h-4" />}
              />
            </div>

            {/* This Year grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <StatCard
                label="এই বছরের মোট হাদিয়া"
                amount={stats?.thisYearDonations || 0}
                variant="emerald"
                subtitle="চলতি পঞ্জিকাবর্ষের আয়"
              />

              <StatCard
                label="এই বছরের মোট খরচ"
                amount={stats?.thisYearExpenses || 0}
                variant="rose"
                subtitle="চলতি পঞ্জিকাবর্ষের ব্যয়"
              />

              <StatCard
                label="এই বছরের মোট ব্যালেন্স"
                amount={stats?.thisYearBalance || 0}
                variant="stone"
                subtitle="বাৎসরিক নীট উদ্বৃত্ত"
              />
            </div>
          </div>

          {/* When no data exists, show realistic empty state with 0 records */}
          {!hasRecords && (
            <div className="pt-4">
              <EmptyState
                title="এখনো কোনো হিসাব যোগ করা হয়নি"
                description="সংগঠনের কোনো হাদিয়া বা খরচের হিসাব এখনো ডাটাবেসে যোগ করা হয়নি। শুরু করতে প্রথম হাদিয়া বা খরচ এন্ট্রি দিন।"
                actionText={canEdit ? "+ প্রথম হাদিয়া যোগ করুন" : undefined}
                onAction={onAddDonation}
              />
            </div>
          )}

          {/* Two Column Layout: Recent Transactions & Upcoming/Recent Mahfils */}
          {hasRecords && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Recent Donations & Expenses */}
              <div className="lg:col-span-7 space-y-6">
                {/* Recent Donations List */}
                <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                      <HeartHandshake className="w-4 h-4 text-emerald-700" />
                      সাম্প্রতিক হাদিয়া সমুহ
                    </h4>
                    <button
                      type="button"
                      onClick={() => onNavigate('donations')}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>সকল দেখুন</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {donations.length === 0 ? (
                    <p className="text-xs text-stone-500 py-4 text-center">
                      কোনো হাদিয়ার রেকর্ড পাওয়া যায়নি
                    </p>
                  ) : (
                    <div className="divide-y divide-stone-100">
                      {donations.slice(0, 10).map((d) => (
                        <div
                          key={d.id}
                          className="py-3 flex items-center justify-between text-xs sm:text-sm hover:bg-stone-50/60 rounded-lg px-2 transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-stone-900">
                              {d.donorName}
                            </div>
                            <div className="text-stone-500 text-xs mt-0.5">
                              {formatBengaliDate(d.date)} · {d.purpose || d.category} · {getPaymentMethodLabel(d.paymentMethod)}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-800">
                              +{formatCurrency(d.amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Expenses List */}
                <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-rose-700" />
                      সাম্প্রতিক ব্যয়ের খতিয়ান
                    </h4>
                    <button
                      type="button"
                      onClick={() => onNavigate('expenses')}
                      className="text-xs font-semibold text-rose-700 hover:text-rose-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>সকল দেখুন</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {expenses.length === 0 ? (
                    <p className="text-xs text-stone-500 py-4 text-center">
                      কোনো ব্যয়ের রেকর্ড পাওয়া যায়নি
                    </p>
                  ) : (
                    <div className="divide-y divide-stone-100">
                      {expenses.slice(0, 10).map((e) => (
                        <div
                          key={e.id}
                          className="py-3 flex items-center justify-between text-xs sm:text-sm hover:bg-stone-50/60 rounded-lg px-2 transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-stone-900">
                              {e.title}
                            </div>
                            <div className="text-stone-500 text-xs mt-0.5">
                              {formatBengaliDate(e.date)} · {e.category} · {e.paidTo || e.recipient}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-rose-700">
                              -{formatCurrency(e.amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Mahfils Spotlight */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-emerald-700" />
                      সংগঠনের মাহফিল সমুহ
                    </h4>
                    <button
                      type="button"
                      onClick={() => onNavigate('mahfil')}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>সকল দেখুন</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {mahfils.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-xs text-stone-500">
                        এখনো কোনো মাহফিল রেকর্ড তৈরি করা হয়নি
                      </p>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={onAddMahfil}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold rounded-lg transition cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>মাহফিল যোগ করুন</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {relevantMahfils.map((m) => {
                        const mDonations = donations
                          .filter((d) => d.mahfilId === m.id)
                          .reduce((sum, d) => sum + d.amount, 0);
                        const mExpenses = expenses
                          .filter((e) => e.mahfilId === m.id)
                          .reduce((sum, e) => sum + e.amount, 0);
                        const mBalance = mDonations - mExpenses;

                        return (
                          <div
                            key={m.id}
                            onClick={() => onSelectMahfil(m)}
                            className="p-3.5 bg-stone-50/80 hover:bg-emerald-50/50 border border-stone-200/70 hover:border-emerald-300 rounded-xl transition-all cursor-pointer space-y-2 group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-bold text-sm text-stone-900 group-hover:text-emerald-900 transition-colors">
                                {m.name}
                              </h5>
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                                {formatBengaliDate(m.date)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-stone-500">
                              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span className="truncate">{m.location}</span>
                            </div>

                            <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs">
                              <div>
                                <span className="text-stone-500">আয়: </span>
                                <span className="font-semibold text-emerald-800">
                                  {formatCurrency(mDonations)}
                                </span>
                              </div>
                              <div>
                                <span className="text-stone-500">ব্যয়: </span>
                                <span className="font-semibold text-rose-700">
                                  {formatCurrency(mExpenses)}
                                </span>
                              </div>
                              <div>
                                <span className="text-stone-500">উদ্বৃত্ত: </span>
                                <span
                                  className={`font-bold ${
                                    mBalance >= 0 ? 'text-teal-700' : 'text-rose-600'
                                  }`}
                                >
                                  {formatCurrency(mBalance)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

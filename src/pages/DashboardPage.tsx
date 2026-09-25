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
} from 'lucide-react';
import { NavItemKey } from '../components/navigation/Sidebar';

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
  canEdit: boolean;
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
  canEdit,
}) => {
  const hasRecords = donations.length > 0 || expenses.length > 0 || mahfils.length > 0;

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

      {/* Main 7 Financial Cards required by prompt:
          - আজকের মোট হাদিয়া
          - এই মাসের মোট হাদিয়া
          - এই মাসের মোট খরচ
          - এই মাসের বর্তমান ব্যালেন্স
          - এই বছরের মোট হাদিয়া
          - এই বছরের মোট খরচ
          - এই বছরের মোট ব্যালেন্স
      */}
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

      {/* When no data exists, show realistic empty state */}
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
          {/* Recent Transactions (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-stone-200/90 shadow-xs p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100">
              <h4 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                সাম্প্রতিক লেনদেন
              </h4>
              <button
                type="button"
                onClick={() => onNavigate('donations')}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 inline-flex items-center gap-1 cursor-pointer"
              >
                সকল হাদিয়া <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-stone-100">
              {donations.slice(0, 4).map((d) => (
                <div key={d.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-stone-900 line-clamp-1">
                        {d.donorName}
                      </div>
                      <div className="text-xs text-stone-500">
                        {formatBengaliDate(d.date)} · {d.category}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-800">
                      +{formatCurrency(d.amount)}
                    </div>
                    <div className="text-[11px] text-stone-400">
                      {getPaymentMethodLabel(d.paymentMethod)}
                    </div>
                  </div>
                </div>
              ))}

              {expenses.slice(0, 3).map((e) => (
                <div key={e.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                      <TrendingDown className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-stone-900 line-clamp-1">
                        {e.title}
                      </div>
                      <div className="text-xs text-stone-500">
                        {formatBengaliDate(e.date)} · {e.recipient}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-rose-700">
                      -{formatCurrency(e.amount)}
                    </div>
                    <div className="text-[11px] text-stone-400">
                      {e.category}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming / Recent Mahfils (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-stone-200/90 shadow-xs p-4 sm:p-5 flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100">
              <h4 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-700" />
                আসন্ন / সাম্প্রতিক মাহফিল
              </h4>
              <button
                type="button"
                onClick={() => onNavigate('mahfil')}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 inline-flex items-center gap-1 cursor-pointer"
              >
                সকল মাহফিল <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {mahfils.length === 0 ? (
              <div className="my-auto text-center py-6 text-stone-400 text-xs">
                কোনো মাহফিল তালিকাভুক্ত নেই।
                {canEdit && (
                  <button
                    type="button"
                    onClick={onAddMahfil}
                    className="block mx-auto mt-2 text-xs font-semibold text-emerald-800 hover:underline"
                  >
                    + নতুন মাহফিল যোগ করুন
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                {mahfils.slice(0, 3).map((m) => {
                  const mDonations = donations.filter((d) => d.mahfilId === m.id);
                  const mExpenses = expenses.filter((e) => e.mahfilId === m.id);
                  const income = mDonations.reduce((sum, d) => sum + d.amount, 0);
                  const expense = mExpenses.reduce((sum, e) => sum + e.amount, 0);
                  const net = income - expense;

                  return (
                    <div
                      key={m.id}
                      onClick={() => onSelectMahfil(m)}
                      className="p-3 rounded-lg border border-stone-100 hover:border-emerald-200 bg-stone-50/50 hover:bg-emerald-50/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-sm text-stone-900 line-clamp-1">
                          {m.name}
                        </span>
                        <span className="text-[11px] text-stone-500 shrink-0">
                          {formatBengaliDate(m.date)}
                        </span>
                      </div>
                      <div className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                        <span className="line-clamp-1">{m.location}</span>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs">
                        <span className="text-stone-600">
                          হাদিয়া: <strong className="text-emerald-800">{formatCurrency(income)}</strong>
                        </span>
                        <span className="text-stone-600">
                          ব্যয়: <strong className="text-rose-700">{formatCurrency(expense)}</strong>
                        </span>
                        <span className="font-bold text-stone-800">
                          উদ্বৃত্ত: {formatCurrency(net)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

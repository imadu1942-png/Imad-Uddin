import React, { useState, useMemo } from 'react';
import { Donation, Expense, Mahfil } from '../types/database.types';
import {
  formatCurrency,
  toBengaliNumber,
  BENGALI_MONTHS,
} from '../utils/formatters';
import { StatCard } from '../components/common/StatCard';
import { EmptyState } from '../components/common/EmptyState';
import { BarChart3, TrendingUp, TrendingDown, Wallet, CalendarDays, Receipt } from 'lucide-react';

interface YearlyAccountsPageProps {
  donations: Donation[];
  expenses: Expense[];
  mahfils: Mahfil[];
}

export const YearlyAccountsPage: React.FC<YearlyAccountsPageProps> = ({
  donations,
  expenses,
  mahfils,
}) => {
  const currentYearStr = String(new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);

  const availableYears = useMemo(() => {
    const current = new Date().getFullYear();
    const set = new Set<string>([String(current), String(current - 1), String(current + 1)]);
    donations.forEach((d) => set.add(d.date.split('-')[0]));
    expenses.forEach((e) => set.add(e.date.split('-')[0]));
    return Array.from(set).sort().reverse();
  }, [donations, expenses]);

  // Year filter
  const yearDonations = useMemo(() => {
    return donations.filter((d) => d.date.startsWith(`${selectedYear}-`));
  }, [donations, selectedYear]);

  const yearExpenses = useMemo(() => {
    return expenses.filter((e) => e.date.startsWith(`${selectedYear}-`));
  }, [expenses, selectedYear]);

  const totalYearlyHadiya = useMemo(() => {
    return yearDonations.reduce((sum, d) => sum + d.amount, 0);
  }, [yearDonations]);

  const totalYearlyExpense = useMemo(() => {
    return yearExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [yearExpenses]);

  const yearlyBalance = totalYearlyHadiya - totalYearlyExpense;

  // Month-by-month calculation (1 to 12)
  const monthlyBreakdown = useMemo(() => {
    return BENGALI_MONTHS.map((monthName, idx) => {
      const monthNum = String(idx + 1).padStart(2, '0');
      const prefix = `${selectedYear}-${monthNum}`;

      const mDonations = yearDonations.filter((d) => d.date.startsWith(prefix));
      const mExpenses = yearExpenses.filter((e) => e.date.startsWith(prefix));

      const income = mDonations.reduce((s, d) => s + d.amount, 0);
      const expense = mExpenses.reduce((s, e) => s + e.amount, 0);

      return {
        monthNumber: monthNum,
        monthName,
        income,
        expense,
        balance: income - expense,
        donationsCount: mDonations.length,
        expensesCount: mExpenses.length,
      };
    });
  }, [yearDonations, yearExpenses, selectedYear]);

  // Mahfil-wise summary for the year
  const mahfilYearlySummary = useMemo(() => {
    return mahfils
      .filter((m) => m.date.startsWith(`${selectedYear}-`))
      .map((m) => {
        const mDonations = donations.filter((d) => d.mahfilId === m.id);
        const mExpenses = expenses.filter((e) => e.mahfilId === m.id);
        const income = mDonations.reduce((s, d) => s + d.amount, 0);
        const expense = mExpenses.reduce((s, e) => s + e.amount, 0);
        return {
          mahfil: m,
          income,
          expense,
          balance: income - expense,
        };
      });
  }, [mahfils, donations, expenses, selectedYear]);

  // Expense category summary for the year
  const categoryYearlySummary = useMemo(() => {
    const map = new Map<string, number>();
    yearExpenses.forEach((e) => {
      const current = map.get(e.category) || 0;
      map.set(e.category, current + e.amount);
    });
    return Array.from(map.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalYearlyExpense > 0 ? (amount / totalYearlyExpense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [yearExpenses, totalYearlyExpense]);

  const hasData = yearDonations.length > 0 || yearExpenses.length > 0;

  return (
    <div className="space-y-6">
      {/* Header and Year Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            বাৎসরিক হিসাব বিবরণী
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            পঞ্জিকাবর্ষ অনুযায়ী বার্ষিক আয়, ব্যয়, মাসওয়ারি তুলনামূলক হিসাব
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-stone-200/90 shadow-xs">
          <label className="text-xs font-semibold text-stone-600 pl-2">
            বছর নির্বাচন:
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="h-10 px-3 text-xs sm:text-sm bg-stone-50 font-bold text-stone-900 border-none rounded-lg cursor-pointer focus:ring-2 focus:ring-emerald-600"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {toBengaliNumber(yr)} সাল
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3 Main Yearly Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label={`${toBengaliNumber(selectedYear)} সালের মোট হাদিয়া`}
          amount={totalYearlyHadiya}
          variant="emerald"
          subtitle={`${toBengaliNumber(yearDonations.length)} টি দান লিপিবদ্ধ`}
          icon={<TrendingUp className="w-5 h-5" />}
        />

        <StatCard
          label={`${toBengaliNumber(selectedYear)} সালের মোট খরচ`}
          amount={totalYearlyExpense}
          variant="rose"
          subtitle={`${toBengaliNumber(yearExpenses.length)} টি ভাউচার লিপিবদ্ধ`}
          icon={<TrendingDown className="w-5 h-5" />}
        />

        <StatCard
          label={`${toBengaliNumber(selectedYear)} সালের বাৎসরিক ব্যালেন্স`}
          amount={yearlyBalance}
          variant="teal"
          subtitle={yearlyBalance >= 0 ? 'বার্ষিক নীট উদ্বৃত্ত' : 'বার্ষিক নীট ঘাটতি'}
          icon={<Wallet className="w-5 h-5" />}
        />
      </div>

      {!hasData ? (
        <EmptyState
          title={`${toBengaliNumber(selectedYear)} সালে কোনো আর্থিক হিসাব নেই`}
          description="এই বছরের জন্য কোনো হাদিয়া বা খরচের হিসাব এখনো ডাটাবেসে নথিভুক্ত হয়নি।"
        />
      ) : (
        <div className="space-y-6">
          {/* Month-by-month Income and Expense Table */}
          <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-700" />
                  মাসভিত্তিক আয় ও ব্যয়ের তুলনামূলক বিবরণী
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  ১২ মাসের প্রতিটি মাসের হাদিয়া, ব্যয় ও মাসান্তিক ব্যালেন্স
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-700">
                  <tr>
                    <th className="py-3 px-4">মাস</th>
                    <th className="py-3 px-4 text-right">হাদিয়া / আয় (৳)</th>
                    <th className="py-3 px-4 text-right">ব্যয় / খরচ (৳)</th>
                    <th className="py-3 px-4 text-right">ব্যালেন্স (৳)</th>
                    <th className="py-3 px-4 text-center">তুলনামূলক অবস্থা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {monthlyBreakdown.map((row) => (
                    <tr key={row.monthNumber} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-stone-900">
                        {row.monthName}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-800">
                        {formatCurrency(row.income)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-rose-700">
                        {formatCurrency(row.expense)}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${row.balance >= 0 ? 'text-teal-800' : 'text-rose-700'}`}>
                        {formatCurrency(row.balance)}
                      </td>
                      <td className="py-3 px-4 text-center text-xs">
                        {row.income === 0 && row.expense === 0 ? (
                          <span className="text-stone-400">লেনদেন নেই</span>
                        ) : row.balance >= 0 ? (
                          <span className="text-emerald-700 font-medium">উদ্বৃত্ত</span>
                        ) : (
                          <span className="text-rose-700 font-medium">ঘাটতি</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-stone-100/90 font-bold border-t-2 border-stone-300">
                  <tr>
                    <td className="py-3.5 px-4 text-stone-900">সর্বমোট (১২ মাস)</td>
                    <td className="py-3.5 px-4 text-right text-emerald-800">
                      {formatCurrency(totalYearlyHadiya)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-rose-700">
                      {formatCurrency(totalYearlyExpense)}
                    </td>
                    <td className={`py-3.5 px-4 text-right ${yearlyBalance >= 0 ? 'text-teal-900' : 'text-rose-800'}`}>
                      {formatCurrency(yearlyBalance)}
                    </td>
                    <td className="py-3.5 px-4 text-center text-stone-700">
                      {yearlyBalance >= 0 ? 'বার্ষিক নীট উদ্বৃত্ত' : 'বার্ষিক নীট ঘাটতি'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Mahfil-wise summary & Expense Category Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mahfil-wise annual summary */}
            <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-4 sm:p-5">
              <h3 className="font-bold text-base text-stone-900 flex items-center gap-2 mb-3 pb-3 border-b border-stone-100">
                <CalendarDays className="w-4 h-4 text-emerald-700" />
                বার্ষিক মাহফিল সমূহের সারসংক্ষেপ
              </h3>

              {mahfilYearlySummary.length === 0 ? (
                <div className="py-8 text-center text-stone-400 text-xs">
                  {toBengaliNumber(selectedYear)} সালে কোনো মাহফিল অনুষ্ঠিত হয়নি।
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {mahfilYearlySummary.map(({ mahfil, income, expense, balance }) => (
                    <div key={mahfil.id} className="py-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-stone-900">
                          {mahfil.name}
                        </span>
                        <span className="text-xs text-stone-500">
                          {mahfil.location}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs bg-stone-50 p-2 rounded-lg">
                        <span className="text-stone-600">
                          হাদিয়া: <strong className="text-emerald-800">{formatCurrency(income)}</strong>
                        </span>
                        <span className="text-stone-600">
                          ব্যয়: <strong className="text-rose-700">{formatCurrency(expense)}</strong>
                        </span>
                        <span className="text-stone-800 font-bold">
                          ব্যালেন্স: {formatCurrency(balance)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expense category summary */}
            <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-4 sm:p-5">
              <h3 className="font-bold text-base text-stone-900 flex items-center gap-2 mb-3 pb-3 border-b border-stone-100">
                <Receipt className="w-4 h-4 text-rose-700" />
                বার্ষিক খাতওয়ারি ব্যয়ের পর্যালোচনা
              </h3>

              {categoryYearlySummary.length === 0 ? (
                <div className="py-8 text-center text-stone-400 text-xs">
                  {toBengaliNumber(selectedYear)} সালে কোনো খরচ নথিভুক্ত হয়নি।
                </div>
              ) : (
                <div className="space-y-3">
                  {categoryYearlySummary.map((item) => (
                    <div key={item.category} className="space-y-1">
                      <div className="flex justify-between text-xs sm:text-sm font-medium">
                        <span className="text-stone-800">{item.category}</span>
                        <span className="text-rose-700 font-bold">
                          {formatCurrency(item.amount)}{' '}
                          <span className="text-[11px] text-stone-400 font-normal">
                            ({toBengaliNumber(item.percentage.toFixed(1))}%)
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

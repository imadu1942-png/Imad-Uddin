import React, { useState, useMemo } from 'react';
import { Donation, Expense, Mahfil } from '../types/database.types';
import {
  formatCurrency,
  formatBengaliDate,
  toBengaliNumber,
  BENGALI_MONTHS,
  getBengaliMonthName,
} from '../utils/formatters';
import { StatCard } from '../components/common/StatCard';
import { EmptyState } from '../components/common/EmptyState';
import { CalendarRange, TrendingUp, TrendingDown, Wallet, Users, Receipt, CalendarDays } from 'lucide-react';

interface MonthlyAccountsPageProps {
  donations: Donation[];
  expenses: Expense[];
  mahfils: Mahfil[];
}

export const MonthlyAccountsPage: React.FC<MonthlyAccountsPageProps> = ({
  donations,
  expenses,
  mahfils,
}) => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<string>(String(currentDate.getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState<string>(
    String(currentDate.getMonth() + 1).padStart(2, '0')
  );

  // Available years
  const availableYears = useMemo(() => {
    const current = new Date().getFullYear();
    const set = new Set<string>([String(current), String(current - 1), String(current + 1)]);
    donations.forEach((d) => set.add(d.date.split('-')[0]));
    expenses.forEach((e) => set.add(e.date.split('-')[0]));
    return Array.from(set).sort().reverse();
  }, [donations, expenses]);

  // Prefix: YYYY-MM
  const monthPrefix = `${selectedYear}-${selectedMonth}`;

  // Filtered records for this month
  const monthDonations = useMemo(() => {
    return donations.filter((d) => d.date.startsWith(monthPrefix));
  }, [donations, monthPrefix]);

  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => e.date.startsWith(monthPrefix));
  }, [expenses, monthPrefix]);

  // Totals
  const totalHadiya = useMemo(() => {
    return monthDonations.reduce((sum, d) => sum + d.amount, 0);
  }, [monthDonations]);

  const totalExpense = useMemo(() => {
    return monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [monthExpenses]);

  const netBalance = totalHadiya - totalExpense;

  // List of people who donated and amount donated by each person (aggregated by donor name)
  const donorAggregates = useMemo(() => {
    const map = new Map<string, { donorName: string; mobileNumber?: string; totalAmount: number; count: number }>();
    monthDonations.forEach((d) => {
      const key = d.donorName.trim();
      const existing = map.get(key);
      if (existing) {
        existing.totalAmount += d.amount;
        existing.count += 1;
        if (!existing.mobileNumber && d.mobileNumber) existing.mobileNumber = d.mobileNumber;
      } else {
        map.set(key, {
          donorName: d.donorName,
          mobileNumber: d.mobileNumber,
          totalAmount: d.amount,
          count: 1,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [monthDonations]);

  // Monthly expense breakdown by category
  const expenseCategoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    monthExpenses.forEach((e) => {
      const current = map.get(e.category) || 0;
      map.set(e.category, current + e.amount);
    });
    return Array.from(map.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthExpenses, totalExpense]);

  // Mahfil-wise income and expense for this month
  const mahfilSummaries = useMemo(() => {
    return mahfils.map((m) => {
      const mDonations = monthDonations.filter((d) => d.mahfilId === m.id);
      const mExpenses = monthExpenses.filter((e) => e.mahfilId === m.id);
      const income = mDonations.reduce((s, d) => s + d.amount, 0);
      const expense = mExpenses.reduce((s, e) => s + e.amount, 0);
      return {
        mahfil: m,
        income,
        expense,
        balance: income - expense,
      };
    }).filter((item) => item.income > 0 || item.expense > 0 || item.mahfil.date.startsWith(monthPrefix));
  }, [mahfils, monthDonations, monthExpenses, monthPrefix]);

  const hasData = monthDonations.length > 0 || monthExpenses.length > 0;
  const monthName = getBengaliMonthName(parseInt(selectedMonth, 10));

  return (
    <div className="space-y-6">
      {/* Header and Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            মাসিক হিসাব বিবরণী
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            নির্দিষ্ট মাসের মোট আয়, ব্যয়, দাতা তালিকা ও মাহফিল সারসংক্ষেপ
          </p>
        </div>

        {/* Month and Year Selectors */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-stone-200/90 shadow-xs">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-10 px-3 text-xs sm:text-sm bg-stone-50 font-medium text-stone-900 border-none rounded-lg cursor-pointer focus:ring-2 focus:ring-emerald-600"
          >
            {BENGALI_MONTHS.map((m, idx) => {
              const val = String(idx + 1).padStart(2, '0');
              return (
                <option key={val} value={val}>
                  {m}
                </option>
              );
            })}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="h-10 px-3 text-xs sm:text-sm bg-stone-50 font-medium text-stone-900 border-none rounded-lg cursor-pointer focus:ring-2 focus:ring-emerald-600"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {toBengaliNumber(yr)} সাল
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label={`${monthName} মাসের মোট হাদিয়া`}
          amount={totalHadiya}
          variant="emerald"
          subtitle={`${toBengaliNumber(monthDonations.length)} টি দান এন্ট্রি`}
          icon={<TrendingUp className="w-5 h-5" />}
        />

        <StatCard
          label={`${monthName} মাসের মোট খরচ`}
          amount={totalExpense}
          variant="rose"
          subtitle={`${toBengaliNumber(monthExpenses.length)} টি খরচের ভাউচার`}
          icon={<TrendingDown className="w-5 h-5" />}
        />

        <StatCard
          label={`${monthName} মাসের বর্তমান ব্যালেন্স`}
          amount={netBalance}
          variant="teal"
          subtitle={netBalance >= 0 ? 'তহবিলে উদ্বৃত্ত' : 'তহবিলে ঘাটতি'}
          icon={<Wallet className="w-5 h-5" />}
        />
      </div>

      {!hasData ? (
        <EmptyState
          title={`${monthName} ${toBengaliNumber(selectedYear)}-এ কোনো হিসাব নেই`}
          description="এই নির্বাচিত মাসে এখনো কোনো হাদিয়া বা ব্যয়ের তথ্য যোগ করা হয়নি।"
        />
      ) : (
        <div className="space-y-6">
          {/* Donors List & Amount Donated by Each Person */}
          <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-700" />
                  হাদিয়াদাতাগণের তালিকা ও প্রত্যেকের মোট অনুদান
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  এই মাসে মোট {toBengaliNumber(donorAggregates.length)} জন ব্যক্তি হাদিয়া দিয়েছেন
                </p>
              </div>
            </div>

            {donorAggregates.length === 0 ? (
              <div className="p-6 text-center text-stone-400 text-sm">
                এই মাসে কোনো হাদিয়া নথিভুক্ত করা হয়নি।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-600">
                    <tr>
                      <th className="py-3 px-4">ক্রমিক</th>
                      <th className="py-3 px-4">দাতার নাম</th>
                      <th className="py-3 px-4">মোবাইল নম্বর</th>
                      <th className="py-3 px-4 text-center">দানের সংখ্যা</th>
                      <th className="py-3 px-4 text-right">মোট প্রদত্ত হাদিয়া</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {donorAggregates.map((donor, idx) => (
                      <tr key={donor.donorName} className="hover:bg-stone-50/60">
                        <td className="py-3 px-4 text-stone-500 text-xs">
                          {toBengaliNumber(idx + 1)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-stone-900">
                          {donor.donorName}
                        </td>
                        <td className="py-3 px-4 text-stone-500 text-xs font-mono">
                          {donor.mobileNumber || '-'}
                        </td>
                        <td className="py-3 px-4 text-center text-stone-600 text-xs">
                          {toBengaliNumber(donor.count)} বার
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-800">
                          {formatCurrency(donor.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Grid: Expense Breakdown & Mahfil Income/Expense */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Expense Breakdown */}
            <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-4 sm:p-5">
              <h3 className="font-bold text-base text-stone-900 flex items-center gap-2 mb-3 pb-3 border-b border-stone-100">
                <Receipt className="w-4 h-4 text-rose-700" />
                খাতওয়ারি খরচের বিভাজন
              </h3>

              {expenseCategoryBreakdown.length === 0 ? (
                <div className="py-8 text-center text-stone-400 text-xs">
                  এই মাসে কোনো খরচ রেকর্ড করা হয়নি।
                </div>
              ) : (
                <div className="space-y-3">
                  {expenseCategoryBreakdown.map((item) => (
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

            {/* Mahfil-wise Income and Expense */}
            <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-4 sm:p-5">
              <h3 className="font-bold text-base text-stone-900 flex items-center gap-2 mb-3 pb-3 border-b border-stone-100">
                <CalendarDays className="w-4 h-4 text-emerald-700" />
                মাহফিল অনুযায়ী আয় ও ব্যয়
              </h3>

              {mahfilSummaries.length === 0 ? (
                <div className="py-8 text-center text-stone-400 text-xs">
                  এই মাসে কোনো মাহফিলের আয়-ব্যয় লেনদেন নেই।
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {mahfilSummaries.map(({ mahfil, income, expense, balance }) => (
                    <div key={mahfil.id} className="py-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-stone-900">
                          {mahfil.name}
                        </span>
                        <span className="text-xs text-stone-500">
                          {formatBengaliDate(mahfil.date)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs bg-stone-50 p-2 rounded-lg">
                        <span className="text-stone-600">
                          হাদিয়া: <strong className="text-emerald-800">{formatCurrency(income)}</strong>
                        </span>
                        <span className="text-stone-600">
                          খরচ: <strong className="text-rose-700">{formatCurrency(expense)}</strong>
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
          </div>
        </div>
      )}
    </div>
  );
};

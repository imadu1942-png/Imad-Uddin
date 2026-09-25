import React, { useState, useMemo } from 'react';
import { Expense, Mahfil } from '../types/database.types';
import {
  formatCurrency,
  formatBengaliDate,
  getPaymentMethodLabel,
  EXPENSE_CATEGORIES,
  BENGALI_MONTHS,
  toBengaliNumber,
} from '../utils/formatters';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Download,
  Calendar,
  X,
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { exportToCSV } from '../utils/exportHelpers';

interface ExpensesPageProps {
  expenses: Expense[];
  mahfils: Mahfil[];
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string, title: string) => void;
  onViewExpense: (expense: Expense) => void;
  canEdit: boolean;
  canDelete: boolean;
  isPublicGuest?: boolean;
}

type DatePreset = 'all' | 'today' | 'this_month' | 'this_year' | 'custom';

export const ExpensesPage: React.FC<ExpensesPageProps> = ({
  expenses,
  mahfils,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onViewExpense,
  canEdit,
  canDelete,
  isPublicGuest = false,
}) => {
  const [search, setSearch] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMahfil, setSelectedMahfil] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [currentYearStr, currentMonthStr] = useMemo(() => todayStr.split('-'), [todayStr]);

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const set = new Set<string>([String(currentYear), String(currentYear - 1)]);
    expenses.forEach((e) => {
      const yr = e.date.split('-')[0];
      if (yr) set.add(yr);
    });
    return Array.from(set).sort().reverse();
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (search) {
        const q = search.toLowerCase().trim();
        const matchesTitle = (e.title || '').toLowerCase().includes(q);
        const matchesRecipient = (e.recipient || e.paidTo || '').toLowerCase().includes(q);
        const matchesNotes = (e.notes || '').toLowerCase().includes(q);
        const matchesDesc = (e.description || '').toLowerCase().includes(q);
        const matchesCategory = (e.category || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesRecipient && !matchesNotes && !matchesDesc && !matchesCategory) {
          return false;
        }
      }

      // Date Preset Filtering
      if (datePreset === 'today') {
        if (e.date !== todayStr) return false;
      } else if (datePreset === 'this_month') {
        if (!e.date.startsWith(`${currentYearStr}-${currentMonthStr}`)) return false;
      } else if (datePreset === 'this_year') {
        if (!e.date.startsWith(`${currentYearStr}-`)) return false;
      } else if (datePreset === 'custom') {
        if (startDate && e.date < startDate) return false;
        if (endDate && e.date > endDate) return false;
      }

      if (selectedYear) {
        const yr = e.date.split('-')[0];
        if (yr !== selectedYear) return false;
      }
      if (selectedMonth) {
        const mo = e.date.split('-')[1];
        if (mo !== selectedMonth) return false;
      }
      if (selectedCategory && e.category !== selectedCategory) return false;
      if (selectedMahfil && e.mahfilId !== selectedMahfil) return false;
      return true;
    });
  }, [
    expenses,
    search,
    datePreset,
    startDate,
    endDate,
    todayStr,
    currentYearStr,
    currentMonthStr,
    selectedYear,
    selectedMonth,
    selectedCategory,
    selectedMahfil,
  ]);

  const totalExpense = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const clearAllFilters = () => {
    setSearch('');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setSelectedCategory('');
    setSelectedMahfil('');
    setSelectedYear('');
    setSelectedMonth('');
  };

  const hasActiveFilters = Boolean(
    search ||
      datePreset !== 'all' ||
      startDate ||
      endDate ||
      selectedCategory ||
      selectedMahfil ||
      selectedYear ||
      selectedMonth
  );

  const handleExportCSV = () => {
    const exportRows = filteredExpenses.map((e) => {
      const mahfil = mahfils.find((m) => m.id === e.mahfilId);
      return {
        title: e.title,
        recipient: e.recipient || e.paidTo,
        amount: e.amount,
        date: e.date,
        category: e.category,
        mahfil: mahfil ? mahfil.name : 'সাধারণ',
        paymentMethod: getPaymentMethodLabel(e.paymentMethod),
        description: e.description || '-',
        notes: e.notes || '-',
        createdBy: e.createdBy || '-',
      };
    });

    exportToCSV('expenses_report', exportRows, [
      { key: 'title', label: 'খরচের বিষয়' },
      { key: 'recipient', label: 'প্রাপক / ভেন্ডর' },
      { key: 'amount', label: 'টাকার পরিমাণ (৳)' },
      { key: 'date', label: 'তারিখ' },
      { key: 'category', label: 'খাত' },
      { key: 'mahfil', label: 'মাহফিল' },
      { key: 'paymentMethod', label: 'পরিশোধ মাধ্যম' },
      { key: 'description', label: 'বিবরণ' },
      { key: 'notes', label: 'ভাউচার / মন্তব্য' },
      { key: 'createdBy', label: 'নথিভুক্তকারী' },
    ]);
  };

  return (
    <div className="space-y-5">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            খরচ ব্যবস্থাপনা
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            সংগঠন ও মাহফিলের যাবতীয় ব্যয়ের নির্ভুল হিসাবরক্ষণ
          </p>
        </div>

        <div className="flex items-center gap-2">
          {filteredExpenses.length > 0 && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-3 text-xs sm:text-sm font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg cursor-pointer transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-stone-500" />
              <span>CSV রপ্তানি</span>
            </button>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={onAddExpense}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-4 text-xs sm:text-sm font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>খরচ লিপিবদ্ধকরণ</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Banner for filtered total */}
      <div className="bg-rose-950 text-white rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs border border-rose-900">
        <div>
          <span className="text-xs text-rose-200 font-medium">
            বর্তমান ফিল্টারে মোট ব্যয়ের পরিমাণ
          </span>
          <div className="text-2xl sm:text-3xl font-bold mt-0.5 tracking-tight text-white">
            {formatCurrency(totalExpense)}
          </div>
        </div>
        <div className="text-xs sm:text-sm text-rose-200 bg-rose-900/80 px-3 py-1.5 rounded-lg border border-rose-800 self-start sm:self-auto">
          মোট খরচ রেকর্ড: <strong className="text-white">{toBengaliNumber(filteredExpenses.length)}</strong> টি
        </div>
      </div>

      {/* Date Filter Presets Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setDatePreset('all')}
          className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all shrink-0 ${
            datePreset === 'all'
              ? 'bg-rose-800 text-white shadow-xs'
              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          সকল সময়
        </button>
        <button
          type="button"
          onClick={() => setDatePreset('today')}
          className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all shrink-0 ${
            datePreset === 'today'
              ? 'bg-rose-800 text-white shadow-xs'
              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          আজকে
        </button>
        <button
          type="button"
          onClick={() => setDatePreset('this_month')}
          className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all shrink-0 ${
            datePreset === 'this_month'
              ? 'bg-rose-800 text-white shadow-xs'
              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          এই মাসে
        </button>
        <button
          type="button"
          onClick={() => setDatePreset('this_year')}
          className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all shrink-0 ${
            datePreset === 'this_year'
              ? 'bg-rose-800 text-white shadow-xs'
              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          এই বছরে
        </button>
        <button
          type="button"
          onClick={() => setDatePreset('custom')}
          className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all shrink-0 inline-flex items-center gap-1 ${
            datePreset === 'custom'
              ? 'bg-rose-800 text-white shadow-xs'
              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          কাস্টম রেঞ্জ
        </button>
      </div>

      {/* Custom Date Range Inputs if active */}
      {datePreset === 'custom' && (
        <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-rose-900">তারিখ রেঞ্জ:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500">হতে:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 px-2 bg-white border border-stone-300 rounded-md text-stone-800"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500">পর্যন্ত:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 px-2 bg-white border border-stone-300 rounded-md text-stone-800"
            />
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl border border-stone-200/90 p-3 sm:p-4 space-y-3 shadow-xs">
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="খরচের বিষয়, ভেন্ডর/প্রাপক বা ক্যাশমেমো দিয়ে খুঁজুন..."
              className="w-full h-11 pl-9 pr-3 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
          </div>

          {/* Toggle Filter Panel */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`h-11 px-3 sm:px-4 text-xs sm:text-sm font-medium rounded-lg border transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
              hasActiveFilters || showFilters
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">ফিল্টার</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-rose-600" />
            )}
          </button>
        </div>

        {/* Collapsible filter controls */}
        {showFilters && (
          <div className="pt-3 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Year */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                নির্দিষ্ট বছর
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full h-10 px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 cursor-pointer"
              >
                <option value="">সকল বছর</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {toBengaliNumber(yr)}
                  </option>
                ))}
              </select>
            </div>

            {/* Month */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                নির্দিষ্ট মাস
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full h-10 px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 cursor-pointer"
              >
                <option value="">সকল মাস</option>
                {BENGALI_MONTHS.map((m, idx) => {
                  const val = String(idx + 1).padStart(2, '0');
                  return (
                    <option key={val} value={val}>
                      {m}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                খরচের খাত
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-10 px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 cursor-pointer"
              >
                <option value="">সকল খাত</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Related Mahfil */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                মাহফিল
              </label>
              <select
                value={selectedMahfil}
                onChange={(e) => setSelectedMahfil(e.target.value)}
                className="w-full h-10 px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 cursor-pointer"
              >
                <option value="">সকল মাহফিল</option>
                {mahfils.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-stone-500">
              ফিল্টারিং সক্রিয় রয়েছে
            </span>
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> ফিল্টার মুছুন
            </button>
          </div>
        )}
      </div>

      {/* Main Expense List */}
      {filteredExpenses.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'কোনো খরচ পাওয়া যায়নি' : 'এখনো কোনো হিসাব যোগ করা হয়নি'}
          description={
            hasActiveFilters
              ? 'আপনার নির্বাচিত ফিল্টারের শর্তে কোনো ব্যয়ের রেকর্ড পাওয়া যায়নি।'
              : 'এখনো কোনো খরচের হিসাব সংরক্ষিত নেই। নতুন খরচ এন্ট্রি দিতে ওপরের বোতামে চাপুন।'
          }
          actionText={canEdit && !hasActiveFilters ? '+ খরচ লিপিবদ্ধ করুন' : undefined}
          onAction={onAddExpense}
        />
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block lg:hidden space-y-3">
            {filteredExpenses.map((e) => {
              const mahfil = mahfils.find((m) => m.id === e.mahfilId);
              return (
                <div
                  key={e.id}
                  className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-stone-900">
                        {e.title}
                      </h4>
                      <div className="text-xs text-stone-500 mt-0.5">
                        প্রাপক: <strong className="text-stone-700">{e.recipient || e.paidTo}</strong>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-rose-700">
                        {formatCurrency(e.amount)}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {getPaymentMethodLabel(e.paymentMethod)}
                      </div>
                    </div>
                  </div>

                  {/* Metadata info */}
                  <div className="text-xs text-stone-600 flex flex-wrap items-center gap-1.5 pt-1 border-t border-stone-100">
                    <span>{formatBengaliDate(e.date)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{e.category}</span>
                    {mahfil && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-800 font-medium">{mahfil.name}</span>
                      </>
                    )}
                  </div>

                  {e.description && (
                    <div className="text-xs text-stone-500 bg-stone-50 p-2 rounded">
                      {e.description}
                    </div>
                  )}

                  {/* Mobile Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => onViewExpense(e)}
                      className="min-h-[40px] px-3 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> বিবরণ
                    </button>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => onEditExpense(e)}
                        className="min-h-[40px] px-3 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> সম্পাদন
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => onDeleteExpense(e.id, e.title)}
                        className="min-h-[40px] px-3 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> মুছুন
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-xl border border-stone-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-100/75 border-b border-stone-200 text-xs font-semibold text-stone-700">
                  <tr>
                    <th className="py-3.5 px-4">খরচের বিষয় ও বিবরণ</th>
                    <th className="py-3.5 px-4">তারিখ</th>
                    <th className="py-3.5 px-4">খাত</th>
                    <th className="py-3.5 px-4">স্থান / প্রাপক / ভেন্ডর</th>
                    <th className="py-3.5 px-4">মাহফিল</th>
                    <th className="py-3.5 px-4 text-right">টাকার পরিমাণ (৳)</th>
                    <th className="py-3.5 px-4 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredExpenses.map((e) => {
                    const mahfil = mahfils.find((m) => m.id === e.mahfilId);
                    return (
                      <tr key={e.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-stone-900">{e.title}</div>
                          {e.description && (
                            <div className="text-xs text-stone-500 line-clamp-1">{e.description}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-stone-600">
                          {formatBengaliDate(e.date)}
                        </td>
                        <td className="py-3 px-4 text-xs text-stone-700">
                          {e.category}
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-stone-800">
                          {e.recipient || e.paidTo}
                        </td>
                        <td className="py-3 px-4 text-xs text-stone-600">
                          {mahfil ? mahfil.name : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-rose-700">
                          {formatCurrency(e.amount)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onViewExpense(e)}
                              title="বিবরণ দেখুন"
                              className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => onEditExpense(e)}
                                title="সম্পাদনা করুন"
                                className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => onDeleteExpense(e.id, e.title)}
                                title="মুছে ফেলুন"
                                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

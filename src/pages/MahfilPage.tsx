import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Mahfil, Donation, Expense } from '../types/database.types';
import {
  formatCurrency,
  formatBengaliDate,
  toBengaliNumber,
} from '../utils/formatters';
import {
  CalendarDays,
  Plus,
  MapPin,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  Search,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { PaginationControls } from '../components/common/PaginationControls';
import { databaseService, MahfilFilterOptions } from '../services/databaseService';

interface MahfilPageProps {
  mahfils: Mahfil[];
  donations: Donation[];
  expenses: Expense[];
  onAddMahfil: () => void;
  onEditMahfil: (mahfil: Mahfil) => void;
  onDeleteMahfil: (id: string, name: string) => void;
  onSelectMahfil: (mahfil: Mahfil) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export const MahfilPage: React.FC<MahfilPageProps> = ({
  mahfils,
  donations,
  expenses,
  onAddMahfil,
  onEditMahfil,
  onDeleteMahfil,
  onSelectMahfil,
  canEdit,
  canDelete,
}) => {
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('');

  const [pageMahfils, setPageMahfils] = useState<Mahfil[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [financialSummaries, setFinancialSummaries] = useState<
    Record<string, { income: number; expense: number; countDonations: number; countExpenses: number }>
  >({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Available years from dataset
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const set = new Set<string>([String(currentYear), String(currentYear - 1)]);
    mahfils.forEach((m) => {
      const yr = m.date.split('-')[0];
      if (yr) set.add(yr);
    });
    return Array.from(set).sort().reverse();
  }, [mahfils]);

  const queryFilters = useMemo((): MahfilFilterOptions => {
    return {
      page,
      pageSize,
      search: debouncedSearch || undefined,
      year: selectedYear || undefined,
      status: filterStatus !== 'all' ? filterStatus : undefined,
    };
  }, [page, pageSize, debouncedSearch, selectedYear, filterStatus]);

  const prevMahfilsLengthRef = useRef(mahfils.length);

  const loadMahfils = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await databaseService.getMahfilsPaginated(queryFilters);
      setPageMahfils(result.data);
      setTotalCount(result.totalCount);

      // Fetch financial metrics for the visible mahfils
      const ids = result.data.map((m) => m.id);
      if (ids.length > 0) {
        const summaries = await databaseService.getMahfilFinancialSummaries(ids);
        setFinancialSummaries(summaries);
      } else {
        setFinancialSummaries({});
      }
      setError(null);
    } catch (err: any) {
      console.error('Error in loadMahfils:', err);
      setError(err?.message || 'ডাটাবেস থেকে মাহফিল তালিকা লোড করা যায়নি');
      setPageMahfils([]);
      setTotalCount(0);
      setFinancialSummaries({});
    } finally {
      setIsLoading(false);
    }
  }, [queryFilters]);

  useEffect(() => {
    loadMahfils();
  }, [loadMahfils]);

  useEffect(() => {
    if (prevMahfilsLengthRef.current !== mahfils.length) {
      prevMahfilsLengthRef.current = mahfils.length;
      loadMahfils();
    }
  }, [mahfils, loadMahfils]);

  const statusLabels: Record<string, { label: string; color: string }> = {
    upcoming: { label: 'আসন্ন মাহফিল', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    ongoing: { label: 'চলমান মাহফিল', color: 'bg-teal-50 text-teal-800 border-teal-200' },
    completed: { label: 'সম্পন্ন', color: 'bg-stone-100 text-stone-700 border-stone-200' },
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            মাহফিল ব্যবস্থাপনা
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            দ্বীনি মাহফিলের আয়, ব্যয় ও উদ্বৃত্তের পূর্ণাঙ্গ হিসাব বিবরণী
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={onAddMahfil}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন মাহফিল যোগ করুন</span>
          </button>
        )}
      </div>

      {/* Search, Date Filter & Status Filters */}
      <div className="bg-white rounded-xl border border-stone-200/90 p-3 sm:p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-xs">
        <div className="flex flex-1 flex-col sm:flex-row gap-2">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="মাহফিলের নাম দিয়ে খুঁজুন..."
              className="w-full h-10 pl-9 pr-3 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
          </div>

          {/* Year Filter */}
          <div className="w-full sm:w-36">
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setPage(1);
              }}
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
        </div>

        {/* Segmented Status Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => {
              setFilterStatus('all');
              setPage(1);
            }}
            className={`py-1.5 px-3 text-xs font-medium rounded-lg transition-colors cursor-pointer text-center ${
              filterStatus === 'all'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            সকল ({toBengaliNumber(totalCount)})
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterStatus('upcoming');
              setPage(1);
            }}
            className={`py-1.5 px-3 text-xs font-medium rounded-lg transition-colors cursor-pointer text-center ${
              filterStatus === 'upcoming'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            আসন্ন
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterStatus('completed');
              setPage(1);
            }}
            className={`py-1.5 px-3 text-xs font-medium rounded-lg transition-colors cursor-pointer text-center ${
              filterStatus === 'completed'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            সম্পন্ন
          </button>
        </div>
      </div>

      {/* Mahfil Cards List Area */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-stone-200/90 p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-3 min-h-[300px]">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <h3 className="text-base font-bold text-stone-800">
            লোড হচ্ছে...
          </h3>
          <p className="text-xs text-stone-500 max-w-md">
            ডাটাবেস থেকে মাহফিলের রেকর্ড সংগ্রহ করা হচ্ছে
          </p>
        </div>
      ) : error ? (
        <div className="bg-rose-50/90 rounded-xl border border-rose-200 p-8 text-center shadow-xs flex flex-col items-center justify-center space-y-3 min-h-[220px]">
          <AlertTriangle className="w-8 h-8 text-rose-600" />
          <h3 className="text-base font-bold text-rose-900">
            হিসাব লোড করা যাচ্ছে না। আবার চেষ্টা করুন।
          </h3>
          <p className="text-xs text-rose-700 max-w-md leading-relaxed">
            {error}
          </p>
          <button
            type="button"
            onClick={loadMahfils}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>আবার চেষ্টা করুন</span>
          </button>
        </div>
      ) : pageMahfils.length === 0 ? (
        <EmptyState
          title="কোনো মাহফিল পাওয়া যায়নি"
          description={
            search || selectedYear || filterStatus !== 'all'
              ? 'আপনার অনুসন্ধান অনুসারে কোনো মাহফিল খুঁজে পাওয়া যায়নি।'
              : 'এখনো কোনো মাহফিল তালিকাভুক্ত করা হয়নি। মাহফিল আয়োজনের বাজেট ও আয়-ব্যয় রক্ষার্থে নতুন মাহফিল তৈরি করুন।'
          }
          actionText={canEdit && !search && filterStatus === 'all' ? '+ মাহফিল যোগ করুন' : undefined}
          onAction={onAddMahfil}
          icon={<CalendarDays className="w-6 h-6 stroke-1.5" />}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pageMahfils.map((m) => {
              const summary = financialSummaries[m.id] || {
                income: 0,
                expense: 0,
                countDonations: 0,
                countExpenses: 0,
              };
              const totalIncome = summary.income;
              const totalExpense = summary.expense;
              const netBalance = totalIncome - totalExpense;
              const statusConfig = statusLabels[m.status || 'upcoming'] || statusLabels.upcoming;

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-xl border border-stone-200/90 shadow-xs hover:border-emerald-300 transition-all p-4 sm:p-5 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-base text-stone-900">
                          {m.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>{formatBengaliDate(m.date)}</span>
                          <span aria-hidden="true">·</span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-start gap-1.5 text-xs text-stone-600">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                      <span>{m.location}</span>
                    </div>

                    {m.description && (
                      <p className="mt-2 text-xs text-stone-500 line-clamp-2 leading-relaxed bg-stone-50/70 p-2 rounded-lg">
                        {m.description}
                      </p>
                    )}
                  </div>

                  {/* 3-Column Financial Metrics for this Mahfil */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-stone-50 rounded-lg text-center text-xs">
                    <div>
                      <span className="text-stone-500 block">হাদিয়া</span>
                      <strong className="text-emerald-800 text-sm font-bold block mt-0.5">
                        {formatCurrency(totalIncome)}
                      </strong>
                      <span className="text-[10px] text-stone-400">
                        ({toBengaliNumber(summary.countDonations)} টি)
                      </span>
                    </div>

                    <div className="border-x border-stone-200">
                      <span className="text-stone-500 block">ব্যয়</span>
                      <strong className="text-rose-700 text-sm font-bold block mt-0.5">
                        {formatCurrency(totalExpense)}
                      </strong>
                      <span className="text-[10px] text-stone-400">
                        ({toBengaliNumber(summary.countExpenses)} টি)
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-500 block">ব্যালেন্স</span>
                      <strong className={`text-sm font-bold block mt-0.5 ${netBalance >= 0 ? 'text-teal-800' : 'text-rose-700'}`}>
                        {formatCurrency(netBalance)}
                      </strong>
                      <span className="text-[10px] text-stone-400">
                        {netBalance >= 0 ? 'উদ্বৃত্ত' : 'ঘাটতি'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onSelectMahfil(m)}
                      className="min-h-[42px] px-3.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      পূর্ণ হিসাব বিবরণী
                    </button>

                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => onEditMahfil(m)}
                          title="সম্পাদনা করুন"
                          className="min-h-[42px] p-2.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDeleteMahfil(m.id, m.name)}
                          title="মুছে ফেলুন"
                          className="min-h-[42px] p-2.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <PaginationControls
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={(newPage) => {
              setPage(newPage);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  );
};

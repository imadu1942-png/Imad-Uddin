import React, { useState } from 'react';
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
  TrendingUp,
  TrendingDown,
  Wallet,
  Eye,
  Edit2,
  Trash2,
  Calendar,
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

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
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredMahfils = mahfils.filter((m) => {
    if (filterStatus !== 'all' && m.status !== filterStatus) return false;
    return true;
  });

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

      {/* Segmented Filter Buttons (Zero-pill discipline) */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl max-w-sm">
        <button
          type="button"
          onClick={() => setFilterStatus('all')}
          className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg transition-colors cursor-pointer text-center ${
            filterStatus === 'all'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          সকল ({toBengaliNumber(mahfils.length)})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('upcoming')}
          className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg transition-colors cursor-pointer text-center ${
            filterStatus === 'upcoming'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          আসন্ন
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('completed')}
          className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg transition-colors cursor-pointer text-center ${
            filterStatus === 'completed'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          সম্পন্ন
        </button>
      </div>

      {/* Mahfil Cards List */}
      {filteredMahfils.length === 0 ? (
        <EmptyState
          title="কোনো মাহফিল পাওয়া যায়নি"
          description="এখনো কোনো মাহফিল তালিকাভুক্ত করা হয়নি। মাহফিল আয়োজনের বাজেট ও আয়-ব্যয় রক্ষার্থে নতুন মাহফিল তৈরি করুন।"
          actionText={canEdit ? '+ মাহফিল যোগ করুন' : undefined}
          onAction={onAddMahfil}
          icon={<CalendarDays className="w-6 h-6 stroke-1.5" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMahfils.map((m) => {
            const mDonations = donations.filter((d) => d.mahfilId === m.id);
            const mExpenses = expenses.filter((e) => e.mahfilId === m.id);
            const totalIncome = mDonations.reduce((sum, d) => sum + d.amount, 0);
            const totalExpense = mExpenses.reduce((sum, e) => sum + e.amount, 0);
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
                      ({toBengaliNumber(mDonations.length)} টি)
                    </span>
                  </div>

                  <div className="border-x border-stone-200">
                    <span className="text-stone-500 block">ব্যয়</span>
                    <strong className="text-rose-700 text-sm font-bold block mt-0.5">
                      {formatCurrency(totalExpense)}
                    </strong>
                    <span className="text-[10px] text-stone-400">
                      ({toBengaliNumber(mExpenses.length)} টি)
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
                    className="min-h-[40px] px-3.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
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
                        className="min-h-[40px] p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => onDeleteMahfil(m.id, m.name)}
                        title="মুছে ফেলুন"
                        className="min-h-[40px] p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg cursor-pointer"
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
      )}
    </div>
  );
};

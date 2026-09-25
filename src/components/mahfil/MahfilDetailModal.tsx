import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Mahfil, Donation, Expense } from '../../types/database.types';
import { formatCurrency, formatBengaliDate } from '../../utils/formatters';
import { Calendar, MapPin, TrendingUp, TrendingDown, Wallet, Plus, HeartHandshake, Receipt } from 'lucide-react';

interface MahfilDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  mahfil: Mahfil | null;
  donations: Donation[];
  expenses: Expense[];
  onAddDonationClick?: (mahfilId: string) => void;
  onAddExpenseClick?: (mahfilId: string) => void;
}

export const MahfilDetailModal: React.FC<MahfilDetailModalProps> = ({
  isOpen,
  onClose,
  mahfil,
  donations,
  expenses,
  onAddDonationClick,
  onAddExpenseClick,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'donations' | 'expenses'>('summary');

  if (!mahfil) return null;

  const relatedDonations = donations.filter((d) => d.mahfilId === mahfil.id);
  const relatedExpenses = expenses.filter((e) => e.mahfilId === mahfil.id);

  const totalIncome = relatedDonations.reduce((sum, d) => sum + d.amount, 0);
  const totalExpense = relatedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netBalance = totalIncome - totalExpense;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mahfil.name}
      subtitle={`${formatBengaliDate(mahfil.date)} · ${mahfil.location}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Financial Highlights for this Mahfil */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <span className="text-xs font-medium text-emerald-800 flex items-center justify-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> মোট হাদিয়া
            </span>
            <div className="text-base sm:text-xl font-bold text-emerald-800 mt-1">
              {formatCurrency(totalIncome)}
            </div>
          </div>

          <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
            <span className="text-xs font-medium text-rose-800 flex items-center justify-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> মোট খরচ
            </span>
            <div className="text-base sm:text-xl font-bold text-rose-700 mt-1">
              {formatCurrency(totalExpense)}
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${netBalance >= 0 ? 'bg-teal-50 border-teal-100' : 'bg-amber-50 border-amber-100'}`}>
            <span className="text-xs font-medium text-stone-700 flex items-center justify-center gap-1">
              <Wallet className="w-3.5 h-3.5" /> নিট ব্যালেন্স
            </span>
            <div className={`text-base sm:text-xl font-bold mt-1 ${netBalance >= 0 ? 'text-teal-800' : 'text-rose-700'}`}>
              {formatCurrency(netBalance)}
            </div>
          </div>
        </div>

        {/* Tab Buttons (Zero-pill compliant segmented buttons) */}
        <div className="flex border-b border-stone-200">
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`py-2 px-4 text-xs sm:text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'summary'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            সারসংক্ষেপ ও তথ্য
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('donations')}
            className={`py-2 px-4 text-xs sm:text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'donations'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            হাদিয়া সমূহ ({relatedDonations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`py-2 px-4 text-xs sm:text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'expenses'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            ব্যয় সমূহ ({relatedExpenses.length})
          </button>
        </div>

        {/* Tab 1: Summary */}
        {activeTab === 'summary' && (
          <div className="space-y-3 text-sm">
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 space-y-2">
              <div className="flex items-center gap-2 text-stone-700">
                <Calendar className="w-4 h-4 text-stone-400" />
                <span className="font-medium">তারিখ:</span> {formatBengaliDate(mahfil.date)}
              </div>
              <div className="flex items-center gap-2 text-stone-700">
                <MapPin className="w-4 h-4 text-stone-400" />
                <span className="font-medium">অনুষ্ঠানস্থল:</span> {mahfil.location}
              </div>
              {mahfil.description && (
                <div className="pt-2 border-t border-stone-200 text-stone-600 text-xs sm:text-sm leading-relaxed">
                  {mahfil.description}
                </div>
              )}
            </div>

            {/* Quick Actions to Add Related Donation / Expense */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              {onAddDonationClick && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAddDonationClick(mahfil.id);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer transition-colors"
                >
                  <HeartHandshake className="w-4 h-4" />
                  এই মাহফিলে হাদিয়া যোগ করুন
                </button>
              )}
              {onAddExpenseClick && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAddExpenseClick(mahfil.id);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-medium text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer transition-colors"
                >
                  <Receipt className="w-4 h-4" />
                  এই মাহফিলের খরচ যোগ করুন
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Related Donations */}
        {activeTab === 'donations' && (
          <div className="space-y-2">
            {relatedDonations.length === 0 ? (
              <div className="text-center py-6 text-stone-400 text-sm">
                এই মাহফিলের অধীনে এখনো কোনো হাদিয়া লিপিবদ্ধ করা হয়নি।
              </div>
            ) : (
              <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                {relatedDonations.map((d) => (
                  <div key={d.id} className="p-3 flex items-center justify-between bg-white text-sm">
                    <div>
                      <div className="font-semibold text-stone-900">{d.donorName}</div>
                      <div className="text-xs text-stone-500">
                        {formatBengaliDate(d.date)} · {d.category}
                      </div>
                    </div>
                    <div className="font-bold text-emerald-800">
                      {formatCurrency(d.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Related Expenses */}
        {activeTab === 'expenses' && (
          <div className="space-y-2">
            {relatedExpenses.length === 0 ? (
              <div className="text-center py-6 text-stone-400 text-sm">
                এই মাহফিলের অধীনে এখনো কোনো খরচ নথিভুক্ত করা হয়নি।
              </div>
            ) : (
              <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                {relatedExpenses.map((e) => (
                  <div key={e.id} className="p-3 flex items-center justify-between bg-white text-sm">
                    <div>
                      <div className="font-semibold text-stone-900">{e.title}</div>
                      <div className="text-xs text-stone-500">
                        {formatBengaliDate(e.date)} · {e.recipient} · {e.category}
                      </div>
                    </div>
                    <div className="font-bold text-rose-700">
                      {formatCurrency(e.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </Modal>
  );
};

import React from 'react';
import { Modal } from '../common/Modal';
import { Expense, Mahfil } from '../../types/database.types';
import { formatCurrency, formatBengaliDate, getPaymentMethodLabel } from '../../utils/formatters';
import { Calendar, Tag, CreditCard, FileText, UserCheck, CheckCircle } from 'lucide-react';

interface ExpenseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  mahfils: Mahfil[];
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  isOpen,
  onClose,
  expense,
  mahfils,
}) => {
  if (!expense) return null;

  const relatedMahfil = expense.mahfilId
    ? mahfils.find((m) => m.id === expense.mahfilId)
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ব্যয়ের পূর্ণ বিবরণ"
      subtitle="সংগঠনের তহবিল থেকে ব্যয় হওয়া খরচের রেকর্ড"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Big Amount Card */}
        <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-xl text-center">
          <div className="text-xs font-semibold text-rose-800 uppercase tracking-wider mb-1">
            মোট খরচের পরিমাণ
          </div>
          <div className="text-3xl font-bold text-rose-700">
            {formatCurrency(expense.amount)}
          </div>
          <div className="text-xs text-stone-500 mt-1">
            {getPaymentMethodLabel(expense.paymentMethod)} মাধ্যমে পরিশোধিত
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl bg-white overflow-hidden text-sm">
          <div className="p-3.5 flex items-center justify-between">
            <span className="text-stone-500">খরচের বিবরণ</span>
            <span className="font-semibold text-stone-900">{expense.title}</span>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <span className="text-stone-500 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-stone-400" />
              স্থান / প্রাপক / ভেন্ডর
            </span>
            <span className="font-medium text-stone-900">{expense.recipient}</span>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <span className="text-stone-500 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stone-400" />
              তারিখ
            </span>
            <span className="text-stone-800">{formatBengaliDate(expense.date)}</span>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <span className="text-stone-500 flex items-center gap-2">
              <Tag className="w-4 h-4 text-stone-400" />
              খরচের খাত
            </span>
            <span className="font-medium text-stone-800">{expense.category}</span>
          </div>

          {relatedMahfil && (
            <div className="p-3.5 flex items-center justify-between">
              <span className="text-stone-500 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                সম্পর্কিত মাহফিল
              </span>
              <span className="font-medium text-stone-800">{relatedMahfil.name}</span>
            </div>
          )}

          <div className="p-3.5 flex items-center justify-between">
            <span className="text-stone-500 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-stone-400" />
              পরিশোধের মাধ্যম
            </span>
            <span className="text-stone-800">{getPaymentMethodLabel(expense.paymentMethod)}</span>
          </div>

          {expense.description && (
            <div className="p-3.5">
              <div className="text-stone-500 mb-1">বিস্তারিত নোট:</div>
              <div className="text-stone-800 bg-stone-50 p-2.5 rounded-lg text-xs leading-relaxed">
                {expense.description}
              </div>
            </div>
          )}

          {expense.notes && (
            <div className="p-3.5 flex items-center justify-between">
              <span className="text-stone-500 flex items-center gap-2">
                <FileText className="w-4 h-4 text-stone-400" />
                ভাউচার / ক্যাশমেমো
              </span>
              <span className="font-mono text-stone-800">{expense.notes}</span>
            </div>
          )}

          <div className="p-3.5 flex items-center justify-between text-xs text-stone-500 bg-stone-50/50">
            <span>নথিভুক্তকারী: {expense.createdBy || 'ক্যাশিয়ার'}</span>
            <span>আইডি: {expense.id.slice(0, 10)}</span>
          </div>
        </div>

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

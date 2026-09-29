import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Expense, ExpenseCategory, Mahfil, PaymentMethod } from '../../types/database.types';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../utils/formatters';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Expense, 'id' | 'createdAt'>) => Promise<any>;
  initialData?: Expense | null;
  mahfils: Mahfil[];
  currentUserName: string;
  categories?: ExpenseCategory[];
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mahfils,
  currentUserName,
  categories = [],
}) => {
  // Active categories from ExpenseCategory management
  const activeCategories = useMemo(() => {
    return (categories || []).filter((c) => c.isActive);
  }, [categories]);

  // Combined options: active categories or fallback to EXPENSE_CATEGORIES if none configured
  const categoryOptions = useMemo(() => {
    let options: { id: string; label: string }[] = [];
    if (activeCategories.length > 0) {
      options = activeCategories.map((c) => ({ id: c.name, label: c.name }));
    } else {
      options = EXPENSE_CATEGORIES.map((c) => ({ id: c.id, label: c.label }));
    }

    // If editing existing expense and its category is not in the active options, preserve it!
    if (initialData?.category && !options.some((opt) => opt.id === initialData.category)) {
      options.unshift({
        id: initialData.category,
        label: `${initialData.category} (ঐতিহাসিক/নিষ্ক্রিয়)`,
      });
    }

    return options;
  }, [activeCategories, initialData?.category]);

  const defaultCat = categoryOptions[0]?.id || 'সাধারণ খরচ';

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(defaultCat);
  const [amount, setAmount] = useState<string>('');
  const [recipient, setRecipient] = useState('');
  const [mahfilId, setMahfilId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [createdBy, setCreatedBy] = useState(currentUserName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDate(initialData.date);
      setCategory(initialData.category);
      setAmount(String(initialData.amount));
      setRecipient(initialData.recipient);
      setMahfilId(initialData.mahfilId || '');
      setPaymentMethod((initialData.paymentMethod as PaymentMethod) || 'cash');
      setDescription(initialData.description || '');
      setNotes(initialData.notes || '');
      setCreatedBy(initialData.createdBy || currentUserName);
    } else {
      setTitle('');
      setDate(new Date().toISOString().split('T')[0]);
      setCategory(categoryOptions[0]?.id || 'সাধারণ খরচ');
      setAmount('');
      setRecipient('');
      setMahfilId('');
      setPaymentMethod('cash');
      setDescription('');
      setNotes('');
      setCreatedBy(currentUserName);
    }
    setErrorMsg('');
  }, [initialData, isOpen, currentUserName, categoryOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('অনুগ্রহ করে খরচের সংক্ষিপ্ত বিবরণ বা শিরোনাম লিখুন।');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('অনুগ্রহ করে সঠিক টাকার পরিমাণ লিখুন (০ এর বেশি)।');
      return;
    }
    if (!recipient.trim()) {
      setErrorMsg('স্থান, ভেন্ডর বা প্রাপকের নাম লিখুন।');
      return;
    }
    if (!date) {
      setErrorMsg('অনুগ্রহ করে তারিখ প্রদান করুন।');
      return;
    }

  setIsSubmitting(true);
  setErrorMsg('');
  try {
    await onSubmit({
      title: title.trim(),
      date,
      category,
      amount: parsedAmount,
      recipient: recipient.trim(),
      mahfilId: mahfilId || undefined,
      paymentMethod,
      description: description.trim() || undefined,
      notes: notes.trim() || undefined,
      createdBy: createdBy || currentUserName || 'ক্যাশিয়ার',
    });
    onClose();
  } catch (err: any) {
    setErrorMsg(err?.message || 'খরচের হিসাব সংরক্ষণ করা যায়নি');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'খরচ তথ্য সম্পাদনা' : 'নতুন খরচ লিপিবদ্ধকরণ'}
      subtitle="সংগঠন বা মাহফিলের ব্যয়ের হিসাব নির্ভুলভাবে নথিভুক্ত করুন"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 text-sm rounded-lg">
            {errorMsg}
          </div>
        )}

        {/* Title & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              খরচের বিষয় / শিরোনাম <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="উদাঃ তবাররুক মিষ্টি ও নাস্তা ক্রয়"
              className="w-full h-11 px-3 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              খরচের খাত <span className="text-rose-600">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 px-3 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent cursor-pointer"
            >
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              টাকার পরিমাণ (৳) <span className="text-rose-600">*</span>
            </label>
            <input
              type="number"
              step="any"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="উদাঃ ১২০০"
              className="w-full h-11 px-3 bg-stone-50 border border-stone-300 rounded-lg text-sm font-semibold text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              তারিখ <span className="text-rose-600">*</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-11 px-3 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent cursor-pointer"
            />
          </div>
        </div>

        {/* Vendor/Person & Payment Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              স্থান / ভেন্ডর / প্রাপক <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="উদাঃ রহমান মিষ্টান্ন ভাণ্ডার / সাউন্ড অপারেটর"
              className="w-full h-11 px-3 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              পরিশোধ মাধ্যম <span className="text-rose-600">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full h-11 px-3 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent cursor-pointer"
            >
              {PAYMENT_METHODS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Related Mahfil */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            সম্পর্কিত মাহফিল (ঐচ্ছিক)
          </label>
          <select
            value={mahfilId}
            onChange={(e) => setMahfilId(e.target.value)}
            className="w-full h-11 px-3 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent cursor-pointer"
          >
            <option value="">-- সাধারণ সাংগঠনিক খরচ (কোনো মাহফিল নয়) --</option>
            {mahfils.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.date})
              </option>
            ))}
          </select>
        </div>

        {/* Description & Notes */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            খরচের বিস্তারিত বিবরণ (ঐচ্ছিক)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="খরচের প্রেক্ষাপট বা বিস্তারিত তথ্য লিখুন..."
            className="w-full p-3 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            ভাউচার / ক্যাশমেমো / মন্তব্য (ঐচ্ছিক)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ভাউচার নম্বর বা ক্যাশমেমো রেফারেন্স..."
            className="w-full h-11 px-3 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            বাতিল
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:flex-1 py-2.5 px-5 text-sm font-semibold text-white bg-rose-700 hover:bg-rose-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : initialData ? 'হালনাগাদ সম্পন্ন করুন' : 'খরচ রেকর্ড করুন'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

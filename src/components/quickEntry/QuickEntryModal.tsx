import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Donation, Expense, ExpenseCategory, Mahfil, Member, PaymentMethod } from '../../types/database.types';
import {
  DONATION_CATEGORIES,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
} from '../../utils/formatters';
import {
  HeartHandshake,
  Receipt,
  CalendarPlus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Plus,
} from 'lucide-react';

export type QuickEntryType = 'donation' | 'expense' | 'mahfil';

interface QuickEntryModalProps {
  isOpen: boolean;
  initialType?: QuickEntryType;
  onClose: () => void;
  onSubmitDonation: (data: Omit<Donation, 'id' | 'createdAt'>) => Promise<any>;
  onSubmitExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => Promise<any>;
  onSubmitMahfil: (data: Omit<Mahfil, 'id' | 'createdAt'>) => Promise<any>;
  members: Member[];
  mahfils: Mahfil[];
  currentUserName: string;
  categories?: ExpenseCategory[];
}

export const QuickEntryModal: React.FC<QuickEntryModalProps> = ({
  isOpen,
  initialType = 'donation',
  onClose,
  onSubmitDonation,
  onSubmitExpense,
  onSubmitMahfil,
  members,
  mahfils,
  currentUserName,
  categories = [],
}) => {
  // Active categories from ExpenseCategory management
  const activeCategories = React.useMemo(() => {
    return (categories || []).filter((c) => c.isActive);
  }, [categories]);

  const expenseCategoryOptions = React.useMemo(() => {
    if (activeCategories.length > 0) {
      return activeCategories.map((c) => ({ id: c.name, label: c.name }));
    }
    return EXPENSE_CATEGORIES.map((c) => ({ id: c.id, label: c.label }));
  }, [activeCategories]);

  const defaultExpenseCategory = expenseCategoryOptions[0]?.id || 'সাধারণ খরচ';

  const [activeType, setActiveType] = useState<QuickEntryType>(initialType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Accordion state for additional optional fields
  const [showMoreDonation, setShowMoreDonation] = useState(false);
  const [showMoreExpense, setShowMoreExpense] = useState(false);

  // --- Donation Form State (Prioritizes: নাম → টাকা → তারিখ → মাহফিল → Save) ---
  const [donorName, setDonorName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [donationDate, setDonationDate] = useState(new Date().toISOString().split('T')[0]);
  const [donationMahfilId, setDonationMahfilId] = useState('');
  const [donationPaymentMethod, setDonationPaymentMethod] = useState<PaymentMethod>('cash');
  // Optional extra fields
  const [donationPurpose, setDonationPurpose] = useState(DONATION_CATEGORIES[0].id);
  const [donorPhone, setDonorPhone] = useState('');
  const [donationNotes, setDonationNotes] = useState('');

  // --- Expense Form State ---
  const [expenseCategory, setExpenseCategory] = useState(defaultExpenseCategory);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseMahfilId, setExpenseMahfilId] = useState('');
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<PaymentMethod>('cash');
  // Optional extra fields
  const [expensePaidTo, setExpensePaidTo] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');

  // --- Mahfil Form State ---
  const [mahfilName, setMahfilName] = useState('');
  const [mahfilDate, setMahfilDate] = useState(new Date().toISOString().split('T')[0]);
  const [mahfilLocation, setMahfilLocation] = useState('');
  const [mahfilDescription, setMahfilDescription] = useState('');

  // Reset form when modal opens or initialType changes
  useEffect(() => {
    if (isOpen) {
      setActiveType(initialType);
      resetForms();
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialType]);

  const resetForms = () => {
    const today = new Date().toISOString().split('T')[0];

    // Donation reset
    setDonorName('');
    setMemberId('');
    setDonationAmount('');
    setDonationDate(today);
    setDonationMahfilId('');
    setDonationPaymentMethod('cash');
    setDonationPurpose(DONATION_CATEGORIES[0].id);
    setDonorPhone('');
    setDonationNotes('');
    setShowMoreDonation(false);

    // Expense reset
    setExpenseCategory(expenseCategoryOptions[0]?.id || 'সাধারণ খরচ');
    setExpenseAmount('');
    setExpenseDate(today);
    setExpenseDescription('');
    setExpenseMahfilId('');
    setExpensePaymentMethod('cash');
    setExpensePaidTo('');
    setExpenseNotes('');
    setShowMoreExpense(false);

    // Mahfil reset
    setMahfilName('');
    setMahfilDate(today);
    setMahfilLocation('');
    setMahfilDescription('');
  };

  // Helper when selecting member for donation
  const handleSelectMember = (selectedId: string) => {
    setMemberId(selectedId);
    if (selectedId) {
      const found = members.find((m) => m.id === selectedId);
      if (found) {
        setDonorName(found.name);
        if (found.phone || found.mobileNumber) {
          setDonorPhone(found.phone || found.mobileNumber || '');
        }
      }
    }
  };

  // 1. Submit Quick Donation
  const handleSubmitDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const name = donorName.trim();
    if (!name) {
      setErrorMsg('অনুগ্রহ করে দানকারী বা সদস্যের নাম লিখুন।');
      return;
    }

    const amt = parseFloat(donationAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('অনুগ্রহ করে সঠিক টাকার পরিমাণ লিখুন (০-এর বেশি)।');
      return;
    }

    if (!donationDate) {
      setErrorMsg('অনুগ্রহ করে হাদিয়ার তারিখ প্রদান করুন।');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitDonation({
        donorName: name,
        memberId: memberId || null,
        phone: donorPhone.trim() || undefined,
        amount: amt,
        date: donationDate,
        donationDate,
        category: donationPurpose,
        purpose: donationPurpose,
        mahfilId: donationMahfilId || null,
        paymentMethod: donationPaymentMethod,
        notes: donationNotes.trim() || undefined,
        createdBy: currentUserName,
      });

      setSuccessMsg(`"${name}"-এর হাদিয়া (৳ ${amt}) সফলভাবে সংরক্ষিত হয়েছে।`);
      // Reset fields for fresh entry
      setDonorName('');
      setMemberId('');
      setDonationAmount('');
      setDonationNotes('');
      setDonorPhone('');
    } catch (err: any) {
      console.error('Quick donation submit error:', err);
      setErrorMsg(err?.message || 'হাদিয়া সংরক্ষণ করা সম্ভব হয়নি। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Submit Quick Expense
  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('অনুগ্রহ করে সঠিক ব্যয়ের পরিমাণ লিখুন (০-এর বেশি)।');
      return;
    }

    if (!expenseDate) {
      setErrorMsg('অনুগ্রহ করে ব্যয়ের তারিখ প্রদান করুন।');
      return;
    }

    const desc = expenseDescription.trim() || expenseCategory;

    setIsSubmitting(true);
    try {
      await onSubmitExpense({
        title: desc,
        date: expenseDate,
        expenseDate,
        category: expenseCategory,
        description: desc,
        amount: amt,
        recipient: expensePaidTo.trim() || 'সাধারণ ব্যয়',
        paidTo: expensePaidTo.trim() || 'সাধারণ ব্যয়',
        mahfilId: expenseMahfilId || null,
        paymentMethod: expensePaymentMethod,
        notes: expenseNotes.trim() || undefined,
        createdBy: currentUserName,
      });

      setSuccessMsg(`খরচের হিসাব (৳ ${amt}) সফলভাবে সংরক্ষিত হয়েছে।`);
      setExpenseAmount('');
      setExpenseDescription('');
      setExpensePaidTo('');
      setExpenseNotes('');
    } catch (err: any) {
      console.error('Quick expense submit error:', err);
      setErrorMsg(err?.message || 'খরচ সংরক্ষণ করা সম্ভব হয়নি। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Submit Quick Mahfil
  const handleSubmitMahfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const name = mahfilName.trim();
    if (!name) {
      setErrorMsg('অনুগ্রহ করে মাহফিলের নাম লিখুন।');
      return;
    }

    if (!mahfilDate) {
      setErrorMsg('অনুগ্রহ করে মাহফিলের তারিখ নির্বাচন করুন।');
      return;
    }

    const loc = mahfilLocation.trim();
    if (!loc) {
      setErrorMsg('অনুগ্রহ করে মাহফিলের স্থান/ঠিকানা লিখুন।');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitMahfil({
        name,
        date: mahfilDate,
        eventDate: mahfilDate,
        location: loc,
        description: mahfilDescription.trim() || undefined,
        status: mahfilDate >= new Date().toISOString().split('T')[0] ? 'upcoming' : 'completed',
        createdBy: currentUserName,
      });

      setSuccessMsg(`"${name}" মাহফিল সফলভাবে তৈরি হয়েছে।`);
      setMahfilName('');
      setMahfilLocation('');
      setMahfilDescription('');
    } catch (err: any) {
      console.error('Quick mahfil submit error:', err);
      setErrorMsg(err?.message || 'মাহফিল তৈরি করা সম্ভব হয়নি। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="দ্রুত ভুক্তি (Quick Entry)"
    >
      <div className="space-y-4">
        {/* Type Selector Tabs ( হাদিায়া, খরচ, মাহফিল ) */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveType('donation');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`min-h-[44px] py-2 px-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeType === 'donation'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <HeartHandshake className="w-4 h-4 shrink-0" />
            <span className="truncate">+ হাদিয়া</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveType('expense');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`min-h-[44px] py-2 px-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeType === 'expense'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Receipt className="w-4 h-4 shrink-0" />
            <span className="truncate">+ খরচ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveType('mahfil');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`min-h-[44px] py-2 px-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeType === 'mahfil'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <CalendarPlus className="w-4 h-4 shrink-0" />
            <span className="truncate">+ মাহফিল</span>
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm text-emerald-900 animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{successMsg}</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                ডাটাবেসে সংরক্ষিত হয়েছে। আপনি চাইলে নিচে আরও এন্ট্রি দিতে পারেন।
              </p>
            </div>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm text-rose-900 animate-in fade-in duration-200">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">ত্রুটি ঘটেছে</p>
              <p className="text-xs text-rose-700 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* ---------------- 1. QUICK DONATION FORM ---------------- */}
        {/* Prioritizes: নাম → টাকা → তারিখ → মাহফিল → Save */}
        {activeType === 'donation' && (
          <form onSubmit={handleSubmitDonation} className="space-y-3.5">
            {/* 1. নাম (Donor/Member Name) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-800">
                  দানকারী / সদস্যের নাম <span className="text-rose-600">*</span>
                </label>
                {members.length > 0 && (
                  <span className="text-[11px] text-stone-500">
                    নিবন্ধিত সদস্য থেকে নির্বাচন করতে পারেন
                  </span>
                )}
              </div>

              {members.length > 0 && (
                <div className="mb-1.5">
                  <select
                    value={memberId}
                    onChange={(e) => handleSelectMember(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:bg-white focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="">-- নিবন্ধিত সদস্য বাছাই করুন (ঐচ্ছিক) --</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.phone ? `(${m.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <input
                type="text"
                required
                value={donorName}
                onChange={(e) => {
                  setDonorName(e.target.value);
                  if (memberId) setMemberId('');
                }}
                placeholder="যেমন: হাজী মোহাম্মদ রফিক"
                className="w-full h-11 px-3 text-sm bg-white border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
              />
            </div>

            {/* 2. টাকা (Amount) */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                টাকার পরিমাণ (৳) <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-stone-500">
                  ৳
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  placeholder="যেমন: ৫০০ বা ১০০০"
                  className="w-full h-12 pl-9 pr-3 text-lg font-bold bg-emerald-50/40 border border-emerald-300 rounded-lg text-emerald-950 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* 3. তারিখ (Date) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  তারিখ <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={donationDate}
                  onChange={(e) => setDonationDate(e.target.value)}
                  className="w-full h-11 px-3 text-sm bg-white border border-stone-300 rounded-lg text-stone-800 focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  পরিশোধ মাধ্যম
                </label>
                <select
                  value={donationPaymentMethod}
                  onChange={(e) => setDonationPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full h-11 px-3 text-xs sm:text-sm bg-white border border-stone-300 rounded-lg text-stone-800 focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                >
                  {PAYMENT_METHODS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. মাহফিল (Related Mahfil - optional) */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                সংশ্লিষ্ট মাহফিল (ঐচ্ছিক)
              </label>
              <select
                value={donationMahfilId}
                onChange={(e) => setDonationMahfilId(e.target.value)}
                className="w-full h-11 px-3 text-xs sm:text-sm bg-white border border-stone-300 rounded-lg text-stone-800 focus:ring-2 focus:ring-emerald-600 cursor-pointer"
              >
                <option value="">সাধারণ দান (কোনো নির্দিষ্ট মাহফিল নয়)</option>
                {mahfils.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.date})
                  </option>
                ))}
              </select>
            </div>

            {/* 5. আরও তথ্য (Optional additional fields: Purpose, Mobile, Notes) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowMoreDonation(!showMoreDonation)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 cursor-pointer"
              >
                {showMoreDonation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>{showMoreDonation ? 'অতিরিক্ত তথ্য লুকান' : 'আরও তথ্য (মোবাইল নম্বর, খাত, মন্তব্য)'}</span>
              </button>

              {showMoreDonation && (
                <div className="mt-2.5 p-3.5 bg-stone-50 rounded-xl border border-stone-200/90 space-y-3 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        খাত / উদ্দেশ্য
                      </label>
                      <select
                        value={donationPurpose}
                        onChange={(e) => setDonationPurpose(e.target.value)}
                        className="w-full h-10 px-2.5 text-xs bg-white border border-stone-300 rounded-lg text-stone-800"
                      >
                        {DONATION_CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        মোবাইল নম্বর
                      </label>
                      <input
                        type="tel"
                        value={donorPhone}
                        onChange={(e) => setDonorPhone(e.target.value)}
                        placeholder="০১৭১১XXXXXX"
                        className="w-full h-10 px-3 text-xs bg-white border border-stone-300 rounded-lg text-stone-900 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      মন্তব্য / রশিদ নম্বর
                    </label>
                    <input
                      type="text"
                      value={donationNotes}
                      onChange={(e) => setDonationNotes(e.target.value)}
                      placeholder="রশিদ নম্বর বা বিশেষ কোনো তথ্য"
                      className="w-full h-10 px-3 text-xs bg-white border border-stone-300 rounded-lg text-stone-900"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions: Save Button (Large, Touch-Friendly) */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 min-h-[50px] px-4 py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>হাদিয়া সংরক্ষণ করুন</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[50px] px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-sm rounded-xl transition cursor-pointer"
              >
                বন্ধ
              </button>
            </div>
          </form>
        )}

        {/* ---------------- 2. QUICK EXPENSE FORM ---------------- */}
        {activeType === 'expense' && (
          <form onSubmit={handleSubmitExpense} className="space-y-3.5">
            {/* 1. Expense Category */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                খরচের খাত <span className="text-rose-600">*</span>
              </label>
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="w-full h-11 px-3 text-sm bg-white border border-stone-300 rounded-lg text-stone-800 focus:ring-2 focus:ring-rose-600 cursor-pointer"
              >
                {expenseCategoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Amount */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                টাকার পরিমাণ (৳) <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-stone-500">
                  ৳
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="যেমন: ১৫০০ বা ৩০০০"
                  className="w-full h-12 pl-9 pr-3 text-lg font-bold bg-rose-50/40 border border-rose-300 rounded-lg text-rose-950 focus:bg-white focus:ring-2 focus:ring-rose-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* 3. Description */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                খরচের বিবরণ
              </label>
              <input
                type="text"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                placeholder="যেমন: মাইক ভাড়া ও সাউন্ড সিস্টেম চার্জ"
                className="w-full h-11 px-3 text-sm bg-white border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-rose-600 font-medium"
              />
            </div>

            {/* 4. Date & Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  তারিখ <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full h-11 px-3 text-sm bg-white border border-stone-300 rounded-lg text-stone-800 focus:ring-2 focus:ring-rose-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  পরিশোধ মাধ্যম
                </label>
                <select
                  value={expensePaymentMethod}
                  onChange={(e) => setExpensePaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full h-11 px-3 text-xs sm:text-sm bg-white border border-stone-300 rounded-lg text-stone-800 focus:ring-2 focus:ring-rose-600 cursor-pointer"
                >
                  {PAYMENT_METHODS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 5. Related Mahfil (optional) */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                সংশ্লিষ্ট মাহফিল (ঐচ্ছিক)
              </label>
              <select
                value={expenseMahfilId}
                onChange={(e) => setExpenseMahfilId(e.target.value)}
                className="w-full h-11 px-3 text-xs sm:text-sm bg-white border border-stone-300 rounded-lg text-stone-800 focus:ring-2 focus:ring-rose-600 cursor-pointer"
              >
                <option value="">সাধারণ খরচ (কোনো নির্দিষ্ট মাহফিল নয়)</option>
                {mahfils.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.date})
                  </option>
                ))}
              </select>
            </div>

            {/* 6. More Optional Fields (Paid to, Notes) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowMoreExpense(!showMoreExpense)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 hover:text-rose-950 cursor-pointer"
              >
                {showMoreExpense ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>{showMoreExpense ? 'অতিরিক্ত তথ্য লুকান' : 'আরও তথ্য (প্রাপক / দোকানদার, ভাউচার নম্বর)'}</span>
              </button>

              {showMoreExpense && (
                <div className="mt-2.5 p-3.5 bg-stone-50 rounded-xl border border-stone-200/90 space-y-3 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      প্রাপক / ভেন্ডর / দোকানদারের নাম
                    </label>
                    <input
                      type="text"
                      value={expensePaidTo}
                      onChange={(e) => setExpensePaidTo(e.target.value)}
                      placeholder="কাকে টাকা প্রদান করা হয়েছে"
                      className="w-full h-10 px-3 text-xs bg-white border border-stone-300 rounded-lg text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      ভাউচার নম্বর / মন্তব্য
                    </label>
                    <input
                      type="text"
                      value={expenseNotes}
                      onChange={(e) => setExpenseNotes(e.target.value)}
                      placeholder="ভাউচার/ক্যাশমেমো বা অন্যান্য বিবরণ"
                      className="w-full h-10 px-3 text-xs bg-white border border-stone-300 rounded-lg text-stone-900"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions: Save Expense Button */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 min-h-[50px] px-4 py-3 bg-rose-700 hover:bg-rose-800 active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>খরচ সংরক্ষণ করুন</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[50px] px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-sm rounded-xl transition cursor-pointer"
              >
                বন্ধ
              </button>
            </div>
          </form>
        )}

        {/* ---------------- 3. QUICK MAHFIL FORM ---------------- */}
        {activeType === 'mahfil' && (
          <form onSubmit={handleSubmitMahfil} className="space-y-3.5">
            {/* 1. Mahfil Name */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                মাহফিলের নাম <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={mahfilName}
                onChange={(e) => setMahfilName(e.target.value)}
                placeholder="যেমন: পবিত্র ঈদে মিলাদুন্নবী (সা.) ও বার্ষিক মাহফিল"
                className="w-full h-11 px-3 text-sm bg-white border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-teal-600 font-medium"
              />
            </div>

            {/* 2. Date */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                মাহফিলের তারিখ <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                required
                value={mahfilDate}
                onChange={(e) => setMahfilDate(e.target.value)}
                className="w-full h-11 px-3 text-sm bg-white border border-stone-300 rounded-lg text-stone-800 focus:ring-2 focus:ring-teal-600"
              />
            </div>

            {/* 3. Location */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                স্থান / ঠিকানা <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={mahfilLocation}
                onChange={(e) => setMahfilLocation(e.target.value)}
                placeholder="যেমন: গাউছিয়া মাদ্রাসা প্রাঙ্গণ, চন্দনাইশ"
                className="w-full h-11 px-3 text-sm bg-white border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-teal-600 font-medium"
              />
            </div>

            {/* 4. Description */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                বিবরণ / লক্ষ্য (ঐচ্ছিক)
              </label>
              <textarea
                rows={2}
                value={mahfilDescription}
                onChange={(e) => setMahfilDescription(e.target.value)}
                placeholder="মাহফিল সম্পর্কিত অতিরিক্ত কোনো তথ্য বা উদ্দেশ্য..."
                className="w-full p-3 text-xs sm:text-sm bg-white border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-teal-600"
              />
            </div>

            {/* Actions: Save Mahfil Button */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 min-h-[50px] px-4 py-3 bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>তৈরি হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>মাহফিল সংরক্ষণ করুন</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[50px] px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-sm rounded-xl transition cursor-pointer"
              >
                বন্ধ
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

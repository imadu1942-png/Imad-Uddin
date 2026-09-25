import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Donation, Mahfil, Member, PaymentMethod } from '../../types/database.types';
import { DONATION_CATEGORIES, PAYMENT_METHODS } from '../../utils/formatters';

interface DonationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Donation, 'id' | 'createdAt'>) => Promise<any>;
  initialData?: Donation | null;
  members: Member[];
  mahfils: Mahfil[];
  currentUserName: string;
}

export const DonationFormModal: React.FC<DonationFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  members,
  mahfils,
  currentUserName,
}) => {
  const [donorName, setDonorName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(DONATION_CATEGORIES[0].id);
  const [mahfilId, setMahfilId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [createdBy, setCreatedBy] = useState(currentUserName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialData) {
      setDonorName(initialData.donorName);
      setMemberId(initialData.memberId || '');
      setMobileNumber(initialData.mobileNumber || '');
      setAmount(String(initialData.amount));
      setDate(initialData.date);
      setCategory(initialData.category);
      setMahfilId(initialData.mahfilId || '');
      setPaymentMethod((initialData.paymentMethod as PaymentMethod) || 'cash');
      setNotes(initialData.notes || '');
      setCreatedBy(initialData.createdBy || currentUserName);
    } else {
      setDonorName('');
      setMemberId('');
      setMobileNumber('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setCategory(DONATION_CATEGORIES[0].id);
      setMahfilId('');
      setPaymentMethod('cash');
      setNotes('');
      setCreatedBy(currentUserName);
    }
    setErrorMsg('');
  }, [initialData, isOpen, currentUserName]);

  // When a member is selected from dropdown, auto-fill name and mobile
  const handleMemberChange = (selectedMemberId: string) => {
    setMemberId(selectedMemberId);
    if (selectedMemberId) {
      const found = members.find((m) => m.id === selectedMemberId);
      if (found) {
        setDonorName(found.name);
        if (found.mobileNumber) {
          setMobileNumber(found.mobileNumber);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName.trim()) {
      setErrorMsg('অনুগ্রহ করে দানকারীর নাম লিখুন বা সদস্য নির্বাচন করুন।');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('অনুগ্রহ করে সঠিক টাকার পরিমাণ লিখুন (০ এর বেশি)।');
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
        donorName: donorName.trim(),
        memberId: memberId || undefined,
        mobileNumber: mobileNumber.trim() || undefined,
        amount: parsedAmount,
        date,
        category,
        mahfilId: mahfilId || undefined,
        paymentMethod,
        notes: notes.trim() || undefined,
        createdBy: createdBy || currentUserName || 'ক্যাশিয়ার',
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'তথ্য সংরক্ষণ করা যায়নি');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'হাদিয়া তথ্য সম্পাদনা' : 'নতুন হাদিয়া / দান গ্রহণ'}
      subtitle="সঠিক হিসাব নিশ্চিত করতে সকল তথ্য সাবধানে পূরণ করুন"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 text-sm rounded-lg">
            {errorMsg}
          </div>
        )}

        {/* Member Select & Donor Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              নিবন্ধিত সদস্য (ঐচ্ছিক)
            </label>
            <select
              value={memberId}
              onChange={(e) => handleMemberChange(e.target.value)}
              className="w-full h-11 px-3 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent cursor-pointer"
            >
              <option value="">-- সদস্য নির্বাচন করুন --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.mobileNumber ? `(${m.mobileNumber})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              দানকারী / দাতার নাম <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="উদাঃ মোহাঃ রফিকুল ইসলাম"
              className="w-full h-11 px-3 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
          </div>
        </div>

        {/* Mobile & Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              মোবাইল নম্বর (ঐচ্ছিক)
            </label>
            <input
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="০১৭১১-XXXXXX"
              className="w-full h-11 px-3 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
          </div>

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
              placeholder="উদাঃ ৫০০"
              className="w-full h-11 px-3 bg-stone-50 border border-stone-300 rounded-lg text-sm font-semibold text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
          </div>
        </div>

        {/* Date & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              হাদিয়ার খাত / উদ্দেশ্য <span className="text-rose-600">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 px-3 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent cursor-pointer"
            >
              {DONATION_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Related Mahfil & Payment Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              সম্পর্কিত মাহফিল (ঐচ্ছিক)
            </label>
            <select
              value={mahfilId}
              onChange={(e) => setMahfilId(e.target.value)}
              className="w-full h-11 px-3 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent cursor-pointer"
            >
              <option value="">-- সাধারণ / কোনো নির্দিষ্ট মাহফিল নয় --</option>
              {mahfils.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.date})
                </option>
              ))}
            </select>
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

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            মন্তব্য / রসিদ নম্বর (ঐচ্ছিক)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="বিশেষ কোনো নির্দেশনা বা রসিদ বই নম্বর থাকলে লিখুন..."
            className="w-full p-3 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent resize-none"
          />
        </div>

        {/* Action Buttons */}
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
            className="w-full sm:flex-1 py-2.5 px-5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : initialData ? 'হালনাগাদ সম্পন্ন করুন' : 'হাদিয়া জমা করুন'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

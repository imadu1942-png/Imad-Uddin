import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Member } from '../../types/database.types';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Member, 'id' | 'createdAt'>) => Promise<any>;
  initialData?: Member | null;
}

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setMobileNumber(initialData.mobileNumber || '');
      setAddress(initialData.address || '');
      setNotes(initialData.notes || '');
      setStatus(initialData.status);
    } else {
      setName('');
      setMobileNumber('');
      setAddress('');
      setNotes('');
      setStatus('active');
    }
    setErrorMsg('');
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('অনুগ্রহ করে সদস্যের নাম লিখুন।');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onSubmit({
        name: name.trim(),
        mobileNumber: mobileNumber.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        status,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'সদস্যের তথ্য সংরক্ষণ করা যায়নি');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'সদস্যের তথ্য সম্পাদন' : 'নতুন সদস্য নিবন্ধন'}
      subtitle="সংগঠনের নিয়মিত সদস্য বা শুভাকাঙ্ক্ষীদের তালিকাভুক্তকরণ"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 text-sm rounded-lg">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            সদস্যের পুরো নাম <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="উদাঃ আলহাজ্ব কবির আহমেদ"
            className="w-full h-11 px-3 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              মোবাইল নম্বর
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
              সদস্যপদ অবস্থা
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              className="w-full h-11 px-3 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent cursor-pointer"
            >
              <option value="active">সক্রিয় সদস্য (Active)</option>
              <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            ঠিকানা (ঐচ্ছিক)
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="গ্রাম/রোড, পোস্ট অফিস, থানা, জেলা"
            className="w-full h-11 px-3 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            মন্তব্য / পদবি (ঐচ্ছিক)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="সংগঠনের বিশেষ দায়িত্ব বা কোনো বিশেষ তথ্য..."
            className="w-full p-3 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent resize-none"
          />
        </div>

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
            {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : initialData ? 'হালনাগাদ সম্পন্ন করুন' : 'সদস্য যুক্ত করুন'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

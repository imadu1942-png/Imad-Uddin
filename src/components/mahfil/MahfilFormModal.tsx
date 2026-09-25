import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Mahfil } from '../../types/database.types';

interface MahfilFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Mahfil, 'id' | 'createdAt'>) => Promise<any>;
  initialData?: Mahfil | null;
}

export const MahfilFormModal: React.FC<MahfilFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'upcoming' | 'completed' | 'ongoing'>('upcoming');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDate(initialData.date);
      setLocation(initialData.location);
      setDescription(initialData.description || '');
      setStatus(initialData.status || 'upcoming');
    } else {
      setName('');
      setDate(new Date().toISOString().split('T')[0]);
      setLocation('');
      setDescription('');
      setStatus('upcoming');
    }
    setErrorMsg('');
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('অনুগ্রহ করে মাহফিলের নাম লিখুন।');
      return;
    }
    if (!location.trim()) {
      setErrorMsg('অনুগ্রহ করে মাহফিলের স্থান নির্ধারণ করুন।');
      return;
    }
    if (!date) {
      setErrorMsg('অনুগ্রহ করে তারিখ দিন।');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onSubmit({
        name: name.trim(),
        date,
        location: location.trim(),
        description: description.trim() || undefined,
        status,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'মাহফিল সংরক্ষণ করা যায়নি');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'মাহফিল সম্পাদনা' : 'নতুন মাহফিল যোগ করুন'}
      subtitle="দ্বীনি মাহফিলের আয় ও ব্যয়ের সমন্বিত হিসাব সংরক্ষণের জন্য"
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
            মাহফিলের নাম <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="উদাঃ বাৎসরিক ঈদে মিলাদুন্নবী (সা.) মাহফিল"
            className="w-full h-11 px-3 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              মাহফিলের তারিখ <span className="text-rose-600">*</span>
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
              অবস্থা (Status)
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full h-11 px-3 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent cursor-pointer"
            >
              <option value="upcoming">আসন্ন মাহফিল</option>
              <option value="ongoing">চলমান</option>
              <option value="completed">সম্পন্ন</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            অনুষ্ঠানস্থল / অবস্থান <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="উদাঃ খানকাহ শরীফ প্রাঙ্গণ / কেন্দ্রীয় জামে মসজিদ মাঠ"
            className="w-full h-11 px-3 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            বিবরণ বা আলোচকবৃন্দের তালিকা (ঐচ্ছিক)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="মাহফিলের উদ্দেশ্য, প্রধান আলোচক ও বিশেষ আকর্ষণ..."
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
            {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : initialData ? 'হালনাগাদ সম্পন্ন করুন' : 'মাহফিল তৈরি করুন'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

import React from 'react';
import { Modal } from '../common/Modal';
import { Donation, Mahfil } from '../../types/database.types';
import { formatCurrency, formatBengaliDate, getPaymentMethodLabel } from '../../utils/formatters';
import { Calendar, User, Phone, Tag, CreditCard, FileText, CheckCircle } from 'lucide-react';

interface DonationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  donation: Donation | null;
  mahfils: Mahfil[];
  isPublicGuest?: boolean;
}

export const DonationDetailModal: React.FC<DonationDetailModalProps> = ({
  isOpen,
  onClose,
  donation,
  mahfils,
  isPublicGuest = false,
}) => {
  if (!donation) return null;

  const relatedMahfil = donation.mahfilId
    ? mahfils.find((m) => m.id === donation.mahfilId)
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="হাদিয়ার পূর্ণ বিবরণ"
      subtitle="সংগঠনের আর্থিক তহবিলে জমা হওয়া হাদিয়া রেকর্ড"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Big Amount Card */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-center">
          <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            মোট হাদিয়া পরিমাণ
          </div>
          <div className="text-3xl font-bold text-emerald-800">
            {formatCurrency(donation.amount)}
          </div>
          <div className="text-xs text-stone-500 mt-1">
            {getPaymentMethodLabel(donation.paymentMethod)} মাধ্যমে গৃহীত
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl bg-white overflow-hidden text-sm">
          <div className="p-3.5 flex items-center justify-between">
            <span className="text-stone-500 flex items-center gap-2">
              <User className="w-4 h-4 text-stone-400" />
              দানকারী
            </span>
            <span className="font-semibold text-stone-900">{donation.donorName}</span>
          </div>

          {!isPublicGuest && (donation.phone || donation.mobileNumber) && (
            <div className="p-3.5 flex items-center justify-between">
              <span className="text-stone-500 flex items-center gap-2">
                <Phone className="w-4 h-4 text-stone-400" />
                মোবাইল নম্বর
              </span>
              <span className="text-stone-800 font-mono">{donation.phone || donation.mobileNumber}</span>
            </div>
          )}

          <div className="p-3.5 flex items-center justify-between">
            <span className="text-stone-500 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stone-400" />
              তারিখ
            </span>
            <span className="text-stone-800">{formatBengaliDate(donation.date)}</span>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <span className="text-stone-500 flex items-center gap-2">
              <Tag className="w-4 h-4 text-stone-400" />
              খাত / উদ্দেশ্য
            </span>
            <span className="font-semibold text-stone-800">{donation.purpose || donation.category}</span>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <span className="text-stone-500 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-stone-400" />
              পরিশোধ মাধ্যম
            </span>
            <span className="text-stone-800 font-medium">
              {getPaymentMethodLabel(donation.paymentMethod)}
            </span>
          </div>

          {relatedMahfil && (
            <div className="p-3.5 flex items-center justify-between">
              <span className="text-stone-500 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-stone-400" />
                সম্পর্কিত মাহফিল
              </span>
              <span className="font-semibold text-emerald-800">{relatedMahfil.name}</span>
            </div>
          )}

          {!isPublicGuest && donation.notes && (
            <div className="p-3.5 flex items-start justify-between gap-3">
              <span className="text-stone-500 flex items-center gap-2 shrink-0">
                <FileText className="w-4 h-4 text-stone-400" />
                মন্তব্য / রসিদ
              </span>
              <span className="text-stone-800 text-right text-xs leading-relaxed">
                {donation.notes}
              </span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

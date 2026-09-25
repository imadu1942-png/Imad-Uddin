import React from 'react';
import { FolderX } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'এখনো কোনো হিসাব যোগ করা হয়নি',
  description = 'নতুন আয়, ব্যয়, মাহফিল বা সদস্যের তথ্য সংরক্ষণ করতে নিচের বোতামে চাপুন।',
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-xl border border-dashed border-stone-300">
      <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center mb-3">
        {icon || <FolderX className="w-6 h-6 stroke-1.5" />}
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-stone-800 mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-stone-500 max-w-sm mb-5 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          type="button"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors active:scale-98 cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toBengaliNumber } from '../../utils/formatters';

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (newPage: number) => void;
  isLoading?: boolean;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  page,
  pageSize,
  totalCount,
  onPageChange,
  isLoading = false,
}) => {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startRecord = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalCount);

  if (totalCount === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-200">
      {/* Current page count info: "১–২০ / মোট X" */}
      <div className="text-xs sm:text-sm text-stone-600 font-medium order-2 sm:order-1">
        প্রদর্শিত হচ্ছে:{' '}
        <span className="font-bold text-stone-900">
          {toBengaliNumber(startRecord)}–{toBengaliNumber(endRecord)}
        </span>{' '}
        /{' '}
        <span>
          মোট <strong className="text-stone-900">{toBengaliNumber(totalCount)}</strong> টি
        </span>
      </div>

      {/* Touch-friendly Previous / Next Buttons */}
      <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
          className="min-h-[42px] px-4 py-2 text-xs sm:text-sm font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 flex-1 sm:flex-initial"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          <span>আগের</span>
        </button>

        <div className="sm:hidden px-3 text-xs font-bold text-stone-700 font-mono">
          {toBengaliNumber(page)} / {toBengaliNumber(totalPages)}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
          className="min-h-[42px] px-4 py-2 text-xs sm:text-sm font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 flex-1 sm:flex-initial"
        >
          <span>পরের</span>
          <ChevronRight className="w-4 h-4 shrink-0" />
        </button>
      </div>
    </div>
  );
};

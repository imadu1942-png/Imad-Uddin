import React from 'react';
import { formatCurrency } from '../../utils/formatters';

interface StatCardProps {
  label: string;
  amount: number;
  subtitle?: string;
  variant?: 'emerald' | 'amber' | 'rose' | 'stone' | 'teal';
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  amount,
  subtitle,
  variant = 'emerald',
  icon,
}) => {
  const isNegative = amount < 0;

  // Curated color schemes for financial figures
  const variantStyles = {
    emerald: 'border-l-4 border-l-emerald-600 bg-white text-stone-900',
    amber: 'border-l-4 border-l-amber-600 bg-white text-stone-900',
    rose: 'border-l-4 border-l-rose-600 bg-white text-stone-900',
    stone: 'border-l-4 border-l-stone-600 bg-white text-stone-900',
    teal: 'border-l-4 border-l-teal-700 bg-white text-stone-900',
  };

  const amountColor = isNegative
    ? 'text-rose-600'
    : variant === 'rose'
    ? 'text-rose-700'
    : variant === 'amber'
    ? 'text-amber-800'
    : 'text-emerald-800';

  return (
    <div
      className={`rounded-xl p-4 sm:p-5 border border-stone-200/80 shadow-xs transition-shadow hover:shadow-md ${variantStyles[variant]}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs sm:text-sm font-medium text-stone-600 line-clamp-1">
          {label}
        </span>
        {icon && <div className="text-stone-400 shrink-0">{icon}</div>}
      </div>

      <div className="mt-2.5 flex items-baseline">
        <span className={`text-xl sm:text-2xl font-bold tracking-tight ${amountColor}`}>
          {formatCurrency(amount)}
        </span>
      </div>

      {subtitle && (
        <div className="mt-1 text-xs text-stone-500 font-normal">
          {subtitle}
        </div>
      )}
    </div>
  );
};

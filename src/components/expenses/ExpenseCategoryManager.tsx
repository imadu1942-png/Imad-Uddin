import React, { useState, useMemo } from 'react';
import { ExpenseCategory, Expense, UserRole } from '../../types/database.types';
import { toBengaliNumber } from '../../utils/formatters';
import {
  Tags,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Check,
  X,
  ShieldAlert,
  Copy,
  CheckCheck,
  HelpCircle,
  Info,
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface ExpenseCategoryManagerProps {
  currentRole: UserRole;
  categories: ExpenseCategory[];
  expenses: Expense[];
  onAddCategory: (name: string) => Promise<any>;
  onUpdateCategory: (id: string, name: string) => Promise<any>;
  onToggleActive: (id: string, isActive: boolean) => Promise<any>;
  onDeleteCategory?: (id: string, name: string) => Promise<any>;
  isModal?: boolean;
}

export const ExpenseCategoryManager: React.FC<ExpenseCategoryManagerProps> = ({
  currentRole,
  categories,
  expenses,
  onAddCategory,
  onUpdateCategory,
  onToggleActive,
  onDeleteCategory,
  isModal = false,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Deactivate confirmation state
  const [deactivatingCategory, setDeactivatingCategory] = useState<ExpenseCategory | null>(null);

  // SQL Copy state
  const [isCopied, setIsCopied] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  // Calculate usage count for each category from expenses list
  const categoryUsageMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const exp of expenses) {
      if (exp.category) {
        const catName = exp.category.trim();
        map.set(catName, (map.get(catName) || 0) + 1);
      }
    }
    return map;
  }, [expenses]);

  // Check permission
  const isAdmin = currentRole === 'admin';

  if (!isAdmin) {
    return (
      <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-2">
        <ShieldAlert className="w-8 h-8 text-amber-600 mx-auto" />
        <h3 className="font-bold text-amber-900 text-sm">অনুমতি সংরক্ষিত</h3>
        <p className="text-xs text-amber-700">
          শুধুমাত্র প্রধান অ্যাডমিন খরচের ক্যাটাগরি তৈরি, সম্পাদন ও নিয়ন্ত্রণ করতে পারেন।
        </p>
      </div>
    );
  }

  // Handle Add Category
  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setNewCategoryName('');
    setValidationError(null);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewCategoryName('');
    setValidationError(null);
  };

  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setValidationError('ক্যাটাগরির নাম খালি হতে পারে না।');
      return;
    }

    // Check duplicate
    const exists = categories.some(
      (c) => c.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setValidationError(`"${trimmed}" নামে একটি ক্যাটাগরি ইতিমধ্যে তালিকায় রয়েছে।`);
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);
    try {
      await onAddCategory(trimmed);
      setNewCategoryName('');
      setIsAdding(false);
    } catch (err: any) {
      setValidationError(err?.message || 'ক্যাটাগরি সংরক্ষণ ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Category
  const handleStartEdit = (category: ExpenseCategory) => {
    setEditingId(category.id);
    setEditName(category.name);
    setIsAdding(false);
    setValidationError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setValidationError(null);
  };

  const handleSaveEdit = async (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setValidationError('ক্যাটাগরির নাম খালি হতে পারে না।');
      return;
    }

    // Check duplicate against other categories
    const exists = categories.some(
      (c) => c.id !== id && c.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setValidationError(`"${trimmed}" নামে অন্য একটি ক্যাটাগরি ইতিমধ্যে বিদ্যমান রয়েছে।`);
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);
    try {
      await onUpdateCategory(id, trimmed);
      setEditingId(null);
      setEditName('');
    } catch (err: any) {
      setValidationError(err?.message || 'ক্যাটাগরি হালনাগাদ ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Deactivate Confirm
  const handleConfirmDeactivate = async () => {
    if (!deactivatingCategory) return;
    try {
      await onToggleActive(deactivatingCategory.id, false);
      setDeactivatingCategory(null);
    } catch (err: any) {
      setValidationError(err?.message || 'নিষ্ক্রিয়করণ ব্যর্থ হয়েছে।');
    }
  };

  // Handle Activate directly
  const handleActivate = async (category: ExpenseCategory) => {
    try {
      await onToggleActive(category.id, true);
    } catch (err: any) {
      setValidationError(err?.message || 'সক্রিয়করণ ব্যর্থ হয়েছে।');
    }
  };

  const sqlSnippet = `-- খরচের ক্যাটাগরি টেবিল (Supabase SQL Editor-এ চালান)
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read on expense_categories"
  ON public.expense_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow public read-only on expense_categories"
  ON public.expense_categories FOR SELECT TO anon USING (true);

CREATE POLICY "Allow admin insert on expense_categories"
  ON public.expense_categories FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Allow admin update on expense_categories"
  ON public.expense_categories FOR UPDATE TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Allow admin delete on expense_categories"
  ON public.expense_categories FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSnippet);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div className={`space-y-4 ${isModal ? '' : 'bg-white rounded-xl border border-stone-200/90 p-4 sm:p-5 shadow-xs'}`}>
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
            <Tags className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
              খরচের ক্যাটাগরি
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-semibold border border-stone-200">
                {toBengaliNumber(categories.length)} টি
              </span>
            </h3>
            <p className="text-xs text-stone-500">
              খরচ লিপিবদ্ধ করার সময় ব্যবহারের জন্য ক্যাটাগরি নিয়ন্ত্রণ করুন
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isAdding && (
            <button
              type="button"
              onClick={handleStartAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ নতুন ক্যাটাগরি</span>
            </button>
          )}
        </div>
      </div>

      {/* Validation Error Message */}
      {validationError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{validationError}</div>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            className="text-stone-400 hover:text-stone-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Add New Category Card / Form */}
      {isAdding && (
        <form
          onSubmit={handleSaveNew}
          className="p-3.5 sm:p-4 bg-rose-50/60 border border-rose-200 rounded-xl space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-rose-700" />
              নতুন খরচের ক্যাটাগরি যোগ করুন
            </h4>
            <button
              type="button"
              onClick={handleCancelAdd}
              className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              ক্যাটাগরির নাম <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={newCategoryName}
              onChange={(e) => {
                setNewCategoryName(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="উদাঃ খাবার, মাইক ও সাউন্ড, স্টেজ, যাতায়াত, বিদ্যুৎ..."
              className="w-full h-10 px-3 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:ring-2 focus:ring-rose-600 focus:border-transparent"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              স্পষ্ট ও সংক্ষিপ্ত নাম দিন। এই ক্যাটাগরিটি অবিলম্বে খরচের ফর্মে নির্বাচনযোগ্য হবে।
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleCancelAdd}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 text-xs font-medium text-stone-600 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg cursor-pointer transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newCategoryName.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 disabled:opacity-50 rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              {isSubmitting ? (
                <span>সংরক্ষণ হচ্ছে...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>+ নতুন ক্যাটাগরি সংরক্ষণ</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Categories List or Empty State */}
      {categories.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-stone-200 rounded-xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <Tags className="w-6 h-6 stroke-1.5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-stone-800">
              কোনো খরচের ক্যাটাগরি যোগ করা হয়নি
            </h4>
            <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
              সংগঠনের যাবতীয় খরচের হিসাব সুবিন্যস্ত করতে নতুন ক্যাটাগরি যোগ করুন (যেমন: খাবার, মাইক ও সাউন্ড, স্টেজ, যাতায়াত, বিদ্যুৎ, ভাড়া ইত্যাদি)।
            </p>
          </div>
          {!isAdding && (
            <button
              type="button"
              onClick={handleStartAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ নতুন ক্যাটাগরি যোগ করুন</span>
            </button>
          )}

          {/* Database helper trigger if needed */}
          <div className="pt-3 border-t border-stone-100 mt-4">
            <button
              type="button"
              onClick={() => setShowSqlGuide(!showSqlGuide)}
              className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-700 font-medium cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
              <span>সুপাবেস ডাটাবেস টেবিল সংক্রান্ত তথ্য ও SQL স্ক্রিপ্ট</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-1 divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden bg-white">
            {categories.map((cat) => {
              const isEditing = editingId === cat.id;
              const usageCount = categoryUsageMap.get(cat.name.trim()) || 0;

              return (
                <div
                  key={cat.id}
                  className={`p-3.5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    !cat.isActive ? 'bg-stone-50/70 text-stone-500' : 'hover:bg-stone-50/40'
                  }`}
                >
                  {/* Category Info or Inline Edit */}
                  {isEditing ? (
                    <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        autoFocus
                        onChange={(e) => {
                          setEditName(e.target.value);
                          if (validationError) setValidationError(null);
                        }}
                        className="flex-1 h-9 px-3 bg-white border border-rose-300 rounded-lg text-xs font-medium text-stone-900 focus:ring-2 focus:ring-rose-600"
                      />
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cat.id)}
                          disabled={isSubmitting || !editName.trim()}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg cursor-pointer transition-colors"
                        >
                          সংরক্ষণ
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={isSubmitting}
                          className="px-2.5 py-1.5 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer transition-colors"
                        >
                          বাতিল
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          cat.isActive ? 'bg-emerald-500' : 'bg-stone-300'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-semibold text-xs sm:text-sm truncate ${
                              cat.isActive ? 'text-stone-900' : 'text-stone-500 line-through'
                            }`}
                          >
                            {cat.name}
                          </span>

                          {/* Status Badge */}
                          {cat.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              সক্রিয়
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-stone-100 text-stone-600 border border-stone-200 rounded-md">
                              <XCircle className="w-3 h-3 text-stone-400" />
                              নিষ্ক্রিয়
                            </span>
                          )}
                        </div>

                        {/* Usage meta */}
                        <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-2">
                          <span>
                            খরচে ব্যবহৃত:{' '}
                            <strong className="text-stone-700">
                              {toBengaliNumber(usageCount)}
                            </strong>{' '}
                            বার
                          </span>
                          {!cat.isActive && (
                            <span className="text-rose-600 font-medium">
                              (নতুন খরচে নির্বাচনযোগ্য নয়)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions Buttons */}
                  {!isEditing && (
                    <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 pt-1 sm:pt-0">
                      {/* সম্পাদনা (Edit) */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors cursor-pointer"
                        title="ক্যাটাগরির নাম পরিবর্তন করুন"
                      >
                        <Edit2 className="w-3 h-3 text-stone-500" />
                        <span>সম্পাদনা</span>
                      </button>

                      {/* সক্রিয় / নিষ্ক্রিয় করুন */}
                      {cat.isActive ? (
                        <button
                          type="button"
                          onClick={() => setDeactivatingCategory(cat)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                          title="এই ক্যাটাগরিটি নিষ্ক্রিয় করুন যাতে নতুন খরচে আর না আসে"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>নিষ্ক্রিয় করুন</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleActivate(cat)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                          title="এই ক্যাটাগরিটি পুনরায় সক্রিয় করুন"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>সক্রিয় করুন</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-stone-50 rounded-lg text-[11px] text-stone-600 flex items-start gap-2 border border-stone-200/80">
            <Info className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <div>
              <strong>নীতিমালা:</strong> কোনো ক্যাটাগরির অধীনে খরচের হিসাব থাকলে তা স্থায়ীভাবে মোছা যাবে না; কেবল <strong>&quot;নিষ্ক্রিয় করুন&quot;</strong> করা যাবে। নিষ্ক্রিয় করা হলে পূর্ববর্তী সকল খরচের হিসাব অবিকল থাকবে, কিন্তু নতুন কোনো খরচে সেই খাতটি আর প্রদর্শিত হবে না।
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Supabase SQL schema copy box */}
      {showSqlGuide && (
        <div className="p-4 bg-stone-900 text-stone-200 rounded-xl space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-stone-100 flex items-center gap-1.5">
              <span>সুপাবেস SQL স্ক্রিপ্ট (Supabase SQL Editor)</span>
            </div>
            <button
              type="button"
              onClick={handleCopySql}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-emerald-400 border border-stone-700 rounded-md cursor-pointer transition-colors"
            >
              {isCopied ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>কপি হয়েছে</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>SQL কপি করুন</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3 bg-black/50 rounded-lg overflow-x-auto text-[11px] font-mono text-emerald-300/90 leading-relaxed max-h-48">
            {sqlSnippet}
          </pre>
          <p className="text-[11px] text-stone-400">
            ক্যাটাগরি টেবিল সক্রিয় করতে এই স্ক্রিপ্টটি Supabase ড্যাশবোর্ডের SQL Editor-এ রান করুন।
          </p>
        </div>
      )}

      {/* Confirmation Dialog for Deactivating */}
      {deactivatingCategory && (
        <ConfirmDialog
          isOpen={Boolean(deactivatingCategory)}
          onClose={() => setDeactivatingCategory(null)}
          onConfirm={handleConfirmDeactivate}
          title="ক্যাটাগরি নিষ্ক্রিয়করণ নিশ্চিত করুন"
          message={`আপনি কি "${deactivatingCategory.name}" ক্যাটাগরিটি নিষ্ক্রিয় করতে চান? নিষ্ক্রিয় করার পর নতুন কোনো খরচে এই ক্যাটাগরিটি নির্বাচন করা যাবে না, তবে পূর্বের খরচের রেকর্ডে এটি বহাল থাকবে।`}
          confirmText="নিষ্ক্রিয় করুন"
          cancelText="বাতিল"
          isDestructive={true}
        />
      )}
    </div>
  );
};

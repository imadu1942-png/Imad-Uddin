import React from 'react';
import {
  UserRole,
  UserProfile,
  Member,
  Mahfil,
  Donation,
  Expense,
  ExpenseCategory,
  PublicViewSettings,
  DEFAULT_PUBLIC_VIEW_SETTINGS,
  PublicSummary,
} from '../types/database.types';
import {
  Database,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  LogOut,
  User,
  Mail,
  Lock,
} from 'lucide-react';
import { StorageBackupManager } from '../components/settings/StorageBackupManager';
import { ExpenseCategoryManager } from '../components/expenses/ExpenseCategoryManager';
import { PublicViewThemeManager } from '../components/settings/PublicViewThemeManager';

interface SettingsPageProps {
  currentRole: UserRole;
  currentUser: UserProfile | null;
  onSignOut: () => void;
  isDatabaseConfigured: boolean;
  members: Member[];
  mahfils: Mahfil[];
  donations: Donation[];
  expenses: Expense[];
  onRefreshData: () => Promise<void>;
  categories?: ExpenseCategory[];
  onAddCategory?: (name: string) => Promise<any>;
  onUpdateCategory?: (id: string, name: string) => Promise<any>;
  onToggleCategoryActive?: (id: string, isActive: boolean) => Promise<any>;
  publicViewSettings?: PublicViewSettings;
  isLoadingPublicViewSettings?: boolean;
  onSavePublicViewSettings?: (settings: PublicViewSettings) => Promise<boolean>;
  publicSummary?: PublicSummary | null;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentRole,
  currentUser,
  onSignOut,
  isDatabaseConfigured,
  members,
  mahfils,
  donations,
  expenses,
  onRefreshData,
  categories = [],
  onAddCategory,
  onUpdateCategory,
  onToggleCategoryActive,
  publicViewSettings = DEFAULT_PUBLIC_VIEW_SETTINGS,
  isLoadingPublicViewSettings = false,
  onSavePublicViewSettings,
  publicSummary,
}) => {
  const roleLabels: Record<UserRole, { title: string; desc: string; badge: string }> = {
    admin: {
      title: 'প্রধান অ্যাডমিন (Admin)',
      desc: 'সংগঠনের যাবতীয় রেকর্ড তৈরি, সম্পাদন, ব্যাকআপ রিস্টোর ও স্থায়ীভাবে মুছে ফেলার পূর্ণ ক্ষমতা।',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    cashier: {
      title: 'ক্যাশিয়ার (Cashier)',
      desc: 'হাদিয়া গ্রহণ, খরচ লিপিবদ্ধকরণ, মাহফিল পরিচালনা, সদস্য নিবন্ধন ও ব্যাকআপ ডাউনলোড করতে পারেন। রিস্টোর বা ডিলিটের অনুমতি নেই।',
      badge: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    viewer: {
      title: 'নিরীক্ষক / পরিদর্শক (Viewer)',
      desc: 'শুধুমাত্র হিসাব ও রিপোর্ট প্রদর্শনের রিড-অনলি অনুমতি। আর্থিক তথ্যে কোনো সংযোজন বা পরিবর্তন করতে পারেন না।',
      badge: 'bg-stone-100 text-stone-700 border-stone-300',
    },
  };

  const roleInfo = roleLabels[currentRole] || roleLabels.viewer;

  const permissions = [
    {
      action: 'হাদিয়া ও দান তথ্য যোগ/এন্ট্রি',
      allowed: currentRole === 'admin' || currentRole === 'cashier',
    },
    {
      action: 'হাদিয়া ও দান তথ্য সম্পাদন (Edit)',
      allowed: currentRole === 'admin' || currentRole === 'cashier',
    },
    {
      action: 'খরচ লিপিবদ্ধকরণ ও এন্ট্রি',
      allowed: currentRole === 'admin' || currentRole === 'cashier',
    },
    {
      action: 'খরচ তথ্য সম্পাদন (Edit)',
      allowed: currentRole === 'admin' || currentRole === 'cashier',
    },
    {
      action: 'মাহফিল তৈরি ও সম্পাদন',
      allowed: currentRole === 'admin' || currentRole === 'cashier',
    },
    {
      action: 'সদস্য নিবন্ধন ও তথ্য হালনাগাদ',
      allowed: currentRole === 'admin' || currentRole === 'cashier',
    },
    {
      action: 'হিসাব ও পূর্ণ ব্যাকআপ ডাউনলোড (Backup Download & CSV)',
      allowed: currentRole === 'admin' || currentRole === 'cashier',
    },
    {
      action: 'ব্যাকআপ ফাইল রিস্টোর (Restore Backup Data)',
      allowed: currentRole === 'admin',
    },
    {
      action: 'হিসাব বা লেনদেন স্থায়ীভাবে মুছে ফেলা (Delete Permanently)',
      allowed: currentRole === 'admin',
    },
    {
      action: 'খরচের ক্যাটাগরি তৈরি, সম্পাদন ও নিয়ন্ত্রণ (Expense Categories)',
      allowed: currentRole === 'admin',
    },
    {
      action: 'পাবলিক ভিউ ডিজাইন ও থিম কনফিগারেশন (Public Theme)',
      allowed: currentRole === 'admin',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
          সেটিংস ও ডেটা ব্যবস্থাপনা
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
          আপনার অ্যাকাউন্ট, ডেটা ব্যবহার, ক্লাউড ব্যাকআপ এবং অনুমতি সংক্রান্ত বিবরণ
        </p>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900">
                {currentUser?.fullName || 'দায়িত্বপ্রাপ্ত সদস্য'}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                <span>{currentUser?.email || 'email@example.com'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${roleInfo.badge}`}>
              {roleInfo.title}
            </span>
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>লগআউট</span>
            </button>
          </div>
        </div>

        <div className="p-3.5 bg-stone-50 rounded-lg text-xs sm:text-sm text-stone-700 space-y-1">
          <span className="font-semibold text-stone-900">ভূমিকার বিবরণ:</span>
          <p className="text-xs text-stone-600 leading-relaxed">{roleInfo.desc}</p>
        </div>
      </div>

      {/* Storage Usage & Backup/Restore Manager: Visible only to Admin & Cashier */}
      {(currentRole === 'admin' || currentRole === 'cashier') && (
        <StorageBackupManager
          currentRole={currentRole}
          members={members}
          mahfils={mahfils}
          donations={donations}
          expenses={expenses}
          onRefreshData={onRefreshData}
        />
      )}

      {/* Admin Only: Expense Category Management Section */}
      {currentRole === 'admin' && onAddCategory && onUpdateCategory && onToggleCategoryActive && (
        <ExpenseCategoryManager
          currentRole={currentRole}
          categories={categories || []}
          expenses={expenses}
          onAddCategory={onAddCategory}
          onUpdateCategory={onUpdateCategory}
          onToggleActive={onToggleCategoryActive}
        />
      )}

      {/* Admin Only: Public View Design & Theme Manager */}
      {currentRole === 'admin' && onSavePublicViewSettings && (
        <PublicViewThemeManager
          currentSettings={publicViewSettings}
          isLoading={isLoadingPublicViewSettings}
          onSave={onSavePublicViewSettings}
          publicSummary={publicSummary}
        />
      )}

      {/* Permissions Breakdown Matrix */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-5 space-y-4">
        <div>
          <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            আপনার বর্তমান পারমিশন ও ক্ষমতার তালিকা (Role Level Security)
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            সুপাবেসের Row Level Security (RLS) নিয়ম অনুযায়ী আপনার অ্যাক্সেস নিয়ন্ত্রিত:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {permissions.map((p, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border flex items-center justify-between text-xs sm:text-sm ${
                p.allowed
                  ? 'bg-emerald-50/50 border-emerald-200 text-stone-900'
                  : 'bg-stone-50 border-stone-200 text-stone-400'
              }`}
            >
              <span className="font-medium">{p.action}</span>
              {p.allowed ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> অনুমোদিত
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-400 shrink-0">
                  <XCircle className="w-4 h-4 text-stone-300" /> সংরক্ষিত
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cloud Database Connection Status */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
          <div>
            <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-700" />
              সুপাবেস (Supabase PostgreSQL) ডাটাবেস স্ট্যাটাস
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              স্থায়ী ও সুরক্ষিত ক্লাউড স্টোরেজের বর্তমান সংযোগ অবস্থা
            </p>
          </div>

          <div
            className={`px-3 py-1 rounded-lg text-xs font-semibold self-start sm:self-auto ${
              isDatabaseConfigured
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            {isDatabaseConfigured ? '✓ ক্লাউড ডাটাবেস সক্রিয় ও সংযুক্ত' : 'সংযোগ ত্রুটি'}
          </div>
        </div>

        <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs sm:text-sm text-stone-700 space-y-2 leading-relaxed">
          <p className="font-semibold text-emerald-950 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-700" />
            ডাটাবেস সুরক্ষা নীতিমালা:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-stone-600">
            <li>
              সকল হাদিয়া, মাহফিল, খরচ ও সদস্য ডাটা সরাসরি Supabase PostgreSQL ডাটাবেসে রিয়েল-টাইমে সংরক্ষিত হচ্ছে।
            </li>
            <li>
              কোনো ব্রাউজার লোকাল স্টোরেজ (localStorage/IndexedDB) ব্যবহার করা হয়নি।
            </li>
            <li>
              Row Level Security (RLS) পলিসির মাধ্যমে অনুমোদিত ব্যবহারকারী ব্যতীত অন্য কেউ ডাটা মুছতে পারে না।
            </li>
            <li>
              মোবাইল ও কম্পিউটার উভয় ডিভাইস থেকেই নিরবচ্ছিন্নভাবে আর্থিক হিসাব পরিচালনা করা সম্ভব।
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

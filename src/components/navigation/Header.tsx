import React, { useState } from 'react';
import { Plus, HeartHandshake, Receipt, CalendarPlus, UserPlus, Database, CloudOff, LogOut, User as UserIcon, Shield } from 'lucide-react';
import { UserRole, UserProfile } from '../../types/database.types';

interface HeaderProps {
  onAddDonation: () => void;
  onAddExpense: () => void;
  onAddMahfil: () => void;
  onAddMember: () => void;
  userRole: UserRole;
  currentUser: UserProfile | null;
  guestName?: string;
  onOpenAdminLogin?: () => void;
  onExitGuest?: () => void;
  onSignOut: () => void;
  isDatabaseConfigured: boolean;
  canEdit: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onAddDonation,
  onAddExpense,
  onAddMahfil,
  onAddMember,
  userRole,
  currentUser,
  guestName,
  onOpenAdminLogin,
  onExitGuest,
  onSignOut,
  isDatabaseConfigured,
  canEdit,
}) => {
  const [isQuickOpen, setIsQuickOpen] = useState(false);

  const roleLabels: Record<UserRole, { label: string; badgeClass: string }> = {
    admin: { label: 'প্রধান অ্যাডমিন', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    cashier: { label: 'ক্যাশিয়ার', badgeClass: 'bg-blue-100 text-blue-800 border-blue-300' },
    viewer: { label: 'রিড-অনলি দর্শন', badgeClass: 'bg-stone-200 text-stone-700 border-stone-300' },
  };

  const currentRoleInfo = currentUser ? (roleLabels[userRole] || roleLabels.viewer) : {
    label: 'পাবলিক ভিউ',
    badgeClass: 'bg-stone-100 text-stone-700 border-stone-300',
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
        {/* Organization Brand & Title */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-xl font-bold text-stone-900 tracking-tight truncate">
              আশেকানে গাউছিয়া
            </h1>
            <span className={`inline-block px-2 py-0.5 text-[11px] sm:text-xs font-semibold rounded-md border ${currentRoleInfo.badgeClass}`}>
              {currentRoleInfo.label}
            </span>
          </div>
          <p className="text-xs text-stone-500 truncate hidden sm:block mt-0.5">
            হাদিয়া, মাহফিল ও আয়-ব্যয়ের হিসাব
          </p>
        </div>

        {/* Right side controls: User profile, Quick Action & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Database indicator */}
          <div
            title={
              isDatabaseConfigured
                ? 'সুপাবেস ক্লাউড ডাটাবেস সচল'
                : 'ডাটাবেস কানেক্ট করা হয়নি'
            }
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
              isDatabaseConfigured
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {isDatabaseConfigured ? (
              <Database className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <CloudOff className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>{isDatabaseConfigured ? 'সুপাবেস সচল' : 'সংযোগহীন'}</span>
          </div>

          {/* User Welcome info */}
          {currentUser ? (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-stone-700 bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200">
              <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold max-w-[130px] truncate">{currentUser.fullName}</span>
            </div>
          ) : guestName ? (
            <div className="flex items-center gap-1 text-xs text-emerald-900 bg-emerald-50/80 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-emerald-200 font-medium">
              <span>স্বাগতম,</span>
              <strong className="max-w-[120px] truncate text-emerald-800">{guestName}</strong>
            </div>
          ) : null}

          {/* Quick Action Dropdown for Admin/Cashier */}
          {canEdit && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsQuickOpen(!isQuickOpen)}
                className="inline-flex items-center justify-center gap-1.5 h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-98 rounded-lg shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন ভুক্তি</span>
              </button>

              {isQuickOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsQuickOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setIsQuickOpen(false);
                        onAddDonation();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs sm:text-sm text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors cursor-pointer text-left"
                    >
                      <HeartHandshake className="w-4 h-4 text-emerald-700" />
                      <span>হাদিয়া / দান যোগ করুন</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsQuickOpen(false);
                        onAddExpense();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs sm:text-sm text-stone-700 hover:bg-rose-50 hover:text-rose-900 transition-colors cursor-pointer text-left"
                    >
                      <Receipt className="w-4 h-4 text-rose-700" />
                      <span>খরচ লিপিবদ্ধ করুন</span>
                    </button>

                    <div className="my-1 border-t border-stone-100" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsQuickOpen(false);
                        onAddMahfil();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs sm:text-sm text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer text-left"
                    >
                      <CalendarPlus className="w-4 h-4 text-stone-500" />
                      <span>নতুন মাহফিল তৈরি</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsQuickOpen(false);
                        onAddMember();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs sm:text-sm text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer text-left"
                    >
                      <UserPlus className="w-4 h-4 text-stone-500" />
                      <span>নতুন সদস্য নিবন্ধন</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* If Guest: Show Admin Login Button & Exit Button */}
          {!currentUser && onOpenAdminLogin && (
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-2.5 sm:px-3 text-xs sm:text-sm font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer border border-emerald-200"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden xs:inline">অ্যাডমিন / ক্যাশিয়ার</span>
              <span>লগইন</span>
            </button>
          )}

          {!currentUser && onExitGuest && (
            <button
              type="button"
              onClick={onExitGuest}
              title="প্রস্থান করুন"
              className="inline-flex items-center gap-1 h-9 sm:h-10 px-2 sm:px-2.5 text-xs font-medium text-stone-600 hover:text-rose-700 bg-stone-100 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-stone-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">প্রস্থান</span>
            </button>
          )}

          {/* If Authenticated: Show Logout Button */}
          {currentUser && (
            <button
              type="button"
              onClick={onSignOut}
              title="লগআউট করুন"
              className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-2.5 sm:px-3 text-xs sm:text-sm font-medium text-stone-600 hover:text-rose-700 bg-stone-100 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-stone-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">লগআউট</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

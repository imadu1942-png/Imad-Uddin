import React, { useState } from 'react';
import { useFinancialData } from './hooks/useFinancialData';
import { useAuth } from './hooks/useAuth';
import { Sidebar, NavItemKey } from './components/navigation/Sidebar';
import { Header } from './components/navigation/Header';
import { MobileBottomNav } from './components/navigation/MobileBottomNav';
import { MobileMenuDrawer } from './components/navigation/MobileMenuDrawer';
import { NotificationToast } from './components/common/NotificationToast';
import { ConfirmDialog } from './components/common/ConfirmDialog';

// Modals
import { DonationFormModal } from './components/donations/DonationFormModal';
import { DonationDetailModal } from './components/donations/DonationDetailModal';
import { ExpenseFormModal } from './components/expenses/ExpenseFormModal';
import { ExpenseDetailModal } from './components/expenses/ExpenseDetailModal';
import { MahfilFormModal } from './components/mahfil/MahfilFormModal';
import { MahfilDetailModal } from './components/mahfil/MahfilDetailModal';
import { MemberFormModal } from './components/members/MemberFormModal';

// Pages
import { SplashScreen } from './components/common/SplashScreen';
import { PublicEntryPage } from './pages/PublicEntryPage';
import { PublicDashboardPage } from './pages/PublicDashboardPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DonationsPage } from './pages/DonationsPage';
import { MahfilPage } from './pages/MahfilPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { MonthlyAccountsPage } from './pages/MonthlyAccountsPage';
import { YearlyAccountsPage } from './pages/YearlyAccountsPage';
import { ReportsPage } from './pages/ReportsPage';
import { MembersPage } from './pages/MembersPage';
import { SettingsPage } from './pages/SettingsPage';

// Types
import { Donation, Expense, Mahfil, Member, UserRole } from './types/database.types';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavItemKey>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Guest name state (UI-only welcome, no DB auth or modification)
  const [guestName, setGuestName] = useState<string>(() => {
    try {
      return sessionStorage.getItem('guest_name') || '';
    } catch {
      return '';
    }
  });
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [isSplashComplete, setIsSplashComplete] = useState<boolean>(false);

  // Authentication & Roles
  const {
    user,
    role,
    isLoading: isAuthLoading,
    authError,
    signIn,
    signOut,
    canEdit: authCanEdit,
    canDelete: authCanDelete,
  } = useAuth();

  // Access rights
  const isAuthenticated = Boolean(user);
  const isPublicGuest = !isAuthenticated && Boolean(guestName);
  const effectiveRole: UserRole = isAuthenticated ? role : 'viewer';
  const canEdit = isAuthenticated ? authCanEdit : false;
  const canDelete = isAuthenticated ? authCanDelete : false;

  // Financial data state
  const {
    donations,
    expenses,
    mahfils,
    members,
    dashboardStats,
    isLoading: isDataLoading,
    error: dataError,
    notification,
    clearNotification,
    refreshAll,
    addDonation,
    updateDonation,
    deleteDonation,
    addExpense,
    updateExpense,
    deleteExpense,
    addMahfil,
    updateMahfil,
    deleteMahfil,
    addMember,
    updateMember,
    deleteMember,
    isDatabaseConfigured,
  } = useFinancialData({ isAuthLoading, userId: user?.id, isPublicGuest });

  // Donation Modals State
  const [isDonationFormOpen, setIsDonationFormOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [viewingDonation, setViewingDonation] = useState<Donation | null>(null);

  // Expense Modals State
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);

  // Mahfil Modals State
  const [isMahfilFormOpen, setIsMahfilFormOpen] = useState(false);
  const [editingMahfil, setEditingMahfil] = useState<Mahfil | null>(null);
  const [viewingMahfil, setViewingMahfil] = useState<Mahfil | null>(null);

  // Member Modals State
  const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Deletion Confirmation Dialog State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Action handlers (Guarded for Authenticated Admin / Cashier only)
  const handleOpenAddDonation = () => {
    if (!canEdit) return;
    setEditingDonation(null);
    setIsDonationFormOpen(true);
  };

  const handleOpenAddExpense = () => {
    if (!canEdit) return;
    setEditingExpense(null);
    setIsExpenseFormOpen(true);
  };

  const handleOpenAddMahfil = () => {
    if (!canEdit) return;
    setEditingMahfil(null);
    setIsMahfilFormOpen(true);
  };

  const handleOpenAddMember = () => {
    if (!canEdit) return;
    setEditingMember(null);
    setIsMemberFormOpen(true);
  };

  // Safe delete confirmations (Admin Only)
  const confirmDeleteDonation = (id: string, name: string) => {
    if (!canDelete) return;
    setDeleteConfirmation({
      isOpen: true,
      title: 'হাদিয়া রেকর্ড মুছে ফেলা',
      message: `আপনি কি নিশ্চিত যে "${name}"-এর হাদিয়ার রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান? এটি মুছে ফেললে আর্থিক হিসাবে পরিবর্তন ঘটবে।`,
      onConfirm: () => deleteDonation(id),
    });
  };

  const confirmDeleteExpense = (id: string, title: string) => {
    if (!canDelete) return;
    setDeleteConfirmation({
      isOpen: true,
      title: 'খরচ রেকর্ড মুছে ফেলা',
      message: `আপনি কি নিশ্চিত যে "${title}" খরচের হিসাবটি মুছে ফেলতে চান? এটি বাতিল করলে ব্যালেন্স স্বয়ংক্রিয়ভাবে পরিবর্তিত হবে।`,
      onConfirm: () => deleteExpense(id),
    });
  };

  const confirmDeleteMahfil = (id: string, name: string) => {
    if (!canDelete) return;
    setDeleteConfirmation({
      isOpen: true,
      title: 'মাহফিল রেকর্ড মুছে ফেলা',
      message: `আপনি কি নিশ্চিত যে "${name}" মাহফিলের রেকর্ডটি মুছে ফেলতে চান?`,
      onConfirm: () => deleteMahfil(id),
    });
  };

  const confirmDeleteMember = (id: string, name: string) => {
    if (!canDelete) return;
    setDeleteConfirmation({
      isOpen: true,
      title: 'সদস্য রেকর্ড মুছে ফেলা',
      message: `আপনি কি নিশ্চিত যে সদস্য "${name}"-কে তালিকা থেকে মুছে ফেলতে চান?`,
      onConfirm: () => deleteMember(id),
    });
  };

  // Quick donate for member
  const handleRecordDonationForMember = (member: Member) => {
    if (!canEdit) return;
    setEditingDonation({
      id: '',
      donorName: member.name,
      memberId: member.id,
      phone: member.phone || member.mobileNumber,
      mobileNumber: member.phone || member.mobileNumber,
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      donationDate: new Date().toISOString().split('T')[0],
      category: 'সাধারণ দান',
      purpose: 'সাধারণ দান',
      paymentMethod: 'cash',
      createdBy: user?.fullName || 'ক্যাশিয়ার',
      createdAt: new Date().toISOString(),
    });
    setIsDonationFormOpen(true);
  };

  const handleEnterAsGuest = (name: string) => {
    const trimmed = name?.trim() || 'সম্মানিত অতিথি';
    setGuestName(trimmed);
    try {
      sessionStorage.setItem('guest_name', trimmed);
    } catch {}
    setActiveTab('dashboard');
  };

  const handleExitGuest = () => {
    setGuestName('');
    try {
      sessionStorage.removeItem('guest_name');
    } catch {}
    setActiveTab('dashboard');
  };

  const handleAdminSignIn = async (email: string, pass: string) => {
    await signIn(email, pass);
    setShowAdminLogin(false);
    setGuestName('');
    try {
      sessionStorage.removeItem('guest_name');
    } catch {}
    await refreshAll();
  };

  const handleSignOut = async () => {
    await signOut();
    setShowAdminLogin(false);
    setGuestName('');
    try {
      sessionStorage.removeItem('guest_name');
    } catch {}
    setActiveTab('dashboard');
  };

  // 0. Initial Full-Screen Splash Screen with Official Logo & Progress (0% to 100%)
  if (!isSplashComplete) {
    return (
      <SplashScreen
        onComplete={() => setIsSplashComplete(true)}
        durationMs={4200}
      />
    );
  }

  // 1. Initial Authentication Loading State
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs sm:text-sm text-stone-300 font-medium">
            হিসাব লোড হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Entry Flows:
  // If user is not logged in and hasn't entered a guest name yet
  if (!isAuthenticated && !guestName) {
    if (showAdminLogin) {
      return (
        <LoginPage
          onSignIn={handleAdminSignIn}
          onBack={() => setShowAdminLogin(false)}
          isLoading={isAuthLoading}
          authError={authError}
        />
      );
    }

    return (
      <PublicEntryPage
        onEnterAsGuest={handleEnterAsGuest}
        onOpenAdminLogin={() => setShowAdminLogin(true)}
      />
    );
  }

  // 3. Authenticated or Public Guest Dashboard
  return (
    <div className="min-h-screen bg-stone-50 flex text-stone-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDatabaseConfigured={isDatabaseConfigured}
        isPublicGuest={isPublicGuest}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Header */}
        <Header
          onAddDonation={handleOpenAddDonation}
          onAddExpense={handleOpenAddExpense}
          onAddMahfil={handleOpenAddMahfil}
          onAddMember={handleOpenAddMember}
          userRole={effectiveRole}
          currentUser={user}
          guestName={guestName}
          onOpenAdminLogin={() => setShowAdminLogin(true)}
          onExitGuest={handleExitGuest}
          onSignOut={handleSignOut}
          isDatabaseConfigured={isDatabaseConfigured}
          canEdit={canEdit}
        />

        {/* Content Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {isPublicGuest ? (
            <PublicDashboardPage guestName={guestName} />
          ) : isDataLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
              <div className="w-10 h-10 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-stone-700 font-semibold">
                হিসাব লোড হচ্ছে...
              </p>
              <p className="text-xs text-stone-500">
                সুপাবেস ডাটাবেস থেকে সর্বশেষ আর্থিক তথ্য সংগ্রহ করা হচ্ছে
              </p>
            </div>
          ) : dataError ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xl">
                !
              </div>
              <h3 className="text-base font-bold text-stone-900">
                হিসাব লোড করা যাচ্ছে না। আবার চেষ্টা করুন।
              </h3>
              <p className="text-xs text-rose-600 max-w-md">
                {dataError}
              </p>
              <button
                type="button"
                onClick={refreshAll}
                className="mt-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                আবার চেষ্টা করুন
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardPage
                  stats={dashboardStats}
                  donations={donations}
                  expenses={expenses}
                  mahfils={mahfils}
                  onNavigate={setActiveTab}
                  onAddDonation={handleOpenAddDonation}
                  onAddExpense={handleOpenAddExpense}
                  onAddMahfil={handleOpenAddMahfil}
                  onSelectMahfil={(m) => setViewingMahfil(m)}
                  canEdit={canEdit}
                  isLoading={isDataLoading}
                  error={dataError}
                  onRetry={refreshAll}
                />
              )}

              {activeTab === 'donations' && (
                <DonationsPage
                  donations={donations}
                  mahfils={mahfils}
                  onAddDonation={handleOpenAddDonation}
                  onEditDonation={(d) => {
                    if (!canEdit) return;
                    setEditingDonation(d);
                    setIsDonationFormOpen(true);
                  }}
                  onDeleteDonation={confirmDeleteDonation}
                  onViewDonation={(d) => setViewingDonation(d)}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  isPublicGuest={isPublicGuest}
                />
              )}

              {activeTab === 'mahfil' && (
                <MahfilPage
                  mahfils={mahfils}
                  donations={donations}
                  expenses={expenses}
                  onAddMahfil={handleOpenAddMahfil}
                  onEditMahfil={(m) => {
                    if (!canEdit) return;
                    setEditingMahfil(m);
                    setIsMahfilFormOpen(true);
                  }}
                  onDeleteMahfil={confirmDeleteMahfil}
                  onSelectMahfil={(m) => setViewingMahfil(m)}
                  canEdit={canEdit}
                  canDelete={canDelete}
                />
              )}

              {activeTab === 'expenses' && (
                <ExpensesPage
                  expenses={expenses}
                  mahfils={mahfils}
                  onAddExpense={handleOpenAddExpense}
                  onEditExpense={(e) => {
                    if (!canEdit) return;
                    setEditingExpense(e);
                    setIsExpenseFormOpen(true);
                  }}
                  onDeleteExpense={confirmDeleteExpense}
                  onViewExpense={(e) => setViewingExpense(e)}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  isPublicGuest={isPublicGuest}
                />
              )}

              {activeTab === 'monthly' && (
                <MonthlyAccountsPage
                  donations={donations}
                  expenses={expenses}
                  mahfils={mahfils}
                />
              )}

              {activeTab === 'yearly' && (
                <YearlyAccountsPage
                  donations={donations}
                  expenses={expenses}
                  mahfils={mahfils}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsPage
                  donations={donations}
                  expenses={expenses}
                  mahfils={mahfils}
                />
              )}

              {activeTab === 'members' && (
                <MembersPage
                  members={members}
                  donations={donations}
                  onAddMember={handleOpenAddMember}
                  onEditMember={(m) => {
                    if (!canEdit) return;
                    setEditingMember(m);
                    setIsMemberFormOpen(true);
                  }}
                  onDeleteMember={confirmDeleteMember}
                  onRecordDonationForMember={handleRecordDonationForMember}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  isPublicGuest={isPublicGuest}
                />
              )}

              {activeTab === 'settings' && !isPublicGuest && (
                <SettingsPage
                  currentRole={effectiveRole}
                  currentUser={user}
                  onSignOut={handleSignOut}
                  isDatabaseConfigured={isDatabaseConfigured}
                  members={members}
                  mahfils={mahfils}
                  donations={donations}
                  expenses={expenses}
                  onRefreshData={refreshAll}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation (Authenticated Admin/Cashier only) */}
      {!isPublicGuest && (
        <MobileBottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenMenu={() => setIsMobileMenuOpen(true)}
        />
      )}

      {/* Mobile Drawer Menu */}
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isPublicGuest={isPublicGuest}
      />

      {/* Admin Login Modal (Accessible from within guest view anytime) */}
      {showAdminLogin && !isAuthenticated && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <LoginPage
            onSignIn={handleAdminSignIn}
            onBack={() => setShowAdminLogin(false)}
            isLoading={isAuthLoading}
            authError={authError}
          />
        </div>
      )}

      {/* Modals & Dialogs (Guarded for Authenticated Admin/Cashier only) */}
      {canEdit && (
        <>
          <DonationFormModal
            isOpen={isDonationFormOpen}
            onClose={() => setIsDonationFormOpen(false)}
            onSubmit={async (data) => {
              if (editingDonation && editingDonation.id) {
                await updateDonation(editingDonation.id, data);
              } else {
                await addDonation(data);
              }
            }}
            initialData={editingDonation}
            members={members}
            mahfils={mahfils}
            currentUserName={user?.fullName || 'ক্যাশিয়ার'}
          />

          <ExpenseFormModal
            isOpen={isExpenseFormOpen}
            onClose={() => setIsExpenseFormOpen(false)}
            onSubmit={async (data) => {
              if (editingExpense && editingExpense.id) {
                await updateExpense(editingExpense.id, data);
              } else {
                await addExpense(data);
              }
            }}
            initialData={editingExpense}
            mahfils={mahfils}
            currentUserName={user?.fullName || 'ক্যাশিয়ার'}
          />

          <MahfilFormModal
            isOpen={isMahfilFormOpen}
            onClose={() => setIsMahfilFormOpen(false)}
            onSubmit={async (data) => {
              if (editingMahfil && editingMahfil.id) {
                await updateMahfil(editingMahfil.id, data);
              } else {
                await addMahfil(data);
              }
            }}
            initialData={editingMahfil}
          />

          <MemberFormModal
            isOpen={isMemberFormOpen}
            onClose={() => setIsMemberFormOpen(false)}
            onSubmit={async (data) => {
              if (editingMember && editingMember.id) {
                await updateMember(editingMember.id, data);
              } else {
                await addMember(data);
              }
            }}
            initialData={editingMember}
          />
        </>
      )}

      <DonationDetailModal
        isOpen={Boolean(viewingDonation)}
        onClose={() => setViewingDonation(null)}
        donation={viewingDonation}
        mahfils={mahfils}
        isPublicGuest={isPublicGuest}
      />

      <ExpenseDetailModal
        isOpen={Boolean(viewingExpense)}
        onClose={() => setViewingExpense(null)}
        expense={viewingExpense}
        mahfils={mahfils}
      />

      <MahfilDetailModal
        isOpen={Boolean(viewingMahfil)}
        onClose={() => setViewingMahfil(null)}
        mahfil={viewingMahfil}
        donations={donations}
        expenses={expenses}
        onAddDonationClick={(mahfilId) => {
          if (!canEdit) return;
          setEditingDonation({
            id: '',
            donorName: '',
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            donationDate: new Date().toISOString().split('T')[0],
            category: 'মাহফিল অনুদান',
            purpose: 'মাহফিল অনুদান',
            mahfilId,
            paymentMethod: 'cash',
            createdBy: user?.fullName || 'ক্যাশিয়ার',
            createdAt: new Date().toISOString(),
          });
          setIsDonationFormOpen(true);
        }}
        onAddExpenseClick={(mahfilId) => {
          if (!canEdit) return;
          setEditingExpense({
            id: '',
            title: '',
            date: new Date().toISOString().split('T')[0],
            expenseDate: new Date().toISOString().split('T')[0],
            category: 'মাহফিল খরচ',
            amount: 0,
            recipient: '',
            paidTo: '',
            mahfilId,
            paymentMethod: 'cash',
            createdBy: user?.fullName || 'ক্যাশিয়ার',
            createdAt: new Date().toISOString(),
          });
          setIsExpenseFormOpen(true);
        }}
      />

      {/* Confirmation Dialog (Admin Only) */}
      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirmation.onConfirm}
        title={deleteConfirmation.title}
        message={deleteConfirmation.message}
      />

      {/* Toast Notification */}
      <NotificationToast
        notification={notification}
        onClose={clearNotification}
      />
    </div>
  );
}

export type UserRole = 'admin' | 'cashier' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank' | 'other';

export interface Member {
  id: string;
  name: string;
  phone?: string;
  mobileNumber?: string; // alias for phone
  address?: string;
  notes?: string;
  isActive?: boolean;
  status: 'active' | 'inactive'; // alias for isActive
  createdAt: string;
  updatedAt?: string;
}

export interface Donation {
  id: string;
  donorName: string;
  memberId?: string | null;
  phone?: string;
  mobileNumber?: string; // alias for phone
  amount: number;
  date: string; // YYYY-MM-DD
  donationDate?: string; // YYYY-MM-DD
  category: string; // alias for purpose
  purpose?: string;
  mahfilId?: string | null;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Expense {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  expenseDate?: string; // YYYY-MM-DD
  category: string;
  description?: string;
  amount: number;
  recipient: string; // alias for paidTo
  paidTo?: string;
  mahfilId?: string | null;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Mahfil {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  eventDate?: string; // YYYY-MM-DD
  location: string;
  description?: string;
  status?: 'upcoming' | 'completed' | 'ongoing';
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DashboardStats {
  todayDonations: number;
  todayExpenses: number;
  currentBalance: number;
  thisMonthDonations: number;
  thisMonthExpenses: number;
  thisMonthBalance: number;
  thisYearDonations: number;
  thisYearExpenses: number;
  thisYearBalance: number;
  recentDonations: Donation[];
  recentExpenses: Expense[];
  recentMahfils: Mahfil[];
}

export interface PublicSummary {
  member_count: number;
  current_month: {
    income: number;
    expense: number;
    balance: number;
  };
  current_year: {
    income: number;
    expense: number;
    balance: number;
  };
  upcoming_mahfils: Array<{
    id: string | number;
    name: string;
    event_date: string;
    location: string;
    description?: string | null;
  }>;
  mahfil_summary: Array<{
    id: string | number;
    name: string;
    event_date: string;
    location: string;
    income: number;
    expense: number;
    balance: number;
  }>;
  yearly_monthly_summary: Array<{
    month: number;
    income: number;
    expense: number;
    balance: number;
  }>;
}

export type PublicThemeId = 'classic' | 'modern_green' | 'elegant' | 'minimal';
export type PublicHeaderStyle = 'gradient' | 'solid' | 'bordered' | 'card';

export interface PublicViewSettings {
  id?: string;
  orgName: string;
  subtitle: string;
  welcomeMessage: string;
  logoUrl?: string;
  themeId: PublicThemeId;
  accentColor: string;
  headerStyle: PublicHeaderStyle;
  footerText: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_PUBLIC_VIEW_SETTINGS: PublicViewSettings = {
  id: 'default',
  orgName: 'আশেকানে গাউছিয়া',
  subtitle: 'হাদিয়া, মাহফিল ও আয়-ব্যয়ের হিসাব',
  welcomeMessage: 'আসসালামু আলাইকুম, আপনাকে স্বাগতম',
  logoUrl: '',
  themeId: 'classic',
  accentColor: '#047857',
  headerStyle: 'gradient',
  footerText: '© আশেকানে গাউছিয়া। সর্বস্বত্ব সংরক্ষিত।',
};

export interface ThemePreset {
  id: PublicThemeId;
  name: string;
  description: string;
  defaultAccent: string;
  badgeBg: string;
  previewGradient: string;
  headerBgClass: string;
  cardBorderClass: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'classic',
    name: 'চিরন্তন ইসলামিক (Classic Islamic)',
    description: 'ঐতিহ্যবাহী গাঢ় পান্না সবুজ ও সোনালী আভার গাম্ভীর্যপূর্ণ ইসলামিক রূপরেখা',
    defaultAccent: '#065f46',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    previewGradient: 'from-emerald-950 via-emerald-900 to-teal-950',
    headerBgClass: 'from-emerald-950 via-emerald-900 to-teal-950',
    cardBorderClass: 'border-emerald-700/40',
  },
  {
    id: 'modern_green',
    name: 'আধুনিক সবুজ (Modern Green)',
    description: 'উজ্জ্বল পান্না সবুজ ও টিল রঙের প্রাঞ্জল ও গতিশীল আধুনিক ইন্টারফেস',
    defaultAccent: '#059669',
    badgeBg: 'bg-teal-100 text-teal-900 border-teal-300',
    previewGradient: 'from-emerald-900 via-teal-800 to-cyan-950',
    headerBgClass: 'from-emerald-900 via-teal-800 to-emerald-950',
    cardBorderClass: 'border-teal-500/30',
  },
  {
    id: 'elegant',
    name: 'অভিজাত রয়্যাল (Elegant)',
    description: 'মর্যাদাপূর্ণ স্লেট, নেভি ও গভীর পান্না রঙের পরিশীলিত সমন্বয়',
    defaultAccent: '#0f766e',
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
    previewGradient: 'from-slate-950 via-stone-900 to-teal-950',
    headerBgClass: 'from-slate-950 via-slate-900 to-stone-900',
    cardBorderClass: 'border-slate-700/60',
  },
  {
    id: 'minimal',
    name: 'মিনিমাল ও পরিচ্ছন্ন (Minimal)',
    description: 'সহজ, পরিচ্ছন্ন, সুষম কনট্রাস্ট ও শান্ত মিনিমালিস্ট রূপরেখা',
    defaultAccent: '#27272a',
    badgeBg: 'bg-stone-200 text-stone-800 border-stone-300',
    previewGradient: 'from-stone-950 via-zinc-900 to-neutral-950',
    headerBgClass: 'from-stone-950 via-zinc-900 to-stone-900',
    cardBorderClass: 'border-stone-700/40',
  },
];

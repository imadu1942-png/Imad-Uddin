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

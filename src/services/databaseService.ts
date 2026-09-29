import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Donation,
  Expense,
  ExpenseCategory,
  Mahfil,
  Member,
  DashboardStats,
  PublicSummary,
  PublicViewSettings,
  DEFAULT_PUBLIC_VIEW_SETTINGS,
  PublicThemeId,
  PublicHeaderStyle,
} from '../types/database.types';

export interface FilterOptions {
  search?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  month?: string; // '01' - '12'
  year?: string;  // '2026'
  category?: string;
  mahfilId?: string;
}

export interface DonationFilterOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  month?: string; // '01' - '12'
  year?: string;  // '2026'
  category?: string;
  mahfilId?: string;
  paymentMethod?: string;
}

export interface ExpenseFilterOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  month?: string;
  year?: string;
  category?: string;
  mahfilId?: string;
  paymentMethod?: string;
}

export interface MahfilFilterOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  year?: string;
  status?: string;
}

export interface MemberFilterOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'all' | 'active' | 'inactive';
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  totalAmount?: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Helper to get authenticated user UUID safely
async function getCurrentUserId(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch {
    return null;
  }
}

let isSupabasePublicViewSettingsAvailable: boolean | null = null;

// Bengali error message translator
export function translateErrorMessage(error: any): string {
  if (!error) return 'একটি অজানা ত্রুটি ঘটেছে';
  const rawMsg = typeof error === 'string'
    ? error
    : [error.message, error.details, error.hint, error.code ? `[কোড: ${error.code}]` : ''].filter(Boolean).join(' | ');
  
  const msg = rawMsg || (typeof error === 'object' ? JSON.stringify(error) : String(error));
  
  if (msg.includes('row-level security') || msg.includes('violates row-level security') || msg.includes('permission denied')) {
    return `অনুমতি ত্রুটি (RLS): আপনার এক্সেস সংরক্ষিত বা পলিসি অনুমতি নেই (${msg})`;
  }
  if (msg.includes('JWT') || msg.includes('auth') || msg.includes('not authenticated')) {
    return `লগইন সেশন শেষ হয়ে গেছে: ${msg}`;
  }
  if (msg.includes('foreign key') || msg.includes('violates foreign key')) {
    return `সম্পর্কিত তথ্য পাওয়া যায়নি বা আগেই মুছে ফেলা হয়েছে: ${msg}`;
  }
  if (msg.includes('duplicate key') || msg.includes('already exists')) {
    return `এই তথ্যটি ইতিমধ্যে ডাটাবেসে রয়েছে: ${msg}`;
  }
  if (msg.includes('invalid input syntax')) {
    return `প্রদত্ত তথ্যের ফরম্যাট সঠিক নয়: ${msg}`;
  }
  if (msg.includes('Failed to fetch') || msg.includes('network')) {
    return `ডাটাবেস সংযোগ ব্যর্থ হয়েছে, ইন্টারনেট সংযোগ পরীক্ষা করুন (${msg})`;
  }
  return msg || 'ডাটাবেস অপারেশন ব্যর্থ হয়েছে';
}

export function computeDashboardStats(
  allDonations: Donation[] = [],
  allExpenses: Expense[] = [],
  allMahfils: Mahfil[] = []
): DashboardStats {
  const todayStr = new Date().toISOString().split('T')[0];
  const [currentYear, currentMonth] = todayStr.split('-');

  const safeDonations = Array.isArray(allDonations) ? allDonations : [];
  const safeExpenses = Array.isArray(allExpenses) ? allExpenses : [];
  const safeMahfils = Array.isArray(allMahfils) ? allMahfils : [];

  // Today's totals
  const todayDonations = safeDonations
    .filter((d) => (d.date || d.donationDate || '') === todayStr)
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const todayExpenses = safeExpenses
    .filter((e) => (e.date || e.expenseDate || '') === todayStr)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // This month
  const thisMonthDonations = safeDonations
    .filter((d) => (d.date || d.donationDate || '').startsWith(`${currentYear}-${currentMonth}`))
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const thisMonthExpenses = safeExpenses
    .filter((e) => (e.date || e.expenseDate || '').startsWith(`${currentYear}-${currentMonth}`))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const thisMonthBalance = thisMonthDonations - thisMonthExpenses;

  // This year
  const thisYearDonations = safeDonations
    .filter((d) => (d.date || d.donationDate || '').startsWith(`${currentYear}-`))
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const thisYearExpenses = safeExpenses
    .filter((e) => (e.date || e.expenseDate || '').startsWith(`${currentYear}-`))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const thisYearBalance = thisYearDonations - thisYearExpenses;

  // Lifetime balance
  const totalDonationsLifetime = safeDonations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const totalExpensesLifetime = safeExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const currentBalance = totalDonationsLifetime - totalExpensesLifetime;

  return {
    todayDonations,
    todayExpenses,
    currentBalance,
    thisMonthDonations,
    thisMonthExpenses,
    thisMonthBalance,
    thisYearDonations,
    thisYearExpenses,
    thisYearBalance,
    recentDonations: safeDonations.slice(0, 5),
    recentExpenses: safeExpenses.slice(0, 5),
    recentMahfils: safeMahfils.slice(0, 4),
  };
}

export const databaseService = {
  isConfigured: () => isSupabaseConfigured,

  // ---------------- MEMBERS ----------------
  async getMembers(): Promise<Member[]> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ কনফিগার করা হয়নি');
    
    // 1. Query primary members table
    let { data, error } = await supabase
      .from('members')
      .select('*')
      .order('name', { ascending: true });
      
    // 2. Fallback to public_members view if primary returns nothing or error
    if ((error || !data || data.length === 0)) {
      try {
        const viewRes = await supabase.from('public_members').select('*').order('name', { ascending: true });
        if (!viewRes.error && viewRes.data && viewRes.data.length > 0) {
          data = viewRes.data;
          error = null;
        } else if (!viewRes.error && viewRes.data && error) {
          data = viewRes.data;
          error = null;
        }
      } catch {
        // public view not configured, preserve original error if any
      }
    }

    if (error) {
      console.error('Error fetching members from Supabase:', error);
      throw new Error(translateErrorMessage(error));
    }
    
    return (data || []).map((m: any) => ({
      id: m.id,
      name: m.name || '',
      phone: m.phone || m.mobile_number || m.mobileNumber || '',
      mobileNumber: m.phone || m.mobile_number || m.mobileNumber || '',
      address: m.address || '',
      notes: m.notes || '',
      isActive: m.is_active !== false && m.status !== 'inactive',
      status: (m.is_active !== false && m.status !== 'inactive') ? 'active' : 'inactive',
      createdAt: m.created_at || m.createdAt || '',
      updatedAt: m.updated_at || m.updatedAt || '',
    }));
  },

  async addMember(member: Omit<Member, 'id' | 'createdAt'>): Promise<Member> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ সক্রিয় নেই');

    const payload = {
      name: member.name.trim(),
      phone: (member.phone || member.mobileNumber || '').trim() || null,
      address: member.address?.trim() || null,
      notes: member.notes?.trim() || null,
      is_active: member.status === 'active' || member.isActive !== false,
    };

    const { data, error } = await supabase
      .from('members')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error adding member to Supabase:', error);
      throw new Error(translateErrorMessage(error));
    }

    return {
      id: data.id,
      name: data.name,
      phone: data.phone || '',
      mobileNumber: data.phone || '',
      address: data.address || '',
      notes: data.notes || '',
      isActive: data.is_active !== false,
      status: data.is_active !== false ? 'active' : 'inactive',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async updateMember(id: string, updates: Partial<Omit<Member, 'id' | 'createdAt'>>): Promise<Member> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ সক্রিয় নেই');

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.phone !== undefined || updates.mobileNumber !== undefined) {
      payload.phone = (updates.phone || updates.mobileNumber || '').trim() || null;
    }
    if (updates.address !== undefined) payload.address = updates.address?.trim() || null;
    if (updates.notes !== undefined) payload.notes = updates.notes?.trim() || null;
    if (updates.status !== undefined || updates.isActive !== undefined) {
      payload.is_active = updates.status === 'active' || updates.isActive === true;
    }

    const { data, error } = await supabase
      .from('members')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating member:', error);
      throw new Error(translateErrorMessage(error));
    }

    return {
      id: data.id,
      name: data.name,
      phone: data.phone || '',
      mobileNumber: data.phone || '',
      address: data.address || '',
      notes: data.notes || '',
      isActive: data.is_active !== false,
      status: data.is_active !== false ? 'active' : 'inactive',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async deleteMember(id: string): Promise<void> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ সক্রিয় নেই');

    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) {
      console.error('Error deleting member:', error);
      throw new Error(translateErrorMessage(error));
    }
  },

  // ---------------- MAHFILS ----------------
  async getMahfils(): Promise<Mahfil[]> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ কনফিগার করা হয়নি');

    // 1. Query primary mahfils table
    let { data, error } = await supabase
      .from('mahfils')
      .select('*')
      .order('event_date', { ascending: false });

    // 2. Fallback to public_mahfils view if primary returns nothing or error
    if ((error || !data || data.length === 0)) {
      try {
        const viewRes = await supabase.from('public_mahfils').select('*').order('event_date', { ascending: false });
        if (!viewRes.error && viewRes.data && viewRes.data.length > 0) {
          data = viewRes.data;
          error = null;
        } else if (!viewRes.error && viewRes.data && error) {
          data = viewRes.data;
          error = null;
        }
      } catch {
        // public view not configured, preserve original error if any
      }
    }

    if (error) {
      console.error('Error fetching mahfils:', error);
      throw new Error(translateErrorMessage(error));
    }

    return (data || []).map((m: any) => {
      const rawDate = m.event_date || m.date || '';
      return {
        id: m.id,
        name: m.name || '',
        date: rawDate,
        eventDate: rawDate,
        location: m.location || '',
        description: m.description || '',
        status: m.status || 'completed',
        createdBy: m.created_by || '',
        createdAt: m.created_at || m.createdAt || '',
        updatedAt: m.updated_at || m.updatedAt || '',
      };
    });
  },

  async addMahfil(mahfil: Omit<Mahfil, 'id' | 'createdAt'>): Promise<Mahfil> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ সক্রিয় নেই');

    const userId = await getCurrentUserId();
    const payload = {
      name: mahfil.name.trim(),
      event_date: mahfil.date || mahfil.eventDate,
      location: mahfil.location.trim(),
      description: mahfil.description?.trim() || null,
      created_by: userId,
    };

    const { data, error } = await supabase
      .from('mahfils')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error adding mahfil:', error);
      throw new Error(translateErrorMessage(error));
    }

    return {
      id: data.id,
      name: data.name,
      date: data.event_date,
      eventDate: data.event_date,
      location: data.location,
      description: data.description || '',
      status: 'completed',
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async updateMahfil(id: string, updates: Partial<Omit<Mahfil, 'id' | 'createdAt'>>): Promise<Mahfil> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ সক্রিয় নেই');

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.date !== undefined || updates.eventDate !== undefined) {
      payload.event_date = updates.date || updates.eventDate;
    }
    if (updates.location !== undefined) payload.location = updates.location.trim();
    if (updates.description !== undefined) payload.description = updates.description?.trim() || null;

    const { data, error } = await supabase
      .from('mahfils')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating mahfil:', error);
      throw new Error(translateErrorMessage(error));
    }

    return {
      id: data.id,
      name: data.name,
      date: data.event_date,
      eventDate: data.event_date,
      location: data.location,
      description: data.description || '',
      status: 'completed',
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async deleteMahfil(id: string): Promise<void> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ সক্রিয় নেই');

    const { error } = await supabase.from('mahfils').delete().eq('id', id);
    if (error) {
      console.error('Error deleting mahfil:', error);
      throw new Error(translateErrorMessage(error));
    }
  },

  // ---------------- DONATIONS ----------------
  async getDonations(filters?: FilterOptions): Promise<Donation[]> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ কনফিগার করা হয়নি');

    let query = supabase
      .from('donations')
      .select('*')
      .order('donation_date', { ascending: false });

    if (filters?.date) {
      query = query.eq('donation_date', filters.date);
    }
    if (filters?.startDate && filters?.endDate) {
      query = query.gte('donation_date', filters.startDate).lte('donation_date', filters.endDate);
    }
    if (filters?.category) {
      query = query.eq('purpose', filters.category);
    }
    if (filters?.mahfilId) {
      query = query.eq('mahfil_id', filters.mahfilId);
    }

    let { data, error } = await query;

    // Fallback to public_donations view if primary returns nothing or error
    if ((error || !data || data.length === 0)) {
      try {
        let viewQuery = supabase
          .from('public_donations')
          .select('*')
          .order('donation_date', { ascending: false });

        if (filters?.date) viewQuery = viewQuery.eq('donation_date', filters.date);
        if (filters?.startDate && filters?.endDate) {
          viewQuery = viewQuery.gte('donation_date', filters.startDate).lte('donation_date', filters.endDate);
        }
        if (filters?.category) viewQuery = viewQuery.eq('purpose', filters.category);
        if (filters?.mahfilId) viewQuery = viewQuery.eq('mahfil_id', filters.mahfilId);

        const viewRes = await viewQuery;
        if (!viewRes.error && viewRes.data && viewRes.data.length > 0) {
          data = viewRes.data;
          error = null;
        } else if (!viewRes.error && viewRes.data && error) {
          data = viewRes.data;
          error = null;
        }
      } catch {
        // public view not configured, preserve original error if any
      }
    }

    if (error) {
      console.error('Error fetching donations:', error);
      throw new Error(translateErrorMessage(error));
    }

    const list: Donation[] = (data || []).map((d: any) => {
      const rawDate = d.donation_date || d.date || '';
      return {
        id: d.id,
        donorName: d.donor_name || d.donorName || '',
        memberId: d.member_id || d.memberId || null,
        phone: d.phone || d.mobile_number || d.mobileNumber || '',
        mobileNumber: d.phone || d.mobile_number || d.mobileNumber || '',
        amount: Number(d.amount) || 0,
        date: rawDate,
        donationDate: rawDate,
        category: d.purpose || d.category || 'সাধারণ দান',
        purpose: d.purpose || d.category || 'সাধারণ দান',
        mahfilId: d.mahfil_id || d.mahfilId || null,
        paymentMethod: d.payment_method || d.paymentMethod || 'cash',
        notes: d.notes || '',
        createdBy: d.created_by || '',
        createdAt: d.created_at || d.createdAt || '',
        updatedAt: d.updated_at || d.updatedAt || '',
      };
    });

    // Apply client-side search and month/year filters
    return list.filter((item) => {
      if (filters?.search) {
        const q = filters.search.toLowerCase().trim();
        const matchesName = (item.donorName || '').toLowerCase().includes(q);
        const matchesMobile = (item.phone || '').includes(q);
        const matchesNotes = (item.notes || '').toLowerCase().includes(q);
        const matchesPurpose = (item.purpose || '').toLowerCase().includes(q);
        if (!matchesName && !matchesMobile && !matchesNotes && !matchesPurpose) return false;
      }
      if (filters?.year) {
        const itemYear = (item.date || '').split('-')[0];
        if (itemYear !== filters.year) return false;
      }
      if (filters?.month) {
        const itemMonth = (item.date || '').split('-')[1];
        if (itemMonth !== filters.month) return false;
      }
      return true;
    });
  },

  async addDonation(donation: Omit<Donation, 'id' | 'createdAt'>): Promise<Donation> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ সক্রিয় নেই');

    const userId = await getCurrentUserId();
    const payload = {
      donor_name: donation.donorName.trim(),
      member_id: donation.memberId || null,
      phone: (donation.phone || donation.mobileNumber || '').trim() || null,
      amount: Number(donation.amount),
      donation_date: donation.date || donation.donationDate,
      purpose: donation.purpose || donation.category || 'সাধারণ দান',
      mahfil_id: donation.mahfilId || null,
      payment_method: donation.paymentMethod || 'cash',
      notes: donation.notes?.trim() || null,
      created_by: userId,
    };

    const { data, error } = await supabase
      .from('donations')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error adding donation:', error);
      throw new Error(translateErrorMessage(error));
    }

    return {
      id: data.id,
      donorName: data.donor_name,
      memberId: data.member_id,
      phone: data.phone || '',
      mobileNumber: data.phone || '',
      amount: Number(data.amount),
      date: data.donation_date,
      donationDate: data.donation_date,
      category: data.purpose,
      purpose: data.purpose,
      mahfilId: data.mahfil_id,
      paymentMethod: data.payment_method,
      notes: data.notes || '',
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async updateDonation(id: string, updates: Partial<Omit<Donation, 'id' | 'createdAt'>>): Promise<Donation> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ সক্রিয় নেই');

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.donorName !== undefined) payload.donor_name = updates.donorName.trim();
    if (updates.memberId !== undefined) payload.member_id = updates.memberId || null;
    if (updates.phone !== undefined || updates.mobileNumber !== undefined) {
      payload.phone = (updates.phone || updates.mobileNumber || '').trim() || null;
    }
    if (updates.amount !== undefined) payload.amount = Number(updates.amount);
    if (updates.date !== undefined || updates.donationDate !== undefined) {
      payload.donation_date = updates.date || updates.donationDate;
    }
    if (updates.purpose !== undefined || updates.category !== undefined) {
      payload.purpose = updates.purpose || updates.category;
    }
    if (updates.mahfilId !== undefined) payload.mahfil_id = updates.mahfilId || null;
    if (updates.paymentMethod !== undefined) payload.payment_method = updates.paymentMethod;
    if (updates.notes !== undefined) payload.notes = updates.notes?.trim() || null;

    const { data, error } = await supabase
      .from('donations')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating donation:', error);
      throw new Error(translateErrorMessage(error));
    }

    return {
      id: data.id,
      donorName: data.donor_name,
      memberId: data.member_id,
      phone: data.phone || '',
      mobileNumber: data.phone || '',
      amount: Number(data.amount),
      date: data.donation_date,
      donationDate: data.donation_date,
      category: data.purpose,
      purpose: data.purpose,
      mahfilId: data.mahfil_id,
      paymentMethod: data.payment_method,
      notes: data.notes || '',
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async deleteDonation(id: string): Promise<void> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ সক্রিয় নেই');

    const { error } = await supabase.from('donations').delete().eq('id', id);
    if (error) {
      console.error('Error deleting donation:', error);
      throw new Error(translateErrorMessage(error));
    }
  },

  // ---------------- EXPENSES ----------------
  async getExpenses(filters?: FilterOptions): Promise<Expense[]> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ কনফিগার করা হয়নি');

    let query = supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false });

    if (filters?.date) {
      query = query.eq('expense_date', filters.date);
    }
    if (filters?.startDate && filters?.endDate) {
      query = query.gte('expense_date', filters.startDate).lte('expense_date', filters.endDate);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.mahfilId) {
      query = query.eq('mahfil_id', filters.mahfilId);
    }

    let { data, error } = await query;

    // Fallback to public_expenses view if primary returns nothing or error
    if ((error || !data || data.length === 0)) {
      try {
        let viewQuery = supabase
          .from('public_expenses')
          .select('*')
          .order('expense_date', { ascending: false });

        if (filters?.date) viewQuery = viewQuery.eq('expense_date', filters.date);
        if (filters?.startDate && filters?.endDate) {
          viewQuery = viewQuery.gte('expense_date', filters.startDate).lte('expense_date', filters.endDate);
        }
        if (filters?.category) viewQuery = viewQuery.eq('category', filters.category);
        if (filters?.mahfilId) viewQuery = viewQuery.eq('mahfil_id', filters.mahfilId);

        const viewRes = await viewQuery;
        if (!viewRes.error && viewRes.data && viewRes.data.length > 0) {
          data = viewRes.data;
          error = null;
        } else if (!viewRes.error && viewRes.data && error) {
          data = viewRes.data;
          error = null;
        }
      } catch {
        // public view not configured, preserve original error if any
      }
    }

    if (error) {
      console.error('Error fetching expenses:', error);
      throw new Error(translateErrorMessage(error));
    }

    const list: Expense[] = (data || []).map((e: any) => {
      const rawDate = e.expense_date || e.date || '';
      return {
        id: e.id,
        title: e.description || e.paid_to || e.title || e.category || 'সাধারণ খরচ',
        date: rawDate,
        expenseDate: rawDate,
        category: e.category || 'সাধারণ খরচ',
        description: e.description || e.title || '',
        amount: Number(e.amount) || 0,
        recipient: e.paid_to || e.recipient || '',
        paidTo: e.paid_to || e.recipient || '',
        mahfilId: e.mahfil_id || e.mahfilId || null,
        paymentMethod: e.payment_method || e.paymentMethod || 'cash',
        notes: e.notes || '',
        createdBy: e.created_by || '',
        createdAt: e.created_at || e.createdAt || '',
        updatedAt: e.updated_at || e.updatedAt || '',
      };
    });

    return list.filter((item) => {
      if (filters?.search) {
        const q = filters.search.toLowerCase().trim();
        const matchesTitle = (item.title || '').toLowerCase().includes(q);
        const matchesRecipient = (item.recipient || '').toLowerCase().includes(q);
        const matchesNotes = (item.notes || '').toLowerCase().includes(q);
        const matchesCat = (item.category || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesRecipient && !matchesNotes && !matchesCat) return false;
      }
      if (filters?.year) {
        const itemYear = (item.date || '').split('-')[0];
        if (itemYear !== filters.year) return false;
      }
      if (filters?.month) {
        const itemMonth = (item.date || '').split('-')[1];
        if (itemMonth !== filters.month) return false;
      }
      return true;
    });
  },

  async addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ সক্রিয় নেই');

    const userId = await getCurrentUserId();
    const payload = {
      expense_date: expense.date || expense.expenseDate,
      category: expense.category,
      description: (expense.description || expense.title || '').trim() || null,
      amount: Number(expense.amount),
      paid_to: (expense.paidTo || expense.recipient || '').trim(),
      mahfil_id: expense.mahfilId || null,
      payment_method: expense.paymentMethod || 'cash',
      notes: expense.notes?.trim() || null,
      created_by: userId,
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error adding expense:', error);
      throw new Error(translateErrorMessage(error));
    }

    return {
      id: data.id,
      title: data.description || data.paid_to,
      date: data.expense_date,
      expenseDate: data.expense_date,
      category: data.category,
      description: data.description || '',
      amount: Number(data.amount),
      recipient: data.paid_to,
      paidTo: data.paid_to,
      mahfilId: data.mahfil_id,
      paymentMethod: data.payment_method,
      notes: data.notes || '',
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async updateExpense(id: string, updates: Partial<Omit<Expense, 'id' | 'createdAt'>>): Promise<Expense> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ সক্রিয় নেই');

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.date !== undefined || updates.expenseDate !== undefined) {
      payload.expense_date = updates.date || updates.expenseDate;
    }
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.description !== undefined || updates.title !== undefined) {
      payload.description = (updates.description || updates.title || '').trim() || null;
    }
    if (updates.amount !== undefined) payload.amount = Number(updates.amount);
    if (updates.paidTo !== undefined || updates.recipient !== undefined) {
      payload.paid_to = (updates.paidTo || updates.recipient || '').trim();
    }
    if (updates.mahfilId !== undefined) payload.mahfil_id = updates.mahfilId || null;
    if (updates.paymentMethod !== undefined) payload.payment_method = updates.paymentMethod;
    if (updates.notes !== undefined) payload.notes = updates.notes?.trim() || null;

    const { data, error } = await supabase
      .from('expenses')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating expense:', error);
      throw new Error(translateErrorMessage(error));
    }

    return {
      id: data.id,
      title: data.description || data.paid_to,
      date: data.expense_date,
      expenseDate: data.expense_date,
      category: data.category,
      description: data.description || '',
      amount: Number(data.amount),
      recipient: data.paid_to,
      paidTo: data.paid_to,
      mahfilId: data.mahfil_id,
      paymentMethod: data.payment_method,
      notes: data.notes || '',
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async deleteExpense(id: string): Promise<void> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ সক্রিয় নেই');

    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      console.error('Error deleting expense:', error);
      throw new Error(translateErrorMessage(error));
    }
  },

  // ---------------- EXPENSE CATEGORIES ----------------
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ কনফিগার করা হয়নি');

    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      if (error.code === '42P01' || error.message?.includes('schema cache') || error.message?.includes('not find the table')) {
        console.warn('public.expense_categories table is not found in schema cache. It might need to be created in Supabase SQL editor.');
        return [];
      }
      console.error('Error fetching expense categories:', error);
      throw new Error(translateErrorMessage(error));
    }

    return (data || []).map((c: any) => ({
      id: String(c.id),
      name: c.name || '',
      isActive: c.is_active !== false,
      createdAt: c.created_at || '',
      updatedAt: c.updated_at || '',
    }));
  },

  async addExpenseCategory(name: string): Promise<ExpenseCategory> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ সক্রিয় নেই');
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('ক্যাটাগরির নাম খালি হতে পারে না।');
    }

    const payload = {
      name: trimmed,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('expense_categories')
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (error.code === '42P01' || error.message?.includes('schema cache') || error.message?.includes('not find the table')) {
        throw new Error('ডাটাবেসে expense_categories টেবিল পাওয়া যায়নি। অনুগ্রহ করে Supabase SQL Editor-এ টেবিল তৈরি করুন।');
      }
      if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate key')) {
        throw new Error(`"${trimmed}" নামে একটি ক্যাটাগরি ইতিমধ্যে বিদ্যমান রয়েছে।`);
      }
      console.error('Error adding expense category:', error);
      throw new Error(translateErrorMessage(error));
    }

    return {
      id: String(data.id),
      name: data.name,
      isActive: data.is_active !== false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async updateExpenseCategory(id: string, name: string): Promise<ExpenseCategory> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ সক্রিয় নেই');
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('ক্যাটাগরির নাম খালি হতে পারে না।');
    }

    const payload = {
      name: trimmed,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('expense_categories')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate key')) {
        throw new Error(`"${trimmed}" নামে অন্য একটি ক্যাটাগরি ইতিমধ্যে বিদ্যমান রয়েছে।`);
      }
      console.error('Error updating expense category:', error);
      throw new Error(translateErrorMessage(error));
    }

    return {
      id: String(data.id),
      name: data.name,
      isActive: data.is_active !== false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async setExpenseCategoryActive(id: string, isActive: boolean): Promise<ExpenseCategory> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ সক্রিয় নেই');

    const payload = {
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('expense_categories')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error toggling expense category status:', error);
      throw new Error(translateErrorMessage(error));
    }

    return {
      id: String(data.id),
      name: data.name,
      isActive: data.is_active !== false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async checkCategoryUsageCount(categoryName: string): Promise<number> {
    if (!supabase) return 0;
    try {
      const { count, error } = await supabase
        .from('expenses')
        .select('*', { count: 'exact', head: true })
        .eq('category', categoryName.trim());

      if (error) {
        console.warn('Category usage check warning:', error);
        return 0;
      }
      return count || 0;
    } catch {
      return 0;
    }
  },

  async deleteExpenseCategory(id: string, categoryName: string): Promise<void> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ সক্রিয় নেই');

    const usageCount = await this.checkCategoryUsageCount(categoryName);
    if (usageCount > 0) {
      throw new Error(`এই ক্যাটাগরির অধীনে ${usageCount}টি খরচের রেকর্ড বিদ্যমান রয়েছে। তাই এটি মুছে ফেলা সম্ভব নয়; আপনি চাইলে এটি নিষ্ক্রিয় করতে পারেন।`);
    }

    const { error } = await supabase
      .from('expense_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting expense category:', error);
      throw new Error(translateErrorMessage(error));
    }
  },

  // ---------------- DASHBOARD CALCULATIONS ----------------
  async getDashboardStats(): Promise<DashboardStats> {
    const [allDonations, allExpenses, allMahfils] = await Promise.all([
      this.getDonations(),
      this.getExpenses(),
      this.getMahfils(),
    ]);

    return computeDashboardStats(allDonations, allExpenses, allMahfils);
  },

  // ---------------- PAGINATED & OPTIMIZED QUERIES ----------------
  async getDonationsPaginated(options: DonationFilterOptions = {}): Promise<PaginatedResult<Donation>> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ কনফিগার করা হয়নি');

    const page = Math.max(1, options.page || 1);
    const pageSize = options.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const applyFilters = (queryBuilder: any) => {
      let q = queryBuilder;
      if (options.search) {
        const s = options.search.trim().replace(/[,()]/g, '');
        if (s) {
          q = q.or(`donor_name.ilike.%${s}%,phone.ilike.%${s}%,purpose.ilike.%${s}%,notes.ilike.%${s}%`);
        }
      }
      if (options.date) {
        q = q.eq('donation_date', options.date);
      } else if (options.startDate && options.endDate) {
        q = q.gte('donation_date', options.startDate).lte('donation_date', options.endDate);
      } else if (options.startDate) {
        q = q.gte('donation_date', options.startDate);
      } else if (options.endDate) {
        q = q.lte('donation_date', options.endDate);
      } else if (options.year && options.month) {
        const y = parseInt(options.year, 10);
        const m = parseInt(options.month, 10);
        const lastDay = new Date(y, m, 0).getDate();
        const start = `${options.year}-${options.month.padStart(2, '0')}-01`;
        const end = `${options.year}-${options.month.padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        q = q.gte('donation_date', start).lte('donation_date', end);
      } else if (options.year) {
        q = q.gte('donation_date', `${options.year}-01-01`).lte('donation_date', `${options.year}-12-31`);
      } else if (options.month) {
        q = q.like('donation_date', `%-${options.month.padStart(2, '0')}-%`);
      }

      if (options.category) {
        q = q.eq('purpose', options.category);
      }
      if (options.mahfilId) {
        q = q.eq('mahfil_id', options.mahfilId);
      }
      if (options.paymentMethod) {
        q = q.eq('payment_method', options.paymentMethod);
      }
      return q;
    };

    let pagedQuery = supabase
      .from('donations')
      .select('*', { count: 'exact' });
    pagedQuery = applyFilters(pagedQuery);
    pagedQuery = pagedQuery
      .order('donation_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to);

    let sumQuery = supabase
      .from('donations')
      .select('amount');
    sumQuery = applyFilters(sumQuery);

    const [pageRes, sumRes] = await Promise.all([pagedQuery, sumQuery]);

    if (pageRes.error) {
      console.error('Error fetching paginated donations:', pageRes.error);
      throw new Error(translateErrorMessage(pageRes.error));
    }

    const totalCount = pageRes.count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const totalAmount = (sumRes.data || []).reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

    const data: Donation[] = (pageRes.data || []).map((d: any) => {
      const rawDate = d.donation_date || d.date || '';
      return {
        id: d.id,
        donorName: d.donor_name || d.donorName || '',
        memberId: d.member_id || d.memberId || null,
        phone: d.phone || d.mobile_number || d.mobileNumber || '',
        mobileNumber: d.phone || d.mobile_number || d.mobileNumber || '',
        amount: Number(d.amount) || 0,
        date: rawDate,
        donationDate: rawDate,
        category: d.purpose || d.category || 'সাধারণ দান',
        purpose: d.purpose || d.category || 'সাধারণ দান',
        mahfilId: d.mahfil_id || d.mahfilId || null,
        paymentMethod: d.payment_method || d.paymentMethod || 'cash',
        notes: d.notes || '',
        createdBy: d.created_by || '',
        createdAt: d.created_at || d.createdAt || '',
        updatedAt: d.updated_at || d.updatedAt || '',
      };
    });

    return {
      data,
      totalCount,
      totalAmount,
      page,
      pageSize,
      totalPages,
    };
  },

  async getExpensesPaginated(options: ExpenseFilterOptions = {}): Promise<PaginatedResult<Expense>> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ কনফিগার করা হয়নি');

    const page = Math.max(1, options.page || 1);
    const pageSize = options.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const applyFilters = (queryBuilder: any) => {
      let q = queryBuilder;
      if (options.search) {
        const s = options.search.trim().replace(/[,()]/g, '');
        if (s) {
          q = q.or(`description.ilike.%${s}%,paid_to.ilike.%${s}%,category.ilike.%${s}%,notes.ilike.%${s}%`);
        }
      }
      if (options.date) {
        q = q.eq('expense_date', options.date);
      } else if (options.startDate && options.endDate) {
        q = q.gte('expense_date', options.startDate).lte('expense_date', options.endDate);
      } else if (options.startDate) {
        q = q.gte('expense_date', options.startDate);
      } else if (options.endDate) {
        q = q.lte('expense_date', options.endDate);
      } else if (options.year && options.month) {
        const y = parseInt(options.year, 10);
        const m = parseInt(options.month, 10);
        const lastDay = new Date(y, m, 0).getDate();
        const start = `${options.year}-${options.month.padStart(2, '0')}-01`;
        const end = `${options.year}-${options.month.padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        q = q.gte('expense_date', start).lte('expense_date', end);
      } else if (options.year) {
        q = q.gte('expense_date', `${options.year}-01-01`).lte('expense_date', `${options.year}-12-31`);
      } else if (options.month) {
        q = q.like('expense_date', `%-${options.month.padStart(2, '0')}-%`);
      }

      if (options.category) {
        q = q.eq('category', options.category);
      }
      if (options.mahfilId) {
        q = q.eq('mahfil_id', options.mahfilId);
      }
      if (options.paymentMethod) {
        q = q.eq('payment_method', options.paymentMethod);
      }
      return q;
    };

    let pagedQuery = supabase
      .from('expenses')
      .select('*', { count: 'exact' });
    pagedQuery = applyFilters(pagedQuery);
    pagedQuery = pagedQuery
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to);

    let sumQuery = supabase
      .from('expenses')
      .select('amount');
    sumQuery = applyFilters(sumQuery);

    const [pageRes, sumRes] = await Promise.all([pagedQuery, sumQuery]);

    if (pageRes.error) {
      console.error('Error fetching paginated expenses:', pageRes.error);
      throw new Error(translateErrorMessage(pageRes.error));
    }

    const totalCount = pageRes.count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const totalAmount = (sumRes.data || []).reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

    const data: Expense[] = (pageRes.data || []).map((e: any) => {
      const rawDate = e.expense_date || e.date || '';
      return {
        id: e.id,
        title: e.description || e.paid_to || e.title || e.category || 'সাধারণ খরচ',
        date: rawDate,
        expenseDate: rawDate,
        category: e.category || 'সাধারণ খরচ',
        description: e.description || e.title || '',
        amount: Number(e.amount) || 0,
        recipient: e.paid_to || e.recipient || '',
        paidTo: e.paid_to || e.recipient || '',
        mahfilId: e.mahfil_id || e.mahfilId || null,
        paymentMethod: e.payment_method || e.paymentMethod || 'cash',
        notes: e.notes || '',
        createdBy: e.created_by || '',
        createdAt: e.created_at || e.createdAt || '',
        updatedAt: e.updated_at || e.updatedAt || '',
      };
    });

    return {
      data,
      totalCount,
      totalAmount,
      page,
      pageSize,
      totalPages,
    };
  },

  async getMahfilsPaginated(options: MahfilFilterOptions = {}): Promise<PaginatedResult<Mahfil>> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ কনফিগার করা হয়নি');

    const page = Math.max(1, options.page || 1);
    const pageSize = options.pageSize || 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const todayStr = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('mahfils')
      .select('*', { count: 'exact' });

    if (options.search) {
      const s = options.search.trim().replace(/[,()]/g, '');
      if (s) {
        query = query.ilike('name', `%${s}%`);
      }
    }

    if (options.year) {
      query = query.gte('event_date', `${options.year}-01-01`).lte('event_date', `${options.year}-12-31`);
    }

    if (options.status === 'upcoming') {
      query = query.gte('event_date', todayStr);
    } else if (options.status === 'completed') {
      query = query.lt('event_date', todayStr);
    }

    query = query
      .order('event_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching paginated mahfils:', error);
      throw new Error(translateErrorMessage(error));
    }

    const totalCount = count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    const list: Mahfil[] = (data || []).map((m: any) => {
      const rawDate = m.event_date || m.date || '';
      const isUpcoming = rawDate >= todayStr;
      return {
        id: m.id,
        name: m.name || '',
        date: rawDate,
        eventDate: rawDate,
        location: m.location || '',
        description: m.description || '',
        status: m.status || (isUpcoming ? 'upcoming' : 'completed'),
        createdBy: m.created_by || '',
        createdAt: m.created_at || m.createdAt || '',
        updatedAt: m.updated_at || m.updatedAt || '',
      };
    });

    return {
      data: list,
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  },

  async getMembersPaginated(options: MemberFilterOptions = {}): Promise<PaginatedResult<Member>> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ কনফিগার করা হয়নি');

    const page = Math.max(1, options.page || 1);
    const pageSize = options.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('members')
      .select('*', { count: 'exact' });

    if (options.search) {
      const s = options.search.trim().replace(/[,()]/g, '');
      if (s) {
        query = query.or(`name.ilike.%${s}%,phone.ilike.%${s}%`);
      }
    }

    if (options.status === 'active') {
      query = query.eq('is_active', true);
    } else if (options.status === 'inactive') {
      query = query.eq('is_active', false);
    }

    query = query
      .order('name', { ascending: true })
      .range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching paginated members:', error);
      throw new Error(translateErrorMessage(error));
    }

    const totalCount = count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    const list: Member[] = (data || []).map((m: any) => ({
      id: m.id,
      name: m.name || '',
      phone: m.phone || m.mobile_number || m.mobileNumber || '',
      mobileNumber: m.phone || m.mobile_number || m.mobileNumber || '',
      address: m.address || '',
      notes: m.notes || '',
      isActive: m.is_active !== false && m.status !== 'inactive',
      status: (m.is_active !== false && m.status !== 'inactive') ? 'active' : 'inactive',
      createdAt: m.created_at || m.createdAt || '',
      updatedAt: m.updated_at || m.updatedAt || '',
    }));

    return {
      data: list,
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  },

  async getMemberDonationTotals(memberIds: string[], phones: string[] = []): Promise<Record<string, number>> {
    if (!supabase || (!memberIds.length && !phones.length)) return {};
    try {
      const filterParts: string[] = [];
      if (memberIds.length > 0) {
        filterParts.push(`member_id.in.(${memberIds.join(',')})`);
      }
      const validPhones = phones.filter(Boolean);
      if (validPhones.length > 0) {
        filterParts.push(`phone.in.(${validPhones.join(',')})`);
      }

      if (!filterParts.length) return {};

      const { data, error } = await supabase
        .from('donations')
        .select('member_id, phone, amount')
        .or(filterParts.join(','));

      if (error || !data) return {};

      const totals: Record<string, number> = {};
      data.forEach((d: any) => {
        const amt = Number(d.amount) || 0;
        if (d.member_id) {
          totals[d.member_id] = (totals[d.member_id] || 0) + amt;
        }
        if (d.phone) {
          totals[d.phone] = (totals[d.phone] || 0) + amt;
        }
      });
      return totals;
    } catch {
      return {};
    }
  },

  async getMahfilFinancialSummaries(mahfilIds: string[]): Promise<Record<string, { income: number; expense: number; countDonations: number; countExpenses: number }>> {
    if (!supabase || !mahfilIds.length) return {};
    try {
      const [dRes, eRes] = await Promise.all([
        supabase.from('donations').select('mahfil_id, amount').in('mahfil_id', mahfilIds),
        supabase.from('expenses').select('mahfil_id, amount').in('mahfil_id', mahfilIds),
      ]);

      const summaries: Record<string, { income: number; expense: number; countDonations: number; countExpenses: number }> = {};
      mahfilIds.forEach((id) => {
        summaries[id] = { income: 0, expense: 0, countDonations: 0, countExpenses: 0 };
      });

      (dRes.data || []).forEach((d: any) => {
        if (d.mahfil_id && summaries[d.mahfil_id]) {
          summaries[d.mahfil_id].income += Number(d.amount) || 0;
          summaries[d.mahfil_id].countDonations += 1;
        }
      });

      (eRes.data || []).forEach((e: any) => {
        if (e.mahfil_id && summaries[e.mahfil_id]) {
          summaries[e.mahfil_id].expense += Number(e.amount) || 0;
          summaries[e.mahfil_id].countExpenses += 1;
        }
      });

      return summaries;
    } catch {
      return {};
    }
  },

  // ---------------- PUBLIC SUMMARY (RPC & Table Fallback) ----------------
  async getPublicSummary(): Promise<PublicSummary> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ কনফিগার করা হয়নি');

    // 1. Try Supabase RPC get_public_summary
    try {
      const { data, error } = await supabase.rpc('get_public_summary');
      if (!error && data && typeof data === 'object') {
        return data as PublicSummary;
      }
    } catch {
      // Fall through to direct table query fallback
    }

    // 2. Direct table aggregation fallback (Anonymous & Authenticated users have read access)
    try {
      const today = new Date();
      const curYear = today.getFullYear();
      const curMonth = String(today.getMonth() + 1).padStart(2, '0');
      const curYearMonth = `${curYear}-${curMonth}`;

      const [membersRes, donationsRes, expensesRes, mahfilsRes] = await Promise.all([
        supabase.from('members').select('id, is_active'),
        supabase.from('donations').select('id, amount, donation_date, mahfil_id'),
        supabase.from('expenses').select('id, amount, expense_date, mahfil_id'),
        supabase.from('mahfils').select('id, name, event_date, location, description'),
      ]);

      const membersList = membersRes.data || [];
      const donationsList = donationsRes.data || [];
      const expensesList = expensesRes.data || [];
      const mahfilsList = mahfilsRes.data || [];

      // 1. Member count
      const memberCount = membersList.filter((m: any) => m.is_active !== false).length;

      // 2. Current Month totals
      let curMonthIncome = 0;
      let curMonthExpense = 0;

      // 3. Current Year totals
      let curYearIncome = 0;
      let curYearExpense = 0;

      // Monthly aggregation array for 12 months
      const monthlyMap: Record<number, { income: number; expense: number }> = {};
      for (let m = 1; m <= 12; m++) {
        monthlyMap[m] = { income: 0, expense: 0 };
      }

      // Donations processing
      donationsList.forEach((d: any) => {
        const amt = Number(d.amount) || 0;
        const dDate = String(d.donation_date || '');
        if (dDate.startsWith(`${curYear}-`)) {
          curYearIncome += amt;
          const monthNum = parseInt(dDate.split('-')[1], 10);
          if (monthNum >= 1 && monthNum <= 12) {
            monthlyMap[monthNum].income += amt;
          }
        }
        if (dDate.startsWith(curYearMonth)) {
          curMonthIncome += amt;
        }
      });

      // Expenses processing
      expensesList.forEach((e: any) => {
        const amt = Number(e.amount) || 0;
        const eDate = String(e.expense_date || '');
        if (eDate.startsWith(`${curYear}-`)) {
          curYearExpense += amt;
          const monthNum = parseInt(eDate.split('-')[1], 10);
          if (monthNum >= 1 && monthNum <= 12) {
            monthlyMap[monthNum].expense += amt;
          }
        }
        if (eDate.startsWith(curYearMonth)) {
          curMonthExpense += amt;
        }
      });

      // 4. Upcoming Mahfils
      const todayStr = today.toISOString().split('T')[0];
      const upcomingMahfils = mahfilsList
        .filter((m: any) => String(m.event_date || '') >= todayStr)
        .sort((a: any, b: any) => String(a.event_date || '').localeCompare(String(b.event_date || '')))
        .slice(0, 5)
        .map((m: any) => ({
          id: m.id,
          name: m.name || '',
          event_date: m.event_date || '',
          location: m.location || '',
          description: m.description || null,
        }));

      // 5. Mahfil summary with income and expense
      const mahfilSummary = mahfilsList
        .sort((a: any, b: any) => String(b.event_date || '').localeCompare(String(a.event_date || '')))
        .slice(0, 10)
        .map((m: any) => {
          const mDonations = donationsList.filter((d: any) => d.mahfil_id === m.id);
          const mExpenses = expensesList.filter((e: any) => e.mahfil_id === m.id);
          const income = mDonations.reduce((sum: number, d: any) => sum + (Number(d.amount) || 0), 0);
          const expense = mExpenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
          return {
            id: m.id,
            name: m.name || '',
            event_date: m.event_date || '',
            location: m.location || '',
            income,
            expense,
            balance: income - expense,
          };
        });

      // 6. 12 Month Summary Array
      const yearlyMonthlySummary = Array.from({ length: 12 }, (_, i) => {
        const monthNum = i + 1;
        const entry = monthlyMap[monthNum];
        return {
          month: monthNum,
          income: entry.income,
          expense: entry.expense,
          balance: entry.income - entry.expense,
        };
      });

      return {
        member_count: memberCount,
        current_month: {
          income: curMonthIncome,
          expense: curMonthExpense,
          balance: curMonthIncome - curMonthExpense,
        },
        current_year: {
          income: curYearIncome,
          expense: curYearExpense,
          balance: curYearIncome - curYearExpense,
        },
        upcoming_mahfils: upcomingMahfils,
        mahfil_summary: mahfilSummary,
        yearly_monthly_summary: yearlyMonthlySummary,
      };
    } catch (fallbackErr: any) {
      console.error('Error computing public summary fallback:', fallbackErr);
      throw new Error(translateErrorMessage(fallbackErr));
    }
  },

  // ---------------- PUBLIC VIEW THEME & SETTINGS ----------------
  async getPublicViewSettings(): Promise<PublicViewSettings> {
    // 1. Try reading from server-persisted settings file first (/api/public-view-settings)
    // This avoids triggering 404 (PGRST205) errors on Supabase if the table does not exist
    try {
      const res = await fetch('/api/public-view-settings');
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object' && (data.org_name || data.orgName || data.theme_id || data.themeId)) {
          return {
            id: data.id || 'default',
            orgName: data.org_name || data.orgName || DEFAULT_PUBLIC_VIEW_SETTINGS.orgName,
            subtitle: data.subtitle !== undefined ? data.subtitle : DEFAULT_PUBLIC_VIEW_SETTINGS.subtitle,
            welcomeMessage: data.welcome_message !== undefined ? data.welcome_message : (data.welcomeMessage || DEFAULT_PUBLIC_VIEW_SETTINGS.welcomeMessage),
            logoUrl: data.logo_url || data.logoUrl || '',
            themeId: (data.theme_id || data.themeId || 'classic') as PublicThemeId,
            accentColor: data.accent_color || data.accentColor || DEFAULT_PUBLIC_VIEW_SETTINGS.accentColor,
            headerStyle: (data.header_style || data.headerStyle || 'gradient') as PublicHeaderStyle,
            footerText: data.footer_text !== undefined ? data.footer_text : (data.footerText || DEFAULT_PUBLIC_VIEW_SETTINGS.footerText),
            updatedAt: data.updated_at || data.updatedAt,
            updatedBy: data.updated_by || data.updatedBy,
          };
        }
      }
    } catch {
      // ignore
    }

    // 2. If server file has no settings yet and Supabase is configured, try Supabase
    if (supabase && isSupabasePublicViewSettingsAvailable !== false) {
      try {
        const { data, error } = await supabase
          .from('public_view_settings')
          .select('*')
          .eq('id', 'default')
          .maybeSingle();

        if (error) {
          if (
            error.code === 'PGRST205' ||
            error.code === '42P01' ||
            error.message?.includes('schema cache') ||
            error.message?.includes('does not exist')
          ) {
            isSupabasePublicViewSettingsAvailable = false;
          }
        } else if (data) {
          isSupabasePublicViewSettingsAvailable = true;
          return {
            id: data.id || 'default',
            orgName: data.org_name || DEFAULT_PUBLIC_VIEW_SETTINGS.orgName,
            subtitle: data.subtitle !== undefined ? data.subtitle : DEFAULT_PUBLIC_VIEW_SETTINGS.subtitle,
            welcomeMessage: data.welcome_message !== undefined ? data.welcome_message : DEFAULT_PUBLIC_VIEW_SETTINGS.welcomeMessage,
            logoUrl: data.logo_url || '',
            themeId: (data.theme_id as PublicThemeId) || 'classic',
            accentColor: data.accent_color || DEFAULT_PUBLIC_VIEW_SETTINGS.accentColor,
            headerStyle: (data.header_style as PublicHeaderStyle) || 'gradient',
            footerText: data.footer_text !== undefined ? data.footer_text : DEFAULT_PUBLIC_VIEW_SETTINGS.footerText,
            updatedAt: data.updated_at || undefined,
            updatedBy: data.updated_by || undefined,
          };
        }
      } catch {
        // public_view_settings not available, smoothly fall through to defaults
        isSupabasePublicViewSettingsAvailable = false;
      }
    }

    // 3. Fallback to clean defaults
    return { ...DEFAULT_PUBLIC_VIEW_SETTINGS };
  },

  async updatePublicViewSettings(
    settings: Partial<PublicViewSettings>,
    updatedBy?: string
  ): Promise<PublicViewSettings> {
    const payload = {
      id: 'default',
      org_name: (settings.orgName ?? DEFAULT_PUBLIC_VIEW_SETTINGS.orgName).trim() || DEFAULT_PUBLIC_VIEW_SETTINGS.orgName,
      subtitle: (settings.subtitle ?? DEFAULT_PUBLIC_VIEW_SETTINGS.subtitle).trim(),
      welcome_message: (settings.welcomeMessage ?? DEFAULT_PUBLIC_VIEW_SETTINGS.welcomeMessage).trim(),
      logo_url: (settings.logoUrl ?? '').trim(),
      theme_id: settings.themeId || 'classic',
      accent_color: settings.accentColor || DEFAULT_PUBLIC_VIEW_SETTINGS.accentColor,
      header_style: settings.headerStyle || 'gradient',
      footer_text: (settings.footerText ?? DEFAULT_PUBLIC_VIEW_SETTINGS.footerText).trim(),
      updated_by: updatedBy || 'প্রধান অ্যাডমিন',
      updated_at: new Date().toISOString(),
    };

    const formattedResult: PublicViewSettings = {
      id: payload.id,
      orgName: payload.org_name,
      subtitle: payload.subtitle,
      welcomeMessage: payload.welcome_message,
      logoUrl: payload.logo_url,
      themeId: payload.theme_id as PublicThemeId,
      accentColor: payload.accent_color,
      headerStyle: payload.header_style as PublicHeaderStyle,
      footerText: payload.footer_text,
      updatedAt: payload.updated_at,
      updatedBy: payload.updated_by,
    };

    // 1. Always persist to server-side endpoint first so it is permanently available across all clients & reloads
    try {
      await fetch('/api/public-view-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (saveErr) {
      console.warn('Server settings save note:', saveErr);
    }

    // 2. If Supabase is available and not known to be missing the table, attempt to upsert
    if (supabase && isSupabasePublicViewSettingsAvailable !== false) {
      try {
        const { data, error } = await supabase
          .from('public_view_settings')
          .upsert(payload, { onConflict: 'id' })
          .select()
          .single();

        if (error) {
          // If table does not exist in schema cache (PGRST205 or 42P01), remember it and do NOT throw!
          if (
            error.code === 'PGRST205' ||
            error.code === '42P01' ||
            error.message?.includes('schema cache') ||
            error.message?.includes('does not exist')
          ) {
            isSupabasePublicViewSettingsAvailable = false;
            return formattedResult;
          }
          console.warn('Supabase settings upsert note:', error.message);
          return formattedResult;
        }

        if (data) {
          isSupabasePublicViewSettingsAvailable = true;
          return {
            id: data.id,
            orgName: data.org_name,
            subtitle: data.subtitle,
            welcomeMessage: data.welcome_message,
            logoUrl: data.logo_url || '',
            themeId: data.theme_id as PublicThemeId,
            accentColor: data.accent_color,
            headerStyle: data.header_style as PublicHeaderStyle,
            footerText: data.footer_text,
            updatedAt: data.updated_at,
            updatedBy: data.updated_by,
          };
        }
      } catch (err: any) {
        if (
          err?.message?.includes('schema cache') ||
          err?.message?.includes('PGRST205') ||
          err?.message?.includes('does not exist')
        ) {
          isSupabasePublicViewSettingsAvailable = false;
        }
        return formattedResult;
      }
    }

    return formattedResult;
  },

  async uploadPublicLogo(file: File): Promise<string> {
    if (!supabase) throw new Error('ডাটাবেস সংযোগ সক্রিয় নেই');

    // 2MB size limit validation
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('লোগো ফাইলের আকার ২ মেগাবাইট (2MB)-এর কম হতে হবে।');
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
    const cleanFileName = `public-logo-${Date.now()}.${fileExt}`;
    const filePath = `logos/${cleanFileName}`;
    const bucketName = 'public-assets';

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Supabase storage upload error:', uploadError);
      throw new Error(
        `সুপাবেস স্টোরেজে আপলোড করা যায়নি (${uploadError.message})। স্টোরেজ বাকেট 'public-assets' নিশ্চিত করুন অথবা সরাসরি লোগো ইমেজ লিঙ্ক (Image URL) ইনপুট করুন।`
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      throw new Error('আপলোডকৃত লোগোর পাবলিক URL পাওয়া যায়নি।');
    }

    return publicUrlData.publicUrl;
  },
};

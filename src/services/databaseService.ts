import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Donation, Expense, Mahfil, Member, DashboardStats } from '../types/database.types';

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

// Bengali error message translator
export function translateErrorMessage(error: any): string {
  if (!error) return 'একটি অজানা ত্রুটি ঘটেছে';
  const msg = typeof error === 'string' ? error : error.message || '';
  
  if (msg.includes('row-level security') || msg.includes('violates row-level security')) {
    return 'আপনার এই কাজটি করার পারমিশন নেই (অনুমতি সংরক্ষিত)';
  }
  if (msg.includes('JWT') || msg.includes('auth') || msg.includes('not authenticated')) {
    return 'লগইন সেশন শেষ হয়ে গেছে, অনুগ্রহ করে পুনরায় লগইন করুন';
  }
  if (msg.includes('foreign key') || msg.includes('violates foreign key')) {
    return 'সম্পর্কিত তথ্য পাওয়া যায়নি বা আগেই মুছে ফেলা হয়েছে';
  }
  if (msg.includes('duplicate key') || msg.includes('already exists')) {
    return 'এই তথ্যটি ইতিমধ্যে ডাটাবেসে রয়েছে';
  }
  if (msg.includes('invalid input syntax')) {
    return 'প্রদত্ত তথ্যের ফরম্যাট সঠিক নয়';
  }
  if (msg.includes('Failed to fetch') || msg.includes('network')) {
    return 'ডাটাবেস সংযোগ ব্যর্থ হয়েছে, ইন্টারনেট সংযোগ পরীক্ষা করুন';
  }
  return msg || 'ডাটাবেস অপারেশন ব্যর্থ হয়েছে';
}

export const databaseService = {
  isConfigured: () => isSupabaseConfigured,

  // ---------------- MEMBERS ----------------
  async getMembers(): Promise<Member[]> {
    if (!supabase) return [];
    
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('name', { ascending: true });
      
    if (error) {
      console.error('Error fetching members from Supabase:', error);
      throw new Error(translateErrorMessage(error));
    }
    
    return (data || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      phone: m.phone || '',
      mobileNumber: m.phone || '',
      address: m.address || '',
      notes: m.notes || '',
      isActive: m.is_active !== false,
      status: m.is_active !== false ? 'active' : 'inactive',
      createdAt: m.created_at,
      updatedAt: m.updated_at,
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
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('mahfils')
      .select('*')
      .order('event_date', { ascending: false });

    if (error) {
      console.error('Error fetching mahfils:', error);
      throw new Error(translateErrorMessage(error));
    }

    return (data || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      date: m.event_date,
      eventDate: m.event_date,
      location: m.location,
      description: m.description || '',
      status: 'completed',
      createdBy: m.created_by,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));
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
    if (!supabase) return [];

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

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching donations:', error);
      throw new Error(translateErrorMessage(error));
    }

    const list: Donation[] = (data || []).map((d: any) => ({
      id: d.id,
      donorName: d.donor_name,
      memberId: d.member_id,
      phone: d.phone || '',
      mobileNumber: d.phone || '',
      amount: Number(d.amount),
      date: d.donation_date,
      donationDate: d.donation_date,
      category: d.purpose,
      purpose: d.purpose,
      mahfilId: d.mahfil_id,
      paymentMethod: d.payment_method,
      notes: d.notes || '',
      createdBy: d.created_by,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));

    // Apply client-side search and month/year filters
    return list.filter((item) => {
      if (filters?.search) {
        const q = filters.search.toLowerCase().trim();
        const matchesName = item.donorName.toLowerCase().includes(q);
        const matchesMobile = (item.phone || '').includes(q);
        const matchesNotes = (item.notes || '').toLowerCase().includes(q);
        const matchesPurpose = (item.purpose || '').toLowerCase().includes(q);
        if (!matchesName && !matchesMobile && !matchesNotes && !matchesPurpose) return false;
      }
      if (filters?.year) {
        const itemYear = item.date.split('-')[0];
        if (itemYear !== filters.year) return false;
      }
      if (filters?.month) {
        const itemMonth = item.date.split('-')[1];
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
    if (!supabase) return [];

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

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching expenses:', error);
      throw new Error(translateErrorMessage(error));
    }

    const list: Expense[] = (data || []).map((e: any) => ({
      id: e.id,
      title: e.description || e.paid_to || e.category,
      date: e.expense_date,
      expenseDate: e.expense_date,
      category: e.category,
      description: e.description || '',
      amount: Number(e.amount),
      recipient: e.paid_to,
      paidTo: e.paid_to,
      mahfilId: e.mahfil_id,
      paymentMethod: e.payment_method,
      notes: e.notes || '',
      createdBy: e.created_by,
      createdAt: e.created_at,
      updatedAt: e.updated_at,
    }));

    return list.filter((item) => {
      if (filters?.search) {
        const q = filters.search.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesRecipient = item.recipient.toLowerCase().includes(q);
        const matchesNotes = (item.notes || '').toLowerCase().includes(q);
        const matchesCat = item.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesRecipient && !matchesNotes && !matchesCat) return false;
      }
      if (filters?.year) {
        const itemYear = item.date.split('-')[0];
        if (itemYear !== filters.year) return false;
      }
      if (filters?.month) {
        const itemMonth = item.date.split('-')[1];
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

  // ---------------- DASHBOARD CALCULATIONS ----------------
  async getDashboardStats(): Promise<DashboardStats> {
    const [allDonations, allExpenses, allMahfils] = await Promise.all([
      this.getDonations(),
      this.getExpenses(),
      this.getMahfils(),
    ]);

    const todayStr = new Date().toISOString().split('T')[0];
    const [currentYear, currentMonth] = todayStr.split('-');

    // Today's totals
    const todayDonations = allDonations
      .filter((d) => d.date === todayStr)
      .reduce((sum, d) => sum + d.amount, 0);

    const todayExpenses = allExpenses
      .filter((e) => e.date === todayStr)
      .reduce((sum, e) => sum + e.amount, 0);

    // This month
    const thisMonthDonations = allDonations
      .filter((d) => d.date.startsWith(`${currentYear}-${currentMonth}`))
      .reduce((sum, d) => sum + d.amount, 0);

    const thisMonthExpenses = allExpenses
      .filter((e) => e.date.startsWith(`${currentYear}-${currentMonth}`))
      .reduce((sum, e) => sum + e.amount, 0);

    const thisMonthBalance = thisMonthDonations - thisMonthExpenses;

    // This year
    const thisYearDonations = allDonations
      .filter((d) => d.date.startsWith(`${currentYear}-`))
      .reduce((sum, d) => sum + d.amount, 0);

    const thisYearExpenses = allExpenses
      .filter((e) => e.date.startsWith(`${currentYear}-`))
      .reduce((sum, e) => sum + e.amount, 0);

    const thisYearBalance = thisYearDonations - thisYearExpenses;

    // Lifetime balance
    const totalDonationsLifetime = allDonations.reduce((sum, d) => sum + d.amount, 0);
    const totalExpensesLifetime = allExpenses.reduce((sum, e) => sum + e.amount, 0);
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
      recentDonations: allDonations.slice(0, 5),
      recentExpenses: allExpenses.slice(0, 5),
      recentMahfils: allMahfils.slice(0, 4),
    };
  },
};

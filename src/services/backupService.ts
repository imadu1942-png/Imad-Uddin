import { supabase } from '../lib/supabase';
import { Donation, Expense, Mahfil, Member, UserRole } from '../types/database.types';
import { exportToCSV } from '../utils/exportHelpers';
import { formatBengaliDate, getPaymentMethodLabel, toBengaliNumber } from '../utils/formatters';

export interface BackupValidationResult {
  isValid: boolean;
  error?: string;
  counts: {
    members: number;
    mahfils: number;
    donations: number;
    expenses: number;
  };
  data?: {
    members?: any[];
    mahfils?: any[];
    donations?: any[];
    expenses?: any[];
    profiles?: any[];
  };
}

export interface RestoreSummary {
  restoredMembers: number;
  restoredMahfils: number;
  restoredDonations: number;
  restoredExpenses: number;
  skippedCount: number;
  errors: string[];
}

const LAST_BACKUP_KEY = 'ashiqane_gausia_last_backup_time';

export const backupService = {
  // Track last backup time safely
  getLastBackupTime(): string | null {
    try {
      const stored = localStorage.getItem(LAST_BACKUP_KEY);
      if (!stored) return null;
      const date = new Date(stored);
      if (isNaN(date.getTime())) return null;
      return `${formatBengaliDate(stored.split('T')[0])} ${date.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return null;
    }
  },

  recordBackupDownloaded(): void {
    try {
      localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
    } catch {
      // ignore in restrictive environments
    }
  },

  // ---------------- FULL BACKUP DOWNLOAD (JSON) ----------------
  async downloadFullBackup(): Promise<string> {
    if (!supabase) {
      throw new Error('ডাটাবেস সংযোগ সক্রিয় নেই');
    }

    // Safely query all application data tables
    const [membersRes, mahfilsRes, donationsRes, expensesRes, profilesRes] = await Promise.all([
      supabase.from('members').select('*'),
      supabase.from('mahfils').select('*'),
      supabase.from('donations').select('*'),
      supabase.from('expenses').select('*'),
      supabase.from('profiles').select('id, full_name, role, created_at, updated_at'),
    ]);

    if (membersRes.error) console.warn('Members backup query warning:', membersRes.error);
    if (mahfilsRes.error) console.warn('Mahfils backup query warning:', mahfilsRes.error);
    if (donationsRes.error) console.warn('Donations backup query warning:', donationsRes.error);
    if (expensesRes.error) console.warn('Expenses backup query warning:', expensesRes.error);

    const membersData = membersRes.data || [];
    const mahfilsData = mahfilsRes.data || [];
    const donationsData = donationsRes.data || [];
    const expensesData = expensesRes.data || [];
    const profilesData = profilesRes.data || [];

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    // Structured application-level backup payload (no secrets or passwords)
    const backupPayload = {
      app: 'ashiqane-gausia',
      organization: 'আশেকানে গাউছিয়া',
      version: '1.0',
      type: 'application-data-backup',
      exportedAt: now.toISOString(),
      summary: {
        membersCount: membersData.length,
        mahfilsCount: mahfilsData.length,
        donationsCount: donationsData.length,
        expensesCount: expensesData.length,
        profilesCount: profilesData.length,
      },
      data: {
        profiles: profilesData,
        members: membersData,
        mahfils: mahfilsData,
        donations: donationsData,
        expenses: expensesData,
      },
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const filename = `ashiqane-gausia-backup-${dateStr}.json`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.recordBackupDownloaded();
    return filename;
  },

  // ---------------- CSV FINANCIAL EXPORT ----------------
  exportFinancialCSV(donations: Donation[], expenses: Expense[], mahfils: Mahfil[]): void {
    const rows: Record<string, unknown>[] = [];
    const dateStr = new Date().toISOString().split('T')[0];

    // 1. Add Donations
    donations.forEach((d) => {
      const mahfil = mahfils.find((m) => m.id === d.mahfilId);
      rows.push({
        date: d.date,
        type: 'হাদিয়া / দান',
        title: d.donorName,
        recipientOrMethod: getPaymentMethodLabel(d.paymentMethod),
        category: d.purpose || d.category || 'সাধারণ দান',
        mahfilName: mahfil ? mahfil.name : 'সাধারণ তহবিল',
        inflow: d.amount,
        outflow: '-',
        notes: d.notes || '-',
      });
    });

    // 2. Add Expenses
    expenses.forEach((e) => {
      const mahfil = mahfils.find((m) => m.id === e.mahfilId);
      rows.push({
        date: e.date,
        type: 'খরচ',
        title: e.title || e.category,
        recipientOrMethod: `${e.recipient || e.paidTo} (${getPaymentMethodLabel(e.paymentMethod)})`,
        category: e.category,
        mahfilName: mahfil ? mahfil.name : 'সাধারণ',
        inflow: '-',
        outflow: e.amount,
        notes: e.description || e.notes || '-',
      });
    });

    // Sort by date descending
    rows.sort((a, b) => String(b.date).localeCompare(String(a.date)));

    exportToCSV(
      `ashiqane-gausia-financial-${dateStr}`,
      rows,
      [
        { key: 'date', label: 'তারিখ' },
        { key: 'type', label: 'লেনদেনের ধরণ' },
        { key: 'title', label: 'দানকারী / খরচের বিষয়' },
        { key: 'recipientOrMethod', label: 'প্রাপক ও মাধ্যম' },
        { key: 'category', label: 'খাত / উদ্দেশ্য' },
        { key: 'mahfilName', label: 'সংশ্লিষ্ট মাহফিল' },
        { key: 'inflow', label: 'জমা / হাদিয়া (৳)' },
        { key: 'outflow', label: 'খরচ / ব্যয় (৳)' },
        { key: 'notes', label: 'মন্তব্য ও বিবরণ' },
      ]
    );
  },

  // ---------------- BACKUP FILE VALIDATION ----------------
  validateBackupFile(content: string): BackupValidationResult {
    try {
      const parsed = JSON.parse(content);
      if (!parsed || typeof parsed !== 'object') {
        return {
          isValid: false,
          error: 'ফাইলের ফরম্যাট সঠিক নয়।',
          counts: { members: 0, mahfils: 0, donations: 0, expenses: 0 },
        };
      }

      // Check structure
      const data = parsed.data || parsed;
      const members = Array.isArray(data.members) ? data.members : [];
      const mahfils = Array.isArray(data.mahfils) ? data.mahfils : [];
      const donations = Array.isArray(data.donations) ? data.donations : [];
      const expenses = Array.isArray(data.expenses) ? data.expenses : [];
      const profiles = Array.isArray(data.profiles) ? data.profiles : [];

      if (members.length === 0 && mahfils.length === 0 && donations.length === 0 && expenses.length === 0) {
        return {
          isValid: false,
          error: 'ব্যাকআপ ফাইলে কোনো সদস্য, মাহফিল, হাদিয়া বা খরচের রেকর্ড পাওয়া যায়নি।',
          counts: { members: 0, mahfils: 0, donations: 0, expenses: 0 },
        };
      }

      return {
        isValid: true,
        counts: {
          members: members.length,
          mahfils: mahfils.length,
          donations: donations.length,
          expenses: expenses.length,
        },
        data: {
          members,
          mahfils,
          donations,
          expenses,
          profiles,
        },
      };
    } catch {
      return {
        isValid: false,
        error: 'Backup file সঠিক নয় বা ক্ষতিগ্রস্ত।',
        counts: { members: 0, mahfils: 0, donations: 0, expenses: 0 },
      };
    }
  },

  // ---------------- SAFE RESTORE (ADMIN ONLY) ----------------
  async restoreBackupData(
    backupData: NonNullable<BackupValidationResult['data']>,
    currentRole: UserRole
  ): Promise<RestoreSummary> {
    if (currentRole !== 'admin') {
      throw new Error('অনুমতি প্রত্যাখ্যাত: শুধুমাত্র প্রধান অ্যাডমিন ব্যাকআপ রিস্টোর করতে পারেন।');
    }

    if (!supabase) {
      throw new Error('ডাটাবেস সংযোগ সক্রিয় নেই');
    }

    const summary: RestoreSummary = {
      restoredMembers: 0,
      restoredMahfils: 0,
      restoredDonations: 0,
      restoredExpenses: 0,
      skippedCount: 0,
      errors: [],
    };

    // 1. Members Restore
    if (backupData.members && backupData.members.length > 0) {
      const { data: existingMembers } = await supabase.from('members').select('id, name, phone');
      const existingIdSet = new Set((existingMembers || []).map((m: any) => m.id));

      for (const m of backupData.members) {
        if (!m.name) continue;
        if (m.id && existingIdSet.has(m.id)) {
          summary.skippedCount++;
          continue;
        }

        const payload: Record<string, any> = {
          name: String(m.name).trim(),
          phone: m.phone || m.mobile_number || null,
          address: m.address || null,
          notes: m.notes || null,
          is_active: m.is_active !== false && m.status !== 'inactive',
        };
        if (m.id) payload.id = m.id;

        const { error } = await supabase.from('members').insert(payload);
        if (error) {
          summary.errors.push(`সদস্য "${m.name}" রিস্টোর ব্যর্থ: ${error.message}`);
        } else {
          summary.restoredMembers++;
          if (m.id) existingIdSet.add(m.id);
        }
      }
    }

    // 2. Mahfils Restore
    if (backupData.mahfils && backupData.mahfils.length > 0) {
      const { data: existingMahfils } = await supabase.from('mahfils').select('id, name');
      const existingIdSet = new Set((existingMahfils || []).map((m: any) => m.id));

      for (const mf of backupData.mahfils) {
        if (!mf.name) continue;
        if (mf.id && existingIdSet.has(mf.id)) {
          summary.skippedCount++;
          continue;
        }

        const payload: Record<string, any> = {
          name: String(mf.name).trim(),
          event_date: mf.event_date || mf.date || new Date().toISOString().split('T')[0],
          location: mf.location ? String(mf.location).trim() : 'স্থান নির্ধারিত নয়',
          description: mf.description || null,
        };
        if (mf.id) payload.id = mf.id;

        const { error } = await supabase.from('mahfils').insert(payload);
        if (error) {
          summary.errors.push(`মাহফিল "${mf.name}" রিস্টোর ব্যর্থ: ${error.message}`);
        } else {
          summary.restoredMahfils++;
          if (mf.id) existingIdSet.add(mf.id);
        }
      }
    }

    // 3. Donations Restore
    if (backupData.donations && backupData.donations.length > 0) {
      const { data: existingDonations } = await supabase.from('donations').select('id');
      const existingIdSet = new Set((existingDonations || []).map((d: any) => d.id));

      for (const d of backupData.donations) {
        if (!d.donor_name && !d.donorName) continue;
        if (d.id && existingIdSet.has(d.id)) {
          summary.skippedCount++;
          continue;
        }

        const payload: Record<string, any> = {
          donor_name: String(d.donor_name || d.donorName).trim(),
          amount: Number(d.amount) || 0,
          donation_date: d.donation_date || d.date || new Date().toISOString().split('T')[0],
          purpose: d.purpose || d.category || 'সাধারণ দান',
          phone: d.phone || d.mobile_number || null,
          payment_method: d.payment_method || d.paymentMethod || 'cash',
          notes: d.notes || null,
          member_id: d.member_id || d.memberId || null,
          mahfil_id: d.mahfil_id || d.mahfilId || null,
        };
        if (d.id) payload.id = d.id;

        const { error } = await supabase.from('donations').insert(payload);
        if (error) {
          summary.errors.push(`হাদিয়া "${payload.donor_name}" রিস্টোর ব্যর্থ: ${error.message}`);
        } else {
          summary.restoredDonations++;
          if (d.id) existingIdSet.add(d.id);
        }
      }
    }

    // 4. Expenses Restore
    if (backupData.expenses && backupData.expenses.length > 0) {
      const { data: existingExpenses } = await supabase.from('expenses').select('id');
      const existingIdSet = new Set((existingExpenses || []).map((e: any) => e.id));

      for (const e of backupData.expenses) {
        if (!e.paid_to && !e.paidTo && !e.category && !e.title) continue;
        if (e.id && existingIdSet.has(e.id)) {
          summary.skippedCount++;
          continue;
        }

        const payload: Record<string, any> = {
          expense_date: e.expense_date || e.date || new Date().toISOString().split('T')[0],
          category: e.category || 'সাধারণ খরচ',
          description: e.description || e.title || null,
          amount: Number(e.amount) || 0,
          paid_to: String(e.paid_to || e.paidTo || e.recipient || 'বিবিধ').trim(),
          payment_method: e.payment_method || e.paymentMethod || 'cash',
          notes: e.notes || null,
          mahfil_id: e.mahfil_id || e.mahfilId || null,
        };
        if (e.id) payload.id = e.id;

        const { error } = await supabase.from('expenses').insert(payload);
        if (error) {
          summary.errors.push(`খরচ "${payload.paid_to}" রিস্টোর ব্যর্থ: ${error.message}`);
        } else {
          summary.restoredExpenses++;
          if (e.id) existingIdSet.add(e.id);
        }
      }
    }

    return summary;
  },
};

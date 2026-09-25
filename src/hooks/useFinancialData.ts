import { useState, useEffect, useCallback } from 'react';
import { databaseService, FilterOptions } from '../services/databaseService';
import { Donation, Expense, Mahfil, Member, DashboardStats } from '../types/database.types';

export function useFinancialData() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [mahfils, setMahfils] = useState<Mahfil[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  const clearNotification = () => setNotification(null);

  // Load all foundational records
  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dList, eList, mList, memList, stats] = await Promise.all([
        databaseService.getDonations(),
        databaseService.getExpenses(),
        databaseService.getMahfils(),
        databaseService.getMembers(),
        databaseService.getDashboardStats(),
      ]);
      setDonations(dList);
      setExpenses(eList);
      setMahfils(mList);
      setMembers(memList);
      setDashboardStats(stats);
    } catch (err: any) {
      console.error('Data load error:', err);
      setError(err?.message || 'তথ্য লোড করতে সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Donation mutations
  const addDonation = async (data: Omit<Donation, 'id' | 'createdAt'>) => {
    try {
      const newRecord = await databaseService.addDonation(data);
      showNotification('হাদিয়া সফলভাবে সংরক্ষিত হয়েছে।');
      await refreshAll();
      return newRecord;
    } catch (err: any) {
      showNotification(err?.message || 'হাদিয়া সংরক্ষণ ব্যর্থ হয়েছে', 'error');
      throw err;
    }
  };

  const updateDonation = async (id: string, data: Partial<Omit<Donation, 'id' | 'createdAt'>>) => {
    try {
      const updated = await databaseService.updateDonation(id, data);
      showNotification('হাদিয়া তথ্য সফলভাবে হালনাগাদ করা হয়েছে।');
      await refreshAll();
      return updated;
    } catch (err: any) {
      showNotification(err?.message || 'হালনাগাদ ব্যর্থ হয়েছে', 'error');
      throw err;
    }
  };

  const deleteDonation = async (id: string) => {
    try {
      await databaseService.deleteDonation(id);
      showNotification('হাদিয়া রেকর্ড সফলভাবে মুছে ফেলা হয়েছে।');
      await refreshAll();
    } catch (err: any) {
      showNotification(err?.message || 'মুছে ফেলা সম্ভব হয়নি', 'error');
      throw err;
    }
  };

  // Expense mutations
  const addExpense = async (data: Omit<Expense, 'id' | 'createdAt'>) => {
    try {
      const newRecord = await databaseService.addExpense(data);
      showNotification('খরচের হিসাব সফলভাবে সংরক্ষিত হয়েছে।');
      await refreshAll();
      return newRecord;
    } catch (err: any) {
      showNotification(err?.message || 'খরচ সংরক্ষণ ব্যর্থ হয়েছে', 'error');
      throw err;
    }
  };

  const updateExpense = async (id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>) => {
    try {
      const updated = await databaseService.updateExpense(id, data);
      showNotification('খরচের হিসাব সফলভাবে হালনাগাদ করা হয়েছে।');
      await refreshAll();
      return updated;
    } catch (err: any) {
      showNotification(err?.message || 'হালনাগাদ ব্যর্থ হয়েছে', 'error');
      throw err;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await databaseService.deleteExpense(id);
      showNotification('খরচ রেকর্ড সফলভাবে মুছে ফেলা হয়েছে।');
      await refreshAll();
    } catch (err: any) {
      showNotification(err?.message || 'মুছে ফেলা সম্ভব হয়নি', 'error');
      throw err;
    }
  };

  // Mahfil mutations
  const addMahfil = async (data: Omit<Mahfil, 'id' | 'createdAt'>) => {
    try {
      const newRecord = await databaseService.addMahfil(data);
      showNotification('নতুন মাহফিল সফলভাবে অন্তর্ভুক্ত হয়েছে।');
      await refreshAll();
      return newRecord;
    } catch (err: any) {
      showNotification(err?.message || 'মাহফিল যোগ করা যায়নি', 'error');
      throw err;
    }
  };

  const updateMahfil = async (id: string, data: Partial<Omit<Mahfil, 'id' | 'createdAt'>>) => {
    try {
      const updated = await databaseService.updateMahfil(id, data);
      showNotification('মাহফিল তথ্য সফলভাবে হালনাগাদ করা হয়েছে।');
      await refreshAll();
      return updated;
    } catch (err: any) {
      showNotification(err?.message || 'হালনাগাদ ব্যর্থ হয়েছে', 'error');
      throw err;
    }
  };

  const deleteMahfil = async (id: string) => {
    try {
      await databaseService.deleteMahfil(id);
      showNotification('মাহফিল রেকর্ড মুছে ফেলা হয়েছে।');
      await refreshAll();
    } catch (err: any) {
      showNotification(err?.message || 'মুছে ফেলা সম্ভব হয়নি', 'error');
      throw err;
    }
  };

  // Member mutations
  const addMember = async (data: Omit<Member, 'id' | 'createdAt'>) => {
    try {
      const newRecord = await databaseService.addMember(data);
      showNotification('নতুন সদস্য সফলভাবে যুক্ত হয়েছেন।');
      await refreshAll();
      return newRecord;
    } catch (err: any) {
      showNotification(err?.message || 'সদস্য যোগ করা যায়নি', 'error');
      throw err;
    }
  };

  const updateMember = async (id: string, data: Partial<Omit<Member, 'id' | 'createdAt'>>) => {
    try {
      const updated = await databaseService.updateMember(id, data);
      showNotification('সদস্যের তথ্য সফলভাবে হালনাগাদ হয়েছে।');
      await refreshAll();
      return updated;
    } catch (err: any) {
      showNotification(err?.message || 'হালনাগাদ ব্যর্থ হয়েছে', 'error');
      throw err;
    }
  };

  const deleteMember = async (id: string) => {
    try {
      await databaseService.deleteMember(id);
      showNotification('সদস্য রেকর্ড মুছে ফেলা হয়েছে।');
      await refreshAll();
    } catch (err: any) {
      showNotification(err?.message || 'মুছে ফেলা সম্ভব হয়নি', 'error');
      throw err;
    }
  };

  return {
    donations,
    expenses,
    mahfils,
    members,
    dashboardStats,
    isLoading,
    error,
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
    isDatabaseConfigured: databaseService.isConfigured(),
  };
}

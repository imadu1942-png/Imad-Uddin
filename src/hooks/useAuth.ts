import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserRole, UserProfile } from '../types/database.types';

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('cashier');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string, userEmail: string, userMetadata?: any) => {
    if (!supabase) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile from public.profiles:', error);
      }

      if (profile) {
        const loadedRole: UserRole = (profile.role as UserRole) || 'viewer';
        setUser({
          id: profile.id,
          email: userEmail,
          fullName: profile.full_name || userMetadata?.full_name || 'দায়িত্বপ্রাপ্ত সদস্য',
          role: loadedRole,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        });
        setRole(loadedRole);
      } else {
        // Profile row does not exist yet. Try creating it for the authenticated user
        const desiredRole: UserRole = (userMetadata?.role as UserRole) || 'admin';
        const desiredName = userMetadata?.full_name || userEmail.split('@')[0] || 'দায়িত্বপ্রাপ্ত সদস্য';

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: desiredName,
            role: desiredRole,
          })
          .select()
          .single();

        if (newProfile && !insertError) {
          setUser({
            id: newProfile.id,
            email: userEmail,
            fullName: newProfile.full_name,
            role: newProfile.role as UserRole,
            createdAt: newProfile.created_at,
          });
          setRole(newProfile.role as UserRole);
        } else {
          // If insert fails due to RLS, default safely to userMetadata or viewer
          const fallbackRole = (userMetadata?.role as UserRole) || 'cashier';
          setUser({
            id: userId,
            email: userEmail,
            fullName: desiredName,
            role: fallbackRole,
            createdAt: new Date().toISOString(),
          });
          setRole(fallbackRole);
        }
      }
    } catch (err: any) {
      console.error('Profile resolution exception:', err);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    const client = supabase;

    // Load active session
    const initSession = async () => {
      try {
        const { data: { session }, error } = await client.auth.getSession();
        if (error) {
          console.error('Get session error:', error);
        }
        if (session?.user) {
          await fetchProfile(
            session.user.id,
            session.user.email || '',
            session.user.user_metadata
          );
        } else {
          setUser(null);
        }
      } catch (err: any) {
        console.error('Session initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    // Listen to auth state changes
    const { data: authListener } = client.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchProfile(
          session.user.id,
          session.user.email || '',
          session.user.user_metadata
        );
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign In with Supabase Auth
  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase কনফিগারেশন অনুপস্থিত');
    }
    setAuthError(null);
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setIsLoading(false);
      let message = 'লগইন ব্যর্থ হয়েছে।';
      if (error.message.includes('Invalid login credentials')) {
        message = 'ইমেইল বা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে পুনরায় চেষ্টা করুন।';
      } else if (error.message.includes('Email not confirmed')) {
        message = 'আপনার ইমেইল ঠিকানা এখনো ভেরিফাই করা হয়নি।';
      } else if (error.message.includes('rate limit')) {
        message = 'অতিরিক্ত বার চেষ্টার কারণে সাময়িক বিরতি দেওয়া হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
      } else {
        message = error.message;
      }
      setAuthError(message);
      throw new Error(message);
    }

    if (data.user) {
      await fetchProfile(
        data.user.id,
        data.user.email || '',
        data.user.user_metadata
      );
    }
    setIsLoading(false);
    return data;
  };

  // Sign Up with Supabase Auth
  const signUp = async (email: string, password: string, fullName: string, selectedRole: UserRole = 'cashier') => {
    if (!supabase) {
      throw new Error('Supabase কনফিগারেশন অনুপস্থিত');
    }
    setAuthError(null);
    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role: selectedRole,
        },
      },
    });

    if (error) {
      setIsLoading(false);
      let message = 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।';
      if (error.message.includes('User already registered')) {
        message = 'এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট নিবন্ধিত আছে। লগইন করুন।';
      } else if (error.message.includes('rate limit')) {
        message = 'ইমেইল প্রেরণের সর্বোচ্চ সীমা অতিক্রম করেছে। ইতিমধ্যে অ্যাকাউন্ট থাকলে লগইন করুন।';
      } else {
        message = error.message;
      }
      setAuthError(message);
      throw new Error(message);
    }

    if (data.user) {
      // Attempt to immediately insert profile if session was granted
      try {
        await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: fullName.trim(),
          role: selectedRole,
        });
      } catch {
        // handled in session listener
      }

      await fetchProfile(
        data.user.id,
        data.user.email || '',
        data.user.user_metadata
      );
    }

    setIsLoading(false);
    return data;
  };

  // Sign Out
  const signOut = async () => {
    if (!supabase) return;
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsLoading(false);
  };

  return {
    user,
    role,
    isLoading,
    authError,
    isAuthenticated: Boolean(user),
    isSupabaseConfigured,
    signIn,
    signUp,
    signOut,
    canEdit: role === 'admin' || role === 'cashier',
    canDelete: role === 'admin',
    isAdmin: role === 'admin',
    isCashier: role === 'cashier',
    isViewer: role === 'viewer',
  };
}

-- =========================================================================
-- আশেকানে গাউছিয়া - ইসলামিক সংগঠনের আর্থিক হিসাব ব্যবস্থাপনা
-- Supabase PostgreSQL Schema & Row Level Security (RLS) Policies
-- =========================================================================

-- ১. প্রোফাইল ও ইউজার রোল টেবিল (Profiles & Roles)
CREATE TYPE user_role AS ENUM ('admin', 'cashier', 'viewer');

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role DEFAULT 'cashier'::user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ২. সদস্যবৃন্দ টেবিল (Members)
CREATE TABLE IF NOT EXISTS public.members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  mobile_number TEXT,
  address TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ৩. মাহফিল টেবিল (Mahfils)
CREATE TABLE IF NOT EXISTS public.mahfils (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('upcoming', 'completed', 'ongoing')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ৪. হাদিয়া / অনুদান টেবিল (Donations)
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_name TEXT NOT NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  mobile_number TEXT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  category TEXT NOT NULL,
  mahfil_id UUID REFERENCES public.mahfils(id) ON DELETE SET NULL,
  payment_method TEXT DEFAULT 'cash' NOT NULL,
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ৫. খরচ টেবিল (Expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  recipient TEXT NOT NULL,
  mahfil_id UUID REFERENCES public.mahfils(id) ON DELETE SET NULL,
  payment_method TEXT DEFAULT 'cash' NOT NULL,
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ইনডেক্সিং (দ্রুত ফিল্টারিং এবং সার্চের জন্য)
CREATE INDEX IF NOT EXISTS idx_donations_date ON public.donations(date);
CREATE INDEX IF NOT EXISTS idx_donations_category ON public.donations(category);
CREATE INDEX IF NOT EXISTS idx_donations_mahfil ON public.donations(mahfil_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_mahfil ON public.expenses(mahfil_id);
CREATE INDEX IF NOT EXISTS idx_members_name ON public.members(name);

-- =========================================================================
-- Row Level Security (RLS) পলিসি
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mahfils ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- সহায়ক ফাংশন: বর্তমান ইউজারের রোল চেক
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- সকল অনুমোদিত ইউজার পড়তে পারবে (Viewer, Cashier, Admin)
CREATE POLICY "Allow authenticated read on members"
  ON public.members FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on mahfils"
  ON public.mahfils FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on donations"
  ON public.donations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on expenses"
  ON public.expenses FOR SELECT TO authenticated USING (true);

-- ক্যাশিয়ার ও অ্যাডমিন ডাটা যোগ/আপডেট করতে পারবে
CREATE POLICY "Allow cashier and admin insert on donations"
  ON public.donations FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('cashier', 'admin'));

CREATE POLICY "Allow cashier and admin update on donations"
  ON public.donations FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('cashier', 'admin'));

CREATE POLICY "Allow cashier and admin insert on expenses"
  ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('cashier', 'admin'));

CREATE POLICY "Allow cashier and admin update on expenses"
  ON public.expenses FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('cashier', 'admin'));

CREATE POLICY "Allow cashier and admin insert on mahfils"
  ON public.mahfils FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('cashier', 'admin'));

CREATE POLICY "Allow cashier and admin update on mahfils"
  ON public.mahfils FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('cashier', 'admin'));

CREATE POLICY "Allow cashier and admin insert on members"
  ON public.members FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('cashier', 'admin'));

CREATE POLICY "Allow cashier and admin update on members"
  ON public.members FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('cashier', 'admin'));

-- শুধুমাত্র অ্যাডমিন ডিলিট করতে পারবে
CREATE POLICY "Allow admin delete on donations"
  ON public.donations FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Allow admin delete on expenses"
  ON public.expenses FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Allow admin delete on mahfils"
  ON public.mahfils FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Allow admin delete on members"
  ON public.members FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');

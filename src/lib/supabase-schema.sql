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
  phone TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ৩. মাহফিল টেবিল (Mahfils)
CREATE TABLE IF NOT EXISTS public.mahfils (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  event_date DATE NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ৪. হাদিয়া / অনুদান টেবিল (Donations)
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_name TEXT NOT NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  phone TEXT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  donation_date DATE NOT NULL,
  purpose TEXT NOT NULL,
  mahfil_id UUID REFERENCES public.mahfils(id) ON DELETE SET NULL,
  payment_method TEXT DEFAULT 'cash' NOT NULL,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ৫. খরচ টেবিল (Expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  paid_to TEXT NOT NULL,
  mahfil_id UUID REFERENCES public.mahfils(id) ON DELETE SET NULL,
  payment_method TEXT DEFAULT 'cash' NOT NULL,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ইনডেক্সিং (দ্রুত ফিল্টারিং এবং সার্চের জন্য)
CREATE INDEX IF NOT EXISTS idx_donations_date ON public.donations(donation_date);
CREATE INDEX IF NOT EXISTS idx_donations_purpose ON public.donations(purpose);
CREATE INDEX IF NOT EXISTS idx_donations_mahfil ON public.donations(mahfil_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_mahfil ON public.expenses(mahfil_id);
CREATE INDEX IF NOT EXISTS idx_members_name ON public.members(name);
CREATE INDEX IF NOT EXISTS idx_mahfils_date ON public.mahfils(event_date);

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

-- নিরাপদ রিড-অনলি পাবলিক পলিসি (Secure Read-Only Access for Public View)
-- শুধুমাত্র পাবলিক ভিউয়ের জন্য SELECT অনুমোদন, কোনো INSERT/UPDATE/DELETE নয়
CREATE POLICY "Allow public read-only on members"
  ON public.members FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public read-only on mahfils"
  ON public.mahfils FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public read-only on donations"
  ON public.donations FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public read-only on expenses"
  ON public.expenses FOR SELECT TO anon USING (true);

-- রিড-অনলি পাবলিক ভিউ (Secure Read-Only Public Views for Guest Dashboard)
CREATE OR REPLACE VIEW public.public_members AS
  SELECT id, name, phone, address, notes, is_active, created_at
  FROM public.members;

CREATE OR REPLACE VIEW public.public_mahfils AS
  SELECT id, name, event_date, location, description, created_at
  FROM public.mahfils;

CREATE OR REPLACE VIEW public.public_donations AS
  SELECT id, donor_name, member_id, phone, amount, donation_date, purpose, mahfil_id, payment_method, notes, created_at
  FROM public.donations;

CREATE OR REPLACE VIEW public.public_expenses AS
  SELECT id, expense_date, category, description, amount, paid_to, mahfil_id, payment_method, notes, created_at
  FROM public.expenses;

GRANT SELECT ON public.public_members TO anon, authenticated;
GRANT SELECT ON public.public_mahfils TO anon, authenticated;
GRANT SELECT ON public.public_donations TO anon, authenticated;
GRANT SELECT ON public.public_expenses TO anon, authenticated;

-- ক্যাশিয়ার ও অ্যাডমিন ডাটা যোগ/আপডেট করতে পারবে (অননুমোদিত বা পাবলিক কোনোভাবেই পারবে না)
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

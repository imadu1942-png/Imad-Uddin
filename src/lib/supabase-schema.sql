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

-- ৬. খরচের ক্যাটাগরি টেবিল (Expense Categories)
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_expense_categories_name ON public.expense_categories(name);
CREATE INDEX IF NOT EXISTS idx_expense_categories_is_active ON public.expense_categories(is_active);
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
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Allow authenticated read on expense_categories"
  ON public.expense_categories FOR SELECT TO authenticated USING (true);

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

-- খরচের ক্যাটাগরি শুধুমাত্র অ্যাডমিন তৈরি, সম্পাদন ও ডিলিট করতে পারবে
CREATE POLICY "Allow admin insert on expense_categories"
  ON public.expense_categories FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Allow admin update on expense_categories"
  ON public.expense_categories FOR UPDATE TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Allow admin delete on expense_categories"
  ON public.expense_categories FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');

-- =========================================================================
-- ৭. পাবলিক ভিউ ডিজাইন ও থিম সেটিংস টেবিল (Public View Theme Settings)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.public_view_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  org_name TEXT NOT NULL DEFAULT 'আশেকানে গাউছিয়া',
  subtitle TEXT NOT NULL DEFAULT 'হাদিয়া, মাহফিল ও আয়-ব্যয়ের হিসাব',
  welcome_message TEXT NOT NULL DEFAULT 'আসসালামু আলাইকুম, আপনাকে স্বাগতম',
  logo_url TEXT DEFAULT '',
  theme_id TEXT NOT NULL DEFAULT 'classic',
  accent_color TEXT NOT NULL DEFAULT '#047857',
  header_style TEXT NOT NULL DEFAULT 'gradient',
  footer_text TEXT NOT NULL DEFAULT '© আশেকানে গাউছিয়া। সর্বস্বত্ব সংরক্ষিত।',
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- প্রাথমিক ডিফল্ট সেটিংস রেকর্ড ইনসার্ট (যদি না থাকে)
INSERT INTO public.public_view_settings (id, org_name, subtitle, welcome_message, logo_url, theme_id, accent_color, header_style, footer_text)
VALUES ('default', 'আশেকানে গাউছিয়া', 'হাদিয়া, মাহফিল ও আয়-ব্যয়ের হিসাব', 'আসসালামু আলাইকুম, আপনাকে স্বাগতম', '', 'classic', '#047857', 'gradient', '© আশেকানে গাউছিয়া। সর্বস্বত্ব সংরক্ষিত।')
ON CONFLICT (id) DO NOTHING;

-- RLS পলিসি এনাবলকরণ
ALTER TABLE public.public_view_settings ENABLE ROW LEVEL SECURITY;

-- নিরাপদ রিড-অনলি এক্সেস: সাধারণ দর্শনার্থী ও অথেনটিকেটেড যে কেউ পাবলিক থিম পড়তে পারবে
CREATE POLICY "Allow public read-only on public_view_settings"
  ON public.public_view_settings FOR SELECT TO anon, authenticated
  USING (true);

-- শুধুমাত্র প্রধান অ্যাডমিন থিম সেটিংস তৈরি ও সম্পাদন করতে পারবে
CREATE POLICY "Allow admin insert on public_view_settings"
  ON public.public_view_settings FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Allow admin update on public_view_settings"
  ON public.public_view_settings FOR UPDATE TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Allow admin delete on public_view_settings"
  ON public.public_view_settings FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');

-- =========================================================================
-- ৮. পাবলিক সামারি আরপিসি ফাংশন (get_public_summary RPC)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_public_summary()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member_count int;
  v_current_month_income numeric;
  v_current_month_expense numeric;
  v_current_year_income numeric;
  v_current_year_expense numeric;
  v_upcoming_mahfils json;
  v_mahfil_summary json;
  v_monthly_summary json;
  v_cur_year text := to_char(now(), 'YYYY');
  v_cur_month text := to_char(now(), 'YYYY-MM');
BEGIN
  -- ১. সক্রিয় সদস্য সংখ্যা
  SELECT count(*) INTO v_member_count FROM public.members WHERE is_active = true;

  -- ২. চলতি মাসের আয় ও ব্যয়
  SELECT coalesce(sum(amount), 0) INTO v_current_month_income
  FROM public.donations
  WHERE to_char(donation_date, 'YYYY-MM') = v_cur_month;

  SELECT coalesce(sum(amount), 0) INTO v_current_month_expense
  FROM public.expenses
  WHERE to_char(expense_date, 'YYYY-MM') = v_cur_month;

  -- ৩. চলতি বছরের আয় ও ব্যয়
  SELECT coalesce(sum(amount), 0) INTO v_current_year_income
  FROM public.donations
  WHERE to_char(donation_date, 'YYYY') = v_cur_year;

  SELECT coalesce(sum(amount), 0) INTO v_current_year_expense
  FROM public.expenses
  WHERE to_char(expense_date, 'YYYY') = v_cur_year;

  -- ৪. আসন্ন মাহফিলসমূহ
  SELECT coalesce(json_agg(t), '[]'::json) INTO v_upcoming_mahfils
  FROM (
    SELECT id, name, event_date, location, description
    FROM public.mahfils
    WHERE event_date >= current_date
    ORDER BY event_date ASC
    LIMIT 5
  ) t;

  -- ৫. মাহফিল ভিত্তিক আর্থিক খতিয়ান
  SELECT coalesce(json_agg(t), '[]'::json) INTO v_mahfil_summary
  FROM (
    SELECT 
      m.id,
      m.name,
      m.event_date,
      m.location,
      coalesce(sum(d.amount), 0) AS income,
      coalesce((SELECT coalesce(sum(e.amount), 0) FROM public.expenses e WHERE e.mahfil_id = m.id), 0) AS expense,
      coalesce(sum(d.amount), 0) - coalesce((SELECT coalesce(sum(e.amount), 0) FROM public.expenses e WHERE e.mahfil_id = m.id), 0) AS balance
    FROM public.mahfils m
    LEFT JOIN public.donations d ON d.mahfil_id = m.id
    GROUP BY m.id, m.name, m.event_date, m.location
    ORDER BY m.event_date DESC
    LIMIT 10
  ) t;

  -- ৬. চলতি বছরের ১২ মাসের আয়-ব্যয়ের খতিয়ান
  SELECT coalesce(json_agg(t), '[]'::json) INTO v_monthly_summary
  FROM (
    SELECT 
      m_series.m AS month,
      coalesce((
        SELECT sum(amount) 
        FROM public.donations 
        WHERE extract(year FROM donation_date) = extract(year FROM now())
          AND extract(month FROM donation_date) = m_series.m
      ), 0) AS income,
      coalesce((
        SELECT sum(amount) 
        FROM public.expenses 
        WHERE extract(year FROM expense_date) = extract(year FROM now())
          AND extract(month FROM expense_date) = m_series.m
      ), 0) AS expense,
      coalesce((
        SELECT sum(amount) 
        FROM public.donations 
        WHERE extract(year FROM donation_date) = extract(year FROM now())
          AND extract(month FROM donation_date) = m_series.m
      ), 0) - coalesce((
        SELECT sum(amount) 
        FROM public.expenses 
        WHERE extract(year FROM expense_date) = extract(year FROM now())
          AND extract(month FROM expense_date) = m_series.m
      ), 0) AS balance
    FROM generate_series(1, 12) AS m_series(m)
    ORDER BY m_series.m ASC
  ) t;

  RETURN json_build_object(
    'member_count', v_member_count,
    'current_month', json_build_object(
      'income', v_current_month_income,
      'expense', v_current_month_expense,
      'balance', v_current_month_income - v_current_month_expense
    ),
    'current_year', json_build_object(
      'income', v_current_year_income,
      'expense', v_current_year_expense,
      'balance', v_current_year_income - v_current_year_expense
    ),
    'upcoming_mahfils', v_upcoming_mahfils,
    'mahfil_summary', v_mahfil_summary,
    'yearly_monthly_summary', v_monthly_summary
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_summary() TO anon, authenticated;



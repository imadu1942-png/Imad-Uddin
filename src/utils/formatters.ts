// Bengali digits map
const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliNumber(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') return '০';
  const str = typeof val === 'number' ? Math.round(val).toLocaleString('en-US') : String(val);
  return str.replace(/\d/g, (d) => bengaliDigits[parseInt(d, 10)] || d);
}

export function formatCurrency(amount: number | undefined | null): string {
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? Math.round(amount) : 0;
  const formattedWithCommas = Math.abs(safeAmount).toLocaleString('en-IN');
  const bengaliNumber = formattedWithCommas.replace(/\d/g, (d) => bengaliDigits[parseInt(d, 10)] || d);
  return safeAmount < 0 ? `-৳ ${bengaliNumber}` : `৳ ${bengaliNumber}`;
}

export const BENGALI_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

export function getBengaliMonthName(monthNumber: number): string {
  // 1-12
  if (monthNumber < 1 || monthNumber > 12) return '';
  return BENGALI_MONTHS[monthNumber - 1];
}

export function formatBengaliDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  const bengaliDay = toBengaliNumber(day);
  const bengaliMonth = getBengaliMonthName(month);
  const bengaliYear = toBengaliNumber(year);

  return `${bengaliDay} ${bengaliMonth}, ${bengaliYear}`;
}

export const DONATION_CATEGORIES: { id: string; label: string }[] = [
  { id: 'সাধারণ দান', label: 'সাধারণ দান' },
  { id: 'মাসিক চাঁদা', label: 'মাসিক চাঁদা' },
  { id: 'মাহফিল অনুদান', label: 'মাহফিল অনুদান' },
  { id: 'লিল্লাহ ফান্ড', label: 'লিল্লাহ ফান্ড' },
  { id: 'মসজিদ/মাদ্রাসা ফান্ড', label: 'মসজিদ/মাদ্রাসা ফান্ড' },
  { id: 'অন্যান্য', label: 'অন্যান্য' },
];

export const EXPENSE_CATEGORIES: { id: string; label: string }[] = [
  { id: 'মাহফিল খরচ', label: 'মাহফিল খরচ' },
  { id: 'তবাররুক ও আপ্যায়ন', label: 'তবাররুক ও আপ্যায়ন' },
  { id: 'মাইক ও সাউন্ড সিস্টেম', label: 'মাইক ও সাউন্ড সিস্টেম' },
  { id: 'ডেকোরেশন ও প্যান্ডেল', label: 'ডেকোরেশন ও প্যান্ডেল' },
  { id: 'মেহমানদারি ও বক্তা হাদিয়া', label: 'মেহমানদারি ও বক্তা হাদিয়া' },
  { id: 'যাতায়াত ও পরিবহন', label: 'যাতায়াত ও পরিবহন' },
  { id: 'প্রচার ও স্টেশনারি', label: 'প্রচার ও স্টেশনারি' },
  { id: 'বিদ্যুৎ ও জেনারেটর', label: 'বিদ্যুৎ ও জেনারেটর' },
  { id: 'অন্যান্য', label: 'অন্যান্য' },
];

export const PAYMENT_METHODS: { id: string; label: string }[] = [
  { id: 'cash', label: 'নগদ (Cash)' },
  { id: 'bkash', label: 'বিকাশ (bKash)' },
  { id: 'nagad', label: 'নগদ (Nagad App)' },
  { id: 'rocket', label: 'রকেট (Rocket)' },
  { id: 'bank', label: 'ব্যাংক একাউন্ট' },
  { id: 'other', label: 'অন্যান্য মাধ্যম' },
];

export function getPaymentMethodLabel(method: string): string {
  const found = PAYMENT_METHODS.find((p) => p.id === method);
  return found ? found.label : method;
}

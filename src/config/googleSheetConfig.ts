/**
 * Google Sheet Configuration for Public View "সংগঠনের সদস্যবৃন্দ" (Organizational Members) Section.
 * 
 * IMPORTANT REQUIREMENTS:
 * - This Google Sheet is strictly read-only and used ONLY to display
 *   organizational member names and positions on the Public View.
 * - It is completely separated from the Supabase financial database and members table.
 * - Expected Columns in the Google Sheet:
 *   1. Name (সদস্যের নাম)
 *   2. Position (পদবী)
 *   3. Display Order (প্রদর্শনের ক্রম, যেমন: 1, 2, 3...)
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet with columns: Name | Position | Display Order
 * 2. Click File -> Share -> "Publish to web" -> Choose format as CSV (or share as "Anyone with the link can view").
 * 3. Replace the placeholder GOOGLE_SHEET_URL_PLACEHOLDER below (or set VITE_PUBLIC_ORG_MEMBERS_SHEET_URL in your environment).
 */

export const GOOGLE_SHEET_URL_PLACEHOLDER = 'GOOGLE_SHEET_URL_PLACEHOLDER';

export const GOOGLE_SHEET_CONFIG = {
  // Current configured URL or placeholder (never fetch when equal to placeholder)
  sheetUrl: (import.meta.env.VITE_PUBLIC_ORG_MEMBERS_SHEET_URL as string) || GOOGLE_SHEET_URL_PLACEHOLDER,

  // Bengali Labels
  sectionTitle: 'সংগঠনের সদস্যবৃন্দ',
  sectionSubtitle: 'আশেকানে গাউছিয়া ইসলামিক সংগঠনের পরিচালনা পর্ষদ ও দায়িত্বশীল সদস্যবৃন্দ',
};

/**
 * Returns true only if the Google Sheet URL is a valid, real URL and not the placeholder.
 */
export function isGoogleSheetConfigured(url: string = GOOGLE_SHEET_CONFIG.sheetUrl): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed === '' || trimmed === GOOGLE_SHEET_URL_PLACEHOLDER) {
    return false;
  }
  if (trimmed.includes('GOOGLE_SHEET_URL_PLACEHOLDER')) {
    return false;
  }
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

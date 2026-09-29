import { GOOGLE_SHEET_CONFIG, isGoogleSheetConfigured } from '../config/googleSheetConfig';

export interface OrgMember {
  name: string;
  position: string;
  displayOrder?: number | null;
  sheetIndex: number;
}

export interface FetchOrgMembersResult {
  isConfigured: boolean;
  members: OrgMember[];
  error: string | null;
}

/**
 * Normalizes Google Sheet URLs into a production-safe, CORS-friendly CSV endpoint.
 *
 * Supported formats:
 * 1. Published to web CSV:
 *    https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv
 *    https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=0&single=true&output=csv
 * 2. Published to web HTML (/pubhtml or /pub without output=csv):
 *    Auto-converts to /pub?output=csv
 * 3. Standard Google Sheet view/edit URL:
 *    https://docs.google.com/spreadsheets/d/{ID}/edit#gid=0
 *    Auto-converts to Google Visualization CSV endpoint (which allows browser CORS):
 *    https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:csv
 */
export function normalizeGoogleSheetUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // 1. If it's a published Google Sheet link (/spreadsheets/d/e/2PACX-...)
  if (trimmed.includes('/spreadsheets/d/e/')) {
    // If it's pubhtml, replace with pub
    let url = trimmed.replace(/\/pubhtml([?#].*)?$/, '/pub$1');

    // Ensure output=csv parameter is present
    if (!url.includes('output=csv')) {
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}output=csv`;
    }
    return url;
  }

  // 2. If it's already an explicit CSV endpoint, keep as is
  if (trimmed.includes('output=csv') || trimmed.includes('format=csv') || trimmed.includes('out:csv')) {
    return trimmed;
  }

  // 3. If it's a standard Google Sheet ID (/spreadsheets/d/{SHEET_ID}/...)
  // In client-side production (Netlify), Google's /export?format=csv triggers CORS issues.
  // Google's /gviz/tq?tqx=out:csv supports CORS with Access-Control-Allow-Origin: *
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    const gidMatch = trimmed.match(/[?&#]gid=([0-9]+)/);
    const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gidParam}`;
  }

  return trimmed;
}

/**
 * Safely parses CSV text, handling quotes, commas within quotes, CRLF, and Bengali UTF-8 text.
 */
function parseCSV(text: string): string[][] {
  const cleanText = text.replace(/^\uFEFF/, ''); // Strip BOM if present
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n of \r\n
      }
      currentRow.push(currentField.trim());
      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Fetches and parses organizational members from the published Google Sheet CSV.
 * - Completely read-only
 * - No credentials exposed
 * - No Supabase or financial data touched
 * - Safe AbortController timeout
 * - No localStorage, sessionStorage, or IndexedDB used
 */
export async function fetchOrgMembersFromGoogleSheet(
  customUrl?: string
): Promise<FetchOrgMembersResult> {
  const urlToUse = customUrl || GOOGLE_SHEET_CONFIG.sheetUrl;

  // 1. Safety check: Never attempt to fetch when unconfigured or placeholder
  if (!isGoogleSheetConfigured(urlToUse)) {
    return {
      isConfigured: false,
      members: [],
      error: null,
    };
  }

  const normalizedUrl = normalizeGoogleSheetUrl(urlToUse);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s safe timeout

    const response = await fetch(normalizedUrl, {
      method: 'GET',
      headers: {
        Accept: 'text/csv, text/plain, */*',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`গুগল শিট সার্ভার প্রতিক্রিয়া দেয়নি (${response.status}: ${response.statusText})`);
    }

    const csvText = await response.text();
    if (!csvText || !csvText.trim()) {
      return {
        isConfigured: true,
        members: [],
        error: null,
      };
    }

    // Safety: If the response is an HTML login/error page rather than CSV
    if (csvText.trim().startsWith('<!DOCTYPE html') || csvText.trim().startsWith('<html')) {
      throw new Error('প্রদত্ত লিংকটি সরাসরি CSV ফরম্যাটের নয়। গুগল শিট থেকে File -> Share -> "Publish to web" করে CSV লিংক নির্বাচন করুন।');
    }

    const rows = parseCSV(csvText);
    if (rows.length < 2) {
      // Empty sheet or only header row
      return {
        isConfigured: true,
        members: [],
        error: null,
      };
    }

    // Identify columns dynamically from header row
    const header = rows[0].map((h) => h.toLowerCase().trim());

    let nameIdx = header.findIndex(
      (h) => h.includes('name') || h.includes('নাম') || h.includes('সদস্য')
    );
    let positionIdx = header.findIndex(
      (h) =>
        h.includes('position') ||
        h.includes('পদবী') ||
        h.includes('পদবি') ||
        h.includes('পদ') ||
        h.includes('role') ||
        h.includes('designation') ||
        h.includes('দায়িত্ব') ||
        h.includes('দায়িত্ব')
    );
    let orderIdx = header.findIndex(
      (h) =>
        h.includes('order') ||
        h.includes('display') ||
        h.includes('ক্রম') ||
        h.includes('সিরিয়াল') ||
        h.includes('সিরিয়াল') ||
        h.includes('নম্বর') ||
        h.includes('sort')
    );

    // Fallback column positions if header text is custom: 0 = Name, 1 = Position, 2 = Display Order
    if (nameIdx === -1) nameIdx = 0;
    if (positionIdx === -1) positionIdx = 1;
    if (orderIdx === -1) orderIdx = 2;

    const dataRows = rows.slice(1);
    const parsedMembers: OrgMember[] = [];

    dataRows.forEach((row, rowIndex) => {
      const name = (row[nameIdx] || '').trim();
      const position = (row[positionIdx] || '').trim();
      const rawOrder = row[orderIdx] !== undefined ? row[orderIdx].trim() : '';

      // Skip blank rows where name is empty
      if (!name) return;

      let displayOrder: number | null = null;
      if (rawOrder !== '') {
        const parsed = parseInt(rawOrder, 10);
        if (!isNaN(parsed)) {
          displayOrder = parsed;
        }
      }

      parsedMembers.push({
        name,
        position: position || 'সদস্য',
        displayOrder,
        sheetIndex: rowIndex,
      });
    });

    // Requirement 14: Sort by Display Order when available; otherwise preserve the sheet order.
    parsedMembers.sort((a, b) => {
      const hasA = a.displayOrder !== null && a.displayOrder !== undefined;
      const hasB = b.displayOrder !== null && b.displayOrder !== undefined;

      if (hasA && hasB) {
        if (a.displayOrder !== b.displayOrder) {
          return (a.displayOrder as number) - (b.displayOrder as number);
        }
        return a.sheetIndex - b.sheetIndex;
      }
      if (hasA && !hasB) return -1;
      if (!hasA && hasB) return 1;
      return a.sheetIndex - b.sheetIndex;
    });

    return {
      isConfigured: true,
      members: parsedMembers,
      error: null,
    };
  } catch (err: any) {
    console.warn('Google Sheet CSV fetch notice:', err?.message || err);
    let errMsg = 'গুগল শিট থেকে সদস্য তালিকা লোড করা সম্ভব হয়নি।';
    if (err.name === 'AbortError') {
      errMsg = 'গুগল শিট সংযোগের সময় শেষ হয়েছে (Timeout)। অনুগ্রহ করে আবার চেষ্টা করুন।';
    } else if (err.message) {
      errMsg = err.message;
    }

    return {
      isConfigured: true,
      members: [],
      error: errMsg,
    };
  }
}

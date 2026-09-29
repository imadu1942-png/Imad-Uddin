import { GOOGLE_SHEET_CONFIG, isGoogleSheetConfigured } from '../config/googleSheetConfig';

export interface OrgMember {
  name: string;
  position: string;
  displayOrder: number;
}

export interface FetchOrgMembersResult {
  isConfigured: boolean;
  members: OrgMember[];
  error: string | null;
}

/**
 * Normalizes common Google Sheet URLs (e.g. view/edit link) to a direct CSV export endpoint.
 */
export function normalizeGoogleSheetUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // If already an export or gviz link, return as is
  if (trimmed.includes('output=csv') || trimmed.includes('format=csv') || trimmed.includes('out:csv')) {
    return trimmed;
  }

  // Handle standard https://docs.google.com/spreadsheets/d/{KEY}/edit...
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    // Check if gid is present
    const gidMatch = trimmed.match(/[?&#]gid=([0-9]+)/);
    const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`;
  }

  return trimmed;
}

/**
 * Parses CSV text safely handling quotes, newlines, and Bengali characters.
 */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

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
 * Fetches and parses organizational members from the configured Google Sheet.
 * If the URL is equal to the placeholder, it returns isConfigured: false immediately WITHOUT fetching.
 */
export async function fetchOrgMembersFromGoogleSheet(
  customUrl?: string
): Promise<FetchOrgMembersResult> {
  const urlToUse = customUrl || GOOGLE_SHEET_CONFIG.sheetUrl;

  // 1. Safety check: Never attempt to fetch the placeholder
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
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s safe timeout

    const response = await fetch(normalizedUrl, {
      method: 'GET',
      headers: {
        Accept: 'text/csv, text/plain, */*',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`গুগল শিট সার্ভার ত্রুটি (${response.status}: ${response.statusText})`);
    }

    const csvText = await response.text();
    if (!csvText || !csvText.trim()) {
      return {
        isConfigured: true,
        members: [],
        error: null,
      };
    }

    const rows = parseCSV(csvText);
    if (rows.length < 2) {
      // Either empty or just a header row
      return {
        isConfigured: true,
        members: [],
        error: null,
      };
    }

    // Identify column indices based on header row
    const header = rows[0].map((h) => h.toLowerCase().trim());
    
    let nameIdx = header.findIndex((h) =>
      h.includes('name') || h.includes('নাম') || h.includes('সদস্য')
    );
    let positionIdx = header.findIndex((h) =>
      h.includes('position') || h.includes('পদবী') || h.includes('পদবি') || h.includes('role') || h.includes('designation')
    );
    let orderIdx = header.findIndex((h) =>
      h.includes('order') || h.includes('ক্রম') || h.includes('সিরিয়াল') || h.includes('সিরিয়াল') || h.includes('sort')
    );

    // Default column fallback if headers not named specifically: 0 -> Name, 1 -> Position, 2 -> Order
    if (nameIdx === -1) nameIdx = 0;
    if (positionIdx === -1) positionIdx = 1;
    if (orderIdx === -1) orderIdx = 2;

    const dataRows = rows.slice(1);
    const parsedMembers: OrgMember[] = [];

    dataRows.forEach((row, rowIndex) => {
      const name = (row[nameIdx] || '').trim();
      const position = (row[positionIdx] || '').trim();
      const rawOrder = row[orderIdx] !== undefined ? row[orderIdx].trim() : '';

      // Skip rows with no name
      if (!name) return;

      let displayOrder = parseInt(rawOrder, 10);
      if (isNaN(displayOrder)) {
        displayOrder = rowIndex + 1;
      }

      parsedMembers.push({
        name,
        position: position || 'সদস্য',
        displayOrder,
      });
    });

    // Sort ascending by displayOrder
    parsedMembers.sort((a, b) => a.displayOrder - b.displayOrder);

    return {
      isConfigured: true,
      members: parsedMembers,
      error: null,
    };
  } catch (err: any) {
    console.warn('Google Sheet fetch note:', err?.message || err);
    let errMsg = 'গুগল শিট থেকে সদস্য তালিকা লোড করা সম্ভব হয়নি।';
    if (err.name === 'AbortError') {
      errMsg = 'গুগল শিট সংযোগের সময় শেষ হয়েছে (Timeout)। ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।';
    } else if (err.message && err.message.includes('গুগল শিট')) {
      errMsg = err.message;
    } else {
      errMsg = `গুগল শিট থেকে তথ্য সংগ্রহ করা যাচ্ছে না (${err?.message || 'অনুপলব্ধ'})। শিটটি "Anyone with the link can view" অথবা "Publish to web" করা আছে কিনা নিশ্চিত করুন।`;
    }

    return {
      isConfigured: true,
      members: [],
      error: errMsg,
    };
  }
}

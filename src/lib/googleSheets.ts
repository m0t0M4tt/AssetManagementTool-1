import { GoogleSpreadsheet } from 'google-spreadsheet';

const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;
const HEADER_ROW_INDEX = 2; // Row 3 (0-based index)

let docInstance: GoogleSpreadsheet | null = null;
let currentToken: string | null = null;

export async function getGoogleSheetDoc(accessToken: string) {
  if (docInstance && currentToken === accessToken) {
    return docInstance;
  }

  if (!SHEET_ID) {
    throw new Error('Missing VITE_GOOGLE_SHEET_ID in environment variables');
  }

  if (!accessToken) {
    throw new Error('Access token is required');
  }

  currentToken = accessToken;

  const doc = new GoogleSpreadsheet(SHEET_ID, {
    token: accessToken,
  });

  try {
    await doc.loadInfo();
    docInstance = doc;
    return doc;
  } catch (error) {
    if (error instanceof Error && error.message.includes('401')) {
      throw new Error('TOKEN_EXPIRED');
    }
    throw error;
  }
}

export async function getSheetWithCustomHeader(
  accessToken: string,
  tabName: string
) {
  const doc = await getGoogleSheetDoc(accessToken);
  const sheet = doc.sheetsByTitle[tabName];

  if (!sheet) {
    throw new Error(`Sheet tab "${tabName}" not found`);
  }

  try {
    // Load cells up to column BJ (column 61) to include all provisioning data
    await sheet.loadCells('A1:BJ500');

    // Load headers but make them unique by appending suffixes to duplicates
    await sheet.loadCells(`A${HEADER_ROW_INDEX + 1}:BJ${HEADER_ROW_INDEX + 1}`);

    const headerRow = HEADER_ROW_INDEX;
    const rawHeaders: string[] = [];
    const headerCounts = new Map<string, number>();

    // Read raw headers and make duplicates unique
    for (let col = 0; col < 62; col++) {
      const cell = sheet.getCell(headerRow, col);
      let headerValue = cell.value?.toString().trim() || `Column_${col}`;

      // If this header already exists, append a suffix
      if (headerCounts.has(headerValue)) {
        const count = headerCounts.get(headerValue)! + 1;
        headerCounts.set(headerValue, count);
        // Modify the cell value to make it unique
        cell.value = `${headerValue}_${count}`;
        rawHeaders.push(`${headerValue}_${count}`);
      } else {
        headerCounts.set(headerValue, 1);
        rawHeaders.push(headerValue);
      }
    }

    // Now load the header row with unique values
    await sheet.loadHeaderRow(HEADER_ROW_INDEX);

    console.log(`[${tabName}] Headers from Row 3 (count: ${rawHeaders.length}):`, rawHeaders.slice(0, 15));
    console.log(`[${tabName}] Provisioning headers (AM-BJ):`, rawHeaders.slice(38, 62));

    return sheet;
  } catch (error) {
    console.error(`Error loading header row for tab "${tabName}":`, error);
    throw error;
  }
}

export async function clearDocCache() {
  docInstance = null;
  currentToken = null;
}

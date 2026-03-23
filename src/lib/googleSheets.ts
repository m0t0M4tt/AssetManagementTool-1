import { GoogleSpreadsheet } from 'google-spreadsheet';

const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;
const HEADER_ROW_INDEX = 2; // Row 3 (0-based index)

let docInstance: GoogleSpreadsheet | null = null;
let currentToken: string | null = null;

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 1,
  backoffMs: number = 2000
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const is429Error = error?.message?.includes('429') ||
                       error?.response?.status === 429 ||
                       error?.code === 429;

    if (is429Error && retries > 0) {
      console.warn(`Rate limit hit (429). Retrying in ${backoffMs}ms... (${retries} retries left)`);
      await delay(backoffMs);
      return retryWithBackoff(fn, retries - 1, backoffMs * 2);
    }
    throw error;
  }
}

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
    await retryWithBackoff(() => doc.loadInfo());
    docInstance = doc;
    return doc;
  } catch (error) {
    if (error instanceof Error && error.message.includes('401')) {
      throw new Error('TOKEN_EXPIRED');
    }
    throw error;
  }
}

export async function getSheetDataConsolidated(
  accessToken: string,
  tabName: string
): Promise<{ headers: string[]; rows: any[][] }> {
  const doc = await getGoogleSheetDoc(accessToken);
  const sheet = doc.sheetsByTitle[tabName];

  if (!sheet) {
    throw new Error(`Sheet tab "${tabName}" not found`);
  }

  try {
    // SINGLE API CALL: Load all cells from A1:BJ500 in one request
    await retryWithBackoff(() => sheet.loadCells('A1:BJ500'));

    // Extract headers from Row 3 (index 2)
    const headers: string[] = [];
    const headerRowIndex = HEADER_ROW_INDEX;

    for (let col = 0; col < 62; col++) { // Columns A-BJ (0-61)
      const cell = sheet.getCell(headerRowIndex, col);
      headers.push(cell.value?.toString() || '');
    }

    // Extract all data rows (starting from Row 4, index 3)
    const rows: any[][] = [];
    for (let row = headerRowIndex + 1; row < sheet.rowCount && row < 500; row++) {
      const rowData: any[] = [];
      let hasData = false;

      for (let col = 0; col < 62; col++) { // Columns A-BJ (0-61)
        const cell = sheet.getCell(row, col);
        const value = cell.value;
        rowData.push(value);
        if (value) hasData = true;
      }

      // Only include rows that have at least some data
      if (hasData) {
        rows.push(rowData);
      }
    }

    console.log(`[${tabName}] Loaded ${headers.length} headers and ${rows.length} data rows in SINGLE request`);

    return { headers, rows };
  } catch (error) {
    console.error(`Error loading data for tab "${tabName}":`, error);
    throw error;
  }
}

// Legacy function for backward compatibility (provisioning service)
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
    // Load cells for all columns including provisioning
    await retryWithBackoff(() => sheet.loadCells('A1:BJ500'));

    // Load headers
    await sheet.loadHeaderRow(HEADER_ROW_INDEX);

    const headers = sheet.headerValues;
    console.log(`[${tabName}] Headers from Row 3 (count: ${headers.length}):`, headers.slice(0, 10));

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

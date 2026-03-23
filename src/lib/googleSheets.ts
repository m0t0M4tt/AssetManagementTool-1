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
    await sheet.loadHeaderRow(HEADER_ROW_INDEX);

    // Debug: Log first 5 headers from Row 3
    const headers = sheet.headerValues.slice(0, 5);
    console.log(`[${tabName}] Headers from Row 3:`, headers);

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

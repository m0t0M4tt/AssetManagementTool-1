import { GoogleSpreadsheet } from 'google-spreadsheet';

const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;

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

export async function clearDocCache() {
  docInstance = null;
  currentToken = null;
}

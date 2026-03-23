import { GoogleSpreadsheet } from 'google-spreadsheet';

const SHEET_ID = import.meta.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL = import.meta.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = import.meta.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

let docInstance: GoogleSpreadsheet | null = null;

export async function getGoogleSheetDoc() {
  if (docInstance) {
    return docInstance;
  }

  if (!SHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
    throw new Error('Missing Google Sheets credentials in environment variables');
  }

  const doc = new GoogleSpreadsheet(SHEET_ID, {
    token: async () => {
      return await getAccessToken();
    }
  });

  await doc.loadInfo();
  docInstance = doc;
  return doc;
}

async function getAccessToken(): Promise<string> {
  const jwtHeader = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const jwtClaim = {
    iss: SERVICE_ACCOUNT_EMAIL,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const base64UrlEncode = (str: string): string => {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(jwtHeader));
  const claimEncoded = base64UrlEncode(JSON.stringify(jwtClaim));
  const signatureInput = `${headerEncoded}.${claimEncoded}`;

  const privateKeyPem = PRIVATE_KEY!;
  const keyData = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureBase64 = base64UrlEncode(
    String.fromCharCode.apply(null, signatureArray as any)
  );

  const jwt = `${signatureInput}.${signatureBase64}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to obtain access token');
  }

  const data = await response.json();
  return data.access_token;
}

export async function clearDocCache() {
  docInstance = null;
}

import http, { RefinedResponse } from 'k6/http';
import { check, sleep } from 'k6';

type TokenBundle = {
  idToken: string;        // used in Authorization header
  refreshToken: string;   // used to refresh when idToken expires
  expiresAtMs: number;    // wall-clock expiry time (now + expiresIn)
  base: string;
  apiKey: string;
};

// Helper: login with email/password -> Firebase ID token
function firebaseSignInEmailPassword(baseApiKey: string, email?: string, password?: string): TokenBundle {
  if (!email || !password) {
    throw new Error('LOGIN_EMAIL and LOGIN_PASSWORD are required for Firebase auth');
  }
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${baseApiKey}`;
  const res: RefinedResponse<'text'> = http.post(
    url,
    JSON.stringify({ email, password, returnSecureToken: true }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(res, { 'firebase login 200': (r) => r.status === 200 });

  const body = JSON.parse(res.body as string);
  const now = Date.now();
  const expiresInSec = parseInt(body.expiresIn || '3600', 10);

  return {
    idToken: body.idToken as string,
    refreshToken: body.refreshToken as string,
    expiresAtMs: now + (expiresInSec - 60) * 1000, // refresh 60s before expiry
    base: __ENV.BASE_URL || 'http://10.0.0.64:5001',
    apiKey: baseApiKey,
  };
}

// Helper: refresh an expired/near-expiry ID token
function firebaseRefreshIdToken(apiKey: string, refreshToken: string): { idToken: string; refreshToken: string; expiresAtMs: number } {
  const url = `https://securetoken.googleapis.com/v1/token?key=${apiKey}`;
  const res = http.post(
    url,
    // x-www-form-urlencoded
    `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  check(res, { 'firebase refresh 200': (r) => r.status === 200 });

  const body = JSON.parse(res.body as string);
  const now = Date.now();
  const expiresInSec = parseInt(body.expires_in || '3600', 10);

  return {
    idToken: body.id_token as string,
    refreshToken: body.refresh_token as string,
    expiresAtMs: now + (expiresInSec - 60) * 1000,
  };
}

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<400'],
  },
  stages: [
    { duration: '1m', target: 20 },
    { duration: '2m', target: 20 },
    { duration: '1m', target: 80 },
    { duration: '2m', target: 80 },
    { duration: '20s', target: 150 },
    { duration: '1m', target: 0 },
  ],
};

export function setup(): TokenBundle {
  const apiKey = __ENV.FIREBASE_API_KEY;
  if (!apiKey) throw new Error('FIREBASE_API_KEY env var is required');

  return firebaseSignInEmailPassword(apiKey, __ENV.LOGIN_EMAIL, __ENV.LOGIN_PASSWORD);
}

export default function (state: TokenBundle) {
  // Refresh token if close to expiry (useful for long tests)
  if (Date.now() > state.expiresAtMs) {
    const r = firebaseRefreshIdToken(state.apiKey, state.refreshToken);
    state.idToken = r.idToken;
    state.refreshToken = r.refreshToken;
    state.expiresAtMs = r.expiresAtMs;
  }

  // 🔁 Hit a real read endpoint (adjust path & query for your API)
  const res = http.get(`${state.base}/api/my-listings`, {
    headers: { Authorization: `Bearer ${state.idToken}` },
  });

  check(res, {
    '200 OK': (r) => r.status === 200,
    // Add lightweight response checks if you want:
    // 'has body': (r) => (r.body || '').length > 0,
  });

  sleep(1);
}

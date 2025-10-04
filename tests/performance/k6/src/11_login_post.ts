import http, { RefinedResponse } from 'k6/http';
import { check, sleep } from 'k6';

type SetupData = { token: string; base: string };

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<400']
  },
  stages: [
    { duration: '2m', target: 50 },
    { duration: '2m', target: 150 },
    { duration: '1m', target: 300 },
    { duration: '1m', target: 0 }
  ]
};

export function setup(): SetupData {
  const base = __ENV.BASE_URL || 'http://10.0.0.64:5001';

  // 🔐 Adjust to your real login route and response shape
  const loginBody = JSON.stringify({
    email: __ENV.LOGIN_EMAIL,
    password: __ENV.LOGIN_PASSWORD
  });

  const res: RefinedResponse<'text'> = http.post(`${base}/api/auth/login`, loginBody, {
    headers: { 'Content-Type': 'application/json' }
  });

  check(res, { 'login 200': (r) => r.status === 200 });

  // If your API returns { token: "..." }
  const token = JSON.parse(res.body as string).token as string;
  return { token, base };
}

export default function (data: SetupData) {
  // 🔧 Adjust to the real POST you want to load test
  const body = JSON.stringify({
    title: 'perf',
    price: Math.floor(Math.random() * 1000),
    location: 'staging'
  });

  const r = http.post(`${data.base}/api/listings`, body, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` }
  });

  check(r, { created: (x) => x.status === 201 || x.status === 200 });
  sleep(1);
}

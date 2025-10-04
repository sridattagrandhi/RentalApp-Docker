import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = { vus: 1, duration: '30s' };

export default function () {
  const base = __ENV.BASE_URL || 'http://10.0.0.64:5001';
  const res = http.get(`${base}/health`);
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}

import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 30,
  duration: '30m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<400']
  }
};

export default function () {
  const base = __ENV.BASE_URL || 'http://10.0.0.64:5001';
  http.get(`${base}/health`);
  sleep(1);
}

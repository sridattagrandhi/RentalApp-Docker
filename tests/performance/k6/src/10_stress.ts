import http from 'k6/http';
import { check, sleep } from 'k6';

// Define thresholds and stages as before
export const options = {
  thresholds: {
    // You might need to adjust these thresholds once the test runs successfully
    http_req_failed: ['rate<0.01'],   // <1% errors
    http_req_duration: ['p(95)<300']  // 95% under 300ms
  },
  stages: [
    { duration: '1m', target: 20 },   // warm up
    { duration: '2m', target: 20 },   // hold
    { duration: '1m', target: 80 },   // push
    { duration: '2m', target: 80 },   // hold
    { duration: '20s', target: 200 }, // spike
    { duration: '1m', target: 0 }     // cool down
  ]
};

// =================================================================
// REVISED DEFAULT FUNCTION FOR AUTHENTICATION FLOW
// =================================================================
export default function () {
  const base = __ENV.BASE_URL || 'http://10.0.0.64:5001';
  
  // NOTE 1: YOU MUST SET THESE ENVIRONMENT VARIABLES
  const username = __ENV.USERNAME; 
  const password = __ENV.PASSWORD;
  
  // NOTE 2: REPLACE '/api/auth/login' with your app's actual login endpoint 
  // This endpoint should take username/password and return a Firebase ID Token.
  const loginUrl = `${base}/api/auth/login`; 

  // 1. LOGIN (POST Request to get a fresh, valid token)
  const loginPayload = JSON.stringify({
    email: username, 
    password: password,
  });

  const loginRes = http.post(loginUrl, loginPayload, {
    tags: { name: 'Login' }, // Tag the request for clearer reporting
    headers: { 'Content-Type': 'application/json' },
  });

  // Check the login succeeded and extract the token
  check(loginRes, { 'Login 200 OK': (r) => r.status === 200 });

  // ASSUMPTION: Your login endpoint returns the token in the response body 
  // as a property named 'token'. Adjust 'token' if your field is different (e.g., 'idToken').
  const token = loginRes.json('token'); 

  // 2. PROTECTED RESOURCE ACCESS (GET Request using the token)
  if (token) {
    const res = http.get(`${base}/api/my-listings`, { 
      tags: { name: 'GetMyListings' }, // Tag the request for clearer reporting
      headers: { Authorization: `Bearer ${token}` },
    });
    
    // Check for success on the resource endpoint
    check(res, { 'Listings 200 OK': (r) => r.status === 200 });
  } else {
      console.error(`VU ${__VU}: Could not retrieve token from login response.`);
  }

  // Think time after the operation
  sleep(1); 
}
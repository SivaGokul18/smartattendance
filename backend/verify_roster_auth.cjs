const http = require('http');

const accounts = [
  { id: 'sivagokulc18@gmail.com', pass: 'student123', expected: 200, type: 'Student' },
  { id: 'aarav.sharma@campus.edu', pass: 'student123', expected: 200, type: 'Student' },
  { id: 'devika.n@campus.edu', pass: 'student123', expected: 200, type: 'Student' },
  { id: 'priya.patel@campus.edu', pass: 'student123', expected: 200, type: 'Student' },
  { id: 'kavya.iyer@campus.edu', pass: 'student123', expected: 200, type: 'Student' },
  { id: 'santhiya.m@campus.edu', pass: 'faculty123', expected: 200, type: 'Faculty' },
  { id: 'faculty@campus.edu', pass: 'faculty123', expected: 200, type: 'Faculty' },
  { id: 'anandhi@campus.edu', pass: 'faculty123', expected: 200, type: 'Faculty' },
  { id: 'rajesh@campus.edu', pass: 'faculty123', expected: 200, type: 'Faculty' },
  { id: 'admin@campus.edu', pass: 'admin123', expected: 200, type: 'Admin' },
  { id: 'intruder@external.org', pass: 'hacker123', expected: 403, type: 'Unauthorized' },
  { id: 'fake.student@gmail.com', pass: 'pass123', expected: 403, type: 'Unauthorized' },
  { id: 'sivagokulc18@gmail.com', pass: 'wrongpass', expected: 401, type: 'Wrong Password' }
];

async function testLogin(account) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({ identifier: account.id, password: account.pass });
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 8000,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', (err) => resolve({ status: 'ERR', error: err.message }));
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('--- EXCEL ROSTER LOGIN VERIFICATION SUITE ---');
  let passed = 0;
  for (const acc of accounts) {
    const result = await testLogin(acc);
    const pass = result.status === acc.expected;
    if (pass) {
      passed++;
      if (acc.expected === 200) {
        console.log(`[PASS] ${acc.type}: ${acc.id} -> 200 OK | Name: "${result.body.name}" | Role: ${result.body.role} | Mentor/Dept: ${result.body.mentorName || result.body.designation || result.body.department}`);
      } else {
        console.log(`[PASS] ${acc.type}: ${acc.id} -> ${result.status} | Detail: "${result.body.detail}"`);
      }
    } else {
      console.log(`[FAIL] ${acc.type}: ${acc.id} -> Expected ${acc.expected}, got ${result.status} | Body:`, result.body);
    }
  }
  console.log(`\nRESULTS: ${passed}/${accounts.length} TESTS PASSED`);
}

run();

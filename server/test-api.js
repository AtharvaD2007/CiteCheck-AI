import http from 'http';
import { DB } from './src/db.js';

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const duration = Date.now() - startTime;
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data), duration });
        } catch {
          resolve({ statusCode: res.statusCode, body: data, duration });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('   CiteCheck AI — End-to-End Test Suite');
  console.log('====================================================\n');

  // 1. Health check
  console.log('Test 1: Health & status check (/api/health)...');
  const healthRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5001,
    path: '/api/health',
    method: 'GET'
  });
  assert(healthRes.statusCode === 200, 'Health endpoint responds with 200');
  assert(healthRes.body.status === 'ok', 'Status is "ok"');
  console.log('  Health info:', healthRes.body);

  // 2. User registration (Instant non-blocking response)
  const testEmail = `scholar_${Date.now()}@cambridge.ac.uk`;
  const testPassword = 'AcademicPassword!2026';
  console.log(`\nTest 2: Register new user (${testEmail})...`);
  const registerRes = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      name: 'Dr. Jane Watson',
      email: testEmail,
      password: testPassword,
      role: 'Postdoctoral Fellow',
      institution: 'Cambridge University'
    }
  );

  console.log(`  Registration duration: ${registerRes.duration}ms`);
  assert(registerRes.statusCode === 200, 'Registration succeeded with code 200');
  assert(registerRes.duration < 300, `Registration is fast (< 300ms, actual: ${registerRes.duration}ms)`);
  assert(registerRes.body.success === true, 'Registration success flag is true');
  assert(registerRes.body.user.isVerified === true, 'Registered user is immediately active and verified (isVerified: true)');
  assert(Boolean(registerRes.body.token), 'Session token provided upon registration');
  const initialToken = registerRes.body.token;

  // 3. Duplicate registration prevention
  console.log('\nTest 3: Duplicate registration prevention with same email...');
  const duplicateRegisterRes = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      name: 'Duplicate Watson',
      email: testEmail,
      password: testPassword,
      role: 'Associate Professor',
      institution: 'Cambridge University'
    }
  );
  assert(duplicateRegisterRes.statusCode === 400, 'Duplicate registration rejected with 400');
  assert(duplicateRegisterRes.body.error.includes('already exists'), 'Clear error that account already exists');

  // 6. Test Login
  console.log('\nTest 6: Test Login with credentials...');
  const loginRes = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { email: testEmail, password: testPassword }
  );
  assert(loginRes.statusCode === 200, 'Login succeeded with code 200');
  assert(loginRes.body.user?.isVerified === true, 'Logged in user is verified');
  const activeToken = loginRes.body.token;

  // Test invalid login
  const badLoginRes = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { email: testEmail, password: 'WrongPassword' }
  );
  assert(badLoginRes.statusCode === 401, 'Invalid password returns 401 Unauthorized');

  // 7. Personal Reports (Clean empty state initially)
  console.log('\nTest 7: Personal Report Management (Initial empty state)...');
  const reportsRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5001,
    path: '/api/reports',
    method: 'GET',
    headers: { Authorization: `Bearer ${activeToken}` }
  });
  assert(reportsRes.statusCode === 200, 'Get reports returned 200');
  assert(Array.isArray(reportsRes.body.reports), 'Reports is an array');
  assert(reportsRes.body.reports.length === 0, 'Clean empty state: 0 reports initially for new user (no dummy records)');

  // 8. Save a personal report
  console.log('\nTest 8: Save a verified report for the user...');
  const saveReportRes = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/reports',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeToken}`
      }
    },
    {
      title: 'CRISPR-Cas9 Specificity Analysis',
      input: {
        claim: 'CRISPR-Cas9 endonuclease induces high-frequency off-target mutations.',
        citation: 'Doudna et al. (2014), Science',
        sourcePassage: 'Cas9 introduces double-stranded breaks at target sites with guide RNA complementarity.'
      },
      report: {
        result: 'Partially Supported',
        confidenceScore: 92,
        confidenceLevel: 'High',
        verdictSummary: 'The source notes target cleavage; off-target frequency varies by guide length.',
        evidenceQuotes: [
          {
            quote: 'Cas9 introduces double-stranded breaks at target sites with guide RNA complementarity.',
            relevance: 'Affirms primary cleavage mechanism.',
            alignment: 'supports'
          }
        ],
        detailedExplanation: 'Detailed peer evaluation comparing empirical off-target assays.',
        suggestions: ['Quantify specific off-target percentages.']
      }
    }
  );
  assert(saveReportRes.statusCode === 200, 'Report saved successfully with 200');
  const savedReportId = saveReportRes.body.report?.id;
  assert(Boolean(savedReportId), 'Saved report received a valid ID');

  // Check that the user now sees 1 report
  const updatedReportsRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5001,
    path: '/api/reports',
    method: 'GET',
    headers: { Authorization: `Bearer ${activeToken}` }
  });
  assert(updatedReportsRes.body.reports.length === 1, 'User now has exactly 1 personal report');

  // 9. Duplicate report prevention
  console.log('\nTest 9: Duplicate report prevention...');
  const duplicateSaveRes = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/reports',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeToken}`
      }
    },
    {
      title: 'CRISPR-Cas9 Specificity Analysis',
      input: {
        claim: 'CRISPR-Cas9 endonuclease induces high-frequency off-target mutations.',
        citation: 'Doudna et al. (2014), Science',
        sourcePassage: 'Cas9 introduces double-stranded breaks at target sites with guide RNA complementarity.'
      },
      report: {
        result: 'Partially Supported',
        confidenceScore: 92,
        confidenceLevel: 'High'
      }
    }
  );
  assert(duplicateSaveRes.statusCode === 200, 'Duplicate submission handled with 200');

  const dedupeCheckRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5001,
    path: '/api/reports',
    method: 'GET',
    headers: { Authorization: `Bearer ${activeToken}` }
  });
  assert(dedupeCheckRes.body.reports.length === 1, 'Duplicate was prevented: user still has exactly 1 report');
  assert(dedupeCheckRes.body.reports[0].id === savedReportId, 'Report ID remains consistent');

  // 10. Delete report
  console.log('\nTest 10: Delete personal report...');
  const deleteRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5001,
    path: `/api/reports/${savedReportId}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${activeToken}` }
  });
  assert(deleteRes.statusCode === 200, 'Report deleted successfully with 200');

  // 11. Test Logout
  console.log('\nTest 11: Test Logout...');
  const logoutRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5001,
    path: '/api/auth/logout',
    method: 'POST',
    headers: { Authorization: `Bearer ${activeToken}` }
  });
  assert(logoutRes.statusCode === 200, 'Logout succeeded with code 200');

  console.log('\n====================================================');
  console.log('   🎉 All CiteCheck AI End-to-End Tests Passed!');
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});

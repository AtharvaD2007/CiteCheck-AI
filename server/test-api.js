import http from 'http';

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
  console.log('   CiteCheck AI — MongoDB Atlas End-to-End Test Suite');
  console.log('====================================================\n');

  // 1. Health check & MongoDB Atlas status
  console.log('Test 1: Health & MongoDB database check (/api/health)...');
  const healthRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5001,
    path: '/api/health',
    method: 'GET'
  });
  assert(healthRes.statusCode === 200, 'Health endpoint responds with 200');
  assert(healthRes.body.status === 'ok', 'Status is "ok"');
  assert(healthRes.body.database?.type === 'MongoDB Atlas', 'Database type is MongoDB Atlas');
  assert(healthRes.body.database?.status === 'connected', 'Database status is connected');
  console.log('  Health info:', healthRes.body);

  // 2. User registration (Persisted in MongoDB)
  const testEmail = `scholar_${Date.now()}@cambridge.ac.uk`;
  const testPassword = 'AcademicPassword!2026';
  console.log(`\nTest 2: Register new user in MongoDB (${testEmail})...`);
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
  assert(registerRes.duration < 1500, `Registration is fast (< 1.5s over remote Atlas network, actual: ${registerRes.duration}ms)`);
  assert(registerRes.body.success === true, 'Registration success flag is true');
  assert(registerRes.body.user.isVerified === true, 'Registered user is immediately active and verified');
  assert(Boolean(registerRes.body.token), 'Session token provided upon registration');
  const userAToken = registerRes.body.token;
  const userAId = registerRes.body.user.id;

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

  // 4. Email verification functionality test
  console.log('\nTest 4: Email verification endpoints in MongoDB...');
  const resendRes = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/auth/resend-verification',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { email: testEmail }
  );
  assert(resendRes.statusCode === 200, 'Resend verification responded with 200');
  const verificationUrl = resendRes.body.emailResult?.verificationUrl;
  assert(Boolean(verificationUrl), 'Verification URL generated');
  const tokenMatch = verificationUrl.match(/verify_token=([a-f0-9]+)/);
  const verifyToken = tokenMatch ? tokenMatch[1] : null;
  assert(Boolean(verifyToken), 'Valid verification token extracted');

  const verifyRes = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/auth/verify-email',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { token: verifyToken }
  );
  assert(verifyRes.statusCode === 200, 'Verify email endpoint functions properly with 200');
  assert(verifyRes.body.user?.isVerified === true, 'User is verified in MongoDB');

  // 5. Test Login with credentials from MongoDB
  console.log('\nTest 5: Test Login with credentials...');
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
  assert(loginRes.body.user?.email === testEmail.toLowerCase(), 'User data retrieved correctly from MongoDB');
  const activeToken = loginRes.body.token;

  // Test invalid password
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

  // 6. Personal Reports (Clean empty state initially)
  console.log('\nTest 6: Personal Reports in MongoDB (Initial clean state)...');
  const reportsRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5001,
    path: '/api/reports',
    method: 'GET',
    headers: { Authorization: `Bearer ${activeToken}` }
  });
  assert(reportsRes.statusCode === 200, 'Get reports returned 200');
  assert(Array.isArray(reportsRes.body.reports), 'Reports is an array');
  assert(reportsRes.body.reports.length === 0, 'Clean empty state: 0 reports initially for new user');

  // 7. Save a personal report in MongoDB
  console.log('\nTest 7: Save a verified report into MongoDB...');
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

  // Verify that User A has 1 report
  const userAReportsRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5001,
    path: '/api/reports',
    method: 'GET',
    headers: { Authorization: `Bearer ${activeToken}` }
  });
  assert(userAReportsRes.body.reports.length === 1, 'User A has exactly 1 report in MongoDB');

  // 8. Strict User Isolation Verification (Requirement: Ensure each user can access only their own reports)
  console.log('\nTest 8: Strict User Isolation Verification (User B cannot see or delete User A reports)...');
  const userBEmail = `scholar_b_${Date.now()}@oxford.ac.uk`;
  const registerUserBRes = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      name: 'Dr. Arthur Conan',
      email: userBEmail,
      password: 'AcademicPassword!2026',
      role: 'Professor',
      institution: 'Oxford University'
    }
  );
  assert(registerUserBRes.statusCode === 200, 'User B registered successfully');
  const userBToken = registerUserBRes.body.token;

  // User B queries their reports
  const userBReportsRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5001,
    path: '/api/reports',
    method: 'GET',
    headers: { Authorization: `Bearer ${userBToken}` }
  });
  assert(userBReportsRes.body.reports.length === 0, 'User B reports library is isolated (sees 0 reports, cannot see User A reports)');

  // User B tries to delete User A's report
  const unauthorizedDeleteRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5001,
    path: `/api/reports/${savedReportId}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userBToken}` }
  });
  assert(unauthorizedDeleteRes.statusCode === 404, 'User B cannot delete User A report (returns 404 Not Found)');

  // 9. Duplicate report prevention
  console.log('\nTest 9: Duplicate report prevention in MongoDB...');
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
  assert(dedupeCheckRes.body.reports.length === 1, 'Duplicate was prevented: user still has exactly 1 report in MongoDB');
  assert(dedupeCheckRes.body.reports[0].id === savedReportId, 'Report ID remains consistent');

  // 10. Delete report
  console.log('\nTest 10: Delete personal report in MongoDB...');
  const deleteRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5001,
    path: `/api/reports/${savedReportId}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${activeToken}` }
  });
  assert(deleteRes.statusCode === 200, 'Report deleted successfully from MongoDB');

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
  console.log('   🎉 All CiteCheck AI MongoDB Tests Passed!');
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});

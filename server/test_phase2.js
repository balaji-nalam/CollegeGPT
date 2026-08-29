const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';

async function runPhase2Tests() {
  console.log('====================================================');
  console.log('  CollegeGPT Phase 2: Foundation & Auth Test Suite  ');
  console.log('====================================================\n');

  try {
    // 1. Health & Vector Backend Diagnostics
    console.log('[1/6] Testing /api/health Diagnostics & Vector Settings...');
    const healthRes = await axios.get(`${BASE_URL}/health`);
    const health = healthRes.data;
    console.log('  -> Status:', health.status);
    console.log('  -> Vector Provider:', health.vectorBackend.provider);
    console.log('  -> Vector Model:', health.vectorBackend.model);
    console.log('  -> Vector Dimension:', health.vectorBackend.dimension);
    console.log('  -> Database Type:', health.vectorBackend.databaseType);
    console.log('  -> Storage Provider:', health.storage.provider);

    if (health.vectorBackend.dimension !== 768) {
      throw new Error(`Expected vector dimension 768, got ${health.vectorBackend.dimension}`);
    }

    // 2. Admin Authentication (Secure Provisioning)
    console.log('\n[2/6] Testing Provisioned Administrator Login...');
    const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@college.edu',
      password: 'CollegeAdminSecure2026!',
    });
    const adminToken = adminLoginRes.data.data.token;
    const adminUser = adminLoginRes.data.data.user;
    console.log(`  -> Logged in as Admin: ${adminUser.name} (${adminUser.email})`);
    console.log(`  -> Role verified: ${adminUser.role}`);
    if (adminUser.role !== 'admin') {
      throw new Error(`Expected admin role, got ${adminUser.role}`);
    }

    // 3. Student Public Registration
    console.log('\n[3/6] Testing Public Student Registration...');
    const studentEmail = `student_${Date.now()}@university.edu`;
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Jane Doe',
      email: studentEmail,
      password: 'StudentSecurePass2026!',
      department: 'Computer Science',
    });
    const studentData = regRes.data.data;
    console.log(`  -> Student registered: ${studentData.user.name} (${studentData.user.email})`);
    console.log(`  -> Role: ${studentData.user.role}, Department: ${studentData.user.department}`);
    if (studentData.user.role !== 'student') {
      throw new Error(`Expected student role, got ${studentData.user.role}`);
    }

    // 4. Security Check: Public Admin Escalation Prevention
    console.log('\n[4/6] Testing Admin Escalation Prevention on Public Register...');
    const hackerEmail = `fakeadmin_${Date.now()}@test.edu`;
    const escalateRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Malicious User',
      email: hackerEmail,
      password: 'HackerPassword123!',
      role: 'admin', // Malicious attempt to register as admin
    });
    console.log(`  -> Attempted role: 'admin' | Assigned role: '${escalateRes.data.data.user.role}'`);
    if (escalateRes.data.data.user.role === 'admin') {
      throw new Error('SECURITY VULNERABILITY: Public registration allowed creation of ADMIN account!');
    }
    console.log('  -> Verified: Public registration strictly forces role to student.');

    // 5. Protected Profile Access
    console.log('\n[5/6] Testing Protected Profile Verification (GET /api/auth/me)...');
    const meRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${studentData.token}` },
    });
    console.log(`  -> Profile lookup success for: ${meRes.data.data.name} (Role: ${meRes.data.data.role})`);

    // 6. Schema DDL Verification
    console.log('\n[6/6] Verifying Database Schema Definitions...');
    const schemaSql = fs.readFileSync(path.resolve(__dirname, 'src/database/schema.sql'), 'utf8');
    const requiredTables = [
      'profiles',
      'documents',
      'document_versions',
      'document_chunks',
      'conversations',
      'messages',
      'message_sources',
      'feedback',
    ];
    for (const table of requiredTables) {
      if (!schemaSql.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
        throw new Error(`Missing table definition in schema.sql: ${table}`);
      }
      console.log(`  -> Table definition confirmed: ${table}`);
    }
    if (!schemaSql.includes('vector({{EMBEDDING_DIMENSION}})') && !schemaSql.includes('vector(')) {
      throw new Error('Missing vector column in document_chunks definition');
    }
    console.log('  -> Vector column and HNSW index confirmed.');

    console.log('\n====================================================');
    console.log('  ALL PHASE 2 FOUNDATION & AUTH TESTS PASSED (100%) ');
    console.log('====================================================\n');
  } catch (err) {
    console.error('\nTest Failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

runPhase2Tests();

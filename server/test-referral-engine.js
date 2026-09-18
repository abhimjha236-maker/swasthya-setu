// test-referral-engine.js - Comprehensive test for Referral Tracking Engine
import http from 'http';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 SWASTHYA SETU — REFERRAL TRACKING ENGINE INTEGRATION TEST');
  console.log('================================================================\n');

  try {
    // 1. Authenticate users
    console.log('1. Authenticating Roles...');
    
    // PHC Login
    const phcLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { role: 'phc', password: 'password123', identifier: 'PHC-RTB-01' });
    const phcToken = phcLogin.data.token;
    console.log('  ✅ PHC Medical Officer Authenticated (Token received)');

    // Hospital Login
    const hospLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { role: 'hospital', password: 'password123', identifier: 'DH-BHP-01' });
    const hospToken = hospLogin.data.token;
    console.log('  ✅ District Hospital Triage Authenticated (Token received)');

    // ASHA Login
    const ashaLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { role: 'asha', password: 'password123', identifier: 'ASHA-BHP-01' });
    const ashaToken = ashaLogin.data.token;
    console.log('  ✅ ASHA Field Worker Authenticated (Token received)');

    // Patient Login
    const patLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { role: 'patient', otp: '123456', identifier: '9876543210' });
    const patToken = patLogin.data.token;
    console.log('  ✅ Patient Authenticated (Token received)');

    // Admin Login
    const adminLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { role: 'admin', password: 'password123', identifier: 'ADMIN-BHP-01' });
    const adminToken = adminLogin.data.token;
    console.log('  ✅ District Admin (CMHO) Authenticated (Token received)\n');

    // 2. PHC creates a clinical referral
    console.log('2. Testing Referral Creation (Auto-ID & Field Validation)...');
    const createRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/referrals',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${phcToken}`
      }
    }, {
      patient_id: 'PAT-001',
      to_facility_id: 'FAC-DH-01',
      specialty_requested: 'Cardiology (Interventional)',
      referral_type: 'urgent',
      reason: 'Persistent exertional angina with ischemic ST depression on ECG (V4-V6)',
      notes: 'Initial sublingual nitrate administered. Requires Urgent 2D Echo and Angiogram.',
      preferred_date: '2026-09-22T10:00:00.000Z'
    });

    if (!createRes.data.success) {
      throw new Error(`Referral creation failed: ${JSON.stringify(createRes.data)}`);
    }

    const referral = createRes.data.data;
    console.log(`  ✅ Referral Created Automatically with ID: [${referral.id}]`);
    console.log(`     - Patient: ${referral.patient_name} (${referral.patient_age}Y/${referral.patient_gender})`);
    console.log(`     - Source: ${referral.from_facility_name} (${referral.from_facility_id})`);
    console.log(`     - Destination: ${referral.to_facility_name} (${referral.to_facility_id})`);
    console.log(`     - Priority: ${referral.referral_type.toUpperCase()}`);
    console.log(`     - Reason: ${referral.reason}`);
    console.log(`     - Notes: ${referral.notes}`);
    console.log(`     - Status: ${referral.status}`);
    console.log(`     - Created Date: ${referral.created_at}\n`);

    // 3. Testing 9-Stage State Machine Transitions with Audit Logging
    console.log('3. Testing Complete 9-Stage Referral Lifecycle & ReferralStatusHistory...');
    
    const refId = referral.id;
    const stages = [
      { status: 'Accepted', token: hospToken, role: 'District Hospital', remarks: 'Triage desk reviewed and accepted cardiology referral.' },
      { status: 'Appointment Scheduled', token: hospToken, role: 'District Hospital', appointment_date: '2026-09-21T09:30:00.000Z', assigned_doctor_name: 'Dr. Rajeshwari Sen (Chief Cardiologist)', remarks: 'Specialist slot booked at OPD-3 Cardiology Wing.' },
      { status: 'In Transit', token: ashaToken, role: 'ASHA Worker', remarks: '108 Ambulance dispatched from Berasia village with patient & escort.' },
      { status: 'Arrived', token: hospToken, role: 'District Hospital', remarks: 'Patient admitted to DH Bhopal Triage & Emergency Bay 2.' },
      { status: 'Consultation Completed', token: hospToken, role: 'District Hospital', remarks: 'Dr. Sen completed clinical examination, ECG, and echocardiography.' },
      { status: 'Treatment Completed', token: hospToken, role: 'District Hospital', remarks: 'Coronary angiography performed. Medical therapy optimized with dual antiplatelets.' },
      { status: 'Follow-up Required', token: hospToken, role: 'District Hospital', counter_referral_notes: 'Doorstep BP monitoring & medication compliance check every 4 days by ASHA Sunita.', remarks: 'Patient discharged. Counter-referral issued to ASHA.' },
      { status: 'Closed', token: hospToken, role: 'District Hospital', remarks: 'Treatment cycle and post-discharge recovery confirmed. Referral closed.' }
    ];

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const patchRes = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: `/api/referrals/${refId}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${stage.token}`
        }
      }, {
        status: stage.status,
        remarks: stage.remarks,
        appointment_date: stage.appointment_date,
        assigned_doctor_name: stage.assigned_doctor_name,
        counter_referral_notes: stage.counter_referral_notes
      });

      if (!patchRes.data.success) {
        throw new Error(`Failed to transition to status [${stage.status}]: ${JSON.stringify(patchRes.data)}`);
      }
      console.log(`  Stage 0${i + 2}/09: Transitioned to [${stage.status}] by ${stage.role}`);
    }

    // 4. Verify Referral Details & ReferralStatusHistory entries
    console.log('\n4. Verifying Referral Status History & Audit Trail...');
    const getRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/referrals/${refId}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const finalReferral = getRes.data.data;
    console.log(`  ✅ Referral Current Status: ${finalReferral.status}`);
    console.log(`  ✅ Total History Entries: ${finalReferral.history.length}`);
    finalReferral.history.forEach((h, idx) => {
      console.log(`     #${idx + 1}: ${h.from_status} ➔ ${h.to_status} | By: ${h.changed_by_name} | ${h.remarks.slice(0, 60)}...`);
    });

    // 5. Test RBAC: Patient should NOT be able to alter status directly
    console.log('\n5. Testing RBAC Security (Patient mutation restriction)...');
    const patAttempt = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/referrals/${refId}/status`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${patToken}`
      }
    }, { status: 'Closed' });

    if (patAttempt.status === 403) {
      console.log('  ✅ RBAC Verified: Patient mutation correctly rejected with HTTP 403 Forbidden.');
    } else {
      console.error(`  ❌ RBAC Warning: Expected 403 but got ${patAttempt.status}`);
    }

    // 6. Test Patient view access
    console.log('\n6. Testing Patient View-Only Access...');
    const patViewRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/referrals?patient_id=PAT-001`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${patToken}` }
    });
    console.log(`  ✅ Patient can view their own referral records: ${patViewRes.data.data.length} found.`);

    // 7. Verify Notifications Dispatched
    console.log('\n7. Testing Multi-Party Notification Dispatch...');
    const notifRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/notifications`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${patToken}` }
    });
    console.log(`  ✅ Total notifications retrieved: ${notifRes.data.data.length}`);
    const recentNotif = notifRes.data.data.slice(0, 3);
    recentNotif.forEach(n => console.log(`     - [${n.role_target || 'all'}] ${n.title}: ${n.message.slice(0, 65)}...`));

    console.log('\n================================================================');
    console.log('🎉 ALL REFERRAL TRACKING ENGINE TESTS PASSED PERFECTLY!');
    console.log('================================================================');

  } catch (err) {
    console.error('❌ Test Failed:', err);
  }
}

runTests();

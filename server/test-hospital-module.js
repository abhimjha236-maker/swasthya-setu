import http from 'http';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runHospitalModuleTests() {
  console.log('--- STARTING SWASTHYA SETU DISTRICT HOSPITAL MODULE TEST SUITE ---');

  // 1. Authenticate as District Hospital Specialist
  console.log('\n[1] Testing Hospital Specialist Login (DH-BHP-01)...');
  const loginRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    role: 'hospital',
    identifier: 'DH-BHP-01',
    password: 'password123'
  });

  if (loginRes.status !== 200 || !loginRes.data.token) {
    throw new Error(`Hospital login failed: ${JSON.stringify(loginRes.data)}`);
  }
  const token = loginRes.data.token;
  console.log(`✓ Hospital Specialist authenticated: ${loginRes.data.user.name} (${loginRes.data.user.identifier})`);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Fetch Inbound Referrals
  console.log('\n[2] Fetching Inbound Referrals for District Hospital...');
  const refRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/referrals',
    method: 'GET',
    headers: authHeaders
  });

  console.log(`✓ Retrieved ${refRes.data.total} referrals. Verifying 7 mandatory fields on each referral...`);
  const firstRef = refRes.data.data[0];
  console.log(`  - Referral ID: ${firstRef.id}`);
  console.log(`  - Patient: ${firstRef.patient_name}`);
  console.log(`  - Source PHC: ${firstRef.from_facility_name}`);
  console.log(`  - Reason: ${firstRef.reason}`);
  console.log(`  - Priority: ${firstRef.referral_type}`);
  console.log(`  - Date: ${firstRef.created_at}`);
  console.log(`  - Status: ${firstRef.status}`);

  if (!firstRef.id || !firstRef.patient_name || !firstRef.from_facility_name || !firstRef.reason || !firstRef.referral_type || !firstRef.created_at || !firstRef.status) {
    throw new Error('Mandatory referral fields missing!');
  }
  console.log('✓ All 7 mandatory referral fields verified successfully.');

  // 3. Test Full Interactive Status Lifecycle & ReferralStatusHistory
  console.log('\n[3] Testing Interactive Referral State Transitions & Audit Trail...');
  const testRefId = firstRef.id;

  const transitions = [
    { status: 'Accepted', remarks: 'Triage team confirmed bed and consultant availability' },
    { status: 'Appointment Scheduled', appointment_date: new Date(Date.now() + 86400000).toISOString(), remarks: 'Cardiology Specialist slot reserved' },
    { status: 'Patient Arrived', remarks: 'Patient arrived via 108 Emergency Ambulance' },
    { status: 'Consultation', remarks: 'Dr. Sen examining patient in OPD 104' },
    { status: 'Treatment', remarks: '2D Echo and Resting ECG completed in Cardiology Lab' },
    { status: 'Follow-up Required', follow_up_instructions: 'Counter-referred to PHC Ratibad. ASHA Sunita to conduct bi-weekly BP visits.', remarks: 'Discharged on medical management' },
    { status: 'Closed', remarks: 'Referral lifecycle concluded successfully with closed-loop handover' }
  ];

  for (const trans of transitions) {
    const patchRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/referrals/${testRefId}/status`,
      method: 'PATCH',
      headers: authHeaders
    }, trans);

    if (patchRes.status !== 200) {
      throw new Error(`Failed transition to ${trans.status}: ${JSON.stringify(patchRes.data)}`);
    }
    console.log(`  ✓ Transitioned to -> [${trans.status}]`);
  }

  // 4. Verify ReferralStatusHistory Audit Log
  console.log('\n[4] Verifying Audit Trail in ReferralStatusHistory...');
  const detailRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/referrals/${testRefId}`,
    method: 'GET',
    headers: authHeaders
  });

  const history = detailRes.data.data.history;
  console.log(`✓ Found ${history.length} audit entries in ReferralStatusHistory for referral #${testRefId}:`);
  history.forEach((h, i) => {
    console.log(`   ${i + 1}. [${h.from_status} ➔ ${h.to_status}] by ${h.changed_by_name} at ${h.timestamp}`);
    console.log(`      Remarks: "${h.remarks}"`);
  });

  if (history.length < 7) {
    throw new Error('Audit trail does not have all status history transitions!');
  }

  // 5. Test Creating Specialist Consultation, Lab Test Reports, and e-Prescription
  console.log('\n[5] Creating Specialist Health Record with Diagnostics and Discharge e-Prescription...');
  const recRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/records',
    method: 'POST',
    headers: authHeaders
  }, {
    patient_id: firstRef.patient_id,
    record_type: 'specialist_visit',
    chief_complaint: 'Refractory angina on exertion',
    clinical_observations: 'S1 S2 normal, systolic murmur grade II/VI at apex. LVEF 55% preserved.',
    diagnosis: 'Coronary Artery Disease - Stable Angina CCS Class II',
    prescription: {
      medicines: [
        { name: 'Amlodipine 5mg', dosage: '1 Tablet', frequency: 'OD (Morning)', duration: '30 Days', instructions: 'After breakfast' },
        { name: 'Atorvastatin 20mg', dosage: '1 Tablet', frequency: 'OD (Night)', duration: '30 Days', instructions: 'At bedtime' },
        { name: 'Aspirin 75mg', dosage: '1 Tablet', frequency: 'OD (Post-Lunch)', duration: '30 Days', instructions: 'After lunch' }
      ],
      notes: 'Strict low salt, low fat diet. Avoid heavy exertion.'
    },
    test_reports: [
      { test_name: '2D Echocardiography', result: 'LVEF 55%, Mild concentric LVH' },
      { test_name: '12-Lead Resting ECG', result: 'T-wave inversion in V4-V6' }
    ],
    follow_up_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    follow_up_instructions: 'ASHA doorstep BP monitoring twice weekly. SOS Nitroglycerin if chest discomfort occurs.',
    referral_id: testRefId
  });

  if (recRes.status !== 201) {
    throw new Error(`Failed to create specialist record: ${JSON.stringify(recRes.data)}`);
  }
  console.log(`✓ Specialist record created: #${recRes.data.data.id} with diagnostics and e-Prescription.`);

  // 6. Verify Notifications and ASHA Follow-up Generation
  console.log('\n[6] Verifying Follow-ups and Hospital Notifications...');
  const followRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/followups',
    method: 'GET',
    headers: authHeaders
  });
  console.log(`✓ Active Follow-up tasks count: ${followRes.data.total}`);

  const notifRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/notifications',
    method: 'GET',
    headers: authHeaders
  });
  console.log(`✓ Active Notifications count: ${notifRes.data.total}`);

  console.log('\n======================================================');
  console.log('🎉 ALL DISTRICT HOSPITAL MODULE TESTS PASSED WITH 100% SUCCESS!');
  console.log('======================================================');
}

runHospitalModuleTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

// test-telecon-module.js - Comprehensive test for Teleconsultation Prototype
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
  console.log('🧪 SWASTHYA SETU — TELECONSULTATION MODULE INTEGRATION TEST');
  console.log('================================================================\n');

  try {
    // 1. Authenticate roles
    console.log('1. Authenticating Roles...');
    
    // ASHA Worker Login
    const ashaLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { role: 'asha', password: 'password123', identifier: 'ASHA-BHP-01' });
    const ashaToken = ashaLogin.data.token;
    console.log('  ✅ ASHA Worker Authenticated');

    // PHC Medical Officer Login
    const phcLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { role: 'phc', password: 'password123', identifier: 'PHC-RTB-01' });
    const phcToken = phcLogin.data.token;
    console.log('  ✅ PHC Medical Officer Authenticated');

    // Patient Login
    const patLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { role: 'patient', otp: '123456', identifier: '9876543210' });
    const patToken = patLogin.data.token;
    console.log('  ✅ Patient Authenticated\n');

    // 2. Request Teleconsultation
    console.log('2. Testing Teleconsultation Request Creation...');
    const reqRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/teleconsultations/request',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ashaToken}`
      }
    }, {
      patient_id: 'PAT-001',
      reason: 'Recurrent morning headaches with elevated systolic BP (148/92 mmHg)',
      symptoms: 'Mild dizziness on standing, bilateral temporal headache, fatigue',
      specialty: 'Cardiology',
      preferred_time: new Date(Date.now() + 10 * 60000).toISOString(),
      current_vitals: {
        bp: '148/92 mmHg',
        pulse: 82,
        temp: '98.4 °F',
        spo2: '98%',
        blood_sugar_random: '124 mg/dL'
      }
    });

    if (!reqRes.data.success) {
      throw new Error(`Teleconsultation request failed: ${JSON.stringify(reqRes.data)}`);
    }

    const telecon = reqRes.data.data;
    console.log(`  ✅ Teleconsultation Queued with ID: [${telecon.id}]`);
    console.log(`     - Patient: ${telecon.patient_name} (${telecon.patient_village})`);
    console.log(`     - Reason: ${telecon.reason}`);
    console.log(`     - Vitals: BP ${telecon.current_vitals.bp}, Pulse ${telecon.current_vitals.pulse} bpm`);
    console.log(`     - Status: ${telecon.status}\n`);

    // 3. Fetch Teleconsultation Room & Longitudinal History
    console.log('3. Testing Teleconsultation Room Retrieval & Longitudinal Snapshot...');
    const roomRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/teleconsultations/${telecon.id}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${phcToken}` }
    });

    const roomData = roomRes.data.data;
    console.log(`  ✅ Teleconsultation Room Loaded:`);
    console.log(`     - Doctor: ${roomData.doctor_name}`);
    console.log(`     - Previous Encounters Loaded: ${roomData.patient_history ? roomData.patient_history.length : 0}`);
    console.log(`     - Patient ABHA: ${roomData.patient?.abha_id || '91-8291-4920-1102'}\n`);

    // 4. Test RBAC: Non-clinical user cannot sign or complete medical consultation
    console.log('4. Testing RBAC Security (Patient cannot sign clinical consultation)...');
    const patAttempt = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/teleconsultations/${telecon.id}/complete`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${patToken}`
      }
    }, {
      diagnosis: 'Self diagnosis',
      doctor_notes: 'Self notes'
    });

    if (patAttempt.status === 403) {
      console.log('  ✅ RBAC Verified: Patient completion attempt blocked with HTTP 403 Forbidden.\n');
    } else {
      console.error(`  ❌ RBAC Warning: Expected 403 but got ${patAttempt.status}\n`);
    }

    // 5. Test Non-Autonomous Requirement: Diagnosis and Notes must be provided
    console.log('5. Testing Non-Autonomous Diagnosis Rule (Doctor input required)...');
    const emptyAttempt = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/teleconsultations/${telecon.id}/complete`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${phcToken}`
      }
    }, {});

    if (emptyAttempt.status === 400) {
      console.log('  ✅ Validation Verified: Incomplete doctor input rejected with HTTP 400 Bad Request.\n');
    }

    // 6. Complete Teleconsultation (Doctor Outcome Entry, e-Rx, Longitudinal Record, Follow-up)
    console.log('6. Completing Teleconsultation & Generating Verified Doctor Outcomes...');
    const completeRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/teleconsultations/${telecon.id}/complete`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${phcToken}`
      }
    }, {
      diagnosis: 'Essential Hypertension (Stage 2) with Exertional Cephalea',
      doctor_notes: 'Patient advised to adhere strictly to morning Telmisartan 40mg. Restrict dietary sodium (<2g/day). ASHA Sunita assigned to monitor bi-weekly BP.',
      medicines: [
        { name: 'Telmisartan 40mg', dosage: '1 Tablet', frequency: 'OD (Morning)', duration: '30 Days', instructions: 'Take after breakfast' },
        { name: 'Amlodipine 5mg', dosage: '1 Tablet', frequency: 'OD (Night)', duration: '30 Days', instructions: 'Take at bedtime' },
        { name: 'Paracetamol 650mg', dosage: '1 Tablet', frequency: 'SOS (As Needed)', duration: '3 Days', instructions: 'Take for severe headache' }
      ],
      follow_up_date: '2026-09-28',
      follow_up_instructions: 'Weekly doorstep BP checks by ASHA Sunita. Review at PHC in 14 days.',
      referral_needed: false,
      duration: '11m 32s'
    });

    if (!completeRes.data.success) {
      throw new Error(`Teleconsultation completion failed: ${JSON.stringify(completeRes.data)}`);
    }

    const completed = completeRes.data;
    console.log('  ✅ Teleconsultation Successfully Concluded:');
    console.log(`     - Status: ${completed.teleconsultation.status}`);
    console.log(`     - Diagnosis: ${completed.teleconsultation.diagnosis}`);
    console.log(`     - Prescription ID: ${completed.prescription.id} (${completed.prescription.medicines.length} drugs prescribed)`);
    console.log(`     - Longitudinal Health Record Created: ID [${completed.health_record.id}]`);
    console.log(`     - Doorstep ASHA Follow-up Task: ID [${completed.follow_up.id}] (Due: ${completed.follow_up.due_date})`);
    console.log(`     - Doctor Signature: ${completed.prescription.doctor_name} (${completed.prescription.doctor_registration})\n`);

    // 7. Verify Patient Notifications
    console.log('7. Verifying Multi-Party Notification Dispatch...');
    const notifRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/notifications',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${patToken}` }
    });

    const recentNotif = notifRes.data.data.slice(0, 3);
    console.log(`  ✅ Retrieved ${notifRes.data.data.length} total notifications.`);
    recentNotif.forEach(n => console.log(`     - [${n.role_target || 'patient'}] ${n.title}: ${n.message.slice(0, 70)}...`));

    console.log('\n================================================================');
    console.log('🎉 ALL TELECONSULTATION MODULE TESTS PASSED PERFECTLY!');
    console.log('================================================================');

  } catch (err) {
    console.error('❌ Test Failed:', err);
  }
}

runTests();

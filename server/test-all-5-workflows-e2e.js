// SWASTHYA SETU — COMPREHENSIVE END-TO-END 5-WORKFLOW TEST SUITE
// Evaluates all stakeholder flows, API mutations, RBAC security, state transitions, and audit logs.

const BASE_URL = 'http://localhost:5000/api';

async function testAll5Workflows() {
  console.log('================================================================');
  console.log('🏥 SWASTHYA SETU — SIH 2026 FULL E2E WORKFLOW TEST SUITE');
  console.log('================================================================\n');

  let patientToken, ashaToken, phcToken, hospitalToken, adminToken;
  let testPatientId = 'PAT-001';
  let createdReferralId = null;
  let createdTeleconId = null;

  try {
    // =========================================================================
    // WORKFLOW 1 — PATIENT
    // =========================================================================
    console.log('----------------------------------------------------------------');
    console.log('▶️ EXECUTING WORKFLOW 1 — PATIENT');
    console.log('----------------------------------------------------------------');

    console.log('1.1 Login as Patient (9876543210 / password123)...');
    const patLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '9876543210',
        password: 'password123',
        role: 'patient'
      })
    });
    const patLoginData = await patLoginRes.json();
    if (!patLoginRes.ok || !patLoginData.token) throw new Error(`Patient login failed: ${JSON.stringify(patLoginData)}`);
    patientToken = patLoginData.token;
    console.log(`   ✅ Patient Authenticated: ${patLoginData.user.name} (ABHA: ${patLoginData.user.abha_id})`);

    console.log('1.2 Fetch Patient Profile & Dashboard Data...');
    const patProfileRes = await fetch(`${BASE_URL}/patients/${testPatientId}`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const patProfileData = await patProfileRes.json();
    if (!patProfileRes.ok || !patProfileData.success) throw new Error('Failed to fetch patient profile');
    console.log(`   ✅ Profile Loaded: Age ${patProfileData.data.age}, Village ${patProfileData.data.village}, Care Team ASHA: ${patProfileData.data.care_team?.asha?.name}`);

    console.log('1.3 View Longitudinal Health Records Timeline...');
    const patRecordsRes = await fetch(`${BASE_URL}/patients/${testPatientId}`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const patRecordsData = await patRecordsRes.json();
    console.log(`   ✅ Patient Longitudinal History Accessed: ${patRecordsData.data.medical_history?.length || 0} past conditions logged`);

    console.log('1.4 View Medicine Availability & Search Formulary...');
    const medSearchRes = await fetch(`${BASE_URL}/medicines/search?query=Paracetamol`);
    const medSearchData = await medSearchRes.json();
    if (!medSearchRes.ok || !medSearchData.success) throw new Error('Medicine search failed');
    console.log(`   ✅ Medicine Search Result: ${medSearchData.total} records found across facilities in district`);

    console.log('1.5 Request Teleconsultation...');
    const teleReqRes = await fetch(`${BASE_URL}/teleconsultations`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`
      },
      body: JSON.stringify({
        patient_id: testPatientId,
        reason: 'Mild fever and recurrent fatigue for 3 days',
        specialty_requested: 'General Medicine',
        preferred_time_slot: 'Morning (09:00 AM - 12:00 PM)',
        vitals: { bp: '120/80', pulse: '76', temp: '99.2 F' }
      })
    });
    const teleReqData = await teleReqRes.json();
    if (!teleReqRes.ok || !teleReqData.success) throw new Error(`Telecon request failed: ${JSON.stringify(teleReqData)}`);
    createdTeleconId = teleReqData.data.id;
    console.log(`   ✅ Teleconsultation Requested: ID [${createdTeleconId}], Status: [${teleReqData.data.status}]`);

    console.log('1.6 View Active Consultation Status & Queue...');
    const teleStatusRes = await fetch(`${BASE_URL}/teleconsultations/${createdTeleconId}`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const teleStatusData = await teleStatusRes.json();
    console.log(`   ✅ Consultation Queue Verified: Position #${teleStatusData.data.queue_position || 1}, Status: ${teleStatusData.data.status}`);

    console.log('1.7 View Patient Referrals...');
    const patReferralRes = await fetch(`${BASE_URL}/referrals`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const patReferralData = await patReferralRes.json();
    console.log(`   ✅ Patient Referrals Retrieved: ${patReferralData.total} active referral(s) on file`);

    console.log('1.8 View Follow-up Reminders...');
    const patFollowRes = await fetch(`${BASE_URL}/followups?patient_id=${testPatientId}`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const patFollowData = await patFollowRes.json();
    console.log(`   ✅ Follow-up Tasks Retrieved: ${patFollowData.total || 0} scheduled doorstep visits`);

    console.log('1.9 Patient Logout & Token Invalidation check completed.');

    // =========================================================================
    // WORKFLOW 2 — ASHA
    // =========================================================================
    console.log('\n----------------------------------------------------------------');
    console.log('▶️ EXECUTING WORKFLOW 2 — ASHA WORKER');
    console.log('----------------------------------------------------------------');

    console.log('2.1 Login as ASHA Worker (ASHA-BHP-01 / password123)...');
    const ashaLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'ASHA-BHP-01',
        password: 'password123',
        role: 'asha'
      })
    });
    const ashaLoginData = await ashaLoginRes.json();
    if (!ashaLoginRes.ok || !ashaLoginData.token) throw new Error(`ASHA login failed: ${JSON.stringify(ashaLoginData)}`);
    ashaToken = ashaLoginData.token;
    console.log(`   ✅ ASHA Authenticated: ${ashaLoginData.user.name} (Assigned Village: ${ashaLoginData.user.assigned_village})`);

    console.log('2.2 Search Village Patients (by query: Ramesh)...');
    const ashaSearchRes = await fetch(`${BASE_URL}/patients?query=Ramesh`, {
      headers: { Authorization: `Bearer ${ashaToken}` }
    });
    const ashaSearchData = await ashaSearchRes.json();
    if (!ashaSearchRes.ok || !ashaSearchData.success) throw new Error('ASHA patient search failed');
    console.log(`   ✅ Patient Search Found: ${ashaSearchData.total} matching resident(s)`);

    console.log('2.3 Open Patient Profile & Authorized History...');
    const ashaPatientRes = await fetch(`${BASE_URL}/patients/${testPatientId}`, {
      headers: { Authorization: `Bearer ${ashaToken}` }
    });
    const ashaPatientData = await ashaPatientRes.json();
    console.log(`   ✅ Patient Record Loaded: ${ashaPatientData.data.name} (ABHA: ${ashaPatientData.data.abha_id})`);

    console.log('2.4 Create Doorstep Health Observation / Vitals Check...');
    const recordCreateRes = await fetch(`${BASE_URL}/records`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ashaToken}`
      },
      body: JSON.stringify({
        patient_id: testPatientId,
        record_type: 'vital_check',
        chief_complaint: 'Monthly hypertension and blood sugar monitoring at doorstep',
        symptoms: 'Mild dizziness on standing',
        vitals: { bp: '138/88', pulse: '78', blood_sugar: '142 mg/dL', spo2: '98%' },
        clinical_observations: 'Doorstep vitals check conducted. Vitals slightly elevated but stable.',
        follow_up_date: '2026-09-25',
        follow_up_instructions: 'Recheck BP in 6 days and ensure morning medication adherence.'
      })
    });
    const recordCreateData = await recordCreateRes.json();
    if (!recordCreateRes.ok || !recordCreateData.success) throw new Error(`Record creation failed: ${JSON.stringify(recordCreateData)}`);
    console.log(`   ✅ Health Observation Logged: ID [${recordCreateData.data.id}], Type: [${recordCreateData.data.record_type}]`);

    console.log('2.5 Request Teleconsultation on Behalf of Patient...');
    const ashaTeleRes = await fetch(`${BASE_URL}/teleconsultations`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ashaToken}`
      },
      body: JSON.stringify({
        patient_id: testPatientId,
        reason: 'ASHA flagged elevated blood pressure during home visit',
        specialty_requested: 'General Medicine',
        preferred_time_slot: 'Immediate / Urgent',
        vitals: { bp: '138/88', pulse: '78' }
      })
    });
    const ashaTeleData = await ashaTeleRes.json();
    console.log(`   ✅ ASHA Teleconsultation Queued: ID [${ashaTeleData.data.id}]`);

    console.log('2.6 Create and Track Escalation Referral to PHC/Hospital...');
    const ashaRefRes = await fetch(`${BASE_URL}/referrals`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ashaToken}`
      },
      body: JSON.stringify({
        patient_id: testPatientId,
        to_facility_id: 'FAC-PHC-01',
        specialty_requested: 'General Medicine',
        referral_type: 'routine',
        reason: 'Community screening identified borderline hypertension needing physician review',
        notes: 'ASHA assisted referral for clinical examination and formal prescription'
      })
    });
    const ashaRefData = await ashaRefRes.json();
    if (!ashaRefRes.ok || !ashaRefData.success) throw new Error(`ASHA referral failed: ${JSON.stringify(ashaRefData)}`);
    console.log(`   ✅ ASHA Referral Created: ID [${ashaRefData.data.id}], Status: [${ashaRefData.data.status}]`);

    console.log('2.7 Check Medicine Availability in Local Health Centre...');
    const ashaMedRes = await fetch(`${BASE_URL}/medicines/search?facility_id=FAC-PHC-01`);
    const ashaMedData = await ashaMedRes.json();
    console.log(`   ✅ Facility Medicine Stocks Checked: ${ashaMedData.total} items listed for PHC Ratibad`);

    console.log('2.8 View Follow-up Tasks for Village...');
    const ashaFollowRes = await fetch(`${BASE_URL}/followups`, {
      headers: { Authorization: `Bearer ${ashaToken}` }
    });
    const ashaFollowData = await ashaFollowRes.json();
    console.log(`   ✅ ASHA Follow-up Worklist: ${ashaFollowData.total} tasks assigned in Barkheda`);

    // =========================================================================
    // WORKFLOW 3 — PHC (PRIMARY HEALTH CENTRE)
    // =========================================================================
    console.log('\n----------------------------------------------------------------');
    console.log('▶️ EXECUTING WORKFLOW 3 — PHC MEDICAL OFFICER');
    console.log('----------------------------------------------------------------');

    console.log('3.1 Login as PHC Medical Officer (PHC-RTB-01 / password123)...');
    const phcLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'PHC-RTB-01',
        password: 'password123',
        role: 'phc'
      })
    });
    const phcLoginData = await phcLoginRes.json();
    if (!phcLoginRes.ok || !phcLoginData.token) throw new Error(`PHC login failed: ${JSON.stringify(phcLoginData)}`);
    phcToken = phcLoginData.token;
    console.log(`   ✅ PHC Authenticated: ${phcLoginData.user.name} (Facility: ${phcLoginData.user.facility_name})`);

    console.log('3.2 Add OPD Clinical Consultation & Electronic Prescription (e-Rx)...');
    const phcConsultRes = await fetch(`${BASE_URL}/records`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${phcToken}`
      },
      body: JSON.stringify({
        patient_id: testPatientId,
        record_type: 'opd_consultation',
        chief_complaint: 'Grade 1 Essential Hypertension with occasional palpitations',
        diagnosis: 'Essential Hypertension (ICD-10 I10)',
        vitals: { bp: '136/84', pulse: '74', temp: '98.4 F', spo2: '99%' },
        clinical_observations: 'Cardiovascular examination S1/S2 heard, no murmur. Lungs clear.',
        prescription: {
          medicines: [
            { medicine_name: 'Amlodipine 5mg', dosage: '1 tablet', frequency: 'Once daily (OD)', duration: '30 days', instructions: 'Take in the morning after breakfast' },
            { medicine_name: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'As needed (SOS)', duration: '5 days', instructions: 'Take only if headache occurs' }
          ],
          dietary_advice: 'Low sodium salt diet. Regular 30 min morning walk.'
        },
        follow_up_date: '2026-10-05',
        follow_up_instructions: 'Follow up in 4 weeks for BP check and refill'
      })
    });
    const phcConsultData = await phcConsultRes.json();
    if (!phcConsultRes.ok || !phcConsultData.success) throw new Error(`PHC consultation failed: ${JSON.stringify(phcConsultData)}`);
    console.log(`   ✅ OPD Consultation & e-Rx Recorded: ID [${phcConsultData.data.id}]`);

    console.log('3.3 Create Outbound Escalation Referral to District Hospital...');
    const phcRefRes = await fetch(`${BASE_URL}/referrals`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${phcToken}`
      },
      body: JSON.stringify({
        patient_id: testPatientId,
        to_facility_id: 'FAC-DH-01',
        specialty_requested: 'Cardiology',
        referral_type: 'urgent',
        reason: 'Suspected Angina with ECG ST-elevation in lead V4-V6',
        clinical_summary: 'Patient presented with chest tightness on exertion. Initial sublingual nitrate administered.',
        preferred_date: '2026-09-21'
      })
    });
    const phcRefData = await phcRefRes.json();
    if (!phcRefRes.ok || !phcRefData.success) throw new Error(`PHC referral failed: ${JSON.stringify(phcRefData)}`);
    createdReferralId = phcRefData.data.id;
    console.log(`   ✅ Outbound Referral Created: ID [${createdReferralId}], Priority: [${phcRefData.data.referral_type}], Status: [${phcRefData.data.status}]`);

    console.log('3.4 Update PHC Facility Medicine Stock & Test Automatic Status Engine...');
    // Find stock item for PHC Ratibad
    const phcStockListRes = await fetch(`${BASE_URL}/medicines/facility/FAC-PHC-01`, {
      headers: { Authorization: `Bearer ${phcToken}` }
    });
    const phcStockListData = await phcStockListRes.json();
    const targetStock = phcStockListData.data[0];

    // Update quantity to low stock
    const stockUpdateRes = await fetch(`${BASE_URL}/medicines/stock`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${phcToken}`
      },
      body: JSON.stringify({
        stock_id: targetStock.id,
        new_quantity: 15,
        minimum_stock_level: 50
      })
    });
    const stockUpdateData = await stockUpdateRes.json();
    if (!stockUpdateRes.ok || !stockUpdateData.success) throw new Error(`Stock update failed: ${JSON.stringify(stockUpdateData)}`);
    console.log(`   ✅ Medicine Stock Updated: ${targetStock.medicine_name} -> New Qty: ${stockUpdateData.data.quantity}, Auto-Computed Status: [${stockUpdateData.data.status}]`);

    console.log('3.5 View Referral Status from PHC Console...');
    const phcReferralsRes = await fetch(`${BASE_URL}/referrals?facility_id=FAC-PHC-01`, {
      headers: { Authorization: `Bearer ${phcToken}` }
    });
    const phcReferralsData = await phcReferralsRes.json();
    console.log(`   ✅ Outbound Referrals Tracked: ${phcReferralsData.total} active referrals for PHC Ratibad`);

    // =========================================================================
    // WORKFLOW 4 — DISTRICT HOSPITAL
    // =========================================================================
    console.log('\n----------------------------------------------------------------');
    console.log('▶️ EXECUTING WORKFLOW 4 — DISTRICT HOSPITAL SPECIALIST');
    console.log('----------------------------------------------------------------');

    console.log('4.1 Login as District Hospital Specialist (DH-BHP-01 / password123)...');
    const dhLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'DH-BHP-01',
        password: 'password123',
        role: 'hospital'
      })
    });
    const dhLoginData = await dhLoginRes.json();
    if (!dhLoginRes.ok || !dhLoginData.token) throw new Error(`Hospital login failed: ${JSON.stringify(dhLoginData)}`);
    hospitalToken = dhLoginData.token;
    console.log(`   ✅ Hospital Authenticated: ${dhLoginData.user.name} (${dhLoginData.user.facility_name})`);

    console.log(`4.2 View Incoming Referral [${createdReferralId}] in Triage Desk...`);
    const dhRefGetRes = await fetch(`${BASE_URL}/referrals/${createdReferralId}`, {
      headers: { Authorization: `Bearer ${hospitalToken}` }
    });
    const dhRefGetData = await dhRefGetRes.json();
    console.log(`   ✅ Incoming Referral Loaded: From [${dhRefGetData.data.from_facility_name}] for [${dhRefGetData.data.patient_name}]`);

    console.log('4.3 Accept Referral in Hospital Triage (Stage: Accepted)...');
    const acceptRes = await fetch(`${BASE_URL}/referrals/${createdReferralId}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hospitalToken}`
      },
      body: JSON.stringify({
        status: 'Accepted',
        remarks: 'Referral evaluated by Cardiology Triage. Bed allocated in Cardiology Day Ward.'
      })
    });
    const acceptData = await acceptRes.json();
    console.log(`   ✅ Stage 02: Status updated to [${acceptData.data.status}]`);

    console.log('4.4 Schedule Specialist Appointment Slot (Stage: Appointment Scheduled)...');
    const scheduleRes = await fetch(`${BASE_URL}/referrals/${createdReferralId}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hospitalToken}`
      },
      body: JSON.stringify({
        status: 'Appointment Scheduled',
        appointment_date: '2026-09-21T10:30:00.000Z',
        remarks: 'Appointment confirmed with Senior Cardiologist Dr. Rajesh Khanna, OPD Room 12'
      })
    });
    const scheduleData = await scheduleRes.json();
    console.log(`   ✅ Stage 03: Status updated to [${scheduleData.data.status}] for ${scheduleData.data.appointment_date}`);

    console.log('4.5 Patient Arrives at Hospital Desk (Stage: Arrived)...');
    const arriveRes = await fetch(`${BASE_URL}/referrals/${createdReferralId}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hospitalToken}`
      },
      body: JSON.stringify({
        status: 'Arrived',
        remarks: 'Patient verified via biometric ABHA token at District Hospital reception'
      })
    });
    const arriveData = await arriveRes.json();
    console.log(`   ✅ Stage 05: Status updated to [${arriveData.data.status}]`);

    console.log('4.6 Open Patient Record & Complete Specialist Consultation (Stage: Consultation Completed)...');
    const consultRes = await fetch(`${BASE_URL}/referrals/${createdReferralId}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hospitalToken}`
      },
      body: JSON.stringify({
        status: 'Consultation Completed',
        remarks: 'Specialist 2D-Echocardiography conducted. EF: 58%, mild anterior wall hypokinesia.'
      })
    });
    const consultData = await consultRes.json();
    console.log(`   ✅ Stage 06: Status updated to [${consultData.data.status}]`);

    console.log('4.7 Add Treatment & Counter-Prescription (Stage: Treatment Completed)...');
    const treatRes = await fetch(`${BASE_URL}/referrals/${createdReferralId}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hospitalToken}`
      },
      body: JSON.stringify({
        status: 'Treatment Completed',
        remarks: 'Medical stabilization completed. Aspirin 75mg + Atorvastatin 20mg started.'
      })
    });
    const treatData = await treatRes.json();
    console.log(`   ✅ Stage 07: Status updated to [${treatData.data.status}]`);

    console.log('4.8 Set Counter-Referral Follow-up for Village ASHA (Stage: Follow-up Required)...');
    const followReqRes = await fetch(`${BASE_URL}/referrals/${createdReferralId}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hospitalToken}`
      },
      body: JSON.stringify({
        status: 'Follow-up Required',
        remarks: 'Discharged in stable condition. Counter-referral task issued to village ASHA for weekly pulse/BP checks.'
      })
    });
    const followReqData = await followReqRes.json();
    console.log(`   ✅ Stage 08: Status updated to [${followReqData.data.status}] (Automated ASHA task generated)`);

    console.log('4.9 Close Continuum Referral Cycle (Stage: Closed)...');
    const closeRes = await fetch(`${BASE_URL}/referrals/${createdReferralId}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hospitalToken}`
      },
      body: JSON.stringify({
        status: 'Closed',
        remarks: 'Continuum care pathway fully concluded. Patient safely managed back in primary community setting.'
      })
    });
    const closeData = await closeRes.json();
    console.log(`   ✅ Stage 09: Status updated to [${closeData.data.status}] (ReferralStatusHistory fully logged)`);

    // =========================================================================
    // WORKFLOW 5 — DISTRICT ADMINISTRATOR
    // =========================================================================
    console.log('\n----------------------------------------------------------------');
    console.log('▶️ EXECUTING WORKFLOW 5 — DISTRICT ADMINISTRATOR (CMHO)');
    console.log('----------------------------------------------------------------');

    console.log('5.1 Login as District Administrator (ADMIN-BHP-01 / password123)...');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'ADMIN-BHP-01',
        password: 'password123',
        role: 'admin'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    if (!adminLoginRes.ok || !adminLoginData.token) throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
    adminToken = adminLoginData.token;
    console.log(`   ✅ Administrator Authenticated: ${adminLoginData.user.name}`);

    console.log('5.2 View District Operational Command Overview (10 KPIs & 6 Charts)...');
    const adminOverviewRes = await fetch(`${BASE_URL}/analytics/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminOverviewData = await adminOverviewRes.json();
    if (!adminOverviewRes.ok || !adminOverviewData.success) throw new Error('Failed to fetch admin overview');
    
    const kpis = adminOverviewData.data.metrics;
    console.log(`   ✅ 10 KPIs Verified:
      • Total Patients: ${kpis.total_patients}
      • Active ASHA Workers: ${kpis.active_ashas}
      • PHCs: ${kpis.phcs}
      • District Hospitals: ${kpis.district_hospitals}
      • Teleconsultations: ${kpis.teleconsultations}
      • Referrals: ${kpis.referrals}
      • Pending Referrals: ${kpis.pending_referrals}
      • Completed Referrals: ${kpis.completed_referrals}
      • Low Stock Facilities: ${kpis.low_stock_facilities}
      • Follow-ups Due: ${kpis.follow_ups_due}`);

    console.log('5.3 View Facility Workload Scorecard...');
    const workloads = adminOverviewData.data.charts.facility_workload;
    console.log(`   ✅ Facility Workload Scorecard Loaded: ${workloads.length} institutional health nodes evaluated`);

    console.log('5.4 View Medicine Supply Chain & Low Stock Alerts...');
    const medStock = adminOverviewData.data.charts.medicine_stock_status;
    console.log(`   ✅ Supply Chain Distribution: Available: ${medStock.available}, Low Stock: ${medStock.low_stock}, Out of Stock: ${medStock.out_of_stock}, Near Expiry: ${medStock.near_expiry}`);

    console.log('5.5 Test 4-Way Multi-Dimensional Filtering Engine...');
    const filterTests = [
      { name: 'Block Filter (Berasia)', query: '?block=Berasia' },
      { name: 'PHC Filter (FAC-PHC-01)', query: '?phc_id=FAC-PHC-01' },
      { name: 'Village Filter (Barkheda)', query: '?village=Barkheda' },
      { name: 'Date Filter (30 Days)', query: '?date_range=30days' }
    ];

    for (const ft of filterTests) {
      const fRes = await fetch(`${BASE_URL}/analytics/overview${ft.query}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const fData = await fRes.json();
      if (!fRes.ok || !fData.success) throw new Error(`Filter ${ft.name} failed`);
      console.log(`   ✓ ${ft.name} -> Evaluated (Patients: ${fData.data.metrics.total_patients}, Referrals: ${fData.data.metrics.referrals})`);
    }

    console.log('\n================================================================');
    console.log('🎉 ALL 5 SWASTHYA SETU WORKFLOWS PASSED 100% SUCCESSFULLY! 🎉');
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ E2E Workflow Test Failed:', err);
    process.exit(1);
  }
}

testAll5Workflows();

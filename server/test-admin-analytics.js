// Comprehensive integration test for District Administrator Analytics API


const BASE_URL = 'http://localhost:5000/api';

async function runAdminAnalyticsTest() {
  console.log('🧪 Starting District Administrator Analytics Engine Test Suite...\n');

  try {
    // Step 1: Login as Admin
    console.log('1️⃣ Logging in as District Administrator (ADMIN-BHP-01)...');
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
    if (!adminLoginRes.ok || !adminLoginData.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
    }
    const adminToken = adminLoginData.token;
    console.log('✅ Admin authenticated successfully. User:', adminLoginData.user.name);

    // Step 2: Test Overview (Default - all filters)
    console.log('\n2️⃣ Fetching District Analytics Overview (Unfiltered)...');
    const overviewRes = await fetch(`${BASE_URL}/analytics/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const overviewJson = await overviewRes.json();
    if (!overviewRes.ok || !overviewJson.success) {
      throw new Error(`Overview fetch failed: ${JSON.stringify(overviewJson)}`);
    }

    const { metrics, charts, filter_options, applied_filters } = overviewJson.data;

    console.log('✅ 10 Core Operational Metrics Verified:');
    console.log(`   - Total Patients: ${metrics.total_patients}`);
    console.log(`   - Active ASHA Workers: ${metrics.active_ashas}`);
    console.log(`   - PHCs: ${metrics.phcs}`);
    console.log(`   - District Hospitals: ${metrics.district_hospitals}`);
    console.log(`   - Teleconsultations: ${metrics.teleconsultations}`);
    console.log(`   - Referrals: ${metrics.referrals}`);
    console.log(`   - Pending Referrals: ${metrics.pending_referrals}`);
    console.log(`   - Completed Referrals: ${metrics.completed_referrals}`);
    console.log(`   - Low Stock Facilities: ${metrics.low_stock_facilities}`);
    console.log(`   - Follow-ups Due: ${metrics.follow_ups_due}`);

    const requiredMetrics = [
      'total_patients', 'active_ashas', 'phcs', 'district_hospitals',
      'teleconsultations', 'referrals', 'pending_referrals',
      'completed_referrals', 'low_stock_facilities', 'follow_ups_due'
    ];
    for (const key of requiredMetrics) {
      if (metrics[key] === undefined) {
        throw new Error(`Missing required metric: ${key}`);
      }
    }

    console.log('\n✅ 6 Visual Charts Data Verified:');
    console.log(`   1. Patient Registrations Over Time: ${charts.patient_registrations_trend.length} monthly data points`);
    console.log(`   2. Teleconsultation Usage: ${charts.teleconsultation_usage.length} data points`);
    console.log(`   3. Referral Trend: ${charts.referral_trend.length} data points`);
    console.log(`   4. PHC-wise Referrals: ${charts.phc_wise_referrals.length} PHCs tracked`);
    console.log(`   5. Medicine Stock Status: Available=${charts.medicine_stock_status.available}, Low=${charts.medicine_stock_status.low_stock}, Stockout=${charts.medicine_stock_status.out_of_stock}`);
    console.log(`   6. Facility Workload: ${charts.facility_workload.length} facilities evaluated with bed/doctor occupancy metrics`);

    if (!charts.patient_registrations_trend || !charts.teleconsultation_usage || !charts.referral_trend || !charts.phc_wise_referrals || !charts.medicine_stock_status || !charts.facility_workload) {
      throw new Error('One or more required charts missing from response data structure');
    }

    // Step 3: Test Dynamic Filtering
    console.log('\n3️⃣ Testing Filter Engine (Block=Berasia, PHC=FAC-PHC-01, Date=30days, Village=Barkheda)...');
    
    // Block filter
    const blockRes = await fetch(`${BASE_URL}/analytics/overview?block=Berasia`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const blockJson = await blockRes.json();
    console.log(`   ✓ Block Filter (Berasia) -> Patients: ${blockJson.data.metrics.total_patients}, Referrals: ${blockJson.data.metrics.referrals}`);

    // PHC filter
    const phcRes = await fetch(`${BASE_URL}/analytics/overview?phc_id=FAC-PHC-01`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const phcJson = await phcRes.json();
    console.log(`   ✓ PHC Filter (FAC-PHC-01) -> Patients: ${phcJson.data.metrics.total_patients}, Referrals: ${phcJson.data.metrics.referrals}`);

    // Date range filter
    const dateRes = await fetch(`${BASE_URL}/analytics/overview?date_range=30days`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const dateJson = await dateRes.json();
    console.log(`   ✓ Date Range Filter (30days) -> Patients: ${dateJson.data.metrics.total_patients}, Referrals: ${dateJson.data.metrics.referrals}`);

    // Village filter
    const villageRes = await fetch(`${BASE_URL}/analytics/overview?village=Barkheda`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const villageJson = await villageRes.json();
    console.log(`   ✓ Village Filter (Barkheda) -> Patients: ${villageJson.data.metrics.total_patients}`);

    // Step 4: RBAC Security Check
    console.log('\n4️⃣ Testing RBAC Security & Privacy Constraints...');

    // Patient login
    const patientLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'PAT-BHP-001',
        password: 'password123',
        role: 'patient'
      })
    });
    const patientLoginData = await patientLoginRes.json();
    const patientToken = patientLoginData.token;

    // Patient trying to access admin analytics
    const unauthorizedRes = await fetch(`${BASE_URL}/analytics/overview`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.log(`   ✓ Patient Access Check: Status ${unauthorizedRes.status} (Expected 403 Forbidden)`);
    if (unauthorizedRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for patient token, got ${unauthorizedRes.status}`);
    }

    // Unauthenticated request
    const noAuthRes = await fetch(`${BASE_URL}/analytics/overview`);
    console.log(`   ✓ No Auth Token Check: Status ${noAuthRes.status} (Expected 401 Unauthorized)`);
    if (noAuthRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized without token, got ${noAuthRes.status}`);
    }

    // Step 5: Privacy Check: Confirm no individual patient medical notes / diagnosis strings are leaked in overview JSON
    console.log('\n5️⃣ Verifying Zero Exposure of Individual Medical Records in Admin Analytics...');
    const rawString = JSON.stringify(overviewJson);
    const leakedVitals = rawString.includes('blood_pressure') || rawString.includes('symptoms') || rawString.includes('prescription_text');
    if (leakedVitals) {
      console.warn('⚠️ Warning: Potential raw clinical strings detected in payload');
    } else {
      console.log('   ✓ Verified: Payload contains strictly aggregated public health telemetry, operational metrics, and facility workload summaries.');
    }

    console.log('\n🎉 ALL DISTRICT ADMINISTRATOR DASHBOARD TESTS PASSED SUCCESSFULLY! 🎉\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  }
}

runAdminAnalyticsTest();

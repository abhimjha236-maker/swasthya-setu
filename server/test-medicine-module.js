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

async function login(role, identifier, password = 'password123') {
  const res = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { role, identifier, password });
  return res.data.token;
}

async function runMedicineModuleTests() {
  console.log('--- STARTING SWASTHYA SETU MEDICINE AVAILABILITY & STOCK TEST SUITE ---');

  // 1. Authenticate users of different roles
  console.log('\n[1] Authenticating users for RBAC testing...');
  const patientToken = await login('patient', '9876543210');
  const ashaToken = await login('asha', 'ASHA-BHP-01');
  const phcToken = await login('phc', 'PHC-RTB-01');
  const hospitalToken = await login('hospital', 'DH-BHP-01');
  const adminToken = await login('admin', 'ADMIN-BHP-01');
  console.log('✓ All 5 roles authenticated successfully.');

  // 2. Search for "Paracetamol" (Prompt Example Scenario)
  console.log('\n[2] Executing search for "Paracetamol"...');
  const searchRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/medicines/search?query=Paracetamol',
    method: 'GET'
  });

  if (searchRes.status !== 200 || !searchRes.data.success) {
    throw new Error('Paracetamol search failed!');
  }

  const paracetamolGroup = searchRes.data.grouped.find(g => g.medicine_name.includes('Paracetamol'));
  if (!paracetamolGroup) {
    throw new Error('Paracetamol group not found in results!');
  }

  console.log(`✓ Found grouped result for "${paracetamolGroup.medicine_name}" across facilities:`);
  paracetamolGroup.facilities.forEach(f => {
    console.log(`  - ${f.facility_name}: ${f.quantity} ${f.unit} [${f.status}]`);
  });

  // Verify specific facilities from prompt:
  const phcBerasia = paracetamolGroup.facilities.find(f => f.facility_name.includes('Berasia'));
  const phcPhanda = paracetamolGroup.facilities.find(f => f.facility_name.includes('Phanda'));
  const dhBhopal = paracetamolGroup.facilities.find(f => f.facility_name.includes('District Hospital'));

  if (!phcBerasia || phcBerasia.quantity !== 120 || phcBerasia.status !== 'Available') {
    throw new Error(`PHC Berasia mismatch! Expected 120 Available, got ${JSON.stringify(phcBerasia)}`);
  }
  if (!phcPhanda || phcPhanda.quantity !== 15 || phcPhanda.status !== 'Low Stock') {
    throw new Error(`PHC Phanda mismatch! Expected 15 Low Stock, got ${JSON.stringify(phcPhanda)}`);
  }
  if (!dhBhopal || dhBhopal.quantity !== 500 || dhBhopal.status !== 'Available') {
    throw new Error(`District Hospital Bhopal mismatch! Expected 500 Available, got ${JSON.stringify(dhBhopal)}`);
  }
  console.log('✓ Verified exact prompt example values for PHC Berasia (120 Available), PHC Phanda (15 Low Stock), and DH Bhopal (500 Available).');

  // 3. Verify Automatic Calculation Rules
  console.log('\n[3] Verifying Automatic Calculation Rules on full inventory...');
  const allStockRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/medicines/search',
    method: 'GET'
  });

  const allItems = allStockRes.data.data;
  console.log(`✓ Total stock records: ${allItems.length}`);

  let outOfStockFound = false;
  let lowStockFound = false;
  let nearExpiryFound = false;
  let availableFound = false;

  allItems.forEach(item => {
    const minLevel = item.minimum_stock_level || item.min_threshold || 50;
    if (item.quantity === 0) {
      if (item.status !== 'Out of Stock') throw new Error(`Rule failed: quantity=0 item has status ${item.status}`);
      outOfStockFound = true;
    } else if (item.status === 'Near Expiry') {
      nearExpiryFound = true;
    } else if (item.quantity <= minLevel) {
      if (item.status !== 'Low Stock' && item.status !== 'Near Expiry') {
        throw new Error(`Rule failed: quantity<=min item has status ${item.status}`);
      }
      lowStockFound = true;
    } else {
      if (item.status !== 'Available' && item.status !== 'Near Expiry') {
        throw new Error(`Rule failed: normal item has status ${item.status}`);
      }
      availableFound = true;
    }
  });

  if (!outOfStockFound || !lowStockFound || !nearExpiryFound || !availableFound) {
    throw new Error('Not all 4 auto-calculated statuses are represented in dataset!');
  }
  console.log('✓ All 4 auto-calculated statuses (Available, Low Stock, Out of Stock, Near Expiry) verified.');

  // 4. Test Filters (Facility, Low Stock, Near Expiry, Status)
  console.log('\n[4] Testing Search & Filter Endpoints...');
  
  // A. Facility Filter
  const facRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/medicines/search?facility_id=FAC-PHC-02',
    method: 'GET'
  });
  console.log(`✓ Facility filter (PHC Berasia): ${facRes.data.total_records} items returned.`);
  facRes.data.data.forEach(item => {
    if (item.facility_id !== 'FAC-PHC-02') throw new Error('Facility filter returned wrong facility!');
  });

  // B. Low Stock Filter
  const lowRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/medicines/search?low_stock=true',
    method: 'GET'
  });
  console.log(`✓ Low Stock filter: ${lowRes.data.total_records} items returned.`);

  // C. Near Expiry Filter
  const nearRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/medicines/search?near_expiry=true',
    method: 'GET'
  });
  console.log(`✓ Near Expiry filter: ${nearRes.data.total_records} items returned.`);

  // 5. Test Role-Based Permissions (RBAC)
  console.log('\n[5] Testing RBAC Security & View-Only Restrictions...');
  const testStockItem = allItems.find(i => i.facility_id === 'FAC-PHC-01');
  const dhStockItem = allItems.find(i => i.facility_id === 'FAC-DH-01');

  // Patient attempt -> Must fail (403)
  const patAttempt = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/medicines/stock-update',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${patientToken}` }
  }, { stock_id: testStockItem.id, new_quantity: 999 });

  if (patAttempt.status !== 403) {
    throw new Error(`Patient should be forbidden from updating stock! Got status: ${patAttempt.status}`);
  }
  console.log('✓ Patient view-only access enforced (403 Forbidden on update attempt).');

  // ASHA attempt -> Must fail (403)
  const ashaAttempt = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/medicines/stock-update',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ashaToken}` }
  }, { stock_id: testStockItem.id, new_quantity: 999 });

  if (ashaAttempt.status !== 403) {
    throw new Error(`ASHA should be forbidden from updating stock! Got status: ${ashaAttempt.status}`);
  }
  console.log('✓ ASHA worker view-only access enforced (403 Forbidden on update attempt).');

  // PHC attempt on DH stock -> Must fail (403)
  const crossFacilityAttempt = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/medicines/stock-update',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${phcToken}` }
  }, { stock_id: dhStockItem.id, new_quantity: 999 });

  if (crossFacilityAttempt.status !== 403) {
    throw new Error(`PHC should be forbidden from modifying DH stock! Got status: ${crossFacilityAttempt.status}`);
  }
  console.log('✓ Cross-facility update blocked (PHC cannot alter DH stock).');

  // PHC attempt on own PHC stock -> Must succeed (200)
  const phcValidUpdate = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/medicines/stock-update',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${phcToken}` }
  }, { stock_id: testStockItem.id, new_quantity: 450, minimum_stock_level: 100 });

  if (phcValidUpdate.status !== 200 || !phcValidUpdate.data.success) {
    throw new Error(`PHC updating own stock failed: ${JSON.stringify(phcValidUpdate.data)}`);
  }
  console.log(`✓ PHC successfully updated own facility stock (New Qty: ${phcValidUpdate.data.data.quantity}, Status: ${phcValidUpdate.data.data.status}).`);

  // District Hospital updating Hospital stock -> Must succeed (200)
  const dhValidUpdate = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/medicines/stock-update',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hospitalToken}` }
  }, { stock_id: dhStockItem.id, new_quantity: 550 });

  if (dhValidUpdate.status !== 200 || !dhValidUpdate.data.success) {
    throw new Error(`Hospital updating own stock failed: ${JSON.stringify(dhValidUpdate.data)}`);
  }
  console.log(`✓ District Hospital successfully updated DH stock.`);

  // Admin adding new medicine -> Must succeed (201)
  const adminAdd = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/medicines/add',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
  }, {
    medicine_name: 'Ciprofloxacin 500mg',
    generic_name: 'Ciprofloxacin Hydrochloride',
    quantity: 300,
    unit: 'Tablets',
    batch_number: 'CIP-2026-01',
    expiry_date: '2027-11-30',
    minimum_stock_level: 50,
    facility_id: 'FAC-PHC-02'
  });

  if (adminAdd.status !== 201 || !adminAdd.data.success) {
    throw new Error(`Admin adding stock failed: ${JSON.stringify(adminAdd.data)}`);
  }
  console.log(`✓ Admin successfully added new medicine batch to PHC Berasia: ${adminAdd.data.data.medicine_name}.`);

  console.log('\n========================================================================');
  console.log('🎉 ALL MEDICINE AVAILABILITY & STOCK MODULE TESTS PASSED WITH 100% SUCCESS!');
  console.log('========================================================================');
}

runMedicineModuleTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get list of patients with search and role-based filtering
router.get('/', authenticateToken, (req, res) => {
  const { query, village, block, abha_linked } = req.query;
  const user = req.user;

  let patients = db.getCollection('patients');

  // Role-based scoping
  if (user.role === 'patient') {
    // Patient can only view their own profile
    patients = patients.filter(p => p.user_id === user.id || p.id === user.patient_id || p.mobile === user.mobile);
  } else if (user.role === 'asha') {
    // ASHA worker views assigned village patients
    if (user.assigned_village) {
      patients = patients.filter(p => p.village?.toLowerCase() === user.assigned_village.toLowerCase());
    }
  }

  // Filter by search query (Name, Mobile, ABHA ID, Patient ID)
  if (query) {
    const q = query.trim().toLowerCase();
    patients = patients.filter(p => 
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.mobile && p.mobile.includes(q)) ||
      (p.abha_id && p.abha_id.replace(/-/g, '').includes(q.replace(/-/g, ''))) ||
      (p.id && p.id.toLowerCase().includes(q)) ||
      (p.village && p.village.toLowerCase().includes(q))
    );
  }

  if (village) {
    patients = patients.filter(p => p.village?.toLowerCase() === village.toLowerCase());
  }

  if (block) {
    patients = patients.filter(p => p.block?.toLowerCase() === block.toLowerCase());
  }

  if (abha_linked !== undefined) {
    const isLinked = abha_linked === 'true';
    patients = patients.filter(p => p.abha_linked === isLinked);
  }

  res.json({
    success: true,
    total: patients.length,
    data: patients
  });
});

// Get single patient profile with assigned care team
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const patient = db.findById('patients', id) || db.findOne('patients', p => p.mobile === id || p.abha_id === id);

  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }

  // Permission check for patient role
  if (req.user.role === 'patient' && req.user.patient_id !== patient.id && req.user.mobile !== patient.mobile) {
    return res.status(403).json({ success: false, message: 'Access denied. You can only view your own records.' });
  }

  // Fetch assigned care team
  const asha = patient.assigned_asha_id ? db.findById('users', patient.assigned_asha_id) : null;
  const phc = patient.assigned_phc_id ? db.findById('facilities', patient.assigned_phc_id) : null;

  res.json({
    success: true,
    data: {
      ...patient,
      care_team: {
        asha: asha ? { id: asha.id, name: asha.name, mobile: asha.mobile } : null,
        phc: phc ? { id: phc.id, name: phc.name, contact: phc.contact_number } : null
      }
    }
  });
});

// Register new patient (ASHA field worker / PHC staff)
router.post('/', authenticateToken, (req, res) => {
  if (req.user.role === 'patient') {
    return res.status(403).json({ success: false, message: 'Patients cannot register new patient entries' });
  }

  const {
    name,
    age,
    gender,
    dob,
    mobile,
    village,
    block,
    district,
    emergency_contact,
    blood_group,
    chronic_conditions,
    allergies,
    generate_abha
  } = req.body;

  if (!name || !gender || !mobile) {
    return res.status(400).json({ success: false, message: 'Please provide Name, Gender, and Mobile number' });
  }

  // Check if patient already exists with mobile
  const existing = db.findOne('patients', p => p.mobile === mobile.trim());
  if (existing) {
    return res.status(409).json({ success: false, message: 'Patient with this mobile number already exists', existingPatient: existing });
  }

  // Generate ABHA ID if requested
  let abha_id = null;
  let abha_address = null;
  let abha_linked = false;

  if (generate_abha) {
    const randomDigits = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    abha_id = `91-${randomDigits.slice(0, 4)}-${randomDigits.slice(4, 8)}-${randomDigits.slice(8, 12)}`;
    abha_address = `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}.${randomDigits.slice(0, 4)}@abdm`;
    abha_linked = true;
  }

  const patientCount = db.getCollection('patients').length;
  const newPatientId = `PAT-${String(patientCount + 1).padStart(3, '0')}`;

  const newPatient = {
    id: newPatientId,
    user_id: null,
    abha_id: abha_id,
    abha_address: abha_address,
    abha_linked: abha_linked,
    name: name.trim(),
    age: Number(age) || 30,
    gender: gender,
    dob: dob || '1995-01-01',
    mobile: mobile.trim(),
    village: village || (req.user.assigned_village || 'Barkheda'),
    block: block || 'Phanda',
    district: district || 'Bhopal',
    state: 'Madhya Pradesh',
    emergency_contact: emergency_contact || '+91 9876543200',
    blood_group: blood_group || 'O+',
    ayushman_pmjay_id: `PMJAY-MP-2026-${Math.floor(10000 + Math.random() * 90000)}`,
    pmjay_eligible: true,
    pmjay_wallet_balance: 500000,
    assigned_asha_id: req.user.role === 'asha' ? req.user.id : 'USR-ASHA-001',
    assigned_phc_id: req.user.facility_id || 'FAC-PHC-01',
    chronic_conditions: Array.isArray(chronic_conditions) ? chronic_conditions : (chronic_conditions ? [chronic_conditions] : []),
    allergies: Array.isArray(allergies) ? allergies : (allergies ? [allergies] : []),
    created_at: new Date().toISOString()
  };

  db.insert('patients', newPatient);

  // If ASHA created it, also trigger notification
  db.insert('notifications', {
    id: `NOTIF-${Date.now()}`,
    user_id: req.user.id,
    role_target: req.user.role,
    title: 'Patient Registered Successfully',
    message: `${newPatient.name} registered and mapped to village ${newPatient.village}. ABHA ID: ${newPatient.abha_id || 'Pending Link'}.`,
    type: 'success',
    is_read: false,
    link_url: `/dashboard/${req.user.role}`,
    created_at: new Date().toISOString()
  });

  res.status(201).json({
    success: true,
    message: 'Patient registered successfully in rural registry',
    data: newPatient
  });
});

// ABDM / ABHA Generation & Linking Simulation
router.post('/:id/link-abha', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { aadhaar_number, mobile_otp } = req.body;

  const patient = db.findById('patients', id);
  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }

  // Simulated ABDM ABHA generation
  const randomDigits = Math.floor(100000000000 + Math.random() * 900000000000).toString();
  const abha_id = `91-${randomDigits.slice(0, 4)}-${randomDigits.slice(4, 8)}-${randomDigits.slice(8, 12)}`;
  const abha_address = `${patient.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}.${randomDigits.slice(0, 4)}@abdm`;

  const updatedPatient = db.update('patients', patient.id, {
    abha_id,
    abha_address,
    abha_linked: true,
    abha_verified_at: new Date().toISOString()
  });

  res.json({
    success: true,
    message: 'ABHA ID generated & verified successfully via ABDM gateway (Simulated)',
    data: updatedPatient
  });
});

// Longitudinal Health Timeline for patient
router.get('/:id/timeline', authenticateToken, (req, res) => {
  const { id } = req.params;
  const patient = db.findById('patients', id) || db.findOne('patients', p => p.mobile === id || p.abha_id === id);

  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }

  // Scoping check for patient role
  if (req.user.role === 'patient' && req.user.patient_id !== patient.id && req.user.mobile !== patient.mobile) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  // Health records in reverse chronological order
  const records = db.find('health_records', r => r.patient_id === patient.id)
    .sort((a, b) => new Date(b.record_date || b.created_at) - new Date(a.record_date || a.created_at));

  // Referrals for this patient
  const referrals = db.find('referrals', r => r.patient_id === patient.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Teleconsultations for this patient
  const teleconsultations = db.find('teleconsultations', t => t.patient_id === patient.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Active follow-ups
  const followUps = db.find('follow_ups', f => f.patient_id === patient.id);

  res.json({
    success: true,
    patient,
    timeline: records,
    referrals,
    teleconsultations,
    followUps
  });
});

export default router;

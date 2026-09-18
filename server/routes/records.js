import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get single health record details
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const record = db.findById('health_records', id);

  if (!record) {
    return res.status(404).json({ success: false, message: 'Health record not found' });
  }

  // Scoping for patient
  if (req.user.role === 'patient' && req.user.patient_id !== record.patient_id) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const patient = db.findById('patients', record.patient_id);
  const facility = record.facility_id ? db.findById('facilities', record.facility_id) : null;

  res.json({
    success: true,
    data: {
      ...record,
      patient,
      facility
    }
  });
});

// Create new health record (Vitals check by ASHA, OPD consultation by PHC, Specialist notes by Hospital)
router.post('/', authenticateToken, (req, res) => {
  // Patients cannot author professional medical records
  if (req.user.role === 'patient') {
    return res.status(403).json({ 
      success: false, 
      message: 'Patients cannot write professional medical records.' 
    });
  }

  const {
    patient_id,
    record_type, // 'vital_check' | 'opd_consultation' | 'specialist_visit' | 'hospital_discharge' | 'lab_report'
    chief_complaint,
    symptoms,
    vitals, // { bp, pulse, temp, spo2, blood_sugar, weight, hemoglobin }
    clinical_observations,
    diagnosis,
    prescription, // { medicines: [...], notes: '...' }
    test_reports, // [{ test_name, result, date }]
    follow_up_date,
    follow_up_instructions,
    referral_id
  } = req.body;

  if (!patient_id) {
    return res.status(400).json({ success: false, message: 'Patient ID is required' });
  }

  const patient = db.findById('patients', patient_id);
  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }

  const facility = req.user.facility_id ? db.findById('facilities', req.user.facility_id) : null;

  const recordCount = db.getCollection('health_records').length;
  const newRecordId = `REC-2026-${String(recordCount + 1).padStart(3, '0')}`;

  const newRecord = {
    id: newRecordId,
    patient_id: patient.id,
    facility_id: req.user.facility_id || 'FAC-PHC-01',
    facility_name: facility ? facility.name : 'Rural Health Centre',
    recorded_by_id: req.user.id,
    recorded_by_name: req.user.name,
    recorded_by_role: req.user.role === 'asha' ? 'ASHA Worker' : (req.user.role === 'hospital' ? 'Hospital Specialist' : 'Medical Officer'),
    record_type: record_type || (req.user.role === 'asha' ? 'vital_check' : 'opd_consultation'),
    record_date: new Date().toISOString(),
    chief_complaint: chief_complaint || 'Routine health examination',
    symptoms: symptoms || '',
    vitals: vitals || {},
    clinical_observations: clinical_observations || 'General examination within normal limits',
    diagnosis: diagnosis || (req.user.role === 'asha' ? 'ASHA Household Vitals Check' : 'Clinical Evaluation'),
    prescription: prescription || null,
    test_reports: test_reports || [],
    follow_up_date: follow_up_date || null,
    referral_id: referral_id || null,
    created_at: new Date().toISOString()
  };

  db.insert('health_records', newRecord);

  // If follow-up was scheduled, create follow-up task for ASHA
  if (follow_up_date && patient.assigned_asha_id) {
    db.insert('follow_ups', {
      id: `FOL-${Date.now()}`,
      patient_id: patient.id,
      patient_name: patient.name,
      patient_village: patient.village,
      patient_mobile: patient.mobile,
      assigned_asha_id: patient.assigned_asha_id,
      assigned_asha_name: 'Sunita Ahirwar',
      referral_id: referral_id || null,
      category: req.user.role === 'hospital' ? 'Post-Hospitalization Follow-up' : 'Clinical Follow-up & Medication Review',
      due_date: follow_up_date,
      priority: req.user.role === 'hospital' ? 'High' : 'Routine',
      instructions: follow_up_instructions || `Follow-up on ${diagnosis || 'treatment adherence'}. Check vitals.`,
      status: 'Pending',
      created_at: new Date().toISOString()
    });

    // Notify ASHA
    db.insert('notifications', {
      id: `NOTIF-${Date.now()}`,
      user_id: patient.assigned_asha_id,
      role_target: 'asha',
      title: 'New Follow-Up Task Assigned',
      message: `Follow-up scheduled for ${patient.name} (${patient.village}) on ${follow_up_date}.`,
      type: 'info',
      is_read: false,
      link_url: '/dashboard/asha',
      created_at: new Date().toISOString()
    });
  }

  // Notify Patient
  if (patient.user_id) {
    db.insert('notifications', {
      id: `NOTIF-${Date.now() + 1}`,
      user_id: patient.user_id,
      role_target: 'patient',
      title: 'Health Record Updated',
      message: `New ${newRecord.record_type.replace(/_/g, ' ')} added by ${newRecord.recorded_by_name}.`,
      type: 'success',
      is_read: false,
      link_url: '/dashboard/patient',
      created_at: new Date().toISOString()
    });
  }

  res.status(201).json({
    success: true,
    message: 'Health record created and added to patient longitudinal history',
    data: newRecord
  });
});

export default router;

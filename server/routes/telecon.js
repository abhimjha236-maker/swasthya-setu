import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get list of teleconsultations with role scoping and filters
router.get('/', authenticateToken, (req, res) => {
  const { status, patient_id, query } = req.query;
  const user = req.user;

  let telecons = db.getCollection('teleconsultations');

  // Role based scoping
  if (user.role === 'patient') {
    telecons = telecons.filter(t => t.patient_id === user.patient_id || t.requested_by_user_id === user.id);
  } else if (user.role === 'asha') {
    if (user.assigned_village) {
      telecons = telecons.filter(t => 
        t.patient_village?.toLowerCase() === user.assigned_village.toLowerCase() || 
        t.requested_by_user_id === user.id
      );
    }
  } else if (user.role === 'phc' || user.role === 'hospital') {
    if (user.facility_id) {
      telecons = telecons.filter(t => 
        t.facility_id === user.facility_id || 
        t.doctor_user_id === user.id ||
        t.status === 'In Queue' ||
        t.status === 'Requested'
      );
    }
  }

  if (status && status !== 'all') {
    telecons = telecons.filter(t => t.status.toLowerCase() === status.toLowerCase());
  }

  if (patient_id) {
    telecons = telecons.filter(t => t.patient_id === patient_id);
  }

  if (query) {
    const q = query.trim().toLowerCase();
    telecons = telecons.filter(t => 
      t.id.toLowerCase().includes(q) ||
      t.patient_name.toLowerCase().includes(q) ||
      t.reason.toLowerCase().includes(q) ||
      (t.patient_village && t.patient_village.toLowerCase().includes(q)) ||
      (t.doctor_name && t.doctor_name.toLowerCase().includes(q))
    );
  }

  telecons.sort((a, b) => new Date(b.scheduled_time || b.created_at) - new Date(a.scheduled_time || a.created_at));

  res.json({
    success: true,
    total: telecons.length,
    data: telecons
  });
});

// Get single teleconsultation room details with longitudinal history snapshot
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const telecon = db.findById('teleconsultations', id);

  if (!telecon) {
    return res.status(404).json({ success: false, message: 'Teleconsultation session not found' });
  }

  const patient = db.findById('patients', telecon.patient_id);
  const patientHistory = db.find('health_records', r => r.patient_id === telecon.patient_id)
    .sort((a, b) => new Date(b.record_date || b.created_at) - new Date(a.record_date || a.created_at));
  const activeReferrals = db.find('referrals', r => r.patient_id === telecon.patient_id);
  const prescription = telecon.prescription_id ? db.findById('prescriptions', telecon.prescription_id) : null;

  res.json({
    success: true,
    data: {
      ...telecon,
      patient,
      patient_history: patientHistory.slice(0, 5), // Recent 5 encounters
      active_referrals: activeReferrals,
      prescription: prescription || (telecon.medicines ? { medicines: telecon.medicines, notes: telecon.doctor_notes } : null)
    }
  });
});

// Request new teleconsultation (by Patient, ASHA, or PHC)
const handleTeleconRequest = (req, res) => {
  const {
    patient_id,
    reason,
    symptoms,
    specialty,
    preferred_time,
    preferred_time_slot,
    vitals,
    current_vitals
  } = req.body;

  let targetPatientId = patient_id;
  if (req.user.role === 'patient') {
    targetPatientId = req.user.patient_id || patient_id;
  }

  if (!targetPatientId) {
    return res.status(400).json({ success: false, message: 'Patient ID is required to request a consultation.' });
  }

  const patient = db.findById('patients', targetPatientId);
  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient not found in registry.' });
  }

  const teleCount = db.getCollection('teleconsultations').length;
  const newTeleId = `TELE-2026-${String(40 + teleCount + 1).padStart(4, '0')}`;

  const phcFacility = patient.assigned_phc_id ? db.findById('facilities', patient.assigned_phc_id) : db.findById('facilities', 'FAC-PHC-01');

  const newTelecon = {
    id: newTeleId,
    patient_id: patient.id,
    patient_name: patient.name,
    patient_age: patient.age,
    patient_gender: patient.gender,
    patient_village: patient.village,
    patient_mobile: patient.mobile,
    patient_abha: patient.abha_id,
    requested_by_user_id: req.user.id,
    requested_by_name: req.user.role === 'asha' ? `${req.user.name} (ASHA)` : req.user.name,
    doctor_user_id: 'USR-PHC-001',
    doctor_name: specialty === 'Cardiology' ? 'Dr. Rajeshwari Sen (Chief Cardiologist)' : 'Dr. Alok Sharma (Medical Officer)',
    facility_id: phcFacility ? phcFacility.id : 'FAC-PHC-01',
    facility_name: phcFacility ? phcFacility.name : 'PHC Ratibad',
    scheduled_time: preferred_time || new Date(Date.now() + 15 * 60000).toISOString(),
    reason: reason || 'General medical teleconsultation',
    symptoms: symptoms || 'Patient reported acute or ongoing symptoms requiring clinical evaluation',
    specialty: specialty || 'General Medicine',
    status: 'In Queue',
    current_vitals: current_vitals || {
      bp: "124/82 mmHg",
      pulse: 76,
      temp: "98.6 °F",
      spo2: "99%"
    },
    doctor_notes: null,
    diagnosis: null,
    prescription_id: null,
    medicines: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.insert('teleconsultations', newTelecon);

  // 1. Notify Assigned Doctor / PHC Queue
  db.insert('notifications', {
    id: `NOTIF-${Date.now()}`,
    role_target: 'phc',
    title: `Teleconsultation Queue: #${newTelecon.id}`,
    message: `Patient ${patient.name} (${patient.village}) queued for virtual consultation: "${reason}".`,
    type: 'info',
    is_read: false,
    link_url: `/teleconsultation/${newTelecon.id}`,
    created_at: new Date().toISOString()
  });

  // 2. Notify Patient
  if (patient.user_id) {
    db.insert('notifications', {
      id: `NOTIF-${Date.now() + 1}`,
      user_id: patient.user_id,
      role_target: 'patient',
      title: 'Teleconsultation Queued',
      message: `Your teleconsultation request (ID: #${newTelecon.id}) has been confirmed and placed in the doctor's active queue.`,
      type: 'info',
      is_read: false,
      link_url: `/teleconsultation/${newTelecon.id}`,
      created_at: new Date().toISOString()
    });
  }

  // 3. Notify ASHA
  if (patient.assigned_asha_id) {
    db.insert('notifications', {
      id: `NOTIF-${Date.now() + 2}`,
      user_id: patient.assigned_asha_id,
      role_target: 'asha',
      title: `Teleconsultation Scheduled: ${patient.name}`,
      message: `Teleconsultation #${newTelecon.id} queued for ${patient.name}. Reason: ${reason}.`,
      type: 'info',
      is_read: false,
      link_url: '/asha/dashboard',
      created_at: new Date().toISOString()
    });
  }

  res.status(201).json({
    success: true,
    message: `Teleconsultation #${newTelecon.id} queued successfully for ${patient.name}.`,
    data: newTelecon
  });
};

router.post('/request', authenticateToken, handleTeleconRequest);
router.post('/', authenticateToken, handleTeleconRequest);

// Complete teleconsultation & generate verified doctor prescription / longitudinal health record
// (Autonomous diagnosis is strictly prohibited; outcome is entered by authorized doctor)
router.post('/:id/complete', authenticateToken, (req, res) => {
  // Enforce authorized clinical professional role
  if (req.user.role === 'patient') {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Only authorized healthcare professionals can complete teleconsultations and issue clinical prescriptions.'
    });
  }

  const { id } = req.params;
  const {
    doctor_notes,
    diagnosis,
    medicines, // [{ name, dosage, frequency, duration, instructions }]
    follow_up_date,
    follow_up_instructions,
    referral_needed,
    referral_destination_id,
    referral_reason,
    referral_specialty,
    duration
  } = req.body;

  if (!diagnosis || !doctor_notes) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both a Clinical Diagnosis and Doctor Consultation Notes before concluding.'
    });
  }

  const telecon = db.findById('teleconsultations', id);
  if (!telecon) {
    return res.status(404).json({ success: false, message: 'Teleconsultation session not found' });
  }

  const patient = db.findById('patients', telecon.patient_id);
  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient record not found' });
  }

  // 1. Generate Electronic Prescription ID
  const rxId = `RX-2026-${Date.now().toString().slice(-6)}`;
  const validMedicines = Array.isArray(medicines) ? medicines.filter(m => m.name && m.name.trim() !== '') : [];

  const prescriptionRecord = {
    id: rxId,
    patient_id: patient.id,
    patient_name: patient.name,
    patient_abha: patient.abha_id,
    doctor_id: req.user.id,
    doctor_name: req.user.name,
    doctor_registration: req.user.role === 'phc' ? 'MPMC-58291-REG' : 'MPMC-84920-REG',
    facility_id: telecon.facility_id,
    facility_name: telecon.facility_name,
    diagnosis: diagnosis.trim(),
    medicines: validMedicines,
    advice: doctor_notes.trim(),
    issued_at: new Date().toISOString()
  };

  db.insert('prescriptions', prescriptionRecord);

  // 2. Update Teleconsultation Status to Completed
  const updatedTelecon = db.update('teleconsultations', telecon.id, {
    status: 'Completed',
    diagnosis: diagnosis.trim(),
    doctor_notes: doctor_notes.trim(),
    prescription_id: rxId,
    medicines: validMedicines,
    follow_up_date: follow_up_date || null,
    follow_up_instructions: follow_up_instructions || null,
    duration: duration || '12m 45s',
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // 3. Create Longitudinal Health Record entry
  const recordCount = db.getCollection('health_records').length;
  const newRecordId = `REC-2026-${String(recordCount + 1).padStart(3, '0')}`;

  const healthRecord = {
    id: newRecordId,
    patient_id: patient.id,
    facility_id: telecon.facility_id,
    facility_name: telecon.facility_name,
    recorded_by_name: req.user.name,
    recorded_by_role: req.user.role === 'phc' ? 'PHC Medical Officer' : 'Specialist Medical Officer',
    record_type: 'opd_consultation',
    record_date: new Date().toISOString(),
    chief_complaint: `Teleconsultation: ${telecon.reason}`,
    symptoms: telecon.symptoms,
    vitals: telecon.current_vitals,
    clinical_observations: doctor_notes.trim(),
    diagnosis: diagnosis.trim(),
    prescription: validMedicines.length > 0 ? {
      id: rxId,
      medicines: validMedicines,
      notes: doctor_notes.trim()
    } : null,
    test_reports: [],
    follow_up_date: follow_up_date || null,
    created_at: new Date().toISOString()
  };

  db.insert('health_records', healthRecord);

  // 4. Create Follow-up Task if required
  let followUpTask = null;
  if (follow_up_date || follow_up_instructions) {
    followUpTask = {
      id: `FOL-2026-${Date.now().toString().slice(-5)}`,
      patient_id: patient.id,
      patient_name: patient.name,
      patient_village: patient.village,
      patient_mobile: patient.mobile,
      assigned_asha_id: patient.assigned_asha_id || 'ASHA-BHP-01',
      assigned_asha_name: 'Sunita Ahirwar',
      category: 'Teleconsultation Follow-up & Vitals Verification',
      due_date: follow_up_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      priority: 'Medium',
      instructions: follow_up_instructions || `Conduct home visit for ${patient.name}. Review medication adherence and monitor recovery following teleconsultation.`,
      status: 'Pending',
      created_at: new Date().toISOString()
    };
    db.insert('follow_ups', followUpTask);
  }

  // 5. Create Inbound Referral if Specialist Escalation is required
  let createdReferral = null;
  if (referral_needed && referral_destination_id) {
    const toFacility = db.findById('facilities', referral_destination_id) || db.findById('facilities', 'FAC-DH-01');
    const refCount = db.getCollection('referrals').length;
    const newRefId = `REF-2026-${String(100 + refCount + 1)}`;
    
    createdReferral = {
      id: newRefId,
      patient_id: patient.id,
      patient_name: patient.name,
      patient_age: patient.age,
      patient_gender: patient.gender,
      patient_village: patient.village,
      patient_mobile: patient.mobile,
      patient_abha: patient.abha_id,
      from_facility_id: telecon.facility_id,
      from_facility_name: telecon.facility_name,
      to_facility_id: toFacility.id,
      to_facility_name: toFacility.name,
      specialty_requested: referral_specialty || 'Specialist Evaluation',
      referral_type: 'urgent',
      reason: referral_reason || `Referred post teleconsultation: ${diagnosis}`,
      clinical_summary: `Teleconsultation findings: ${doctor_notes}. Diagnosis: ${diagnosis}`,
      notes: `Teleconsultation #${telecon.id} outcome referral.`,
      status: 'Created',
      created_by_user_id: req.user.id,
      created_by_name: req.user.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.insert('referrals', createdReferral);

    db.insert('referral_status_history', {
      id: `RSH-${Date.now()}`,
      referral_id: createdReferral.id,
      from_status: 'None',
      to_status: 'Created',
      changed_by_name: req.user.name,
      remarks: `Referral created post teleconsultation #${telecon.id}. Reason: ${createdReferral.reason}`,
      timestamp: new Date().toISOString()
    });
  }

  // 6. Dispatch Notifications
  if (patient.user_id) {
    db.insert('notifications', {
      id: `NOTIF-${Date.now()}`,
      user_id: patient.user_id,
      role_target: 'patient',
      title: 'Prescription & Teleconsultation Summary Ready',
      message: `Your teleconsultation with ${req.user.name} is complete. Diagnosis: ${diagnosis}. Electronic prescription #${rxId} is ready in your health records.`,
      type: 'success',
      is_read: false,
      link_url: '/patient/records',
      created_at: new Date().toISOString()
    });
  }

  if (patient.assigned_asha_id) {
    db.insert('notifications', {
      id: `NOTIF-${Date.now() + 1}`,
      user_id: patient.assigned_asha_id,
      role_target: 'asha',
      title: `Teleconsultation Concluded: ${patient.name}`,
      message: `Doctor ${req.user.name} concluded consultation for ${patient.name}. Diagnosis: ${diagnosis}.${followUpTask ? ' Follow-up visit assigned.' : ''}`,
      type: 'info',
      is_read: false,
      link_url: '/asha/dashboard',
      created_at: new Date().toISOString()
    });
  }

  res.json({
    success: true,
    message: 'Teleconsultation completed, clinical notes saved, prescription issued, and patient timeline updated.',
    teleconsultation: updatedTelecon,
    prescription: prescriptionRecord,
    health_record: healthRecord,
    follow_up: followUpTask,
    referral: createdReferral
  });
});

export default router;

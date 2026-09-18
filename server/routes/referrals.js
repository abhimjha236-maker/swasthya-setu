import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Standard 9 Referral Lifecycle Statuses:
 * 1. Created
 * 2. Accepted
 * 3. Appointment Scheduled
 * 4. In Transit
 * 5. Arrived
 * 6. Consultation Completed
 * 7. Treatment Completed
 * 8. Follow-up Required
 * 9. Closed
 */

// Get list of referrals with role-based scoping and multi-filters
router.get('/', authenticateToken, (req, res) => {
  const { status, priority, facility_id, patient_id, query } = req.query;
  const user = req.user;

  let referrals = db.getCollection('referrals');

  // Role based scoping
  if (user.role === 'patient') {
    referrals = referrals.filter(r => r.patient_id === user.patient_id || r.patient_mobile === user.mobile);
  } else if (user.role === 'asha') {
    if (user.assigned_village) {
      referrals = referrals.filter(r => 
        !r.patient_village || r.patient_village.toLowerCase() === user.assigned_village.toLowerCase()
      );
    }
  } else if (user.role === 'phc') {
    if (user.facility_id) {
      referrals = referrals.filter(r => r.from_facility_id === user.facility_id || r.to_facility_id === user.facility_id);
    }
  } else if (user.role === 'hospital') {
    if (user.facility_id) {
      referrals = referrals.filter(r => r.to_facility_id === user.facility_id || r.from_facility_id === user.facility_id);
    }
  }
  // District admin monitors all district referrals

  if (status && status !== 'all') {
    referrals = referrals.filter(r => r.status.toLowerCase() === status.toLowerCase());
  }

  if (priority && priority !== 'all') {
    referrals = referrals.filter(r => r.referral_type.toLowerCase() === priority.toLowerCase());
  }

  if (facility_id && facility_id !== 'all') {
    referrals = referrals.filter(r => r.from_facility_id === facility_id || r.to_facility_id === facility_id);
  }

  if (patient_id) {
    referrals = referrals.filter(r => r.patient_id === patient_id);
  }

  if (query) {
    const q = query.trim().toLowerCase();
    referrals = referrals.filter(r => 
      r.id.toLowerCase().includes(q) ||
      (r.patient_name && r.patient_name.toLowerCase().includes(q)) ||
      (r.reason && r.reason.toLowerCase().includes(q)) ||
      (r.from_facility_name && r.from_facility_name.toLowerCase().includes(q)) ||
      (r.to_facility_name && r.to_facility_name.toLowerCase().includes(q)) ||
      (r.specialty_requested && r.specialty_requested.toLowerCase().includes(q))
    );
  }

  // Sort by updated_at / created_at descending
  referrals.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

  res.json({
    success: true,
    total: referrals.length,
    data: referrals
  });
});

// Get single referral by ID with full audit history (ReferralStatusHistory)
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const referral = db.findById('referrals', id);

  if (!referral) {
    return res.status(404).json({ success: false, message: 'Referral not found' });
  }

  const history = db.find('referral_status_history', h => h.referral_id === referral.id)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const patient = db.findById('patients', referral.patient_id);
  const fromFacility = db.findById('facilities', referral.from_facility_id);
  const toFacility = db.findById('facilities', referral.to_facility_id);

  res.json({
    success: true,
    data: {
      ...referral,
      patient,
      from_facility: fromFacility,
      to_facility: toFacility,
      history
    }
  });
});

// Create new referral (Auto-generates Referral ID and registers initial audit history)
router.post('/', authenticateToken, (req, res) => {
  // Patients cannot initiate clinical referrals
  if (req.user.role === 'patient') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access Denied: Patients cannot initiate medical referrals directly. Please consult your ASHA worker or PHC doctor.' 
    });
  }

  const {
    patient_id,
    to_facility_id,
    specialty_requested,
    referral_type, // 'routine' | 'urgent' | 'emergency'
    reason,
    clinical_summary,
    notes,
    preferred_date
  } = req.body;

  if (!patient_id || !to_facility_id || !reason) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide Patient ID, Destination Facility, and Referral Reason' 
    });
  }

  const patient = db.findById('patients', patient_id);
  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }

  let fromFacility = req.user.facility_id ? db.findById('facilities', req.user.facility_id) : null;
  if (!fromFacility) {
    fromFacility = req.user.role === 'asha' ? db.findById('facilities', 'FAC-SUB-01') : db.findById('facilities', 'FAC-PHC-01');
  }

  const toFacility = db.findById('facilities', to_facility_id);
  if (!toFacility) {
    return res.status(404).json({ success: false, message: 'Destination facility not found' });
  }

  // Auto-generate unique Referral ID: REF-2026-XXXXX
  const refCount = db.getCollection('referrals').length;
  const newRefId = `REF-2026-${String(100 + refCount + 1)}`;

  const newReferral = {
    id: newRefId,
    patient_id: patient.id,
    patient_name: patient.name,
    patient_age: patient.age,
    patient_gender: patient.gender,
    patient_village: patient.village,
    patient_mobile: patient.mobile,
    patient_abha: patient.abha_id,
    from_facility_id: fromFacility ? fromFacility.id : 'FAC-PHC-01',
    from_facility_name: fromFacility ? fromFacility.name : 'Primary Health Centre',
    to_facility_id: toFacility.id,
    to_facility_name: toFacility.name,
    specialty_requested: specialty_requested || 'Specialist Care / Triage',
    referral_type: referral_type || 'routine',
    reason: reason.trim(),
    clinical_summary: clinical_summary || notes || '',
    notes: notes || clinical_summary || '',
    status: 'Created',
    appointment_date: preferred_date || null,
    assigned_doctor_name: null,
    rejection_reason: null,
    counter_referral_notes: null,
    created_by_user_id: req.user.id,
    created_by_name: req.user.name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.insert('referrals', newReferral);

  // 1. Initial Audit History Log in ReferralStatusHistory
  db.insert('referral_status_history', {
    id: `RSH-${Date.now()}`,
    referral_id: newReferral.id,
    from_status: 'None',
    to_status: 'Created',
    changed_by_name: req.user.name,
    remarks: `Referral #${newReferral.id} created from ${newReferral.from_facility_name} to ${newReferral.to_facility_name} for ${newReferral.specialty_requested}. Reason: ${reason}. Urgency: ${newReferral.referral_type.toUpperCase()}.`,
    timestamp: new Date().toISOString()
  });

  // 2. Notify Destination Facility Triage Desk
  db.insert('notifications', {
    id: `NOTIF-${Date.now()}`,
    role_target: toFacility.type === 'hospital' ? 'hospital' : 'phc',
    title: `Inbound Referral: #${newReferral.id} (${newReferral.referral_type.toUpperCase()})`,
    message: `Patient ${patient.name} (${patient.village}) referred from ${newReferral.from_facility_name} for ${newReferral.specialty_requested}.`,
    type: newReferral.referral_type === 'emergency' ? 'alert' : 'info',
    is_read: false,
    link_url: `/${toFacility.type === 'hospital' ? 'hospital' : 'phc'}/dashboard`,
    created_at: new Date().toISOString()
  });

  // 3. Notify Patient
  if (patient.user_id) {
    db.insert('notifications', {
      id: `NOTIF-${Date.now() + 1}`,
      user_id: patient.user_id,
      role_target: 'patient',
      title: 'Specialist Referral Initiated',
      message: `Your referral to ${toFacility.name} has been initiated (ID: #${newReferral.id}). Track status in your dashboard.`,
      type: 'info',
      is_read: false,
      link_url: '/patient/referrals',
      created_at: new Date().toISOString()
    });
  }

  // 4. Notify ASHA Worker
  if (patient.assigned_asha_id) {
    db.insert('notifications', {
      id: `NOTIF-${Date.now() + 2}`,
      user_id: patient.assigned_asha_id,
      role_target: 'asha',
      title: `Village Referral Created: ${patient.name}`,
      message: `Referral #${newReferral.id} initiated to ${toFacility.name} for ${patient.name} (${patient.village}).`,
      type: 'info',
      is_read: false,
      link_url: '/asha/dashboard',
      created_at: new Date().toISOString()
    });
  }

  res.status(201).json({
    success: true,
    message: `Referral #${newReferral.id} generated successfully and queued at ${toFacility.name}`,
    data: newReferral
  });
});

// Update Referral Status (State Machine transition with full audit logging & multi-party alerts)
router.patch('/:id/status', authenticateToken, (req, res) => {
  // Patients cannot modify medical referral status
  if (req.user.role === 'patient') {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Patients cannot alter clinical referral states.'
    });
  }

  const { id } = req.params;
  const {
    status, // 'Created' | 'Accepted' | 'Appointment Scheduled' | 'In Transit' | 'Arrived' | 'Consultation Completed' | 'Treatment Completed' | 'Follow-up Required' | 'Closed'
    remarks,
    appointment_date,
    assigned_doctor_name,
    rejection_reason,
    counter_referral_notes,
    follow_up_instructions,
    follow_up_date
  } = req.body;

  const referral = db.findById('referrals', id);
  if (!referral) {
    return res.status(404).json({ success: false, message: 'Referral not found' });
  }

  const previousStatus = referral.status;
  const targetStatus = status || referral.status;

  const updates = {
    status: targetStatus,
    updated_at: new Date().toISOString()
  };

  if (appointment_date) updates.appointment_date = appointment_date;
  if (assigned_doctor_name) updates.assigned_doctor_name = assigned_doctor_name;
  if (rejection_reason) updates.rejection_reason = rejection_reason;
  if (counter_referral_notes) {
    updates.counter_referral_notes = counter_referral_notes;
    updates.notes = counter_referral_notes;
  }

  const updatedReferral = db.update('referrals', referral.id, updates);

  // 1. Persist in ReferralStatusHistory Audit Log
  const historyEntry = {
    id: `RSH-${Date.now()}`,
    referral_id: referral.id,
    from_status: previousStatus,
    to_status: targetStatus,
    changed_by_name: req.user.name,
    remarks: remarks || `Status transitioned from ${previousStatus} to ${targetStatus} by ${req.user.name} (${req.user.role.toUpperCase()}).`,
    timestamp: new Date().toISOString()
  };
  db.insert('referral_status_history', historyEntry);

  const patient = db.findById('patients', referral.patient_id);

  // 2. Dispatch Status Update Notifications to all relevant parties

  // A. Notify Patient
  if (patient && patient.user_id) {
    db.insert('notifications', {
      id: `NOTIF-${Date.now() + 1}`,
      user_id: patient.user_id,
      role_target: 'patient',
      title: `Referral Status: ${targetStatus}`,
      message: `Your referral #${referral.id} has progressed to: ${targetStatus}.${appointment_date ? ` Appointment Slot: ${new Date(appointment_date).toLocaleString()}` : ''}`,
      type: 'info',
      is_read: false,
      link_url: '/patient/referrals',
      created_at: new Date().toISOString()
    });
  }

  // B. Notify Source Facility (PHC)
  db.insert('notifications', {
    id: `NOTIF-${Date.now() + 2}`,
    role_target: 'phc',
    title: `Outbound Referral #${referral.id} ➔ ${targetStatus}`,
    message: `Patient ${referral.patient_name}'s referral at ${referral.to_facility_name} is now: ${targetStatus}.`,
    type: 'info',
    is_read: false,
    link_url: '/phc/dashboard',
    created_at: new Date().toISOString()
  });

  // C. Notify ASHA Worker
  if (patient && patient.assigned_asha_id) {
    db.insert('notifications', {
      id: `NOTIF-${Date.now() + 3}`,
      user_id: patient.assigned_asha_id,
      role_target: 'asha',
      title: `Referral Update: ${referral.patient_name} (${targetStatus})`,
      message: `Referral #${referral.id} status is now: ${targetStatus}. ${remarks || ''}`,
      type: (targetStatus === 'Treatment Completed' || targetStatus === 'Follow-up Required') ? 'alert' : 'info',
      is_read: false,
      link_url: '/asha/dashboard',
      created_at: new Date().toISOString()
    });
  }

  // 3. Automated Closed-Loop Follow-Up Generation on Discharge / Treatment Completion
  if ((targetStatus === 'Treatment Completed' || targetStatus === 'Follow-up Required') && patient) {
    if (patient.assigned_asha_id) {
      db.insert('follow_ups', {
        id: `FOL-${Date.now()}`,
        patient_id: patient.id,
        patient_name: patient.name,
        patient_village: patient.village,
        patient_mobile: patient.mobile,
        assigned_asha_id: patient.assigned_asha_id,
        assigned_asha_name: 'Sunita Ahirwar',
        referral_id: referral.id,
        category: 'Post-Referral Care & Doorstep Monitoring',
        due_date: follow_up_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        priority: referral.referral_type === 'emergency' ? 'Urgent' : 'High',
        instructions: follow_up_instructions || counter_referral_notes || `Conduct home visit for ${patient.name} following hospital treatment at ${referral.to_facility_name}. Check recovery and medication adherence.`,
        status: 'Pending',
        created_at: new Date().toISOString()
      });
    }
  }

  res.json({
    success: true,
    message: `Referral status successfully updated to ${targetStatus}`,
    data: updatedReferral
  });
});

export default router;

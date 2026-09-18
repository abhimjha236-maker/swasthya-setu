import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get follow-up tasks (ASHA field tasks / PHC follow-ups)
router.get('/', authenticateToken, (req, res) => {
  const { asha_id, patient_id, status } = req.query;
  const user = req.user;

  let followUps = db.getCollection('follow_ups');

  if (user.role === 'asha') {
    followUps = followUps.filter(f => f.assigned_asha_id === user.id || f.patient_village?.toLowerCase() === user.assigned_village?.toLowerCase());
  } else if (user.role === 'patient') {
    followUps = followUps.filter(f => f.patient_id === user.patient_id);
  }

  if (status && status !== 'all') {
    followUps = followUps.filter(f => f.status.toLowerCase() === status.toLowerCase());
  }

  if (patient_id) {
    followUps = followUps.filter(f => f.patient_id === patient_id);
  }

  followUps.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  res.json({
    success: true,
    total: followUps.length,
    data: followUps
  });
});

// Complete follow-up task (ASHA logs home visit observation)
router.patch('/:id/complete', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { completion_notes, vitals } = req.body;

  const followUp = db.findById('follow_ups', id);
  if (!followUp) {
    return res.status(404).json({ success: false, message: 'Follow-up task not found' });
  }

  const updatedFollowUp = db.update('follow_ups', followUp.id, {
    status: 'Completed',
    completion_notes: completion_notes || 'Home visit completed. Medication adherence verified.',
    completed_at: new Date().toISOString()
  });

  // Also log a vital check record in patient's longitudinal history
  if (vitals || completion_notes) {
    db.insert('health_records', {
      id: `REC-2026-${Date.now().toString().slice(-4)}`,
      patient_id: followUp.patient_id,
      facility_id: 'FAC-SUB-01',
      facility_name: 'ASHA Home Care Visit',
      recorded_by_id: req.user.id,
      recorded_by_name: req.user.name,
      recorded_by_role: 'ASHA Worker',
      record_type: 'vital_check',
      record_date: new Date().toISOString(),
      chief_complaint: `Follow-up Home Visit: ${followUp.category}`,
      symptoms: 'Patient evaluated at home',
      vitals: vitals || {
        bp: "128/82 mmHg",
        pulse: 76,
        temp: "98.4 °F",
        spo2: "98%"
      },
      clinical_observations: completion_notes || 'Patient adhering to prescribed medicines. No acute distress.',
      diagnosis: 'Home Follow-up & Treatment Adherence Check',
      prescription: null,
      test_reports: [],
      follow_up_date: null,
      created_at: new Date().toISOString()
    });
  }

  res.json({
    success: true,
    message: 'Follow-up visit recorded and logged in patient health history',
    data: updatedFollowUp
  });
});

export default router;

import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { JWT_SECRET, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Preset Demo credentials list for SIH Judges and Reviewers
const DEMO_CREDENTIALS = [
  {
    role: "patient",
    roleLabel: "Patient",
    identifier: "9876543210",
    name: "Ramesh Kumar Verma",
    badge: "ABHA Linked (48M)",
    description: "Rural patient with longitudinal CAD history & active cardiology referral"
  },
  {
    role: "asha",
    roleLabel: "ASHA Worker",
    identifier: "ASHA-BHP-01",
    name: "Sunita Ahirwar",
    badge: "Barkheda Village",
    description: "Doorstep vitals screening, maternal ANC follow-ups, and rural referrals"
  },
  {
    role: "phc",
    roleLabel: "PHC (Primary Health Centre)",
    identifier: "PHC-RTB-01",
    name: "Dr. Alok Sharma",
    badge: "PHC Ratibad",
    description: "OPD clinical consultation, teleconsultation desk & DH referral creation"
  },
  {
    role: "hospital",
    roleLabel: "District Hospital",
    identifier: "DH-BHP-01",
    name: "Dr. Rajeshwari Sen",
    badge: "DH Bhopal (Cardiology)",
    description: "Referral triage desk, specialist diagnosis & discharge counter-referral"
  },
  {
    role: "admin",
    roleLabel: "District Administrator",
    identifier: "ADMIN-BHP-01",
    name: "Dr. Arvind Shrivastava (CMO)",
    badge: "District Health Mission",
    description: "District-level disease surveillance, facility workload & medicine supply chain"
  }
];

// Return demo credentials list
router.get('/demo-credentials', (req, res) => {
  res.json({
    success: true,
    data: DEMO_CREDENTIALS
  });
});

// Simulated OTP generation
router.post('/send-otp', (req, res) => {
  const { mobile } = req.body;
  if (!mobile || mobile.length < 10) {
    return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile number' });
  }

  // Simulated OTP is standard 6-digit (for demo convenience: 123456 or dynamically generated)
  const otp = '123456';
  res.json({
    success: true,
    message: `Verification OTP dispatched to +91 ${mobile}`,
    otp: otp, // Returned for instant demo testing
    expires_in_seconds: 300
  });
});

// Common Unified Login Endpoint
router.post('/login', (req, res) => {
  const { role, identifier, password, otp } = req.body;

  if (!role || !['patient', 'asha', 'phc', 'hospital', 'admin'].includes(role)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid or missing role selection. Please select one of: Patient, ASHA Worker, PHC, District Hospital, or District Administrator.' 
    });
  }

  if (!identifier || identifier.trim().length === 0) {
    const identifierNames = {
      patient: 'Mobile Number or ABHA ID',
      asha: 'ASHA Worker ID or Registered Mobile',
      phc: 'PHC Facility Code / User ID',
      hospital: 'District Hospital Facility ID',
      admin: 'CMHO Administrator ID'
    };
    return res.status(400).json({ 
      success: false, 
      message: `Please provide your ${identifierNames[role] || 'Identifier'}.` 
    });
  }

  const cleanId = identifier.trim();

  // Role-specific format validation
  if (role === 'patient') {
    const isMobile = /^\d{10}$/.test(cleanId.replace(/\s+/g, ''));
    const isAbha = /^\d{2}-?\d{4}-?\d{4}-?\d{4}$/.test(cleanId) || cleanId.length >= 10;
    if (!isMobile && !isAbha) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit mobile number or 14-digit ABHA ID.'
      });
    }
  }

  // Find user by identifier and role
  const user = db.findOne('users', u => 
    u.role === role && 
    (u.identifier === cleanId || 
     u.mobile === cleanId || 
     u.username === cleanId || 
     (cleanId.includes('-') && u.identifier === cleanId.replace(/-/g, '')))
  );

  if (!user) {
    // If patient logging in for first time with OTP, dynamically locate or register
    if (role === 'patient') {
      const patient = db.findOne('patients', p => 
        p.mobile === cleanId || 
        p.id === cleanId || 
        p.abha_id === cleanId
      );
      if (patient) {
        if (otp && otp !== '123456' && otp.length !== 6) {
          return res.status(401).json({ success: false, message: 'Invalid OTP. Please enter the 6-digit OTP sent to your phone (Demo: 123456).' });
        }
        // Generate valid session for existing patient
        const tokenPayload = {
          id: patient.user_id || `USR-${patient.id}`,
          patient_id: patient.id,
          role: 'patient',
          name: patient.name,
          identifier: patient.mobile,
          facility_id: patient.assigned_phc_id
        };
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
        return res.json({
          success: true,
          message: 'Logged in successfully via Patient Mobile OTP',
          token,
          user: tokenPayload,
          patient
        });
      }
    }

    return res.status(401).json({
      success: false,
      message: `Authentication failed: No active ${role.toUpperCase()} profile found with identifier '${cleanId}'. Please verify your credentials or select a Demo Profile.`
    });
  }

  // Verify authentication method
  if (otp) {
    if (otp !== '123456' && otp.length !== 6) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid OTP code. For demo demonstration, please use verification OTP: 123456.' 
      });
    }
  } else if (password) {
    let isValidPassword = false;
    if (user.password_hash) {
      try {
        isValidPassword = bcrypt.compareSync(password, user.password_hash);
      } catch (e) {
        isValidPassword = false;
      }
    }
    // Also allow demo password 'password123'
    if (!isValidPassword && password === 'password123') {
      isValidPassword = true;
    }

    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid password. Please check your credentials (Demo password: password123).' 
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      message: 'Please provide either a password or OTP to authenticate.'
    });
  }

  // Get associated patient profile if user is a patient
  let patientProfile = null;
  if (user.role === 'patient') {
    patientProfile = db.findOne('patients', p => p.user_id === user.id || p.id === user.patient_id || p.mobile === user.mobile);
  }

  // Get facility details
  let facility = null;
  if (user.facility_id) {
    facility = db.findById('facilities', user.facility_id);
  }

  const tokenPayload = {
    id: user.id,
    role: user.role,
    name: user.name,
    identifier: user.identifier,
    mobile: user.mobile,
    email: user.email,
    facility_id: user.facility_id,
    patient_id: patientProfile ? patientProfile.id : null,
    assigned_village: user.assigned_village || null
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    success: true,
    message: `Welcome back, ${user.name}`,
    token,
    user: tokenPayload,
    patient: patientProfile,
    facility
  });
});

// Validate current session / Me endpoint
router.get('/me', authenticateToken, (req, res) => {
  const user = db.findById('users', req.user.id);
  let patientProfile = null;
  let facility = null;

  if (req.user.role === 'patient') {
    patientProfile = db.findOne('patients', p => p.user_id === req.user.id || p.id === req.user.patient_id || p.mobile === req.user.mobile);
  }

  if (req.user.facility_id) {
    facility = db.findById('facilities', req.user.facility_id);
  }

  res.json({
    success: true,
    user: req.user,
    details: user,
    patient: patientProfile,
    facility
  });
});

// Database reset endpoint for testing
router.post('/reset-demo-data', (req, res) => {
  db.reset();
  res.json({
    success: true,
    message: 'Database has been reset to original Bhopal District demonstration dataset.'
  });
});

export default router;

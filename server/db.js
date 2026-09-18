import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'swasthya_setu.json');

// Initial comprehensive dataset for Bhopal District (SIH Demonstration)
const getInitialData = () => {
  return {
    facilities: [
      {
        id: "FAC-PHC-01",
        name: "Primary Health Centre, Ratibad",
        type: "phc",
        block: "Phanda",
        district: "Bhopal",
        state: "Madhya Pradesh",
        address: "Main Road, Near Gram Panchayat, Ratibad, Bhopal - 462044",
        contact_number: "+91 755 2894101",
        bed_capacity: 12,
        active_doctors: 3,
        emergency_services: true
      },
      {
        id: "FAC-PHC-02",
        name: "Primary Health Centre, Berasia",
        type: "phc",
        block: "Berasia",
        district: "Bhopal",
        state: "Madhya Pradesh",
        address: "Hospital Road, Berasia, Bhopal - 463106",
        contact_number: "+91 755 2722302",
        bed_capacity: 15,
        active_doctors: 4,
        emergency_services: true
      },
      {
        id: "FAC-PHC-03",
        name: "Primary Health Centre, Phanda",
        type: "phc",
        block: "Phanda",
        district: "Bhopal",
        state: "Madhya Pradesh",
        address: "National Highway 46, Phanda Kalan, Bhopal - 462030",
        contact_number: "+91 755 2844210",
        bed_capacity: 10,
        active_doctors: 2,
        emergency_services: true
      },
      {
        id: "FAC-DH-01",
        name: "Bhopal District Memorial Hospital",
        type: "hospital",
        block: "Bhopal Urban",
        district: "Bhopal",
        state: "Madhya Pradesh",
        address: "Shahjahanabad, Royal Market, Bhopal - 462001",
        contact_number: "+91 755 2738800",
        bed_capacity: 350,
        active_doctors: 48,
        emergency_services: true,
        specialties: ["Cardiology", "Pulmonology", "Gynaecology & Obstetrics", "Orthopaedics", "Paediatrics", "General Medicine", "Oncology"]
      },
      {
        id: "FAC-SUB-01",
        name: "Ayushman Arogya Mandir (Sub-Centre), Barkheda",
        type: "sub_centre",
        block: "Phanda",
        district: "Bhopal",
        state: "Madhya Pradesh",
        address: "Barkheda Village, Post Ratibad, Bhopal - 462044",
        contact_number: "+91 755 2894500",
        bed_capacity: 2,
        active_doctors: 1,
        emergency_services: false
      }
    ],

    users: [
      {
        id: "USR-PAT-001",
        identifier: "9876543210",
        username: "patient_ramesh",
        password_hash: "$2b$10$EX.fWWwpXnwKKU6A5Xw6VOMcNu02x/IXabSa3UXxsMzccp5Sa3mly", // demo password: password123
        role: "patient",
        name: "Ramesh Kumar Verma",
        mobile: "9876543210",
        email: "ramesh.verma@example.com",
        facility_id: "FAC-PHC-01",
        patient_id: "PAT-001",
        created_at: "2026-01-05T09:00:00.000Z"
      },
      {
        id: "USR-ASHA-001",
        identifier: "ASHA-BHP-01",
        username: "asha_sunita",
        password_hash: "$2b$10$EX.fWWwpXnwKKU6A5Xw6VOMcNu02x/IXabSa3UXxsMzccp5Sa3mly", // demo password: password123
        role: "asha",
        name: "Sunita Ahirwar (ASHA)",
        mobile: "9876500001",
        email: "sunita.asha@swasthyasetu.gov.in",
        facility_id: "FAC-SUB-01",
        assigned_village: "Barkheda",
        assigned_block: "Phanda",
        assigned_households: 142,
        created_at: "2025-11-10T08:30:00.000Z"
      },
      {
        id: "USR-PHC-001",
        identifier: "PHC-RTB-01",
        username: "phc_ratibad",
        password_hash: "$2b$10$EX.fWWwpXnwKKU6A5Xw6VOMcNu02x/IXabSa3UXxsMzccp5Sa3mly", // demo password: password123
        role: "phc",
        name: "Dr. Alok Sharma (Medical Officer)",
        mobile: "9876500002",
        email: "mo.ratibad@mp.gov.in",
        facility_id: "FAC-PHC-01",
        designation: "Medical Officer In-Charge",
        created_at: "2025-08-15T10:00:00.000Z"
      },
      {
        id: "USR-DH-001",
        identifier: "DH-BHP-01",
        username: "dh_bhopal",
        password_hash: "$2b$10$EX.fWWwpXnwKKU6A5Xw6VOMcNu02x/IXabSa3UXxsMzccp5Sa3mly", // demo password: password123
        role: "hospital",
        name: "Dr. Rajeshwari Sen (Chief Cardiologist & Referral In-charge)",
        mobile: "9876500003",
        email: "referral.dhbhopal@mp.gov.in",
        facility_id: "FAC-DH-01",
        department: "Cardiology & Emergency Triage",
        created_at: "2025-06-01T09:15:00.000Z"
      },
      {
        id: "USR-ADM-001",
        identifier: "ADMIN-BHP-01",
        username: "cmo_bhopal",
        password_hash: "$2b$10$EX.fWWwpXnwKKU6A5Xw6VOMcNu02x/IXabSa3UXxsMzccp5Sa3mly", // demo password: password123
        role: "admin",
        name: "Dr. Arvind Shrivastava (CMO Bhopal)",
        mobile: "9876500004",
        email: "cmo.bhopal@mp.gov.in",
        facility_id: "FAC-DH-01",
        designation: "Chief Medical & Health Officer (CMHO)",
        created_at: "2025-01-01T08:00:00.000Z"
      }
    ],

    patients: [
      {
        id: "PAT-001",
        user_id: "USR-PAT-001",
        abha_id: "91-4829-1029-4821",
        abha_address: "ramesh.verma@abdm",
        abha_linked: true,
        name: "Ramesh Kumar Verma",
        age: 48,
        gender: "Male",
        dob: "1978-04-12",
        mobile: "9876543210",
        village: "Barkheda",
        block: "Phanda",
        district: "Bhopal",
        state: "Madhya Pradesh",
        emergency_contact: "+91 9876543299 (Wife: Sita Verma)",
        blood_group: "B+",
        ayushman_pmjay_id: "PMJAY-MP-2026-90412",
        pmjay_eligible: true,
        pmjay_wallet_balance: 485000,
        assigned_asha_id: "USR-ASHA-001",
        assigned_phc_id: "FAC-PHC-01",
        chronic_conditions: ["Hypertension", "Exertional Angina Suspect"],
        allergies: ["Penicillin"],
        photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        created_at: "2026-01-05T09:00:00.000Z"
      },
      {
        id: "PAT-002",
        user_id: null,
        abha_id: "91-7721-3490-1123",
        abha_address: "sunita.devi.89@abdm",
        abha_linked: true,
        name: "Sunita Devi",
        age: 26,
        gender: "Female",
        dob: "2000-08-20",
        mobile: "9876543211",
        village: "Barkheda",
        block: "Phanda",
        district: "Bhopal",
        state: "Madhya Pradesh",
        emergency_contact: "+91 9876543288 (Husband: Manoj Devi)",
        blood_group: "O+",
        ayushman_pmjay_id: "PMJAY-MP-2026-81204",
        pmjay_eligible: true,
        pmjay_wallet_balance: 500000,
        assigned_asha_id: "USR-ASHA-001",
        assigned_phc_id: "FAC-PHC-01",
        chronic_conditions: ["High-Risk Pregnancy (28 Weeks ANC, Gestational Anaemia)"],
        allergies: ["None"],
        created_at: "2026-01-12T11:20:00.000Z"
      },
      {
        id: "PAT-003",
        user_id: null,
        abha_id: "91-6201-9923-4412",
        abha_address: "mohan.lal.patel@abdm",
        abha_linked: true,
        name: "Mohan Lal Patel",
        age: 62,
        gender: "Male",
        dob: "1964-02-14",
        mobile: "9876543212",
        village: "Ratibad",
        block: "Phanda",
        district: "Bhopal",
        state: "Madhya Pradesh",
        emergency_contact: "+91 9876543277 (Son: Ajay Patel)",
        blood_group: "A+",
        ayushman_pmjay_id: "PMJAY-MP-2026-55192",
        pmjay_eligible: true,
        pmjay_wallet_balance: 390000,
        assigned_asha_id: "USR-ASHA-001",
        assigned_phc_id: "FAC-PHC-01",
        chronic_conditions: ["Type-2 Diabetes Mellitus", "Diabetic Neuropathy"],
        allergies: ["Sulfa drugs"],
        created_at: "2026-01-18T14:45:00.000Z"
      },
      {
        id: "PAT-004",
        user_id: null,
        abha_id: "91-3145-8821-0045",
        abha_address: "priya.sharma.child@abdm",
        abha_linked: true,
        name: "Priya Sharma",
        age: 8,
        gender: "Female",
        dob: "2018-05-10",
        mobile: "9876543213",
        village: "Phanda",
        block: "Phanda",
        district: "Bhopal",
        state: "Madhya Pradesh",
        emergency_contact: "+91 9876543266 (Mother: Radha Sharma)",
        blood_group: "B+",
        ayushman_pmjay_id: "PMJAY-MP-2026-30219",
        pmjay_eligible: true,
        pmjay_wallet_balance: 500000,
        assigned_asha_id: "USR-ASHA-001",
        assigned_phc_id: "FAC-PHC-01",
        chronic_conditions: ["Childhood Bronchial Asthma"],
        allergies: ["Dust/Pollen"],
        created_at: "2026-02-01T10:10:00.000Z"
      },
      {
        id: "PAT-005",
        user_id: null,
        abha_id: "91-5512-4019-7823",
        abha_address: "rajesh.ahirwar@abdm",
        abha_linked: true,
        name: "Rajesh Ahirwar",
        age: 34,
        gender: "Male",
        dob: "1992-11-03",
        mobile: "9876543214",
        village: "Barkheda",
        block: "Phanda",
        district: "Bhopal",
        state: "Madhya Pradesh",
        emergency_contact: "+91 9876543255 (Brother: Kamlesh)",
        blood_group: "AB+",
        ayushman_pmjay_id: "PMJAY-MP-2026-77312",
        pmjay_eligible: true,
        pmjay_wallet_balance: 500000,
        assigned_asha_id: "USR-ASHA-001",
        assigned_phc_id: "FAC-PHC-01",
        chronic_conditions: ["Presumed Pulmonary Tuberculosis (Under DOTS Evaluation)"],
        allergies: ["None"],
        created_at: "2026-02-10T16:00:00.000Z"
      }
    ],

    health_records: [
      {
        id: "REC-2026-001",
        patient_id: "PAT-001",
        facility_id: "FAC-SUB-01",
        facility_name: "Ayushman Arogya Mandir (Sub-Centre), Barkheda",
        recorded_by_name: "Sunita Ahirwar (ASHA)",
        recorded_by_role: "ASHA Worker",
        record_type: "vital_check",
        record_date: "2026-01-10T10:30:00.000Z",
        chief_complaint: "Routine monthly NCD doorstep screening. Patient reported mild dizziness and afternoon fatigue.",
        vitals: {
          bp: "150/96 mmHg",
          pulse: 82,
          temp: "98.4 °F",
          spo2: "98%",
          blood_sugar_random: "138 mg/dL",
          weight: "74 kg",
          bmi: "25.8"
        },
        clinical_observations: "Elevated systolic and diastolic BP observed on two consecutive readings 15 mins apart. Recommended salt restriction and advised immediate visit to PHC Ratibad.",
        diagnosis: "Stage-2 Essential Hypertension (Uncontrolled)",
        follow_up_date: "2026-01-15",
        created_at: "2026-01-10T10:45:00.000Z"
      },
      {
        id: "REC-2026-002",
        patient_id: "PAT-001",
        facility_id: "FAC-PHC-01",
        facility_name: "Primary Health Centre, Ratibad",
        recorded_by_name: "Dr. Alok Sharma",
        recorded_by_role: "Medical Officer",
        record_type: "opd_consultation",
        record_date: "2026-01-16T11:15:00.000Z",
        chief_complaint: "Referred by ASHA for high BP. Patient also notes occasional retrosternal tightness during heavy farm work.",
        vitals: {
          bp: "146/92 mmHg",
          pulse: 78,
          temp: "98.6 °F",
          spo2: "99%",
          blood_sugar_fasting: "102 mg/dL",
          weight: "73.5 kg"
        },
        clinical_observations: "S1 S2 heard normal, no murmur. Resting ECG showed mild ST-T wave changes in leads V4-V6. Bilateral chest clear. Initiated antihypertensive therapy and ordered lipid profile.",
        diagnosis: "Hypertensive Heart Disease Suspect / Grade-1 Exertional Angina",
        prescription: {
          id: "RX-2026-001",
          medicines: [
            { name: "Amlodipine 5mg", dosage: "1 Tablet", frequency: "Once daily (Morning)", duration: "30 Days", instructions: "Take after breakfast with water" },
            { name: "Aspirin 75mg Gastro-resistant", dosage: "1 Tablet", frequency: "Once daily (Night)", duration: "30 Days", instructions: "Take after dinner" },
            { name: "Atorvastatin 10mg", dosage: "1 Tablet", frequency: "Once daily (Night)", duration: "30 Days", instructions: "Take at bedtime" }
          ],
          notes: "Strict low salt diet, avoid strenuous lifting until specialist review. Walk 30 mins daily."
        },
        test_reports: [
          { test_name: "12-Lead Resting ECG", result: "Mild ST depression in lateral leads", status: "Completed", date: "2026-01-16" },
          { test_name: "Random Blood Sugar", result: "114 mg/dL (Normal)", status: "Completed", date: "2026-01-16" }
        ],
        follow_up_date: "2026-02-15",
        created_at: "2026-01-16T11:45:00.000Z"
      },
      {
        id: "REC-2026-003",
        patient_id: "PAT-001",
        facility_id: "FAC-DH-01",
        facility_name: "Bhopal District Memorial Hospital",
        recorded_by_name: "Dr. Rajeshwari Sen",
        recorded_by_role: "Chief Cardiologist",
        record_type: "specialist_visit",
        record_date: "2026-02-20T14:30:00.000Z",
        chief_complaint: "Specialist consultation following urgent tele-referral from PHC Ratibad. Patient presented with recurrent effort angina.",
        vitals: {
          bp: "134/86 mmHg",
          pulse: 72,
          temp: "98.6 °F",
          spo2: "98%",
          weight: "73 kg"
        },
        clinical_observations: "Echocardiogram: LVEF 55%, mild concentric LVH, no regional wall motion abnormality at rest. Treadmill Test (TMT) mildly positive at Stage 3 Bruce protocol. Stable Coronary Artery Disease managed medically. PM-JAY package pre-authorized.",
        diagnosis: "Stable Coronary Artery Disease (CAD) / Hypertensive Cardiovascular Disease (ICD-10: I25.1)",
        prescription: {
          id: "RX-2026-002",
          medicines: [
            { name: "Metoprolol Succinate 25mg ER", dosage: "1 Tablet", frequency: "Once daily (Morning)", duration: "60 Days", instructions: "Keep pulse rate around 65-70 bpm" },
            { name: "Telmisartan 40mg + Amlodipine 5mg", dosage: "1 Tablet", frequency: "Once daily (Morning)", duration: "60 Days", instructions: "Take after breakfast" },
            { name: "Atorvastatin 20mg", dosage: "1 Tablet", frequency: "Once daily (Night)", duration: "60 Days", instructions: "Strict cholesterol control" },
            { name: "Sorbitrate 5mg (Sublingual)", dosage: "1 Tablet SOS", frequency: "As needed for chest pain", duration: "10 Tablets", instructions: "Place under tongue if acute chest pain occurs" }
          ],
          notes: "Counter-referred back to PHC Ratibad and ASHA Sunita for bi-weekly home BP monitoring. Next DH Cardiology review in 60 days."
        },
        test_reports: [
          { test_name: "2D Echocardiography & Color Doppler", result: "LVEF 55%, Mild Concentric LVH, Grade-1 Diastolic Dysfunction", status: "Completed", date: "2026-02-20" },
          { test_name: "Serum Lipid Profile", result: "Total Chol: 198 mg/dL, LDL: 122 mg/dL, HDL: 44 mg/dL, Triglycerides: 160 mg/dL", status: "Completed", date: "2026-02-20" }
        ],
        follow_up_date: "2026-04-20",
        created_at: "2026-02-20T15:10:00.000Z"
      },
      {
        id: "REC-2026-004",
        patient_id: "PAT-002",
        facility_id: "FAC-PHC-01",
        facility_name: "Primary Health Centre, Ratibad",
        recorded_by_name: "Dr. Alok Sharma",
        recorded_by_role: "Medical Officer",
        record_type: "opd_consultation",
        record_date: "2026-02-12T10:00:00.000Z",
        chief_complaint: "Antenatal Check-up (ANC-3) at 28 weeks gestation. Mild pedal edema and fatigue.",
        vitals: {
          bp: "118/76 mmHg",
          pulse: 84,
          temp: "98.4 °F",
          spo2: "99%",
          hemoglobin: "9.2 g/dL (Mild Anaemia)",
          fundal_height: "28 cm",
          fetal_heart_rate: "144 bpm"
        },
        clinical_observations: "Single live intrauterine fetus in cephalic presentation. Adequate liquor. Mild microcytic hypochromic anaemia. Prescribed double-dose Iron Folic Acid and Calcium supplement.",
        diagnosis: "Primi Gravida at 28 Weeks with Gestational Anaemia (ICD-10: O99.0)",
        prescription: {
          id: "RX-2026-003",
          medicines: [
            { name: "Iron & Folic Acid (IFA) Tablets", dosage: "2 Tablets", frequency: "Daily after lunch", duration: "60 Days", instructions: "Do not consume with tea or milk" },
            { name: "Calcium Carbonate 500mg + Vit D3", dosage: "1 Tablet", frequency: "Twice daily after meals", duration: "60 Days", instructions: "Take with water" }
          ],
          notes: "ASHA Sunita instructed to ensure nutrition basket intake and monitor fetal kicks."
        },
        follow_up_date: "2026-03-12",
        created_at: "2026-02-12T10:40:00.000Z"
      }
    ],

    referrals: [
      {
        id: "REF-2026-00101",
        patient_id: "PAT-001",
        patient_name: "Ramesh Kumar Verma",
        patient_age: 48,
        patient_gender: "Male",
        patient_village: "Barkheda",
        patient_mobile: "9876543210",
        patient_abha: "91-4829-1029-4821",
        from_facility_id: "FAC-PHC-01",
        from_facility_name: "PHC Ratibad",
        to_facility_id: "FAC-DH-01",
        to_facility_name: "Bhopal District Memorial Hospital",
        specialty_requested: "Cardiology & Emergency Triage",
        referral_type: "urgent", // 'routine' | 'urgent' | 'emergency'
        reason: "Suspected Stable Ischaemic Heart Disease / Exertional Angina with ST wave alterations",
        clinical_summary: "48M known hypertensive, referred for 2D Echo, TMT, and specialist cardiology evaluation. BP initially 150/96, now on Amlodipine. PM-JAY pre-authorization supported.",
        status: "Treatment Completed", // 'Created' | 'Accepted' | 'Appointment Scheduled' | 'In Transit' | 'Arrived' | 'Consultation Completed' | 'Treatment Completed' | 'Follow-up Required' | 'Closed'
        appointment_date: "2026-02-20T14:30:00.000Z",
        assigned_doctor_name: "Dr. Rajeshwari Sen (Chief Cardiologist)",
        rejection_reason: null,
        counter_referral_notes: "Specialist consultation, 2D Echo completed. Stable CAD confirmed. Patient discharged with optimized dual therapy. Back-referred to PHC Ratibad & ASHA Sunita for monthly adherence.",
        created_by_user_id: "USR-PHC-001",
        created_at: "2026-01-16T12:00:00.000Z",
        updated_at: "2026-02-20T16:00:00.000Z"
      },
      {
        id: "REF-2026-00102",
        patient_id: "PAT-005",
        patient_name: "Rajesh Ahirwar",
        patient_age: 34,
        patient_gender: "Male",
        patient_village: "Barkheda",
        patient_mobile: "9876543214",
        patient_abha: "91-5512-4019-7823",
        from_facility_id: "FAC-PHC-01",
        from_facility_name: "PHC Ratibad",
        to_facility_id: "FAC-DH-01",
        to_facility_name: "Bhopal District Memorial Hospital",
        specialty_requested: "Pulmonology / NTEP Centre",
        referral_type: "urgent",
        reason: "Chronic productive cough > 3 weeks, evening pyrexia, hemoptysis streaks",
        clinical_summary: "34M with suspected open pulmonary TB. Sputum microscopy pending. Requires urgent CBNAAT (GeneXpert) and Chest X-Ray PA view.",
        status: "In Transit",
        appointment_date: "2026-09-19T10:00:00.000Z",
        assigned_doctor_name: "Dr. V. K. Malhotra (Pulmonologist)",
        rejection_reason: null,
        counter_referral_notes: null,
        created_by_user_id: "USR-PHC-001",
        created_at: "2026-09-17T09:30:00.000Z",
        updated_at: "2026-09-18T14:20:00.000Z"
      },
      {
        id: "REF-2026-00103",
        patient_id: "PAT-002",
        patient_name: "Sunita Devi",
        patient_age: 26,
        patient_gender: "Female",
        patient_village: "Barkheda",
        patient_mobile: "9876543211",
        patient_abha: "91-7721-3490-1123",
        from_facility_id: "FAC-SUB-01",
        from_facility_name: "Sub-Centre Barkheda",
        to_facility_id: "FAC-PHC-01",
        to_facility_name: "PHC Ratibad",
        specialty_requested: "Gynaecology & Obstetrics (ANC High-Risk)",
        referral_type: "routine",
        reason: "3rd Trimester High-Risk ANC Assessment & Ultrasonography Scheduling",
        clinical_summary: "26F Primi at 28 weeks with Hb 9.2 g/dL. Recommended doctor clinical review and iron IV sucrose feasibility check.",
        status: "Accepted",
        appointment_date: "2026-09-20T11:00:00.000Z",
        assigned_doctor_name: "Dr. Alok Sharma",
        rejection_reason: null,
        counter_referral_notes: null,
        created_by_user_id: "USR-ASHA-001",
        created_at: "2026-09-18T08:30:00.000Z",
        updated_at: "2026-09-18T10:15:00.000Z"
      },
      {
        id: "REF-2026-00104",
        patient_id: "PAT-003",
        patient_name: "Mohan Lal Patel",
        patient_age: 62,
        patient_gender: "Male",
        patient_village: "Ratibad",
        patient_mobile: "9876543212",
        patient_abha: "91-6201-9923-4412",
        from_facility_id: "FAC-PHC-01",
        from_facility_name: "PHC Ratibad",
        to_facility_id: "FAC-DH-01",
        to_facility_name: "Bhopal District Memorial Hospital",
        specialty_requested: "Diabetology & Ophthalmology (Retinal Screening)",
        referral_type: "routine",
        reason: "Annual Diabetic Retinopathy screening & Foot Neuropathy Assessment",
        clinical_summary: "62M with 10-year history of T2D. Fasting BS 168 mg/dL, HbA1c 8.4%. Complains of burning sensation in feet and blurred vision.",
        status: "Appointment Scheduled",
        appointment_date: "2026-09-22T11:30:00.000Z",
        assigned_doctor_name: "Dr. Nidhi Agrawal (Diabetologist)",
        rejection_reason: null,
        counter_referral_notes: null,
        created_by_user_id: "USR-PHC-001",
        created_at: "2026-09-16T14:00:00.000Z",
        updated_at: "2026-09-17T11:00:00.000Z"
      }
    ],

    referral_status_history: [
      {
        id: "RSH-001",
        referral_id: "REF-2026-00101",
        from_status: "None",
        to_status: "Created",
        changed_by_name: "Dr. Alok Sharma (PHC Ratibad)",
        remarks: "Urgent referral created for suspected CAD with ST elevation/depression.",
        timestamp: "2026-01-16T12:00:00.000Z"
      },
      {
        id: "RSH-002",
        referral_id: "REF-2026-00101",
        from_status: "Created",
        to_status: "Accepted",
        changed_by_name: "Dr. Rajeshwari Sen (DH Bhopal)",
        remarks: "Referral reviewed and accepted for Cardiology specialty slot.",
        timestamp: "2026-01-17T09:15:00.000Z"
      },
      {
        id: "RSH-003",
        referral_id: "REF-2026-00101",
        from_status: "Accepted",
        to_status: "Appointment Scheduled",
        changed_by_name: "Hospital Triage Desk",
        remarks: "Appointment confirmed for 2026-02-20 at 14:30. SMS notification dispatched to patient.",
        timestamp: "2026-01-17T10:00:00.000Z"
      },
      {
        id: "RSH-004",
        referral_id: "REF-2026-00101",
        from_status: "Appointment Scheduled",
        to_status: "Arrived",
        changed_by_name: "DH Registration Desk",
        remarks: "Patient verified via ABHA QR scan and admitted to OPD queue.",
        timestamp: "2026-02-20T14:00:00.000Z"
      },
      {
        id: "RSH-005",
        referral_id: "REF-2026-00101",
        from_status: "Arrived",
        to_status: "Consultation Completed",
        changed_by_name: "Dr. Rajeshwari Sen",
        remarks: "2D Echo, TMT, and clinical evaluation performed.",
        timestamp: "2026-02-20T15:20:00.000Z"
      },
      {
        id: "RSH-006",
        referral_id: "REF-2026-00101",
        from_status: "Consultation Completed",
        to_status: "Treatment Completed",
        changed_by_name: "Dr. Rajeshwari Sen",
        remarks: "Medication adjusted. Counter-referred to PHC Ratibad with ASHA follow-up task.",
        timestamp: "2026-02-20T16:00:00.000Z"
      },
      {
        id: "RSH-007",
        referral_id: "REF-2026-00102",
        from_status: "Created",
        to_status: "Accepted",
        changed_by_name: "Dr. V. K. Malhotra (DH Bhopal)",
        remarks: "Accepted for immediate CBNAAT GeneXpert testing.",
        timestamp: "2026-09-17T11:00:00.000Z"
      },
      {
        id: "RSH-008",
        referral_id: "REF-2026-00102",
        from_status: "Accepted",
        to_status: "In Transit",
        changed_by_name: "ASHA Sunita Ahirwar",
        remarks: "Patient boarded 108 Emergency Ambulance / Rural bus for DH arrival.",
        timestamp: "2026-09-18T14:20:00.000Z"
      }
    ],

    medicines: [
      { id: "MED-001", name: "Paracetamol 500mg", generic_name: "Acetaminophen", category: "Analgesic & Antipyretic", dosage_form: "Tablet", unit: "Strip of 10" },
      { id: "MED-002", name: "Amlodipine 5mg", generic_name: "Amlodipine Besylate", category: "Antihypertensive", dosage_form: "Tablet", unit: "Strip of 10" },
      { id: "MED-003", name: "Metformin 500mg", generic_name: "Metformin Hydrochloride", category: "Antidiabetic", dosage_form: "Tablet", unit: "Strip of 10" },
      { id: "MED-004", name: "Amoxicillin + Clavulanic Acid 625mg", generic_name: "Amoxicillin Trihydrate + Potassium Clavulanate", category: "Antibiotic", dosage_form: "Tablet", unit: "Strip of 6" },
      { id: "MED-005", name: "Iron & Folic Acid (IFA)", generic_name: "Ferrous Sulfate + Folic Acid", category: "Haematinic / Maternal Health", dosage_form: "Tablet", unit: "Strip of 30" },
      { id: "MED-006", name: "Oral Rehydration Salts (ORS)", generic_name: "Sodium Chloride + Glucose + Potassium", category: "Electrolyte Solution", dosage_form: "Sachet", unit: "Pack of 20g" },
      { id: "MED-007", name: "Atorvastatin 10mg", generic_name: "Atorvastatin Calcium", category: "Lipid Lowering", dosage_form: "Tablet", unit: "Strip of 10" },
      { id: "MED-008", name: "Azithromycin 500mg", generic_name: "Azithromycin", category: "Antibiotic", dosage_form: "Tablet", unit: "Strip of 3" },
      { id: "MED-009", name: "Salbutamol Inhaler 100mcg", generic_name: "Salbutamol Sulfate", category: "Bronchodilator", dosage_form: "Inhaler", unit: "200 MDI Doses" },
      { id: "MED-010", name: "Albendazole 400mg", generic_name: "Albendazole", category: "Anthelmintic", dosage_form: "Chewable Tablet", unit: "Strip of 1" },
      { id: "MED-011", name: "Anti-Rabies Vaccine (ARV)", generic_name: "Purified Vero Cell Rabies Vaccine", category: "Immunological / Emergency", dosage_form: "Injection Vial", unit: "0.5 mL Vial" }
    ],

    medicine_stock: [
      // PHC Ratibad Stock
      { id: "STK-001", facility_id: "FAC-PHC-01", facility_name: "PHC Ratibad", medicine_id: "MED-001", medicine_name: "Paracetamol 500mg", generic_name: "Acetaminophen", quantity: 380, unit: "Tablets", batch_number: "PCM-2025-09", expiry_date: "2027-08-30", min_threshold: 100, minimum_stock_level: 100, status: "Available", last_updated: "2026-09-18T10:00:00.000Z" },
      { id: "STK-002", facility_id: "FAC-PHC-01", facility_name: "PHC Ratibad", medicine_id: "MED-002", medicine_name: "Amlodipine 5mg", generic_name: "Amlodipine Besylate", quantity: 18, unit: "Tablets", batch_number: "AML-2025-04", expiry_date: "2027-04-15", min_threshold: 50, minimum_stock_level: 50, status: "Low Stock", last_updated: "2026-09-17T15:30:00.000Z" },
      { id: "STK-003", facility_id: "FAC-PHC-01", facility_name: "PHC Ratibad", medicine_id: "MED-003", medicine_name: "Metformin 500mg", generic_name: "Metformin Hydrochloride", quantity: 240, unit: "Tablets", batch_number: "MET-2025-11", expiry_date: "2027-11-20", min_threshold: 80, minimum_stock_level: 80, status: "Available", last_updated: "2026-09-18T09:00:00.000Z" },
      { id: "STK-004", facility_id: "FAC-PHC-01", facility_name: "PHC Ratibad", medicine_id: "MED-004", medicine_name: "Amoxicillin + Clav 625mg", generic_name: "Amoxicillin + Clav", quantity: 45, unit: "Tablets", batch_number: "AMX-2025-02", expiry_date: "2026-10-15", min_threshold: 50, minimum_stock_level: 50, status: "Near Expiry", last_updated: "2026-09-16T11:20:00.000Z" },
      { id: "STK-005", facility_id: "FAC-PHC-01", facility_name: "PHC Ratibad", medicine_id: "MED-005", medicine_name: "Iron & Folic Acid (IFA)", generic_name: "Ferrous Sulfate + Folic Acid", quantity: 520, unit: "Tablets", batch_number: "IFA-2025-08", expiry_date: "2027-09-15", min_threshold: 150, minimum_stock_level: 150, status: "Available", last_updated: "2026-09-18T10:00:00.000Z" },
      { id: "STK-006", facility_id: "FAC-PHC-01", facility_name: "PHC Ratibad", medicine_id: "MED-006", medicine_name: "Oral Rehydration Salts (ORS)", generic_name: "ORS Sachet", quantity: 410, unit: "Sachets", batch_number: "ORS-2025-05", expiry_date: "2027-06-30", min_threshold: 100, minimum_stock_level: 100, status: "Available", last_updated: "2026-09-18T10:00:00.000Z" },
      { id: "STK-007", facility_id: "FAC-PHC-01", facility_name: "PHC Ratibad", medicine_id: "MED-009", medicine_name: "Salbutamol Inhaler 100mcg", generic_name: "Salbutamol Sulfate", quantity: 4, unit: "Inhalers", batch_number: "SAL-2024-12", expiry_date: "2026-11-15", min_threshold: 15, minimum_stock_level: 15, status: "Low Stock", last_updated: "2026-09-15T14:10:00.000Z" },
      { id: "STK-008", facility_id: "FAC-PHC-01", facility_name: "PHC Ratibad", medicine_id: "MED-011", medicine_name: "Anti-Rabies Vaccine (ARV)", generic_name: "Purified Vero Cell Rabies Vaccine", quantity: 0, unit: "Vials", batch_number: "ARV-2025-01", expiry_date: "2026-12-30", min_threshold: 10, minimum_stock_level: 10, status: "Out of Stock", last_updated: "2026-09-18T08:00:00.000Z" },

      // PHC Berasia Stock (Prompt Example: 120 tablets, Available)
      { id: "STK-016", facility_id: "FAC-PHC-02", facility_name: "PHC Berasia", medicine_id: "MED-001", medicine_name: "Paracetamol 500mg", generic_name: "Acetaminophen", quantity: 120, unit: "Tablets", batch_number: "PCM-2025-01", expiry_date: "2027-08-30", min_threshold: 50, minimum_stock_level: 50, status: "Available", last_updated: "2026-09-18T09:30:00.000Z" },
      { id: "STK-017", facility_id: "FAC-PHC-02", facility_name: "PHC Berasia", medicine_id: "MED-002", medicine_name: "Amlodipine 5mg", generic_name: "Amlodipine Besylate", quantity: 240, unit: "Tablets", batch_number: "AML-2025-05", expiry_date: "2027-04-15", min_threshold: 60, minimum_stock_level: 60, status: "Available", last_updated: "2026-09-18T09:30:00.000Z" },
      { id: "STK-018", facility_id: "FAC-PHC-02", facility_name: "PHC Berasia", medicine_id: "MED-008", medicine_name: "Azithromycin 500mg", generic_name: "Azithromycin", quantity: 18, unit: "Tablets", batch_number: "AZI-2024-10", expiry_date: "2026-10-05", min_threshold: 20, minimum_stock_level: 20, status: "Near Expiry", last_updated: "2026-09-17T11:00:00.000Z" },
      { id: "STK-019", facility_id: "FAC-PHC-02", facility_name: "PHC Berasia", medicine_id: "MED-010", medicine_name: "Albendazole 400mg", generic_name: "Albendazole", quantity: 0, unit: "Tablets", batch_number: "ALB-2025-01", expiry_date: "2027-02-28", min_threshold: 30, minimum_stock_level: 30, status: "Out of Stock", last_updated: "2026-09-18T08:00:00.000Z" },

      // PHC Phanda Stock (Prompt Example: 15 tablets, Low Stock)
      { id: "STK-020", facility_id: "FAC-PHC-03", facility_name: "PHC Phanda", medicine_id: "MED-001", medicine_name: "Paracetamol 500mg", generic_name: "Acetaminophen", quantity: 15, unit: "Tablets", batch_number: "PCM-2025-02", expiry_date: "2027-08-30", min_threshold: 50, minimum_stock_level: 50, status: "Low Stock", last_updated: "2026-09-18T09:45:00.000Z" },
      { id: "STK-021", facility_id: "FAC-PHC-03", facility_name: "PHC Phanda", medicine_id: "MED-003", medicine_name: "Metformin 500mg", generic_name: "Metformin Hydrochloride", quantity: 0, unit: "Tablets", batch_number: "MET-2025-01", expiry_date: "2027-05-20", min_threshold: 60, minimum_stock_level: 60, status: "Out of Stock", last_updated: "2026-09-18T08:30:00.000Z" },
      { id: "STK-022", facility_id: "FAC-PHC-03", facility_name: "PHC Phanda", medicine_id: "MED-005", medicine_name: "Iron & Folic Acid (IFA)", generic_name: "Ferrous Sulfate + Folic Acid", quantity: 310, unit: "Tablets", batch_number: "IFA-2025-09", expiry_date: "2027-09-20", min_threshold: 100, minimum_stock_level: 100, status: "Available", last_updated: "2026-09-18T09:45:00.000Z" },

      // District Hospital Bhopal Stock (Prompt Example: 500 tablets, Available)
      { id: "STK-009", facility_id: "FAC-DH-01", facility_name: "District Hospital Bhopal", medicine_id: "MED-001", medicine_name: "Paracetamol 500mg", generic_name: "Acetaminophen", quantity: 500, unit: "Tablets", batch_number: "PCM-2025-03", expiry_date: "2027-12-31", min_threshold: 100, minimum_stock_level: 100, status: "Available", last_updated: "2026-09-18T11:00:00.000Z" },
      { id: "STK-010", facility_id: "FAC-DH-01", facility_name: "District Hospital Bhopal", medicine_id: "MED-002", medicine_name: "Amlodipine 5mg", generic_name: "Amlodipine Besylate", quantity: 1200, unit: "Tablets", batch_number: "AML-2025-06", expiry_date: "2027-06-25", min_threshold: 200, minimum_stock_level: 200, status: "Available", last_updated: "2026-09-18T11:00:00.000Z" },
      { id: "STK-011", facility_id: "FAC-DH-01", facility_name: "District Hospital Bhopal", medicine_id: "MED-007", medicine_name: "Atorvastatin 10mg", generic_name: "Atorvastatin Calcium", quantity: 850, unit: "Tablets", batch_number: "ATV-2025-07", expiry_date: "2027-07-20", min_threshold: 150, minimum_stock_level: 150, status: "Available", last_updated: "2026-09-18T11:00:00.000Z" },
      { id: "STK-012", facility_id: "FAC-DH-01", facility_name: "District Hospital Bhopal", medicine_id: "MED-011", medicine_name: "Anti-Rabies Vaccine (ARV)", generic_name: "Purified Vero Cell Rabies Vaccine", quantity: 145, unit: "Vials", batch_number: "ARV-2025-09", expiry_date: "2027-09-10", min_threshold: 40, minimum_stock_level: 40, status: "Available", last_updated: "2026-09-18T11:00:00.000Z" },

      // Sub-Centre Barkheda Stock
      { id: "STK-013", facility_id: "FAC-SUB-01", facility_name: "Sub-Centre Barkheda", medicine_id: "MED-001", medicine_name: "Paracetamol 500mg", generic_name: "Acetaminophen", quantity: 60, unit: "Tablets", batch_number: "PCM-2025-09", expiry_date: "2027-08-30", min_threshold: 20, minimum_stock_level: 20, status: "Available", last_updated: "2026-09-17T09:00:00.000Z" },
      { id: "STK-014", facility_id: "FAC-SUB-01", facility_name: "Sub-Centre Barkheda", medicine_id: "MED-005", medicine_name: "Iron & Folic Acid (IFA)", generic_name: "Ferrous Sulfate + Folic Acid", quantity: 180, unit: "Tablets", batch_number: "IFA-2025-08", expiry_date: "2027-09-15", min_threshold: 50, minimum_stock_level: 50, status: "Available", last_updated: "2026-09-17T09:00:00.000Z" },
      { id: "STK-015", facility_id: "FAC-SUB-01", facility_name: "Sub-Centre Barkheda", medicine_id: "MED-006", medicine_name: "Oral Rehydration Salts (ORS)", generic_name: "ORS Sachet", quantity: 95, unit: "Sachets", batch_number: "ORS-2025-05", expiry_date: "2027-06-30", min_threshold: 30, minimum_stock_level: 30, status: "Available", last_updated: "2026-09-17T09:00:00.000Z" }
    ],

    teleconsultations: [
      {
        id: "TELE-2026-0042",
        patient_id: "PAT-001",
        patient_name: "Ramesh Kumar Verma",
        patient_age: 48,
        patient_gender: "Male",
        patient_village: "Barkheda",
        patient_abha: "91-4829-1029-4821",
        requested_by_user_id: "USR-PAT-001",
        requested_by_name: "Ramesh Kumar Verma (Self)",
        doctor_user_id: "USR-PHC-001",
        doctor_name: "Dr. Alok Sharma",
        facility_id: "FAC-PHC-01",
        facility_name: "PHC Ratibad",
        scheduled_time: "2026-09-19T10:30:00.000Z",
        reason: "Follow-up consultation for blood pressure check and chest tightness review",
        symptoms: "Mild morning headache, wants to review medication dosage",
        status: "Active", // 'Requested' | 'In Queue' | 'Active' | 'Completed' | 'Cancelled'
        current_vitals: {
          bp: "132/84 mmHg",
          pulse: 74,
          temp: "98.6 °F",
          spo2: "99%"
        },
        doctor_notes: "Patient adhering to Amlodipine and Atorvastatin. BP well controlled. Encouraged morning walks.",
        prescription_id: "RX-2026-001",
        created_at: "2026-09-18T09:00:00.000Z"
      },
      {
        id: "TELE-2026-0043",
        patient_id: "PAT-004",
        patient_name: "Priya Sharma",
        patient_age: 8,
        patient_gender: "Female",
        patient_village: "Phanda",
        patient_abha: "91-3145-8821-0045",
        requested_by_user_id: "USR-ASHA-001",
        requested_by_name: "Sunita Ahirwar (ASHA on behalf of patient)",
        doctor_user_id: "USR-PHC-001",
        doctor_name: "Dr. Alok Sharma",
        facility_id: "FAC-PHC-01",
        facility_name: "PHC Ratibad",
        scheduled_time: "2026-09-19T11:15:00.000Z",
        reason: "Childhood wheezing and seasonal nighttime cough",
        symptoms: "Mild wheezing heard on home stethoscope check. No cyanosis.",
        status: "In Queue",
        current_vitals: {
          bp: "96/64 mmHg",
          pulse: 92,
          temp: "99.1 °F",
          spo2: "96%"
        },
        doctor_notes: null,
        prescription_id: null,
        created_at: "2026-09-18T10:00:00.000Z"
      }
    ],

    follow_ups: [
      {
        id: "FOL-2026-001",
        patient_id: "PAT-001",
        patient_name: "Ramesh Kumar Verma",
        patient_village: "Barkheda",
        patient_mobile: "9876543210",
        assigned_asha_id: "USR-ASHA-001",
        assigned_asha_name: "Sunita Ahirwar",
        referral_id: "REF-2026-00101",
        category: "Post-Hospitalization & CAD Adherence",
        due_date: "2026-09-20",
        priority: "High",
        instructions: "Verify patient is taking Sorbitrate SOS and Metoprolol daily. Check BP and inquire about chest discomfort on walking.",
        status: "Pending", // 'Pending' | 'Completed' | 'Overdue'
        completion_notes: null,
        completed_at: null,
        created_at: "2026-02-21T09:00:00.000Z"
      },
      {
        id: "FOL-2026-002",
        patient_id: "PAT-002",
        patient_name: "Sunita Devi",
        patient_village: "Barkheda",
        patient_mobile: "9876543211",
        assigned_asha_id: "USR-ASHA-001",
        assigned_asha_name: "Sunita Ahirwar",
        referral_id: "REF-2026-00103",
        category: "Maternal ANC/PNC Home Visit",
        due_date: "2026-09-19",
        priority: "Urgent",
        instructions: "Ensure IFA tablet compliance. Measure weight gain, check for pedal swelling, and confirm PHC ANC visit date.",
        status: "Pending",
        completion_notes: null,
        completed_at: null,
        created_at: "2026-09-15T08:00:00.000Z"
      },
      {
        id: "FOL-2026-003",
        patient_id: "PAT-005",
        patient_name: "Rajesh Ahirwar",
        patient_village: "Barkheda",
        patient_mobile: "9876543214",
        assigned_asha_id: "USR-ASHA-001",
        assigned_asha_name: "Sunita Ahirwar",
        referral_id: "REF-2026-00102",
        category: "TB/NCD Treatment & Sputum Follow-up",
        due_date: "2026-09-21",
        priority: "High",
        instructions: "Track patient's arrival at District Hospital Pulmonology OPD and ensure mask usage in village household.",
        status: "Pending",
        completion_notes: null,
        completed_at: null,
        created_at: "2026-09-17T12:00:00.000Z"
      },
      {
        id: "FOL-2026-004",
        patient_id: "PAT-003",
        patient_name: "Mohan Lal Patel",
        patient_village: "Ratibad",
        patient_mobile: "9876543212",
        assigned_asha_id: "USR-ASHA-001",
        assigned_asha_name: "Sunita Ahirwar",
        referral_id: null,
        category: "Diabetes & Foot Ulcer Prevention",
        due_date: "2026-09-15",
        priority: "Routine",
        instructions: "Checked random blood sugar at home (142 mg/dL). Foot exam showed no active sores. Reminded to attend ophthalmology referral.",
        status: "Completed",
        completion_notes: "Home visit completed on 15 Sept. Patient counseled on footwear.",
        completed_at: "2026-09-15T16:30:00.000Z",
        created_at: "2026-09-01T09:00:00.000Z"
      }
    ],

    notifications: [
      {
        id: "NOTIF-001",
        user_id: "USR-PAT-001",
        role_target: "patient",
        title: "Teleconsultation Scheduled",
        message: "Your video consultation with Dr. Alok Sharma (PHC Ratibad) is scheduled for today at 10:30 AM.",
        type: "info",
        is_read: false,
        link_url: "/teleconsultation/TELE-2026-0042",
        created_at: "2026-09-18T09:00:00.000Z"
      },
      {
        id: "NOTIF-002",
        user_id: "USR-PAT-001",
        role_target: "patient",
        title: "District Hospital Referral Completed",
        message: "Your Cardiology referral #REF-2026-00101 has been marked Treatment Completed by Dr. Rajeshwari Sen.",
        type: "success",
        is_read: false,
        link_url: "/dashboard/patient",
        created_at: "2026-02-20T16:05:00.000Z"
      },
      {
        id: "NOTIF-003",
        user_id: "USR-ASHA-001",
        role_target: "asha",
        title: "New Follow-up Due Today",
        message: "High-priority ANC home visit due for Sunita Devi (Barkheda village).",
        type: "alert",
        is_read: false,
        link_url: "/dashboard/asha",
        created_at: "2026-09-18T07:30:00.000Z"
      },
      {
        id: "NOTIF-004",
        user_id: "USR-PHC-001",
        role_target: "phc",
        title: "Low Medicine Stock Warning",
        message: "Amlodipine 5mg and Salbutamol Inhalers are below minimum buffer threshold at PHC Ratibad.",
        type: "warning",
        is_read: false,
        link_url: "/dashboard/phc",
        created_at: "2026-09-18T08:00:00.000Z"
      },
      {
        id: "NOTIF-005",
        user_id: "USR-DH-001",
        role_target: "hospital",
        title: "Inward Referral in Transit",
        message: "Urgent TB Pulmonology referral #REF-2026-00102 for Rajesh Ahirwar is currently In Transit from PHC Ratibad.",
        type: "alert",
        is_read: false,
        link_url: "/dashboard/hospital",
        created_at: "2026-09-18T14:22:00.000Z"
      },
      {
        id: "NOTIF-006",
        user_id: "USR-ADM-001",
        role_target: "admin",
        title: "District Medicine Out-of-Stock Alert",
        message: "Anti-Rabies Vaccine (ARV) reported Out of Stock at PHC Ratibad. 145 vials available at DH Bhopal for replenishment.",
        type: "warning",
        is_read: false,
        link_url: "/dashboard/admin",
        created_at: "2026-09-18T08:10:00.000Z"
      }
    ]
  };
};

class Database {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.data = getInitialData();
        this.save();
      }
    } catch (err) {
      console.error('Error loading database file, reinitializing default seed data:', err);
      this.data = getInitialData();
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing to database file:', err);
    }
  }

  reset() {
    this.data = getInitialData();
    this.save();
    return this.data;
  }

  // Generic collection helpers
  getCollection(name) {
    if (!this.data[name]) {
      this.data[name] = [];
    }
    return this.data[name];
  }

  find(collectionName, predicate = () => true) {
    const col = this.getCollection(collectionName);
    return col.filter(predicate);
  }

  findOne(collectionName, predicate) {
    const col = this.getCollection(collectionName);
    return col.find(predicate) || null;
  }

  findById(collectionName, id) {
    const col = this.getCollection(collectionName);
    return col.find(item => item.id === id) || null;
  }

  insert(collectionName, item) {
    const col = this.getCollection(collectionName);
    if (!item.id) {
      item.id = `${collectionName.toUpperCase().slice(0, 3)}-${Date.now()}`;
    }
    if (!item.created_at) {
      item.created_at = new Date().toISOString();
    }
    col.push(item);
    this.save();
    return item;
  }

  update(collectionName, id, updates) {
    const col = this.getCollection(collectionName);
    const index = col.findIndex(item => item.id === id);
    if (index === -1) return null;

    col[index] = {
      ...col[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.save();
    return col[index];
  }

  delete(collectionName, id) {
    const col = this.getCollection(collectionName);
    const index = col.findIndex(item => item.id === id);
    if (index === -1) return false;
    col.splice(index, 1);
    this.save();
    return true;
  }
}

export const db = new Database();

# 🏥 SWASTHYA SETU (स्वास्थ्य सेतु)
### *Connecting Patients, ASHA Workers, PHCs, and District Hospitals for Continuous Rural Healthcare*
**Smart India Hackathon 2026 Prototype | Bhopal District Public Health Network**

---

## 🌟 Executive Overview
**Swasthya Setu** is an enterprise-grade digital public health platform designed to eliminate the systemic fragmentation in rural healthcare delivery across India. Built strictly aligned with the **Ayushman Bharat Digital Mission (ABDM)** standards, it establishes a continuous, closed-loop healthcare workflow:

$$\text{Patient/ASHA Doorstep Visit} \longrightarrow \text{PHC OPD \& Triage} \longrightarrow \text{Teleconsultation / Referral} \longrightarrow \text{District Hospital Specialist Care} \longrightarrow \text{Counter-Referral \& ASHA Follow-up}$$

---

## 🔑 SIH Demonstration Credentials (1-Click Login)

The platform features a dedicated **SIH Evaluator Quick Switcher** bar at the top of the interface for instant 1-click role switching during live hackathon presentations.

| Role | User Label | Identifier | Password / OTP | Key Workflows to Evaluate |
|---|---|---|---|---|
| **Patient** | Ramesh Kumar Verma (48M) | `9876543210` | OTP `123456` | ABDM ABHA ID Card (QR code), PM-JAY ₹5L cover, Longitudinal medical timeline, Medicine availability finder, Request teleconsultation |
| **ASHA Worker** | Sunita Ahirwar | `ASHA-BHP-01` / `9876500001` | `password123` / OTP `123456` | Village household registry (Barkheda), Register new patient + ABHA auto-gen, Record doorstep vitals, ANC & TB follow-up visits |
| **PHC (Primary Centre)** | Dr. Alok Sharma (MO) | `PHC-RTB-01` | `password123` | OPD consultation desk, Digital Rx pad, Teleconsultation queue, Hospital referral creator, PHC pharmacy inventory & restock |
| **District Hospital** | Dr. Rajeshwari Sen (Cardiologist) | `DH-BHP-01` | `password123` | Inward referral triage desk, Accept/Schedule specialist care, Diagnostic test reports, Counter-referral discharge generator |
| **District Admin (CMO)** | Dr. Arvind Shrivastava (CMHO) | `ADMIN-BHP-01` | `password123` | District health KPIs, Disease surveillance & symptom clustering heatmap, Referral turnaround times, Supply chain stockouts |

*Note: You can also use the **"Reset Demo Data"** button at any time to restore the clean initial Bhopal District dataset.*

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Custom Government Public Health Design System.
- **Backend**: Node.js, Express.js REST API with JWT authentication, role-based authorization (RBAC), and centralized audit logging.
- **Database**: ACID-compliant persistent relational engine (`server/db.js` with structured tables for `users`, `facilities`, `patients`, `health_records`, `referrals`, `referral_status_history`, `medicines`, `medicine_stock`, `teleconsultations`, `follow_ups`, `notifications`).
- **Internationalization**: Bilingual support (**English / हिंदी**) with instant toggle.
- **Digital Health Standards**: ABDM 14-digit ABHA ID (`91-XXXX-XXXX-XXXX`), Ayushman Bharat PM-JAY wallet balance, ICD-10 clinical diagnosis encoding, and e-Sanjeevani teleconsultation architecture.

---

## 🚀 Running the Project Locally

### 1. Prerequisites
- Node.js (v18+ or v20+)
- NPM

### 2. Quick Start
```bash
# Clone or open project directory
cd "swasthya setu"

# Install dependencies
npm install

# Start both Express Backend (Port 5000) and Vite Frontend (Port 5173 / Proxy)
npm run dev

# Or run production server (serves both API and built UI on port 5000)
node server/index.js
```

Open your browser at **`http://localhost:5000`** (or **`http://localhost:5173`** during development).

---

## 🔄 End-to-End Closed-Loop Referral Workflow Demo

Follow this step-by-step pathway to demonstrate the full platform capabilities to hackathon judges:

1. **Patient Step (`/dashboard/patient`)**:
   - Log in as **Patient** (`9876543210` with OTP `123456`).
   - View the verified **ABDM ABHA Card** with QR code and Ayushman Bharat PM-JAY active insurance wallet.
   - Explore the **Longitudinal Health History Timeline** showing prior ASHA checks and PHC visits.
   - Click **"Request Teleconsultation"** to queue a video request with the PHC doctor.

2. **PHC Doctor Step (`/dashboard/phc`)**:
   - Use the top demo bar to switch to **PHC (Dr. Alok Sharma)**.
   - Open the **Teleconsultation Queue** and launch the live **Video Room** (`/teleconsultation/TELE-2026-0042`).
   - Review patient vitals, type clinical notes, and sign the digital prescription.
   - Back on the PHC dashboard, click **"Refer to DH"** on patient Ramesh Verma to create an **Urgent Cardiology Referral** to Bhopal District Memorial Hospital.

3. **District Hospital Step (`/dashboard/hospital`)**:
   - Switch to **District Hospital (Dr. Rajeshwari Sen)**.
   - In the **Inward Referral Triage Desk**, see the new urgent referral from PHC Ratibad.
   - Click **"Accept Referral"** and **"Schedule Slot"**.
   - Click **"Specialist Care & Rx"** to record the 2D Echocardiogram findings and generate a **Counter-Referral Discharge Plan**.

4. **ASHA Field Worker Step (`/dashboard/asha`)**:
   - Switch to **ASHA Worker (Sunita Ahirwar)**.
   - Notice the newly assigned **Post-Hospitalization Follow-up Task** in Barkheda village.
   - Click **"Record Home Visit"** to log the doorstep blood pressure check and complete the task.

5. **District Administrator Step (`/dashboard/admin`)**:
   - Switch to **District Administrator (CMHO Dr. Arvind Shrivastava)**.
   - View real-time district analytics: updated referral resolution rate, disease surveillance heatmap (Barkheda hypertension cluster), and medicine buffer stock monitors.

---

## 🔒 Security & Privacy Practices
- Password hashing with Bcrypt.
- Role-based token authorization (`authenticateToken` & `authorizeRoles`).
- Read-only protection on medical records (patients cannot alter professional clinical diagnoses).
- Strict separation of district operational metrics from clinical patient records.
- Zero external cloud dependencies required for evaluation — runs fully offline/local.

---

## 👥 Credits & Hackathon Team
- **Project**: Swasthya Setu
- **Theme**: Smart India Hackathon (SIH 2026) - Public Health & Rural Technology
- **Inspiration**: National Health Authority (NHA), Ayushman Bharat Digital Mission (ABDM), Ministry of Health & Family Welfare (MoHFW), Government of India.

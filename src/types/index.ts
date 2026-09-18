export type UserRole = 'patient' | 'asha' | 'phc' | 'hospital' | 'admin';

export type ReferralStatus = 
  | 'Created'
  | 'Accepted'
  | 'Appointment Scheduled'
  | 'In Transit'
  | 'Arrived'
  | 'Patient Arrived'
  | 'Consultation'
  | 'Consultation Completed'
  | 'Treatment'
  | 'Treatment Completed'
  | 'Follow-up'
  | 'Follow-up Required'
  | 'Closed'
  | 'Rejected';

export type ReferralPriority = 'routine' | 'urgent' | 'emergency';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  identifier: string;
  mobile: string;
  email?: string;
  facility_id?: string;
  patient_id?: string;
  assigned_village?: string;
  assigned_block?: string;
  designation?: string;
  department?: string;
}

export interface Facility {
  id: string;
  name: string;
  type: 'phc' | 'hospital' | 'sub_centre';
  block: string;
  district: string;
  state: string;
  address: string;
  contact_number: string;
  bed_capacity: number;
  active_doctors: number;
  emergency_services?: boolean;
  specialties?: string[];
}

export interface Patient {
  id: string;
  user_id?: string | null;
  abha_id?: string | null;
  abha_address?: string | null;
  abha_linked: boolean;
  name: string;
  age: number;
  gender: string;
  dob: string;
  mobile: string;
  village: string;
  block: string;
  district: string;
  state: string;
  emergency_contact: string;
  blood_group: string;
  ayushman_pmjay_id?: string;
  pmjay_eligible: boolean;
  pmjay_wallet_balance: number;
  assigned_asha_id?: string;
  assigned_phc_id?: string;
  chronic_conditions?: string[];
  allergies?: string[];
  photo_url?: string;
  created_at: string;
  care_team?: {
    asha?: { id: string; name: string; mobile: string } | null;
    phc?: { id: string; name: string; contact: string } | null;
  };
}

export interface Vitals {
  bp?: string;
  pulse?: number | string;
  temp?: string;
  spo2?: string;
  blood_sugar_fasting?: string;
  blood_sugar_random?: string;
  weight?: string;
  bmi?: string;
  hemoglobin?: string;
  fundal_height?: string;
  fetal_heart_rate?: string;
}

export interface PrescriptionItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface TestReport {
  test_name: string;
  result: string;
  status: 'Completed' | 'Pending' | 'Ordered';
  date: string;
}

export interface HealthRecord {
  id: string;
  patient_id: string;
  facility_id: string;
  facility_name: string;
  recorded_by_name: string;
  recorded_by_role: string;
  record_type: 'vital_check' | 'opd_consultation' | 'specialist_visit' | 'hospital_discharge' | 'lab_report';
  record_date: string;
  chief_complaint: string;
  symptoms?: string;
  vitals?: Vitals;
  clinical_observations: string;
  diagnosis: string;
  prescription?: {
    id?: string;
    medicines: PrescriptionItem[];
    notes?: string;
  } | null;
  test_reports?: TestReport[];
  follow_up_date?: string | null;
  referral_id?: string | null;
  created_at: string;
}

export interface ReferralStatusHistory {
  id: string;
  referral_id: string;
  from_status: string;
  to_status: ReferralStatus;
  changed_by_name: string;
  remarks: string;
  timestamp: string;
}

export interface Referral {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  patient_village: string;
  patient_mobile: string;
  patient_abha?: string;
  from_facility_id: string;
  from_facility_name: string;
  to_facility_id: string;
  to_facility_name: string;
  specialty_requested: string;
  referral_type: ReferralPriority;
  reason: string;
  clinical_summary?: string;
  status: ReferralStatus;
  appointment_date?: string | null;
  assigned_doctor_name?: string | null;
  rejection_reason?: string | null;
  counter_referral_notes?: string | null;
  created_by_user_id: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  history?: ReferralStatusHistory[];
  patient?: Patient;
}

export interface MedicineStock {
  id: string;
  facility_id: string;
  facility_name: string;
  facility?: string;
  medicine_id?: string;
  medicine_name: string;
  name?: string;
  generic_name: string;
  quantity: number;
  unit: string;
  batch_number: string;
  expiry_date: string;
  minimum_stock_level: number;
  min_threshold?: number;
  status: 'Available' | 'Low Stock' | 'Out of Stock' | 'Near Expiry';
  last_updated: string;
}

export interface Teleconsultation {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  patient_village: string;
  patient_abha?: string;
  requested_by_user_id: string;
  requested_by_name: string;
  doctor_user_id: string;
  doctor_name: string;
  facility_id: string;
  facility_name: string;
  scheduled_time: string;
  reason: string;
  symptoms: string;
  status: 'Requested' | 'In Queue' | 'Active' | 'Completed' | 'Cancelled';
  current_vitals?: Vitals;
  doctor_notes?: string | null;
  diagnosis?: string | null;
  prescription_id?: string | null;
  medicines?: PrescriptionItem[];
  prescription?: {
    id?: string;
    medicines: PrescriptionItem[];
    notes?: string;
  } | null;
  follow_up_date?: string | null;
  follow_up_instructions?: string | null;
  duration?: string;
  completed_at?: string;
  created_at: string;
  patient?: Patient;
  patient_history?: HealthRecord[];
  active_referrals?: Referral[];
}

export interface FollowUp {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_village: string;
  patient_mobile: string;
  assigned_asha_id: string;
  assigned_asha_name: string;
  referral_id?: string | null;
  category: string;
  due_date: string;
  priority: 'Routine' | 'High' | 'Urgent';
  instructions: string;
  status: 'Pending' | 'Completed' | 'Overdue';
  completion_notes?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id?: string;
  role_target: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  is_read: boolean;
  link_url?: string;
  created_at: string;
}

export interface DemoCredential {
  role: UserRole;
  roleLabel: string;
  identifier: string;
  name: string;
  badge: string;
  description: string;
}

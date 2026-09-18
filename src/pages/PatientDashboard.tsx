import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { Patient, HealthRecord, Referral, Teleconsultation, FollowUp, NotificationItem } from '../types';
import { Sidebar } from '../components/common/Sidebar';
import { AbhaCard } from '../components/patient/AbhaCard';
import { HealthTimeline } from '../components/patient/HealthTimeline';
import { ReferralTracker } from '../components/patient/ReferralTracker';
import { MedicineSearch } from '../components/medicine/MedicineSearch';
import { PrescriptionModal } from '../components/patient/PrescriptionModal';
import { ConsultationQueue } from '../components/telecon/ConsultationQueue';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatDate, formatDateTime } from '../utils/formatters';
import { 
  Video, 
  Pill, 
  ArrowRight, 
  Clock, 
  PlusCircle, 
  FileText, 
  Building2, 
  CreditCard, 
  Activity, 
  Menu, 
  Bell,
  CheckSquare,
  Square,
  Calendar
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface PatientDashboardProps {
  initialTab?: string;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ initialTab = 'overview' }) => {
  const { user } = useAuth();
  const { t, language, tStatus } = useLanguage();
  const location = useLocation();

  // Determine active tab from URL path if available
  const getTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/patient/profile')) return 'profile';
    if (path.includes('/patient/records')) return 'records';
    if (path.includes('/patient/consultations')) return 'consultations';
    if (path.includes('/patient/referrals')) return 'referrals';
    if (path.includes('/patient/medicines')) return 'medicines';
    if (path.includes('/patient/appointments')) return 'appointments';
    if (path.includes('/patient/followups')) return 'followups';
    if (path.includes('/patient/schemes')) return 'schemes';
    if (path.includes('/patient/notifications')) return 'notifications';
    return initialTab;
  };

  const [activeTab, setActiveTab] = useState<string>(getTabFromPath());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [timeline, setTimeline] = useState<HealthRecord[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [, setTelecons] = useState<Teleconsultation[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Daily medicine reminder checklist state
  const [takenPills, setTakenPills] = useState<Record<string, boolean>>({
    morning_1: true,
    afternoon_1: false,
    night_1: false
  });

  // Modals state
  const [selectedRx, setSelectedRx] = useState<any>(null);
  const [rxDoctor, setRxDoctor] = useState<string>('');
  const [rxDate, setRxDate] = useState<string>('');

  const [showTeleconModal, setShowTeleconModal] = useState<boolean>(false);
  const [teleReason, setTeleReason] = useState<string>('');
  const [teleSymptoms, setTeleSymptoms] = useState<string>('');
  const [requestingTele, setRequestingTele] = useState<boolean>(false);

  const [showAppointmentModal, setShowAppointmentModal] = useState<boolean>(false);
  const [appointmentSpecialty, setAppointmentSpecialty] = useState<string>('Cardiology');
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [bookingAppointment, setBookingAppointment] = useState<boolean>(false);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const patientsRes = await api.getPatients();
      if (patientsRes.success && patientsRes.data.length > 0) {
        const currentPatient = patientsRes.data[0]; // Ramesh Kumar Verma
        setPatient(currentPatient);

        const [timelineRes, notifRes, followRes] = await Promise.all([
          api.getPatientTimeline(currentPatient.id),
          api.getNotifications(),
          api.getFollowUps()
        ]);

        if (timelineRes.success) {
          setTimeline(timelineRes.timeline || []);
          setReferrals(timelineRes.referrals || []);
          setTelecons(timelineRes.teleconsultations || []);
        }

        if (notifRes.success) {
          setNotifications(notifRes.data || []);
        }

        if (followRes.success) {
          setFollowUps(followRes.data.filter((f: any) => f.patient_id === currentPatient.id || f.patient_name === currentPatient.name));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, []);

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  const handleOpenPrescription = (rx: any, doctor: string, date: string) => {
    setSelectedRx(rx);
    setRxDoctor(doctor);
    setRxDate(date);
  };

  const handleRequestTelecon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    setRequestingTele(true);
    try {
      const res = await api.requestTeleconsultation({
        patient_id: patient.id,
        reason: teleReason || 'Follow-up consultation',
        symptoms: teleSymptoms || 'Review of health condition'
      });

      if (res.success) {
        setShowTeleconModal(false);
        setTeleReason('');
        setTeleSymptoms('');
        fetchPatientData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRequestingTele(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingAppointment(true);
    setTimeout(() => {
      setBookingAppointment(false);
      setShowAppointmentModal(false);
      alert(language === 'hi' 
        ? `भोपाल जिला मेमोरियल अस्पताल में ${appointmentSpecialty} विशेषज्ञ परामर्श स्लॉट बुक किया गया।` 
        : `Specialist appointment request for ${appointmentSpecialty} confirmed at Bhopal District Memorial Hospital.`);
    }, 1000);
  };

  const togglePill = (key: string) => {
    setTakenPills(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading || !patient) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-semibold">{t('loading', 'Loading data...')}</p>
        </div>
      </div>
    );
  }

  const activeReferral = referrals.find(r => r.status !== 'Treatment Completed' && r.status !== 'Closed') || referrals[0];
  const latestRecord = timeline[0];
  const currentMedications = latestRecord?.prescription?.medicines || [
    { name: 'Amlodipine 5mg', dosage: '1 Tablet', frequency: 'OD (Morning)', duration: '30 Days', instructions: 'After breakfast with warm water' },
    { name: 'Atorvastatin 10mg', dosage: '1 Tablet', frequency: 'OD (Night)', duration: '30 Days', instructions: 'Take at bedtime' },
    { name: 'Aspirin 75mg', dosage: '1 Tablet', frequency: 'OD (Post-Lunch)', duration: '30 Days', instructions: 'Take after food' }
  ];

  const pendingFollowUp = followUps[0] || {
    id: 'FOL-2026-001',
    patient_name: patient.name,
    assigned_asha_name: 'Sunita Ahirwar',
    due_date: '2026-09-22',
    category: 'Post-Referral Care & Doorstep BP Adherence',
    instructions: 'Conduct doorstep blood pressure check and verify daily Amlodipine 5mg compliance.',
    status: 'Pending'
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-100px)]">
      
      {/* Mobile Drawer Trigger Bar */}
      <div className="lg:hidden bg-white border-b border-slate-200 p-3 flex items-center justify-between">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 p-1.5 rounded-lg bg-slate-100"
        >
          <Menu className="w-4 h-4" />
          <span>{t('patient_portal', 'Patient Portal Menu')}</span>
        </button>
        <span className="text-xs font-semibold text-teal-700 capitalize">{activeTab.replace(/_/g, ' ')}</span>
      </div>

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Tab Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl">
        
        {/* ========================================================================= */}
        {/* TAB 1: DASHBOARD OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* 1. Welcome & Citizen Hero Banner */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-2xl border border-teal-200">
                    {patient.name.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 leading-tight">
                      {t('patient_welcome', 'Welcome back')}, {patient.name}
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t('patient_abha_id', 'ABHA ID')}: <strong className="font-mono text-teal-800">{patient.abha_id}</strong> | {t('asha_village', 'Village')}: {patient.village}, Bhopal
                    </p>
                  </div>
                </div>

                {/* Primary Quick Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowTeleconModal(true)}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Video className="w-4 h-4" />
                    <span>{t('patient_request_telecon_btn', 'Request Teleconsultation')}</span>
                  </button>
                  <Link
                    to="/patient/medicines"
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-all"
                  >
                    <Pill className="w-4 h-4 text-teal-600" />
                    <span>{language === 'hi' ? 'दवा खोजें' : 'Find Medicine'}</span>
                  </Link>
                </div>
              </div>

              {/* Status Alert Cards Grid: "What I Need to Know" */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                
                {/* 1. Active Referral Alert */}
                <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider">
                      {t('patient_active_referral', 'Active Referral')}
                    </span>
                    <StatusBadge status={activeReferral?.status || 'Active'} />
                  </div>
                  <div className="font-bold text-slate-900">{activeReferral ? activeReferral.specialty_requested : t('patient_no_referrals', 'No active referral')}</div>
                  <p className="text-slate-600 text-[11px] truncate">
                    {language === 'hi' ? 'रेफ़रल अस्पताल:' : 'Referred to:'} <strong>{activeReferral?.to_facility_name || 'DH Bhopal'}</strong>
                  </p>
                </div>

                {/* 2. Upcoming Appointment */}
                <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">
                    {t('patient_upcoming_appointment', 'Upcoming Appointment')}
                  </span>
                  <div className="font-bold text-slate-900">Dr. Rajeshwari Sen (Cardiology)</div>
                  <p className="text-slate-600 text-[11px]">
                    {activeReferral?.appointment_date ? formatDateTime(activeReferral.appointment_date) : (language === 'hi' ? 'आज, प्रातः 11:30 बजे (भोपाल जिला अस्पताल)' : 'Today, 11:30 AM (Bhopal DH)')}
                  </p>
                </div>

                {/* 3. Follow-up Reminder */}
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">
                    {t('patient_followup_reminder', 'ASHA Follow-Up Visit')}
                  </span>
                  <div className="font-bold text-slate-900">Sunita Ahirwar (Barkheda)</div>
                  <p className="text-slate-600 text-[11px]">
                    {language === 'hi' ? `दिनांक ${formatDate(pendingFollowUp.due_date)} • गृह रक्तचाप जांच` : `Due on ${formatDate(pendingFollowUp.due_date)} • Doorstep BP Check`}
                  </p>
                </div>

              </div>
            </div>

            {/* 2. ABHA Card Component */}
            <AbhaCard patient={patient} onRefresh={fetchPatientData} />

            {/* 3. Active Referral Pipeline Tracker */}
            {activeReferral && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-teal-600" />
                    {language === 'hi' ? 'सक्रिय अस्पताल रेफ़रल प्रक्रिया' : 'Active Hospital Referral Pipeline'}
                  </h2>
                  <Link
                    to="/patient/referrals"
                    className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1"
                  >
                    <span>{t('view_all', 'View All')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <ReferralTracker referral={activeReferral} />
              </div>
            )}

            {/* 4. Daily Medicine Reminders Checklist & Current Prescription Pad */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Daily Medicine Reminders */}
              <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-teal-600" />
                    {t('patient_medicine_reminders', "Today's Medicine Reminders")}
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {language === 'hi' ? 'नियमित खुराक सक्रिय' : 'Adherence Active'}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div 
                    onClick={() => togglePill('morning_1')}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      takenPills.morning_1 ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {takenPills.morning_1 ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold">Amlodipine 5mg (1 Tab)</div>
                        <div className="text-[11px] text-slate-500">{t('patient_morning_dose', 'Morning (After Breakfast)')}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {takenPills.morning_1 ? t('patient_dose_taken', 'Taken') : (language === 'hi' ? 'समय: 8:30 बजे' : 'Due 8:30 AM')}
                    </span>
                  </div>

                  <div 
                    onClick={() => togglePill('afternoon_1')}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      takenPills.afternoon_1 ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {takenPills.afternoon_1 ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold">Aspirin 75mg (1 Tab)</div>
                        <div className="text-[11px] text-slate-500">{t('patient_afternoon_dose', 'Afternoon (Post Lunch)')}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {takenPills.afternoon_1 ? t('patient_dose_taken', 'Taken') : (language === 'hi' ? 'समय: 1:30 बजे' : 'Due 1:30 PM')}
                    </span>
                  </div>

                  <div 
                    onClick={() => togglePill('night_1')}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      takenPills.night_1 ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {takenPills.night_1 ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold">Atorvastatin 10mg (1 Tab)</div>
                        <div className="text-[11px] text-slate-500">{t('patient_night_dose', 'Night (At Bedtime)')}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {takenPills.night_1 ? t('patient_dose_taken', 'Taken') : (language === 'hi' ? 'समय: 9:30 बजे' : 'Due 9:30 PM')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Active Prescription */}
              <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Pill className="w-5 h-5 text-teal-600" />
                    {t('patient_current_prescription', 'Current Active e-Prescription')}
                  </h3>
                  <button
                    onClick={() => handleOpenPrescription(latestRecord?.prescription, latestRecord?.recorded_by_name || 'Dr. Alok Sharma', latestRecord?.record_date || '2026-09-18')}
                    className="text-xs font-bold text-teal-700 hover:underline"
                  >
                    {t('patient_view_prescription', 'View Printable e-Rx')} →
                  </button>
                </div>

                <div className="space-y-2.5 text-xs divide-y divide-slate-100">
                  {currentMedications.map((med: any, idx: number) => (
                    <div key={idx} className="pt-2 first:pt-0 flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900">{med.name}</div>
                        <div className="text-[11px] text-slate-500">{med.instructions || (language === 'hi' ? 'चिकित्सक की सलाह अनुसार लें' : 'Take as advised by physician')}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {med.frequency}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{med.duration}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* 5. Recent Health Record Encounter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-teal-600" />
                  {t('patient_recent_health_record', 'Recent Health Encounters')}
                </h2>
                <Link
                  to="/patient/records"
                  className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1"
                >
                  <span>{t('patient_longitudinal_timeline', 'Full Longitudinal Record')} ({timeline.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <HealthTimeline records={timeline.slice(0, 2)} onOpenPrescription={handleOpenPrescription} />
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LONGITUDINAL HEALTH RECORDS */}
        {/* ========================================================================= */}
        {activeTab === 'records' && (
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  {t('patient_longitudinal_timeline', 'Longitudinal Health Record Timeline')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('patient_timeline_desc', 'Single continuous record of all doorstep vitals, PHC consultations, diagnostic tests, and hospital care')}
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-teal-50 text-teal-800 rounded-lg border border-teal-200">
                {timeline.length} {language === 'hi' ? 'कुल रिकॉर्ड' : 'Total Encounters'}
              </span>
            </div>

            <HealthTimeline records={timeline} onOpenPrescription={handleOpenPrescription} />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: DOCTOR CONSULTATIONS & TELEMEDICINE */}
        {/* ========================================================================= */}
        {activeTab === 'consultations' && (
          <div className="space-y-5">
            <ConsultationQueue userRole="patient" />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: REFERRAL TRACKING */}
        {/* ========================================================================= */}
        {activeTab === 'referrals' && (
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                {language === 'hi' ? 'विशेषज्ञ रेफ़रल प्रबंधन व प्रगति ट्रैकर' : 'Specialist Referral Management & Progress Tracker'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'hi' 
                  ? 'उप-केंद्र, प्राथमिक स्वास्थ्य केंद्र (PHC) और जिला अस्पताल के बीच मरीजों की रीयल-टाइम ट्रैकिंग' 
                  : 'Real-time tracking of patient transitions between Village Sub-Centres, PHCs, and Bhopal District Memorial Hospital'}
              </p>
            </div>

            <div className="space-y-4">
              {referrals.map((ref) => (
                <ReferralTracker key={ref.id} referral={ref} />
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: MEDICINE AVAILABILITY & REMINDERS */}
        {/* ========================================================================= */}
        {activeTab === 'medicines' && (
          <div className="space-y-6">
            {/* Pill Reminders Widget */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                {language === 'hi' ? 'दैनिक दवा खुराक अनुसूची' : 'Daily Medication Adherence Schedule'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {currentMedications.map((med: any, i: number) => (
                  <div key={i} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="font-bold text-slate-900">{med.name}</div>
                    <div className="text-teal-800 font-medium">{med.frequency} • {med.dosage}</div>
                    <div className="text-slate-500 text-[11px] italic">{med.instructions}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Medicine Inventory Search */}
            <MedicineSearch />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: APPOINTMENTS */}
        {/* ========================================================================= */}
        {activeTab === 'appointments' && (
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  {language === 'hi' ? 'पुष्ट व आगामी अस्पताल अपॉइंटमेंट' : 'Confirmed & Upcoming Hospital Appointments'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'hi' ? 'निर्धारित विशेषज्ञ परामर्श व ओपीडी स्लॉट देखें' : 'View scheduled specialist consultations and OPD visits'}
                </p>
              </div>
              <button
                onClick={() => setShowAppointmentModal(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('patient_book_appointment', 'Book Specialist Appointment')}</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">Dr. Rajeshwari Sen (Chief Cardiologist)</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                      {language === 'hi' ? 'पुष्ट स्लॉट' : 'Confirmed Slot'}
                    </span>
                  </div>
                  <p className="text-slate-600">{language === 'hi' ? 'भोपाल जिला मेमोरियल अस्पताल (कार्डियोलॉजी ओपीडी कक्ष 104)' : 'Bhopal District Memorial Hospital (Cardiology OPD Room 104)'}</p>
                  <p className="text-teal-800 font-medium">{language === 'hi' ? 'समय: आज, प्रातः 11:30 बजे • रेफ़रल #REF-2026-101' : 'Slot Time: Today, 11:30 AM • Referral #REF-2026-101'}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-slate-500">APPT-2026-482</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 opacity-80">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">Dr. Alok Sharma (Medical Officer)</span>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-bold text-[10px]">
                      {tStatus('Completed')}
                    </span>
                  </div>
                  <p className="text-slate-600">{language === 'hi' ? 'प्राथमिक स्वास्थ्य केंद्र, रातीबड़' : 'Primary Health Centre, Ratibad'}</p>
                  <p className="text-slate-500">{language === 'hi' ? 'नियमित गैर-संचारी रोग (NCD) रक्तचाप परामर्श' : 'Routine NCD Blood Pressure Consultation'}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-slate-400">APPT-2026-302</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: ASHA FOLLOW-UPS */}
        {/* ========================================================================= */}
        {activeTab === 'followups' && (
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-amber-500" />
                {language === 'hi' ? 'ग्रामीण आशा कार्यकर्ता गृह फॉलो-अप प्रबंधन' : 'Village ASHA Doorstep Follow-Up Management'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'hi' 
                  ? 'बरखेड़ा गांव में आपकी निर्धारित आशा कार्यकर्ता सुनीता अहिरवार द्वारा गृह स्वास्थ्य जांच' 
                  : 'Home checkups scheduled by your assigned ASHA worker Sunita Ahirwar in Barkheda village'}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-amber-50/40 border border-amber-200 p-4 rounded-2xl shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-amber-950">{pendingFollowUp.category}</span>
                  <StatusBadge status={pendingFollowUp.status} />
                </div>
                <p className="text-slate-700">{pendingFollowUp.instructions}</p>
                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-amber-200/60">
                  <span>{t('patient_asha_contact', 'Assigned ASHA')}: <strong>{pendingFollowUp.assigned_asha_name}</strong></span>
                  <span>{t('form_followup_date', 'Due Date')}: <strong>{formatDate(pendingFollowUp.due_date)}</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: ABHA & GOVERNMENT SCHEMES */}
        {/* ========================================================================= */}
        {activeTab === 'schemes' && (
          <div className="space-y-6">
            <AbhaCard patient={patient} onRefresh={fetchPatientData} />

            {/* Government Public Health Schemes */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-600" />
                {t('schemes_title', 'Verified Government Healthcare Schemes & Subsidies')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. PM-JAY */}
                <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">Ayushman Bharat (PM-JAY)</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                      {t('active', 'Active')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {t('scheme_pmjay_desc', '₹5,00,000 annual secondary/tertiary hospital cashless cover.')}
                  </p>
                  <div className="text-xs font-mono font-bold text-teal-800">
                    Card ID: {patient.ayushman_pmjay_id || 'PMJAY-MP-2026-4821'}
                  </div>
                </div>

                {/* 2. JSY */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">Janani Suraksha Yojana (JSY)</span>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-bold text-[10px]">
                      {t('scheme_status_eligible', 'Eligible')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {t('scheme_jsy_desc', 'Institutional delivery & maternal nutrition incentive support in rural areas.')}
                  </p>
                </div>

                {/* 3. PMMVY / Free Drugs */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">Free Drugs & Diagnostics Service</span>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-bold text-[10px]">
                      {language === 'hi' ? 'निःशुल्क सेवा' : 'Free Benefit'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {t('scheme_free_drugs_desc', 'Essential medicines and diagnostic tests provided free of cost to all citizens.')}
                  </p>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 9: NOTIFICATIONS & ALERTS */}
        {/* ========================================================================= */}
        {activeTab === 'notifications' && (
          <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-teal-600" />
              {t('notifications_title', 'Patient Alerts & Notifications')}
            </h2>
            <div className="space-y-2.5 text-xs">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{notif.title}</span>
                    <span className="text-[10px] text-slate-400">{formatDateTime(notif.created_at)}</span>
                  </div>
                  <p className="text-slate-600">{notif.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 10: PATIENT PROFILE */}
        {/* ========================================================================= */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {language === 'hi' ? 'नागरिक जनसांख्यिकीय व क्लिनिकल प्रोफ़ाइल' : 'Demographic & Clinical Profile'}
                </h2>
                <p className="text-xs text-slate-500">
                  {language === 'hi' ? 'ABDM मानकों के अंतर्गत आधिकारिक नागरिक विवरण' : 'Official citizen registry information under ABDM standards'}
                </p>
              </div>
              <span className="px-3 py-1 bg-teal-50 text-teal-800 font-mono text-xs font-bold rounded-lg border border-teal-200">
                PAT ID: {patient.id}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold">{t('form_patient_name', 'Full Name')}</span>
                <div className="font-bold text-slate-900 mt-0.5">{patient.name}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold">{t('form_patient_age', 'Age')} & {t('form_patient_gender', 'Gender')}</span>
                <div className="font-bold text-slate-900 mt-0.5">{patient.age} Yrs / {patient.gender}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold">{t('form_patient_blood_group', 'Blood Group')}</span>
                <div className="font-bold text-slate-900 mt-0.5">{patient.blood_group}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold">{t('form_patient_mobile', 'Mobile Number')}</span>
                <div className="font-bold text-slate-900 mt-0.5">{patient.mobile}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold">{t('form_patient_village', 'Village')}</span>
                <div className="font-bold text-slate-900 mt-0.5">{patient.village} (Phanda Block)</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold">{t('form_patient_emergency', 'Emergency Contact')}</span>
                <div className="font-bold text-slate-900 mt-0.5">{patient.emergency_contact}</div>
              </div>
            </div>

            {/* Assigned Care Team */}
            <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-200/80 space-y-2 text-xs">
              <h4 className="font-bold text-teal-950">{t('patient_care_team', 'Assigned Rural Care Team')}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                <div>
                  <strong>{t('patient_asha_contact', 'ASHA Worker')}: </strong> Sunita Ahirwar (+91 9876500001)
                </div>
                <div>
                  <strong>{t('patient_phc_contact', 'Mapped PHC')}: </strong> Primary Health Centre, Ratibad (+91 755 2894101)
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Digital Prescription Modal */}
      <PrescriptionModal
        isOpen={selectedRx !== null}
        onClose={() => setSelectedRx(null)}
        prescription={selectedRx}
        doctorName={rxDoctor}
        patientName={patient.name}
        patientAbha={patient.abha_id || '91-4829-1029-4821'}
        date={rxDate}
      />

      {/* Request Teleconsultation Modal */}
      <Modal
        isOpen={showTeleconModal}
        onClose={() => setShowTeleconModal(false)}
        title={t('telecon_request_title', 'Request Teleconsultation with Doctor')}
        subtitle={language === 'hi' ? 'निकटतम चिकित्सा अधिकारी या विशेषज्ञ से वीडियो परामर्श' : 'Connects you with the nearest Medical Officer or District Specialist'}
        maxWidth="md"
      >
        <form onSubmit={handleRequestTelecon} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {language === 'hi' ? 'परामर्श का कारण *' : 'Reason for Consultation *'}
            </label>
            <input
              type="text"
              required
              placeholder={language === 'hi' ? 'उदा. बुखार / रक्तचाप की समीक्षा' : 'e.g. Fever follow-up / Blood pressure review'}
              value={teleReason}
              onChange={(e) => setTeleReason(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {t('telecon_chief_complaints', 'Describe Current Symptoms')}
            </label>
            <textarea
              rows={3}
              placeholder={language === 'hi' ? 'अपने लक्षण, दर्द, अवधि और ली जा रही दवाओं का विवरण दें...' : 'Detail your symptoms, pain, duration, and any medicines you are taking...'}
              value={teleSymptoms}
              onChange={(e) => setTeleSymptoms(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowTeleconModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={requestingTele}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <Video className="w-4 h-4" />
              {requestingTele ? t('saving', 'Requesting...') : (language === 'hi' ? 'डॉक्टर कतार में जोड़ें' : 'Place in Doctor Queue')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Book Specialist Appointment Modal */}
      <Modal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        title={t('patient_book_appointment', 'Book Specialist Appointment')}
        subtitle={language === 'hi' ? 'भोपाल जिला मेमोरियल अस्पताल विशेषज्ञ डेस्क' : 'Bhopal District Memorial Hospital Specialist Desk'}
        maxWidth="md"
      >
        <form onSubmit={handleBookAppointment} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {t('form_select_specialty', 'Select Department / Specialty *')}
            </label>
            <select
              value={appointmentSpecialty}
              onChange={(e) => setAppointmentSpecialty(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-semibold text-slate-800"
            >
              <option value="Cardiology">{language === 'hi' ? 'हृदय रोग (Cardiology)' : 'Cardiology (Heart & Blood Pressure)'}</option>
              <option value="Pulmonology">{language === 'hi' ? 'श्वसन रोग (Pulmonology & TB)' : 'Pulmonology (Respiratory & TB)'}</option>
              <option value="Gynaecology">{language === 'hi' ? 'स्त्री एवं प्रसूति रोग (Gynaecology & ANC)' : 'Gynaecology & Obstetrics (Maternal ANC)'}</option>
              <option value="General Medicine">{language === 'hi' ? 'सामान्य चिकित्सा (General Medicine)' : 'General Medicine'}</option>
              <option value="Orthopaedics">{language === 'hi' ? 'हड्डी रोग (Orthopaedics)' : 'Orthopaedics & Trauma'}</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {language === 'hi' ? 'पसंदीदा अपॉइंटमेंट दिनांक *' : 'Preferred Appointment Date *'}
            </label>
            <input
              type="date"
              required
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAppointmentModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={bookingAppointment}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <Calendar className="w-4 h-4" />
              {bookingAppointment ? t('saving', 'Confirming...') : (language === 'hi' ? 'अपॉइंटमेंट स्लॉट बुक करें' : 'Confirm Appointment Slot')}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default PatientDashboard;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { Referral, Patient, HealthRecord, MedicineStock, FollowUp, NotificationItem } from '../types';
import { Sidebar } from '../components/common/Sidebar';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatDate, formatDateTime } from '../utils/formatters';
import { ReferralDetailsModal } from '../components/hospital/ReferralDetailsModal';
import { HospitalConsultationModal } from '../components/hospital/HospitalConsultationModal';
import { MedicineSearch } from '../components/medicine/MedicineSearch';
import { ReferralTrackingEngine } from '../components/referral/ReferralTrackingEngine';
import { Modal } from '../components/common/Modal';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  FileText, 
  HeartHandshake, 
  UserCheck, 
  Search, 
  Stethoscope, 
  ArrowRight, 
  Send, 
  Menu, 
  Inbox, 
  Pill,
  Activity,
  Users,
  Bell,
  Truck,
  Eye,
  CheckSquare
} from 'lucide-react';

export const HospitalDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t, tStatus, tPriority, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stockList, setStockList] = useState<MedicineStock[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [selectedReferralForDetails, setSelectedReferralForDetails] = useState<Referral | null>(null);
  const [selectedReferralForConsult, setSelectedReferralForConsult] = useState<Referral | null>(null);
  const [selectedPatientTimeline, setSelectedPatientTimeline] = useState<Patient | null>(null);
  const [patientTimelineRecords, setPatientTimelineRecords] = useState<HealthRecord[]>([]);

  const fetchHospitalData = async () => {
    setLoading(true);
    try {
      const [rRes, pRes, fRes, nRes, sRes] = await Promise.all([
        api.getReferrals(),
        api.getPatients(),
        api.getFollowUps(),
        api.getNotifications(),
        api.getFacilityMedicines('FAC-DH-01')
      ]);

      if (rRes.success) setReferrals(rRes.data);
      if (pRes.success) setPatients(pRes.data);
      if (fRes.success) setFollowUps(fRes.data);
      if (nRes.success) setNotifications(nRes.data);
      if (sRes.success) setStockList(sRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitalData();
  }, []);

  const handleOpenPatientTimeline = async (pat: Patient) => {
    setSelectedPatientTimeline(pat);
    try {
      const res = await api.getPatientTimeline(pat.id);
      if (res.success) setPatientTimelineRecords(res.timeline || []);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredReferrals = referrals.filter(r => {
    const q = searchTerm.toLowerCase().trim();
    const matchesQuery = !q || (
      r.id.toLowerCase().includes(q) ||
      r.patient_name.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q) ||
      r.from_facility_name.toLowerCase().includes(q) ||
      r.specialty_requested.toLowerCase().includes(q)
    );

    const matchesStatus = statusFilter === 'all' || r.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesPriority = priorityFilter === 'all' || r.referral_type.toLowerCase() === priorityFilter.toLowerCase();

    return matchesQuery && matchesStatus && matchesPriority;
  });

  const pendingTriage = referrals.filter(r => r.status === 'Created');
  const scheduledAppointments = referrals.filter(r => r.status === 'Appointment Scheduled' || r.status === 'In Transit' || r.status === 'Patient Arrived' || r.status === 'Arrived');
  const urgentEmergencyCases = referrals.filter(r => r.referral_type === 'urgent' || r.referral_type === 'emergency');

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-100px)]">
      
      {/* Mobile Drawer Trigger Bar */}
      <div className="lg:hidden bg-white border-b border-slate-200 p-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 p-2 rounded-xl bg-slate-100 hover:bg-slate-200"
        >
          <Menu className="w-4 h-4" />
          <span>{t('hospital_desk', 'District Hospital Referral Desk')}</span>
        </button>
        <span className="text-xs font-bold text-blue-800 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
          {activeTab.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl">
        
        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW & TRIAGE COMMAND */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* 1. Specialist Command Hero */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-sm">
                    DH
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 leading-tight">Dr. Rajeshwari Sen</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t('dh_sub', 'Chief of Cardiology & Referral Triage')} | {t('dh_title', 'District Memorial Hospital (350 Beds)')}
                    </p>
                  </div>
                </div>

                {/* Primary Fast Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveTab('referrals')}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Inbox className="w-4 h-4" />
                    <span>{t('dh_triage_queue', 'Incoming Triage Queue')} ({pendingTriage.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('appointments')}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-all"
                  >
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>{t('dh_slots', 'Specialist Slots')}</span>
                  </button>
                </div>
              </div>

              {/* Status KPI Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
                <div 
                  onClick={() => setActiveTab('referrals')}
                  className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1 cursor-pointer hover:bg-blue-100/70 transition-all"
                >
                  <span className="text-[10px] uppercase font-bold text-blue-700">{t('dh_total_inbound', 'Total Inbound Referrals')}</span>
                  <div className="text-2xl font-black text-slate-900">{referrals.length}</div>
                  <p className="text-slate-600 text-[11px]">{t('dh_across_phcs', 'Across rural PHCs')}</p>
                </div>

                <div 
                  onClick={() => {
                    setPriorityFilter('urgent');
                    setActiveTab('referrals');
                  }}
                  className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-1 cursor-pointer hover:bg-rose-100/70 transition-all"
                >
                  <span className="text-[10px] uppercase font-bold text-rose-700">{t('dh_urgent_emergency', 'Urgent & Emergency')}</span>
                  <div className="text-2xl font-black text-rose-900">{urgentEmergencyCases.length} {t('active', 'Active')}</div>
                  <p className="text-slate-600 text-[11px]">{t('dh_priority_triage', 'Priority triage protocol')}</p>
                </div>

                <div 
                  onClick={() => setActiveTab('appointments')}
                  className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1 cursor-pointer hover:bg-amber-100/70 transition-all"
                >
                  <span className="text-[10px] uppercase font-bold text-amber-700">{t('dh_sched_transit', 'Scheduled / In Transit')}</span>
                  <div className="text-2xl font-black text-amber-900">{scheduledAppointments.length} {t('active', 'Active')}</div>
                  <p className="text-slate-600 text-[11px]">{t('dh_ambulance_tracked', '108 Ambulance tracked')}</p>
                </div>

                <div 
                  onClick={() => setActiveTab('followups')}
                  className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1 cursor-pointer hover:bg-emerald-100/70 transition-all"
                >
                  <span className="text-[10px] uppercase font-bold text-emerald-700">{t('dh_closed_loop', 'Closed-Loop Discharges')}</span>
                  <div className="text-2xl font-black text-emerald-900">{followUps.length} {t('completed', 'Completed')}</div>
                  <p className="text-slate-600 text-[11px]">{t('dh_mapped_ashas', 'Mapped to village ASHAs')}</p>
                </div>
              </div>
            </div>

            {/* 2. Priority Incoming Referrals Queue */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Inbox className="w-5 h-5 text-blue-600" />
                    {t('dh_incoming_awaiting', 'Incoming Referrals Awaiting Action')} ({pendingTriage.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">{t('dh_incoming_sub', 'Click any referral to review full clinical history or advance status')}</p>
                </div>
                <button
                  onClick={() => setActiveTab('referrals')}
                  className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                >
                  <span>{t('dh_view_all_inbound', 'View All Inbound')} ({referrals.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">{t('referral_id', 'Referral ID')}</th>
                      <th className="p-3.5">{t('role_patient', 'Patient')}</th>
                      <th className="p-3.5">{t('referral_source', 'Source PHC')}</th>
                      <th className="p-3.5">{t('referral_reason', 'Reason')}</th>
                      <th className="p-3.5">{t('referral_priority', 'Priority')}</th>
                      <th className="p-3.5">{t('date', 'Date')}</th>
                      <th className="p-3.5">{t('status', 'Status')}</th>
                      <th className="p-3.5 text-right">{t('actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {referrals.slice(0, 4).map((ref) => (
                      <tr key={ref.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-slate-900">{ref.id}</td>
                        <td className="p-3.5 font-bold text-slate-900">
                          <div>{ref.patient_name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{ref.patient_village}</div>
                        </td>
                        <td className="p-3.5 text-slate-700">{ref.from_facility_name}</td>
                        <td className="p-3.5 text-slate-700 font-medium truncate max-w-xs">{ref.reason}</td>
                        <td className="p-3.5">
                          <StatusBadge status={ref.referral_type.toUpperCase()} isPriority={true} />
                        </td>
                        <td className="p-3.5 text-slate-500">{formatDate(ref.created_at)}</td>
                        <td className="p-3.5">
                          <StatusBadge status={ref.status} />
                        </td>
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedReferralForDetails(ref)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-xl text-xs border border-blue-200"
                          >
                            {t('dh_details_timeline', 'Details & Timeline')}
                          </button>
                          <button
                            onClick={() => setSelectedReferralForConsult(ref)}
                            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-xs"
                          >
                            {t('dh_care_rx', 'Care & Rx')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: INCOMING REFERRALS WITH MULTI-FILTER */}
        {/* ========================================================================= */}
        {activeTab === 'referrals' && (
          <div className="space-y-5">
            <ReferralTrackingEngine 
              userRole="hospital" 
              onReferralUpdated={fetchHospitalData} 
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: APPOINTMENTS */}
        {/* ========================================================================= */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                {t('dh_appt_calendar', 'Specialist OPD Appointments Calendar')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('dh_appt_calendar_sub', 'Confirmed patient slots across Cardiology, Pulmonology, Gynaecology, Orthopaedics, and Surgery')}
              </p>
            </div>

            <div className="space-y-3">
              {scheduledAppointments.map((ref) => (
                <div key={ref.id} className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-slate-900">{ref.patient_name}</span>
                      <StatusBadge status={ref.status} />
                      <span className="text-teal-800 font-bold">{t('time', 'Slot')}: {formatDateTime(ref.appointment_date)}</span>
                    </div>
                    <p className="text-slate-600">{t('form_select_specialty', 'Specialty')}: <strong>{ref.specialty_requested}</strong> | {t('referral_source', 'Origin')}: {ref.from_facility_name}</p>
                    <p className="text-slate-500 italic">{t('referral_reason', 'Reason')}: {ref.reason}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedReferralForDetails(ref)}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs"
                    >
                      {t('dh_update_state', 'Update State')}
                    </button>
                    <button
                      onClick={() => setSelectedReferralForConsult(ref)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-xs"
                    >
                      {t('dh_examine_patient', 'Examine Patient')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CONSULTATIONS & PRESCRIPTIONS */}
        {/* ========================================================================= */}
        {activeTab === 'consultations' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-600" />
                {t('dh_spec_consults', 'Specialist Consultations & Digital e-Prescriptions')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('dh_spec_consults_sub', 'Specialist diagnosis, cardiovascular evaluations, diagnostic tests, and counter-referral care plans')}
              </p>
            </div>

            <div className="space-y-3">
              {referrals.slice(0, 3).map((ref) => (
                <div key={ref.id} className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{ref.patient_name}</span>
                      <span className="font-mono text-slate-500">{ref.id}</span>
                      <StatusBadge status={ref.status} />
                    </div>
                    <div className="text-teal-900 font-semibold">{ref.specialty_requested}</div>
                    <p className="text-slate-600 italic truncate max-w-xl">{ref.reason}</p>
                  </div>

                  <button
                    onClick={() => setSelectedReferralForConsult(ref)}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-xs shrink-0"
                  >
                    {t('dh_open_clinical_pad', 'Open Clinical Pad')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: DIAGNOSTIC & LAB REPORTS */}
        {/* ========================================================================= */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                {t('dh_diag_reports', 'Specialist Diagnostic & Laboratory Reports')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('dh_diag_reports_sub', 'Echo, ECG, CBNAAT, Blood Biochemistry, Ultrasound, and Pathology results')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">2D Echocardiography</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">{t('completed', 'Verified')}</span>
                </div>
                <p className="text-slate-600 font-mono text-[11px]">LVEF 55%, Concentric LVH, Normal valvular function</p>
                <div className="text-[10px] text-slate-400">{t('role_patient', 'Patient')}: Ramesh Kumar Verma • By: Dr. Rajeshwari Sen</div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">12-Lead Resting ECG</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">{t('completed', 'Verified')}</span>
                </div>
                <p className="text-slate-600 font-mono text-[11px]">T-wave inversion in V4-V6, Heart rate: 76 bpm</p>
                <div className="text-[10px] text-slate-400">{t('role_patient', 'Patient')}: Ramesh Kumar Verma • DH Cardiology Lab</div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Sputum CBNAAT / GeneXpert</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">{t('completed', 'Verified')}</span>
                </div>
                <p className="text-slate-600 font-mono text-[11px]">MTB Detected, Rifampicin Resistance NOT Detected</p>
                <div className="text-[10px] text-slate-400">{t('role_patient', 'Patient')}: Rajesh Ahirwar • NTEP District Lab</div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: PATIENT RECORDS REGISTRY */}
        {/* ========================================================================= */}
        {activeTab === 'records' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                {t('dh_patient_registry', 'District Hospital Patient Records Registry')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('dh_patient_registry_sub', 'Browse longitudinal patient records, ABHA health IDs, and clinical referral timelines')}
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">{t('form_patient_name', 'Patient Name')}</th>
                    <th className="p-3.5">{t('form_patient_age', 'Age')} / {t('form_patient_gender', 'Gender')}</th>
                    <th className="p-3.5">ABHA ID</th>
                    <th className="p-3.5">{t('form_patient_village', 'Village')}</th>
                    <th className="p-3.5">{t('form_patient_conditions', 'Chronic Condition')}</th>
                    <th className="p-3.5 text-right">{t('actions', 'Action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{p.name}</td>
                      <td className="p-3.5 text-slate-700">{p.age} Yrs / {p.gender}</td>
                      <td className="p-3.5 font-mono text-teal-800 font-semibold">{p.abha_id}</td>
                      <td className="p-3.5 text-slate-700">{p.village}</td>
                      <td className="p-3.5 text-slate-600">{p.chronic_conditions?.join(', ') || 'N/A'}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleOpenPatientTimeline(p)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-xl text-xs border border-blue-200"
                        >
                          {t('dh_view_full_timeline', 'View Full Timeline')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: DISCHARGE & CLOSED-LOOP FOLLOW-UPS */}
        {/* ========================================================================= */}
        {activeTab === 'followups' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-600" />
                {t('dh_discharges_delegated', 'Closed-Loop Follow-Ups Delegated to Village ASHAs')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('dh_discharges_delegated_sub', 'Every discharged patient is automatically mapped to their village ASHA worker for doorstep BP, glucose, and adherence monitoring')}
              </p>
            </div>

            <div className="space-y-3">
              {followUps.map((f) => (
                <div key={f.id} className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{f.patient_name}</span>
                      <StatusBadge status={f.status} />
                      <span className="text-slate-500">{t('form_followup_date', 'Due')}: {formatDate(f.due_date)}</span>
                    </div>
                    <span className="text-slate-600">{t('dh_mapped_ashas', 'Assigned ASHA')}: <strong className="text-teal-900">{f.assigned_asha_name}</strong></span>
                  </div>
                  <div className="font-bold text-teal-900">{f.category}</div>
                  <p className="text-slate-700 italic leading-relaxed">{f.instructions}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: HOSPITAL PHARMACY INVENTORY */}
        {/* ========================================================================= */}
        {activeTab === 'inventory' && (
          <div className="space-y-5">
            <MedicineSearch />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 9: NOTIFICATIONS & ALERTS */}
        {/* ========================================================================= */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                {t('dh_hospital_alerts', 'Hospital Triage Notifications & Alerts')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('dh_hospital_alerts_sub', 'Real-time stream of incoming referrals, ambulance transfers, and specialist triage updates')}
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              {notifications.map((n) => (
                <div key={n.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{n.title}</span>
                    <span className="text-[10px] text-slate-400">{formatDateTime(n.created_at)}</span>
                  </div>
                  <p className="text-slate-600">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* 1. Referral Details Dossier Modal */}
      <ReferralDetailsModal
        isOpen={selectedReferralForDetails !== null}
        onClose={() => setSelectedReferralForDetails(null)}
        referral={selectedReferralForDetails}
        onSuccess={fetchHospitalData}
        onOpenConsultation={(ref) => setSelectedReferralForConsult(ref)}
      />

      {/* 2. Specialist Consultation & Discharge Modal */}
      <HospitalConsultationModal
        isOpen={selectedReferralForConsult !== null}
        onClose={() => setSelectedReferralForConsult(null)}
        referral={selectedReferralForConsult}
        onSuccess={fetchHospitalData}
      />

      {/* 3. Patient Timeline Modal */}
      <Modal
        isOpen={selectedPatientTimeline !== null}
        onClose={() => setSelectedPatientTimeline(null)}
        title={`${t('health_records', 'Longitudinal Health Record')} — ${selectedPatientTimeline?.name}`}
        subtitle={`ABHA: ${selectedPatientTimeline?.abha_id || 'Unlinked'} | ${t('form_patient_village', 'Village')}: ${selectedPatientTimeline?.village}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {patientTimelineRecords.length === 0 ? (
            <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl">
              {t('no_data', 'No previous clinical encounters recorded.')}
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {patientTimelineRecords.map((rec) => (
                <div key={rec.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{rec.diagnosis || rec.chief_complaint}</span>
                    <span className="text-[10px] text-slate-400">{formatDate(rec.record_date || rec.created_at)}</span>
                  </div>
                  <p className="text-slate-600">{rec.clinical_observations}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px] text-slate-500">
                    <span>{t('med_facility', 'Facility')}: <strong>{rec.facility_name}</strong></span>
                    <span>By: {rec.recorded_by_name} ({rec.recorded_by_role})</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setSelectedPatientTimeline(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              {t('close', 'Close Record')}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default HospitalDashboard;

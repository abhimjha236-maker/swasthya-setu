import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { Patient, Referral, Teleconsultation, MedicineStock, FollowUp } from '../types';
import { Sidebar } from '../components/common/Sidebar';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatDate } from '../utils/formatters';
import { ConsultationModal } from '../components/phc/ConsultationModal';
import { ReferralModal } from '../components/phc/ReferralModal';
import { Modal } from '../components/common/Modal';
import { Link } from 'react-router-dom';
import { 
  Stethoscope, 
  Send, 
  Video, 
  Users, 
  Search, 
  CheckCircle2, 
  ArrowRight, 
  Menu, 
  CheckSquare, 
  Activity, 
  UserPlus
} from 'lucide-react';
import { RegisterPatientModal } from '../components/asha/RegisterPatientModal';
import { MedicineSearch } from '../components/medicine/MedicineSearch';
import { ReferralTrackingEngine } from '../components/referral/ReferralTrackingEngine';
import { ConsultationQueue } from '../components/telecon/ConsultationQueue';

export const PhcDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t, language, tStatus } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [telecons, setTelecons] = useState<Teleconsultation[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [stockList, setStockList] = useState<MedicineStock[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [selectedPatientForConsult, setSelectedPatientForConsult] = useState<Patient | null>(null);
  const [selectedPatientForReferral, setSelectedPatientForReferral] = useState<Patient | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [selectedPatientForTimeline, setSelectedPatientForTimeline] = useState<Patient | null>(null);
  const [patientTimeline, setPatientTimeline] = useState<any[]>([]);

  // Stock update modal
  const [selectedStockForUpdate, setSelectedStockForUpdate] = useState<MedicineStock | null>(null);
  const [newStockQty, setNewStockQty] = useState<number>(0);
  const [updatingStock, setUpdatingStock] = useState<boolean>(false);

  // Referral status update modal (e.g. Accept / Schedule Appointment)
  const [selectedReferralForAction, setSelectedReferralForAction] = useState<Referral | null>(null);
  const [referralNewStatus, setReferralNewStatus] = useState<string>('Accepted');
  const [referralDoctorName, setReferralDoctorName] = useState<string>('Dr. Alok Sharma');
  const [referralApptDate, setReferralApptDate] = useState<string>('');
  const [referralRemarks, setReferralRemarks] = useState<string>('');
  const [updatingReferral, setUpdatingReferral] = useState<boolean>(false);

  const fetchPhcData = async () => {
    setLoading(true);
    try {
      const [pRes, rRes, tRes, fRes, sRes] = await Promise.all([
        api.getPatients(),
        api.getReferrals(),
        api.getTeleconsultations(),
        api.getFollowUps(),
        api.getFacilityMedicines('FAC-PHC-01')
      ]);

      if (pRes.success) setPatients(pRes.data);
      if (rRes.success) setReferrals(rRes.data);
      if (tRes.success) setTelecons(tRes.data);
      if (fRes.success) setFollowUps(fRes.data);
      if (sRes.success) setStockList(sRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhcData();
  }, []);

  const handleOpenTimeline = async (p: Patient) => {
    setSelectedPatientForTimeline(p);
    try {
      const res = await api.getPatientTimeline(p.id);
      if (res.success) setPatientTimeline(res.timeline || []);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPatients = patients.filter(p => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.mobile.includes(q) ||
      (p.abha_id && p.abha_id.replace(/-/g, '').includes(q.replace(/-/g, ''))) ||
      p.village.toLowerCase().includes(q)
    );
  });

  const handleStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockForUpdate) return;
    setUpdatingStock(true);
    try {
      const res = await api.updateMedicineStock({
        stock_id: selectedStockForUpdate.id,
        new_quantity: newStockQty
      });
      if (res.success) {
        setSelectedStockForUpdate(null);
        fetchPhcData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStock(false);
    }
  };

  const handleReferralStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReferralForAction) return;
    setUpdatingReferral(true);
    try {
      const res = await api.updateReferralStatus(selectedReferralForAction.id, {
        status: referralNewStatus,
        assigned_doctor_name: referralDoctorName,
        appointment_date: referralApptDate || undefined,
        remarks: referralRemarks || `Referral status updated to ${referralNewStatus}`
      });

      if (res.success) {
        setSelectedReferralForAction(null);
        fetchPhcData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingReferral(false);
    }
  };

  const lowStockItems = stockList.filter(s => s.status === 'Low Stock' || s.status === 'Out of Stock');
  const pendingReferrals = referrals.filter(r => r.status !== 'Treatment Completed' && r.status !== 'Closed');
  const todayFollowUps = followUps.filter(f => f.status === 'Pending');

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-100px)]">
      
      {/* Mobile Drawer Trigger Bar */}
      <div className="lg:hidden bg-white border-b border-slate-200 p-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 p-2 rounded-xl bg-slate-100 hover:bg-slate-200"
        >
          <Menu className="w-4 h-4" />
          <span>{t('phc_desk', 'PHC Clinical Desk Menu')}</span>
        </button>
        <span className="text-xs font-bold text-teal-800 uppercase tracking-wider bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
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

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl">
        
        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* 1. Medical Officer Command Hero */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-2xl shadow-sm">
                    PHC
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 leading-tight">Dr. Alok Sharma</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {language === 'hi' ? 'प्रभारी चिकित्सा अधिकारी' : 'Medical Officer In-Charge'} | {t('role_phc', 'Primary Health Centre')}, <strong className="text-teal-900">Ratibad</strong> | {language === 'hi' ? 'बेड क्षमता: 12' : 'Bed Capacity: 12'}
                    </p>
                  </div>
                </div>

                {/* Primary Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveTab('patients')}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>{t('phc_new_consultation_btn', 'Conduct OPD Consultation')}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('telecon')}
                    className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold rounded-xl text-xs border border-blue-200 flex items-center gap-2 transition-all"
                  >
                    <Video className="w-4 h-4 text-blue-600" />
                    <span>{t('phc_telecon_queue_title', 'Teleconsultation Queue')} ({telecons.length})</span>
                  </button>
                </div>
              </div>

              {/* 7 Required Priority Status KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
                
                {/* 1. Total Patients */}
                <div 
                  onClick={() => setActiveTab('patients')}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all text-center space-y-0.5"
                >
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">{t('phc_total_patients', 'Total Patients')}</span>
                  <div className="text-xl font-black text-slate-900">{patients.length}</div>
                  <span className="text-[9px] text-teal-700 font-bold">ABHA Verified</span>
                </div>

                {/* 2. Today's Consultations */}
                <div 
                  onClick={() => setActiveTab('patients')}
                  className="p-3 bg-teal-50/70 border border-teal-200 rounded-2xl cursor-pointer hover:bg-teal-100 transition-all text-center space-y-0.5"
                >
                  <span className="text-[10px] uppercase font-bold text-teal-700 block">{t('phc_todays_opd', "Today's OPD")}</span>
                  <div className="text-xl font-black text-teal-900">8 {language === 'hi' ? 'परामर्श' : 'Encounters'}</div>
                  <span className="text-[9px] text-teal-700 font-bold">{language === 'hi' ? 'सक्रिय' : 'In Session'}</span>
                </div>

                {/* 3. Pending Referrals */}
                <div 
                  onClick={() => setActiveTab('referrals')}
                  className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl cursor-pointer hover:bg-purple-100 transition-all text-center space-y-0.5"
                >
                  <span className="text-[10px] uppercase font-bold text-purple-700 block">{t('phc_pending_referrals', 'Pending Referrals')}</span>
                  <div className="text-xl font-black text-purple-900">{pendingReferrals.length}</div>
                  <span className="text-[9px] text-purple-700 font-bold">To DH Bhopal</span>
                </div>

                {/* 4. Teleconsultations */}
                <div 
                  onClick={() => setActiveTab('telecon')}
                  className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl cursor-pointer hover:bg-blue-100 transition-all text-center space-y-0.5"
                >
                  <span className="text-[10px] uppercase font-bold text-blue-700 block">{t('phc_telecons_active', 'Teleconsults')}</span>
                  <div className="text-xl font-black text-blue-900">{telecons.length}</div>
                  <span className="text-[9px] text-blue-700 font-bold">e-Sanjeevani</span>
                </div>

                {/* 5. Follow-ups */}
                <div 
                  onClick={() => setActiveTab('followups')}
                  className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl cursor-pointer hover:bg-amber-100 transition-all text-center space-y-0.5"
                >
                  <span className="text-[10px] uppercase font-bold text-amber-700 block">{t('phc_followups_scheduled', 'Follow-Ups')}</span>
                  <div className="text-xl font-black text-amber-900">{todayFollowUps.length}</div>
                  <span className="text-[9px] text-amber-700 font-bold">Village ASHA</span>
                </div>

                {/* 6. Medicine Stock */}
                <div 
                  onClick={() => setActiveTab('inventory')}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all text-center space-y-0.5"
                >
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">{t('phc_stock_table_title', 'Medicine Stock')}</span>
                  <div className="text-xl font-black text-slate-900">{stockList.length} {language === 'hi' ? 'दवाएं' : 'Items'}</div>
                  <span className="text-[9px] text-slate-600 font-bold">PHC Pharmacy</span>
                </div>

                {/* 7. Low Stock Alerts */}
                <div 
                  onClick={() => setActiveTab('inventory')}
                  className={`p-3 rounded-2xl cursor-pointer transition-all text-center space-y-0.5 border ${
                    lowStockItems.length > 0 
                      ? 'bg-rose-50 border-rose-200 text-rose-900' 
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold block">{t('phc_low_stock_alerts', 'Low Stock Alert')}</span>
                  <div className="text-xl font-black">{lowStockItems.length}</div>
                  <span className="text-[9px] font-bold">{language === 'hi' ? 'पुनर्भरण चेतावनी' : 'Restock Flag'}</span>
                </div>

              </div>
            </div>

            {/* 2. Live Teleconsultation Queue */}
            {telecons.length > 0 && (
              <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white rounded-3xl p-6 shadow-md border border-teal-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Video className="w-5 h-5 text-teal-400 animate-pulse" />
                    <h2 className="text-base font-bold text-white">
                      {t('phc_telecon_queue_title', 'Live Teleconsultation Queue (e-Sanjeevani)')}
                    </h2>
                  </div>
                  <span className="text-xs text-teal-300 font-mono">
                    {telecons.length} {language === 'hi' ? 'मरीज़ कतार में' : 'Patient(s) In Queue'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {telecons.map((tc) => (
                    <div 
                      key={tc.id}
                      className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white">{tc.patient_name}</span>
                          <StatusBadge status={tc.status} />
                        </div>
                        <p className="text-xs text-teal-300 mt-0.5">{t('asha_village', 'Village')}: {tc.patient_village} | {language === 'hi' ? 'अनुरोधकर्ता:' : 'Requested by:'} {tc.requested_by_name}</p>
                        <p className="text-xs text-slate-300 mt-1 italic">"{tc.reason}"</p>
                      </div>

                      <Link
                        to={`/teleconsultation/${tc.id}`}
                        className="w-full py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                      >
                        <Video className="w-4 h-4" />
                        <span>{language === 'hi' ? 'टेली-परामर्श कक्ष प्रारंभ करें' : 'Launch Teleconsultation Room'}</span>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. OPD Queue Preview */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-teal-600" />
                    {t('phc_opd_queue_title', 'OPD Patients & Prescription Desk')}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'hi' ? 'मरीज़ जांच, जीवनकालिक रिकॉर्ड समीक्षा व अस्पताल रेफ़रल' : 'Direct examination, longitudinal records, and hospital referral dispatch'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('patients')}
                  className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1"
                >
                  <span>{t('view_all', 'View All OPD Patients')} ({patients.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">{t('form_patient_name', 'Patient Name')}</th>
                      <th className="p-3.5">{t('patient_abha_id', 'ABHA ID')}</th>
                      <th className="p-3.5">{t('form_patient_village', 'Village')}</th>
                      <th className="p-3.5">{t('form_patient_conditions', 'Condition')}</th>
                      <th className="p-3.5 text-right">{t('actions', 'Clinical Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patients.slice(0, 4).map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">
                          <div>{p.name} ({p.age}Y/{p.gender})</div>
                          <div className="text-[10px] text-slate-400 font-normal">{p.mobile}</div>
                        </td>
                        <td className="p-3.5 font-mono text-teal-800 font-semibold">{p.abha_id}</td>
                        <td className="p-3.5 text-slate-700">{p.village}</td>
                        <td className="p-3.5 text-slate-600">{p.chronic_conditions?.join(', ') || 'General OPD'}</td>
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedPatientForConsult(p)}
                            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-xs"
                          >
                            {language === 'hi' ? 'परामर्श व पर्ची' : 'Consult & Rx'}
                          </button>
                          <button
                            onClick={() => setSelectedPatientForReferral(p)}
                            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold rounded-xl border border-purple-200 text-xs"
                          >
                            {language === 'hi' ? 'जिला अस्पताल रेफ़र करें' : 'Refer to DH'}
                          </button>
                          <button
                            onClick={() => handleOpenTimeline(p)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                          >
                            {t('patient_longitudinal_timeline', 'Timeline')}
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
        {/* TAB 2: PATIENTS & OPD CONSULTATION */}
        {/* ========================================================================= */}
        {activeTab === 'patients' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  {t('phc_opd_queue_title', 'OPD Consultation Queue & Patient Directory')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'hi' ? 'मरीज़ की जांच करें, पूर्व रिकॉर्ड देखें, ई-पर्ची जारी करें और जिला अस्पताल रेफ़र करें' : 'Examine patients, review longitudinal histories, issue e-prescriptions, and refer to DH Bhopal'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    placeholder={language === 'hi' ? 'नाम, मोबाइल, आभा से खोजें...' : 'Search by Name, Mobile, ABHA...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shrink-0 shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t('asha_register_patient_btn', '+ New Patient')}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">{t('form_patient_name', 'Patient Name')}</th>
                    <th className="p-3.5">{t('form_patient_age', 'Age')} / {t('form_patient_gender', 'Gender')}</th>
                    <th className="p-3.5">{t('patient_abha_id', 'ABHA ID')}</th>
                    <th className="p-3.5">{t('form_patient_village', 'Village')}</th>
                    <th className="p-3.5">{t('form_patient_conditions', 'Known Conditions')}</th>
                    <th className="p-3.5 text-right">{t('actions', 'Clinical Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">
                        <div>{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{p.mobile}</div>
                      </td>
                      <td className="p-3.5 text-slate-700">{p.age} {language === 'hi' ? 'वर्ष' : 'Yrs'} / {p.gender}</td>
                      <td className="p-3.5 font-mono text-teal-800 font-semibold">{p.abha_id || 'Unlinked'}</td>
                      <td className="p-3.5 text-slate-700">{p.village}</td>
                      <td className="p-3.5 text-slate-600">{p.chronic_conditions?.join(', ') || 'General OPD'}</td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedPatientForConsult(p)}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1 shadow-xs"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          {language === 'hi' ? 'परामर्श व पर्ची' : 'Consult & Rx'}
                        </button>
                        <button
                          onClick={() => setSelectedPatientForReferral(p)}
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold rounded-xl border border-purple-200 inline-flex items-center gap-1 text-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {language === 'hi' ? 'रेफ़र करें' : 'Refer to DH'}
                        </button>
                        <button
                          onClick={() => handleOpenTimeline(p)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs inline-flex items-center gap-1"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          {t('patient_longitudinal_timeline', 'Timeline')}
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
        {/* TAB 3: REFERRAL DESK & TRACKING */}
        {/* ========================================================================= */}
        {activeTab === 'referrals' && (
          <div className="space-y-5">
            <ReferralTrackingEngine 
              userRole="phc" 
              onReferralUpdated={fetchPhcData} 
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: TELECONSULTATION DESK */}
        {/* ========================================================================= */}
        {activeTab === 'telecon' && (
          <div className="space-y-5">
            <ConsultationQueue userRole="phc" />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: VILLAGE FOLLOW-UPS COORDINATION */}
        {/* ========================================================================= */}
        {activeTab === 'followups' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-amber-500" />
                  {t('phc_followups_scheduled', 'Village ASHA Follow-Up Coordination')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'hi' ? 'पीएचसी परामर्श व अस्पताल डिस्चार्ज के बाद आशा कार्यकर्ताओं को सौंपे गए फॉलो-अप कार्य' : 'Track adherence tasks delegated to ASHA field workers following PHC consultations and hospital discharges'}
                </p>
              </div>
              <span className="text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                {todayFollowUps.length} {language === 'hi' ? 'लंबित गृह जांच' : 'Pending Home Checks'}
              </span>
            </div>

            <div className="space-y-3">
              {followUps.map((f) => (
                <div key={f.id} className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{f.patient_name}</span>
                      <StatusBadge status={f.status} />
                      <span className="text-slate-500">{t('form_followup_date', 'Due Date')}: {formatDate(f.due_date)}</span>
                    </div>
                    <span className="text-slate-500">{t('patient_asha_contact', 'Assigned ASHA')}: <strong>{f.assigned_asha_name}</strong></span>
                  </div>
                  <div className="font-bold text-teal-900">{f.category}</div>
                  <p className="text-slate-600 italic leading-relaxed">{f.instructions}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: MEDICINE INVENTORY & BUFFER STOCK */}
        {/* ========================================================================= */}
        {activeTab === 'inventory' && (
          <div className="space-y-5">
            <MedicineSearch initialFacilityId={user?.facility_id || 'FAC-PHC-01'} defaultViewMode="table" />
          </div>
        )}

      </main>

      {/* Consultation Modal */}
      <ConsultationModal
        isOpen={selectedPatientForConsult !== null}
        onClose={() => setSelectedPatientForConsult(null)}
        patient={selectedPatientForConsult}
        onSuccess={fetchPhcData}
      />

      {/* Referral Modal */}
      <ReferralModal
        isOpen={selectedPatientForReferral !== null}
        onClose={() => setSelectedPatientForReferral(null)}
        patient={selectedPatientForReferral}
        onSuccess={fetchPhcData}
      />

      {/* Register Patient Modal */}
      <RegisterPatientModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSuccess={fetchPhcData}
        defaultVillage="Ratibad"
      />

      {/* Stock Update Modal */}
      <Modal
        isOpen={selectedStockForUpdate !== null}
        onClose={() => setSelectedStockForUpdate(null)}
        title={`${t('med_update_stock_btn', 'Update Stock')} — ${selectedStockForUpdate?.medicine_name}`}
        subtitle={`${t('med_quantity', 'Current Quantity')}: ${selectedStockForUpdate?.quantity} ${selectedStockForUpdate?.unit}`}
        maxWidth="sm"
      >
        <form onSubmit={handleStockUpdate} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {language === 'hi' ? 'नई कुल मात्रा' : 'New Total Quantity'} ({selectedStockForUpdate?.unit}) *
            </label>
            <input
              type="number"
              required
              min={0}
              value={newStockQty}
              onChange={(e) => setNewStockQty(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-base font-bold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedStockForUpdate(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={updatingStock}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              {t('save', 'Save Stock Balance')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Referral Status Action Modal (Accept / Schedule Appointment) */}
      <Modal
        isOpen={selectedReferralForAction !== null}
        onClose={() => setSelectedReferralForAction(null)}
        title={`${language === 'hi' ? 'रेफ़रल स्थिति अपडेट करें' : 'Update Referral State'} — ${selectedReferralForAction?.id}`}
        subtitle={`${t('form_patient_name', 'Patient')}: ${selectedReferralForAction?.patient_name} | ${t('form_select_specialty', 'Specialty')}: ${selectedReferralForAction?.specialty_requested}`}
        maxWidth="md"
      >
        <form onSubmit={handleReferralStatusUpdate} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">{t('status', 'Target Status')} *</label>
            <select
              value={referralNewStatus}
              onChange={(e) => setReferralNewStatus(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold text-teal-900"
            >
              <option value="Accepted">{language === 'hi' ? 'स्वीकृत (ट्रायज पुष्ट)' : 'Accepted (Triage Confirmed)'}</option>
              <option value="Appointment Scheduled">{language === 'hi' ? 'अपॉइंटमेंट निर्धारित (ओपीडी स्लॉट आवंटित)' : 'Appointment Scheduled (OPD Slot Assigned)'}</option>
              <option value="In Transit">{language === 'hi' ? 'रास्ते में (108 एम्बुलेंस रवाना)' : 'In Transit (108 Ambulance Dispatched)'}</option>
              <option value="Arrived">{language === 'hi' ? 'गंतव्य अस्पताल में पहुंच गया' : 'Arrived at Destination Facility'}</option>
              <option value="Consultation Completed">{language === 'hi' ? 'परामर्श पूरा हुआ' : 'Consultation Completed'}</option>
              <option value="Treatment Completed">{language === 'hi' ? 'उपचार पूरा हुआ' : 'Treatment Completed'}</option>
            </select>
          </div>

          {referralNewStatus === 'Appointment Scheduled' && (
            <>
              <div>
                <label className="font-bold text-slate-700 block mb-1">{language === 'hi' ? 'निर्धारित डॉक्टर का नाम' : 'Assigned Doctor Name'}</label>
                <input
                  type="text"
                  value={referralDoctorName}
                  onChange={(e) => setReferralDoctorName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{language === 'hi' ? 'अपॉइंटमेंट स्लॉट दिनांक व समय *' : 'Appointment Slot Date & Time *'}</label>
                <input
                  type="datetime-local"
                  required
                  value={referralApptDate}
                  onChange={(e) => setReferralApptDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
            </>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">{language === 'hi' ? 'क्लिनिकल ट्रायज टिप्पणियां' : 'Remarks & Clinical Triage Notes'}</label>
            <textarea
              rows={2}
              value={referralRemarks}
              onChange={(e) => setReferralRemarks(e.target.value)}
              placeholder={language === 'hi' ? 'उदा. चिकित्सा अधिकारी द्वारा केस की समीक्षा की गई। प्राथमिकता की पुष्टि हुई।' : 'e.g. Case reviewed by Medical Officer. Priority triage confirmed.'}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedReferralForAction(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={updatingReferral}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              {updatingReferral ? t('saving', 'Updating...') : `${language === 'hi' ? 'स्थिति बदलें:' : 'Transition to'} ${tStatus(referralNewStatus)}`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Patient Longitudinal Timeline Modal */}
      <Modal
        isOpen={selectedPatientForTimeline !== null}
        onClose={() => setSelectedPatientForTimeline(null)}
        title={`${t('patient_longitudinal_timeline', 'Longitudinal Health Timeline')} — ${selectedPatientForTimeline?.name}`}
        subtitle={`ABHA ID: ${selectedPatientForTimeline?.abha_id || 'Unlinked'} | ${t('asha_village', 'Village')}: ${selectedPatientForTimeline?.village}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {patientTimeline.length === 0 ? (
            <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl">
              {t('patient_no_records', 'No previous clinical encounters recorded.')}
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {patientTimeline.map((rec) => (
                <div key={rec.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{rec.diagnosis || rec.chief_complaint}</span>
                    <span className="text-[10px] text-slate-400">{formatDate(rec.record_date || rec.created_at)}</span>
                  </div>
                  <p className="text-slate-600">{rec.clinical_observations}</p>
                  {rec.vitals && (
                    <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-semibold text-teal-800">
                      {rec.vitals.bp && <span>BP: {rec.vitals.bp}</span>}
                      {rec.vitals.pulse && <span>Pulse: {rec.vitals.pulse}</span>}
                      {rec.vitals.spo2 && <span>SpO2: {rec.vitals.spo2}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setSelectedPatientForTimeline(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              {t('close', 'Close Timeline')}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default PhcDashboard;

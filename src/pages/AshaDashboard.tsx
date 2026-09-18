import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { Patient, FollowUp, Referral, Teleconsultation } from '../types';
import { Sidebar } from '../components/common/Sidebar';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatDate, formatDateTime } from '../utils/formatters';
import { VitalsModal } from '../components/asha/VitalsModal';
import { RegisterPatientModal } from '../components/asha/RegisterPatientModal';
import { PatientProfileModal } from '../components/asha/PatientProfileModal';
import { AshaTeleconModal } from '../components/asha/AshaTeleconModal';
import { AshaReferralModal } from '../components/asha/AshaReferralModal';
import { PatientJourneyMap } from '../components/asha/PatientJourneyMap';
import { MedicineSearch } from '../components/medicine/MedicineSearch';
import { ReferralTrackingEngine } from '../components/referral/ReferralTrackingEngine';
import { ConsultationQueue } from '../components/telecon/ConsultationQueue';
import { Modal } from '../components/common/Modal';
import { 
  UserPlus, 
  Activity, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Users, 
  Building2, 
  Send, 
  AlertTriangle, 
  Menu, 
  Pill, 
  Video,
  Eye,
  Bell,
  ArrowRight,
  Plus
} from 'lucide-react';

export const AshaDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [telecons, setTelecons] = useState<Teleconsultation[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchCategory, setSearchCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [selectedPatientForVitals, setSelectedPatientForVitals] = useState<Patient | null>(null);
  const [selectedPatientForProfile, setSelectedPatientForProfile] = useState<Patient | null>(null);
  const [selectedPatientForTelecon, setSelectedPatientForTelecon] = useState<Patient | null>(null);
  const [selectedPatientForReferral, setSelectedPatientForReferral] = useState<Patient | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [completingFollowUp, setCompletingFollowUp] = useState<FollowUp | null>(null);
  const [followUpNotes, setFollowUpNotes] = useState<string>('');

  const fetchAshaData = async () => {
    setLoading(true);
    try {
      const [pRes, fRes, rRes, tRes] = await Promise.all([
        api.getPatients(),
        api.getFollowUps(),
        api.getReferrals(),
        api.getTeleconsultations()
      ]);

      if (pRes.success) setPatients(pRes.data);
      if (fRes.success) setFollowUps(fRes.data);
      if (rRes.success) setReferrals(rRes.data);
      if (tRes.success) setTelecons(tRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAshaData();
  }, []);

  // Multi-Field Search: Name, Patient ID, Mobile, ABHA ID
  const filteredPatients = patients.filter(p => {
    const q = searchTerm.toLowerCase().trim();
    const cleanAbha = (p.abha_id || '').replace(/-/g, '').toLowerCase();
    const cleanQuery = q.replace(/-/g, '');

    const matchesQuery = !q || (
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.mobile.includes(q) ||
      cleanAbha.includes(cleanQuery) ||
      p.village.toLowerCase().includes(q)
    );

    if (!matchesQuery) return false;

    if (searchCategory === 'anc') {
      return (p.chronic_conditions || []).some(c => c.toLowerCase().includes('anc') || c.toLowerCase().includes('pregnancy') || p.gender === 'Female');
    }
    if (searchCategory === 'ncd') {
      return (p.chronic_conditions || []).some(c => c.toLowerCase().includes('hypertension') || c.toLowerCase().includes('diabetes') || c.toLowerCase().includes('cad'));
    }
    if (searchCategory === 'tb') {
      return (p.chronic_conditions || []).some(c => c.toLowerCase().includes('tb') || c.toLowerCase().includes('pulmonary'));
    }

    return true;
  });

  const handleCompleteFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingFollowUp) return;

    try {
      const res = await api.completeFollowUp(completingFollowUp.id, {
        completion_notes: followUpNotes || (language === 'hi' ? 'गृह भ्रमण पूर्ण हुआ। मरीज़ के वाइटल्स की जांच की गई और दवाओं के सेवन की पुष्टि की गई।' : 'Home visit completed. Checked patient vitals and advised medication adherence.')
      });

      if (res.success) {
        setCompletingFollowUp(null);
        setFollowUpNotes('');
        fetchAshaData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const pendingTasks = followUps.filter(f => f.status === 'Pending');
  const activeReferrals = referrals.filter(r => r.status !== 'Treatment Completed' && r.status !== 'Closed');

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-100px)]">
      
      {/* Mobile Drawer Trigger Bar */}
      <div className="lg:hidden bg-white border-b border-slate-200 p-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all"
        >
          <Menu className="w-4 h-4" />
          <span>{t('asha_desk', 'ASHA Field Menu')}</span>
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

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl pb-24 lg:pb-8">
        
        {/* ========================================================================= */}
        {/* TAB 1: DAILY WORK DESK OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* 1. Welcome & Village Coverage Hero */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-2xl shadow-sm">
                    SA
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Sunita Ahirwar</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t('asha_village', 'Village')}: <strong className="text-teal-900">Barkheda Gram Panchayat</strong> | Block: Phanda | Mapped PHC: <strong>PHC Ratibad</strong>
                    </p>
                  </div>
                </div>

                {/* Primary Fast Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{t('asha_register_patient_btn', '+ Register Citizen')}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('patients')}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-2 transition-all"
                  >
                    <Search className="w-4 h-4 text-teal-600" />
                    <span>{language === 'hi' ? 'मरीज़ खोजें' : 'Search Patients'}</span>
                  </button>
                </div>
              </div>

              {/* Priority Daily Work Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                
                {/* 1. Assigned Patients */}
                <div 
                  onClick={() => setActiveTab('patients')}
                  className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-1 cursor-pointer hover:bg-teal-100/60 transition-all"
                >
                  <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-teal-600" />
                    {t('asha_assigned_patients', 'Assigned Patients')}
                  </span>
                  <div className="text-2xl font-black text-slate-900">{patients.length} {language === 'hi' ? 'नागरिक' : 'Citizens'}</div>
                  <p className="text-slate-600 text-[11px]">{language === 'hi' ? 'बरखेड़ा में 142 परिवार' : '142 Households in Barkheda'}</p>
                </div>

                {/* 2. Today's Visits & Follow-ups */}
                <div 
                  onClick={() => setActiveTab('followups')}
                  className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1 cursor-pointer hover:bg-amber-100/60 transition-all"
                >
                  <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    {t('asha_todays_visits', "Today's Visits Due")}
                  </span>
                  <div className="text-2xl font-black text-amber-900">{pendingTasks.length} {language === 'hi' ? 'यात्राएं' : 'Visits Due'}</div>
                  <p className="text-slate-600 text-[11px]">{language === 'hi' ? 'डिस्चार्ज व मातृ देखभाल' : 'Post-discharge & ANC care'}</p>
                </div>

                {/* 3. Pending Referrals */}
                <div 
                  onClick={() => setActiveTab('referrals')}
                  className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-1 cursor-pointer hover:bg-purple-100/60 transition-all"
                >
                  <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-purple-600" />
                    {t('asha_pending_referrals', 'Active Referrals')}
                  </span>
                  <div className="text-2xl font-black text-purple-900">{referrals.length} {language === 'hi' ? 'प्रक्रियाधीन' : 'In Pipeline'}</div>
                  <p className="text-slate-600 text-[11px]">{language === 'hi' ? '1 रास्ते में (108 एम्बुलेंस)' : '1 In Transit (108 Ambulance)'}</p>
                </div>

                {/* 4. Teleconsultations */}
                <div 
                  onClick={() => setActiveTab('telecon')}
                  className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1 cursor-pointer hover:bg-blue-100/60 transition-all"
                >
                  <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider flex items-center gap-1">
                    <Video className="w-3.5 h-3.5 text-blue-600" />
                    {t('asha_telecons_queued', 'Doctor Teleconsults')}
                  </span>
                  <div className="text-2xl font-black text-blue-900">{telecons.length} {language === 'hi' ? 'निर्धारित' : 'Scheduled'}</div>
                  <p className="text-slate-600 text-[11px]">e-Sanjeevani Video Queue</p>
                </div>

              </div>
            </div>

            {/* 2. Patient Journey Map Continuum */}
            <PatientJourneyMap currentStage={1} patientName={language === 'hi' ? 'बरखेड़ा ग्राम स्वास्थ्य श्रृंखला' : 'Barkheda Gram Care Network'} />

            {/* 3. Today's Field Visits & Doorstep Tasks */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-500" />
                    {language === 'hi' ? `आज के प्राथमिकता वाले गृह भ्रमण (${pendingTasks.length})` : `Today's Priority Doorstep Visits (${pendingTasks.length})`}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'hi' ? 'वाइटल्स जांच और दवाओं की नियमितता हेतु जरूरी गृह भ्रमण' : 'High-priority home visits requiring vitals check and medication compliance'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('followups')}
                  className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1"
                >
                  <span>{t('view_all', 'View All')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {pendingTasks.slice(0, 3).map((task) => (
                  <div 
                    key={task.id}
                    className="p-4 bg-amber-50/40 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{task.patient_name}</span>
                        <StatusBadge status={task.status} />
                        <span className="text-slate-500">{t('form_followup_date', 'Due Date')}: <strong>{formatDate(task.due_date)}</strong></span>
                      </div>
                      <div className="font-semibold text-teal-900">{task.category}</div>
                      <p className="text-slate-600 italic leading-relaxed">{task.instructions}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setCompletingFollowUp(task)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{language === 'hi' ? 'गृह भ्रमण दर्ज करें' : 'Record Home Visit'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Two-Column Grid: Active Referrals & Rural Medicines Stock */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Active Referrals Pipeline */}
              <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-600" />
                    {language === 'hi' ? 'ग्रामीण रेफ़रल प्रक्रिया' : 'Village Referral Pipeline'}
                  </h3>
                  <button
                    onClick={() => setActiveTab('referrals')}
                    className="text-xs font-bold text-teal-700 hover:underline"
                  >
                    {t('view_all', 'All')} ({referrals.length}) →
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  {referrals.slice(0, 2).map((ref) => (
                    <div key={ref.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-700">{ref.id}</span>
                        <StatusBadge status={ref.status} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">{ref.patient_name} — {ref.specialty_requested}</div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          {ref.from_facility_name} ➔ <strong>{ref.to_facility_name}</strong>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Essential Rural Medicine Availability Widget */}
              <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Pill className="w-5 h-5 text-teal-600" />
                    {language === 'hi' ? 'आवश्यक ग्रामीण दवा भंडार' : 'Essential Rural Drug Stock'}
                  </h3>
                  <button
                    onClick={() => setActiveTab('medicines')}
                    className="text-xs font-bold text-teal-700 hover:underline"
                  >
                    {language === 'hi' ? 'फार्मेसी खोजें →' : 'Search Pharmacy →'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-emerald-800">IFA Tablets</span>
                    <div className="font-bold text-slate-900">4,800 Units</div>
                    <span className="text-[10px] text-emerald-700 font-semibold">{language === 'hi' ? 'उपलब्ध (PHC)' : 'In Stock (PHC)'}</span>
                  </div>
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-emerald-800">ORS Packets</span>
                    <div className="font-bold text-slate-900">1,250 Units</div>
                    <span className="text-[10px] text-emerald-700 font-semibold">{language === 'hi' ? 'उपलब्ध (PHC)' : 'In Stock (PHC)'}</span>
                  </div>
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-emerald-800">Paracetamol</span>
                    <div className="font-bold text-slate-900">8,500 Units</div>
                    <span className="text-[10px] text-emerald-700 font-semibold">{language === 'hi' ? 'उपलब्ध (DH)' : 'In Stock (DH)'}</span>
                  </div>
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-emerald-800">Amlodipine 5mg</span>
                    <div className="font-bold text-slate-900">6,200 Units</div>
                    <span className="text-[10px] text-emerald-700 font-semibold">{language === 'hi' ? 'उपलब्ध (PHC)' : 'In Stock (PHC)'}</span>
                  </div>
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-amber-800">Metformin 500</span>
                    <div className="font-bold text-slate-900">420 Units</div>
                    <span className="text-[10px] text-amber-700 font-semibold">{t('med_status_low_stock', 'Low Stock')}</span>
                  </div>
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-emerald-800">Amoxicillin</span>
                    <div className="font-bold text-slate-900">3,400 Units</div>
                    <span className="text-[10px] text-emerald-700 font-semibold">{language === 'hi' ? 'उपलब्ध (PHC)' : 'In Stock (PHC)'}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PATIENT SEARCH & REGISTRY */}
        {/* ========================================================================= */}
        {activeTab === 'patients' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  {t('asha_patient_search_title', 'Village Patient Search & Directory')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'hi' ? 'नाम, मरीज़ आईडी, मोबाइल या 14-अंकों की आभा से ग्रामीण परिवारों को खोजें' : 'Search village citizens by Name, Patient ID, Mobile Number, or 14-digit ABHA ID'}
                </p>
              </div>

              <button
                onClick={() => setShowRegisterModal(true)}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-2 shrink-0 shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t('asha_register_patient_btn', '+ Register New Citizen')}</span>
              </button>
            </div>

            {/* Search Input Bar & Category Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder={t('asha_search_placeholder', 'Search by Name, Mobile, Patient ID, or ABHA...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Filter Chips */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  onClick={() => setSearchCategory('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    searchCategory === 'all'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t('all', 'All')} ({patients.length})
                </button>
                <button
                  onClick={() => setSearchCategory('ncd')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    searchCategory === 'ncd'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {language === 'hi' ? 'गैर-संचारी रोग / बीपी' : 'NCD / Hypertension'}
                </button>
                <button
                  onClick={() => setSearchCategory('anc')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    searchCategory === 'anc'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {language === 'hi' ? 'मातृ स्वास्थ्य (ANC)' : 'Maternal ANC'}
                </button>
                <button
                  onClick={() => setSearchCategory('tb')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    searchCategory === 'tb'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {language === 'hi' ? 'टीबी उपचार' : 'TB Treatment'}
                </button>
              </div>
            </div>

            {/* Patient Cards List */}
            <div className="space-y-3">
              {filteredPatients.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500">
                  {t('no_data', 'No records found')}
                </div>
              ) : (
                filteredPatients.map((p) => (
                  <div 
                    key={p.id}
                    className="p-4 sm:p-5 bg-slate-50/60 hover:bg-white border border-slate-200 hover:border-teal-300 rounded-2xl shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-slate-900">{p.name}</span>
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-mono font-bold rounded text-[10px]">
                          {p.id}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {p.age} {language === 'hi' ? 'वर्ष' : 'Yrs'} / {p.gender}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                        <span>ABHA: <strong className="font-mono text-teal-800">{p.abha_id || 'Unlinked'}</strong></span>
                        <span>•</span>
                        <span>{t('form_patient_mobile', 'Mobile')}: <strong>{p.mobile}</strong></span>
                        <span>•</span>
                        <span>{t('form_patient_village', 'Village')}: {p.village}</span>
                      </div>

                      {p.chronic_conditions && p.chronic_conditions.length > 0 && (
                        <div className="text-[11px] text-teal-800 font-semibold flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-rose-500" />
                          <span>{t('form_patient_conditions', 'Conditions')}: {p.chronic_conditions.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons Toolbar for ASHA */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                      <button
                        onClick={() => setSelectedPatientForVitals(p)}
                        className="px-3 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs transition-all"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>{language === 'hi' ? 'वाइटल्स' : 'Vitals'}</span>
                      </button>

                      <button
                        onClick={() => setSelectedPatientForTelecon(p)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs transition-all"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>{language === 'hi' ? 'टेली-परामर्श' : 'Teleconsult'}</span>
                      </button>

                      <button
                        onClick={() => setSelectedPatientForReferral(p)}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{language === 'hi' ? 'रेफ़र' : 'Refer'}</span>
                      </button>

                      <button
                        onClick={() => setSelectedPatientForProfile(p)}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t('profile', 'Profile')}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: DOORSTEP FOLLOW-UP MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'followups' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  {t('asha_followup_worklist_title', 'Doorstep Follow-Up Visits & Patient Adherence')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'hi' ? 'मातृ स्वास्थ्य, अस्पताल डिस्चार्ज उपरांत व दवाओं के सेवन की गृह जांच' : 'Assigned home visits for high-risk maternal ANC, post-hospital discharge, and chronic medication compliance'}
                </p>
              </div>

              <span className="text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                {pendingTasks.length} {language === 'hi' ? 'लंबित भ्रमण' : 'Visits Pending'}
              </span>
            </div>

            <div className="space-y-3">
              {followUps.map((task) => (
                <div 
                  key={task.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs ${
                    task.status === 'Completed'
                      ? 'bg-slate-50 border-slate-200 text-slate-500 opacity-80'
                      : 'bg-amber-50/30 border-amber-200 text-slate-900 shadow-xs'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-slate-900">{task.patient_name}</span>
                      <StatusBadge status={task.status} />
                      <span className="text-slate-500">{t('form_followup_date', 'Due Date')}: <strong>{formatDate(task.due_date)}</strong></span>
                    </div>
                    <div className="font-bold text-teal-900 text-xs sm:text-sm">{task.category}</div>
                    <p className="text-slate-700 italic leading-relaxed">{task.instructions}</p>
                    {task.completed_at && (
                      <div className="text-[11px] text-emerald-700 font-semibold pt-1">
                        {language === 'hi' ? 'भ्रमण दर्ज किया गया:' : 'Completed on'} {formatDateTime(task.completed_at)}
                      </div>
                    )}
                  </div>

                  {task.status === 'Pending' ? (
                    <button
                      onClick={() => setCompletingFollowUp(task)}
                      className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 shadow-xs transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{language === 'hi' ? 'गृह भ्रमण दर्ज करें' : 'Record Home Visit'}</span>
                    </button>
                  ) : (
                    <div className="text-emerald-700 font-bold flex items-center gap-1 text-xs shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      {language === 'hi' ? 'भ्रमण दर्ज' : 'Visit Recorded'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: VILLAGE REFERRALS DESK */}
        {/* ========================================================================= */}
        {activeTab === 'referrals' && (
          <div className="space-y-5">
            <ReferralTrackingEngine />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: TELECONSULTATION DESK */}
        {/* ========================================================================= */}
        {activeTab === 'telecon' && (
          <div className="space-y-5">
            <ConsultationQueue userRole="asha" />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: CLINICAL RED FLAGS & ALERTS */}
        {/* ========================================================================= */}
        {activeTab === 'alerts' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-rose-500" />
                {t('asha_alerts_title', 'Village Health Alerts & Clinical Red Flags')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'hi' ? 'गंभीर स्वास्थ्य संकेत जिन पर तत्काल आशा कार्यकर्ता के ध्यान या आपातकालीन रेफ़रल की आवश्यकता है' : 'Automated clinical warnings requiring immediate ASHA field attention or emergency escalation'}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    {language === 'hi' ? 'उच्च रक्तचाप जोखिम चेतावनी' : 'High-Risk Hypertension Alert'}
                  </span>
                  <span className="px-2 py-0.5 bg-rose-200 text-rose-900 font-bold rounded text-[10px]">
                    {language === 'hi' ? 'तत्काल' : 'Urgent'}
                  </span>
                </div>
                <p className="text-slate-700">Ramesh Kumar Verma (PAT-001) recorded BP 155/95 mmHg. High cardiac risk.</p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      const p = patients.find(pat => pat.id === 'PAT-001') || patients[0];
                      setSelectedPatientForVitals(p);
                    }}
                    className="px-3 py-1.5 bg-rose-600 text-white font-bold rounded-lg text-[11px]"
                  >
                    {language === 'hi' ? 'घर पर बीपी जांचें' : 'Check Doorstep BP'}
                  </button>
                  <button
                    onClick={() => {
                      const p = patients.find(pat => pat.id === 'PAT-001') || patients[0];
                      setSelectedPatientForTelecon(p);
                    }}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-lg text-[11px]"
                  >
                    {language === 'hi' ? 'डॉक्टर वीडियो कॉल' : 'Doctor Video Call'}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    {language === 'hi' ? 'मातृ स्वास्थ्य (ANC) तीसरी तिमाही जांच' : 'Maternal ANC 3rd Trimester Due'}
                  </span>
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold rounded text-[10px]">
                    {language === 'hi' ? 'फॉलो-अप' : 'Follow-Up'}
                  </span>
                </div>
                <p className="text-slate-700">Meera Bai in Ward 3 due for hemoglobin check and tetanus toxoid booster verification.</p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: PATIENT JOURNEY MAP */}
        {/* ========================================================================= */}
        {activeTab === 'journey' && (
          <div className="space-y-5">
            <PatientJourneyMap currentStage={1} patientName={language === 'hi' ? 'बरखेड़ा ग्राम पंचायत कार्यप्रवाह' : 'Barkheda Gram Panchayat Workflow'} />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: MEDICINES */}
        {/* ========================================================================= */}
        {activeTab === 'medicines' && (
          <div className="space-y-5">
            <MedicineSearch />
          </div>
        )}

      </main>

      {/* Mobile Bottom Quick-Action Tab Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 flex items-center justify-around z-40 shadow-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold ${
            activeTab === 'overview' ? 'text-teal-700' : 'text-slate-500'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>{t('overview', 'Desk')}</span>
        </button>

        <button
          onClick={() => setActiveTab('patients')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold ${
            activeTab === 'patients' ? 'text-teal-700' : 'text-slate-500'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{language === 'hi' ? 'मरीज़' : 'Patients'}</span>
        </button>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="flex flex-col items-center justify-center -mt-5 w-12 h-12 rounded-full bg-teal-600 text-white shadow-lg active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>

        <button
          onClick={() => setActiveTab('followups')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold ${
            activeTab === 'followups' ? 'text-teal-700' : 'text-slate-500'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{language === 'hi' ? 'भ्रमण' : 'Visits'}</span>
        </button>

        <button
          onClick={() => setActiveTab('referrals')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold ${
            activeTab === 'referrals' ? 'text-teal-700' : 'text-slate-500'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{language === 'hi' ? 'रेफ़रल' : 'Referrals'}</span>
        </button>
      </div>

      {/* Doorstep Vitals Modal */}
      <VitalsModal
        isOpen={selectedPatientForVitals !== null}
        onClose={() => setSelectedPatientForVitals(null)}
        patient={selectedPatientForVitals}
        onSuccess={fetchAshaData}
      />

      {/* Register Patient Modal */}
      <RegisterPatientModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSuccess={fetchAshaData}
      />

      {/* Patient Profile Modal */}
      <PatientProfileModal
        isOpen={selectedPatientForProfile !== null}
        onClose={() => setSelectedPatientForProfile(null)}
        patient={selectedPatientForProfile}
        onRecordVitals={(p) => setSelectedPatientForVitals(p)}
        onRequestTelecon={(p) => setSelectedPatientForTelecon(p)}
        onInitiateReferral={(p) => setSelectedPatientForReferral(p)}
      />

      {/* Teleconsultation Request Modal */}
      <AshaTeleconModal
        isOpen={selectedPatientForTelecon !== null}
        onClose={() => setSelectedPatientForTelecon(null)}
        patient={selectedPatientForTelecon}
        onSuccess={fetchAshaData}
      />

      {/* Referral Request Modal */}
      <AshaReferralModal
        isOpen={selectedPatientForReferral !== null}
        onClose={() => setSelectedPatientForReferral(null)}
        patient={selectedPatientForReferral}
        onSuccess={fetchAshaData}
      />

      {/* Complete Follow-Up Modal */}
      <Modal
        isOpen={completingFollowUp !== null}
        onClose={() => setCompletingFollowUp(null)}
        title={`${language === 'hi' ? 'गृह फॉलो-अप भ्रमण दर्ज करें' : 'Record Home Follow-up Visit'} — ${completingFollowUp?.patient_name}`}
        subtitle={`${language === 'hi' ? 'कार्य:' : 'Task:'} ${completingFollowUp?.category}`}
        maxWidth="md"
      >
        <form onSubmit={handleCompleteFollowUp} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {language === 'hi' ? 'फील्ड निरीक्षण व मरीज़ फीडबैक *' : 'Field Observations & Patient Feedback *'}
            </label>
            <textarea
              rows={3}
              required
              placeholder={language === 'hi' ? 'उदा. घर पर जांच की गई। रक्तचाप सामान्य है। मरीज़ नियमित रूप से निर्धारित दवा ले रहा है...' : 'e.g. Conducted doorstep checkup. Blood pressure is normal. Verified patient is taking prescribed tablets daily...'}
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCompletingFollowUp(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{language === 'hi' ? 'कार्य पूर्ण करें' : 'Complete Task'}</span>
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default AshaDashboard;

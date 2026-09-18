import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { Sidebar } from '../components/common/Sidebar';
import { StatusBadge } from '../components/common/StatusBadge';
import { MedicineSearch } from '../components/medicine/MedicineSearch';
import { ReferralTrackingEngine } from '../components/referral/ReferralTrackingEngine';
import { 
  ShieldCheck, 
  Activity, 
  Building2, 
  Users, 
  Pill, 
  Video, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  BarChart3, 
  FileSpreadsheet, 
  MapPin, 
  HeartPulse, 
  Menu,
  Filter,
  Calendar,
  Clock,
  CheckSquare,
  Send,
  RefreshCw,
  Eye,
  AlertCircle,
  HelpCircle,
  Stethoscope,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t, tStatus, tPriority, tRole, tStockStatus, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Operational Filters
  const [dateRange, setDateRange] = useState<string>('all');
  const [selectedBlock, setSelectedBlock] = useState<string>('all');
  const [selectedPhc, setSelectedPhc] = useState<string>('all');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getDistrictAnalytics({
        date_range: dateRange !== 'all' ? dateRange : undefined,
        block: selectedBlock !== 'all' ? selectedBlock : undefined,
        phc_id: selectedPhc !== 'all' ? selectedPhc : undefined,
        village: selectedVillage !== 'all' ? selectedVillage : undefined
      });
      if (res.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, selectedBlock, selectedPhc, selectedVillage]);

  const handleResetFilters = () => {
    setDateRange('all');
    setSelectedBlock('all');
    setSelectedPhc('all');
    setSelectedVillage('all');
  };

  if (loading && !analytics) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-slate-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-semibold">{t('loading', 'Aggregating District Public Health Telemetry...')}</p>
        </div>
      </div>
    );
  }

  const metrics = analytics?.metrics || {
    total_patients: 0,
    active_ashas: 0,
    phcs: 0,
    district_hospitals: 0,
    teleconsultations: 0,
    referrals: 0,
    pending_referrals: 0,
    completed_referrals: 0,
    low_stock_facilities: 0,
    follow_ups_due: 0
  };

  const charts = analytics?.charts || {
    patient_registrations_trend: [],
    teleconsultation_usage: [],
    referral_trend: [],
    phc_wise_referrals: [],
    medicine_stock_status: { available: 0, low_stock: 0, out_of_stock: 0, near_expiry: 0, total_items: 0 },
    facility_workload: []
  };

  const filterOptions = analytics?.filter_options || {
    blocks: ['Berasia', 'Phanda', 'Huzur', 'Kolar'],
    phcs: [],
    villages: []
  };

  // Stock proportions
  const stockData = charts.medicine_stock_status;
  const totalStockItems = stockData.total_items || (stockData.available + stockData.low_stock + stockData.out_of_stock + stockData.near_expiry) || 1;
  const availPct = Math.round((stockData.available / totalStockItems) * 100) || 75;
  const lowPct = Math.round((stockData.low_stock / totalStockItems) * 100) || 15;
  const outPct = Math.round((stockData.out_of_stock / totalStockItems) * 100) || 6;
  const expiryPct = Math.round((stockData.near_expiry / totalStockItems) * 100) || 4;

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-100px)]">
      
      {/* Mobile Drawer Trigger Bar */}
      <div className="lg:hidden bg-white border-b border-slate-200 p-3 flex items-center justify-between">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 p-1.5 rounded-lg bg-slate-100"
        >
          <Menu className="w-4 h-4" />
          <span>{t('admin_desk', 'District CMHO Administration')}</span>
        </button>
        <span className="text-xs font-semibold text-slate-900 capitalize">{activeTab.replace(/_/g, ' ')}</span>
      </div>

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
        
        {/* ========================================================================= */}
        {/* TAB 1: DISTRICT OPERATIONAL EXECUTIVE OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* 1. Action & Status Hero */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-black text-2xl border border-teal-500/30 shadow-inner">
                    CMO
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">
                        {t('admin_command_title', 'DISTRICT HEALTH MISSION COMMAND')}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] font-mono">
                        GOVT OF MP
                      </span>
                    </div>
                    <h1 className="text-xl font-bold text-white leading-tight">
                      Dr. Arvind Shrivastava ({t('admin_cmo_title', 'Chief Medical & Health Officer')})
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t('admin_subtitle', 'District Public Health Surveillance & Operational Capacity Scorecard | District: Bhopal (MP)')}
                    </p>
                  </div>
                </div>

                {/* Primary Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => alert('Exporting Official District Public Health KPI Report (CSV/PDF)...')}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 flex items-center gap-2 transition-all shadow-xs"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-teal-400" />
                    <span>{t('admin_export_report', 'Export District Report')}</span>
                  </button>

                  <button
                    onClick={() => fetchAnalytics()}
                    className="p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs transition-all"
                    title={t('refresh', 'Refresh analytics data')}
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Status Alert Summary Ribbons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">{t('admin_referral_perf', 'Referral Performance')}</span>
                  <div className="font-bold text-white text-sm">
                    {metrics.completed_referrals} / {metrics.referrals} {t('admin_cases_resolved', 'Cases Resolved')}
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    {metrics.referrals > 0 ? Math.round((metrics.completed_referrals / metrics.referrals) * 100) : 0}% Referral resolution rate with verified ASHA counter-referrals
                  </p>
                </div>

                <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">{t('admin_supply_stockouts', 'Supply Chain Stockouts')}</span>
                  <div className="font-bold text-white text-sm">
                    {metrics.low_stock_facilities} {t('admin_facilities_flagged', 'Facilities Flagged')}
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    {stockData.out_of_stock} {t('med_status_out_of_stock', 'Out of stock')} & {stockData.low_stock} {t('med_status_low_stock', 'Low stock')}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">{t('admin_followups_due_card', 'Field Follow-ups Due')}</span>
                  <div className="font-bold text-white text-sm">
                    {metrics.follow_ups_due} {t('admin_active_home_visits', 'Active Home Visits')}
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    {t('dh_mapped_ashas', 'Mapped to village ASHAs')}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Operational Filters Control Bar */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-teal-50 text-teal-700 rounded-lg border border-teal-200">
                    <Filter className="w-4 h-4" />
                  </span>
                  <span className="font-bold text-slate-900 text-xs">
                    {t('admin_filters_title', 'District Operational Telemetry Filters (Real-Time Aggregation)')}
                  </span>
                </div>

                {(dateRange !== 'all' || selectedBlock !== 'all' || selectedPhc !== 'all' || selectedVillage !== 'all') && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-teal-700 hover:underline"
                  >
                    {t('admin_reset_filters', 'Reset All Filters')}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Date Filter */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    {t('admin_filter_date', 'Date Range')}
                  </label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">{t('admin_all_time', 'All Time (Historical)')}</option>
                    <option value="30days">{t('admin_last_30', 'Last 30 Days (Current Month)')}</option>
                    <option value="90days">{t('admin_last_90', 'Last 90 Days (Quarterly)')}</option>
                    <option value="this_year">{t('admin_this_year', 'Financial Year 2026')}</option>
                  </select>
                </div>

                {/* Block Filter */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    {t('admin_filter_block', 'Administrative Block')}
                  </label>
                  <select
                    value={selectedBlock}
                    onChange={(e) => setSelectedBlock(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">{t('admin_all_blocks', 'All Blocks (District Bhopal)')}</option>
                    <option value="Berasia">Berasia Block</option>
                    <option value="Phanda">Phanda Block</option>
                    <option value="Huzur">Huzur Block</option>
                    <option value="Kolar">Kolar Block</option>
                  </select>
                </div>

                {/* PHC Filter */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    {t('admin_filter_phc', 'Primary Health Centre (PHC)')}
                  </label>
                  <select
                    value={selectedPhc}
                    onChange={(e) => setSelectedPhc(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">{t('admin_all_phcs', 'All PHCs')}</option>
                    <option value="FAC-PHC-01">PHC Ratibad</option>
                    <option value="FAC-PHC-02">PHC Berasia</option>
                    <option value="FAC-PHC-03">PHC Phanda</option>
                    <option value="FAC-PHC-04">PHC Kolar</option>
                  </select>
                </div>

                {/* Village Filter */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    {t('admin_filter_village', 'Target Village')}
                  </label>
                  <select
                    value={selectedVillage}
                    onChange={(e) => setSelectedVillage(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">{t('admin_all_villages', 'All Villages')}</option>
                    <option value="Barkheda">Barkheda</option>
                    <option value="Jamuniya">Jamuniya</option>
                    <option value="Pipaliya">Pipaliya</option>
                    <option value="Harrai">Harrai</option>
                    <option value="Sukhi Sewaniya">Sukhi Sewaniya</option>
                    <option value="Ratibad">Ratibad</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. 10 Required Operational Metric / KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              
              {/* 1. Total Patients */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                  <span>{t('admin_kpi_total_patients', 'Total Patients')}</span>
                  <Users className="w-4 h-4 text-teal-600" />
                </span>
                <div className="text-2xl font-black text-slate-900">{metrics.total_patients}</div>
                <span className="text-[10px] text-teal-700 font-bold block">ABDM ABHA Registered</span>
              </div>

              {/* 2. Active ASHA Workers */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                  <span>{t('admin_kpi_active_ashas', 'Active ASHA Workers')}</span>
                  <Activity className="w-4 h-4 text-pink-600" />
                </span>
                <div className="text-2xl font-black text-pink-700">{metrics.active_ashas}</div>
                <span className="text-[10px] text-slate-400 font-medium block">Village Field Force</span>
              </div>

              {/* 3. PHCs */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                  <span>{t('admin_kpi_phcs', 'PHCs (Primary)')}</span>
                  <Building2 className="w-4 h-4 text-blue-600" />
                </span>
                <div className="text-2xl font-black text-blue-700">{metrics.phcs}</div>
                <span className="text-[10px] text-slate-400 font-medium block">Primary Health Centres</span>
              </div>

              {/* 4. District Hospitals */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                  <span>{t('admin_kpi_hospitals', 'District Hospitals')}</span>
                  <Building2 className="w-4 h-4 text-indigo-600" />
                </span>
                <div className="text-2xl font-black text-indigo-700">{metrics.district_hospitals}</div>
                <span className="text-[10px] text-slate-400 font-medium block">Secondary Referral Centres</span>
              </div>

              {/* 5. Teleconsultations */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                  <span>{t('admin_kpi_telecons', 'Teleconsultations')}</span>
                  <Video className="w-4 h-4 text-teal-600" />
                </span>
                <div className="text-2xl font-black text-teal-700">{metrics.teleconsultations}</div>
                <span className="text-[10px] text-teal-700 font-bold block">e-Sanjeevani Sessions</span>
              </div>

              {/* 6. Total Referrals */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                  <span>{t('admin_kpi_referrals', 'Total Referrals')}</span>
                  <Send className="w-4 h-4 text-purple-600" />
                </span>
                <div className="text-2xl font-black text-purple-700">{metrics.referrals}</div>
                <span className="text-[10px] text-slate-400 font-medium block">Inter-Facility Escalations</span>
              </div>

              {/* 7. Pending Referrals */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                  <span>{t('admin_kpi_pending_ref', 'Pending Referrals')}</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </span>
                <div className="text-2xl font-black text-amber-600">{metrics.pending_referrals}</div>
                <span className="text-[10px] text-amber-700 font-bold block">Triage / In Transit</span>
              </div>

              {/* 8. Completed Referrals */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                  <span>{t('admin_kpi_completed_ref', 'Completed Referrals')}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </span>
                <div className="text-2xl font-black text-emerald-700">{metrics.completed_referrals}</div>
                <span className="text-[10px] text-emerald-700 font-bold block">Care Concluded</span>
              </div>

              {/* 9. Low Stock Facilities */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                  <span>{t('admin_kpi_low_stock', 'Low Stock Facilities')}</span>
                  <Pill className="w-4 h-4 text-rose-500" />
                </span>
                <div className="text-2xl font-black text-rose-600">{metrics.low_stock_facilities}</div>
                <span className="text-[10px] text-rose-700 font-bold block">Replenishment Flags</span>
              </div>

              {/* 10. Follow-ups Due */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                  <span>{t('admin_kpi_followups', 'Follow-ups Due')}</span>
                  <CheckSquare className="w-4 h-4 text-cyan-600" />
                </span>
                <div className="text-2xl font-black text-cyan-700">{metrics.follow_ups_due}</div>
                <span className="text-[10px] text-cyan-800 font-bold block">Pending Home Visits</span>
              </div>

            </div>

            {/* 4. Six Visual Aggregated Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* ----------------------------------------------------------------- */}
              {/* CHART 1: Patient Registrations Over Time */}
              {/* ----------------------------------------------------------------- */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-teal-600" />
                      {t('admin_chart1_title', '1. Patient Registrations Over Time (Monthly Intake)')}
                    </h3>
                    <p className="text-[11px] text-slate-500">{t('admin_chart1_desc', 'Citizen onboarding across rural PHCs and ABDM portal')}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-end justify-between h-44 border-b border-slate-200 pb-2 gap-2 sm:gap-3 px-2">
                    {charts.patient_registrations_trend.map((item: any) => {
                      const maxVal = 50;
                      const heightPct = Math.min(100, Math.max(15, (item.count / maxVal) * 100));

                      return (
                        <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5">
                          <div className="w-full flex items-end justify-center h-36">
                            <div 
                              style={{ height: `${heightPct}%` }}
                              className="w-full max-w-[28px] bg-gradient-to-t from-teal-700 to-teal-500 rounded-t-lg relative group transition-all"
                            >
                              <span className="hidden group-hover:block absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-bold text-[10px] px-1.5 py-0.5 rounded shadow-md z-10 whitespace-nowrap">
                                {item.count} {t('role_patient', 'Patients')}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-600">{item.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* CHART 2: Teleconsultation Usage */}
              {/* ----------------------------------------------------------------- */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Video className="w-4 h-4 text-blue-600" />
                      {t('admin_chart2_title', '2. e-Sanjeevani Teleconsultation Usage (Completed vs Total)')}
                    </h3>
                    <p className="text-[11px] text-slate-500">{t('admin_chart2_desc', 'Virtual medical sessions connecting rural ASHAs with doctors')}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-end justify-between h-44 border-b border-slate-200 pb-2 gap-2 sm:gap-3 px-2">
                    {charts.teleconsultation_usage.map((item: any) => {
                      const maxVal = 50;
                      const totalHeight = Math.min(100, Math.max(15, (item.sessions / maxVal) * 100));
                      const compHeight = Math.min(100, Math.max(12, (item.completed / maxVal) * 100));

                      return (
                        <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5">
                          <div className="w-full flex items-end justify-center gap-1 h-36">
                            <div 
                              style={{ height: `${totalHeight}%` }}
                              className="w-full max-w-[14px] bg-slate-300 rounded-t-md relative group transition-all"
                              title={`Total: ${item.sessions}`}
                            />
                            <div 
                              style={{ height: `${compHeight}%` }}
                              className="w-full max-w-[14px] bg-blue-600 rounded-t-md relative group transition-all"
                              title={`Completed: ${item.completed}`}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-600">{item.month}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 mt-2">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-300 rounded"></span> {t('admin_total_queued', 'Total Queued')}</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-600 rounded"></span> {t('admin_completed_prescribed', 'Completed & Prescribed')}</span>
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* CHART 3: Referral Trend */}
              {/* ----------------------------------------------------------------- */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      {t('admin_chart3_title', '3. District Referral Flow & Resolution Trend')}
                    </h3>
                    <p className="text-[11px] text-slate-500">{t('admin_chart3_desc', 'Monthly escalation from Primary Centres to District Hospital')}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-end justify-between h-44 border-b border-slate-200 pb-2 gap-2 sm:gap-3 px-2">
                    {charts.referral_trend.map((item: any) => {
                      const maxVal = 50;
                      const createdHeight = Math.min(100, Math.max(15, (item.created / maxVal) * 100));
                      const compHeight = Math.min(100, Math.max(12, (item.completed / maxVal) * 100));

                      return (
                        <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5">
                          <div className="w-full flex items-end justify-center gap-1 h-36">
                            <div 
                              style={{ height: `${createdHeight}%` }}
                              className="w-full max-w-[14px] bg-purple-400 rounded-t-md relative group transition-all"
                              title={`Created: ${item.created}`}
                            />
                            <div 
                              style={{ height: `${compHeight}%` }}
                              className="w-full max-w-[14px] bg-purple-700 rounded-t-md relative group transition-all"
                              title={`Resolved: ${item.completed}`}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-600">{item.month}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 mt-2">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-purple-400 rounded"></span> {t('admin_referrals_created', 'Referrals Created')}</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-purple-700 rounded"></span> {t('admin_treatment_completed', 'Treatment Completed')}</span>
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* CHART 4: PHC-Wise Outbound Referrals */}
              {/* ----------------------------------------------------------------- */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      {t('admin_chart4_title', '4. PHC-Wise Outbound Referral Breakdown')}
                    </h3>
                    <p className="text-[11px] text-slate-500">{t('admin_chart4_desc', 'Referral generation volume by Primary Health Centre')}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  {charts.phc_wise_referrals.map((phc: any) => (
                    <div key={phc.facility_id} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-900">{phc.facility_name} ({phc.block})</span>
                        <span className="text-purple-700">{phc.total_referrals} {t('referrals', 'Referrals')}</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                        <div 
                          style={{ width: `${Math.min(100, (phc.urgent_count / (phc.total_referrals || 1)) * 100)}%` }}
                          className="bg-rose-500 h-full"
                          title={`Urgent: ${phc.urgent_count}`}
                        />
                        <div 
                          style={{ width: `${Math.min(100, (phc.routine_count / (phc.total_referrals || 1)) * 100)}%` }}
                          className="bg-teal-500 h-full"
                          title={`Routine: ${phc.routine_count}`}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                        <span>{t('referral_priority_urgent', 'Urgent')}: <strong>{phc.urgent_count}</strong></span>
                        <span>{t('referral_priority_routine', 'Routine')}: <strong>{phc.routine_count}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* CHART 5: Medicine Stock Status Aggregate */}
              {/* ----------------------------------------------------------------- */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Pill className="w-4 h-4 text-emerald-600" />
                      {t('admin_chart5_title', '5. District Essential Medicine Stock Status')}
                    </h3>
                    <p className="text-[11px] text-slate-500">{t('admin_chart5_desc', 'Operational inventory breakdown across all health facilities')}</p>
                  </div>
                </div>

                {/* Horizontal Proportion Visualizer */}
                <div className="space-y-3 pt-2">
                  <div className="w-full h-5 rounded-full overflow-hidden flex shadow-inner">
                    <div style={{ width: `${availPct}%` }} className="bg-emerald-500 h-full" title={`Available: ${stockData.available}`} />
                    <div style={{ width: `${lowPct}%` }} className="bg-amber-500 h-full" title={`Low Stock: ${stockData.low_stock}`} />
                    <div style={{ width: `${outPct}%` }} className="bg-rose-500 h-full" title={`Out of Stock: ${stockData.out_of_stock}`} />
                    <div style={{ width: `${expiryPct}%` }} className="bg-purple-500 h-full" title={`Near Expiry: ${stockData.near_expiry}`} />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 block">{t('med_status_available', 'Available')}</span>
                      <div className="text-lg font-black text-emerald-950">{stockData.available}</div>
                      <span className="text-[10px] text-emerald-700">{availPct}% Safe</span>
                    </div>

                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-center">
                      <span className="text-[10px] uppercase font-bold text-amber-800 block">{t('med_status_low_stock', 'Low Stock')}</span>
                      <div className="text-lg font-black text-amber-950">{stockData.low_stock}</div>
                      <span className="text-[10px] text-amber-700">{lowPct}% Flagged</span>
                    </div>

                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-center">
                      <span className="text-[10px] uppercase font-bold text-rose-800 block">{t('med_status_out_of_stock', 'Out of Stock')}</span>
                      <div className="text-lg font-black text-rose-950">{stockData.out_of_stock}</div>
                      <span className="text-[10px] text-rose-700">{outPct}% Critical</span>
                    </div>

                    <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-center">
                      <span className="text-[10px] uppercase font-bold text-purple-800 block">{t('med_status_near_expiry', 'Near Expiry')}</span>
                      <div className="text-lg font-black text-purple-950">{stockData.near_expiry}</div>
                      <span className="text-[10px] text-purple-700">{expiryPct}% Review</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* CHART 6: Facility Workload Scorecard Table */}
              {/* ----------------------------------------------------------------- */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-teal-600" />
                      {t('admin_chart6_title', '6. Facility Workload & Capacity Scorecard')}
                    </h3>
                    <p className="text-[11px] text-slate-500">{t('admin_chart6_desc', 'Bed capacity, active doctors, and patient throughput')}</p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">{t('med_facility', 'Facility')}</th>
                        <th className="p-3">{t('form_patient_block', 'Block')}</th>
                        <th className="p-3">{t('admin_beds', 'Capacity')}</th>
                        <th className="p-3">{t('admin_docs', 'Doctors')}</th>
                        <th className="p-3">{t('referrals', 'Referrals')}</th>
                        <th className="p-3 text-right">{t('admin_occupancy', 'Occupancy')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {charts.facility_workload.map((fac: any) => (
                        <tr key={fac.facility_id} className="hover:bg-slate-50/70">
                          <td className="p-3 font-bold text-slate-900">
                            <div>{fac.name}</div>
                            <span className="text-[10px] text-slate-400 font-normal uppercase">{fac.type}</span>
                          </td>
                          <td className="p-3 text-slate-700">{fac.block}</td>
                          <td className="p-3 font-mono text-slate-700">{fac.bed_capacity} {t('admin_beds', 'Beds')}</td>
                          <td className="p-3 text-slate-700 font-semibold">{fac.active_doctors} {t('admin_docs', 'Docs')}</td>
                          <td className="p-3">
                            <span className="text-purple-700 font-semibold">{fac.outbound_referrals} Out</span>
                            {fac.inbound_referrals > 0 && <span className="text-blue-700 font-semibold ml-1">/ {fac.inbound_referrals} In</span>}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            <span className="px-2 py-0.5 bg-slate-100 rounded-lg">{fac.occupancy_rate}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DISEASE SURVEILLANCE & HOTSPOTS */}
        {/* ========================================================================= */}
        {activeTab === 'surveillance' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-600" />
                {t('admin_surveillance_title', 'District Disease Surveillance & Symptom Cluster Monitoring')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('admin_surveillance_desc', 'Aggregated epidemiological indicators collected from village ASHAs and primary healthcare doctors (Privacy Preserved)')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { condition: "Hypertension & Cardiovascular Risk", cases: 28, risk_level: "High", hotspot_village: "Barkheda", trend: "+12% this month" },
                { condition: "High-Risk Pregnancy (ANC Follow-up)", cases: 14, risk_level: "Medium", hotspot_village: "Barkheda / Phanda", trend: "Stable" },
                { condition: "Presumed Respiratory / TB Symptoms", cases: 9, risk_level: "High", hotspot_village: "Ratibad", trend: "+4 cases flagged" },
                { condition: "Type-2 Diabetes Mellitus", cases: 31, risk_level: "Medium", hotspot_village: "Ratibad Urban", trend: "+6% this month" },
                { condition: "Seasonal Pyrexia & Viral Illness", cases: 42, risk_level: "Routine", hotspot_village: "All Villages", trend: "-8% declining" }
              ].map((d: any, idx: number) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{d.condition}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      d.risk_level === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {d.risk_level} {t('warning', 'Risk')}
                    </span>
                  </div>
                  <p className="text-slate-600">Total Active Cluster Cases: <strong>{d.cases} {t('role_patient', 'Patients')}</strong></p>
                  <p className="text-teal-800">Primary Village Hotspot: <strong>{d.hotspot_village}</strong></p>
                  <p className="text-slate-500 italic">Surveillance Trend: {d.trend}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: REFERRAL FLOW & BOTTLENECKS */}
        {/* ========================================================================= */}
        {activeTab === 'referral_flow' && (
          <div className="space-y-5">
            <ReferralTrackingEngine 
              userRole="admin" 
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: FACILITIES */}
        {/* ========================================================================= */}
        {activeTab === 'facilities' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              {t('admin_facility_scorecard_title', 'District Health Facilities Scorecard')}
            </h2>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">{t('med_facility', 'Facility Name')}</th>
                    <th className="p-3.5">{t('status', 'Type')}</th>
                    <th className="p-3.5">{t('form_patient_block', 'Block')}</th>
                    <th className="p-3.5">{t('admin_beds', 'Bed Capacity')}</th>
                    <th className="p-3.5">{t('admin_docs', 'Doctors')}</th>
                    <th className="p-3.5 text-right">{t('admin_occupancy', 'Occupancy')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {charts.facility_workload.map((fac: any) => (
                    <tr key={fac.facility_id} className="hover:bg-slate-50/70">
                      <td className="p-3.5 font-bold text-slate-900">{fac.name}</td>
                      <td className="p-3.5 text-slate-700 uppercase">{fac.type}</td>
                      <td className="p-3.5 text-slate-700">{fac.block}</td>
                      <td className="p-3.5 text-slate-700 font-mono">{fac.bed_capacity} {t('admin_beds', 'Beds')}</td>
                      <td className="p-3.5 text-slate-700">{fac.active_doctors} {t('admin_docs', 'Doctors')}</td>
                      <td className="p-3.5 text-right font-bold text-slate-900">{fac.occupancy_rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: SUPPLY CHAIN */}
        {/* ========================================================================= */}
        {activeTab === 'supply_chain' && (
          <div className="space-y-5">
            <MedicineSearch />
          </div>
        )}

      </main>

    </div>
  );
};

export default AdminDashboard;

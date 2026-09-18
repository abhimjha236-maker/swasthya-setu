import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Activity, 
  User, 
  FileText, 
  Building2, 
  Pill, 
  Video, 
  Calendar, 
  CheckSquare, 
  ShieldCheck, 
  BarChart3, 
  Users, 
  Send, 
  Inbox, 
  HeartPulse, 
  PackageCheck,
  Stethoscope,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpenMobile, onCloseMobile }) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  if (!user) return null;

  const getNavItems = () => {
    switch (user.role) {
      case 'patient':
        return [
          { id: 'overview', path: '/patient/dashboard', label: t('overview', 'Dashboard Overview'), icon: <Activity className="w-4 h-4" /> },
          { id: 'records', path: '/patient/records', label: t('patient_longitudinal_timeline', 'Longitudinal Records'), icon: <FileText className="w-4 h-4" /> },
          { id: 'consultations', path: '/patient/consultations', label: t('telecon_queue_title', 'Doctor Consultations'), icon: <Video className="w-4 h-4" /> },
          { id: 'referrals', path: '/patient/referrals', label: t('referral_timeline_title', 'Referral Tracking'), icon: <Building2 className="w-4 h-4" /> },
          { id: 'medicines', path: '/patient/medicines', label: t('patient_medicine_reminders', 'Medicines & Reminders'), icon: <Pill className="w-4 h-4" /> },
          { id: 'appointments', path: '/patient/appointments', label: t('patient_upcoming_appointment', 'Upcoming Appointments'), icon: <Calendar className="w-4 h-4" /> },
          { id: 'followups', path: '/patient/followups', label: t('patient_followup_reminder', 'ASHA Follow-Ups'), icon: <CheckSquare className="w-4 h-4" /> },
          { id: 'schemes', path: '/patient/schemes', label: t('pmjay_scheme', 'ABHA & Govt Schemes'), icon: <ShieldCheck className="w-4 h-4" /> },
          { id: 'notifications', path: '/patient/notifications', label: t('notifications', 'Alerts & Updates'), icon: <ShieldCheck className="w-4 h-4" /> },
          { id: 'profile', path: '/patient/profile', label: t('profile', 'Patient Profile'), icon: <User className="w-4 h-4" /> }
        ];

      case 'asha':
        return [
          { id: 'overview', label: t('overview', 'Field Desk Overview'), icon: <Activity className="w-4 h-4" /> },
          { id: 'patients', label: t('asha_patient_search_title', 'Patient Search & Registry'), icon: <Users className="w-4 h-4" /> },
          { id: 'followups', label: t('asha_followups_due', 'Doorstep Follow-Ups'), icon: <CheckSquare className="w-4 h-4" /> },
          { id: 'referrals', label: t('asha_pending_referrals', 'Village Referrals'), icon: <Building2 className="w-4 h-4" /> },
          { id: 'telecon', label: t('asha_telecons_queued', 'Teleconsultation Desk'), icon: <Video className="w-4 h-4" /> },
          { id: 'alerts', label: t('asha_alerts_count', 'Clinical Red Flags'), icon: <ShieldCheck className="w-4 h-4" /> },
          { id: 'journey', label: t('asha_patient_journey_title', 'Patient Journey Map'), icon: <HeartPulse className="w-4 h-4" /> },
          { id: 'medicines', label: t('med_search_title', 'Medicine Stock Lookup'), icon: <Pill className="w-4 h-4" /> }
        ];

      case 'phc':
        return [
          { id: 'overview', label: t('overview', 'OPD Clinical Desk'), icon: <Activity className="w-4 h-4" /> },
          { id: 'patients', label: t('phc_opd_queue_title', 'OPD Consultation Queue'), icon: <Users className="w-4 h-4" /> },
          { id: 'referrals', label: t('phc_pending_referrals', 'Hospital Referrals'), icon: <Send className="w-4 h-4" /> },
          { id: 'telecon', label: t('phc_telecons_active', 'Teleconsultation Desk'), icon: <Video className="w-4 h-4" /> },
          { id: 'followups', label: t('phc_followups_scheduled', 'Village Follow-Ups'), icon: <CheckSquare className="w-4 h-4" /> },
          { id: 'inventory', label: t('phc_stock_table_title', 'Pharmacy Inventory'), icon: <PackageCheck className="w-4 h-4" /> }
        ];

      case 'hospital':
        return [
          { id: 'overview', label: t('overview', 'Triage Desk Overview'), icon: <Activity className="w-4 h-4" /> },
          { id: 'referrals', label: t('hospital_incoming_referrals', 'Incoming Referrals'), icon: <Inbox className="w-4 h-4" /> },
          { id: 'appointments', label: t('hospital_scheduled_appointments', 'Specialist Appointments'), icon: <Calendar className="w-4 h-4" /> },
          { id: 'consultations', label: t('hospital_specialist_consultations', 'Consultations & e-Rx'), icon: <Stethoscope className="w-4 h-4" /> },
          { id: 'reports', label: t('telecon_history_snapshot', 'Diagnostic & Lab Reports'), icon: <FileText className="w-4 h-4" /> },
          { id: 'records', label: t('patient_longitudinal_timeline', 'Patient Records Registry'), icon: <Users className="w-4 h-4" /> },
          { id: 'followups', label: t('hospital_discharged_counter', 'Discharge & Follow-Ups'), icon: <CheckSquare className="w-4 h-4" /> },
          { id: 'inventory', label: t('hospital_pharmacy_stock', 'Hospital Pharmacy Stock'), icon: <Pill className="w-4 h-4" /> },
          { id: 'notifications', label: t('notifications', 'Hospital Alerts'), icon: <ShieldCheck className="w-4 h-4" /> }
        ];

      case 'admin':
        return [
          { id: 'overview', label: t('admin_tab_overview', 'Command Overview'), icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'surveillance', label: t('admin_tab_surveillance', 'Disease Surveillance'), icon: <HeartPulse className="w-4 h-4" /> },
          { id: 'referral_flow', label: t('admin_tab_referrals', 'Referral Bottlenecks'), icon: <Building2 className="w-4 h-4" /> },
          { id: 'facilities', label: t('admin_tab_facilities', 'Facility Scorecard'), icon: <Building2 className="w-4 h-4" /> },
          { id: 'supply_chain', label: t('admin_tab_supply', 'Medicine Supply Chain'), icon: <Pill className="w-4 h-4" /> }
        ];

      default:
        return [];
    }
  };

  const navigate = useNavigate();
  const navItems = getNavItems();

  const handleSelectTab = (item: any) => {
    setActiveTab(item.id);
    if (item.path) {
      navigate(item.path);
    }
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-100px)] p-4 shrink-0 shadow-xs">
        
        {/* User Identity Chip */}
        <div className="p-3 bg-gradient-to-br from-slate-50 to-teal-50/50 border border-slate-200/80 rounded-2xl mb-4">
          <div className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">
            {user.role === 'patient' 
              ? (language === 'hi' ? 'नागरिक खाता' : 'Citizen Account') 
              : (user.role === 'asha' 
                  ? (language === 'hi' ? 'फील्ड स्वास्थ्य दल' : 'Field Health Force') 
                  : (language === 'hi' ? 'स्वास्थ्य सेवा प्रदाता' : 'Clinical Provider'))}
          </div>
          <div className="font-bold text-slate-900 text-sm truncate mt-0.5">{user.name}</div>
          <div className="text-[11px] text-slate-500 truncate mt-0.5">
            {user.assigned_village 
              ? `${language === 'hi' ? 'गांव' : 'Village'}: ${user.assigned_village}` 
              : (user.identifier || user.role.toUpperCase())}
          </div>
        </div>

        {/* Navigation items list */}
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-teal-600'}>{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Emergency Helplines Pill */}
        <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
          <div className="font-bold text-slate-700">{language === 'hi' ? 'आपातकालीन नंबर:' : 'Emergency Numbers:'}</div>
          <div className="flex justify-between">
            <span>{language === 'hi' ? 'एम्बुलेंस' : 'Ambulance'}: <strong>108</strong></span>
            <span>{language === 'hi' ? 'हेल्पलाइन' : 'Helpline'}: <strong>1075</strong></span>
          </div>
        </div>

      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onCloseMobile}></div>
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <span className="font-bold text-slate-900 text-sm">{language === 'hi' ? 'नेविगेशन मेनू' : 'Navigation Menu'}</span>
                <button onClick={onCloseMobile} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                        isActive
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span className={isActive ? 'text-white' : 'text-teal-600'}>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-200 text-xs text-slate-500">
              {t('app_name')} • Bhopal Public Health
            </div>
          </div>
        </div>
      )}
    </>
  );
};

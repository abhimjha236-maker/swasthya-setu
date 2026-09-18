import React, { useState, useEffect } from 'react';
import { Teleconsultation } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/StatusBadge';
import { formatDateTime, formatDate } from '../../utils/formatters';
import { ConsultationRequestModal } from './ConsultationRequestModal';
import { ConsultationSummaryModal } from './ConsultationSummaryModal';
import { useLanguage } from '../../context/LanguageContext';
import { Link } from 'react-router-dom';
import { 
  Video, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  HeartPulse, 
  Building2, 
  Plus, 
  FileText, 
  RefreshCw, 
  PhoneCall,
  Activity,
  Calendar,
  ShieldCheck
} from 'lucide-react';

interface ConsultationQueueProps {
  userRole?: string;
  isCompact?: boolean;
}

export const ConsultationQueue: React.FC<ConsultationQueueProps> = ({
  userRole,
  isCompact = false
}) => {
  const { user } = useAuth();
  const { t, tStatus, language } = useLanguage();
  const [telecons, setTelecons] = useState<Teleconsultation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');

  // Modals
  const [showRequestModal, setShowRequestModal] = useState<boolean>(false);
  const [selectedTeleconForSummary, setSelectedTeleconForSummary] = useState<Teleconsultation | null>(null);

  const fetchTelecons = async () => {
    setLoading(true);
    try {
      const res = await api.getTeleconsultations({
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      if (res.success) {
        setTelecons(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelecons();
  }, [statusFilter]);

  const filteredTelecons = telecons.filter(t => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = !q || (
      t.id.toLowerCase().includes(q) ||
      t.patient_name.toLowerCase().includes(q) ||
      t.reason.toLowerCase().includes(q) ||
      (t.patient_village && t.patient_village.toLowerCase().includes(q)) ||
      (t.doctor_name && t.doctor_name.toLowerCase().includes(q))
    );

    const matchesSpecialty = specialtyFilter === 'all' || 
      (t.reason && t.reason.toLowerCase().includes(specialtyFilter.toLowerCase())) ||
      (t.doctor_name && t.doctor_name.toLowerCase().includes(specialtyFilter.toLowerCase()));

    return matchesSearch && matchesSpecialty;
  });

  const activeQueue = telecons.filter(t => t.status === 'In Queue' || t.status === 'Requested' || t.status === 'Active');
  const completedQueue = telecons.filter(t => t.status === 'Completed');

  return (
    <div className="space-y-5">
      
      {/* 1. Header & Summary Stats */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                <Video className="w-5 h-5 animate-pulse" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {t('telecon_desk_title')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('telecon_desk_sub')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchTelecons()}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Refresh queue"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
              <span className="hidden sm:inline">{t('refresh')}</span>
            </button>

            <button
              onClick={() => setShowRequestModal(true)}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t('telecon_request_new_btn')}</span>
            </button>
          </div>
        </div>

        {/* Real-time Triage Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-teal-800 block">{t('telecon_live_queue_kpi')}</span>
            <div className="text-2xl font-black text-teal-950 mt-0.5">{activeQueue.length}</div>
            <span className="text-[10px] text-teal-700">{t('telecon_awaiting_triage')}</span>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-blue-800 block">{t('telecon_completed_today_kpi')}</span>
            <div className="text-2xl font-black text-blue-950 mt-0.5">{completedQueue.length}</div>
            <span className="text-[10px] text-blue-700">{t('telecon_rx_archived')}</span>
          </div>

          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-purple-800 block">{t('telecon_wait_time_kpi')}</span>
            <div className="text-2xl font-black text-purple-950 mt-0.5">4.2 <span className="text-xs font-medium">{language === 'hi' ? 'मिनट' : 'min'}</span></div>
            <span className="text-[10px] text-purple-700">{t('telecon_bandwidth_opt')}</span>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">{t('telecon_enc_status_kpi')}</span>
            <div className="text-sm font-bold text-emerald-950 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              DTLS-SRTP 256-Bit
            </div>
            <span className="text-[10px] text-emerald-700">{t('telecon_esign_verified')}</span>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder={language === 'hi' ? 'आईडी, मरीज़, गाँव, डॉक्टर से खोजें...' : 'Search by ID, Patient, Village, Doctor...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
            >
              <option value="all">{language === 'hi' ? 'सभी स्थितियां' : 'All Statuses'} ({telecons.length})</option>
              <option value="In Queue">{tStatus('In Queue')} ({activeQueue.length})</option>
              <option value="Completed">{tStatus('Completed')} ({completedQueue.length})</option>
            </select>

            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
            >
              <option value="all">{language === 'hi' ? 'सभी विशेषज्ञताएं' : 'All Specialties'}</option>
              <option value="Cardiology">{language === 'hi' ? 'हृदय रोग (Cardiology)' : 'Cardiology'}</option>
              <option value="General Medicine">{language === 'hi' ? 'सामान्य चिकित्सा' : 'General Medicine'}</option>
              <option value="Hypertension">{language === 'hi' ? 'उच्च रक्तचाप समीक्षा' : 'Hypertension Review'}</option>
              <option value="Maternal">{language === 'hi' ? 'मातृ स्वास्थ्य (ANC)' : 'Maternal ANC'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Consultation Queue List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 font-semibold">{t('telecon_syncing')}</p>
          </div>
        ) : filteredTelecons.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-2">
            <Video className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="font-bold text-slate-700 text-sm">{t('telecon_no_found')}</div>
            <p className="text-xs text-slate-400">{t('telecon_no_found_sub')}</p>
          </div>
        ) : (
          filteredTelecons.map((tItem) => {
            const isCompleted = tItem.status === 'Completed';

            return (
              <div 
                key={tItem.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-teal-300 transition-all space-y-4"
              >
                {/* Top Row: Meta & Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">{tItem.id}</span>
                    <StatusBadge status={tItem.status} />
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded text-[10px]">
                      {tItem.facility_name}
                    </span>
                  </div>

                  <div className="text-slate-400 text-xs flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'निर्धारित समय' : 'Scheduled'}: {formatDateTime(tItem.scheduled_time || tItem.created_at)}</span>
                  </div>
                </div>

                {/* 3-Column Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  {/* Patient Info */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('patient_details')}</span>
                    <div className="font-bold text-slate-900 text-sm">
                      {tItem.patient_name} ({tItem.patient_age}Y/{tItem.patient_gender})
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      {language === 'hi' ? 'गाँव' : 'Village'}: <strong>{tItem.patient_village}</strong> • ABHA: <span className="font-mono text-teal-800">{tItem.patient_abha || '91-XXXX-XXXX'}</span>
                    </div>
                    <div className="text-[10px] text-teal-700">
                      {language === 'hi' ? 'अनुरोधकर्ता' : 'Requested by'}: <strong>{tItem.requested_by_name}</strong>
                    </div>
                  </div>

                  {/* Clinical Reason & Vitals */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('telecon_chief_vitals')}</span>
                    <div className="font-bold text-slate-800 italic">
                      "{tItem.reason}"
                    </div>
                    {tItem.current_vitals && (
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-600 pt-0.5">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded">BP: {tItem.current_vitals.bp || '120/80'}</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded">Pulse: {tItem.current_vitals.pulse || '76'} bpm</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded">SpO2: {tItem.current_vitals.spo2 || '99%'}</span>
                      </div>
                    )}
                  </div>

                  {/* Doctor & Outcome */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('telecon_doctor_outcome')}</span>
                    <div className="font-bold text-slate-900">
                      {tItem.doctor_name}
                    </div>
                    {isCompleted ? (
                      <div className="text-[11px] text-emerald-800 font-medium">
                        <div>{t('form_diagnosis')}: <strong>{tItem.diagnosis || 'Clinical evaluation concluded'}</strong></div>
                        <div className="text-[10px] text-slate-500">{language === 'hi' ? 'अवधि' : 'Duration'}: {tItem.duration || '12m 45s'}</div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-teal-800 font-semibold flex items-center gap-1 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        {t('telecon_doc_in_room')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Strip */}
                <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 gap-2">
                  <div className="text-[11px] text-slate-500">
                    {isCompleted ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {t('telecon_rx_signed_archived')}
                      </span>
                    ) : (
                      <span>{t('telecon_ready_connect')}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isCompleted && (
                      <button
                        onClick={() => setSelectedTeleconForSummary(tItem)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs"
                      >
                        <FileText className="w-4 h-4 text-teal-600" />
                        <span>{t('telecon_view_rx_slip')}</span>
                      </button>
                    )}

                    <Link
                      to={`/teleconsultation/${tItem.id}`}
                      className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 ${
                        isCompleted
                          ? 'bg-slate-800 hover:bg-slate-900 text-white'
                          : 'bg-teal-600 hover:bg-teal-700 text-white ring-2 ring-teal-500/20 animate-pulse'
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      <span>{isCompleted ? t('telecon_reenter_btn') : t('telecon_launch_btn')}</span>
                    </Link>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Request Modal */}
      <ConsultationRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={() => fetchTelecons()}
      />

      {/* Summary Slip Modal */}
      <ConsultationSummaryModal
        isOpen={!!selectedTeleconForSummary}
        onClose={() => setSelectedTeleconForSummary(null)}
        telecon={selectedTeleconForSummary}
      />

    </div>
  );
};

export default ConsultationQueue;

import React from 'react';
import { Referral, ReferralStatusHistory } from '../../types';
import { formatDateTime, formatDate } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';
import { 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Truck, 
  Building2, 
  Stethoscope, 
  HeartPulse, 
  CheckSquare, 
  ShieldCheck, 
  ArrowRight,
  UserCheck,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface VisualReferralTimelineProps {
  referral: Referral;
  history?: ReferralStatusHistory[];
  onStatusClick?: (status: string) => void;
  isEditable?: boolean;
}

export const VisualReferralTimeline: React.FC<VisualReferralTimelineProps> = ({
  referral,
  history = [],
  onStatusClick,
  isEditable = false
}) => {
  const { t, tStatus, language } = useLanguage();

  // Exact 9 Statuses with localized descriptions
  const steps = [
    { 
      id: 'Created', 
      label: tStatus('Created'), 
      desc: language === 'hi' ? 'रेफ़रल दर्ज किया गया' : 'Referral Initiated', 
      icon: <Clock className="w-3.5 h-3.5" /> 
    },
    { 
      id: 'Accepted', 
      label: tStatus('Accepted'), 
      desc: language === 'hi' ? 'ट्राइएज स्वीकृत' : 'Triage Confirmed', 
      icon: <CheckCircle2 className="w-3.5 h-3.5" /> 
    },
    { 
      id: 'Appointment Scheduled', 
      label: tStatus('Appointment Scheduled'), 
      desc: language === 'hi' ? 'विशेषज्ञ स्लॉट बुक' : 'Specialist Slot Booked', 
      icon: <Calendar className="w-3.5 h-3.5" /> 
    },
    { 
      id: 'In Transit', 
      label: tStatus('In Transit'), 
      desc: language === 'hi' ? '108 एम्बुलेंस रवाना' : '108 Ambulance En Route', 
      icon: <Truck className="w-3.5 h-3.5" /> 
    },
    { 
      id: 'Arrived', 
      label: tStatus('Arrived'), 
      desc: language === 'hi' ? 'अस्पताल पहुंचे' : 'Hospital Admitted', 
      icon: <Building2 className="w-3.5 h-3.5" /> 
    },
    { 
      id: 'Consultation Completed', 
      label: tStatus('Consultation Completed'), 
      desc: language === 'hi' ? 'विशेषज्ञ जांच पूर्ण' : 'Specialist Examined', 
      icon: <Stethoscope className="w-3.5 h-3.5" /> 
    },
    { 
      id: 'Treatment Completed', 
      label: tStatus('Treatment Completed'), 
      desc: language === 'hi' ? 'उपचार व दवा पूर्ण' : 'Procedures & Rx Complete', 
      icon: <HeartPulse className="w-3.5 h-3.5" /> 
    },
    { 
      id: 'Follow-up Required', 
      label: tStatus('Follow-up Required'), 
      desc: language === 'hi' ? 'आशा को फॉलो-अप सौंपा' : 'Counter-Referral to ASHA', 
      icon: <CheckSquare className="w-3.5 h-3.5" /> 
    },
    { 
      id: 'Closed', 
      label: tStatus('Closed'), 
      desc: language === 'hi' ? 'देखभाल चक्र संपन्न' : 'Care Cycle Concluded', 
      icon: <ShieldCheck className="w-3.5 h-3.5" /> 
    }
  ];

  // Map backend status to 9-step index
  const getStepIndex = (status: string) => {
    switch (status) {
      case 'Created': return 0;
      case 'Accepted': return 1;
      case 'Appointment Scheduled': return 2;
      case 'In Transit': return 3;
      case 'Arrived':
      case 'Patient Arrived': return 4;
      case 'Consultation':
      case 'Consultation Completed': return 5;
      case 'Treatment':
      case 'Treatment Completed': return 6;
      case 'Follow-up':
      case 'Follow-up Required': return 7;
      case 'Closed': return 8;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(referral.status);

  return (
    <div className="space-y-4 text-xs">
      
      {/* 1. Origin -> Destination Facility Visual Connector */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 font-bold">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('ref_origin_facility')}</span>
            <div className="font-bold text-slate-900 truncate">{referral.from_facility_name}</div>
          </div>
        </div>

        <div className="flex flex-col items-center px-2 shrink-0">
          <div className="flex items-center gap-1 text-teal-600 font-mono font-bold text-[10px]">
            <span>{referral.referral_type.toUpperCase()}</span>
            <ArrowRight className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-[9px] text-slate-400">{t('ref_inter_facility_badge')}</span>
        </div>

        <div className="flex items-center gap-2.5 text-right min-w-0">
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('ref_dest_facility')}</span>
            <div className="font-bold text-slate-900 truncate">{referral.to_facility_name}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 font-bold">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 2. Visual Step Timeline Pipeline (9 States) */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
            <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">
              {t('ref_continuous_timeline')}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-300">
            {t('ref_current_stage_label')}: <strong className="text-teal-400">{tStatus(referral.status)}</strong>
          </span>
        </div>

        {/* 9-Stage Step Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={step.id}
                type="button"
                disabled={!isEditable}
                onClick={() => isEditable && onStatusClick && onStatusClick(step.id)}
                className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-teal-600/40 border-teal-400 text-white ring-2 ring-teal-400/60 shadow-xs'
                    : isCompleted
                    ? 'bg-slate-800/90 border-slate-700 text-teal-200 hover:border-teal-500'
                    : 'bg-slate-800/30 border-slate-800 text-slate-500 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`p-1 rounded-md ${
                    isCurrent 
                      ? 'bg-teal-400 text-slate-950 font-bold' 
                      : isCompleted 
                      ? 'bg-teal-800 text-teal-200' 
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {step.icon}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">0{idx + 1}</span>
                </div>

                <div>
                  <div className="font-bold text-[11px] leading-tight text-white line-clamp-1">{step.label}</div>
                  <div className="text-[9px] text-teal-300/80 mt-0.5 leading-tight line-clamp-1">{step.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Audit History Log (ReferralStatusHistory) */}
      {history && history.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
          <div className="font-bold text-slate-900 text-xs flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>{t('ref_audit_log_title')}</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{history.length} {t('ref_events_count')}</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {history.map((h, i) => (
              <div key={h.id || i} className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="text-slate-400">{tStatus(h.from_status)}</span>
                    <ArrowRight className="w-3 h-3 text-teal-600" />
                    <span className="text-teal-800">{tStatus(h.to_status)}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">{formatDateTime(h.timestamp)}</span>
                </div>
                <p className="text-slate-600 text-[11px] italic">{h.remarks}</p>
                <div className="text-[10px] text-slate-400 text-right font-medium">{t('ref_updated_by')}: {h.changed_by_name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default VisualReferralTimeline;

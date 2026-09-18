import React from 'react';
import { Referral, ReferralStatusHistory } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';
import { 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Truck, 
  Stethoscope, 
  HeartPulse, 
  CheckSquare, 
  ShieldCheck, 
  ChevronRight,
  ArrowRight
} from 'lucide-react';

interface InteractiveReferralTimelineProps {
  referral: Referral;
  history?: ReferralStatusHistory[];
  onStatusClick?: (status: string) => void;
  isEditable?: boolean;
}

export const InteractiveReferralTimeline: React.FC<InteractiveReferralTimelineProps> = ({
  referral,
  history = [],
  onStatusClick,
  isEditable = true
}) => {
  const { t, tStatus } = useLanguage();

  const steps = [
    { id: 'Created', label: tStatus('Created'), desc: t('referral_status_created', 'Initiated at PHC'), icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'Accepted', label: tStatus('Accepted'), desc: t('referral_status_accepted', 'Triage Confirmed'), icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    { id: 'Appointment Scheduled', label: tStatus('Appointment Scheduled'), desc: t('referral_status_scheduled', 'Specialist Slot Assigned'), icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'Patient Arrived', label: tStatus('Patient Arrived'), desc: t('referral_status_arrived', 'Hospital Entry / 108 In'), icon: <Truck className="w-3.5 h-3.5" /> },
    { id: 'Consultation', label: tStatus('Consultation'), desc: t('referral_status_consulted', 'Specialist Examined'), icon: <Stethoscope className="w-3.5 h-3.5" /> },
    { id: 'Treatment', label: tStatus('Treatment'), desc: t('referral_status_treated', 'Diagnostics & Therapy'), icon: <HeartPulse className="w-3.5 h-3.5" /> },
    { id: 'Follow-up', label: tStatus('Follow-up Required'), desc: t('referral_status_followup', 'Village ASHA Assigned'), icon: <CheckSquare className="w-3.5 h-3.5" /> },
    { id: 'Closed', label: tStatus('Closed'), desc: t('referral_status_closed', 'Care Cycle Concluded'), icon: <ShieldCheck className="w-3.5 h-3.5" /> }
  ];

  // Map backend status to step index
  const getStepIndex = (status: string) => {
    switch (status) {
      case 'Created': return 0;
      case 'Accepted': return 1;
      case 'Appointment Scheduled': return 2;
      case 'In Transit':
      case 'Arrived':
      case 'Patient Arrived': return 3;
      case 'Consultation':
      case 'Consultation Completed': return 4;
      case 'Treatment':
      case 'Treatment Completed': return 5;
      case 'Follow-up':
      case 'Follow-up Required': return 6;
      case 'Closed': return 7;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(referral.status);

  return (
    <div className="space-y-4 text-xs">
      
      {/* Visual Step Pipeline Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">
            {t('ref_lifecycle_title', 'REFERRAL LIFECYCLE & STATE MACHINE')}
          </span>
          <span className="text-[11px] font-mono font-bold text-slate-300">
            {t('ref_current_status', 'Current')}: <strong className="text-teal-400">{tStatus(referral.status)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={step.id}
                type="button"
                disabled={!isEditable}
                onClick={() => isEditable && onStatusClick && onStatusClick(step.id)}
                className={`p-2 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-teal-600/40 border-teal-400 text-white ring-2 ring-teal-400/60 shadow-xs'
                    : isCompleted
                    ? 'bg-slate-800/80 border-slate-700 text-teal-200 hover:border-teal-500'
                    : 'bg-slate-800/30 border-slate-800/80 text-slate-500 opacity-60 hover:opacity-90'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`p-1 rounded-md ${isCurrent ? 'bg-teal-400 text-slate-950 font-bold' : isCompleted ? 'bg-teal-800 text-teal-200' : 'bg-slate-700 text-slate-400'}`}>
                    {step.icon}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">0{idx + 1}</span>
                </div>

                <div>
                  <div className="font-bold text-[11px] leading-tight text-white">{step.label}</div>
                  <div className="text-[9px] text-teal-300/80 mt-0.5 leading-tight truncate">{step.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Audit Trail History (ReferralStatusHistory) */}
      {history.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
          <div className="font-bold text-slate-900 text-xs flex items-center justify-between border-b border-slate-200 pb-2">
            <span>{t('ref_status_history_title', 'Verified Status Transition Audit History (ReferralStatusHistory)')}</span>
            <span className="text-[10px] text-slate-400">{history.length} {t('actions', 'Events')}</span>
          </div>

          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
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
                <div className="text-[10px] text-slate-400 text-right font-medium">By: {h.changed_by_name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default InteractiveReferralTimeline;

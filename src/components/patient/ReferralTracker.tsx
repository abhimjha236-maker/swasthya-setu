import React, { useState } from 'react';
import { Referral } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { VisualReferralTimeline } from '../referral/VisualReferralTimeline';
import { Modal } from '../common/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { Eye } from 'lucide-react';

interface ReferralTrackerProps {
  referral: Referral;
  onUpdateStatus?: (status: string) => void;
  canUpdate?: boolean;
}

export const ReferralTracker: React.FC<ReferralTrackerProps> = ({ referral }) => {
  const [showTimelineModal, setShowTimelineModal] = useState<boolean>(false);
  const { t, language } = useLanguage();

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-teal-300 transition-all space-y-4">
      {/* Top Banner */}
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-bold text-slate-900 text-sm">{referral.id}</span>
            <StatusBadge status={referral.status} />
            <StatusBadge status={referral.referral_type.toUpperCase()} isPriority={true} />
          </div>
          <h4 className="text-sm font-bold text-teal-950 mt-1">{referral.specialty_requested}</h4>
        </div>

        <div className="text-right text-xs text-slate-500">
          <div>{language === 'hi' ? 'आरंभ किया गया' : 'Initiated'}: {formatDate(referral.created_at)}</div>
          {referral.appointment_date && (
            <div className="text-blue-800 font-bold mt-0.5">
              {language === 'hi' ? 'स्लॉट' : 'Slot'}: {formatDateTime(referral.appointment_date)}
            </div>
          )}
        </div>
      </div>

      {/* Visual Timeline (9 Stages) */}
      <VisualReferralTimeline 
        referral={referral}
        isEditable={false}
      />

      {/* Clinical Notes & Counter-Referral */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="text-slate-600 truncate max-w-lg">
          <strong>{t('referral_reason', 'Clinical Reason')}:</strong> <span className="italic">{referral.reason}</span>
        </div>

        <button
          onClick={() => setShowTimelineModal(true)}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 self-end sm:self-auto"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{language === 'hi' ? 'संपूर्ण ऑडिट लॉग' : 'Full Audit Log'}</span>
        </button>
      </div>

      {/* Modal with Full Audit History */}
      <Modal
        isOpen={showTimelineModal}
        onClose={() => setShowTimelineModal(false)}
        title={`${language === 'hi' ? 'रेफ़रल ऑडिट ट्रेल' : 'Referral Audit Trail'} — #${referral.id}`}
        subtitle={`${t('form_patient_name', 'Patient')}: ${referral.patient_name} | ${referral.from_facility_name} ➔ ${referral.to_facility_name}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <VisualReferralTimeline 
            referral={referral}
            history={referral.history || []}
            isEditable={false}
          />

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="font-bold text-slate-900">{t('referral_reason', 'Referral Summary')}</div>
            <p className="text-slate-700 italic">{referral.reason}</p>
            {referral.counter_referral_notes && (
              <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-950 font-medium">
                <strong>{language === 'hi' ? 'काउंटर-रेफ़रल निर्देश:' : 'Counter-Referral Instructions:'}</strong> {referral.counter_referral_notes}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setShowTimelineModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              {t('close', 'Close')}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default ReferralTracker;

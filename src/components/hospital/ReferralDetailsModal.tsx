import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Referral, ReferralStatusHistory } from '../../types';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../common/StatusBadge';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { InteractiveReferralTimeline } from './InteractiveReferralTimeline';
import { 
  Building2, 
  Calendar, 
  User, 
  Activity, 
  CheckCircle2, 
  Clock, 
  Send, 
  FileText, 
  HeartHandshake,
  AlertCircle
} from 'lucide-react';

interface ReferralDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  referral: Referral | null;
  onSuccess?: () => void;
  onOpenConsultation?: (referral: Referral) => void;
}

export const ReferralDetailsModal: React.FC<ReferralDetailsModalProps> = ({
  isOpen,
  onClose,
  referral,
  onSuccess,
  onOpenConsultation
}) => {
  const { t, tStatus, tPriority } = useLanguage();
  const [history, setHistory] = useState<ReferralStatusHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusRemarks, setStatusRemarks] = useState<string>('');
  const [doctorName, setDoctorName] = useState<string>('Dr. Rajeshwari Sen (Chief Cardiologist)');
  const [appointmentSlot, setAppointmentSlot] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReferralHistory = async (id: string) => {
    setLoadingHistory(true);
    try {
      const res = await api.getReferral(id);
      if (res.success && res.data?.history) {
        setHistory(res.data.history);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (referral && isOpen) {
      setNewStatus(referral.status);
      fetchReferralHistory(referral.id);
    }
  }, [referral, isOpen]);

  if (!referral) return null;

  const handleUpdateStatus = async (targetStatus?: string) => {
    const statusToApply = targetStatus || newStatus;
    if (!statusToApply) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.updateReferralStatus(referral.id, {
        status: statusToApply,
        assigned_doctor_name: doctorName,
        appointment_date: appointmentSlot || referral.appointment_date || undefined,
        remarks: statusRemarks || `Status transitioned to ${statusToApply} by Hospital Triage Desk.`
      });

      if (res.success) {
        setStatusRemarks('');
        fetchReferralHistory(referral.id);
        if (onSuccess) onSuccess();
      } else {
        setError(res.message || 'Failed to update status');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('ref_dossier_title', 'Referral Dossier')} — #${referral.id}`}
      subtitle={`${t('ref_origin_facility', 'Source')}: ${referral.from_facility_name} ➔ ${referral.to_facility_name}`}
      maxWidth="2xl"
    >
      <div className="space-y-5 text-xs">
        
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
            {error}
          </div>
        )}

        {/* 7 Required Summary Metrics Card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-slate-900">{referral.id}</span>
              <StatusBadge status={referral.status} />
              <StatusBadge status={referral.referral_type.toUpperCase()} isPriority={true} />
            </div>
            <span className="text-slate-500 font-medium">{t('date', 'Initiated on')} {formatDate(referral.created_at)}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">{t('role_patient', 'Patient')}</span>
              <div className="font-bold text-slate-900 mt-0.5">{referral.patient_name}</div>
              <div className="text-[11px] text-slate-500">{referral.patient_age}Y ({referral.patient_gender}) • {referral.patient_village}</div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">{t('referral_source', 'Source PHC')}</span>
              <div className="font-bold text-slate-900 mt-0.5">{referral.from_facility_name}</div>
              <div className="text-[11px] text-slate-500">{referral.from_facility_id}</div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">{t('form_select_specialty', 'Specialty')}</span>
              <div className="font-bold text-teal-900 mt-0.5">{referral.specialty_requested}</div>
              <div className="text-[11px] text-slate-500">{t('referral_destination', 'Destination')}: {referral.to_facility_name}</div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">{t('time', 'Appointment Slot')}</span>
              <div className="font-bold text-slate-900 mt-0.5">
                {referral.appointment_date ? formatDateTime(referral.appointment_date) : t('pending', 'Pending Slot')}
              </div>
              <div className="text-[11px] text-slate-500">{referral.assigned_doctor_name || 'Unassigned'}</div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">{t('referral_reason', 'Reason for Referral')}</span>
            <p className="text-slate-800 font-medium italic leading-relaxed">{referral.reason}</p>
            {referral.clinical_summary && (
              <p className="text-slate-600 text-[11px] mt-1">{referral.clinical_summary}</p>
            )}
          </div>
        </div>

        {/* Interactive Timeline Lifecycle & Audit History */}
        <InteractiveReferralTimeline
          referral={referral}
          history={history}
          onStatusClick={(st) => {
            setNewStatus(st);
            handleUpdateStatus(st);
          }}
          isEditable={true}
        />

        {/* Status Transition Control Box */}
        <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-2xl space-y-3">
          <div className="font-bold text-teal-950 text-xs flex items-center justify-between">
            <span>{t('ref_update_state_authorized', 'Update Referral State (Authorized Hospital Action)')}</span>
            <span className="text-[11px] text-teal-700">{t('ref_appends_history', 'Appends to ReferralStatusHistory')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">{t('dh_target_status', 'Target Status')} *</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:outline-none"
              >
                <option value="Created">{tStatus('Created')}</option>
                <option value="Accepted">{tStatus('Accepted')}</option>
                <option value="Appointment Scheduled">{tStatus('Appointment Scheduled')}</option>
                <option value="In Transit">{tStatus('In Transit')}</option>
                <option value="Patient Arrived">{tStatus('Patient Arrived')}</option>
                <option value="Consultation">{tStatus('Consultation')}</option>
                <option value="Treatment">{tStatus('Treatment')}</option>
                <option value="Treatment Completed">{tStatus('Treatment Completed')}</option>
                <option value="Follow-up Required">{tStatus('Follow-up Required')}</option>
                <option value="Closed">{tStatus('Closed')}</option>
              </select>
            </div>

            {newStatus === 'Appointment Scheduled' && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">{t('time', 'Appointment Slot Time')} *</label>
                <input
                  type="datetime-local"
                  value={appointmentSlot}
                  onChange={(e) => setAppointmentSlot(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
            )}
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">{t('dh_transition_notes', 'Clinical Remarks & Transition Notes')}</label>
            <input
              type="text"
              value={statusRemarks}
              onChange={(e) => setStatusRemarks(e.target.value)}
              placeholder="e.g. 2D Echo scheduled at Cardiology Unit. Bed allocated in Ward 4."
              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {onOpenConsultation && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenConsultation(referral);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
              >
                <FileText className="w-4 h-4" />
                <span>{t('dh_open_specialist_modal', 'Open Specialist Care & Rx Modal')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleUpdateStatus()}
              disabled={submitting}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm ml-auto"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? t('saving', 'Updating...') : `${t('dh_transition_to', 'Transition to')} ${tStatus(newStatus)}`}
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
          >
            {t('dh_close_dossier', 'Close Dossier')}
          </button>
        </div>

      </div>
    </Modal>
  );
};

export default ReferralDetailsModal;

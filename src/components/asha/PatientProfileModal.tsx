import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Patient, HealthRecord } from '../../types';
import { api } from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Activity, 
  Video, 
  Send, 
  Heart, 
  FileText
} from 'lucide-react';

interface PatientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onRecordVitals?: (patient: Patient) => void;
  onRequestTelecon?: (patient: Patient) => void;
  onInitiateReferral?: (patient: Patient) => void;
}

export const PatientProfileModal: React.FC<PatientProfileModalProps> = ({
  isOpen,
  onClose,
  patient,
  onRecordVitals,
  onRequestTelecon,
  onInitiateReferral
}) => {
  const [timeline, setTimeline] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    if (patient && isOpen) {
      setLoading(true);
      api.getPatientTimeline(patient.id)
        .then(res => {
          if (res.success) setTimeline(res.timeline || []);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [patient, isOpen]);

  if (!patient) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${patient.name} — ${language === 'hi' ? 'मरीज़ स्वास्थ्य प्रोफ़ाइल' : 'Patient Health Profile'}`}
      subtitle={`${t('asha_village', 'Village')}: ${patient.village} | ABHA ID: ${patient.abha_id || 'Unlinked'}`}
      maxWidth="lg"
    >
      <div className="space-y-5 text-xs">
        
        {/* Top Demographics Card */}
        <div className="p-4 bg-gradient-to-r from-teal-50 to-slate-50 border border-teal-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-600 text-white font-bold text-xl flex items-center justify-center shrink-0">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900">{patient.name}</div>
              <div className="text-slate-500 text-[11px] flex flex-wrap items-center gap-2 mt-0.5">
                <span>{patient.age} {language === 'hi' ? 'वर्ष' : 'Yrs'} / {patient.gender}</span>
                <span>•</span>
                <span>{t('form_patient_blood_group', 'Blood Group')}: <strong className="text-teal-800">{patient.blood_group || 'O+'}</strong></span>
                <span>•</span>
                <span>{t('form_patient_mobile', 'Mobile')}: {patient.mobile}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons for ASHA */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {onRecordVitals && (
              <button
                onClick={() => { onClose(); onRecordVitals(patient); }}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg flex items-center gap-1 text-[11px] shadow-xs"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'वाइटल्स' : 'Vitals'}</span>
              </button>
            )}
            {onRequestTelecon && (
              <button
                onClick={() => { onClose(); onRequestTelecon(patient); }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-1 text-[11px] shadow-xs"
              >
                <Video className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'टेली-परामर्श' : 'Teleconsult'}</span>
              </button>
            )}
            {onInitiateReferral && (
              <button
                onClick={() => { onClose(); onInitiateReferral(patient); }}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg flex items-center gap-1 text-[11px] shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'रेफ़र' : 'Refer'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Demographic Information Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {language === 'hi' ? 'मरीज़ आईडी' : 'Patient ID'}
            </span>
            <span className="font-mono font-bold text-slate-800 text-xs">{patient.id}</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {t('patient_abha_id', 'ABHA ID')}
            </span>
            <span className="font-mono font-bold text-teal-800 text-xs truncate block">{patient.abha_id || '91-4829-1029-4821'}</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {t('form_patient_emergency', 'Emergency Contact')}
            </span>
            <span className="font-bold text-slate-800 text-xs truncate block">{patient.emergency_contact || '+91 9876543200'}</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {t('patient_phc_contact', 'Mapped PHC')}
            </span>
            <span className="font-bold text-slate-800 text-xs truncate block">PHC Ratibad</span>
          </div>
        </div>

        {/* Chronic Conditions & Health Warnings */}
        {patient.chronic_conditions && patient.chronic_conditions.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-900">
            <Heart className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <strong>{language === 'hi' ? 'सक्रिय स्वास्थ्य स्थितियां:' : 'Active Conditions:'} </strong>
              <span>{patient.chronic_conditions.join(', ')}</span>
            </div>
          </div>
        )}

        {/* Recent Medical Encounter History */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-teal-600" />
              {t('patient_longitudinal_timeline', 'Longitudinal Clinical Encounters')} ({timeline.length})
            </h4>
          </div>

          {loading ? (
            <div className="text-center py-4 text-slate-400">{t('loading', 'Loading data...')}</div>
          ) : timeline.length === 0 ? (
            <div className="text-center py-4 text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
              {t('patient_no_records', 'No health records found yet.')}
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {timeline.map((record) => (
                <div key={record.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{record.diagnosis || record.chief_complaint}</span>
                    <span className="text-[10px] text-slate-400">{formatDate(record.record_date || record.created_at)}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{record.clinical_observations}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px] text-slate-500">
                    <span>{record.facility_name}</span>
                    <span>{language === 'hi' ? 'दर्जकर्ता:' : 'By:'} {record.recorded_by_name} ({record.recorded_by_role})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
          >
            {t('close', 'Close')}
          </button>
        </div>

      </div>
    </Modal>
  );
};

export default PatientProfileModal;

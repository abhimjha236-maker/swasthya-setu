import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Patient } from '../../types';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { Video } from 'lucide-react';

interface AshaTeleconModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onSuccess?: () => void;
}

export const AshaTeleconModal: React.FC<AshaTeleconModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSuccess
}) => {
  const [reason, setReason] = useState<string>('');
  const [symptoms, setSymptoms] = useState<string>('');
  const [urgency, setUrgency] = useState<string>('Standard');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { t, language } = useLanguage();

  if (!patient) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.requestTeleconsultation({
        patient_id: patient.id,
        reason: reason || 'Doorstep Teleconsultation Request via ASHA',
        symptoms: symptoms || 'Field evaluation during ASHA visit'
      });

      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
        setReason('');
        setSymptoms('');
      } else {
        setError(res.message || 'Failed to request teleconsultation');
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
      title={`${language === 'hi' ? 'टेली-परामर्श का अनुरोध करें' : 'Request Teleconsultation'} — ${patient.name}`}
      subtitle={language === 'hi' ? 'ई-संजीवनी के माध्यम से पीएचसी चिकित्सा अधिकारी या जिला अस्पताल के विशेषज्ञ से संपर्क' : 'Connects patient with PHC Medical Officer or District Specialist via e-Sanjeevani'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
            {error}
          </div>
        )}

        <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl">
          <div className="font-bold text-teal-950">{language === 'hi' ? 'मरीज़ का विवरण:' : 'Patient Details:'}</div>
          <div className="text-slate-600 mt-0.5">
            {patient.name} ({patient.age}Y/{patient.gender}) • {t('asha_village', 'Village')}: {patient.village} • {t('form_patient_mobile', 'Mobile')}: {patient.mobile}
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">
            {language === 'hi' ? 'डॉक्टर परामर्श का कारण *' : 'Reason for Doctor Consultation *'}
          </label>
          <input
            type="text"
            required
            placeholder={language === 'hi' ? 'उदा. अनियंत्रित उच्च रक्तचाप / गंभीर सिरदर्द / सीने में दर्द' : 'e.g. Uncontrolled high BP / Severe persistent headache / Chest pain'}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">
            {language === 'hi' ? 'फील्ड जांच के दौरान देखे गए लक्षण *' : 'Symptoms Observed During Field Visit *'}
          </label>
          <textarea
            rows={3}
            required
            placeholder={language === 'hi' ? 'क्लिनिकल निष्कर्ष, बीमारी की अवधि, तापमान व दर्ज वाइटल्स का विवरण दें...' : 'Describe clinical findings, duration of illness, temperature, vitals recorded...'}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">
            {t('referral_priority', 'Triage Priority')}
          </label>
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-semibold text-slate-800"
          >
            <option value="Standard">{language === 'hi' ? 'सामान्य (नियमित डॉक्टर कतार)' : 'Standard (Routine Doctor Queue)'}</option>
            <option value="Urgent">{language === 'hi' ? 'तत्काल (प्राथमिकता पर तत्काल परामर्श)' : 'Urgent (Immediate Medical Attention)'}</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
          >
            {t('cancel', 'Cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
          >
            <Video className="w-4 h-4" />
            {submitting ? t('saving', 'Connecting...') : (language === 'hi' ? 'टेली-परामर्श कतार में जोड़ें' : 'Queue Teleconsultation')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AshaTeleconModal;

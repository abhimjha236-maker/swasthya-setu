import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Patient } from '../../types';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { Send } from 'lucide-react';

interface AshaReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onSuccess?: () => void;
}

export const AshaReferralModal: React.FC<AshaReferralModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSuccess
}) => {
  const [toFacilityId, setToFacilityId] = useState<string>('FAC-DH-01');
  const [specialty, setSpecialty] = useState<string>('Cardiology');
  const [referralType, setReferralType] = useState<string>('urgent');
  const [reason, setReason] = useState<string>('');
  const [clinicalSummary, setClinicalSummary] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { t, language } = useLanguage();

  if (!patient) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.createReferral({
        patient_id: patient.id,
        to_facility_id: toFacilityId,
        specialty_requested: specialty,
        referral_type: referralType,
        reason: reason || 'Urgent specialist escalation from village doorstep',
        clinical_summary: clinicalSummary || 'Vitals and red-flag symptoms observed during ASHA field screening'
      });

      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
        setReason('');
        setClinicalSummary('');
      } else {
        setError(res.message || 'Failed to create referral');
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
      title={`${language === 'hi' ? 'क्लिनिकल रेफ़रल शुरू करें' : 'Initiate Clinical Referral'} — ${patient.name}`}
      subtitle={language === 'hi' ? 'मरीज़ को प्राथमिक स्वास्थ्य केंद्र (PHC) या जिला मेमोरियल अस्पताल में रेफ़र करें' : 'Escalates patient to Primary Health Centre or District Memorial Hospital'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
            {error}
          </div>
        )}

        <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl">
          <div className="font-bold text-purple-950">{language === 'hi' ? 'मरीज़ का विवरण:' : 'Patient Details:'}</div>
          <div className="text-slate-700 mt-0.5">
            {patient.name} ({patient.age}Y/{patient.gender}) • {t('asha_village', 'Village')}: {patient.village} • ABHA: {patient.abha_id || 'Unlinked'}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {t('form_select_facility', 'Destination Health Facility')} *
            </label>
            <select
              value={toFacilityId}
              onChange={(e) => setToFacilityId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-semibold text-slate-800"
            >
              <option value="FAC-DH-01">{language === 'hi' ? 'भोपाल जिला मेमोरियल अस्पताल (द्वितीयक / तृतीयक देखभाल)' : 'Bhopal District Memorial Hospital (Secondary / Tertiary)'}</option>
              <option value="FAC-PHC-01">{language === 'hi' ? 'प्राथमिक स्वास्थ्य केंद्र, रातीबड़ (ओपीडी)' : 'Primary Health Centre, Ratibad (Primary OPD)'}</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {t('form_select_specialty', 'Specialty / Clinical Department')} *
            </label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-semibold text-slate-800"
            >
              <option value="Cardiology">{language === 'hi' ? 'हृदय रोग (Cardiology / Hypertension)' : 'Cardiology (Hypertension / Heart Disease)'}</option>
              <option value="Obstetrics & Gynaecology">{language === 'hi' ? 'स्त्री एवं प्रसूति रोग (High-Risk ANC)' : 'Obstetrics & High-Risk Maternal ANC'}</option>
              <option value="Pulmonology & TB">{language === 'hi' ? 'श्वसन रोग व टीबी (Pulmonology / TB)' : 'Pulmonology & Respiratory Care (TB / Asthma)'}</option>
              <option value="General Surgery">{language === 'hi' ? 'सामान्य शल्य चिकित्सा (General Surgery / Trauma)' : 'General Surgery & Trauma'}</option>
              <option value="Paediatrics">{language === 'hi' ? 'बाल रोग (Paediatrics & SAM)' : 'Paediatrics & Severe Acute Malnutrition (SAM)'}</option>
              <option value="General Medicine">{language === 'hi' ? 'सामान्य चिकित्सा (General Medicine & NCD)' : 'General Medicine & NCD Clinic'}</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {t('referral_priority', 'Referral Urgency Level')} *
            </label>
            <select
              value={referralType}
              onChange={(e) => setReferralType(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-semibold text-slate-800"
            >
              <option value="routine">{language === 'hi' ? 'सामान्य (नियमित विशेषज्ञ ओपीडी)' : 'Routine (Scheduled Specialist OPD)'}</option>
              <option value="urgent">{language === 'hi' ? 'जरूरी (उच्च जोखिम ट्रायज)' : 'Urgent (Priority High-Risk Triage)'}</option>
              <option value="emergency">{language === 'hi' ? 'आपातकालीन (तत्काल 108 एम्बुलेंस सहायता)' : 'Emergency (Immediate 108 Ambulance Dispatch)'}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">
            {t('referral_reason', 'Primary Reason for Referral')} *
          </label>
          <input
            type="text"
            required
            placeholder={language === 'hi' ? 'उदा. अनियंत्रित उच्च रक्तचाप, सीने में भारीपन व सांस लेने में कठिनाई' : 'e.g. Uncontrolled stage-2 hypertension with chest tightness and shortness of breath'}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">
            {language === 'hi' ? 'क्लिनिकल सारांश व वाइटल्स निष्कर्ष' : 'Clinical Summary & Vitals Findings'}
          </label>
          <textarea
            rows={2}
            placeholder={language === 'hi' ? 'रक्तचाप, शुगर, ली जा रही दवाएं और जोखिम के संकेत दर्ज करें...' : 'Record BP, blood sugar, past medications, symptoms duration, and urgency indicators...'}
            value={clinicalSummary}
            onChange={(e) => setClinicalSummary(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
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
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
          >
            <Send className="w-4 h-4" />
            {submitting ? t('saving', 'Initiating...') : (language === 'hi' ? 'रेफ़रल ट्रायज में भेजें' : 'Submit Referral to Triage')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AshaReferralModal;

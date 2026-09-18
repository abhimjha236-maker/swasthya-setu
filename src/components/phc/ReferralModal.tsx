import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Patient, ReferralPriority } from '../../types';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { Send } from 'lucide-react';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onSuccess?: () => void;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSuccess
}) => {
  const [toFacilityId, setToFacilityId] = useState<string>('FAC-DH-01');
  const [specialty, setSpecialty] = useState<string>('Cardiology & Emergency Triage');
  const [priority, setPriority] = useState<ReferralPriority>('urgent');
  const [reason, setReason] = useState<string>('');
  const [clinicalSummary, setClinicalSummary] = useState<string>('');
  const [preferredDate, setPreferredDate] = useState<string>('');
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
        referral_type: priority,
        reason,
        clinical_summary: clinicalSummary,
        preferred_date: preferredDate || null
      });

      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
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
      title={`${language === 'hi' ? 'अस्पताल रेफ़रल शुरू करें' : 'Initiate Hospital Referral'} — ${patient.name}`}
      subtitle={`${t('form_patient_age', 'Age')}: ${patient.age} | ${t('form_patient_village', 'Village')}: ${patient.village} | ABHA: ${patient.abha_id || 'Unlinked'}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {t('form_select_facility', 'Destination Facility')} *
            </label>
            <select
              value={toFacilityId}
              onChange={(e) => setToFacilityId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="FAC-DH-01">{language === 'hi' ? 'भोपाल जिला मेमोरियल अस्पताल (जिला स्तर)' : 'Bhopal District Memorial Hospital (District Level)'}</option>
              <option value="FAC-PHC-01">{language === 'hi' ? 'पीएचसी रातीबड़ (द्वितीयक ट्रायज)' : 'PHC Ratibad (Secondary Triage)'}</option>
              <option value="FAC-PHC-02">{language === 'hi' ? 'पीएचसी बैरसिया (द्वितीयक ट्रायज)' : 'PHC Berasia (Secondary Triage)'}</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {t('form_select_specialty', 'Specialty Department')} *
            </label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="Cardiology & Emergency Triage">{language === 'hi' ? 'हृदय रोग व आपातकालीन ट्रायज' : 'Cardiology & Emergency Triage'}</option>
              <option value="Pulmonology / Chest & TB (NTEP)">{language === 'hi' ? 'श्वसन रोग व टीबी क्लिनिक' : 'Pulmonology / Chest & TB (NTEP)'}</option>
              <option value="Gynaecology & High-Risk Obstetrics">{language === 'hi' ? 'स्त्री एवं प्रसूति रोग (उच्च जोखिम)' : 'Gynaecology & High-Risk Obstetrics'}</option>
              <option value="Orthopaedics & Trauma">{language === 'hi' ? 'हड्डी रोग व ट्रॉमा' : 'Orthopaedics & Trauma'}</option>
              <option value="Diabetology & Endocrinology">{language === 'hi' ? 'मधुमेह व एंडोक्राइनोलॉजी' : 'Diabetology & Endocrinology'}</option>
              <option value="Paediatrics & Neonatology">{language === 'hi' ? 'बाल रोग व नवजात शिशु देखभाल' : 'Paediatrics & Neonatology'}</option>
              <option value="General Surgery & Diagnostics">{language === 'hi' ? 'सामान्य शल्य चिकित्सा' : 'General Surgery & Diagnostics'}</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {t('referral_priority', 'Referral Priority')} *
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as ReferralPriority)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-semibold"
            >
              <option value="routine">{language === 'hi' ? 'सामान्य (निर्धारित विशेषज्ञ ओपीडी)' : 'Routine (Scheduled Specialist Visit)'}</option>
              <option value="urgent">{language === 'hi' ? 'जरूरी (24-48 घंटों के भीतर)' : 'Urgent (Within 24-48 Hours)'}</option>
              <option value="emergency">{language === 'hi' ? 'आपातकालीन / रेड अलर्ट (तत्काल 108 स्थानांतरण)' : 'Emergency / Red Alert (Immediate 108 Transfer)'}</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {t('form_select_slot', 'Preferred Slot / Date')}
            </label>
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">
            {t('referral_reason', 'Primary Clinical Reason for Referral')} *
          </label>
          <input
            type="text"
            required
            placeholder={language === 'hi' ? 'उदा. एंजाइना की आशंका / 2D इको व विशेषज्ञ समीक्षा आवश्यक' : 'e.g. Suspected Exertional Angina / 2D Echo & Specialist review required'}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">
            {language === 'hi' ? 'क्लिनिकल सारांश व वर्तमान उपचार' : 'Clinical Summary & Existing Treatment'}
          </label>
          <textarea
            rows={3}
            placeholder={language === 'hi' ? 'वाइटल्स इतिहास, ईसीजी निष्कर्ष, वर्तमान दवाएं और PM-JAY स्थिति का विवरण दें...' : 'Summarize vital history, ECG findings, existing medications, and PM-JAY status...'}
            value={clinicalSummary}
            onChange={(e) => setClinicalSummary(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
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
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
          >
            <Send className="w-4 h-4" />
            {submitting ? t('saving', 'Creating Referral...') : (language === 'hi' ? 'रेफ़रल जिला ट्रायज में भेजें' : 'Dispatch Referral to DH Triage')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

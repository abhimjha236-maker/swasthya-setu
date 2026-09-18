import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Patient, PrescriptionItem } from '../../types';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { Plus, Trash2, Pill, CheckCircle2 } from 'lucide-react';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onSuccess?: () => void;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSuccess
}) => {
  const [complaint, setComplaint] = useState<string>('');
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [observations, setObservations] = useState<string>('');
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [medicines, setMedicines] = useState<PrescriptionItem[]>([
    { name: 'Paracetamol 500mg', dosage: '1 Tablet', frequency: 'TDS (Thrice Daily)', duration: '5 Days', instructions: 'After meals' }
  ]);
  const [advice, setAdvice] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { t, language } = useLanguage();

  if (!patient) return null;

  const handleAddMedicine = () => {
    setMedicines(prev => [
      ...prev,
      { name: '', dosage: '1 Tablet', frequency: 'BD (Twice Daily)', duration: '7 Days', instructions: 'After meals' }
    ]);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleMedChange = (index: number, field: keyof PrescriptionItem, val: string) => {
    setMedicines(prev => prev.map((med, idx) => idx === index ? { ...med, [field]: val } : med));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const validMedicines = medicines.filter(m => m.name.trim() !== '');

      const res = await api.createRecord({
        patient_id: patient.id,
        record_type: 'opd_consultation',
        chief_complaint: complaint || 'General OPD Consultation',
        clinical_observations: observations || 'General clinical examination completed.',
        diagnosis: diagnosis || 'Clinical Evaluation',
        prescription: validMedicines.length > 0 ? {
          medicines: validMedicines,
          notes: advice
        } : null,
        follow_up_date: followUpDate || null
      });

      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${language === 'hi' ? 'क्लिनिकल ओपीडी परामर्श दर्ज करें' : 'Conduct Clinical Consultation'} — ${patient.name}`}
      subtitle={`${t('form_patient_age', 'Age')}: ${patient.age} (${patient.gender}) | ${t('form_patient_village', 'Village')}: ${patient.village}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        
        {/* Diagnosis & Complaint */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {t('telecon_chief_complaints', 'Chief Complaint & Symptoms')} *
            </label>
            <input
              type="text"
              required
              placeholder={language === 'hi' ? 'उदा. ठंड लगकर बुखार, निरंतर सिरदर्द' : 'e.g. Fever with chills, persistent headache'}
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {t('telecon_diagnosis_label', 'Clinical Diagnosis')} *
            </label>
            <input
              type="text"
              required
              placeholder={language === 'hi' ? 'उदा. वायरल ब्रोंकाइटिस / उच्च रक्तचाप' : 'e.g. Acute Viral Bronchitis / Stage-1 HTN'}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-semibold text-teal-900"
            />
          </div>
        </div>

        {/* Clinical Assessment Observations */}
        <div>
          <label className="font-bold text-slate-700 block mb-1">
            {language === 'hi' ? 'क्लिनिकल जांच व शारीरिक निष्कर्ष' : 'Clinical Examination & Systemic Findings'}
          </label>
          <textarea
            rows={2}
            placeholder={language === 'hi' ? 'छाती, हृदय, पेट, गला और वाइटल्स के निष्कर्ष दर्ज करें...' : 'Document chest, CVS, abdomen, throat, and vital findings...'}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        {/* Prescription Builder */}
        <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-teal-900 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-teal-700" />
              {t('telecon_erx_builder', 'Digital Electronic Prescription (e-Rx)')}
            </span>
            <button
              type="button"
              onClick={handleAddMedicine}
              className="px-2.5 py-1 bg-white hover:bg-teal-100 text-teal-800 font-bold rounded-lg border border-teal-300 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('telecon_add_medicine', 'Add Medicine')}
            </button>
          </div>

          <div className="space-y-2">
            {medicines.map((med, idx) => (
              <div key={idx} className="p-2.5 bg-white rounded-lg border border-teal-100 grid grid-cols-12 gap-2 items-center">
                <div className="col-span-12 sm:col-span-4">
                  <input
                    type="text"
                    placeholder={language === 'hi' ? 'दवा का नाम (उदा. Amlodipine 5mg)' : 'Medicine Name (e.g. Amlodipine 5mg)'}
                    value={med.name}
                    onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:bg-white"
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <input
                    type="text"
                    placeholder={t('telecon_dosage', 'Dosage')}
                    value={med.dosage}
                    onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:bg-white"
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <input
                    type="text"
                    placeholder={t('telecon_frequency', 'Frequency')}
                    value={med.frequency}
                    onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:bg-white"
                  />
                </div>
                <div className="col-span-4 sm:col-span-3">
                  <input
                    type="text"
                    placeholder={language === 'hi' ? 'अवधि व निर्देश' : 'Duration & Advice'}
                    value={med.duration}
                    onChange={(e) => handleMedChange(idx, 'duration', e.target.value)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:bg-white"
                  />
                </div>
                <div className="col-span-12 sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveMedicine(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <input
              type="text"
              placeholder={language === 'hi' ? 'डॉक्टर की जीवनशैली व आहार सलाह...' : "Doctor's Lifestyle & Dietary Advice..."}
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              className="w-full p-2 bg-white border border-teal-200 rounded-lg text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* Follow-up date */}
        <div>
          <label className="font-bold text-slate-700 block mb-1">
            {t('form_followup_date', 'Schedule Follow-up Date')} ({language === 'hi' ? 'वैकल्पिक' : 'Optional'})
          </label>
          <input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
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
            <CheckCircle2 className="w-4 h-4" />
            {submitting ? t('saving', 'Signing...') : (language === 'hi' ? 'हस्ताक्षर करें व परामर्श पूर्ण करें' : 'Sign & Complete Consultation')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

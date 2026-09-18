import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Referral, PrescriptionItem } from '../../types';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Stethoscope, 
  Plus, 
  Trash2, 
  Pill, 
  CheckCircle2, 
  FileText, 
  Activity, 
  HeartPulse 
} from 'lucide-react';

interface HospitalConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  referral: Referral | null;
  onSuccess?: () => void;
}

export const HospitalConsultationModal: React.FC<HospitalConsultationModalProps> = ({
  isOpen,
  onClose,
  referral,
  onSuccess
}) => {
  const { t } = useLanguage();
  const [diagnosis, setDiagnosis] = useState<string>('Coronary Artery Disease (Stable Angina Class II)');
  const [treatmentNotes, setTreatmentNotes] = useState<string>('');
  const [tests, setTests] = useState<{ test_name: string; result: string }[]>([
    { test_name: '2D Echocardiography', result: 'LVEF 55%, Mild concentric LVH, No regional wall motion abnormality' },
    { test_name: '12-Lead Resting ECG', result: 'T-wave inversion in V4-V6, normal sinus rhythm' },
    { test_name: 'Lipid Profile', result: 'Total Chol: 210 mg/dL, LDL: 135 mg/dL, HDL: 42 mg/dL' }
  ]);
  const [medicines, setMedicines] = useState<PrescriptionItem[]>([
    { name: 'Amlodipine 5mg', dosage: '1 Tablet', frequency: 'OD (Morning)', duration: '30 Days', instructions: 'After breakfast with water' },
    { name: 'Atorvastatin 20mg', dosage: '1 Tablet', frequency: 'OD (Night)', duration: '30 Days', instructions: 'At bedtime' },
    { name: 'Aspirin 75mg', dosage: '1 Tablet', frequency: 'OD (Post-Lunch)', duration: '30 Days', instructions: 'After food' },
    { name: 'Nitroglycerin 2.6mg CR', dosage: '1 Tablet', frequency: 'SOS / PRN', duration: 'As needed', instructions: 'Take during acute chest discomfort' }
  ]);
  const [counterReferralNotes, setCounterReferralNotes] = useState<string>('Discharge on medical therapy. Counter-referred to PHC Ratibad. ASHA Sunita instructed to monitor doorstep BP bi-weekly.');
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!referral) return null;

  const handleAddMedicine = () => {
    setMedicines(prev => [
      ...prev,
      { name: '', dosage: '1 Tablet', frequency: 'OD (Daily)', duration: '30 Days', instructions: 'After food' }
    ]);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleMedChange = (index: number, field: keyof PrescriptionItem, val: string) => {
    setMedicines(prev => prev.map((m, idx) => idx === index ? { ...m, [field]: val } : m));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const validMeds = medicines.filter(m => m.name.trim() !== '');

      // 1. Create health record
      await api.createRecord({
        patient_id: referral.patient_id,
        record_type: 'specialist_visit',
        chief_complaint: referral.reason || 'Specialist Evaluation at District Memorial Hospital',
        clinical_observations: treatmentNotes || 'Specialist examination and cardiac diagnostics completed.',
        diagnosis: diagnosis || referral.specialty_requested,
        prescription: validMeds.length > 0 ? {
          medicines: validMeds,
          notes: counterReferralNotes
        } : null,
        test_reports: tests,
        follow_up_date: followUpDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        follow_up_instructions: counterReferralNotes,
        referral_id: referral.id
      });

      // 2. Update referral state to Treatment Completed with counter referral instructions
      await api.updateReferralStatus(referral.id, {
        status: 'Treatment Completed',
        counter_referral_notes: counterReferralNotes,
        remarks: `Specialist treatment completed by Dr. Rajeshwari Sen. Diagnostic tests: ${tests.map(t => t.test_name).join(', ')}.`,
        follow_up_instructions: counterReferralNotes,
        follow_up_date: followUpDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
      });

      if (onSuccess) onSuccess();
      onClose();
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
      title={`${t('dh_spec_consults', 'Specialist Care, Diagnostics & Counter-Referral')} — ${referral.patient_name}`}
      subtitle={`${t('referral_id', 'Referral ID')}: #${referral.id} | ${t('form_select_specialty', 'Specialty')}: ${referral.specialty_requested}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        
        {/* Top Info */}
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
          <div>
            <div className="font-bold text-blue-950">{t('role_patient', 'Patient')}: {referral.patient_name} ({referral.patient_age}Y/{referral.patient_gender})</div>
            <div className="text-slate-600 text-[11px]">{t('form_patient_village', 'Village')}: {referral.patient_village} • {t('referral_source', 'Origin')}: {referral.from_facility_name}</div>
          </div>
          <span className="px-2.5 py-1 bg-blue-200 text-blue-900 font-bold rounded-lg text-[10px]">
            Cardiology OPD 104
          </span>
        </div>

        {/* Diagnosis & Treatment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">{t('telecon_dr_diagnosis', 'Final Specialist Diagnosis')} *</label>
            <input
              type="text"
              required
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">{t('form_followup_date', 'Follow-Up Date for Village ASHA')}</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">{t('telecon_dr_notes', 'Specialist Clinical Findings & Procedure Notes')} *</label>
          <textarea
            rows={2}
            required
            placeholder="Document clinical assessment, cardiovascular auscultation, risk stratification..."
            value={treatmentNotes}
            onChange={(e) => setTreatmentNotes(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          />
        </div>

        {/* Diagnostic Test Reports Section */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <span className="font-bold text-slate-900 flex items-center gap-1">
            <Activity className="w-4 h-4 text-blue-600" />
            {t('dh_diag_reports', 'Specialist Diagnostic Test Reports')}
          </span>
          <div className="space-y-1.5">
            {tests.map((testItem, idx) => (
              <div key={idx} className="p-2 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                <span className="font-bold text-slate-900">{testItem.test_name}</span>
                <span className="font-mono text-slate-600">{testItem.result}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Specialist Prescription */}
        <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-teal-950 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-teal-600" />
              {t('prescription', 'Specialist Discharge e-Prescription')}
            </span>
            <button
              type="button"
              onClick={handleAddMedicine}
              className="px-2 py-0.5 bg-white hover:bg-teal-100 text-teal-800 font-bold rounded-lg border border-teal-300 text-[11px] flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> {t('telecon_add_medicine', '+ Add Medicine')}
            </button>
          </div>

          <div className="space-y-1.5">
            {medicines.map((med, idx) => (
              <div key={idx} className="p-2 bg-white rounded-lg border border-teal-100 grid grid-cols-12 gap-1.5 items-center">
                <div className="col-span-4">
                  <input
                    type="text"
                    placeholder={t('med_name', 'Medicine Name')}
                    value={med.name}
                    onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                    className="w-full p-1 bg-slate-50 border border-slate-200 rounded text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder={t('telecon_dosage', 'Dosage')}
                    value={med.dosage}
                    onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                    className="w-full p-1 bg-slate-50 border border-slate-200 rounded text-xs"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="text"
                    placeholder={t('telecon_frequency', 'Frequency')}
                    value={med.frequency}
                    onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                    className="w-full p-1 bg-slate-50 border border-slate-200 rounded text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder={t('telecon_duration', 'Duration')}
                    value={med.duration}
                    onChange={(e) => handleMedChange(idx, 'duration', e.target.value)}
                    className="w-full p-1 bg-slate-50 border border-slate-200 rounded text-xs"
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button type="button" onClick={() => handleRemoveMedicine(idx)} className="text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Counter-Referral Instructions */}
        <div>
          <label className="font-bold text-slate-700 block mb-1">
            {t('form_followup_instructions', 'Closed-Loop Counter-Referral Instructions (Delegated to PHC & ASHA)')} *
          </label>
          <textarea
            rows={2}
            required
            placeholder="Document discharge care plan, doorstep monitoring instructions, and return warnings..."
            value={counterReferralNotes}
            onChange={(e) => setCounterReferralNotes(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-medium text-slate-900"
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
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            {submitting ? t('saving', 'Signing...') : t('telecon_sign_finish', 'Sign Discharge & Complete Treatment')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default HospitalConsultationModal;

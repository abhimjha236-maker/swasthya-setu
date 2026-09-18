import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Patient } from '../../types';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { Activity, Heart, Thermometer, Wind, Droplet, Calendar, CheckCircle2 } from 'lucide-react';

interface VitalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onSuccess?: () => void;
}

export const VitalsModal: React.FC<VitalsModalProps> = ({ isOpen, onClose, patient, onSuccess }) => {
  const [bp, setBp] = useState<string>('120/80');
  const [pulse, setPulse] = useState<string>('76');
  const [temp, setTemp] = useState<string>('98.6');
  const [spo2, setSpo2] = useState<string>('98');
  const [sugar, setSugar] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [hb, setHb] = useState<string>('');
  const [observations, setObservations] = useState<string>('');
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { t, language } = useLanguage();

  if (!patient) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const vitalsPayload: any = {
        bp: `${bp} mmHg`,
        pulse: `${pulse} bpm`,
        temp: `${temp} °F`,
        spo2: `${spo2}%`
      };
      if (sugar) vitalsPayload.blood_sugar_random = `${sugar} mg/dL`;
      if (weight) vitalsPayload.weight = `${weight} kg`;
      if (hb) vitalsPayload.hemoglobin = `${hb} g/dL`;

      const res = await api.createRecord({
        patient_id: patient.id,
        record_type: 'vital_check',
        chief_complaint: 'ASHA Household Doorstep Health Screening',
        vitals: vitalsPayload,
        clinical_observations: observations || 'Vitals checked at home during routine ASHA field visit.',
        diagnosis: 'Doorstep Vitals Screening & Health Check',
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
      title={`${language === 'hi' ? 'घर पर स्वास्थ्य जांच (वाइटल्स) दर्ज करें' : 'Record Doorstep Vitals'} — ${patient.name}`}
      subtitle={`${t('asha_village', 'Village')}: ${patient.village} | ABHA: ${patient.abha_id || 'Unlinked'}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        
        {/* Vitals inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-bold text-slate-700 flex items-center gap-1 mb-1">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              {t('vitals_bp', 'Blood Pressure')} (mmHg)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 130/85"
              value={bp}
              onChange={(e) => setBp(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 flex items-center gap-1 mb-1">
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              {t('vitals_pulse', 'Pulse Rate')} (bpm)
            </label>
            <input
              type="number"
              required
              placeholder="72"
              value={pulse}
              onChange={(e) => setPulse(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 flex items-center gap-1 mb-1">
              <Wind className="w-3.5 h-3.5 text-blue-500" />
              {t('vitals_spo2', 'SpO2 Oxygen')} (%)
            </label>
            <input
              type="number"
              required
              placeholder="98"
              value={spo2}
              onChange={(e) => setSpo2(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 flex items-center gap-1 mb-1">
              <Thermometer className="w-3.5 h-3.5 text-amber-500" />
              {t('vitals_temp', 'Body Temperature')} (°F)
            </label>
            <input
              type="text"
              required
              placeholder="98.6"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 flex items-center gap-1 mb-1">
              <Droplet className="w-3.5 h-3.5 text-purple-500" />
              {t('vitals_sugar', 'Blood Sugar')} (mg/dL)
            </label>
            <input
              type="number"
              placeholder="e.g. 110"
              value={sugar}
              onChange={(e) => setSugar(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 flex items-center gap-1 mb-1">
              {t('vitals_weight', 'Weight (kg)')}
            </label>
            <input
              type="text"
              placeholder="e.g. 68"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Observations */}
        <div>
          <label className="font-bold text-slate-700 block mb-1">
            {language === 'hi' ? 'फील्ड निरीक्षण व मरीज़ की शिकायतें' : 'Field Observations & Patient Complaints'}
          </label>
          <textarea
            rows={2}
            placeholder={language === 'hi' ? 'लक्षण, दवा लेने की नियमितता या बीमारी के संकेत दर्ज करें...' : 'Note any symptoms, medication adherence, or signs of illness...'}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        {/* Follow-up date */}
        <div>
          <label className="font-bold text-slate-700 flex items-center gap-1 mb-1">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            {t('form_followup_date', 'Next Doorstep Follow-Up Date')} ({language === 'hi' ? 'वैकल्पिक' : 'Optional'})
          </label>
          <input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
          >
            {t('cancel', 'Cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            {submitting ? t('saving', 'Saving...') : (language === 'hi' ? 'डिजिटल रिकॉर्ड में सहेजें' : 'Save to Longitudinal Record')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

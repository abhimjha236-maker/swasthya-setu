import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Patient, Vitals } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Video, 
  Calendar, 
  Clock, 
  User, 
  Activity, 
  HeartPulse, 
  CheckCircle2, 
  AlertCircle,
  Stethoscope,
  Sparkles,
  Building2
} from 'lucide-react';

interface ConsultationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preSelectedPatient?: Patient | null;
}

export const ConsultationRequestModal: React.FC<ConsultationRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preSelectedPatient
}) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [symptoms, setSymptoms] = useState<string>('');
  const [specialty, setSpecialty] = useState<string>('General Medicine');
  const [preferredTime, setPreferredTime] = useState<string>('immediate');
  const [customDateTime, setCustomDateTime] = useState<string>('');

  // Vitals
  const [bp, setBp] = useState<string>('120/80');
  const [pulse, setPulse] = useState<string>('76');
  const [temp, setTemp] = useState<string>('98.6');
  const [spo2, setSpo2] = useState<string>('99');
  const [bloodSugar, setBloodSugar] = useState<string>('110');

  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const quickReasons = language === 'hi' ? [
    'उच्च रक्तचाप एवं बीपी समीक्षा',
    'लगातार बुखार व ठंड लगना',
    'सीने में भारीपन व सांस लेने में तकलीफ',
    'अस्पताल डिस्चार्ज के बाद फॉलो-अप',
    'मधुमेह दवा खुराक समायोजन',
    'मातृ स्वास्थ्य एवं प्रसव पूर्व जांच (ANC)',
    'त्वचा संक्रमण / दाद-खुजली',
    'जोड़ों का पुराना दर्द'
  ] : [
    'Hypertension & BP Review',
    'Persistent Fever & Chills',
    'Chest Discomfort & Breathlessness',
    'Post-Hospital Discharge Check',
    'Diabetes Medication Titration',
    'Maternal ANC Consultation',
    'Skin Infection / Rash',
    'Chronic Joint Pain'
  ];

  useEffect(() => {
    if (isOpen) {
      if (preSelectedPatient) {
        setSelectedPatientId(preSelectedPatient.id);
      } else if (user?.role === 'patient') {
        setSelectedPatientId(user.patient_id || 'PAT-001');
      } else {
        fetchPatientList();
      }
    }
  }, [isOpen, preSelectedPatient, user]);

  const fetchPatientList = async () => {
    setLoading(true);
    try {
      const res = await api.getPatients();
      if (res.success && res.data) {
        setPatients(res.data);
        if (res.data.length > 0 && !selectedPatientId) {
          setSelectedPatientId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError(language === 'hi' ? 'कृपया परामर्श का क्लिनिकल कारण या मुख्य लक्षण दर्ज करें।' : 'Please specify the clinical reason or chief complaint for consultation.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let scheduledIso = new Date(Date.now() + 15 * 60000).toISOString();
      if (preferredTime === 'custom' && customDateTime) {
        scheduledIso = new Date(customDateTime).toISOString();
      } else if (preferredTime === 'afternoon') {
        const d = new Date();
        d.setHours(14, 30, 0, 0);
        scheduledIso = d.toISOString();
      } else if (preferredTime === 'morning') {
        const d = new Date();
        d.setHours(10, 0, 0, 0);
        scheduledIso = d.toISOString();
      }

      const vitalsPayload: Vitals = {
        bp: bp ? `${bp} mmHg` : undefined,
        pulse: pulse ? parseInt(pulse) : undefined,
        temp: temp ? `${temp} °F` : undefined,
        spo2: spo2 ? `${spo2}%` : undefined,
        blood_sugar_random: bloodSugar ? `${bloodSugar} mg/dL` : undefined
      };

      const res = await api.requestTeleconsultation({
        patient_id: selectedPatientId,
        reason: reason.trim(),
        symptoms: symptoms.trim() || reason.trim(),
        specialty,
        preferred_time: scheduledIso,
        current_vitals: vitalsPayload
      });

      if (res.success) {
        setReason('');
        setSymptoms('');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.message || (language === 'hi' ? 'टेली-परामर्श अनुरोध असफल रहा' : 'Failed to request teleconsultation'));
      }
    } catch (err: any) {
      setError(err.message || (language === 'hi' ? 'नेटवर्क त्रुटि' : 'Network error scheduling teleconsultation'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('telecon_req_title')}
      subtitle={t('telecon_req_sub')}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Patient Selection */}
        {user?.role !== 'patient' && (
          <div>
            <label className="font-bold text-slate-700 block mb-1">{t('telecon_select_patient')} *</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.age}Y/{p.gender}) — {p.village} (ABHA: {p.abha_id || 'N/A'})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reason / Chief Complaint */}
        <div>
          <label className="font-bold text-slate-700 block mb-1">{t('telecon_reason_label')} *</label>
          <input
            type="text"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={language === 'hi' ? 'उदा. सुबह सिरदर्द, रक्तचाप 148/92' : 'e.g. Recurrent morning headaches, blood pressure elevated at 148/92'}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          />

          {/* Quick Pre-filled Chips */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {quickReasons.map((qr, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setReason(qr)}
                className="px-2 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-600 rounded-lg text-[10px] font-medium border border-slate-200 transition-colors"
              >
                + {qr}
              </button>
            ))}
          </div>
        </div>

        {/* Specialty & Preferred Time Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">{t('telecon_specialty_label')}</label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none"
            >
              <option value="General Medicine">{language === 'hi' ? 'सामान्य चिकित्सा (PHC चिकित्सा अधिकारी)' : 'General Medicine (PHC Medical Officer)'}</option>
              <option value="Cardiology">{language === 'hi' ? 'हृदय रोग विशेषज्ञ (Cardiology)' : 'Cardiology (Specialist Consultation)'}</option>
              <option value="Gynaecology & Obstetrics">{language === 'hi' ? 'स्त्री एवं प्रसूति रोग (Maternal Care)' : 'Gynaecology & Obstetrics (Maternal Care)'}</option>
              <option value="Pediatrics">{language === 'hi' ? 'शिशु एवं बाल रोग (Child Healthcare)' : 'Pediatrics (Child Healthcare)'}</option>
              <option value="Orthopaedics">{language === 'hi' ? 'अस्थि रोग एवं फिजियोथेरेपी' : 'Orthopaedics & Physiotherapy'}</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">{t('telecon_preferred_time')}</label>
            <select
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none"
            >
              <option value="immediate">{language === 'hi' ? 'तत्काल / कतार में उपलब्ध डॉक्टर' : 'Immediate / Next Available Doctor (Queue)'}</option>
              <option value="morning">{language === 'hi' ? 'आज - सुबह का स्लॉट (10:00 AM)' : 'Today - Morning Slot (10:00 AM)'}</option>
              <option value="afternoon">{language === 'hi' ? 'आज - दोपहर का स्लॉट (02:30 PM)' : 'Today - Afternoon Slot (02:30 PM)'}</option>
              <option value="custom">{language === 'hi' ? 'विशिष्ट दिनांक एवं समय चुनें...' : 'Pick Specific Date & Time...'}</option>
            </select>
          </div>
        </div>

        {preferredTime === 'custom' && (
          <div>
            <label className="font-bold text-slate-700 block mb-1">{t('telecon_choose_dt')} *</label>
            <input
              type="datetime-local"
              required
              value={customDateTime}
              onChange={(e) => setCustomDateTime(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        )}

        {/* Current Vitals (Captured by ASHA / PHC or Self-Reported) */}
        <div className="p-3.5 bg-teal-50/60 border border-teal-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-teal-950 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-teal-600" />
              {t('telecon_baseline_vitals')}
            </span>
            <span className="text-[10px] text-teal-700 font-semibold">{t('telecon_precall_triage')}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <div>
              <span className="text-[10px] text-slate-500 block">BP (mmHg)</span>
              <input
                type="text"
                placeholder="120/80"
                value={bp}
                onChange={(e) => setBp(e.target.value)}
                className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block">Pulse (bpm)</span>
              <input
                type="text"
                placeholder="76"
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
                className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block">SpO2 (%)</span>
              <input
                type="text"
                placeholder="99"
                value={spo2}
                onChange={(e) => setSpo2(e.target.value)}
                className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block">Temp (°F)</span>
              <input
                type="text"
                placeholder="98.6"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block">Sugar (mg/dL)</span>
              <input
                type="text"
                placeholder="110"
                value={bloodSugar}
                onChange={(e) => setBloodSugar(e.target.value)}
                className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
          >
            {t('cancel')}
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Video className="w-4 h-4" />
            <span>{submitting ? t('telecon_placing_queue') : t('telecon_confirm_queue_btn')}</span>
          </button>
        </div>

      </form>
    </Modal>
  );
};

export default ConsultationRequestModal;

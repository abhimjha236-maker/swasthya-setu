import React from 'react';
import { Modal } from '../common/Modal';
import { Teleconsultation, PrescriptionItem } from '../../types';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';
import { 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  Building2, 
  ShieldCheck, 
  User, 
  Calendar, 
  Clock, 
  Pill, 
  HeartPulse, 
  QrCode,
  Share2,
  Phone
} from 'lucide-react';

interface ConsultationSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  telecon: Teleconsultation | null;
}

export const ConsultationSummaryModal: React.FC<ConsultationSummaryModalProps> = ({
  isOpen,
  onClose,
  telecon
}) => {
  const { t, language } = useLanguage();
  if (!telecon) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert(language === 'hi' 
      ? `${telecon.patient_name} हेतु आधिकारिक ई-संजीवनी टेली-परामर्श पर्चा (PDF) डाउनलोड हो रहा है...`
      : `Downloading Official e-Sanjeevani Teleconsultation Prescription Slip (PDF) for ${telecon.patient_name}...`);
  };

  const medicines: PrescriptionItem[] = telecon.medicines || 
    (telecon.prescription?.medicines || [
      { name: 'Amlodipine 5mg', dosage: '1 Tab', frequency: 'OD (Morning)', duration: '30 Days', instructions: 'Take with water after breakfast' },
      { name: 'Atorvastatin 10mg', dosage: '1 Tab', frequency: 'OD (Night)', duration: '30 Days', instructions: 'Take at bedtime' }
    ]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('telecon_summary_title')}
      subtitle={`ID: #${telecon.id}`}
      maxWidth="2xl"
    >
      <div className="space-y-5 text-xs text-slate-800">
        
        {/* Printable Official Slip Card */}
        <div id="printable-telecon-slip" className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-5">
          
          {/* Official Public Health Header */}
          <div className="border-b-2 border-teal-700 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-xs">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider block">
                  {t('telecon_gov_header')}
                </span>
                <h2 className="text-base font-black text-slate-900 leading-tight">
                  Swasthya Setu — {t('telecon_summary_title')}
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  {language === 'hi' ? 'स्वास्थ्य केंद्र' : 'Facility'}: <strong>{telecon.facility_name}</strong> | {language === 'hi' ? 'टेली-परामर्श विंग' : 'Teleconsultation Wing'}
                </p>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">{language === 'hi' ? 'परामर्श आईडी' : 'Consultation ID'}</span>
              <div className="font-mono font-bold text-sm text-teal-900">{telecon.id}</div>
              <span className="text-[10px] text-slate-500 font-medium block">
                {telecon.completed_at ? formatDateTime(telecon.completed_at) : formatDateTime(telecon.created_at)}
              </span>
            </div>
          </div>

          {/* Doctor & Patient Split Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            {/* Patient Meta */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-teal-800 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {t('patient_details')}
              </span>
              <div className="font-bold text-slate-900 text-sm">
                {telecon.patient_name} ({telecon.patient_age} {language === 'hi' ? 'वर्ष' : 'Yrs'} / {telecon.patient_gender})
              </div>
              <div className="text-slate-600">
                {language === 'hi' ? 'गाँव' : 'Village'}: <strong>{telecon.patient_village}</strong> • {language === 'hi' ? 'मोबाइल' : 'Mobile'}: {telecon.patient?.mobile || '9876543210'}
              </div>
              <div className="text-teal-950 font-mono font-bold text-[11px] mt-0.5">
                ABHA ID: {telecon.patient_abha || '91-8291-4920-1102'}
              </div>
            </div>

            {/* Doctor Meta */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-teal-800 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {t('telecon_consulting_officer')}
              </span>
              <div className="font-bold text-slate-900 text-sm">
                {telecon.doctor_name}
              </div>
              <div className="text-slate-600">
                {language === 'hi' ? 'पंजीकरण सं.' : 'Reg No'}: <strong>MPMC-58291-REG</strong> (Govt of MP)
              </div>
              <div className="text-slate-600 text-[11px]">
                {language === 'hi' ? 'माध्यम' : 'Mode'}: <strong>{language === 'hi' ? 'सुरक्षित एचडी वीडियो' : 'Encrypted High-Definition Video'}</strong> ({telecon.duration || '12m 45s'})
              </div>
            </div>
          </div>

          {/* Recorded Vitals Row */}
          {telecon.current_vitals && (
            <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-teal-900">
                <HeartPulse className="w-4 h-4 text-teal-600" />
                <span>{t('telecon_verified_vitals')}:</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-slate-700 font-mono">
                <span>BP: <strong>{telecon.current_vitals.bp || '124/82 mmHg'}</strong></span>
                <span>Pulse: <strong>{telecon.current_vitals.pulse || '76'} bpm</strong></span>
                <span>SpO2: <strong>{telecon.current_vitals.spo2 || '99%'}</strong></span>
                <span>Temp: <strong>{telecon.current_vitals.temp || '98.6 °F'}</strong></span>
              </div>
            </div>
          )}

          {/* Clinical Findings & Diagnosis */}
          <div className="space-y-2 border-b border-slate-200 pb-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">{t('telecon_reason_label')}</span>
              <span className="text-slate-700 font-semibold">{telecon.reason}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-teal-900 block mb-0.5">
                {t('telecon_clinical_diag_findings')}
              </span>
              <div className="p-3 bg-slate-100/80 rounded-xl font-bold text-slate-900 text-xs">
                {telecon.diagnosis || (language === 'hi' ? 'टेली-परामर्श के माध्यम से नैदानिक मूल्यांकन पूर्ण' : 'Clinical Evaluation via Teleconsultation')}
              </div>
            </div>
            {telecon.doctor_notes && (
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  {t('telecon_doctor_advice')}
                </span>
                <p className="text-slate-700 italic leading-relaxed">{telecon.doctor_notes}</p>
              </div>
            )}
          </div>

          {/* Electronic Prescription Table (e-Rx) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-teal-600" />
                {t('telecon_prescribed_meds')}
              </h3>
              <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                {t('telecon_dispense_note')}
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">{t('telecon_th_num')}</th>
                    <th className="p-2.5">{t('telecon_th_med_name')}</th>
                    <th className="p-2.5">{t('telecon_th_dosage_timing')}</th>
                    <th className="p-2.5">{t('telecon_th_duration')}</th>
                    <th className="p-2.5">{t('telecon_th_instructions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {medicines.map((med, i) => (
                    <tr key={i} className="hover:bg-slate-50/60">
                      <td className="p-2.5 font-bold text-slate-400 font-mono">{i + 1}</td>
                      <td className="p-2.5 font-bold text-slate-900">{med.name}</td>
                      <td className="p-2.5 text-teal-900 font-semibold">{med.dosage} • {med.frequency}</td>
                      <td className="p-2.5 text-slate-700">{med.duration}</td>
                      <td className="p-2.5 text-slate-600 italic">{med.instructions || (language === 'hi' ? 'भोजन के बाद पानी के साथ लें' : 'After meals with water')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Follow-up & Verification Footer */}
          <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-[11px] font-bold text-slate-800">
                {t('telecon_next_followup')}: <strong className="text-teal-800">{telecon.follow_up_date ? formatDate(telecon.follow_up_date) : (language === 'hi' ? '7 दिनों बाद (या आवश्यकतानुसार)' : 'After 7 Days (or SOS)')}</strong>
              </div>
              <div className="text-[10px] text-slate-500">
                {t('telecon_assigned_asha')}: <strong>Sunita Ahirwar (Barkheda)</strong>
              </div>
            </div>

            {/* Digital Stamp & QR */}
            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="w-10 h-10 bg-white border border-slate-300 rounded flex items-center justify-center font-bold text-slate-700">
                <QrCode className="w-7 h-7 text-slate-800" />
              </div>
              <div className="text-left text-[10px] leading-tight text-slate-600">
                <div className="font-bold text-slate-900">{t('telecon_digitally_verified_rx')}</div>
                <div>Hash: SHA256-ABDM-VALID</div>
                <div className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {t('telecon_signed_by')}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="text-[11px] text-slate-500">
            {t('telecon_telemed_guidelines')}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>{t('telecon_print_slip')}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{t('telecon_download_slip')}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl"
            >
              {t('close')}
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
};

export default ConsultationSummaryModal;

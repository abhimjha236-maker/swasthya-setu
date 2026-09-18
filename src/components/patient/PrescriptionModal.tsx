import React from 'react';
import { Modal } from '../common/Modal';
import { formatDate } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';
import { Printer, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: any;
  doctorName?: string;
  facilityName?: string;
  patientName?: string;
  patientAbha?: string;
  date?: string;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  onClose,
  prescription,
  doctorName = 'Dr. Alok Sharma (Medical Officer)',
  facilityName = 'Primary Health Centre, Ratibad, Bhopal',
  patientName = 'Ramesh Kumar Verma',
  patientAbha = '91-4829-1029-4821',
  date
}) => {
  const { t, language } = useLanguage();
  if (!prescription) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={language === 'hi' ? 'डिजिटल इलेक्ट्रॉनिक पर्ची (e-Rx)' : 'Digital Electronic Prescription (e-Rx)'} 
      maxWidth="2xl"
    >
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 print:border-none print:shadow-none">
        
        {/* Header Header */}
        <div className="flex items-start justify-between border-b-2 border-teal-700 pb-4">
          <div>
            <div className="text-[10px] uppercase font-bold text-teal-800 tracking-wider">
              NATIONAL DIGITAL HEALTH MISSION (ABDM)
            </div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">
              {language === 'hi' ? 'स्वास्थ्य सेतु डिजिटल पर्ची (e-Rx)' : 'SWASTHYA SETU e-PRESCRIPTION'}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">{facilityName}</p>
          </div>
          <div className="text-right text-xs">
            <span className="font-mono text-slate-500">Rx ID: {prescription.id || 'RX-2026-09'}</span>
            <div className="font-semibold text-slate-700 mt-1">{t('date', 'Date')}: {formatDate(date || new Date().toISOString())}</div>
          </div>
        </div>

        {/* Patient Info Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">
              {t('form_patient_name', 'Patient Name')}
            </span>
            <div className="font-bold text-slate-900">{patientName}</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">
              {t('patient_abha_id', 'ABHA ID')}
            </span>
            <div className="font-mono font-semibold text-teal-800">{patientAbha}</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">
              {language === 'hi' ? 'डॉक्टर / परामर्शदाता' : 'Doctor / Prescriber'}
            </span>
            <div className="font-semibold text-slate-900">{doctorName}</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">
              {language === 'hi' ? 'डिजिटल हस्ताक्षर' : 'Digital Signature'}
            </span>
            <div className="text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified e-Sign
            </div>
          </div>
        </div>

        {/* Rx Symbol & Medication Table */}
        <div className="space-y-2">
          <div className="text-2xl font-serif font-black text-teal-800">℞</div>
          
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 font-bold">
              <tr>
                <th className="p-2.5">#</th>
                <th className="p-2.5">{t('telecon_medicine_name', 'Medicine Name & Strength')}</th>
                <th className="p-2.5">{t('telecon_dosage', 'Dosage')}</th>
                <th className="p-2.5">{t('telecon_frequency', 'Frequency')}</th>
                <th className="p-2.5">{t('telecon_duration', 'Duration')}</th>
                <th className="p-2.5">{t('telecon_food_instructions', 'Instructions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prescription.medicines?.map((med: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="p-2.5 text-slate-400">{idx + 1}</td>
                  <td className="p-2.5 font-bold text-slate-900">{med.name}</td>
                  <td className="p-2.5 text-slate-700">{med.dosage}</td>
                  <td className="p-2.5 text-teal-700 font-semibold">{med.frequency}</td>
                  <td className="p-2.5 text-slate-700">{med.duration}</td>
                  <td className="p-2.5 text-slate-500 italic">{med.instructions || (language === 'hi' ? 'निर्देशानुसार' : 'As directed')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Doctor Advice / Notes */}
        {prescription.notes && (
          <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-xs">
            <span className="font-bold text-teal-900 block mb-1">
              {language === 'hi' ? 'आहार व जीवनशैली संबंधी निर्देश:' : 'Dietary & Lifestyle Advice:'}
            </span>
            <p className="text-teal-800 leading-relaxed">{prescription.notes}</p>
          </div>
        )}

        {/* Footer Signature */}
        <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>{language === 'hi' ? 'स्वास्थ्य सेतु मंच के माध्यम से इलेक्ट्रॉनिक रूप से जारी' : 'Generated electronically via Swasthya Setu Platform'}</span>
          </div>

          <div className="text-right">
            <div className="font-bold text-slate-900">{doctorName}</div>
            <div className="text-[11px] text-slate-500">
              {language === 'hi' ? 'अधिकृत पंजीकृत चिकित्सा व्यवसायी (RMP)' : 'Authorized Registered Medical Practitioner (RMP)'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2 print:hidden">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            {t('print', 'Print')} / {t('export_pdf', 'PDF')}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all"
          >
            {t('close', 'Close')}
          </button>
        </div>

      </div>
    </Modal>
  );
};

import React, { useState } from 'react';
import { HealthRecord } from '../../types';
import { formatDate } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Activity, 
  Stethoscope, 
  Building2, 
  Pill, 
  FileText, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  ClipboardList 
} from 'lucide-react';

interface HealthTimelineProps {
  records: HealthRecord[];
  onOpenPrescription?: (prescription: any, doctorName: string, date: string) => void;
}

export const HealthTimeline: React.FC<HealthTimelineProps> = ({ records, onOpenPrescription }) => {
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(records[0]?.id || null);
  const { t, language } = useLanguage();

  const toggleExpand = (id: string) => {
    setExpandedRecordId(prev => (prev === id ? null : id));
  };

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'vital_check':
        return <Activity className="w-5 h-5 text-emerald-600" />;
      case 'opd_consultation':
        return <Stethoscope className="w-5 h-5 text-teal-600" />;
      case 'specialist_visit':
        return <Building2 className="w-5 h-5 text-blue-600" />;
      case 'hospital_discharge':
        return <FileText className="w-5 h-5 text-purple-600" />;
      default:
        return <ClipboardList className="w-5 h-5 text-slate-600" />;
    }
  };

  const getRecordBadge = (type: string) => {
    if (language === 'hi') {
      switch (type) {
        case 'vital_check':
          return { label: 'घर पर स्वास्थ्य जांच (वाइटल्स)', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        case 'opd_consultation':
          return { label: 'पीएचसी ओपीडी परामर्श', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
        case 'specialist_visit':
          return { label: 'जिला अस्पताल विशेषज्ञ परामर्श', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
        case 'hospital_discharge':
          return { label: 'डिस्चार्ज सारांश', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
        default:
          return { label: 'क्लिनिकल रिकॉर्ड', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
      }
    }
    switch (type) {
      case 'vital_check':
        return { label: 'Doorstep Vitals Check', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'opd_consultation':
        return { label: 'PHC OPD Consultation', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'specialist_visit':
        return { label: 'District Hospital Specialist', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'hospital_discharge':
        return { label: 'Discharge Summary', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      default:
        return { label: 'Clinical Encounter', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const pathwaySteps = language === 'hi' ? [
    { label: 'भ्रमण', desc: 'गृह जांच / ओपीडी', icon: '📍', status: 'completed' },
    { label: 'निरीक्षण', desc: 'वाइटल्स व लक्षण', icon: '🩺', status: 'completed' },
    { label: 'परामर्श', desc: 'डॉक्टर क्लिनिकल निदान', icon: '👨‍⚕️', status: 'completed' },
    { label: 'पर्ची', desc: 'डिजिटल e-Rx पर्ची', icon: '💊', status: 'completed' },
    { label: 'रेफ़रल', desc: 'विशेषज्ञ ट्रायज', icon: '🏛️', status: 'completed' },
    { label: 'अस्पताल आगमन', desc: 'जिला अस्पताल प्रवेश', icon: '🏥', status: 'completed' },
    { label: 'उपचार', desc: 'जांच व विशेषज्ञ देखभाल', icon: '❤️', status: 'completed' },
    { label: 'फॉलो-अप', desc: 'आशा गृह भ्रमण जांच', icon: '✅', status: 'active' },
  ] : [
    { label: 'Visit', desc: 'Doorstep / OPD Entry', icon: '📍', status: 'completed' },
    { label: 'Observation', desc: 'Vitals & Symptoms', icon: '🩺', status: 'completed' },
    { label: 'Consultation', desc: 'Doctor Clinical Diagnosis', icon: '👨‍⚕️', status: 'completed' },
    { label: 'Prescription', desc: 'Digital e-Rx Pad', icon: '💊', status: 'completed' },
    { label: 'Referral', desc: 'Secondary Specialist Triage', icon: '🏛️', status: 'completed' },
    { label: 'Hospital Visit', desc: 'District Hospital Arrival', icon: '🏥', status: 'completed' },
    { label: 'Treatment', desc: 'Specialist Diagnostics & Care', icon: '❤️', status: 'completed' },
    { label: 'Follow-up', desc: 'Village ASHA Home Checks', icon: '✅', status: 'active' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Visual Chronological Pathway Diagram */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white p-5 rounded-3xl shadow-md border border-teal-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">
              ABDM PUBLIC HEALTHCARE CONTINUUM
            </span>
            <h3 className="text-sm sm:text-base font-black text-white mt-0.5">
              {language === 'hi' ? 'जीवनकालिक मरीज़ स्वास्थ्य सेवा यात्रा' : 'Visual Longitudinal Patient Pathway'}
            </h3>
          </div>
          <span className="text-[11px] px-2.5 py-1 bg-teal-800/60 text-teal-200 rounded-full border border-teal-700 font-mono">
            {records.length} {language === 'hi' ? 'सत्यापित रिकॉर्ड' : 'Verified Encounters'}
          </span>
        </div>

        {/* Chronological Step Pipeline */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
          {pathwaySteps.map((step, idx) => (
            <div 
              key={idx}
              className={`p-2.5 rounded-xl border text-center relative transition-all ${
                step.status === 'active'
                  ? 'bg-amber-950/60 border-amber-500 text-amber-200 ring-2 ring-amber-400/40 shadow-sm'
                  : 'bg-slate-800/70 border-slate-700 text-slate-200 hover:border-teal-500'
              }`}
            >
              <div className="text-base mb-1">{step.icon}</div>
              <div className="font-bold text-xs leading-tight text-white">{step.label}</div>
              <div className="text-[9px] text-teal-300/80 mt-0.5 leading-tight truncate">{step.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Patient View-Only Disclaimer Banner */}
      <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-center justify-between gap-2 text-xs text-teal-900">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-teal-700 shrink-0" />
          <span>
            <strong>{language === 'hi' ? 'आधिकारिक स्वास्थ्य रिकॉर्ड (ABDM सत्यापित):' : 'Official Medical Record (ABDM Verified):'}</strong>{' '}
            {language === 'hi' 
              ? 'सभी प्रविष्टियां, वाइटल्स, पर्ची और रेफ़रल अधिकृत डॉक्टरों व स्वास्थ्य कार्यकर्ताओं द्वारा प्रमाणित हैं।' 
              : 'All clinical entries, vitals, prescriptions, and referral notes are authenticated by licensed practitioners and field workers.'}
          </span>
        </div>
      </div>

      {/* Chronological Encounter Cards */}
      <div className="relative pl-6 sm:pl-8 space-y-5 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-teal-600 before:via-teal-400 before:to-slate-200">
      {records.map((record) => {
        const isExpanded = expandedRecordId === record.id;
        const badge = getRecordBadge(record.record_type);

        return (
          <div key={record.id} className="relative group">
            {/* Timeline Node Icon */}
            <div className="absolute -left-6 sm:-left-8 top-1.5 w-7 h-7 rounded-full bg-white border-2 border-teal-600 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
            </div>

            {/* Card Content */}
            <div className="bg-white rounded-2xl border border-slate-200 hover:border-teal-300 shadow-xs hover:shadow-md transition-all overflow-hidden">
              
              {/* Header */}
              <div 
                onClick={() => toggleExpand(record.id)}
                className="p-4 sm:p-5 flex items-start justify-between gap-3 cursor-pointer bg-gradient-to-r from-white via-white to-slate-50/50"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 shrink-0">
                    {getRecordIcon(record.record_type)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(record.record_date || record.created_at)}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 mt-1">
                      {record.diagnosis || record.chief_complaint}
                    </h4>

                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700">{record.facility_name}</span>
                      <span>•</span>
                      <span>{record.recorded_by_name} ({record.recorded_by_role})</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {record.prescription && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-semibold border border-teal-200">
                      <Pill className="w-3.5 h-3.5" />
                      {record.prescription.medicines?.length || 0} {language === 'hi' ? 'दवाएं' : 'Meds'}
                    </span>
                  )}
                  <button className="p-1 text-slate-400 hover:text-slate-600 rounded-full">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Expanded Body */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-100 bg-slate-50/40 space-y-4 text-xs">
                  
                  {/* Chief Complaint & Observation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {t('telecon_chief_complaints', 'Chief Complaint & Symptoms')}
                      </span>
                      <p className="text-slate-800 font-medium mt-1 leading-relaxed">
                        {record.chief_complaint}
                      </p>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {language === 'hi' ? 'क्लिनिकल निष्कर्ष व मूल्यांकन' : 'Clinical Observations & Assessment'}
                      </span>
                      <p className="text-slate-800 font-medium mt-1 leading-relaxed">
                        {record.clinical_observations}
                      </p>
                    </div>
                  </div>

                  {/* Vitals Grid */}
                  {record.vitals && Object.keys(record.vitals).length > 0 && (
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                        {language === 'hi' ? 'दर्ज वाइटल्स व बायोमार्कर्स' : 'Recorded Vitals & Biomarkers'}
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {record.vitals.bp && (
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-500">{t('vitals_bp', 'Blood Pressure')}</span>
                            <div className="text-xs font-bold text-slate-900">{record.vitals.bp}</div>
                          </div>
                        )}
                        {record.vitals.pulse && (
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-500">{t('vitals_pulse', 'Pulse Rate')}</span>
                            <div className="text-xs font-bold text-slate-900">{record.vitals.pulse} bpm</div>
                          </div>
                        )}
                        {record.vitals.spo2 && (
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-500">{t('vitals_spo2', 'SpO2 Oxygen')}</span>
                            <div className="text-xs font-bold text-slate-900">{record.vitals.spo2}</div>
                          </div>
                        )}
                        {record.vitals.blood_sugar_fasting && (
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-500">{t('vitals_sugar', 'Sugar (Fasting)')}</span>
                            <div className="text-xs font-bold text-slate-900">{record.vitals.blood_sugar_fasting}</div>
                          </div>
                        )}
                        {record.vitals.blood_sugar_random && (
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-500">{t('vitals_sugar', 'Sugar (Random)')}</span>
                            <div className="text-xs font-bold text-slate-900">{record.vitals.blood_sugar_random}</div>
                          </div>
                        )}
                        {record.vitals.hemoglobin && (
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-500">{t('vitals_hemoglobin', 'Hemoglobin (Hb)')}</span>
                            <div className="text-xs font-bold text-slate-900">{record.vitals.hemoglobin}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Prescription Section */}
                  {record.prescription && record.prescription.medicines && record.prescription.medicines.length > 0 && (
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider flex items-center gap-1">
                          <Pill className="w-3.5 h-3.5 text-teal-600" />
                          {language === 'hi' ? 'निर्धारित दवा खुराक अनुसूची' : 'Prescribed Medication Schedule'}
                        </span>
                        {onOpenPrescription && (
                          <button
                            onClick={() => onOpenPrescription(record.prescription, record.recorded_by_name, record.record_date)}
                            className="text-[11px] font-bold text-teal-700 hover:text-teal-800 hover:underline"
                          >
                            {language === 'hi' ? 'डिजिटल पर्ची देखें' : 'View Printable Digital Rx'}
                          </button>
                        )}
                      </div>

                      <div className="divide-y divide-slate-100">
                        {record.prescription.medicines.map((med, idx) => (
                          <div key={idx} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div>
                              <span className="font-bold text-slate-900 text-xs">{med.name}</span>
                              <span className="text-slate-500 text-[11px] ml-1.5">({med.dosage})</span>
                              {med.instructions && (
                                <p className="text-[11px] text-slate-500 italic mt-0.5">{med.instructions}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-slate-600 text-[11px]">
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">{med.frequency}</span>
                              <span className="text-slate-500">{med.duration}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {record.prescription.notes && (
                        <div className="mt-2.5 p-2 bg-teal-50/50 rounded-lg text-[11px] text-teal-900 border border-teal-100">
                          <strong>{t('telecon_notes_label', "Doctor's Advice")}:</strong> {record.prescription.notes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Test Reports */}
                  {record.test_reports && record.test_reports.length > 0 && (
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                        {language === 'hi' ? 'डायग्नोस्टिक लैब रिपोर्ट' : 'Diagnostic Test Reports'}
                      </span>
                      <div className="space-y-1.5">
                        {record.test_reports.map((test, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                            <span className="font-semibold text-slate-800">{test.test_name}</span>
                            <span className="text-slate-600 font-mono text-[11px]">{test.result}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow up alert */}
                  {record.follow_up_date && (
                    <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                      <span className="font-semibold">{t('form_followup_date', 'Recommended Follow-up Date')}:</span>
                      <span className="font-bold">{formatDate(record.follow_up_date)}</span>
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
};

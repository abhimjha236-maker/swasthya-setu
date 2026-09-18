import React from 'react';
import { User, Activity, Stethoscope, Video, Building2, HeartPulse, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface PatientJourneyMapProps {
  currentStage?: number; // 0 to 6
  patientName?: string;
}

export const PatientJourneyMap: React.FC<PatientJourneyMapProps> = ({ currentStage = 1, patientName }) => {
  const { language } = useLanguage();

  const stages = language === 'hi' ? [
    { 
      id: 0, 
      label: 'मरीज़', 
      desc: 'ग्रामीण परिवार स्वास्थ्य आवश्यकता', 
      icon: <User className="w-4 h-4 sm:w-5 sm:h-5" />, 
      facility: 'बरखेड़ा गांव',
      details: 'मरीज़ द्वारा लक्षण रिपोर्ट या नियमित जांच'
    },
    { 
      id: 1, 
      label: 'आशा कार्यकर्ता', 
      desc: 'घर पर वाइटल्स व ट्रायज', 
      icon: <Activity className="w-4 h-4 sm:w-5 sm:h-5" />, 
      facility: 'सुनीता अहिरवार (फील्ड)',
      details: 'रक्तचाप, शुगर, SpO2 व NCD स्क्रीनिंग'
    },
    { 
      id: 2, 
      label: 'प्राथमिक स्वास्थ्य केंद्र (PHC)', 
      desc: 'चिकित्सा अधिकारी परामर्श', 
      icon: <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />, 
      facility: 'पीएचसी रातीबड़',
      details: 'क्लिनिकल निदान, ओपीडी व प्राथमिक दवाएं'
    },
    { 
      id: 3, 
      label: 'टेली-परामर्श / रेफ़रल', 
      desc: 'डिजिटल सेतु व विशेषज्ञ ट्रायज', 
      icon: <Video className="w-4 h-4 sm:w-5 sm:h-5" />, 
      facility: 'ई-संजीवनी / 108 एम्बुलेंस',
      details: 'वीडियो परामर्श या त्वरित आपातकालीन परिवहन'
    },
    { 
      id: 4, 
      label: 'जिला अस्पताल', 
      desc: 'द्वितीयक अस्पताल में आगमन', 
      icon: <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />, 
      facility: 'जिला मेमोरियल अस्पताल, भोपाल',
      details: 'विशेषज्ञ ओपीडी / इनवार्ड ट्रायज डेस्क'
    },
    { 
      id: 5, 
      label: 'विशेषज्ञ उपचार', 
      desc: 'जांच व गहन चिकित्सा', 
      icon: <HeartPulse className="w-4 h-4 sm:w-5 sm:h-5" />, 
      facility: 'विशेषज्ञ विभाग (कार्डियोलॉजी/सर्जरी)',
      details: 'ईसीजी, इको, सर्जरी या विशेष दवाएं'
    },
    { 
      id: 6, 
      label: 'फॉलो-अप व सुधार', 
      desc: 'घर पर सतत स्वास्थ्य निगरानी', 
      icon: <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />, 
      facility: 'आशा क्लोज्ड लूप',
      details: 'दवाओं की नियमितता व स्वास्थ्य सुधार सत्यापन'
    },
  ] : [
    { 
      id: 0, 
      label: 'Patient', 
      desc: 'Village Household Need', 
      icon: <User className="w-4 h-4 sm:w-5 sm:h-5" />, 
      facility: 'Barkheda Village',
      details: 'Citizen reports symptoms or routine screening'
    },
    { 
      id: 1, 
      label: 'ASHA', 
      desc: 'Doorstep Vitals & Triage', 
      icon: <Activity className="w-4 h-4 sm:w-5 sm:h-5" />, 
      facility: 'Sunita Ahirwar (Field)',
      details: 'Doorstep BP, Blood Sugar, SpO2 & NCD screening'
    },
    { 
      id: 2, 
      label: 'PHC', 
      desc: 'Medical Officer Consultation', 
      icon: <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />, 
      facility: 'PHC Ratibad',
      details: 'Clinical diagnosis, OPD care & initial therapy'
    },
    { 
      id: 3, 
      label: 'Teleconsultation / Referral', 
      desc: 'Digital Bridge & Specialist Triage', 
      icon: <Video className="w-4 h-4 sm:w-5 sm:h-5" />, 
      facility: 'e-Sanjeevani / 108 Ambulance',
      details: 'Video consult or rapid emergency transport'
    },
    { 
      id: 4, 
      label: 'District Hospital', 
      desc: 'Secondary Hospital Arrival', 
      icon: <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />, 
      facility: 'DH Bhopal Memorial',
      details: 'Specialist OPD / Inward triage desk'
    },
    { 
      id: 5, 
      label: 'Treatment', 
      desc: 'Specialist Diagnostics & Care', 
      icon: <HeartPulse className="w-4 h-4 sm:w-5 sm:h-5" />, 
      facility: 'Specialist Department',
      details: 'ECG, Echo, Surgery, or Advanced Medication'
    },
    { 
      id: 6, 
      label: 'Follow-up', 
      desc: 'Doorstep Post-Care Monitoring', 
      icon: <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />, 
      facility: 'ASHA Closed Loop',
      details: 'Medication adherence & recovery verification'
    },
  ];

  return (
    <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-950 text-white p-4 sm:p-6 rounded-3xl border border-teal-800 shadow-md space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-800/80 pb-3">
        <div>
          <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">
            SWASTHYA SETU CONTINUUM OF CARE
          </span>
          <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
            {language === 'hi' ? 'क्लोज्ड-लूप मरीज़ स्वास्थ्य सेवा यात्रा' : 'Closed-Loop Patient Journey'} {patientName ? `— ${patientName}` : ''}
          </h3>
        </div>
        <span className="text-[11px] px-2.5 py-1 bg-teal-800/60 text-teal-200 rounded-full border border-teal-700 font-mono self-start sm:self-auto">
          {language === 'hi' ? `चरण ${currentStage + 1} / 7 सक्रिय` : `Stage ${currentStage + 1} of 7 Active`}
        </span>
      </div>

      {/* Visual Sequence Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
        {stages.map((stage, idx) => {
          const isActive = idx <= currentStage;
          const isCurrent = idx === currentStage;

          return (
            <div 
              key={stage.id}
              className={`p-3 rounded-2xl border transition-all flex flex-col justify-between text-left relative ${
                isCurrent 
                  ? 'bg-teal-600/30 border-teal-400 ring-2 ring-teal-400/50 shadow-sm'
                  : isActive
                  ? 'bg-teal-900/30 border-teal-700/60 text-slate-200'
                  : 'bg-slate-800/30 border-slate-700/40 text-slate-400 opacity-60'
              }`}
            >
              {/* Step Top */}
              <div className="flex items-center justify-between mb-2">
                <div 
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center ${
                    isCurrent 
                      ? 'bg-teal-400 text-teal-950 font-bold' 
                      : isActive 
                      ? 'bg-teal-600 text-white' 
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {stage.icon}
                </div>
                <span className="text-[10px] font-mono font-bold text-teal-300">
                  0{idx + 1}
                </span>
              </div>

              {/* Step Labels */}
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">{stage.label}</h4>
                <p className="text-[10px] text-teal-300/90 font-medium mt-0.5">{stage.desc}</p>
                <div className="text-[9px] text-slate-400 mt-1 leading-snug border-t border-teal-800/50 pt-1">
                  {stage.facility}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Explanatory Footer */}
      <div className="p-3 bg-teal-900/40 rounded-xl border border-teal-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-teal-200">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          <span>
            <strong>{language === 'hi' ? 'शत-प्रतिशत क्लोज्ड-लूप गारंटी:' : 'Zero Patient Drop-Off Guarantee:'}</strong>{' '}
            {language === 'hi' 
              ? 'जब मरीज़ को जिला अस्पताल रेफ़र किया जाता है, तो डिस्चार्ज होते ही आशा कार्यकर्ता को 48 घंटे के भीतर घर पर फॉलो-अप जांच का अलर्ट स्वतः प्राप्त होता है।' 
              : 'When a patient is referred to DH Bhopal, the ASHA receives automatic counter-referral alerts upon discharge to conduct doorstep follow-up within 48 hours.'}
          </span>
        </div>
      </div>

    </div>
  );
};

export default PatientJourneyMap;

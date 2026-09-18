import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  ShieldCheck, 
  Activity, 
  Stethoscope, 
  Building2, 
  UserCheck, 
  Pill, 
  Video, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  HeartHandshake, 
  Globe2, 
  Lock, 
  Zap, 
  BarChart3 
} from 'lucide-react';
import { PatientJourneyMap } from '../components/asha/PatientJourneyMap';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, user, quickDemoLogin } = useAuth();
  const { t, language } = useLanguage();

  const features = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-teal-600" />,
      title: language === 'hi' ? "आभा (ABHA) व डिजिटल पहचान" : "ABDM & ABHA Digital Identity",
      desc: language === 'hi' 
        ? "14-अंकों की आभा आईडी का तत्काल सृजन व आयुष्मान भारत PM-JAY वॉलेट का लाइव सत्यापन।" 
        : "Instant 14-digit ABHA generation with PM-JAY Ayushman Bharat digital health wallet verification."
    },
    {
      icon: <FileText className="w-6 h-6 text-blue-600" />,
      title: language === 'hi' ? "दीर्घकालिक स्वास्थ्य इतिहास" : "Longitudinal Health Records",
      desc: language === 'hi' 
        ? "घर-घर जांच से लेकर पीएचसी और जिला अस्पताल के डिस्चार्ज तक की संपूर्ण कालानुक्रमिक समयरेखा।" 
        : "Single continuous medical timeline tracking every doorstep vitals check, PHC visit, and hospital discharge."
    },
    {
      icon: <ArrowRight className="w-6 h-6 text-purple-600" />,
      title: language === 'hi' ? "बंद-लूप रेफ़रल प्रणाली" : "Closed-Loop Referral System",
      desc: language === 'hi' 
        ? "गांव से लेकर जिला अस्पताल के विशेषज्ञ डॉक्टर और पुनः गांव में फॉलो-अप तक 9-चरणीय लाइव ट्रैकिंग।" 
        : "Real-time state machine from village triage to District Hospital specialist care with counter-referrals."
    },
    {
      icon: <Video className="w-6 h-6 text-emerald-600" />,
      title: language === 'hi' ? "ग्रामीण ई-संजीवनी टेली-परामर्श" : "Rural Teleconsultation Hub",
      desc: language === 'hi' 
        ? "गांव की आशा व मरीज को सीधे चिकित्सा अधिकारियों व विशेषज्ञों से जोड़ने वाला वीडियो परामर्श कक्ष।" 
        : "Live video consultation connecting village ASHAs and patients with remote medical officers and specialists."
    },
    {
      icon: <Pill className="w-6 h-6 text-amber-600" />,
      title: language === 'hi' ? "पारदर्शी बहु-स्तरीय दवा भंडार" : "Multi-Facility Medicine Inventory",
      desc: language === 'hi' 
        ? "उप-केंद्र, पीएचसी और जिला अस्पतालों में दवाओं के लाइव स्टॉक व एक्सपायरी की पारदर्शी ट्रैकिंग।" 
        : "Transparent stock tracker showing medicine availability and batch expiries across Sub-Centres, PHCs, and Hospitals."
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-indigo-600" />,
      title: language === 'hi' ? "जिला रोग निगरानी व सांख्यिकी" : "District Disease Surveillance",
      desc: language === 'hi' 
        ? "मुख्य चिकित्सा अधिकारियों (CMHO) व जिला कलेक्टरों के लिए महामारी निगरानी व संस्थागत स्कोरकार्ड।" 
        : "Real-time epidemiological analytics and resource allocation for District Collectors and Chief Medical Officers."
    }
  ];

  const stakeholders = [
    {
      role: "patient",
      title: language === 'hi' ? "ग्रामीण नागरिक व मरीज़" : "Rural Citizens & Patients",
      desc: language === 'hi' 
        ? "आभा कार्ड, स्वास्थ्य इतिहास, नजदीकी केंद्रों में दवा की उपलब्धता और टेली-परामर्श की सुविधा।" 
        : "Access ABHA cards, longitudinal medical records, medicine availability, and video consultations from village.",
      btnText: language === 'hi' ? "मरीज़ पोर्टल देखें" : "Explore Patient Portal"
    },
    {
      role: "asha",
      title: language === 'hi' ? "आशा फील्ड कार्यकर्ता" : "ASHA Field Workers",
      desc: language === 'hi' 
        ? "ग्रामीण परिवारों का पंजीकरण, घर पर वाइटल्स जांच, मातृ व शिशु देखभाल और पीएचसी रेफ़रल।" 
        : "Register village households, record doorstep vitals, track ANC/TB follow-ups, and initiate PHC referrals.",
      btnText: language === 'hi' ? "आशा डेस्क देखें" : "Explore ASHA Desk"
    },
    {
      role: "phc",
      title: language === 'hi' ? "प्राथमिक स्वास्थ्य केंद्र (PHC)" : "Primary Health Centres (PHC)",
      desc: language === 'hi' 
        ? "ओपीडी परामर्श, डिजिटल दवा पर्चा (e-Rx), टेली-परामर्श और जिला अस्पताल रेफ़रल प्रबंधन।" 
        : "Manage OPD consultations, write digital prescriptions, conduct teleconsultations, and manage medicine stock.",
      btnText: language === 'hi' ? "पीएचसी पोर्टल देखें" : "Explore PHC Portal"
    },
    {
      role: "hospital",
      title: language === 'hi' ? "जिला अस्पताल (DH)" : "District Hospitals (DH)",
      desc: language === 'hi' 
        ? "आवक रेफ़रल ट्राइएज, विशेषज्ञ अपॉइंटमेंट स्लॉट, परीक्षण रिपोर्ट और डिस्चार्ज काउंटर-रेफ़रल।" 
        : "Triage inbound referrals, schedule specialist consultations, upload diagnostic reports, and discharge with care plans.",
      btnText: language === 'hi' ? "अस्पताल डेस्क देखें" : "Explore Hospital Desk"
    },
    {
      role: "admin",
      title: language === 'hi' ? "जिला स्वास्थ्य प्रशासन (CMHO)" : "District Health Administrators",
      desc: language === 'hi' 
        ? "जिले के 10 मुख्य स्वास्थ्य संकेतकों, अस्पताल कार्यभार, दवा आपूर्ति और रोग निगरानी का कमान केंद्र।" 
        : "Monitor district-wide healthcare KPIs, disease surveillance heatmaps, facility workloads, and supply chain health.",
      btnText: language === 'hi' ? "सीएमएचओ सांख्यिकी देखें" : "Explore CMO Analytics"
    }
  ];

  return (
    <div className="space-y-16 pb-20">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 sm:pt-16 pb-12 bg-gradient-to-b from-teal-50/70 via-white to-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-teal-100/70 text-teal-800 rounded-full text-xs font-semibold border border-teal-200">
            <Globe2 className="w-3.5 h-3.5 text-teal-600" />
            <span>{t('landing_hero_badge')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            {t('landing_hero_title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-emerald-600">
              {t('landing_hero_title_highlight')}
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            {t('landing_hero_desc')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/login"
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <span>{t('landing_access_btn')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => quickDemoLogin('asha')}
              className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm border border-slate-200 shadow-xs hover:border-teal-300 transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{t('landing_evaluator_demo')}</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-8 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-2xl font-black text-teal-700">100%</div>
              <div className="text-xs text-slate-500 font-medium">{t('landing_metrics_abdm')}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-2xl font-black text-emerald-700">{language === 'hi' ? 'बंद-लूप' : 'Closed-Loop'}</div>
              <div className="text-xs text-slate-500 font-medium">{t('landing_metrics_referral')}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-2xl font-black text-blue-700">{language === 'hi' ? '5-स्तरीय' : '5-Tier'}</div>
              <div className="text-xs text-slate-500 font-medium">{t('landing_metrics_roles')}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-2xl font-black text-purple-700">{language === 'hi' ? 'रीयल-टाइम' : 'Real-Time'}</div>
              <div className="text-xs text-slate-500 font-medium">{t('landing_metrics_inventory')}</div>
            </div>
          </div>

        </div>
      </section>

      {/* Interactive Patient Care Pathway Map */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PatientJourneyMap currentStage={3} />
      </section>

      {/* Problem & Solution Comparison */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{t('landing_transforming_title')}</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('landing_transforming_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
              {t('landing_challenges_title')}
            </div>
            <ul className="space-y-2.5 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span><strong>{t('landing_challenge_1_title')}:</strong> {t('landing_challenge_1_desc')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span><strong>{t('landing_challenge_2_title')}:</strong> {t('landing_challenge_2_desc')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span><strong>{t('landing_challenge_3_title')}:</strong> {t('landing_challenge_3_desc')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span><strong>{t('landing_challenge_4_title')}:</strong> {t('landing_challenge_4_desc')}</span>
              </li>
            </ul>
          </div>

          <div className="bg-teal-50/60 border border-teal-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
              {t('landing_solution_title')}
            </div>
            <ul className="space-y-2.5 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span><strong>{t('landing_solution_1_title')}:</strong> {t('landing_solution_1_desc')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span><strong>{t('landing_solution_2_title')}:</strong> {t('landing_solution_2_desc')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span><strong>{t('landing_solution_3_title')}:</strong> {t('landing_solution_3_desc')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span><strong>{t('landing_solution_4_title')}:</strong> {t('landing_solution_4_desc')}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Core Platform Capabilities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{t('landing_features_title')}</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('landing_features_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-teal-300 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl w-fit border border-slate-100">
                {feat.icon}
              </div>
              <h3 className="text-base font-bold text-slate-900">{feat.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stakeholder Workflows */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs uppercase font-bold text-teal-400 tracking-widest">
            {language === 'hi' ? 'भूमिका-आधारित स्वास्थ्य पारिस्थितिकी तंत्र' : 'ROLE-BASED ECOSYSTEM'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
            {language === 'hi' ? 'स्वास्थ्य सेतु का उपयोग कौन करता है?' : 'Who Uses Swasthya Setu?'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {language === 'hi' 
              ? 'सख्त भूमिका-आधारित पहुंच नियंत्रण (RBAC) के साथ तैयार किए गए विशेष इंटरफेस' 
              : 'Dedicated tailored interfaces with strict role-based access control (RBAC)'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stakeholders.map((stk, idx) => (
            <div key={idx} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-teal-500 transition-all">
              <div>
                <h4 className="text-base font-bold text-teal-300">{stk.title}</h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">{stk.desc}</p>
              </div>
              <button
                onClick={() => quickDemoLogin(stk.role as any)}
                className="w-full py-2 bg-teal-600/30 hover:bg-teal-600 text-teal-200 hover:text-white font-bold rounded-xl text-xs border border-teal-500/50 transition-all flex items-center justify-center gap-1.5"
              >
                <span>{stk.btnText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Security & Governance Disclaimer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 bg-slate-100 rounded-2xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-start gap-4">
          <Lock className="w-6 h-6 text-teal-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">
              {language === 'hi' ? 'राष्ट्रीय स्वास्थ्य डेटा गोपनीयता व प्रोटोटाइप सूचना' : 'National Health Data Privacy & Prototype Disclaimer'}
            </h4>
            <p className="leading-relaxed">
              {language === 'hi'
                ? 'स्वास्थ्य सेतु आयुष्मान भारत डिजिटल मिशन (ABDM) स्वास्थ्य डेटा प्रबंधन नीति के अनुरूप बनाया गया है। क्लिनिकल निदान व उपचार का संपूर्ण उत्तरदायित्व पंजीकृत चिकित्सकों का है। स्मार्ट इंडिया हैकथॉन के इस प्रोटोटाइप में भोपाल जिले के सभी मरीजों व स्वास्थ्य केंद्रों के डेटा का उपयोग प्रदर्शन के लिए किया गया है।'
                : 'Swasthya Setu is engineered aligned with the ABDM Health Data Management Policy. Medical records and diagnosis remain the exclusive responsibility of registered healthcare practitioners. In this Smart India Hackathon prototype, all patient records and facilities in Bhopal District are fictionalized for demonstration purposes.'}
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};

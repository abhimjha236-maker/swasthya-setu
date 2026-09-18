import React, { useState, useEffect, useRef } from 'react';
import { Teleconsultation, PrescriptionItem, Patient, HealthRecord, Vitals } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { ConsultationSummaryModal } from './ConsultationSummaryModal';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Send, 
  Activity, 
  HeartPulse, 
  FileText, 
  Pill, 
  CheckCircle2, 
  User, 
  MessageSquare, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Share2,
  Calendar,
  AlertTriangle,
  History,
  QrCode,
  Building2,
  Stethoscope,
  Maximize2,
  Minimize2,
  Volume2,
  Radio,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface VideoRoomProps {
  teleconId: string;
  onCallEnded?: () => void;
}

export const VideoRoom: React.FC<VideoRoomProps> = ({ teleconId, onCallEnded }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, tStatus, language } = useLanguage();

  const [telecon, setTelecon] = useState<Teleconsultation | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patientHistory, setPatientHistory] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Call controls state
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [callSeconds, setCallSeconds] = useState<number>(254); // simulated active timer 04:14
  const [activeTab, setActiveTab] = useState<'summary' | 'history' | 'notes' | 'prescription' | 'followup'>('notes');

  // In-call chat messages
  const [messages, setMessages] = useState<Array<{ sender: string; text: string; time: string; isDoctor?: boolean }>>([
    { 
      sender: language === 'hi' ? 'सिस्टम' : 'System', 
      text: language === 'hi' ? 'सुरक्षित 256-बिट एन्क्रिप्टेड ई-संजीवनी सत्र कनेक्ट हुआ।' : 'Secure 256-bit encrypted e-Sanjeevani session connected.', 
      time: '10:30 AM' 
    },
    { 
      sender: 'Dr. Alok Sharma', 
      text: language === 'hi' ? 'नमस्ते रमेश जी। मैं आपको स्पष्ट देख और सुन पा रहा हूँ। आज आपकी तबीयत कैसी है?' : 'Namaste Ramesh ji. I can see your video clearly. How are you feeling today?', 
      time: '10:31 AM', 
      isDoctor: true 
    },
    { 
      sender: 'Ramesh Verma (via ASHA Sunita)', 
      text: language === 'hi' ? 'डॉक्टर साहब, सुबह का सिरदर्द कम हुआ है, पर थोड़ा चलने पर सीने में भारीपन महसूस होता है।' : 'Doctor sahab, morning headache has reduced, but slight exertional heaviness is still present.', 
      time: '10:32 AM' 
    },
    { 
      sender: 'Sunita Ahirwar (ASHA)', 
      text: language === 'hi' ? 'डॉक्टर साहब, आज घर पर बीपी 132/84 mmHg और पल्स 74 bpm दर्ज की गई।' : 'Doctor sahab, today BP reading at home was 132/84 mmHg, pulse 74 bpm.', 
      time: '10:33 AM' 
    }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [showChatDrawer, setShowChatDrawer] = useState<boolean>(false);

  // Doctor Clinical Outcomes (Entered by authorized doctor, NOT autonomous AI)
  const [diagnosis, setDiagnosis] = useState<string>(
    language === 'hi' 
      ? 'नियंत्रित आवश्यक उच्च रक्तचाप (ग्रेड 1 एंजाइना)'
      : 'Controlled Essential Hypertension with Mild Exertional Angina (Grade 1)'
  );
  const [doctorNotes, setDoctorNotes] = useState<string>(
    language === 'hi'
      ? 'मरीज़ नियमित रूप से सुबह की दवा ले रहे हैं। रक्तचाप 132/84 mmHg पर स्थिर है। भोजन में नमक कम करने, प्रतिदिन 30 मिनट टहलने और दवा जारी रखने की सलाह दी गई।'
      : 'Patient compliant with morning medication. Blood pressure is stable at 132/84 mmHg. Recommended reduction of dietary sodium, 30 min daily walking, and continuing dual antiplatelet therapy.'
  );
  
  // Prescription builder
  const [medicines, setMedicines] = useState<PrescriptionItem[]>([
    { name: 'Amlodipine 5mg', dosage: '1 Tablet', frequency: 'OD (Morning)', duration: '30 Days', instructions: 'Take with water after breakfast' },
    { name: 'Atorvastatin 10mg', dosage: '1 Tablet', frequency: 'OD (Night)', duration: '30 Days', instructions: 'Take at bedtime' },
    { name: 'Aspirin 75mg (EC)', dosage: '1 Tablet', frequency: 'OD (After Lunch)', duration: '30 Days', instructions: 'Take after meal' }
  ]);

  // Follow-up & Escalation
  const [followUpDate, setFollowUpDate] = useState<string>(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [followUpInstructions, setFollowUpInstructions] = useState<string>(
    language === 'hi'
      ? 'आशा कार्यकर्ता सुनीता द्वारा साप्ताहिक गृह-भेंट कर बीपी की जांच की जाए। यदि सिस्टोलिक > 145 हो या सीने में दर्द बढ़े तो तुरंत पीएचसी रेफ़र करें।'
      : 'ASHA Sunita to conduct weekly doorstep BP check. If systolic > 145 or chest pain worsens, refer immediately to PHC.'
  );
  const [referralNeeded, setReferralNeeded] = useState<boolean>(false);
  const [referralSpecialty, setReferralSpecialty] = useState<string>('Cardiology (2D Echo & Stress Test)');
  const [referralReason, setReferralReason] = useState<string>('Evaluation for persistent Grade 1 exertional angina and 2D Echocardiography.');

  // Modal / submission state
  const [completing, setCompleting] = useState<boolean>(false);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [completedTelecon, setCompletedTelecon] = useState<Teleconsultation | null>(null);

  // Common formulary quick recommendations for doctors
  const quickMedSuggestions = [
    { name: 'Paracetamol 500mg', dosage: '1 Tab', frequency: 'TDS (Thrice Daily)', duration: '5 Days', instructions: 'After food for fever/pain' },
    { name: 'Metformin 500mg', dosage: '1 Tab', frequency: 'BD (Morning & Night)', duration: '30 Days', instructions: 'With meals' },
    { name: 'Azithromycin 500mg', dosage: '1 Tab', frequency: 'OD (Once Daily)', duration: '5 Days', instructions: '1 hour before lunch' },
    { name: 'ORS Sachet', dosage: '1 Sachet in 1L water', frequency: 'SOS (As Needed)', duration: '3 Days', instructions: 'Sip throughout day' }
  ];

  // Call timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setCallSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const fetchTeleconDetails = async () => {
    setLoading(true);
    try {
      const res = await api.getTeleconsultation(teleconId);
      if (res.success && res.data) {
        setTelecon(res.data);
        if (res.data.patient) setPatient(res.data.patient);
        if (res.data.patient_history) setPatientHistory(res.data.patient_history);
        if (res.data.diagnosis) setDiagnosis(res.data.diagnosis);
        if (res.data.doctor_notes) setDoctorNotes(res.data.doctor_notes);
        if (res.data.medicines && res.data.medicines.length > 0) setMedicines(res.data.medicines);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeleconDetails();
  }, [teleconId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setMessages(prev => [
      ...prev,
      {
        sender: user?.name || (language === 'hi' ? 'डॉक्टर' : 'Doctor'),
        text: chatInput.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isDoctor: user?.role === 'phc' || user?.role === 'hospital'
      }
    ]);
    setChatInput('');
  };

  const handleAddMed = (med?: PrescriptionItem) => {
    if (med) {
      setMedicines(prev => [...prev, { ...med }]);
    } else {
      setMedicines(prev => [
        ...prev,
        { name: '', dosage: '1 Tablet', frequency: 'OD (Once Daily)', duration: '15 Days', instructions: 'Take with water after food' }
      ]);
    }
  };

  const handleRemoveMed = (index: number) => {
    setMedicines(prev => prev.filter((_, i) => i !== index));
  };

  const handleCompleteConsultation = async () => {
    if (!telecon) return;
    setCompleting(true);

    try {
      const res = await api.completeTeleconsultation(telecon.id, {
        doctor_notes: doctorNotes,
        diagnosis: diagnosis,
        medicines: medicines.filter(m => m.name.trim() !== ''),
        follow_up_date: followUpDate || undefined,
        follow_up_instructions: followUpInstructions || undefined,
        referral_needed: referralNeeded,
        referral_destination_id: 'FAC-DH-01',
        referral_specialty: referralSpecialty,
        referral_reason: referralReason,
        duration: formatTimer(callSeconds)
      });

      if (res.success) {
        setCompletedTelecon({
          ...telecon,
          status: 'Completed',
          diagnosis,
          doctor_notes: doctorNotes,
          medicines: medicines.filter(m => m.name.trim() !== ''),
          follow_up_date: followUpDate,
          duration: formatTimer(callSeconds),
          completed_at: new Date().toISOString()
        });
        setShowSummaryModal(true);
      } else {
        alert(res.message || (language === 'hi' ? 'परामर्श पूर्ण करने में त्रुटि' : 'Failed to complete consultation'));
      }
    } catch (err: any) {
      alert(err.message || (language === 'hi' ? 'नेटवर्क त्रुटि' : 'Error communicating with consultation engine'));
    } finally {
      setCompleting(false);
    }
  };

  if (loading || !telecon) {
    return (
      <div className="min-h-[550px] flex items-center justify-center bg-slate-950 text-white rounded-3xl border border-slate-800">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-300">{t('telecon_syncing')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 text-white rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col h-[calc(100vh-120px)] min-h-[700px]">
      
      {/* 1. Top Secure Session Bar */}
      <div className="bg-slate-900/95 px-5 py-3 border-b border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t('telecon_desk_title')}
              </span>
              <span className="font-mono text-[10px] text-slate-400">ID: {telecon.id}</span>
            </div>
            <h3 className="text-sm font-bold text-white truncate">
              {telecon.doctor_name} <span className="text-slate-400 font-normal">{language === 'hi' ? 'परामर्श' : 'consulting'}</span> {telecon.patient_name} ({telecon.patient_age}Y/{telecon.patient_gender})
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Call Duration Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full font-mono text-xs text-teal-300">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>{formatTimer(callSeconds)}</span>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-950/80 border border-emerald-700 text-emerald-300 rounded-full text-[11px] font-semibold">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            Live HD 1080p
          </span>
        </div>
      </div>

      {/* 2. Main Workspace Layout: Left Video Stream (7 cols) | Right Clinical Tabbed Desk (5 cols) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: HIGH DEFINITION VIDEO STREAM & MEDIA CONTROLS */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 xl:col-span-8 p-4 flex flex-col justify-between bg-slate-950 relative overflow-hidden">
          
          {/* Main Video Box */}
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-inner flex items-center justify-center">
            
            {/* Simulated Live Patient Video Stream */}
            <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
              
              {/* Patient Visual Avatar Feed */}
              <div className="text-center space-y-3 z-10 p-4">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-teal-900/40 border-2 border-teal-500/50 flex items-center justify-center mx-auto shadow-2xl relative">
                  <User className="w-14 h-14 sm:w-16 sm:h-16 text-teal-200" />
                  
                  {/* Simulated Audio Visualizer Waveforms */}
                  <div className="absolute -bottom-2 flex items-center gap-1 bg-slate-900/90 px-2 py-0.5 rounded-full border border-teal-500/40">
                    <span className="w-1 h-3 bg-teal-400 rounded-full animate-bounce"></span>
                    <span className="w-1 h-5 bg-teal-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-white">{telecon.patient_name}</h4>
                  <p className="text-xs text-teal-400">
                    {language === 'hi' ? 'गाँव' : 'Village'}: {telecon.patient_village} • ABHA: <span className="font-mono">{telecon.patient_abha || '91-8291-4920-1102'}</span>
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800/90 rounded-full text-xs text-slate-300 border border-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {t('telecon_connected_endpoint')}
                </div>
              </div>

              {/* Floating Real-Time Vitals HUD */}
              <div className="absolute top-4 left-4 bg-slate-900/85 backdrop-blur-md p-3 rounded-2xl border border-slate-700 text-xs space-y-1.5 shadow-lg">
                <div className="text-[10px] text-teal-400 font-bold uppercase flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                  {t('telecon_live_patient_feed')}
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[11px] text-slate-200">
                  <div>BP: <strong className="text-white">{telecon.current_vitals?.bp || '132/84 mmHg'}</strong></div>
                  <div>Pulse: <strong className="text-white">{telecon.current_vitals?.pulse || '74'} bpm</strong></div>
                  <div>SpO2: <strong className="text-emerald-400">{telecon.current_vitals?.spo2 || '99%'}</strong></div>
                  <div>Temp: <strong className="text-white">{telecon.current_vitals?.temp || '98.6 °F'}</strong></div>
                </div>
              </div>

              {/* Doctor Picture-in-Picture Stream */}
              <div className="absolute bottom-4 right-4 w-44 sm:w-52 h-32 sm:h-36 rounded-2xl overflow-hidden bg-slate-800/90 border-2 border-teal-500 shadow-2xl flex flex-col items-center justify-center backdrop-blur-sm">
                <div className="text-center p-2">
                  <div className="w-10 h-10 rounded-full bg-teal-800 flex items-center justify-center mx-auto mb-1 shadow-md">
                    <Stethoscope className="w-5 h-5 text-teal-200" />
                  </div>
                  <div className="text-xs font-bold text-white truncate max-w-[150px]">{telecon.doctor_name}</div>
                  <div className="text-[9px] text-teal-300">{language === 'hi' ? 'डॉक्टर वीडियो फीड (HD)' : 'Doctor Video Feed (HD)'}</div>
                </div>
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500 text-slate-950 text-[9px] font-bold rounded-full">
                  {t('telecon_speaking_badge')}
                </span>
              </div>

              {/* Floating Chat Drawer Trigger */}
              {showChatDrawer && (
                <div className="absolute inset-y-0 left-0 w-80 bg-slate-900/95 backdrop-blur-md border-r border-slate-700 p-4 flex flex-col justify-between z-20 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <span className="font-bold text-xs text-teal-300 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4" />
                      {t('telecon_in_call_chat')}
                    </span>
                    <button 
                      onClick={() => setShowChatDrawer(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      ✕ {t('close')}
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto py-3 space-y-2 text-xs">
                    {messages.map((m, i) => (
                      <div key={i} className={`p-2 rounded-xl ${m.isDoctor ? 'bg-teal-950/80 border border-teal-800' : 'bg-slate-800/80'}`}>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                          <span className="font-bold text-teal-300">{m.sender}</span>
                          <span>{m.time}</span>
                        </div>
                        <p className="text-slate-200">{m.text}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendMessage} className="flex gap-1.5 pt-2 border-t border-slate-700">
                    <input
                      type="text"
                      placeholder={t('telecon_chat_placeholder')}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}

            </div>
          </div>

          {/* Bottom Control Action Bar */}
          <div className="pt-3 flex items-center justify-between gap-3">
            
            {/* Left Media Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-2xl transition-all shadow-md flex items-center gap-1.5 text-xs font-bold ${
                  isMuted ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
                title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span className="hidden sm:inline">{isMuted ? (language === 'hi' ? 'म्यूट है' : 'Muted') : (language === 'hi' ? 'म्यूट करें' : 'Mute')}</span>
              </button>

              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`p-3 rounded-2xl transition-all shadow-md flex items-center gap-1.5 text-xs font-bold ${
                  isVideoOff ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
                title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
              >
                {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                <span className="hidden sm:inline">{isVideoOff ? (language === 'hi' ? 'कैमरा बंद' : 'Cam Off') : (language === 'hi' ? 'कैमरा' : 'Camera')}</span>
              </button>

              <button
                onClick={() => setShowChatDrawer(!showChatDrawer)}
                className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white transition-all shadow-md flex items-center gap-1.5 text-xs font-bold"
              >
                <MessageSquare className="w-4 h-4 text-teal-400" />
                <span className="hidden sm:inline">{language === 'hi' ? 'चैट' : 'Chat'}</span>
              </button>
            </div>

            {/* End Call & Sign Button */}
            <button
              onClick={handleCompleteConsultation}
              disabled={completing}
              className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-2 shadow-xl active:scale-95 transition-all text-xs"
            >
              <PhoneOff className="w-4 h-4" />
              <span>{completing ? t('telecon_signing_records') : t('telecon_sign_finish')}</span>
            </button>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: 5-TAB DOCTOR CLINICAL WORKSPACE */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 xl:col-span-4 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden text-xs">
          
          {/* Tabs Navigation Header */}
          <div className="bg-slate-850 p-2 border-b border-slate-800 grid grid-cols-5 gap-1 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`py-2 rounded-xl transition-all ${
                activeTab === 'notes' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('telecon_notes_tab')}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('prescription')}
              className={`py-2 rounded-xl transition-all ${
                activeTab === 'prescription' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('telecon_erx_tab')} ({medicines.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`py-2 rounded-xl transition-all ${
                activeTab === 'summary' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('telecon_profile_tab')}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`py-2 rounded-xl transition-all ${
                activeTab === 'history' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('telecon_history_tab')}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('followup')}
              className={`py-2 rounded-xl transition-all ${
                activeTab === 'followup' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('telecon_followup_tab')}
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* ========================================================================= */}
            {/* TAB 1: CLINICAL NOTES & DIAGNOSIS */}
            {/* ========================================================================= */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div className="p-3 bg-teal-950/40 border border-teal-800/80 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-teal-400 block">{t('telecon_reason_label')}</span>
                  <p className="text-white font-semibold">"{telecon.reason}"</p>
                  <p className="text-slate-400 text-[11px]">{telecon.symptoms}</p>
                </div>

                {/* Doctor Diagnosis Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-200">{t('telecon_dr_diagnosis')} *</label>
                    <span className="text-[10px] text-amber-400 font-medium">{language === 'hi' ? 'डॉक्टर द्वारा प्रविष्टि (कोई AI नहीं)' : 'Entered by Doctor (No AI)'}</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Essential Hypertension, Grade 1"
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                {/* Doctor Clinical Advice / Findings */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-200">{t('telecon_dr_notes')} *</label>
                  <textarea
                    rows={6}
                    required
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    placeholder={language === 'hi' ? 'शारीरिक जांच, अवलोकन, आहार व दैनिक सलाह दर्ज करें...' : 'Enter physical observations, examination results, dietary restrictions...'}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 text-[11px] text-slate-400">
                  💡 <strong>{language === 'hi' ? 'अनुपालन नोट:' : 'Compliance Note:'}</strong> {language === 'hi' ? 'यहाँ दर्ज सभी क्लिनिकल नोट्स व निदान डिजिटल हस्ताक्षरित होते हैं और मरीज़ के आभा (ABHA) रिकॉर्ड में सहेजे जाते हैं।' : 'All clinical notes and diagnoses entered here are signed digitally and recorded in the patient\'s Ayushman Bharat Health Account (ABHA) timeline.'}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: ELECTRONIC PRESCRIPTION (e-Rx BUILDER) */}
            {/* ========================================================================= */}
            {activeTab === 'prescription' && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-teal-400" />
                      {t('telecon_prescribed_meds')}
                    </h4>
                    <span className="text-[10px] text-slate-400">{t('telecon_dispense_note')}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddMed()}
                    className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'दवा जोड़ें' : 'Add Medicine'}</span>
                  </button>
                </div>

                {/* Quick suggestions chips */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block font-semibold">{t('telecon_formulary_quick_add')}</span>
                  <div className="flex flex-wrap gap-1">
                    {quickMedSuggestions.map((qm, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAddMed(qm)}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-teal-900 text-teal-300 rounded text-[10px] border border-slate-700"
                      >
                        + {qm.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Medicine Rows */}
                <div className="space-y-2.5">
                  {medicines.map((med, idx) => (
                    <div key={idx} className="p-3 bg-slate-800/90 rounded-xl border border-slate-700 space-y-2">
                      <div className="flex items-center justify-between gap-1.5">
                        <input
                          type="text"
                          placeholder="Medicine Name & Strength (e.g. Amlodipine 5mg)"
                          value={med.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMedicines(prev => prev.map((m, i) => i === idx ? { ...m, name: val } : m));
                          }}
                          className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveMed(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-400"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <div>
                          <span className="text-[9px] text-slate-400 block">{t('telecon_dosage_label')}</span>
                          <input
                            type="text"
                            placeholder="1 Tablet"
                            value={med.dosage}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMedicines(prev => prev.map((m, i) => i === idx ? { ...m, dosage: val } : m));
                            }}
                            className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                          />
                        </div>

                        <div>
                          <span className="text-[9px] text-slate-400 block">{t('telecon_frequency_label')}</span>
                          <input
                            type="text"
                            placeholder="OD (Morning)"
                            value={med.frequency}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMedicines(prev => prev.map((m, i) => i === idx ? { ...m, frequency: val } : m));
                            }}
                            className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                          />
                        </div>

                        <div>
                          <span className="text-[9px] text-slate-400 block">{t('telecon_duration_label')}</span>
                          <input
                            type="text"
                            placeholder="30 Days"
                            value={med.duration}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMedicines(prev => prev.map((m, i) => i === idx ? { ...m, duration: val } : m));
                            }}
                            className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] text-slate-400 block">{t('telecon_directions_label')}</span>
                        <input
                          type="text"
                          placeholder={language === 'hi' ? 'उदा. भोजन के बाद पानी के साथ' : 'e.g. Take with water after breakfast'}
                          value={med.instructions}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMedicines(prev => prev.map((m, i) => i === idx ? { ...m, instructions: val } : m));
                          }}
                          className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: PATIENT SUMMARY & ABHA */}
            {/* ========================================================================= */}
            {activeTab === 'summary' && (
              <div className="space-y-3.5">
                <div className="p-3.5 bg-slate-800 rounded-2xl border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{telecon.patient_name}</span>
                    <span className="text-teal-400 font-bold">{telecon.patient_age}Y / {telecon.patient_gender}</span>
                  </div>
                  <div className="text-slate-400 text-xs">
                    {language === 'hi' ? 'गाँव' : 'Village'}: <strong className="text-slate-200">{telecon.patient_village}</strong>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-between">
                    <span className="font-mono text-teal-300 font-bold">{telecon.patient_abha || '91-8291-4920-1102'}</span>
                    <span className="text-[10px] text-emerald-400 font-bold">ABHA Verified</span>
                  </div>
                </div>

                {patient && (
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('telecon_chronic_conditions')}</span>
                      <div className="font-semibold text-white mt-0.5">
                        {patient.chronic_conditions?.join(', ') || 'Hypertension, CAD'}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('telecon_known_allergies')}</span>
                      <div className="font-semibold text-rose-300 mt-0.5">
                        {patient.allergies?.join(', ') || (language === 'hi' ? 'कोई ज्ञात दवा एलर्जी नहीं' : 'No known drug allergies (NKDA)')}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('telecon_assigned_asha')}</span>
                      <div className="font-semibold text-white mt-0.5">
                        Sunita Ahirwar (Barkheda Village) • 9876543210
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: LONGITUDINAL HEALTH RECORD SNAPSHOT */}
            {/* ========================================================================= */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-teal-400" />
                  {t('telecon_recent_encounters')}
                </h4>

                {patientHistory.length === 0 ? (
                  <p className="text-slate-400 italic">{language === 'hi' ? 'कोई पिछला रिकॉर्ड नहीं मिला।' : 'No previous electronic records found.'}</p>
                ) : (
                  <div className="space-y-2.5">
                    {patientHistory.map((rec) => (
                      <div key={rec.id} className="p-3 bg-slate-800/90 rounded-xl border border-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{rec.diagnosis}</span>
                          <span className="text-[10px] text-slate-400">{formatDate(rec.record_date || rec.created_at)}</span>
                        </div>
                        <p className="text-slate-300 text-[11px] italic">"{rec.clinical_observations}"</p>
                        <div className="text-[10px] text-teal-400">{language === 'hi' ? 'दर्जकर्ता' : 'Recorded by'}: {rec.recorded_by_name} ({rec.facility_name})</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 5: FOLLOW-UP & COUNTER-REFERRAL */}
            {/* ========================================================================= */}
            {activeTab === 'followup' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-200 block">{t('telecon_next_followup')}</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-200 block">{t('telecon_doorstep_instructions')}</label>
                  <textarea
                    rows={3}
                    value={followUpInstructions}
                    onChange={(e) => setFollowUpInstructions(e.target.value)}
                    placeholder={language === 'hi' ? 'आशा कार्यकर्ता हेतु गृह-भेंट निर्देश (उदा. साप्ताहिक बीपी जांच)...' : 'Instructions for village ASHA worker (e.g. check weekly BP, monitor pill count)...'}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                  />
                </div>

                {/* Specialist Escalation Referral Checkbox */}
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={referralNeeded}
                      onChange={(e) => setReferralNeeded(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600 bg-slate-900 border-slate-600"
                    />
                    <span className="font-bold text-slate-200">{t('telecon_issue_referral')}</span>
                  </label>

                  {referralNeeded && (
                    <div className="space-y-2 pt-2 border-t border-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">{t('telecon_specialty_dept')}</span>
                        <input
                          type="text"
                          value={referralSpecialty}
                          onChange={(e) => setReferralSpecialty(e.target.value)}
                          className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">{t('telecon_clinical_justification')}</span>
                        <input
                          type="text"
                          value={referralReason}
                          onChange={(e) => setReferralReason(e.target.value)}
                          className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Bottom Complete CTA in Right Panel */}
          <div className="p-3 bg-slate-850 border-t border-slate-800">
            <button
              type="button"
              onClick={handleCompleteConsultation}
              disabled={completing}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{completing ? t('telecon_signing_records') : t('telecon_sign_complete_btn')}</span>
            </button>
          </div>

        </div>

      </div>

      {/* Official e-Sanjeevani Consultation Summary Slip Modal */}
      <ConsultationSummaryModal
        isOpen={showSummaryModal}
        onClose={() => {
          setShowSummaryModal(false);
          if (onCallEnded) onCallEnded();
          else navigate(-1);
        }}
        telecon={completedTelecon}
      />

    </div>
  );
};

export default VideoRoom;

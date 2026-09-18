import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';
import { 
  ShieldCheck, 
  Lock, 
  Phone, 
  KeyRound, 
  User, 
  ArrowRight, 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle 
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, quickDemoLogin, demoCredentials } = useAuth();
  const { t, language, tRole } = useLanguage();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [identifier, setIdentifier] = useState<string>('9876543210');
  const [password, setPassword] = useState<string>('password123');
  const [otp, setOtp] = useState<string>('');
  const [useOtp, setUseOtp] = useState<boolean>(true);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // When role changes, set reasonable default placeholder/identifier
  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
    const demo = demoCredentials.find(d => d.role === role);
    if (demo) {
      setIdentifier(demo.identifier);
      setPassword('password123');
    }
    if (role === 'patient') {
      setUseOtp(true);
    } else if (role === 'phc' || role === 'hospital' || role === 'admin') {
      setUseOtp(false);
    }
  };

  const handleSendOtp = () => {
    if (!identifier || identifier.length < 10) {
      setError(language === 'hi' ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile number');
      return;
    }
    setOtpSent(true);
    setOtp('123456'); // Simulated instant OTP fill for demo convenience
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await login({
        role: selectedRole,
        identifier: identifier.trim(),
        password: useOtp ? undefined : password,
        otp: useOtp ? otp : undefined
      });

      if (res.success) {
        // Navigate to exact role-specific dashboard path
        switch (selectedRole) {
          case 'patient': navigate('/patient/dashboard'); break;
          case 'asha': navigate('/asha/dashboard'); break;
          case 'phc': navigate('/phc/dashboard'); break;
          case 'hospital': navigate('/hospital/dashboard'); break;
          case 'admin': navigate('/admin/dashboard'); break;
          default: navigate('/');
        }
      } else {
        setError(res.message || (language === 'hi' ? 'लॉगिन विफल रहा। कृपया क्रेडेंशियल जांचें।' : 'Authentication failed. Please verify your role and credentials.'));
      }
    } catch (err: any) {
      setError(err.message || (language === 'hi' ? 'सर्वर कनेक्शन त्रुटि' : 'Server connection error'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    setLoading(true);
    const success = await quickDemoLogin(role);
    if (success) {
      switch (role) {
        case 'patient': navigate('/patient/dashboard'); break;
        case 'asha': navigate('/asha/dashboard'); break;
        case 'phc': navigate('/phc/dashboard'); break;
        case 'hospital': navigate('/hospital/dashboard'); break;
        case 'admin': navigate('/admin/dashboard'); break;
      }
    }
    setLoading(false);
  };

  const getRoleBadgeInfo = (role: UserRole) => {
    switch (role) {
      case 'patient':
        return { 
          label: language === 'hi' ? 'नागरिक स्वास्थ्य पोर्टल' : 'Citizen Portal', 
          desc: language === 'hi' ? '10-अंकों का मोबाइल या 14-अंकों की आभा आईडी से ओटीपी/पासवर्ड द्वारा प्रवेश' : 'ABDM ABHA ID or 10-digit mobile number login with OTP/password' 
        };
      case 'asha':
        return { 
          label: language === 'hi' ? 'फील्ड स्वास्थ्य दल' : 'Field Health Force', 
          desc: language === 'hi' ? 'ग्राम परिवार पंजी, घर पर वाइटल्स जांच व मातृ देखभाल' : 'Village household registry, doorstep vitals & ANC follow-ups' 
        };
      case 'phc':
        return { 
          label: language === 'hi' ? 'प्राथमिक स्वास्थ्य केंद्र' : 'Primary Healthcare', 
          desc: language === 'hi' ? 'ओपीडी क्लिनिकल डेस्क, टेली-परामर्श कतार व जिला अस्पताल रेफ़रल' : 'OPD clinical desk, teleconsultation queue & DH referrals' 
        };
      case 'hospital':
        return { 
          label: language === 'hi' ? 'माध्यमिक/तृतीयक जिला अस्पताल' : 'Secondary/Tertiary Hospital', 
          desc: language === 'hi' ? 'आवक रेफ़रल ट्राइएज, विशेषज्ञ स्लॉट व डिस्चार्ज काउंटर-रेफ़रल' : 'Inward referral triage, specialist slots & counter-referrals' 
        };
      case 'admin':
        return { 
          label: language === 'hi' ? 'जिला सीएमएचओ प्रशासन' : 'District CMO Mission', 
          desc: language === 'hi' ? 'जिले की 10 मुख्य सांख्यिकी, अस्पताल स्कोरकार्ड व दवा आपूर्ति' : 'District-wide disease surveillance, facility scorecards & supply chain' 
        };
    }
  };

  const getRoleTabLabel = (r: UserRole) => {
    if (language === 'hi') {
      switch (r) {
        case 'patient': return 'मरीज़';
        case 'asha': return 'आशा कार्यकर्ता';
        case 'phc': return 'पीएचसी (PHC)';
        case 'hospital': return 'जिला अस्पताल';
        case 'admin': return 'जिला प्रशासक';
      }
    }
    switch (r) {
      case 'patient': return 'Patient';
      case 'asha': return 'ASHA Worker';
      case 'phc': return 'PHC';
      case 'hospital': return 'District Hospital';
      case 'admin': return 'District Admin';
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Side: Branding & Rural Continuity Story */}
        <div className="lg:col-span-5 bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-teal-500/10 pointer-events-none blur-xl"></div>

          <div className="space-y-6 relative z-10">
            <Link to="/" className="inline-block group">
              <div className="bg-white p-2.5 rounded-2xl inline-flex items-center shadow-md group-hover:shadow-lg transition-all">
                <img 
                  src="/logo.png" 
                  alt={t('app_name')} 
                  className="h-12 sm:h-14 max-w-[200px] sm:max-w-[240px] w-auto object-contain" 
                />
              </div>
            </Link>

            <div>
              <div className="text-xs uppercase font-bold text-teal-300 tracking-wider">
                {language === 'hi' ? 'राष्ट्रीय डिजिटल स्वास्थ्य निरंतरता' : 'GOVERNMENT PUBLIC HEALTH CONTINUUM'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 leading-tight">
                {t('login_heading')}
              </h2>
              <p className="text-xs sm:text-sm text-teal-100/90 mt-3 leading-relaxed">
                {t('login_subheading')}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-teal-200">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>{language === 'hi' ? 'एकल जीवनकालिक स्वास्थ्य रिकॉर्ड' : 'Single Longitudinal Health Record'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-teal-200">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>{language === 'hi' ? 'रीयल-टाइम 9-चरणीय बंद-लूप रेफ़रल' : 'Real-Time Closed-Loop Referral Tracking'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-teal-200">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>{language === 'hi' ? 'पारदर्शी बहु-स्तरीय दवा भंडार' : 'Multi-Facility Medicine Inventory'}</span>
              </div>
            </div>
          </div>

          {/* SIH 2026 Tag */}
          <div className="mt-8 pt-6 border-t border-teal-700/60 flex items-center justify-between text-[11px] text-teal-300 relative z-10">
            <span>{t('footer_sih_tag')}</span>
            <span className="font-mono">v1.0 (Bhopal)</span>
          </div>
        </div>

        {/* Right Side: Common Login Card */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-6">
          
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {language === 'hi' ? 'सुरक्षित पोर्टल प्रमाणीकरण' : 'Portal Authentication'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'hi' ? 'अधिकृत स्वास्थ्य सेवाओं के लिए अपनी भूमिका चुनें' : 'Select your role to access authorized health workflows'}
            </p>
          </div>

          {/* "LOGIN AS" Role Selector Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-slate-800 tracking-wider">
                {t('login_as')}
              </label>
              <span className="text-[11px] font-bold text-teal-700">
                {getRoleBadgeInfo(selectedRole).label}
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-semibold">
              {(['patient', 'asha', 'phc', 'hospital', 'admin'] as UserRole[]).map((r) => {
                const isSelected = selectedRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleChange(r)}
                    className={`py-2 px-1 rounded-xl transition-all text-center leading-tight ${
                      isSelected
                        ? 'bg-teal-700 text-white shadow-xs font-bold ring-2 ring-teal-500/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                    }`}
                  >
                    {getRoleTabLabel(r)}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 italic pl-1">
              {getRoleBadgeInfo(selectedRole).desc}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Identifier input */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {selectedRole === 'patient' 
                  ? t('login_id_label') 
                  : (selectedRole === 'asha' 
                      ? (language === 'hi' ? 'आशा कार्यकर्ता आईडी / मोबाइल' : 'ASHA Worker ID / Mobile') 
                      : (selectedRole === 'phc' 
                          ? (language === 'hi' ? 'पीएचसी केंद्र कोड / आईडी' : 'PHC Facility ID') 
                          : (selectedRole === 'hospital' 
                              ? (language === 'hi' ? 'जिला अस्पताल कोड / आईडी' : 'Hospital ID') 
                              : (language === 'hi' ? 'प्रशासक आईडी' : 'Admin ID'))))} *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder={selectedRole === 'patient' 
                    ? t('login_id_placeholder_patient') 
                    : (selectedRole === 'asha' 
                        ? t('login_id_placeholder_asha') 
                        : (selectedRole === 'phc' 
                            ? t('login_id_placeholder_phc') 
                            : (selectedRole === 'hospital' 
                                ? t('login_id_placeholder_hospital') 
                                : t('login_id_placeholder_admin'))))}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Auth Method: OTP or Password */}
            {selectedRole === 'patient' || (selectedRole === 'asha' && useOtp) ? (
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">{t('login_otp_label')} *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      maxLength={6}
                      placeholder={t('login_otp_placeholder')}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="px-3.5 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-xl border border-teal-200 whitespace-nowrap transition-colors"
                  >
                    {otpSent ? t('login_resend_otp') : t('login_send_otp')}
                  </button>
                </div>
                {otpSent && (
                  <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {language === 'hi' ? 'डेमो ओटीपी (123456) स्वतः भर दिया गया है। लॉगिन पर क्लिक करें।' : 'Demo OTP (123456) filled automatically. Click Login.'}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="font-bold text-slate-700 block mb-1">{t('login_password_label')} *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder={t('login_password_placeholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Remember Me & Help */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                />
                <span>{language === 'hi' ? 'इस टर्मिनल को याद रखें' : 'Remember this terminal'}</span>
              </label>

              <button
                type="button"
                onClick={() => alert(language === 'hi' ? 'डेमो सहायता: पासवर्ड password123 या ओटीपी 123456 का उपयोग करें, अथवा नीचे दिए गए त्वरित डेमो प्रोफाइल पर क्लिक करें।' : 'Demo Help: Use password123 or OTP 123456 for any demo role, or click the quick demo profiles below.')}
                className="text-teal-700 hover:underline font-semibold flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {language === 'hi' ? 'सहायता / डेमो निर्देश' : 'Help / Demo Docs'}
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>
                {loading 
                  ? t('login_submitting') 
                  : (language === 'hi' 
                      ? `${getRoleTabLabel(selectedRole)} के रूप में लॉगिन करें` 
                      : `Login as ${selectedRole.toUpperCase()}`)}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Demo Logins for Judges */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                {t('login_demo_profiles_title')}:
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {demoCredentials.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => handleQuickLogin(d.role)}
                  className="p-2 bg-slate-50 hover:bg-teal-50 text-slate-800 hover:text-teal-900 border border-slate-200 hover:border-teal-300 rounded-xl text-left transition-all group"
                >
                  <div className="font-bold text-xs group-hover:text-teal-700">
                    {language === 'hi' ? tRole(d.role) : d.roleLabel}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{d.name}</div>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

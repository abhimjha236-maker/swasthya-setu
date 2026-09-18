import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserRole } from '../../types';
import { Zap, RotateCcw, Check } from 'lucide-react';
import { api } from '../../services/api';

export const DemoSwitcherBar: React.FC = () => {
  const { user, quickDemoLogin, demoCredentials } = useAuth();
  const { t, tRole } = useLanguage();
  const [switchingRole, setSwitchingRole] = useState<string | null>(null);
  const [resetting, setResetting] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSwitch = async (role: UserRole) => {
    setSwitchingRole(role);
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
    setSwitchingRole(null);
  };

  const handleReset = async () => {
    if (confirm(t('reset_confirm_prompt', 'Reset database back to default Bhopal District demonstration dataset?'))) {
      setResetting(true);
      try {
        await api.resetDemoData();
        setResetSuccess(true);
        setTimeout(() => {
          setResetSuccess(false);
          window.location.reload();
        }, 1200);
      } catch (err) {
        console.error(err);
      } finally {
        setResetting(false);
      }
    }
  };

  const roleColors: Record<UserRole, string> = {
    patient: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    asha: 'bg-pink-600 hover:bg-pink-700 text-white',
    phc: 'bg-teal-700 hover:bg-teal-800 text-white',
    hospital: 'bg-blue-700 hover:bg-blue-800 text-white',
    admin: 'bg-slate-800 hover:bg-slate-900 text-white'
  };

  return (
    <div className="bg-slate-900 text-slate-100 py-1.5 px-4 text-xs shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-amber-400 font-bold uppercase tracking-wider text-[10px] bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
            <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>{t('sih_badge', 'SIH 2026 Evaluator Quick Switch')}</span>
          </div>
          <span className="hidden sm:inline text-slate-400 text-[11px]">
            {t('active_user_badge', 'Active')}: <strong className="text-white">{user ? tRole(user.role) : 'Guest'} ({user?.name || 'Not logged in'})</strong>
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-1.5">
          {demoCredentials.map((cred) => {
            const isActive = user?.role === cred.role;
            return (
              <button
                key={cred.role}
                onClick={() => handleSwitch(cred.role)}
                disabled={switchingRole !== null}
                title={`${cred.name} (${cred.badge})`}
                className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-all flex items-center gap-1 ${
                  isActive
                    ? 'ring-2 ring-amber-400 shadow-sm font-bold ' + roleColors[cred.role]
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                {isActive && <Check className="w-3 h-3 text-amber-300" />}
                <span>{tRole(cred.role)}</span>
              </button>
            );
          })}

          <button
            onClick={handleReset}
            disabled={resetting}
            title={t('reset_demo_btn', 'Reset database to fresh Bhopal District dataset')}
            className="ml-2 px-2.5 py-1 bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 text-slate-400 border border-slate-700 rounded-md transition-all flex items-center gap-1 text-[11px]"
          >
            <RotateCcw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetSuccess ? t('reset_complete', 'Reset Complete!') : t('reset_demo_btn', 'Reset Demo Data')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

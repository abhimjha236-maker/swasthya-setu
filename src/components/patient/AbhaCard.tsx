import React, { useState } from 'react';
import { Patient } from '../../types';
import { ShieldCheck, CheckCircle2, CreditCard, Sparkles } from 'lucide-react';
import { formatCurrencyINR } from '../../utils/formatters';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

interface AbhaCardProps {
  patient: Patient;
  onRefresh?: () => void;
}

export const AbhaCard: React.FC<AbhaCardProps> = ({ patient, onRefresh }) => {
  const [linking, setLinking] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const { t } = useLanguage();

  const handleLinkAbha = async () => {
    setLinking(true);
    try {
      const res = await api.linkAbha(patient.id, {});
      if (res.success && onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-teal-700/50">
      {/* Subtle background national health patterns */}
      <div className="absolute -right-12 -bottom-12 w-56 h-56 rounded-full bg-teal-500/10 pointer-events-none blur-2xl"></div>
      <div className="absolute right-6 top-6 opacity-10 pointer-events-none">
        <ShieldCheck className="w-36 h-36" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md p-1.5 flex items-center justify-center border border-white/20">
            <ShieldCheck className="w-full h-full text-teal-300" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-teal-300">
              NATIONAL HEALTH AUTHORITY
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Ayushman Bharat Digital Mission (ABDM)
            </h3>
          </div>
        </div>

        {patient.abha_linked ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-500/20 text-teal-200 border border-teal-400/30 rounded-full text-xs font-semibold backdrop-blur-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-300" />
            ABHA Verified
          </span>
        ) : (
          <button
            onClick={handleLinkAbha}
            disabled={linking}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-full text-xs shadow-md transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {linking ? t('saving', 'Linking...') : t('patient_link_abha', 'Generate ABHA')}
          </button>
        )}
      </div>

      {/* Card Details */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
        <div className="sm:col-span-2 space-y-3">
          <div>
            <span className="text-[11px] text-teal-200 uppercase tracking-wider">
              {t('form_patient_name', 'Patient Name')}
            </span>
            <div className="text-lg font-bold text-white leading-snug">{patient.name}</div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-teal-300 uppercase">
                {t('form_patient_age', 'Age')} / {t('form_patient_gender', 'Gender')}
              </span>
              <div className="font-semibold text-slate-100">{patient.age} Yrs / {patient.gender}</div>
            </div>
            <div>
              <span className="text-[10px] text-teal-300 uppercase">
                {t('form_patient_blood_group', 'Blood Group')}
              </span>
              <div className="font-semibold text-slate-100">{patient.blood_group}</div>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-teal-300 uppercase tracking-wider">
              {t('patient_abha_id', '14-Digit ABHA Number')}
            </span>
            <div className="text-base sm:text-lg font-mono font-bold tracking-widest text-teal-100">
              {patient.abha_id || 'Pending ABDM Linking'}
            </div>
            {patient.abha_address && (
              <div className="text-xs font-mono text-teal-300 mt-0.5">{patient.abha_address}</div>
            )}
          </div>
        </div>

        {/* QR Code & PM-JAY badge */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-2 sm:pt-0">
          <div 
            onClick={() => setShowQrModal(true)}
            className="bg-white p-2.5 rounded-xl shadow-lg cursor-pointer hover:scale-105 transition-transform"
            title="Scan ABHA QR for rapid OPD registration"
          >
            {/* High fidelity SVG QR pattern */}
            <svg className="w-16 h-16 text-slate-900" viewBox="0 0 100 100" fill="currentColor">
              <rect x="0" y="0" width="30" height="30" rx="4" fill="#0F172A" />
              <rect x="6" y="6" width="18" height="18" rx="2" fill="white" />
              <rect x="10" y="10" width="10" height="10" fill="#0F172A" />
              
              <rect x="70" y="0" width="30" height="30" rx="4" fill="#0F172A" />
              <rect x="76" y="6" width="18" height="18" rx="2" fill="white" />
              <rect x="80" y="10" width="10" height="10" fill="#0F172A" />

              <rect x="0" y="70" width="30" height="30" rx="4" fill="#0F172A" />
              <rect x="6" y="76" width="18" height="18" rx="2" fill="white" />
              <rect x="10" y="80" width="10" height="10" fill="#0F172A" />

              <rect x="40" y="10" width="8" height="12" fill="#0F172A" />
              <rect x="52" y="10" width="10" height="8" fill="#0F172A" />
              <rect x="40" y="40" width="20" height="20" rx="2" fill="#0D9488" />
              <rect x="70" y="45" width="12" height="12" fill="#0F172A" />
              <rect x="45" y="70" width="15" height="10" fill="#0F172A" />
              <rect x="70" y="75" width="20" height="15" fill="#0F172A" />
            </svg>
            <div className="text-[9px] text-center text-slate-600 font-bold mt-1">Scan & Share</div>
          </div>
        </div>
      </div>

      {/* Footer Banner: PM-JAY Ayushman Card */}
      <div className="mt-5 pt-4 border-t border-teal-700/50 flex flex-wrap items-center justify-between gap-2 text-xs relative z-10">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-amber-300" />
          <span className="text-slate-200">
            Ayushman Bharat PM-JAY: <strong className="text-amber-300">{patient.ayushman_pmjay_id || 'PMJAY-ACTIVE'}</strong>
          </span>
        </div>
        <div className="text-slate-200 font-medium">
          {t('patient_pmjay_balance', 'Health Cover')}: <span className="text-emerald-300 font-bold">{formatCurrencyINR(patient.pmjay_wallet_balance || 500000)} / Year</span>
        </div>
      </div>
    </div>
  );
};

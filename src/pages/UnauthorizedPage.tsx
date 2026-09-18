import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ShieldAlert, LogOut, Lock, Home, UserCheck } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { t, tRole } = useLanguage();
  const navigate = useNavigate();

  const getAuthorizedDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'patient': return '/patient/dashboard';
      case 'asha': return '/asha/dashboard';
      case 'phc': return '/phc/dashboard';
      case 'hospital': return '/hospital/dashboard';
      case 'admin': return '/admin/dashboard';
      default: return '/';
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl p-6 sm:p-10 max-w-xl w-full text-center space-y-6 relative overflow-hidden">
        
        {/* Top Warning Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600"></div>

        {/* Shield Icon Container */}
        <div className="w-20 h-20 rounded-3xl bg-rose-50 border-2 border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-10 h-10" />
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-mono font-bold">
            <Lock className="w-3.5 h-3.5" />
            HTTP 403 • ACCESS RESTRICTED
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('unauthorized_title', 'Role Authorization Required')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            {t('unauthorized_desc', 'You do not possess the necessary clinical or administrative credentials to access this protected healthcare route.')}
          </p>
        </div>

        {/* Current Identity Box */}
        {user ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                {t('unauthorized_role_current', 'Your Current Identity')}
              </span>
              <span className="px-2 py-0.5 bg-slate-200 text-slate-800 font-bold rounded text-[10px] uppercase">
                {user.role}
              </span>
            </div>
            <div className="font-bold text-slate-900 text-sm">{user.name}</div>
            <div className="text-slate-500">
              {t('actions', 'Role Authority')}: <strong className="text-teal-800">{tRole(user.role)}</strong>
            </div>
            <div className="text-slate-400 text-[11px] pt-1 border-t border-slate-200/60 flex items-center justify-between">
              <span>ID: {user.identifier || user.id}</span>
              {user.assigned_village && <span>{t('asha_village', 'Village')}: {user.assigned_village}</span>}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-medium">
            {t('unauthorized_guest', 'No active session detected. Please authenticate through the official government portal.')}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          {user && (
            <Link
              to={getAuthorizedDashboardPath()}
              className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Home className="w-4 h-4" />
              <span>{t('unauthorized_return_dashboard', 'Return to My Dashboard')}</span>
            </Link>
          )}

          <Link
            to="/login"
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
          >
            <UserCheck className="w-4 h-4 text-teal-600" />
            <span>{t('unauthorized_relogin', 'Switch Role / Login')}</span>
          </Link>

          {user && (
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="w-full sm:w-auto px-4 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('logout', 'Logout')}</span>
            </button>
          )}
        </div>

        {/* SIH Note */}
        <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          Swasthya Setu Security Subsystem • Role-Based Access Control (RBAC) Enforced
        </div>

      </div>
    </div>
  );
};

export default UnauthorizedPage;

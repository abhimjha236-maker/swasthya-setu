import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Bell, Globe, LogOut, UserCircle, Shield, Activity, PhoneCall, Building2, Stethoscope } from 'lucide-react';
import { NotificationDrawer } from './NotificationDrawer';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(2);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleDashboardLink = () => {
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

  const getRoleIcon = () => {
    if (!user) return null;
    switch (user.role) {
      case 'patient': return <Activity className="w-3.5 h-3.5 text-emerald-600" />;
      case 'asha': return <UserCircle className="w-3.5 h-3.5 text-pink-600" />;
      case 'phc': return <Stethoscope className="w-3.5 h-3.5 text-teal-600" />;
      case 'hospital': return <Building2 className="w-3.5 h-3.5 text-blue-600" />;
      case 'admin': return <Shield className="w-3.5 h-3.5 text-slate-700" />;
    }
  };

  const roleLabelMap: Record<string, string> = {
    patient: t('patient_portal'),
    asha: t('asha_desk'),
    phc: t('phc_desk'),
    hospital: t('hospital_desk'),
    admin: t('admin_desk')
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3 group py-1">
                <img 
                  src="/logo.png" 
                  alt={t('app_name')} 
                  className="h-10 sm:h-12 max-w-[180px] sm:max-w-[220px] w-auto object-contain transition-transform group-hover:scale-102" 
                />
              </Link>
            </div>

            {/* Navigation & Actions */}
            <div className="flex items-center gap-3 sm:gap-4">
              
              {/* Language Selector */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    language === 'en' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('hi')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    language === 'hi' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  हिंदी
                </button>
              </div>

              {isAuthenticated && user ? (
                <>
                  {/* Notifications Bell */}
                  <button
                    onClick={() => setIsNotifOpen(true)}
                    className="p-2 text-slate-500 hover:text-teal-700 hover:bg-teal-50/60 rounded-xl relative transition-colors"
                    title={t('notifications')}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-soft-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Active Role Dashboard Button */}
                  <Link
                    to={getRoleDashboardLink()}
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-teal-300 rounded-xl text-xs text-slate-800 transition-all hover:bg-teal-50/40"
                  >
                    {getRoleIcon()}
                    <div className="text-left">
                      <div className="font-bold leading-none text-slate-900">{roleLabelMap[user.role] || user.role}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{user.name}</div>
                    </div>
                  </Link>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    title={t('logout')}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs shadow-sm hover:shadow transition-all flex items-center gap-1.5"
                  >
                    <span>{t('login')}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Notification Drawer Component */}
      <NotificationDrawer 
        isOpen={isNotifOpen} 
        onClose={() => setIsNotifOpen(false)} 
        onCountUpdate={(cnt) => setUnreadCount(cnt)}
      />
    </>
  );
};

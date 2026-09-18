import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, X, AlertTriangle, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { NotificationItem } from '../../types';
import { api } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCountUpdate?: (count: number) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose, onCountUpdate }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.data);
        if (onCountUpdate) {
          onCountUpdate(res.unread_count);
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, linkUrl?: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      if (linkUrl) {
        onClose();
        navigate(linkUrl);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      if (onCountUpdate) onCountUpdate(0);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-100">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">
                {t('notifications_title', 'System Alerts & Notifications')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('tagline', 'Real-time public health updates')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              title={t('notifications_mark_all_read', 'Mark all as read')}
              className="p-1.5 text-xs text-teal-700 hover:bg-teal-50 rounded flex items-center gap-1 font-medium"
            >
              <CheckCheck className="w-4 h-4" />
              <span className="hidden sm:inline">{t('notifications_mark_all_read', 'Mark all')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">{t('loading', 'Loading data...')}</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              {t('notifications_empty', 'No new notifications')}
            </div>
          ) : (
            notifications.map((notif) => {
              const icon = notif.type === 'alert' || notif.type === 'warning' 
                ? <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                : notif.type === 'success'
                ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                : <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif.id, notif.link_url)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    notif.is_read
                      ? 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100/80'
                      : 'bg-teal-50/40 border-teal-200 text-slate-900 hover:bg-teal-50 font-medium shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {icon}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold truncate">{notif.title}</h4>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0"></span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notif.message}</p>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/40 text-[10px] text-slate-400">
                        <span>{formatDateTime(notif.created_at)}</span>
                        {notif.link_url && (
                          <span className="text-teal-700 font-semibold flex items-center gap-0.5">
                            {t('view_details', 'Open')} <ArrowRight className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

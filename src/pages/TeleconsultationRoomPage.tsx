import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VideoRoom } from '../components/telecon/VideoRoom';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft } from 'lucide-react';

export const TeleconsultationRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('telecon_exit_room')}</span>
        </button>
      </div>

      <VideoRoom teleconId={id || 'TELE-2026-0042'} onCallEnded={() => navigate(-1)} />
    </div>
  );
};

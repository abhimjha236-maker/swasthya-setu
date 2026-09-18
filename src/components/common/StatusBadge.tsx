import React from 'react';
import { getStatusBadgeClass, getPriorityBadgeClass } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';

interface StatusBadgeProps {
  status: string;
  isPriority?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isPriority = false, className = '' }) => {
  const { tStatus, tPriority } = useLanguage();
  const badgeClass = isPriority ? getPriorityBadgeClass(status) : getStatusBadgeClass(status);
  const localizedLabel = isPriority ? tPriority(status) : tStatus(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClass} ${className}`}>
      {localizedLabel}
    </span>
  );
};

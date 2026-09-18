export const formatAbhaId = (abha?: string | null): string => {
  if (!abha) return 'Not Linked';
  return abha;
};

export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString?: string | null): string => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

export const formatCurrencyINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const getStatusBadgeClass = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'created':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'accepted':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'appointment scheduled':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'in transit':
      return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
    case 'arrived':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'consultation completed':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'treatment completed':
    case 'closed':
    case 'completed':
    case 'available':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'follow-up required':
    case 'low stock':
    case 'pending':
    case 'urgent':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'emergency':
    case 'out of stock':
    case 'rejected':
    case 'overdue':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export const getPriorityBadgeClass = (priority: string): string => {
  switch (priority.toLowerCase()) {
    case 'emergency':
      return 'bg-rose-100 text-rose-800 border-rose-300 font-semibold';
    case 'urgent':
    case 'high':
      return 'bg-amber-100 text-amber-800 border-amber-300 font-medium';
    case 'routine':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

import { en, TranslationKey } from './en';
import { hi } from './hi';

export type Language = 'en' | 'hi';

export const translations = {
  en,
  hi
};

export { en, hi };
export type { TranslationKey };

// Status Translation Engine
export const translateStatus = (status: string, lang: Language): string => {
  if (!status) return '';
  if (lang === 'en') return status;

  const s = status.trim().toLowerCase();
  switch (s) {
    case 'created':
      return 'बनाया गया';
    case 'accepted':
      return 'स्वीकृत';
    case 'appointment scheduled':
      return 'अपॉइंटमेंट निर्धारित';
    case 'in transit':
      return 'रास्ते में';
    case 'arrived':
      return 'पहुंच गया';
    case 'consultation completed':
      return 'परामर्श पूरा हुआ';
    case 'treatment completed':
      return 'उपचार पूरा हुआ';
    case 'follow-up required':
    case 'followup required':
      return 'फॉलो-अप आवश्यक';
    case 'closed':
      return 'बंद / पूर्ण';
    case 'in queue':
      return 'कतार में';
    case 'in progress':
      return 'प्रगति पर';
    case 'completed':
      return 'पूर्ण';
    case 'pending':
      return 'लंबित';
    case 'cancelled':
      return 'रद्द';
    case 'available':
      return 'उपलब्ध';
    case 'low stock':
      return 'कम स्टॉक';
    case 'out of stock':
      return 'स्टॉक समाप्त';
    case 'near expiry':
      return 'समाप्ति निकट';
    case 'overdue':
      return 'अतिदेय (विलंबित)';
    default:
      return status;
  }
};

// Priority Translation Engine
export const translatePriority = (priority: string, lang: Language): string => {
  if (!priority) return '';
  if (lang === 'en') return priority.charAt(0).toUpperCase() + priority.slice(1);

  const p = priority.trim().toLowerCase();
  switch (p) {
    case 'routine':
      return 'सामान्य';
    case 'urgent':
    case 'high':
      return 'जरूरी / तत्काल';
    case 'emergency':
    case 'critical':
      return 'आपातकालीन';
    default:
      return priority;
  }
};

// Stock Status Translation Engine
export const translateStockStatus = (status: string, lang: Language): string => {
  if (!status) return '';
  if (lang === 'en') return status;

  const s = status.trim().toLowerCase();
  switch (s) {
    case 'available':
      return 'उपलब्ध';
    case 'low stock':
      return 'कम स्टॉक';
    case 'out of stock':
      return 'स्टॉक समाप्त';
    case 'near expiry':
      return 'समाप्ति निकट';
    default:
      return status;
  }
};

// Role Translation Engine
export const translateRole = (role: string, lang: Language): string => {
  if (!role) return '';
  const r = role.trim().toLowerCase();
  if (lang === 'en') {
    switch (r) {
      case 'patient': return 'Patient';
      case 'asha': return 'ASHA Worker';
      case 'phc': return 'PHC Medical Officer';
      case 'hospital': return 'District Hospital Specialist';
      case 'admin': return 'District Administrator (CMHO)';
      default: return role;
    }
  }

  switch (r) {
    case 'patient': return 'मरीज़ (Patient)';
    case 'asha': return 'आशा कार्यकर्ता (ASHA)';
    case 'phc': return 'प्राथमिक स्वास्थ्य केंद्र (PHC)';
    case 'hospital': return 'जिला अस्पताल (Hospital)';
    case 'admin': return 'जिला मुख्य चिकित्सा अधिकारी (CMHO)';
    default: return role;
  }
};

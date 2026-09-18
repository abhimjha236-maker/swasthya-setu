import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Language, 
  translations, 
  TranslationKey, 
  translateStatus, 
  translatePriority, 
  translateStockStatus, 
  translateRole 
} from '../locales';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  tStatus: (status: string) => string;
  tPriority: (priority: string) => string;
  tStockStatus: (status: string) => string;
  tRole: (role: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('swasthya_setu_lang');
      return (saved === 'hi' || saved === 'en') ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('swasthya_setu_lang', lang);
      document.documentElement.lang = lang;
    } catch (e) {
      console.error('Failed to persist language preference', e);
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, fallback?: string): string => {
    if (!key) return fallback || '';
    const dict = translations[language] || translations.en;
    const value = (dict as any)[key];
    if (value !== undefined) return value;
    const enValue = (translations.en as any)[key];
    if (enValue !== undefined) return enValue;
    return fallback !== undefined ? fallback : key;
  };

  const tStatus = (status: string): string => {
    return translateStatus(status, language);
  };

  const tPriority = (priority: string): string => {
    return translatePriority(priority, language);
  };

  const tStockStatus = (status: string): string => {
    return translateStockStatus(status, language);
  };

  const tRole = (role: string): string => {
    return translateRole(role, language);
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      tStatus,
      tPriority,
      tStockStatus,
      tRole
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

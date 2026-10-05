import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, Translations } from './types.ts';
import { zhTranslations } from './locales/zh.ts';
import { enTranslations } from './locales/en.ts';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('mmwave_lab_language');
      if (saved === 'en' || saved === 'zh') return saved;
    } catch {}
    // Default to Chinese as requested by user
    return 'zh';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('mmwave_lab_language', lang);
    } catch {}
  };

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  const t = language === 'zh' ? zhTranslations : enTranslations;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

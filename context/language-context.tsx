// context/language-context.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDictionary, Language, Dictionary } from '@/lib/dictionaries/teams';

interface LanguageContextType {
  language: Language;
  dictionary: Dictionary;
  setLanguage: (lang: Language) => void;
  formatNumber: (num: number) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (date: Date) => string;
  getTimeAgo: (date: Date) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [dictionary, setDictionary] = useState<Dictionary>(getDictionary('en'));

  // Load saved language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('nrb-talents-language') as Language;
    if (savedLang && ['en', 'fr', 'ar'].includes(savedLang)) {
      setLanguage(savedLang);
      setDictionary(getDictionary(savedLang));
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    setDictionary(getDictionary(lang));
    localStorage.setItem('nrb-talents-language', lang);
  };

  const formatNumber = (num: number) => {
    const locales: Record<Language, string> = {
      en: 'en-US',
      fr: 'fr-FR',
      ar: 'ar-SA'
    };
    return new Intl.NumberFormat(locales[language] || 'en-US').format(num);
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    const locales: Record<Language, string> = {
      en: 'en-US',
      fr: 'fr-FR',
      ar: 'ar-SA'
    };
    
    const formatter = new Intl.NumberFormat(locales[language] || 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    
    return formatter.format(amount);
  };

  const formatDate = (date: Date) => {
    const locales: Record<Language, string> = {
      en: 'en-US',
      fr: 'fr-FR',
      ar: 'ar-SA'
    };
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    
    return new Date(date).toLocaleDateString(locales[language] || 'en-US', options);
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (language === 'en') {
      if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }
    
    if (language === 'fr') {
      if (diffDays > 0) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
      if (diffHours > 0) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
      return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    }
    
    if (language === 'ar') {
      if (diffDays > 0) return `منذ ${diffDays} يوم${diffDays > 1 ? 'اً' : ''}`;
      if (diffHours > 0) return `منذ ${diffHours} ساعة${diffHours > 1 ? 'ات' : ''}`;
      return `منذ ${diffMinutes} دقيقة${diffMinutes > 1 ? 'ات' : ''}`;
    }
    
    return '';
  };

  const value = {
    language,
    dictionary,
    setLanguage: handleSetLanguage,
    formatNumber,
    formatCurrency,
    formatDate,
    getTimeAgo
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
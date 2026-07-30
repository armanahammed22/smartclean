"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import bn from '@/locales/bn.json';
import en from '@/locales/en.json';

type Language = 'bn' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, any> = { bn, en };

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Default to Bangla ('bn') as per requirement
  const [language, setLanguageState] = useState<Language>('bn');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('app_lang');
    if (saved === 'en' || saved === 'bn') {
      setLanguageState(saved as Language);
    } else {
      setLanguageState('bn');
    }
    setMounted(true);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_lang', lang);
  }, []);

  /**
   * 🛡️ Resilient Translation Engine
   * Logic: Target Language -> Bangla Fallback -> Humanized Key
   */
  const t = useCallback((key: string) => {
    if (!key) return '';
    
    const keys = key.split('.');
    
    // 1. Try Target Language
    let value = translations[language];
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }

    // 2. Fallback to Bangla ('bn') if missing in English or undefined
    if (typeof value !== 'string' || value === '') {
      let fallbackValue = translations['bn'];
      for (const k of keys) {
        if (fallbackValue && fallbackValue[k]) {
          fallbackValue = fallbackValue[k];
        } else {
          fallbackValue = undefined;
          break;
        }
      }
      if (typeof fallbackValue === 'string' && fallbackValue !== '') return fallbackValue;
    }

    // 3. Last Resort: Show human-readable string instead of the raw key ID
    if (typeof value !== 'string' || value === '') {
      const lastKey = keys[keys.length - 1];
      return lastKey
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '); 
    }
    
    return value;
  }, [language]);

  const value = React.useMemo(() => ({
    language,
    setLanguage,
    t
  }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    return {
      language: 'bn' as Language,
      setLanguage: () => {},
      t: (key: string) => {
        if (!key) return '';
        const parts = key.split('.');
        return parts[parts.length - 1].replace(/_/g, ' ').toUpperCase();
      }
    };
  }
  return context;
}

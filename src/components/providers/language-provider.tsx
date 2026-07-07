
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
  const [language, setLanguageState] = useState<Language>('bn');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('app_lang');
    if (saved === 'en' || saved === 'bn') {
      setLanguageState(saved as Language);
    }
    setMounted(true);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_lang', lang);
  }, []);

  /**
   * 🛡️ Improved Translation Function with Resilient Fallback
   */
  const t = useCallback((key: string) => {
    const keys = key.split('.');
    
    // 1. Try to find key in current language
    let value = translations[language];
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }

    // 2. Resilient Fallback: If not found in current, try Bangla (Default)
    if (typeof value !== 'string') {
      let fallbackValue = translations['bn'];
      for (const k of keys) {
        if (fallbackValue && fallbackValue[k]) {
          fallbackValue = fallbackValue[k];
        } else {
          fallbackValue = undefined;
          break;
        }
      }
      if (typeof fallbackValue === 'string') return fallbackValue;
    }

    // 3. Final Safety: Return humanized label instead of raw key
    if (typeof value !== 'string') {
      const lastKey = keys[keys.length - 1];
      return lastKey.replace(/_/g, ' ').toUpperCase(); 
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
    // Default return to prevent crash if hook called outside provider during SSR/Hydration
    return {
      language: 'bn' as Language,
      setLanguage: () => {},
      t: (key: string) => {
        const parts = key.split('.');
        return parts[parts.length - 1].replace(/_/g, ' ').toUpperCase();
      }
    };
  }
  return context;
}

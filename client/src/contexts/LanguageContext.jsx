import { createContext, useContext, useState, useCallback } from 'react';
import vi from '../i18n/vi.json';
import en from '../i18n/en.json';

const translations = { vi, en };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('lang') || 'vi');

  const setLang = useCallback((code) => {
    setLangState(code);
    localStorage.setItem('lang', code);
    document.documentElement.lang = code;
  }, []);

  /** Translate key. Supports `{var}` interpolation: t('key', { var: value }) */
  const t = useCallback((key, vars) => {
    let text = translations[lang]?.[key] || translations.vi[key] || key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ t, lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

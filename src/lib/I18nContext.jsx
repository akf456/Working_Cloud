import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { STRINGS, LANGUAGES, detectLanguage } from '@/lib/i18n';

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const { user } = useAuth();
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('wc_lang') || detectLanguage(); } catch { return detectLanguage(); }
  });

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  // On first sign-in on a device with no saved preference, adopt the profile language.
  useEffect(() => {
    if (user?.language && !localStorage.getItem('wc_lang')) {
      setLang(user.language);
      try { localStorage.setItem('wc_lang', user.language); } catch {}
    }
  }, [user]);

  const setLangPersist = useCallback((l) => {
    setLang(l);
    try { localStorage.setItem('wc_lang', l); } catch {}
    if (user) base44.auth.updateMe({ language: l }).catch(() => {});
  }, [user]);

  const t = useCallback((key, vars) => {
    const entry = STRINGS[key];
    let s = (entry && (entry[lang] || entry.en)) || key;
    if (vars) for (const k in vars) s = s.split(`{${k}}`).join(vars[k]);
    return s;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang: setLangPersist, t, languages: LANGUAGES }), [lang, setLangPersist, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    const t = (key, vars) => {
      let s = STRINGS[key]?.en || key;
      if (vars) for (const k in vars) s = s.split(`{${k}}`).join(vars[k]);
      return s;
    };
    return { lang: 'en', setLang: () => {}, t, languages: LANGUAGES };
  }
  return ctx;
}
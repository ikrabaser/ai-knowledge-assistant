import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, type Locale, type TranslationKey } from "../i18n/translations";

const LOCALE_STORAGE_KEY = "masteacon_locale";
const LEGACY_LOCALE_STORAGE_KEY = "aika_locale";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function detectDefaultLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === "en" || stored === "tr") return stored;

  const legacyStored = localStorage.getItem(LEGACY_LOCALE_STORAGE_KEY);

  if (legacyStored === "en" || legacyStored === "tr") {
    localStorage.setItem(LOCALE_STORAGE_KEY, legacyStored);
    localStorage.removeItem(LEGACY_LOCALE_STORAGE_KEY);
    return legacyStored;
  }

  return navigator.language.toLowerCase().startsWith("tr") ? "tr" : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectDefaultLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
    document.documentElement.lang = next;
    setLocaleState(next);
  }, []);

  const t = useCallback((key: TranslationKey) => translations[locale][key] ?? translations.en[key] ?? key, [locale]);

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within an I18nProvider");
  return context;
}

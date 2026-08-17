import { useI18n } from "../context/I18nContext";

export function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="segmented" role="group" aria-label="Language">
      <button className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>
        EN
      </button>
      <button className={locale === "tr" ? "active" : ""} onClick={() => setLocale("tr")}>
        TR
      </button>
    </div>
  );
}

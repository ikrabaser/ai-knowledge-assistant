import { useTheme } from "../context/ThemeContext";
import { useI18n } from "../context/I18nContext";

export function ThemeSwitcher() {
  const { mode, setMode } = useTheme();
  const { t } = useI18n();

  return (
    <div className="segmented" role="group" aria-label="Theme">
      <button className={mode === "light" ? "active" : ""} onClick={() => setMode("light")} title={t("theme.light")}>
        ☀️
      </button>
      <button className={mode === "dark" ? "active" : ""} onClick={() => setMode("dark")} title={t("theme.dark")}>
        🌙
      </button>
      <button
        className={mode === "system" ? "active" : ""}
        onClick={() => setMode("system")}
        title={t("theme.system")}
      >
        💻
      </button>
    </div>
  );
}

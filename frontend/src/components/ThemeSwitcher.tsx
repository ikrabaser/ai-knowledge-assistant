import { useTheme } from "../context/ThemeContext";
import { useI18n } from "../context/I18nContext";
import { LaptopIcon, MoonIcon, SunIcon } from "./icons";

export function ThemeSwitcher() {
  const { mode, setMode } = useTheme();
  const { t } = useI18n();

  return (
    <div className="segmented" role="group" aria-label="Theme">
      <button className={mode === "light" ? "active" : ""} onClick={() => setMode("light")} title={t("theme.light")}>
        <SunIcon width={14} height={14} />
      </button>
      <button className={mode === "dark" ? "active" : ""} onClick={() => setMode("dark")} title={t("theme.dark")}>
        <MoonIcon width={14} height={14} />
      </button>
      <button
        className={mode === "system" ? "active" : ""}
        onClick={() => setMode("system")}
        title={t("theme.system")}
      >
        <LaptopIcon width={14} height={14} />
      </button>
    </div>
  );
}

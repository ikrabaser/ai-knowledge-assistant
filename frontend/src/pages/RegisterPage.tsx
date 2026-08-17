import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LocaleSwitcher } from "../components/LocaleSwitcher";
import { Logo } from "../components/Logo";
import { ThemeSwitcher } from "../components/ThemeSwitcher";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";

export function RegisterPage() {
  const { register } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register(email, password);
      navigate("/overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-topbar">
        <ThemeSwitcher />
        <LocaleSwitcher />
      </div>

      <div>
        <div className="auth-brand-header">
          <Logo size={40} />
          <div className="auth-brand-name">Masteacon</div>
          <div className="auth-brand-tagline">{t("app.tagline")}</div>
        </div>

        <div className="card auth-card">
          <div className="auth-subtitle">{t("auth.createSubtitle")}</div>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">{t("auth.email")}</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="password">{t("auth.password")}</label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{t("auth.passwordHint")}</span>
            </div>
            <button type="submit" className="btn" style={{ width: "100%" }} disabled={isSubmitting}>
              {isSubmitting ? t("auth.creatingAccount") : t("auth.createAccount")}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: "var(--text-muted)" }}>
            {t("auth.haveAccount")} <Link to="/login">{t("auth.signInLink")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

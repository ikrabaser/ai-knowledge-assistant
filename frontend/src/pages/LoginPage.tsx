import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LocaleSwitcher } from "../components/LocaleSwitcher";
import { Logo } from "../components/Logo";
import { ThemeSwitcher } from "../components/ThemeSwitcher";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";

export function LoginPage() {
  const { login } = useAuth();
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
      await login(email, password);
      navigate("/overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
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
          <div className="auth-subtitle">{t("auth.signInSubtitle")}</div>

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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn" style={{ width: "100%" }} disabled={isSubmitting}>
              {isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: "var(--text-muted)" }}>
            {t("auth.noAccount")} <Link to="/register">{t("auth.createOne")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

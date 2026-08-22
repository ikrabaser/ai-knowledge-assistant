import { useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { Link, useNavigate } from "react-router-dom";

import { LocaleSwitcher } from "../components/LocaleSwitcher";
import { Logo } from "../components/Logo";
import { ThemeSwitcher } from "../components/ThemeSwitcher";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";

export function RegisterPage() {
  const { register } = useAuth();
  const { t, locale } = useI18n();
  const navigate = useNavigate();

  const turnstileSiteKey =
    import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? "";
  const turnstileRequired = Boolean(turnstileSiteKey);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [website, setWebsite] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copy =
    locale === "tr"
      ? {
          eyebrow: "KNOWLEDGE INTELLIGENCE",
          titleStart: "Bilginiz için",
          titleAccent: "güvenilir bir zekâ katmanı",
          titleEnd: "oluşturun.",
          description:
            "Dokümanlarınızı, çalışma alanlarınızı ve yapay zekâ destekli bilgi süreçlerinizi tek bir güvenilir platformda birleştirin.",
          grounded: "Kaynaklı Zekâ",
          groundedText:
            "Yanıtları gerçek bilgi kaynaklarıyla temellendirin.",
          spaces: "Bilgi Alanları",
          spacesText:
            "Farklı bilgi bağlamlarını ayrı çalışma alanlarında yönetin.",
          transparent: "Şeffaf AI",
          transparentText:
            "Kaynakları, retrieval sürecini ve agent araçlarını görün.",
          secure:
            "Trusted knowledge. Grounded intelligence.",
          heading: "Masteacon'a katılın",
          formDescription:
            "İlk bilgi çalışma alanınızı oluşturmaya başlayın.",
          emailPlaceholder: "ornek@company.com",
          passwordPlaceholder: "Güçlü bir şifre oluşturun",
          passwordHint:
            "En az 8 karakter kullanın.",
          submit: "Hesabımı Oluştur",
          submitting: "Hesap oluşturuluyor...",
          haveAccount: "Zaten hesabınız var mı?",
          signIn: "Giriş yapın",
        }
      : {
          eyebrow: "KNOWLEDGE INTELLIGENCE",
          titleStart: "Build a",
          titleAccent: "trusted intelligence layer",
          titleEnd: "for your knowledge.",
          description:
            "Bring documents, workspaces and AI-powered knowledge workflows together in one trusted platform.",
          grounded: "Grounded Intelligence",
          groundedText:
            "Anchor answers in real knowledge sources.",
          spaces: "Knowledge Spaces",
          spacesText:
            "Keep distinct knowledge contexts organized in workspaces.",
          transparent: "Transparent AI",
          transparentText:
            "See sources, retrieval and agent tool execution.",
          secure:
            "Trusted knowledge. Grounded intelligence.",
          heading: "Join Masteacon",
          formDescription:
            "Create your account and start building your knowledge workspace.",
          emailPlaceholder: "you@company.com",
          passwordPlaceholder: "Create a secure password",
          passwordHint:
            "Use at least 8 characters.",
          submit: "Create Masteacon Account",
          submitting: "Creating account...",
          haveAccount: "Already using Masteacon?",
          signIn: "Sign in",
        };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError(null);

    if (turnstileRequired && !turnstileToken) {
      setError(
        locale === "tr"
          ? "Lütfen güvenlik doğrulamasını tamamlayın."
          : "Please complete the security verification.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await register(
        email,
        password,
        website,
        turnstileToken ?? "",
      );
      navigate(
        `/check-email?email=${encodeURIComponent(email)}`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed.",
      );

      if (turnstileRequired) {
        setTurnstileToken(null);
        setTurnstileKey((current) => current + 1);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="masteacon-auth-page">
      <div className="masteacon-auth-ambient masteacon-auth-ambient-one" />
      <div className="masteacon-auth-ambient masteacon-auth-ambient-two" />

      <header className="masteacon-auth-header">
        <Link
          to="/login"
          className="masteacon-auth-header-brand"
          aria-label="Masteacon"
        >
          <Logo size={34} withWordmark />
        </Link>

        <div className="masteacon-auth-controls">
          <ThemeSwitcher />
          <LocaleSwitcher />
        </div>
      </header>

      <section className="masteacon-auth-shell">
        <div className="masteacon-auth-story">
          <div className="masteacon-auth-story-grid" />

          <div className="masteacon-auth-story-content">
            <span className="masteacon-auth-eyebrow">
              <span className="masteacon-auth-eyebrow-dot" />
              {copy.eyebrow}
            </span>

            <h1 className="masteacon-auth-title">
              {copy.titleStart}
              <span>{copy.titleAccent}</span>
              {copy.titleEnd}
            </h1>

            <p className="masteacon-auth-description">
              {copy.description}
            </p>

            <div className="masteacon-auth-beacon">
              <div className="masteacon-auth-beacon-ring masteacon-auth-beacon-ring-one" />
              <div className="masteacon-auth-beacon-ring masteacon-auth-beacon-ring-two" />
              <div className="masteacon-auth-beacon-ring masteacon-auth-beacon-ring-three" />

              <div className="masteacon-auth-beacon-mark">
                <Logo size={100} mColor="#F5F1E8" />
              </div>

              <div className="masteacon-auth-beacon-light" />
            </div>

            <div className="masteacon-auth-features">
              <div className="masteacon-auth-feature">
                <span className="masteacon-auth-feature-number">
                  01
                </span>

                <div>
                  <strong>{copy.grounded}</strong>
                  <p>{copy.groundedText}</p>
                </div>
              </div>

              <div className="masteacon-auth-feature">
                <span className="masteacon-auth-feature-number">
                  02
                </span>

                <div>
                  <strong>{copy.spaces}</strong>
                  <p>{copy.spacesText}</p>
                </div>
              </div>

              <div className="masteacon-auth-feature">
                <span className="masteacon-auth-feature-number">
                  03
                </span>

                <div>
                  <strong>{copy.transparent}</strong>
                  <p>{copy.transparentText}</p>
                </div>
              </div>
            </div>
          </div>

          <footer className="masteacon-auth-story-footer">
            <span className="masteacon-auth-status-dot" />
            {copy.secure}
          </footer>
        </div>

        <div className="masteacon-auth-form-panel">
          <div className="masteacon-auth-form-wrap">
            <div className="masteacon-auth-mobile-brand">
              <Logo size={52} withWordmark />
              <span>Your beacon to mastery</span>
            </div>

            <div className="masteacon-auth-form-heading">
              <span className="masteacon-auth-form-kicker">
                MASTEACON
              </span>

              <h2>{copy.heading}</h2>
              <p>{copy.formDescription}</p>
            </div>

            {error && (
              <div className="error-banner masteacon-auth-error">
                {error}
              </div>
            )}

            <form
              className="masteacon-auth-form"
              onSubmit={handleSubmit}
            >
              <div
                className="masteacon-auth-honeypot"
                aria-hidden="true"
              >
                <label htmlFor="website">
                  Website
                </label>

                <input
                  id="website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div className="masteacon-auth-field">
                <label htmlFor="email">
                  {t("auth.email")}
                </label>

                <div className="masteacon-auth-input-wrap">
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path d="M4 6.75h16v10.5H4z" />
                    <path d="m4.5 7.5 7.5 5.75L19.5 7.5" />
                  </svg>

                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder={copy.emailPlaceholder}
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="masteacon-auth-field">
                <label htmlFor="password">
                  {t("auth.password")}
                </label>

                <div className="masteacon-auth-input-wrap">
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <rect
                      x="5"
                      y="10"
                      width="14"
                      height="10"
                      rx="2"
                    />
                    <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
                  </svg>

                  <input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder={copy.passwordPlaceholder}
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                  />
                </div>

                <div className="masteacon-register-password-hint">
                  <span
                    className={
                      password.length >= 8
                        ? "complete"
                        : ""
                    }
                  >
                    {password.length >= 8 ? "✓" : "•"}
                  </span>

                  {copy.passwordHint}
                </div>
              </div>

              {turnstileRequired && (
                <div className="masteacon-turnstile">
                  <Turnstile
                    key={turnstileKey}
                    siteKey={turnstileSiteKey}
                    onSuccess={(token) => setTurnstileToken(token)}
                    onExpire={() => setTurnstileToken(null)}
                    onError={() => setTurnstileToken(null)}
                    options={{
                      action: "register",
                      theme: "auto",
                    }}
                  />
                </div>
              )}

              <button
                type="submit"
                className="masteacon-auth-submit"
                disabled={
                  isSubmitting ||
                  (turnstileRequired && !turnstileToken)
                }
              >
                <span>
                  {isSubmitting
                    ? copy.submitting
                    : copy.submit}
                </span>

                {!isSubmitting && (
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M5 12h14" />
                    <path d="m14 7 5 5-5 5" />
                  </svg>
                )}
              </button>
            </form>

            <div className="masteacon-auth-register">
              <span>{copy.haveAccount}</span>{" "}
              <Link to="/login">
                {copy.signIn}
              </Link>
            </div>

            <div className="masteacon-auth-trust">
              <span />

              <p>
                RAG
                <i />
                Semantic Search
                <i />
                Source Grounding
              </p>

              <span />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

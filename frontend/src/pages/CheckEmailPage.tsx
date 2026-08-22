import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import * as api from "../api/endpoints";
import { LocaleSwitcher } from "../components/LocaleSwitcher";
import { Logo } from "../components/Logo";
import { ThemeSwitcher } from "../components/ThemeSwitcher";

export function CheckEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    if (!email || isSending) return;

    setIsSending(true);
    setMessage(null);
    setError(null);

    try {
      const response = await api.resendVerification(email);
      setMessage(response.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to resend verification email.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="masteacon-auth-page masteacon-verification-page">
      <div className="masteacon-auth-ambient masteacon-auth-ambient-one" />
      <div className="masteacon-auth-ambient masteacon-auth-ambient-two" />

      <header className="masteacon-auth-header">
        <Link
          to="/"
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

      <section className="masteacon-verification-card">
        <div className="masteacon-verification-icon">✉</div>

        <span className="masteacon-auth-eyebrow">
          MASTEACON SECURITY
        </span>

        <h1>Check your email</h1>

        <p>
          We sent a verification link to
          {email ? (
            <>
              {" "}
              <strong>{email}</strong>
            </>
          ) : (
            " your email address"
          )}
          .
        </p>

        <p className="masteacon-verification-muted">
          Open the message and follow the verification link to activate
          your Masteacon account.
        </p>

        {message && (
          <div className="masteacon-verification-success">
            {message}
          </div>
        )}

        {error && (
          <div className="masteacon-verification-error">
            {error}
          </div>
        )}

        <button
          type="button"
          className="masteacon-auth-submit masteacon-verification-button"
          onClick={handleResend}
          disabled={!email || isSending}
        >
          {isSending ? "Sending..." : "Resend verification email"}
        </button>

        <Link
          to="/login"
          className="masteacon-verification-link"
        >
          Back to sign in
        </Link>
      </section>
    </main>
  );
}

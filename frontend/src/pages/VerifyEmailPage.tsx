import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import * as api from "../api/endpoints";
import { LocaleSwitcher } from "../components/LocaleSwitcher";
import { Logo } from "../components/Logo";
import { ThemeSwitcher } from "../components/ThemeSwitcher";

type VerificationState =
  | "loading"
  | "success"
  | "error";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [state, setState] =
    useState<VerificationState>("loading");
  const [message, setMessage] = useState(
    "Verifying your email address...",
  );

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!token) {
        setState("error");
        setMessage("The verification link is invalid.");
        return;
      }

      try {
        const response = await api.verifyEmail(token);

        if (cancelled) return;

        setState("success");
        setMessage(response.message);
      } catch (err) {
        if (cancelled) return;

        setState("error");
        setMessage(
          err instanceof Error
            ? err.message
            : "Email verification failed.",
        );
      }
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, [token]);

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
        <div
          className={[
            "masteacon-verification-icon",
            `masteacon-verification-icon-${state}`,
          ].join(" ")}
        >
          {state === "loading" && "…"}
          {state === "success" && "✓"}
          {state === "error" && "!"}
        </div>

        <span className="masteacon-auth-eyebrow">
          EMAIL VERIFICATION
        </span>

        <h1>
          {state === "loading" && "Verifying your email"}
          {state === "success" && "Email verified"}
          {state === "error" && "Verification failed"}
        </h1>

        <p>{message}</p>

        {state === "success" && (
          <Link
            to="/login"
            className="masteacon-auth-submit masteacon-verification-cta"
          >
            Continue to Masteacon
          </Link>
        )}

        {state === "error" && (
          <Link
            to="/login"
            className="masteacon-verification-link"
          >
            Return to sign in
          </Link>
        )}
      </section>
    </main>
  );
}

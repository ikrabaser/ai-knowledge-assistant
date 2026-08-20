import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useI18n } from "../context/I18nContext";

export function NotFoundPage() {
  const { locale } = useI18n();

  const copy =
    locale === "tr"
      ? {
          eyebrow: "404 · SAYFA BULUNAMADI",
          title: "Aradığınız bilgi burada değil.",
          description:
            "Bu bağlantı artık mevcut olmayabilir veya adres yanlış yazılmış olabilir.",
          home: "Ana sayfaya dön",
          signIn: "Giriş yap",
        }
      : {
          eyebrow: "404 · PAGE NOT FOUND",
          title: "The knowledge you're looking for isn't here.",
          description:
            "This link may no longer exist, or the address may have been entered incorrectly.",
          home: "Return home",
          signIn: "Sign in",
        };

  return (
    <main className="masteacon-not-found">
      <div className="masteacon-not-found-radar">
        <div />
        <div />
        <div />

        <Logo size={84} mColor="#F5F1E8" />
      </div>

      <span>{copy.eyebrow}</span>

      <h1>{copy.title}</h1>

      <p>{copy.description}</p>

      <div className="masteacon-not-found-actions">
        <Link to="/" className="primary">
          {copy.home}
          <span aria-hidden="true">→</span>
        </Link>

        <Link to="/login">{copy.signIn}</Link>
      </div>
    </main>
  );
}

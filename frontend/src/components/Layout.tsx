import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";

import {
  ChatIcon,
  FileIcon,
  FolderIcon,
  HomeIcon,
  LogOutIcon,
  SparkleIcon,
} from "./icons";

import { LocaleSwitcher } from "./LocaleSwitcher";
import { Logo } from "./Logo";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

export function Layout() {
  const { user, logout } = useAuth();
  const { t, locale } = useI18n();

  const labels =
    locale === "tr"
      ? {
          intelligence: "INTELLIGENCE",
          knowledge: "KNOWLEDGE",
          commandCenter: "Komuta Merkezi",
          ask: "Masteacon'a Sor",
          agent: "AI Ajanı",
          library: "Bilgi Kütüphanesi",
          workspaces: "Çalışma Alanları",
          account: "KNOWLEDGE ACCOUNT",
        }
      : {
          intelligence: "INTELLIGENCE",
          knowledge: "KNOWLEDGE",
          commandCenter: "Command Center",
          ask: "Ask Masteacon",
          agent: "AI Agent",
          library: "Knowledge Library",
          workspaces: "Workspaces",
          account: "KNOWLEDGE ACCOUNT",
        };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Logo size={58} withWordmark />
          <span className="sidebar-brand-tagline">
            Your beacon to mastery
          </span>
        </div>

        <WorkspaceSwitcher />

        <div className="sidebar-section">
          <span className="sidebar-section-label">
            {labels.intelligence}
          </span>

          <nav className="sidebar-nav">
            <NavLink
              to="/overview"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <HomeIcon />
              <span>{labels.commandCenter}</span>
            </NavLink>

            <NavLink
              to="/chat"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <ChatIcon />
              <span>{labels.ask}</span>
            </NavLink>

            <NavLink
              to="/agent"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <SparkleIcon />
              <span>{labels.agent}</span>
            </NavLink>
          </nav>
        </div>

        <div className="sidebar-section">
          <span className="sidebar-section-label">
            {labels.knowledge}
          </span>

          <nav className="sidebar-nav">
            <NavLink
              to="/documents"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FileIcon />
              <span>{labels.library}</span>
            </NavLink>

            <NavLink
              to="/workspaces"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FolderIcon />
              <span>{labels.workspaces}</span>
            </NavLink>
          </nav>
        </div>

        <div className="sidebar-footer">
          <span className="sidebar-section-label">
            {labels.account}
          </span>

          <div className="sidebar-account">
            <span className="sidebar-account-avatar">
              {(user?.email || "M").charAt(0).toUpperCase()}
            </span>

            <div className="sidebar-account-copy">
              <strong>Masteacon User</strong>
              <span>{user?.email}</span>
            </div>
          </div>

          <div className="sidebar-controls">
            <ThemeSwitcher />
            <LocaleSwitcher />
          </div>

          <button
            className="btn btn-secondary btn-sm sidebar-logout"
            onClick={logout}
          >
            <LogOutIcon width={15} height={15} />
            {t("nav.logout")}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

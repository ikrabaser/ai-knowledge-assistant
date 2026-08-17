import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import { ChatIcon, FileIcon, FolderIcon, HomeIcon, LogOutIcon, SparkleIcon } from "./icons";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { Logo } from "./Logo";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

export function Layout() {
  const { user, logout } = useAuth();
  const { t } = useI18n();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Logo size={30} withWordmark />
        </div>

        <WorkspaceSwitcher />

        <nav className="sidebar-nav">
          <NavLink to="/overview" className={({ isActive }) => (isActive ? "active" : "")}>
            <HomeIcon /> {t("nav.overview")}
          </NavLink>
          <NavLink to="/workspaces" className={({ isActive }) => (isActive ? "active" : "")}>
            <FolderIcon /> {t("nav.workspaces")}
          </NavLink>
          <NavLink to="/documents" className={({ isActive }) => (isActive ? "active" : "")}>
            <FileIcon /> {t("nav.documents")}
          </NavLink>
          <NavLink to="/chat" className={({ isActive }) => (isActive ? "active" : "")}>
            <ChatIcon /> {t("nav.chat")}
          </NavLink>
          <NavLink to="/agent" className={({ isActive }) => (isActive ? "active" : "")}>
            <SparkleIcon /> {t("nav.agent")}
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-controls">
            <ThemeSwitcher />
            <LocaleSwitcher />
          </div>
          <div className="sidebar-user-email">{user?.email}</div>
          <button className="btn btn-secondary btn-sm" onClick={logout}>
            <LogOutIcon width={15} height={15} /> {t("nav.logout")}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

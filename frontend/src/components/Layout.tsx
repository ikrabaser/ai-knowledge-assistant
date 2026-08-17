import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">🧠 AI Knowledge Assistant</div>

        <WorkspaceSwitcher />

        <nav className="sidebar-nav">
          <NavLink to="/workspaces" className={({ isActive }) => (isActive ? "active" : "")}>
            Workspaces
          </NavLink>
          <NavLink to="/documents" className={({ isActive }) => (isActive ? "active" : "")}>
            Documents
          </NavLink>
          <NavLink to="/chat" className={({ isActive }) => (isActive ? "active" : "")}>
            Chat
          </NavLink>
          <NavLink to="/agent" className={({ isActive }) => (isActive ? "active" : "")}>
            Agent
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div>{user?.email}</div>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../context/I18nContext";
import { useWorkspace } from "../context/WorkspaceContext";

export function WorkspacesPage() {
  const { workspaces, isLoading, createWorkspace, selectWorkspace } = useWorkspace();
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    try {
      await createWorkspace(name.trim());
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace.");
    }
  }

  return (
    <div>
      <h1 className="page-title">{t("workspaces.title")}</h1>
      <p className="page-subtitle">{t("workspaces.subtitle")}</p>

      <div className="card">
        <form onSubmit={handleCreate} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label htmlFor="workspace-name">{t("workspaces.newName")}</label>
            <input
              id="workspace-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("workspaces.namePlaceholder")}
            />
          </div>
          <button type="submit" className="btn">
            {t("workspaces.create")}
          </button>
        </form>
        {error && (
          <div className="error-banner" style={{ marginTop: 12 }}>
            {error}
          </div>
        )}
      </div>

      <div className="card">
        {isLoading && <div className="spinner-text">{t("common.loading")}</div>}
        {!isLoading && workspaces.length === 0 && <div className="empty-state">{t("workspaces.empty")}</div>}
        {workspaces.map((w) => (
          <div key={w.id} className="list-item">
            <div>
              <div style={{ fontWeight: 700 }}>{w.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-faint)" }}>
                {t("workspaces.created")} {new Date(w.created_at).toLocaleDateString(locale)}
              </div>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                selectWorkspace(w.id);
                navigate("/documents");
              }}
            >
              {t("workspaces.open")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

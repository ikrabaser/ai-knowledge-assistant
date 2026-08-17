import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../context/WorkspaceContext";

export function WorkspacesPage() {
  const { workspaces, isLoading, createWorkspace, selectWorkspace } = useWorkspace();
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
      <h1 className="page-title">Workspaces</h1>
      <p className="page-subtitle">A workspace isolates your documents and conversations from other users.</p>

      <div className="card">
        <form onSubmit={handleCreate} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label htmlFor="workspace-name">New workspace name</label>
            <input id="workspace-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Company Handbook" />
          </div>
          <button type="submit" className="btn">
            Create
          </button>
        </form>
        {error && <div className="error-banner" style={{ marginTop: 12 }}>{error}</div>}
      </div>

      <div className="card">
        {isLoading && <div className="spinner-text">Loading workspaces…</div>}
        {!isLoading && workspaces.length === 0 && (
          <div className="empty-state">No workspaces yet — create your first one above.</div>
        )}
        {workspaces.map((w) => (
          <div key={w.id} className="list-item">
            <div>
              <div style={{ fontWeight: 600 }}>{w.name}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                Created {new Date(w.created_at).toLocaleDateString()}
              </div>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                selectWorkspace(w.id);
                navigate("/documents");
              }}
            >
              Open
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

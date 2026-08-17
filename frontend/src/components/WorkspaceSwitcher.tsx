import { useState } from "react";
import { useI18n } from "../context/I18nContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { PlusIcon } from "./icons";

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, selectWorkspace, createWorkspace } = useWorkspace();
  const { t } = useI18n();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    try {
      await createWorkspace(newName.trim());
      setNewName("");
      setIsCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace.");
    }
  }

  return (
    <div className="workspace-switcher">
      <label className="workspace-switcher-label">{t("workspaces.switcherLabel")}</label>
      <select
        value={activeWorkspace?.id ?? ""}
        onChange={(e) => selectWorkspace(Number(e.target.value))}
        disabled={workspaces.length === 0}
      >
        {workspaces.length === 0 && <option value="">{t("workspaces.noneYet")}</option>}
        {workspaces.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>

      {isCreating ? (
        <form onSubmit={handleCreate} style={{ display: "flex", gap: 4 }}>
          <input
            autoFocus
            placeholder={t("workspaces.namePlaceholder")}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ flex: 1, minWidth: 0 }}
          />
          <button type="submit" className="btn btn-sm">
            {t("workspaces.add")}
          </button>
        </form>
      ) : (
        <button className="btn btn-secondary btn-sm" onClick={() => setIsCreating(true)}>
          <PlusIcon width={14} height={14} /> {t("workspaces.addNew")}
        </button>
      )}
      {error && <div style={{ color: "var(--danger)", fontSize: 12 }}>{error}</div>}
    </div>
  );
}

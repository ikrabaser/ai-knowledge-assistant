import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import * as api from "../api/endpoints";
import type { WorkspaceResponse } from "../api/types";
import { useAuth } from "./AuthContext";

const WORKSPACE_STORAGE_KEY = "masteacon_active_workspace_id";
const LEGACY_WORKSPACE_STORAGE_KEY = "aika_active_workspace_id";

function readStoredWorkspaceId(): number | null {
  const stored =
    localStorage.getItem(WORKSPACE_STORAGE_KEY) ??
    localStorage.getItem(LEGACY_WORKSPACE_STORAGE_KEY);

  if (!stored) return null;

  const workspaceId = Number(stored);

  if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
    localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    localStorage.removeItem(LEGACY_WORKSPACE_STORAGE_KEY);
    return null;
  }

  localStorage.setItem(WORKSPACE_STORAGE_KEY, String(workspaceId));
  localStorage.removeItem(LEGACY_WORKSPACE_STORAGE_KEY);

  return workspaceId;
}

interface WorkspaceContextValue {
  workspaces: WorkspaceResponse[];
  activeWorkspace: WorkspaceResponse | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  selectWorkspace: (workspaceId: number) => void;
  createWorkspace: (name: string) => Promise<WorkspaceResponse>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] =
    useState<number | null>(readStoredWorkspaceId);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await api.listWorkspaces();
      setWorkspaces(list);
      setActiveWorkspaceId((current) => {
        if (current && list.some((w) => w.id === current)) return current;
        return list[0]?.id ?? null;
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      refresh();
    } else {
      setWorkspaces([]);
      setActiveWorkspaceId(null);
    }
  }, [user, refresh]);

  useEffect(() => {
    if (activeWorkspaceId) localStorage.setItem(WORKSPACE_STORAGE_KEY, String(activeWorkspaceId));
  }, [activeWorkspaceId]);

  const createWorkspace = useCallback(async (name: string) => {
    const workspace = await api.createWorkspace(name);
    setWorkspaces((prev) => [workspace, ...prev]);
    setActiveWorkspaceId(workspace.id);
    return workspace;
  }, []);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) ?? null;

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        isLoading,
        refresh,
        selectWorkspace: setActiveWorkspaceId,
        createWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return context;
}

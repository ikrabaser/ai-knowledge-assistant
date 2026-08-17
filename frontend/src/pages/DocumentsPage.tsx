import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "../api/endpoints";
import { DocumentStatusBadge } from "../components/DocumentStatusBadge";
import { useI18n } from "../context/I18nContext";
import { useWorkspace } from "../context/WorkspaceContext";
import type { DocumentResponse } from "../api/types";

const ACCEPTED_TYPES = ".pdf,.docx,.txt";
const POLL_INTERVAL_MS = 3000;

export function DocumentsPage() {
  const { activeWorkspace } = useWorkspace();
  const { t, locale } = useI18n();
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      const list = await api.listDocuments(activeWorkspace.id);
      setDocuments(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents.");
    }
  }, [activeWorkspace]);

  useEffect(() => {
    setIsLoading(true);
    loadDocuments().finally(() => setIsLoading(false));
  }, [loadDocuments]);

  // Indexing runs asynchronously (Celery) — poll while anything is still in flight.
  useEffect(() => {
    const hasPending = documents.some((d) => d.status === "uploaded" || d.status === "processing");
    if (!hasPending) return;
    const interval = setInterval(loadDocuments, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [documents, loadDocuments]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeWorkspace) return;
    setError(null);
    setIsUploading(true);
    try {
      await api.uploadDocument(file, activeWorkspace.id);
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (!activeWorkspace) {
    return (
      <div>
        <h1 className="page-title">{t("documents.title")}</h1>
        <div className="empty-state">{t("documents.emptyNoWorkspace")}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="top-bar">
        <div>
          <h1 className="page-title">{t("documents.title")}</h1>
          <p className="page-subtitle">
            {t("documents.subtitleIn")} <strong>{activeWorkspace.name}</strong> — {t("documents.types")}
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <button className="btn" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
            {isUploading ? t("documents.uploading") : t("documents.upload")}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        {isLoading && <div className="spinner-text">{t("common.loading")}</div>}
        {!isLoading && documents.length === 0 && <div className="empty-state">{t("documents.empty")}</div>}
        {documents.map((doc) => (
          <div key={doc.id} className="list-item">
            <div>
              <div style={{ fontWeight: 700 }}>{doc.filename}</div>
              <div style={{ fontSize: 12, color: "var(--text-faint)" }}>
                {doc.content_type} · {t("documents.uploaded")} {new Date(doc.created_at).toLocaleString(locale)}
                {doc.error_message && <span style={{ color: "var(--danger)" }}> · {doc.error_message}</span>}
              </div>
            </div>
            <DocumentStatusBadge status={doc.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "../api/endpoints";
import { DocumentStatusBadge } from "../components/DocumentStatusBadge";
import { useWorkspace } from "../context/WorkspaceContext";
import type { DocumentResponse } from "../api/types";

const ACCEPTED_TYPES = ".pdf,.docx,.txt";

export function DocumentsPage() {
  const { activeWorkspace } = useWorkspace();
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = useCallback(async () => {
    if (!activeWorkspace) return;
    setIsLoading(true);
    try {
      const list = await api.listDocuments(activeWorkspace.id);
      setDocuments(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents.");
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

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
        <h1 className="page-title">Documents</h1>
        <div className="empty-state">Create or select a workspace first.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="top-bar">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-subtitle">
            In workspace <strong>{activeWorkspace.name}</strong> — PDF, DOCX, or TXT.
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
            {isUploading ? "Uploading…" : "Upload document"}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        {isLoading && <div className="spinner-text">Loading documents…</div>}
        {!isLoading && documents.length === 0 && (
          <div className="empty-state">No documents yet — upload one to get started.</div>
        )}
        {documents.map((doc) => (
          <div key={doc.id} className="list-item">
            <div>
              <div style={{ fontWeight: 600 }}>{doc.filename}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                {doc.content_type} · Uploaded {new Date(doc.created_at).toLocaleString()}
                {doc.error_message && <span style={{ color: "var(--color-danger)" }}> · {doc.error_message}</span>}
              </div>
            </div>
            <DocumentStatusBadge status={doc.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import * as api from "../api/endpoints";
import type { DocumentResponse } from "../api/types";

import { DocumentStatusBadge } from "../components/DocumentStatusBadge";
import {
  CheckIcon,
  ClockIcon,
  FileIcon,
  SearchIcon,
  SparkleIcon,
  UploadIcon,
  WarningIcon,
} from "../components/icons";

import { useI18n } from "../context/I18nContext";
import { useWorkspace } from "../context/WorkspaceContext";

const ACCEPTED_TYPES = ".pdf,.docx,.txt";
const POLL_INTERVAL_MS = 3000;

type LibraryFilter =
  | "all"
  | "indexed"
  | "processing"
  | "failed";

function getDocumentType(document: DocumentResponse) {
  const contentType = document.content_type.toLowerCase();

  if (contentType.includes("pdf")) {
    return "PDF";
  }

  if (
    contentType.includes("word") ||
    contentType.includes("document")
  ) {
    return "DOCX";
  }

  return "TXT";
}

function isAcceptedFile(file: File) {
  const filename = file.name.toLowerCase();

  return (
    filename.endsWith(".pdf") ||
    filename.endsWith(".docx") ||
    filename.endsWith(".txt")
  );
}

export function DocumentsPage() {
  const { activeWorkspace } = useWorkspace();
  const { locale } = useI18n();

  const [documents, setDocuments] = useState<
    DocumentResponse[]
  >([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<LibraryFilter>("all");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const copy =
    locale === "tr"
      ? {
          eyebrow: "KNOWLEDGE LIBRARY",
          title: "Bilgi Kütüphanesi",
          description:
            "Masteacon'ın güvenilir yanıtlar üretmek için kullandığı bilgi kaynaklarını yönetin.",
          workspaceLabel: "AKTİF ÇALIŞMA ALANI",
          total: "Toplam Kaynak",
          indexed: "İndeksli",
          processing: "İşleniyor",
          failed: "Sorunlu",
          uploadTitle: "Bilginizi Masteacon'a ekleyin",
          uploadDescription:
            "Dosyayı buraya sürükleyin veya bilgisayarınızdan seçin.",
          uploadHint:
            "PDF, DOCX veya TXT · İndeksleme arka planda otomatik başlar.",
          uploadButton: "Dosya Seç",
          uploading: "Yükleniyor...",
          search: "Bilgi kütüphanesinde ara...",
          all: "Tümü",
          indexedFilter: "İndeksli",
          processingFilter: "İşleniyor",
          failedFilter: "Sorunlu",
          sources: "KNOWLEDGE SOURCES",
          sourceCount: "kaynak",
          emptyTitle: "Henüz bilgi kaynağı yok",
          emptyDescription:
            "İlk dokümanınızı yüklediğinizde Masteacon içeriği indeksleyip arama ve kaynaklı yanıtlar için hazırlar.",
          noResultsTitle: "Eşleşen kaynak bulunamadı",
          noResultsDescription:
            "Arama kelimenizi veya durum filtresini değiştirmeyi deneyin.",
          ready: "Retrieval için hazır",
          queued: "İndeksleme kuyruğunda",
          processingState: "İçerik işleniyor",
          failedState: "İndeksleme başarısız",
          uploaded: "Yüklendi",
          workspace: "Çalışma Alanı",
          invalidFile:
            "Yalnızca PDF, DOCX veya TXT dosyaları yüklenebilir.",
          uploadFailed: "Dosya yüklenemedi.",
          loadFailed: "Dokümanlar yüklenemedi.",
          noWorkspaceTitle: "Önce bir çalışma alanı oluşturun",
          noWorkspaceDescription:
            "Bilgi kaynakları bir çalışma alanına bağlıdır. Dosya yüklemek için önce bir workspace seçin veya oluşturun.",
        }
      : {
          eyebrow: "KNOWLEDGE LIBRARY",
          title: "Knowledge Library",
          description:
            "Manage the trusted knowledge sources Masteacon uses to generate grounded answers.",
          workspaceLabel: "ACTIVE WORKSPACE",
          total: "Total Sources",
          indexed: "Indexed",
          processing: "Processing",
          failed: "Issues",
          uploadTitle: "Add knowledge to Masteacon",
          uploadDescription:
            "Drop a file here or choose one from your computer.",
          uploadHint:
            "PDF, DOCX or TXT · Indexing starts automatically in the background.",
          uploadButton: "Choose File",
          uploading: "Uploading...",
          search: "Search your knowledge library...",
          all: "All",
          indexedFilter: "Indexed",
          processingFilter: "Processing",
          failedFilter: "Issues",
          sources: "KNOWLEDGE SOURCES",
          sourceCount: "sources",
          emptyTitle: "No knowledge sources yet",
          emptyDescription:
            "Upload your first document and Masteacon will index it for search and grounded answers.",
          noResultsTitle: "No matching sources",
          noResultsDescription:
            "Try changing your search query or status filter.",
          ready: "Ready for retrieval",
          queued: "Queued for indexing",
          processingState: "Processing content",
          failedState: "Indexing failed",
          uploaded: "Uploaded",
          workspace: "Workspace",
          invalidFile:
            "Only PDF, DOCX or TXT files can be uploaded.",
          uploadFailed: "Upload failed.",
          loadFailed: "Failed to load documents.",
          noWorkspaceTitle: "Create a workspace first",
          noWorkspaceDescription:
            "Knowledge sources belong to a workspace. Select or create one before uploading documents.",
        };

  const loadDocuments = useCallback(async () => {
    if (!activeWorkspace) {
      setDocuments([]);
      return;
    }

    try {
      const list = await api.listDocuments(
        activeWorkspace.id,
      );

      setDocuments(list);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : copy.loadFailed,
      );
    }
  }, [activeWorkspace, copy.loadFailed]);

  useEffect(() => {
    if (!activeWorkspace) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    loadDocuments().finally(() =>
      setIsLoading(false),
    );
  }, [activeWorkspace, loadDocuments]);

  useEffect(() => {
    const hasPending = documents.some(
      (document) =>
        document.status === "uploaded" ||
        document.status === "processing",
    );

    if (!hasPending) {
      return;
    }

    const interval = window.setInterval(
      loadDocuments,
      POLL_INTERVAL_MS,
    );

    return () => window.clearInterval(interval);
  }, [documents, loadDocuments]);

  const indexedCount = documents.filter(
    (document) => document.status === "indexed",
  ).length;

  const processingCount = documents.filter(
    (document) =>
      document.status === "uploaded" ||
      document.status === "processing",
  ).length;

  const failedCount = documents.filter(
    (document) => document.status === "failed",
  ).length;

  const visibleDocuments = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return [...documents]
      .filter((document) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          document.filename
            .toLowerCase()
            .includes(normalizedSearch);

        const matchesFilter =
          filter === "all" ||
          (filter === "processing"
            ? document.status === "uploaded" ||
              document.status === "processing"
            : document.status === filter);

        return matchesSearch && matchesFilter;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime(),
      );
  }, [documents, filter, search]);

  async function uploadFile(file: File) {
    if (!activeWorkspace) {
      return;
    }

    if (!isAcceptedFile(file)) {
      setError(copy.invalidFile);
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      await api.uploadDocument(
        file,
        activeWorkspace.id,
      );

      await loadDocuments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : copy.uploadFailed,
      );
    } finally {
      setIsUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    await uploadFile(file);
  }

  async function handleDrop(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();

    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    await uploadFile(file);
  }

  function getStatusMessage(
    document: DocumentResponse,
  ) {
    switch (document.status) {
      case "indexed":
        return copy.ready;
      case "uploaded":
        return copy.queued;
      case "processing":
        return copy.processingState;
      case "failed":
        return copy.failedState;
    }
  }

  if (!activeWorkspace) {
    return (
      <div className="library-page">
        <header className="library-header">
          <div>
            <span className="library-eyebrow">
              {copy.eyebrow}
            </span>

            <h1>{copy.title}</h1>

            <p>{copy.description}</p>
          </div>
        </header>

        <section className="library-no-workspace">
          <div className="library-no-workspace-icon">
            <FileIcon width={26} height={26} />
          </div>

          <span>MASTEACON KNOWLEDGE</span>

          <h2>{copy.noWorkspaceTitle}</h2>

          <p>{copy.noWorkspaceDescription}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="library-page">
      <header className="library-header">
        <div>
          <span className="library-eyebrow">
            {copy.eyebrow}
          </span>

          <h1>{copy.title}</h1>

          <p>{copy.description}</p>
        </div>

        <div className="library-workspace-context">
          <span>{copy.workspaceLabel}</span>

          <strong>{activeWorkspace.name}</strong>
        </div>
      </header>

      {error && (
        <div className="error-banner library-error">
          <WarningIcon width={15} height={15} />
          <span>{error}</span>
        </div>
      )}

      <section className="library-stat-grid">
        <article className="library-stat">
          <span className="library-stat-icon">
            <FileIcon width={17} height={17} />
          </span>

          <div>
            <span>{copy.total}</span>
            <strong>{documents.length}</strong>
          </div>
        </article>

        <article className="library-stat">
          <span className="library-stat-icon library-stat-icon-success">
            <CheckIcon width={17} height={17} />
          </span>

          <div>
            <span>{copy.indexed}</span>
            <strong>{indexedCount}</strong>
          </div>
        </article>

        <article className="library-stat">
          <span className="library-stat-icon library-stat-icon-warning">
            <ClockIcon width={17} height={17} />
          </span>

          <div>
            <span>{copy.processing}</span>
            <strong>{processingCount}</strong>
          </div>
        </article>

        <article className="library-stat">
          <span className="library-stat-icon library-stat-icon-danger">
            <WarningIcon width={17} height={17} />
          </span>

          <div>
            <span>{copy.failed}</span>
            <strong>{failedCount}</strong>
          </div>
        </article>
      </section>

      <section className="library-main-grid">
        <div
          className={
            isDragging
              ? "library-upload-zone library-upload-zone-dragging"
              : "library-upload-zone"
          }
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();

            if (
              event.currentTarget.contains(
                event.relatedTarget as Node | null,
              )
            ) {
              return;
            }

            setIsDragging(false);
          }}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" ||
              event.key === " "
            ) {
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="library-file-input"
            onChange={handleFileChange}
          />

          <div className="library-upload-orbit">
            <div className="library-upload-ring library-upload-ring-one" />
            <div className="library-upload-ring library-upload-ring-two" />

            <span className="library-upload-icon">
              <UploadIcon width={22} height={22} />
            </span>
          </div>

          <div className="library-upload-copy">
            <span className="library-section-kicker">
              INGESTION PIPELINE
            </span>

            <h2>{copy.uploadTitle}</h2>

            <p>{copy.uploadDescription}</p>

            <small>{copy.uploadHint}</small>
          </div>

          <button
            type="button"
            className="library-upload-button"
            disabled={isUploading}
            onClick={(event) => {
              event.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            {isUploading ? (
              <ClockIcon width={15} height={15} />
            ) : (
              <UploadIcon width={15} height={15} />
            )}

            {isUploading
              ? copy.uploading
              : copy.uploadButton}
          </button>
        </div>

        <aside className="library-index-card">
          <div className="library-index-icon">
            <SparkleIcon width={18} height={18} />
          </div>

          <span>MASTEACON INDEX</span>

          <strong>
            {documents.length > 0
              ? Math.round(
                  (indexedCount /
                    documents.length) *
                    100,
                )
              : 0}
            %
          </strong>

          <p>
            {indexedCount} / {documents.length}{" "}
            {copy.indexed.toLowerCase()}
          </p>

          <div className="library-index-bar">
            <span
              style={{
                width:
                  documents.length > 0
                    ? `${Math.round(
                        (indexedCount /
                          documents.length) *
                          100,
                      )}%`
                    : "0%",
              }}
            />
          </div>
        </aside>
      </section>

      <section className="library-browser">
        <div className="library-browser-header">
          <div>
            <span className="library-section-kicker">
              {copy.sources}
            </span>

            <h2>{copy.title}</h2>
          </div>

          <span className="library-source-count">
            {documents.length} {copy.sourceCount}
          </span>
        </div>

        <div className="library-toolbar">
          <div className="library-search">
            <SearchIcon width={16} height={16} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder={copy.search}
            />
          </div>

          <div className="library-filters">
            <button
              type="button"
              className={
                filter === "all" ? "active" : ""
              }
              onClick={() => setFilter("all")}
            >
              {copy.all}
              <span>{documents.length}</span>
            </button>

            <button
              type="button"
              className={
                filter === "indexed"
                  ? "active"
                  : ""
              }
              onClick={() => setFilter("indexed")}
            >
              {copy.indexedFilter}
              <span>{indexedCount}</span>
            </button>

            <button
              type="button"
              className={
                filter === "processing"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter("processing")
              }
            >
              {copy.processingFilter}
              <span>{processingCount}</span>
            </button>

            <button
              type="button"
              className={
                filter === "failed"
                  ? "active"
                  : ""
              }
              onClick={() => setFilter("failed")}
            >
              {copy.failedFilter}
              <span>{failedCount}</span>
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="library-loading">
            <span className="library-loading-ring" />
          </div>
        )}

        {!isLoading &&
          documents.length === 0 && (
            <div className="library-empty">
              <div className="library-empty-icon">
                <FileIcon width={24} height={24} />
              </div>

              <h3>{copy.emptyTitle}</h3>

              <p>{copy.emptyDescription}</p>

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
              >
                <UploadIcon
                  width={14}
                  height={14}
                />
                {copy.uploadButton}
              </button>
            </div>
          )}

        {!isLoading &&
          documents.length > 0 &&
          visibleDocuments.length === 0 && (
            <div className="library-empty">
              <div className="library-empty-icon">
                <SearchIcon
                  width={24}
                  height={24}
                />
              </div>

              <h3>{copy.noResultsTitle}</h3>

              <p>{copy.noResultsDescription}</p>
            </div>
          )}

        {!isLoading &&
          visibleDocuments.length > 0 && (
            <div className="library-document-grid">
              {visibleDocuments.map(
                (document) => {
                  const fileType =
                    getDocumentType(document);

                  return (
                    <article
                      className="library-document-card"
                      key={document.id}
                    >
                      <div className="library-document-top">
                        <span
                          className={`library-file-mark library-file-mark-${fileType.toLowerCase()}`}
                        >
                          <FileIcon
                            width={20}
                            height={20}
                          />
                        </span>

                        <div className="library-document-name">
                          <span>{fileType}</span>

                          <h3>
                            {document.filename}
                          </h3>
                        </div>

                        <DocumentStatusBadge
                          status={document.status}
                        />
                      </div>

                      <div className="library-document-meta">
                        <div>
                          <span>
                            {copy.uploaded}
                          </span>

                          <strong>
                            {new Date(
                              document.created_at,
                            ).toLocaleString(
                              locale,
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            {copy.workspace}
                          </span>

                          <strong>
                            {
                              activeWorkspace.name
                            }
                          </strong>
                        </div>
                      </div>

                      <div
                        className={`library-document-state library-document-state-${document.status}`}
                      >
                        {document.status ===
                        "indexed" ? (
                          <CheckIcon
                            width={13}
                            height={13}
                          />
                        ) : document.status ===
                          "failed" ? (
                          <WarningIcon
                            width={13}
                            height={13}
                          />
                        ) : (
                          <ClockIcon
                            width={13}
                            height={13}
                          />
                        )}

                        <span>
                          {getStatusMessage(
                            document,
                          )}
                        </span>
                      </div>

                      {document.error_message && (
                        <p className="library-document-error">
                          {
                            document.error_message
                          }
                        </p>
                      )}
                    </article>
                  );
                },
              )}
            </div>
          )}
      </section>
    </div>
  );
}

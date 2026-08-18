import {
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  FileIcon,
  FolderIcon,
  PlusIcon,
  SearchIcon,
  SparkleIcon,
  WarningIcon,
} from "../components/icons";
import { Logo } from "../components/Logo";

import { useI18n } from "../context/I18nContext";
import { useWorkspace } from "../context/WorkspaceContext";

export function WorkspacesPage() {
  const {
    workspaces,
    activeWorkspace,
    isLoading,
    createWorkspace,
    selectWorkspace,
  } = useWorkspace();

  const { locale } = useI18n();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  const copy =
    locale === "tr"
      ? {
          eyebrow: "KNOWLEDGE SPACES",
          title: "Çalışma Alanları",
          subtitle:
            "Bilginizi ayrı bağlamlarda düzenleyin ve Masteacon'ın hangi bilgi alanıyla çalışacağını yönetin.",
          portfolio: "WORKSPACE PORTFOLIO",
          total: "Toplam Alan",
          active: "Aktif Alan",
          current: "Şu anda kullanımda",
          createEyebrow: "NEW KNOWLEDGE SPACE",
          createTitle:
            "Yeni bir bilgi alanı oluşturun.",
          createDescription:
            "Dokümanları, konuşmaları ve kaynaklı AI deneyimlerini ayrı bir çalışma alanında düzenleyin.",
          placeholder:
            "Örn. Research Intelligence",
          create: "Çalışma Alanı Oluştur",
          creating: "Oluşturuluyor...",
          search:
            "Çalışma alanlarında ara...",
          spaces: "BİLGİ ALANLARI",
          available: "kullanılabilir alan",
          activeBadge: "AKTİF",
          availableBadge: "HAZIR",
          created: "Oluşturuldu",
          updated: "Son güncelleme",
          owner: "Sahiplik",
          you: "Size ait",
          open: "Knowledge Library'yi Aç",
          makeActive: "Aktif Hale Getir",
          activeWorkspace:
            "Aktif çalışma alanı",
          ready:
            "Masteacon için kullanılabilir",
          noWorkspaces:
            "Henüz çalışma alanınız yok.",
          noWorkspacesDescription:
            "İlk knowledge space'inizi oluşturarak dokümanlarınızı ve AI çalışmalarınızı düzenlemeye başlayın.",
          noResults:
            "Eşleşen çalışma alanı bulunamadı.",
          noResultsDescription:
            "Farklı bir arama terimi deneyin.",
          failed:
            "Çalışma alanı oluşturulamadı.",
          recent:
            "Son güncellenen",
          openCommandCenter:
            "Command Center'ı Aç",
        }
      : {
          eyebrow: "KNOWLEDGE SPACES",
          title: "Workspaces",
          subtitle:
            "Organize knowledge into distinct contexts and control which knowledge space Masteacon works with.",
          portfolio: "WORKSPACE PORTFOLIO",
          total: "Total Spaces",
          active: "Active Space",
          current: "Currently in use",
          createEyebrow: "NEW KNOWLEDGE SPACE",
          createTitle:
            "Create a new knowledge space.",
          createDescription:
            "Organize documents, conversations and grounded AI experiences inside a dedicated workspace.",
          placeholder:
            "e.g. Research Intelligence",
          create: "Create Workspace",
          creating: "Creating...",
          search:
            "Search workspaces...",
          spaces: "KNOWLEDGE SPACES",
          available: "available spaces",
          activeBadge: "ACTIVE",
          availableBadge: "READY",
          created: "Created",
          updated: "Last updated",
          owner: "Ownership",
          you: "Owned by you",
          open: "Open Knowledge Library",
          makeActive: "Make Active",
          activeWorkspace:
            "Active workspace",
          ready:
            "Available to Masteacon",
          noWorkspaces:
            "No workspaces yet.",
          noWorkspacesDescription:
            "Create your first knowledge space to organize documents and AI workflows.",
          noResults:
            "No matching workspaces.",
          noResultsDescription:
            "Try a different search term.",
          failed:
            "Failed to create workspace.",
          recent:
            "Most recently updated",
          openCommandCenter:
            "Open Command Center",
        };

  const visibleWorkspaces = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    const sorted = [...workspaces].sort(
      (a, b) =>
        new Date(b.updated_at).getTime() -
        new Date(a.updated_at).getTime(),
    );

    if (!query) {
      return sorted;
    }

    return sorted.filter((workspace) =>
      workspace.name
        .toLowerCase()
        .includes(query),
    );
  }, [search, workspaces]);

  const mostRecentWorkspace =
    useMemo(() => {
      if (workspaces.length === 0) {
        return null;
      }

      return [...workspaces].sort(
        (a, b) =>
          new Date(b.updated_at).getTime() -
          new Date(a.updated_at).getTime(),
      )[0];
    }, [workspaces]);

  async function handleCreate(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (!name.trim() || isCreating) {
      return;
    }

    setError(null);
    setIsCreating(true);

    try {
      await createWorkspace(name.trim());
      setName("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : copy.failed,
      );
    } finally {
      setIsCreating(false);
    }
  }

  function openWorkspace(
    workspaceId: number,
  ) {
    selectWorkspace(workspaceId);
    navigate("/documents");
  }

  function openCommandCenter(
    workspaceId: number,
  ) {
    selectWorkspace(workspaceId);
    navigate("/overview");
  }

  return (
    <div className="spaces-page">
      <header className="spaces-header">
        <div>
          <span className="spaces-eyebrow">
            {copy.eyebrow}
          </span>

          <h1>{copy.title}</h1>

          <p>{copy.subtitle}</p>
        </div>

        {activeWorkspace && (
          <div className="spaces-active-context">
            <span>
              {copy.activeWorkspace.toUpperCase()}
            </span>

            <strong>
              <span className="spaces-active-dot" />
              {activeWorkspace.name}
            </strong>

            <small>
              {copy.current}
            </small>
          </div>
        )}
      </header>

      {error && (
        <div className="error-banner spaces-error">
          <WarningIcon
            width={15}
            height={15}
          />
          <span>{error}</span>
        </div>
      )}

      <section className="spaces-summary-grid">
        <article className="spaces-summary-card">
          <span className="spaces-summary-icon">
            <FolderIcon
              width={17}
              height={17}
            />
          </span>

          <div>
            <span>{copy.total}</span>
            <strong>
              {workspaces.length}
            </strong>
          </div>
        </article>

        <article className="spaces-summary-card">
          <span className="spaces-summary-icon spaces-summary-icon-active">
            <CheckIcon
              width={17}
              height={17}
            />
          </span>

          <div>
            <span>{copy.active}</span>
            <strong className="spaces-summary-name">
              {activeWorkspace?.name ?? "—"}
            </strong>
          </div>
        </article>

        <article className="spaces-summary-card spaces-summary-card-wide">
          <span className="spaces-summary-icon">
            <ClockIcon
              width={17}
              height={17}
            />
          </span>

          <div>
            <span>{copy.recent}</span>

            <strong className="spaces-summary-name">
              {mostRecentWorkspace?.name ??
                "—"}
            </strong>
          </div>
        </article>
      </section>

      <section className="spaces-create-card">
        <div className="spaces-create-ambient" />

        <div className="spaces-create-visual">
          <div className="spaces-create-ring spaces-create-ring-one" />
          <div className="spaces-create-ring spaces-create-ring-two" />
          <div className="spaces-create-ring spaces-create-ring-three" />

          <div className="spaces-create-logo">
            <Logo size={88} />
          </div>
        </div>

        <div className="spaces-create-copy">
          <span>
            {copy.createEyebrow}
          </span>

          <h2>{copy.createTitle}</h2>

          <p>
            {copy.createDescription}
          </p>
        </div>

        <form
          className="spaces-create-form"
          onSubmit={handleCreate}
        >
          <div className="spaces-create-input">
            <FolderIcon
              width={16}
              height={16}
            />

            <input
              id="workspace-name"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              placeholder={
                copy.placeholder
              }
            />
          </div>

          <button
            type="submit"
            disabled={
              isCreating ||
              !name.trim()
            }
          >
            {isCreating ? (
              <ClockIcon
                width={15}
                height={15}
              />
            ) : (
              <PlusIcon
                width={15}
                height={15}
              />
            )}

            {isCreating
              ? copy.creating
              : copy.create}
          </button>
        </form>
      </section>

      <section className="spaces-browser">
        <div className="spaces-browser-header">
          <div>
            <span>
              {copy.spaces}
            </span>

            <h2>{copy.portfolio}</h2>
          </div>

          <span className="spaces-count">
            {workspaces.length}{" "}
            {copy.available}
          </span>
        </div>

        <div className="spaces-toolbar">
          <div className="spaces-search">
            <SearchIcon
              width={15}
              height={15}
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder={copy.search}
            />
          </div>
        </div>

        {isLoading && (
          <div className="spaces-loading">
            <span />
          </div>
        )}

        {!isLoading &&
          workspaces.length === 0 && (
            <div className="spaces-empty">
              <div className="spaces-empty-visual">
                <div className="spaces-empty-ring" />

                <FolderIcon
                  width={28}
                  height={28}
                />
              </div>

              <span>
                MASTEACON KNOWLEDGE
              </span>

              <h3>
                {copy.noWorkspaces}
              </h3>

              <p>
                {
                  copy.noWorkspacesDescription
                }
              </p>
            </div>
          )}

        {!isLoading &&
          workspaces.length > 0 &&
          visibleWorkspaces.length === 0 && (
            <div className="spaces-empty">
              <div className="spaces-empty-visual">
                <SearchIcon
                  width={27}
                  height={27}
                />
              </div>

              <h3>
                {copy.noResults}
              </h3>

              <p>
                {
                  copy.noResultsDescription
                }
              </p>
            </div>
          )}

        {!isLoading &&
          visibleWorkspaces.length > 0 && (
            <div className="spaces-grid">
              {visibleWorkspaces.map(
                (workspace, index) => {
                  const isActive =
                    activeWorkspace?.id ===
                    workspace.id;

                  return (
                    <article
                      className={
                        isActive
                          ? "space-card space-card-active"
                          : "space-card"
                      }
                      key={workspace.id}
                    >
                      <div className="space-card-top">
                        <div className="space-card-mark">
                          <div className="space-card-orbit">
                            <span />
                            <span />
                          </div>

                          <FolderIcon
                            width={20}
                            height={20}
                          />
                        </div>

                        <div className="space-card-title">
                          <span>
                            SPACE{" "}
                            #
                            {String(
                              index + 1,
                            ).padStart(
                              2,
                              "0",
                            )}
                          </span>

                          <h3>
                            {
                              workspace.name
                            }
                          </h3>
                        </div>

                        <span
                          className={
                            isActive
                              ? "space-card-status space-card-status-active"
                              : "space-card-status"
                          }
                        >
                          {isActive ? (
                            <CheckIcon
                              width={9}
                              height={9}
                            />
                          ) : (
                            <SparkleIcon
                              width={9}
                              height={9}
                            />
                          )}

                          {isActive
                            ? copy.activeBadge
                            : copy.availableBadge}
                        </span>
                      </div>

                      <div className="space-card-description">
                        <SparkleIcon
                          width={13}
                          height={13}
                        />

                        <span>
                          {copy.ready}
                        </span>
                      </div>

                      <div className="space-card-meta">
                        <div>
                          <span>
                            {copy.created}
                          </span>

                          <strong>
                            {new Date(
                              workspace.created_at,
                            ).toLocaleDateString(
                              locale ===
                                "tr"
                                ? "tr-TR"
                                : "en-US",
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            {copy.updated}
                          </span>

                          <strong>
                            {new Date(
                              workspace.updated_at,
                            ).toLocaleDateString(
                              locale ===
                                "tr"
                                ? "tr-TR"
                                : "en-US",
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            {copy.owner}
                          </span>

                          <strong>
                            {copy.you}
                          </strong>
                        </div>
                      </div>

                      <div className="space-card-actions">
                        {!isActive && (
                          <button
                            type="button"
                            className="space-card-secondary"
                            onClick={() =>
                              selectWorkspace(
                                workspace.id,
                              )
                            }
                          >
                            <CheckIcon
                              width={12}
                              height={12}
                            />

                            {
                              copy.makeActive
                            }
                          </button>
                        )}

                        {isActive && (
                          <button
                            type="button"
                            className="space-card-secondary"
                            onClick={() =>
                              openCommandCenter(
                                workspace.id,
                              )
                            }
                          >
                            <SparkleIcon
                              width={12}
                              height={12}
                            />

                            {
                              copy.openCommandCenter
                            }
                          </button>
                        )}

                        <button
                          type="button"
                          className="space-card-primary"
                          onClick={() =>
                            openWorkspace(
                              workspace.id,
                            )
                          }
                        >
                          <FileIcon
                            width={12}
                            height={12}
                          />

                          {copy.open}

                          <ChevronRightIcon
                            width={12}
                            height={12}
                          />
                        </button>
                      </div>
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

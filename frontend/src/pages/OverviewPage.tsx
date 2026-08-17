import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../api/endpoints";
import { useI18n } from "../context/I18nContext";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import type { AgentAskResponse, ConversationResponse, DocumentResponse } from "../api/types";

interface ActivityItem {
  id: string;
  icon: string;
  label: string;
  detail: string;
  at: string;
}

function timeAgo(iso: string, locale: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return locale === "tr" ? "az önce" : "just now";
  if (minutes < 60) return locale === "tr" ? `${minutes}dk önce` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return locale === "tr" ? `${hours}sa önce` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return locale === "tr" ? `${days}g önce` : `${days}d ago`;
}

export function OverviewPage() {
  const { user } = useAuth();
  const { activeWorkspace, workspaces } = useWorkspace();
  const { t, locale } = useI18n();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [asking, setAsking] = useState(false);
  const [thread, setThread] = useState<{ question: string; response: AgentAskResponse }[]>([]);

  useEffect(() => {
    if (!activeWorkspace) return;
    setIsLoading(true);
    Promise.all([api.listDocuments(activeWorkspace.id), api.listConversations(activeWorkspace.id)])
      .then(([docs, convos]) => {
        setDocuments(docs);
        setConversations(convos);
      })
      .finally(() => setIsLoading(false));
  }, [activeWorkspace]);

  const indexedCount = documents.filter((d) => d.status === "indexed").length;
  const coveragePct = documents.length > 0 ? Math.round((indexedCount / documents.length) * 100) : 0;
  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  const activity: ActivityItem[] = [
    ...documents.map((d) => ({
      id: `doc-${d.id}`,
      icon: d.status === "indexed" ? "✅" : d.status === "failed" ? "⚠️" : "📤",
      label: d.filename,
      detail: locale === "tr" ? "Yüklendi" : "Uploaded",
      at: d.created_at,
    })),
    ...conversations.map((c) => ({
      id: `convo-${c.id}`,
      icon: "💬",
      label: c.title,
      detail: locale === "tr" ? "Konuşma başlatıldı" : "Conversation started",
      at: c.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 5);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || asking) return;
    const question = prompt.trim();
    setPrompt("");
    setAsking(true);
    try {
      const response = await api.agentAsk(question);
      setThread((prev) => [...prev, { question, response }]);
    } catch {
      setThread((prev) => [
        ...prev,
        { question, response: { answer: locale === "tr" ? "Bir şeyler ters gitti." : "Something went wrong.", tool_calls: [] } },
      ]);
    } finally {
      setAsking(false);
    }
  }

  const initial = (user?.email || "?").charAt(0).toUpperCase();
  const suggestions =
    locale === "tr"
      ? ["Hangi çalışma alanlarım var?", "Son dokümanları özetle", "Okunmamış dokümanları listele"]
      : ["What workspaces do I have?", "Summarize recent documents", "List unread documents"];

  return (
    <div>
      {/* Top bar: search + notifications + avatar (search/bell are decorative — no backend for global search/notifications yet) */}
      <div className="overview-topbar">
        <div className="overview-search">
          <span>🔍</span>
          <input placeholder={locale === "tr" ? "Doküman, sohbet ara veya bir şey sor…" : "Search documents, chats, or ask anything…"} />
          <kbd>⌘K</kbd>
        </div>
        <div className="overview-topbar-right">
          <button className="icon-btn" aria-label="Notifications" title={locale === "tr" ? "Bildirimler" : "Notifications"}>
            🔔<span className="icon-btn-badge">3</span>
          </button>
          <div className="avatar-chip">{initial}</div>
        </div>
      </div>

      <h1 className="page-title">{t("nav.overview") ?? "Overview"}</h1>
      <p className="page-subtitle">
        {locale === "tr" ? "Tekrar hoş geldin" : "Welcome back"}, {user?.email?.split("@")[0]}!{" "}
        {locale === "tr" ? "İşte" : "Here's what's happening in"} {activeWorkspace?.name ?? "—"}
        {locale === "tr" ? " alanında olanlar." : "."}
      </p>

      {/* Hero prompt */}
      <div className="hero-card">
        <div className="hero-card-glow" />
        <img className="hero-card-art" src="/logo.png" alt="" />
        <div className="hero-card-content">
          <h2>
            {locale === "tr" ? "Bilgi bankana " : "Ask your "}
            <span className="text-gradient">{locale === "tr" ? "her şeyi sor" : "knowledge anything"}</span>
          </h2>
          <p>
            {locale === "tr"
              ? "AI asistanın tüm çalışma alanlarını ve dokümanlarını tarayarak anlamana, özetlemene ve aksiyon almana yardımcı olur."
              : "Your AI assistant can search across your workspaces and documents to help you understand, summarize, and take action."}
          </p>
          <form onSubmit={handleAsk} className="hero-card-form">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={locale === "tr" ? 'örn. "1 numaralı alandaki 4 numaralı dokümanı özetle"' : 'e.g. "Summarize document 4 in workspace 1"'}
            />
            <button className="btn" type="submit" disabled={asking || !prompt.trim()}>
              ➤
            </button>
          </form>
          <div className="hero-card-suggestions">
            {suggestions.map((s) => (
              <button key={s} type="button" onClick={() => setPrompt(s)}>
                ✨ {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overview-grid">
        <div className="card stat-card">
          <div className="top-bar" style={{ marginBottom: 12 }}>
            <span className="card-eyebrow">{locale === "tr" ? "Alan Özeti" : "Workspace Overview"}</span>
            <button className="btn-ghost btn-sm" onClick={() => navigate("/workspaces")}>
              {locale === "tr" ? "Tümü" : "View all"}
            </button>
          </div>
          <div className="stat-row">
            <div>
              <div className="stat-number">{workspaces.length}</div>
              <div className="stat-label">📚 {t("nav.workspaces")}</div>
              <div className="stat-number" style={{ marginTop: 14 }}>
                {documents.length}
              </div>
              <div className="stat-label">📄 {t("nav.documents")}</div>
              <div className="stat-number" style={{ marginTop: 14 }}>
                {conversations.length}
              </div>
              <div className="stat-label">💬 {locale === "tr" ? "Konuşmalar" : "Conversations"}</div>
            </div>
            <div className="progress-ring-wrap">
              <svg viewBox="0 0 120 120" className="progress-ring">
                <circle cx="60" cy="60" r="50" className="progress-ring-track" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  className="progress-ring-value"
                  style={{ strokeDasharray: `${(coveragePct / 100) * 314} 314` }}
                />
              </svg>
              <div className="progress-ring-label">
                <strong>{coveragePct}%</strong>
                <span>{locale === "tr" ? "İndeks" : "Coverage"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="top-bar" style={{ marginBottom: 8 }}>
            <span className="card-eyebrow">{locale === "tr" ? "Son Dokümanlar" : "Recent Documents"}</span>
            <button className="btn-ghost btn-sm" onClick={() => navigate("/documents")}>
              {locale === "tr" ? "Tümü" : "View all"}
            </button>
          </div>
          {isLoading && <div className="spinner-text">{t("common.loading")}</div>}
          {!isLoading && recentDocuments.length === 0 && <div className="empty-state">{t("documents.empty")}</div>}
          {recentDocuments.map((d) => (
            <div key={d.id} className="mini-row">
              <span className={`file-chip file-chip-${d.content_type.includes("pdf") ? "pdf" : d.content_type.includes("word") ? "docx" : "txt"}`}>
                {d.content_type.includes("pdf") ? "PDF" : d.content_type.includes("word") ? "DOCX" : "TXT"}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="mini-row-title">{d.filename}</div>
                <div className="mini-row-sub">{timeAgo(d.created_at, locale)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <span className="card-eyebrow">{locale === "tr" ? "Hızlı İşlemler" : "Quick Actions"}</span>
          <div className="quick-actions">
            <button onClick={() => navigate("/documents")}>
              <span className="quick-action-icon">⬆️</span>
              <span>
                <strong>{locale === "tr" ? "Doküman Yükle" : "Upload Document"}</strong>
                <small>{locale === "tr" ? "Dosya ekle" : "Add files to your workspace"}</small>
              </span>
            </button>
            <button onClick={() => navigate("/workspaces")}>
              <span className="quick-action-icon">🗂️</span>
              <span>
                <strong>{locale === "tr" ? "Çalışma Alanı Oluştur" : "Create Workspace"}</strong>
                <small>{locale === "tr" ? "Bilginizi düzenleyin" : "Organize your knowledge"}</small>
              </span>
            </button>
            <button onClick={() => navigate("/chat")}>
              <span className="quick-action-icon">💬</span>
              <span>
                <strong>{locale === "tr" ? "Yeni Sohbet" : "New Chat"}</strong>
                <small>{locale === "tr" ? "Bir konuşma başlat" : "Start a conversation"}</small>
              </span>
            </button>
            <button onClick={() => navigate("/agent")}>
              <span className="quick-action-icon">✨</span>
              <span>
                <strong>{locale === "tr" ? "Ajanı Çalıştır" : "Run Agent"}</strong>
                <small>{locale === "tr" ? "Görevleri otomatikleştir" : "Automate knowledge tasks"}</small>
              </span>
            </button>
          </div>
        </div>

        <div className="card">
          <span className="card-eyebrow">{locale === "tr" ? "Etkinlik" : "Activity"}</span>
          {activity.length === 0 && <div className="empty-state">{locale === "tr" ? "Henüz etkinlik yok." : "No activity yet."}</div>}
          {activity.map((item) => (
            <div key={item.id} className="mini-row">
              <span className="activity-icon">{item.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="mini-row-title">{item.label}</div>
                <div className="mini-row-sub">
                  {item.detail} · {timeAgo(item.at, locale)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="overview-grid overview-grid-bottom">
        <div className="card assistant-card">
          <div className="top-bar" style={{ marginBottom: 4 }}>
            <span className="card-eyebrow">✨ {locale === "tr" ? "AI Asistan" : "AI Assistant"}</span>
            {thread.length > 0 && (
              <button className="btn-ghost btn-sm" onClick={() => setThread([])}>
                {locale === "tr" ? "Sohbeti temizle" : "Clear chat"}
              </button>
            )}
          </div>
          <div className="assistant-thread">
            {thread.length === 0 && (
              <div className="empty-state">
                {locale === "tr" ? "Yukarıdaki alandan veya buradan bir şey sorun." : "Ask something above, or right here."}
              </div>
            )}
            {thread.map((turn, i) => (
              <div key={i} className="assistant-exchange">
                <div className="chat-bubble user" style={{ maxWidth: "100%" }}>
                  {turn.question}
                </div>
                <div className="chat-bubble assistant" style={{ maxWidth: "100%" }}>
                  {turn.response.answer}
                  {turn.response.tool_calls.map((call, j) => (
                    <div key={j} className="tool-call-log">
                      <span className="tool-name">{call.name}</span>{" "}
                      <span style={{ color: call.success ? "var(--success)" : "var(--danger)" }}>
                        {call.success ? "✓" : "✗"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <form className="chat-input-row" onSubmit={handleAsk}>
            <textarea
              rows={1}
              placeholder={locale === "tr" ? "Takip sorusu sor…" : "Ask a follow-up question…"}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button className="btn" type="submit" disabled={asking || !prompt.trim()}>
              {asking ? "…" : "➤"}
            </button>
          </form>
          <p className="assistant-disclaimer">
            {locale === "tr"
              ? "AI cevapları hatalı olabilir. Önemli bilgileri doğrulayın."
              : "AI responses may be inaccurate. Please verify important information."}
          </p>
        </div>

        {/* Knowledge Insights: illustrative only — there's no analytics/insights backend yet. */}
        <div className="card insights-card">
          <span className="card-eyebrow">{locale === "tr" ? "Bilgi İçgörüleri" : "Knowledge Insights"}</span>
          <div className="insights-row">
            <div>
              <div className="insights-label">{locale === "tr" ? "En Çok Sorulan Konu" : "Most Queried Topic"}</div>
              <div className="insights-value">HR Policies</div>
              <div className="insights-sub">32 {locale === "tr" ? "sorgu" : "queries"}</div>
            </div>
            <div>
              <div className="insights-label">{locale === "tr" ? "En Popüler Doküman" : "Top Document"}</div>
              <div className="insights-value" style={{ fontSize: 15 }}>
                Employee Handbook.docx
              </div>
              <div className="insights-sub">18 {locale === "tr" ? "sorgu" : "queries"}</div>
            </div>
          </div>
          <div className="insights-chart-label">
            <span>{locale === "tr" ? "AI Doğruluğu" : "AI Accuracy"}</span>
            <strong className="text-success">98.4%</strong>
          </div>
          <svg viewBox="0 0 260 70" className="sparkline">
            <polyline
              points="0,50 20,45 40,48 60,35 80,40 100,28 120,32 140,20 160,25 180,15 200,18 220,10 240,14 260,8"
              fill="none"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

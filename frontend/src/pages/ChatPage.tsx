import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "../api/endpoints";
import { PlusIcon, SendIcon } from "../components/icons";
import { useI18n } from "../context/I18nContext";
import { useWorkspace } from "../context/WorkspaceContext";
import type { ConversationDetailResponse, ConversationResponse, MessageResponse, SourceItem } from "../api/types";

export function ChatPage() {
  const { activeWorkspace } = useWorkspace();
  const { t } = useI18n();
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationDetailResponse | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastSources, setLastSources] = useState<Record<number, SourceItem[]>>({});

  const loadConversations = useCallback(async () => {
    if (!activeWorkspace) return;
    const list = await api.listConversations(activeWorkspace.id);
    setConversations(list);
    return list;
  }, [activeWorkspace]);

  useEffect(() => {
    setActiveConversation(null);
    if (activeWorkspace) loadConversations();
  }, [activeWorkspace, loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages.length]);

  async function openConversation(id: number) {
    setError(null);
    const detail = await api.getConversation(id);
    setActiveConversation(detail);
  }

  async function startNewConversation() {
    if (!activeWorkspace) return;
    setError(null);
    const conversation = await api.createConversation(activeWorkspace.id, "New Conversation");
    await loadConversations();
    await openConversation(conversation.id);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !activeConversation) return;
    const content = draft.trim();
    setDraft("");
    setIsSending(true);
    setError(null);

    const optimisticUser: MessageResponse = {
      id: -Date.now(),
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setActiveConversation((prev) => (prev ? { ...prev, messages: [...prev.messages, optimisticUser] } : prev));

    try {
      const response = await api.postMessage(activeConversation.id, content);
      setActiveConversation((prev) => {
        if (!prev) return prev;
        const withoutOptimistic = prev.messages.filter((m) => m.id !== optimisticUser.id);
        return { ...prev, messages: [...withoutOptimistic, response.user_message, response.assistant_message] };
      });
      setLastSources((prev) => ({ ...prev, [response.assistant_message.id]: response.sources }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
      setActiveConversation((prev) =>
        prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== optimisticUser.id) } : prev,
      );
    } finally {
      setIsSending(false);
    }
  }

  if (!activeWorkspace) {
    return (
      <div>
        <h1 className="page-title">{t("chat.title")}</h1>
        <div className="empty-state">{t("chat.emptyNoWorkspace")}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="top-bar">
        <div>
          <h1 className="page-title">{t("chat.title")}</h1>
          <p className="page-subtitle">
            {t("chat.subtitle")} {activeWorkspace.name}.
          </p>
        </div>
        <button className="btn" onClick={startNewConversation}>
          <PlusIcon width={16} height={16} /> {t("chat.newConversation")}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="chat-layout">
        <div className="card conversation-list">
          {conversations.length === 0 && <div className="empty-state">{t("chat.emptyList")}</div>}
          {conversations.map((c) => (
            <div
              key={c.id}
              className="list-item"
              style={{
                cursor: "pointer",
                borderColor: activeConversation?.id === c.id ? "var(--brand-2)" : undefined,
              }}
              onClick={() => openConversation(c.id)}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>{c.title}</div>
            </div>
          ))}
        </div>

        <div className="card chat-thread">
          {!activeConversation && <div className="empty-state">{t("chat.emptyThread")}</div>}
          {activeConversation && (
            <>
              <div className="chat-messages">
                {activeConversation.messages.length === 0 && (
                  <div className="empty-state">{t("chat.emptyMessages")}</div>
                )}
                {activeConversation.messages.map((message) => (
                  <div key={message.id}>
                    <div className={`chat-bubble ${message.role}`}>{message.content}</div>
                    {message.role === "assistant" && lastSources[message.id]?.length ? (
                      <div className="chat-sources">
                        {t("chat.sources")}:{" "}
                        {lastSources[message.id]
                          .map((s) => `${s.filename} (chunk ${s.chunk_index}, ${s.similarity_score.toFixed(2)})`)
                          .join(", ")}
                      </div>
                    ) : null}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-row" onSubmit={handleSend}>
                <textarea
                  rows={2}
                  placeholder={t("chat.placeholder")}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                />
                <button className="btn" type="submit" disabled={isSending || !draft.trim()}>
                  {isSending ? t("chat.thinking") : (
                    <>
                      <SendIcon width={15} height={15} /> {t("chat.send")}
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "../api/endpoints";
import { useWorkspace } from "../context/WorkspaceContext";
import type { ConversationDetailResponse, ConversationResponse, MessageResponse, SourceItem } from "../api/types";

export function ChatPage() {
  const { activeWorkspace } = useWorkspace();
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

    // Optimistically show the user's message immediately.
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
        <h1 className="page-title">Chat</h1>
        <div className="empty-state">Create or select a workspace first.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="top-bar">
        <div>
          <h1 className="page-title">Chat</h1>
          <p className="page-subtitle">Ask questions about the documents in {activeWorkspace.name}.</p>
        </div>
        <button className="btn" onClick={startNewConversation}>
          + New conversation
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="chat-layout">
        <div className="card conversation-list">
          {conversations.length === 0 && <div className="empty-state">No conversations yet.</div>}
          {conversations.map((c) => (
            <div
              key={c.id}
              className="list-item"
              style={{
                cursor: "pointer",
                borderColor: activeConversation?.id === c.id ? "var(--color-primary)" : undefined,
              }}
              onClick={() => openConversation(c.id)}
            >
              <div style={{ fontSize: 13, fontWeight: 500 }}>{c.title}</div>
            </div>
          ))}
        </div>

        <div className="card chat-thread">
          {!activeConversation && (
            <div className="empty-state">Select a conversation, or start a new one.</div>
          )}
          {activeConversation && (
            <>
              <div className="chat-messages">
                {activeConversation.messages.length === 0 && (
                  <div className="empty-state">Ask your first question below.</div>
                )}
                {activeConversation.messages.map((message) => (
                  <div key={message.id}>
                    <div className={`chat-bubble ${message.role}`}>{message.content}</div>
                    {message.role === "assistant" && lastSources[message.id]?.length ? (
                      <div className="chat-sources">
                        Sources:{" "}
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
                  placeholder="Ask a question about this workspace's documents…"
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
                  {isSending ? "Thinking…" : "Send"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

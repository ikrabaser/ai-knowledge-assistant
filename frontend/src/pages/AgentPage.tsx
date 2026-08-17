import { useState } from "react";
import * as api from "../api/endpoints";
import { useI18n } from "../context/I18nContext";
import type { AgentAskResponse } from "../api/types";

interface Turn {
  question: string;
  response: AgentAskResponse;
}

export function AgentPage() {
  const { t } = useI18n();
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setError(null);
    setIsAsking(true);
    const asked = question.trim();
    setQuestion("");
    try {
      const response = await api.agentAsk(asked);
      setTurns((prev) => [...prev, { question: asked, response }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Agent request failed.");
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">{t("agent.title")}</h1>
      <p className="page-subtitle">
        {t("agent.subtitle")} <strong>{t("agent.subtitleAll")}</strong> {t("agent.subtitleEnd")}
      </p>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
          <input
            style={{ flex: 1 }}
            placeholder={t("agent.placeholder")}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button className="btn" type="submit" disabled={isAsking || !question.trim()}>
            {isAsking ? t("agent.thinking") : t("agent.ask")}
          </button>
        </form>
      </div>

      {turns.length === 0 && <div className="empty-state">{t("agent.empty")}</div>}

      {turns
        .slice()
        .reverse()
        .map((turn, i) => (
          <div key={i} className="card">
            <div style={{ fontWeight: 700, marginBottom: 8 }}>❓ {turn.question}</div>
            <div style={{ marginBottom: turn.response.tool_calls.length ? 10 : 0 }}>{turn.response.answer}</div>
            {turn.response.tool_calls.map((call, j) => (
              <div key={j} className="tool-call-log">
                <span className="tool-name">{call.name}</span>{" "}
                <span style={{ color: call.success ? "var(--success)" : "var(--danger)" }}>
                  {call.success ? `✓ ${t("agent.succeeded")}` : `✗ ${t("agent.failed")}`}
                </span>
                {call.error && <div style={{ marginTop: 4 }}>{call.error}</div>}
                {call.result && (
                  <pre style={{ margin: "6px 0 0", whiteSpace: "pre-wrap", fontSize: 11 }}>
                    {JSON.stringify(call.result, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}

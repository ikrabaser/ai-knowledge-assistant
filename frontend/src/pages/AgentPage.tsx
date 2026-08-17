import { useState } from "react";
import * as api from "../api/endpoints";
import type { AgentAskResponse } from "../api/types";

interface Turn {
  question: string;
  response: AgentAskResponse;
}

export function AgentPage() {
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
      <h1 className="page-title">Agent</h1>
      <p className="page-subtitle">
        The assistant can call read-only tools (list workspaces/documents, summarize a document) across
        <strong> all</strong> of your workspaces — it decides on its own whether a tool is needed.
      </p>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
          <input
            style={{ flex: 1 }}
            placeholder='e.g. "What workspaces do I have?" or "Summarize document 4 in workspace 1"'
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button className="btn" type="submit" disabled={isAsking || !question.trim()}>
            {isAsking ? "Thinking…" : "Ask"}
          </button>
        </form>
      </div>

      {turns.length === 0 && <div className="empty-state">Ask something to see the agent in action.</div>}

      {turns
        .slice()
        .reverse()
        .map((turn, i) => (
          <div key={i} className="card">
            <div style={{ fontWeight: 600, marginBottom: 8 }}>❓ {turn.question}</div>
            <div style={{ marginBottom: turn.response.tool_calls.length ? 10 : 0 }}>{turn.response.answer}</div>
            {turn.response.tool_calls.map((call, j) => (
              <div key={j} className="tool-call-log">
                <span className="tool-name">{call.name}</span>{" "}
                <span style={{ color: call.success ? "var(--color-success)" : "var(--color-danger)" }}>
                  {call.success ? "✓ succeeded" : "✗ failed"}
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

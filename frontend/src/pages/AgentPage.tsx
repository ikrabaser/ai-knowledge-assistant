import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import * as api from "../api/endpoints";
import type {
  AgentAskResponse,
  ToolCallSummary,
} from "../api/types";

import {
  CheckIcon,
  ClockIcon,
  FileIcon,
  FolderIcon,
  RocketIcon,
  SearchIcon,
  SendIcon,
  SparkleIcon,
  WarningIcon,
  XIcon,
} from "../components/icons";

import { Logo } from "../components/Logo";
import { useI18n } from "../context/I18nContext";

interface AgentTurn {
  id: number;
  question: string;
  response: AgentAskResponse;
  createdAt: string;
}

function formatToolName(name: string) {
  return name
    .split("_")
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function formatToolResult(
  result: Record<string, unknown> | null,
) {
  if (!result) {
    return "";
  }

  return JSON.stringify(result, null, 2);
}

function renderAgentAnswer(text: string) {
  return text.split("\n").map((line, lineIndex) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);

    return (
      <span key={`${line}-${lineIndex}`}>
        {parts.map((part, partIndex) => {
          if (
            part.startsWith("**") &&
            part.endsWith("**")
          ) {
            return (
              <strong key={`${part}-${partIndex}`}>
                {part.slice(2, -2)}
              </strong>
            );
          }

          return part;
        })}

        {lineIndex < text.split("\n").length - 1 && (
          <br />
        )}
      </span>
    );
  });
}

function getToolIcon(name: string) {
  if (name.includes("workspace")) {
    return <FolderIcon width={16} height={16} />;
  }

  if (
    name.includes("document") ||
    name.includes("summary")
  ) {
    return <FileIcon width={16} height={16} />;
  }

  if (
    name.includes("search") ||
    name.includes("find")
  ) {
    return <SearchIcon width={16} height={16} />;
  }

  return <SparkleIcon width={16} height={16} />;
}

export function AgentPage() {
  const { locale } = useI18n();

  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<AgentTurn[]>(
    [],
  );

  const [isAsking, setIsAsking] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const copy =
    locale === "tr"
      ? {
          eyebrow: "TOOL-ENABLED INTELLIGENCE",
          title: "Masteacon Agent",
          subtitle:
            "Bilgi alanlarınızı ve dokümanlarınızı güvenli, salt-okunur araçlarla inceleyen şeffaf AI ajanı.",
          scope: "AGENT SCOPE",
          accountScope: "Hesap kapsamı",
          readOnly: "Salt okunur",
          controlled: "Kontrollü yürütme",
          promptEyebrow: "AGENT COMMAND",
          promptTitle:
            "Bir görevi Masteacon'a devredin.",
          promptDescription:
            "Agent soruyu yorumlar, gerekirse uygun araçları seçer ve yapılandırılmış sonuçlardan nihai yanıt üretir.",
          placeholder:
            "Örn. Çalışma alanlarımı listele...",
          run: "Agent'ı Çalıştır",
          running: "Agent çalışıyor...",
          suggestions: "ÖNERİLEN GÖREVLER",
          suggestionOne:
            "Çalışma alanlarımı listele",
          suggestionTwo:
            "Sahip olduğum dokümanları incele",
          suggestionThree:
            "Bilgi alanlarım hakkında genel bir özet ver",
          session: "SESSION EXECUTIONS",
          runs: "çalıştırma",
          emptyEyebrow: "AGENT EXECUTION",
          emptyTitle:
            "Araç kullanan zekâyı görünür hale getirin.",
          emptyDescription:
            "Bir görev gönderdiğinizde Masteacon'ın karar, tool execution ve final answer akışını burada adım adım göreceksiniz.",
          understand: "Görevi Anla",
          understandDescription:
            "Kullanıcı amacını ve gerekli bilgi kapsamını yorumla.",
          decide: "Araç Kararı",
          directAnswer: "Doğrudan yanıt",
          toolsSelected: "araç seçildi",
          execute: "Araçları Çalıştır",
          noToolNeeded:
            "Bu görev için araç kullanımı gerekmedi.",
          synthesize: "Sonucu Sentezle",
          synthesizeDescription:
            "Araç sonuçlarını kullanarak nihai yanıtı oluştur.",
          finalAnswer: "FINAL ANSWER",
          trace: "EXECUTION TRACE",
          toolCalls: "TOOL CALLS",
          successful: "Başarılı",
          failed: "Başarısız",
          completed: "Tamamlandı",
          direct: "DIRECT",
          toolEnabled: "TOOLS USED",
          structuredResult:
            "Yapılandırılmış sonucu görüntüle",
          result: "RESULT",
          errorLabel: "ERROR",
          requestFailed:
            "Agent isteği başarısız oldu.",
          liveStepOne: "İstek alındı",
          liveStepTwo:
            "Araç gereksinimi değerlendiriliyor",
          liveStepThree:
            "Gerekirse güvenli araçlar çalıştırılıyor",
          liveStepFour:
            "Nihai yanıt hazırlanıyor",
          latestFirst: "En yeni çalıştırma üstte",
        }
      : {
          eyebrow: "TOOL-ENABLED INTELLIGENCE",
          title: "Masteacon Agent",
          subtitle:
            "A transparent AI agent that inspects your own knowledge with secure, read-only tools.",
          scope: "AGENT SCOPE",
          accountScope: "Account scope",
          readOnly: "Read-only",
          controlled: "Controlled execution",
          promptEyebrow: "AGENT COMMAND",
          promptTitle:
            "Delegate a task to Masteacon.",
          promptDescription:
            "The agent interprets your request, selects tools when needed, and builds the final answer from structured results.",
          placeholder:
            "e.g. List my workspaces...",
          run: "Run Agent",
          running: "Agent is running...",
          suggestions: "SUGGESTED TASKS",
          suggestionOne: "List my workspaces",
          suggestionTwo:
            "Inspect the documents I own",
          suggestionThree:
            "Give me an overview of my knowledge",
          session: "SESSION EXECUTIONS",
          runs: "runs",
          emptyEyebrow: "AGENT EXECUTION",
          emptyTitle:
            "Make tool-enabled intelligence visible.",
          emptyDescription:
            "Run a task to see how Masteacon moves from intent to tool execution and final answer.",
          understand: "Understand Task",
          understandDescription:
            "Interpret user intent and determine what information is needed.",
          decide: "Tool Decision",
          directAnswer: "Direct answer",
          toolsSelected: "tools selected",
          execute: "Execute Tools",
          noToolNeeded:
            "No tool execution was required for this task.",
          synthesize: "Synthesize Result",
          synthesizeDescription:
            "Use the structured tool outcomes to form the final answer.",
          finalAnswer: "FINAL ANSWER",
          trace: "EXECUTION TRACE",
          toolCalls: "TOOL CALLS",
          successful: "Successful",
          failed: "Failed",
          completed: "Completed",
          direct: "DIRECT",
          toolEnabled: "TOOLS USED",
          structuredResult:
            "View structured result",
          result: "RESULT",
          errorLabel: "ERROR",
          requestFailed:
            "Agent request failed.",
          liveStepOne: "Request received",
          liveStepTwo:
            "Evaluating tool requirements",
          liveStepThree:
            "Executing safe tools when needed",
          liveStepFour:
            "Preparing final response",
          latestFirst: "Newest execution first",
        };

  const suggestions = [
    copy.suggestionOne,
    copy.suggestionTwo,
    copy.suggestionThree,
  ];

  const totalToolCalls = useMemo(
    () =>
      turns.reduce(
        (sum, turn) =>
          sum +
          turn.response.tool_calls.length,
        0,
      ),
    [turns],
  );

  const successfulToolCalls = useMemo(
    () =>
      turns.reduce(
        (sum, turn) =>
          sum +
          turn.response.tool_calls.filter(
            (call) => call.success,
          ).length,
        0,
      ),
    [turns],
  );

  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (
      !question.trim() ||
      isAsking
    ) {
      return;
    }

    const asked = question.trim();

    setQuestion("");
    setError(null);
    setIsAsking(true);

    try {
      const response =
        await api.agentAsk(asked);

      setTurns((previous) => [
        {
          id: Date.now(),
          question: asked,
          response,
          createdAt:
            new Date().toISOString(),
        },
        ...previous,
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : copy.requestFailed,
      );
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <div className="agent-console-page">
      <header className="agent-console-header">
        <div>
          <span className="agent-console-eyebrow">
            {copy.eyebrow}
          </span>

          <h1>{copy.title}</h1>

          <p>{copy.subtitle}</p>
        </div>

        <div className="agent-scope-card">
          <span>{copy.scope}</span>

          <strong>
            <RocketIcon
              width={14}
              height={14}
            />
            {copy.accountScope}
          </strong>

          <div>
            <span>
              <CheckIcon
                width={10}
                height={10}
              />
              {copy.readOnly}
            </span>

            <span>
              <CheckIcon
                width={10}
                height={10}
              />
              {copy.controlled}
            </span>
          </div>
        </div>
      </header>

      {error && (
        <div className="error-banner agent-console-error">
          <WarningIcon
            width={15}
            height={15}
          />

          <span>{error}</span>
        </div>
      )}

      <section className="agent-command-card">
        <div className="agent-command-ambient" />

        <div className="agent-command-copy">
          <div className="agent-command-icon">
            <RocketIcon
              width={19}
              height={19}
            />
          </div>

          <div>
            <span>
              {copy.promptEyebrow}
            </span>

            <h2>
              {copy.promptTitle}
            </h2>

            <p>
              {copy.promptDescription}
            </p>
          </div>
        </div>

        <form
          className="agent-command-form"
          onSubmit={handleSubmit}
        >
          <SparkleIcon
            width={17}
            height={17}
          />

          <textarea
            rows={2}
            value={question}
            placeholder={
              copy.placeholder
            }
            onChange={(event) =>
              setQuestion(
                event.target.value,
              )
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();

                event.currentTarget
                  .form
                  ?.requestSubmit();
              }
            }}
          />

          <button
            type="submit"
            disabled={
              isAsking ||
              !question.trim()
            }
          >
            {isAsking ? (
              <ClockIcon
                width={16}
                height={16}
              />
            ) : (
              <SendIcon
                width={16}
                height={16}
              />
            )}

            <span>
              {isAsking
                ? copy.running
                : copy.run}
            </span>
          </button>
        </form>

        <div className="agent-suggestion-row">
          <span>
            {copy.suggestions}
          </span>

          {suggestions.map(
            (suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() =>
                  setQuestion(
                    suggestion,
                  )
                }
              >
                <SparkleIcon
                  width={11}
                  height={11}
                />
                {suggestion}
              </button>
            ),
          )}
        </div>
      </section>

      <section className="agent-session-bar">
        <div>
          <span>{copy.session}</span>

          <strong>
            {turns.length} {copy.runs}
          </strong>

          <small>
            {copy.latestFirst}
          </small>
        </div>

        <div className="agent-session-metrics">
          <span>
            <RocketIcon
              width={12}
              height={12}
            />
            {totalToolCalls}{" "}
            {copy.toolCalls.toLowerCase()}
          </span>

          <span className="agent-session-success">
            <CheckIcon
              width={12}
              height={12}
            />
            {successfulToolCalls}{" "}
            {copy.successful.toLowerCase()}
          </span>
        </div>
      </section>

      {isAsking && (
        <section className="agent-live-run">
          <div className="agent-live-beacon">
            <div className="agent-live-ring agent-live-ring-one" />
            <div className="agent-live-ring agent-live-ring-two" />

            <Logo size={58} />
          </div>

          <div className="agent-live-content">
            <span className="agent-live-kicker">
              LIVE EXECUTION
            </span>

            <strong>
              {copy.running}
            </strong>

            <div className="agent-live-steps">
              <span className="complete">
                <CheckIcon
                  width={11}
                  height={11}
                />
                {copy.liveStepOne}
              </span>

              <span className="active">
                <span className="agent-live-pulse" />
                {copy.liveStepTwo}
              </span>

              <span>
                <RocketIcon
                  width={11}
                  height={11}
                />
                {copy.liveStepThree}
              </span>

              <span>
                <SparkleIcon
                  width={11}
                  height={11}
                />
                {copy.liveStepFour}
              </span>
            </div>
          </div>
        </section>
      )}

      {!isAsking &&
        turns.length === 0 && (
          <section className="agent-console-empty">
            <div className="agent-empty-beacon">
              <div className="agent-empty-ring agent-empty-ring-one" />
              <div className="agent-empty-ring agent-empty-ring-two" />
              <div className="agent-empty-ring agent-empty-ring-three" />

              <Logo size={86} />
            </div>

            <span>
              {copy.emptyEyebrow}
            </span>

            <h2>
              {copy.emptyTitle}
            </h2>

            <p>
              {copy.emptyDescription}
            </p>
          </section>
        )}

      <div className="agent-run-list">
        {turns.map(
          (turn, turnIndex) => {
            const toolCalls =
              turn.response.tool_calls;

            const successes =
              toolCalls.filter(
                (call) =>
                  call.success,
              ).length;

            const failures =
              toolCalls.length -
              successes;

            return (
              <article
                className="agent-run-card"
                key={turn.id}
              >
                <div className="agent-run-header">
                  <div className="agent-run-index">
                    <span>
                      RUN
                    </span>

                    <strong>
                      #
                      {String(
                        turns.length -
                          turnIndex,
                      ).padStart(
                        2,
                        "0",
                      )}
                    </strong>
                  </div>

                  <div className="agent-run-question">
                    <span>
                      REQUEST
                    </span>

                    <h2>
                      {turn.question}
                    </h2>

                    <small>
                      {new Date(
                        turn.createdAt,
                      ).toLocaleTimeString(
                        locale === "tr"
                          ? "tr-TR"
                          : "en-US",
                        {
                          hour: "2-digit",
                          minute:
                            "2-digit",
                        },
                      )}
                    </small>
                  </div>

                  <div className="agent-run-badges">
                    <span className="agent-run-completed">
                      <CheckIcon
                        width={10}
                        height={10}
                      />
                      {
                        copy.completed
                      }
                    </span>

                    <span
                      className={
                        toolCalls.length >
                        0
                          ? "agent-run-mode agent-run-mode-tools"
                          : "agent-run-mode"
                      }
                    >
                      {toolCalls.length >
                      0
                        ? copy.toolEnabled
                        : copy.direct}
                    </span>
                  </div>
                </div>

                <div className="agent-run-body">
                  <section className="agent-trace-panel">
                    <div className="agent-panel-heading">
                      <span>
                        {copy.trace}
                      </span>

                      <div>
                        <span className="agent-trace-success">
                          {
                            successes
                          }{" "}
                          ✓
                        </span>

                        {failures >
                          0 && (
                          <span className="agent-trace-failure">
                            {
                              failures
                            }{" "}
                            ×
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="agent-trace-timeline">
                      <TraceStep
                        number="01"
                        icon={
                          <SearchIcon
                            width={15}
                            height={15}
                          />
                        }
                        title={
                          copy.understand
                        }
                        detail={
                          copy.understandDescription
                        }
                        state="complete"
                      />

                      <TraceConnector />

                      <TraceStep
                        number="02"
                        icon={
                          <SparkleIcon
                            width={15}
                            height={15}
                          />
                        }
                        title={
                          copy.decide
                        }
                        detail={
                          toolCalls.length >
                          0
                            ? `${toolCalls.length} ${copy.toolsSelected}`
                            : copy.directAnswer
                        }
                        state="complete"
                      />

                      <TraceConnector />

                      <div className="agent-trace-tool-stage">
                        <TraceStep
                          number="03"
                          icon={
                            <RocketIcon
                              width={
                                15
                              }
                              height={
                                15
                              }
                            />
                          }
                          title={
                            copy.execute
                          }
                          detail={
                            toolCalls.length >
                            0
                              ? `${successes}/${toolCalls.length} ${copy.successful.toLowerCase()}`
                              : copy.noToolNeeded
                          }
                          state={
                            failures >
                            0
                              ? "warning"
                              : "complete"
                          }
                        />

                        {toolCalls.length >
                          0 && (
                          <div className="agent-tool-stack">
                            {toolCalls.map(
                              (
                                call,
                                index,
                              ) => (
                                <ToolExecutionCard
                                  key={`${call.name}-${index}`}
                                  call={
                                    call
                                  }
                                  copy={
                                    copy
                                  }
                                />
                              ),
                            )}
                          </div>
                        )}
                      </div>

                      <TraceConnector />

                      <TraceStep
                        number="04"
                        icon={
                          <SparkleIcon
                            width={15}
                            height={15}
                          />
                        }
                        title={
                          copy.synthesize
                        }
                        detail={
                          copy.synthesizeDescription
                        }
                        state="complete"
                      />
                    </div>
                  </section>

                  <section className="agent-answer-panel">
                    <div className="agent-panel-heading">
                      <span>
                        {
                          copy.finalAnswer
                        }
                      </span>

                      <span className="agent-answer-status">
                        <CheckIcon
                          width={10}
                          height={10}
                        />

                        {
                          copy.completed
                        }
                      </span>
                    </div>

                    <div className="agent-answer-brand">
                      <div className="agent-answer-logo">
                        <Logo
                          size={38}
                        />
                      </div>

                      <div>
                        <span>
                          MASTEACON
                        </span>

                        <strong>
                          Agent Response
                        </strong>
                      </div>
                    </div>

                    <p>
                      {renderAgentAnswer(
                        turn.response.answer,
                      )}
                    </p>

                    <div className="agent-answer-footer">
                      <span>
                        <RocketIcon
                          width={11}
                          height={11}
                        />

                        {toolCalls.length}
                        {" "}
                        {copy.toolCalls.toLowerCase()}
                      </span>

                      <span>
                        <CheckIcon
                          width={11}
                          height={11}
                        />

                        {successes}
                        {" "}
                        {copy.successful.toLowerCase()}
                      </span>
                    </div>
                  </section>
                </div>
              </article>
            );
          },
        )}
      </div>
    </div>
  );
}

interface TraceStepProps {
  number: string;
  icon: React.ReactNode;
  title: string;
  detail: string;
  state:
    | "complete"
    | "warning";
}

function TraceStep({
  number,
  icon,
  title,
  detail,
  state,
}: TraceStepProps) {
  return (
    <div
      className={`agent-trace-step agent-trace-step-${state}`}
    >
      <div className="agent-trace-node">
        {icon}
      </div>

      <div className="agent-trace-copy">
        <span>{number}</span>

        <strong>{title}</strong>

        <p>{detail}</p>
      </div>
    </div>
  );
}

function TraceConnector() {
  return (
    <div
      className="agent-trace-connector"
      aria-hidden="true"
    />
  );
}

interface ToolExecutionCardProps {
  call: ToolCallSummary;
  copy: {
    successful: string;
    failed: string;
    structuredResult: string;
    result: string;
    errorLabel: string;
  };
}

function ToolExecutionCard({
  call,
  copy,
}: ToolExecutionCardProps) {
  const formattedResult =
    formatToolResult(call.result);

  return (
    <div
      className={
        call.success
          ? "agent-tool-card agent-tool-card-success"
          : "agent-tool-card agent-tool-card-error"
      }
    >
      <div className="agent-tool-header">
        <span className="agent-tool-icon">
          {getToolIcon(call.name)}
        </span>

        <div className="agent-tool-name">
          <span>
            TOOL
          </span>

          <strong>
            {formatToolName(
              call.name,
            )}
          </strong>
        </div>

        <span
          className={
            call.success
              ? "agent-tool-status agent-tool-status-success"
              : "agent-tool-status agent-tool-status-error"
          }
        >
          {call.success ? (
            <CheckIcon
              width={10}
              height={10}
            />
          ) : (
            <XIcon
              width={10}
              height={10}
            />
          )}

          {call.success
            ? copy.successful
            : copy.failed}
        </span>
      </div>

      {call.error && (
        <div className="agent-tool-error">
          <WarningIcon
            width={12}
            height={12}
          />

          <div>
            <span>
              {copy.errorLabel}
            </span>

            <p>
              {call.error}
            </p>
          </div>
        </div>
      )}

      {call.success &&
        formattedResult && (
          <details className="agent-tool-result">
            <summary>
              <span>
                {copy.structuredResult}
              </span>

              <small>
                {copy.result}
              </small>
            </summary>

            <pre>
              {formattedResult}
            </pre>
          </details>
        )}
    </div>
  );
}

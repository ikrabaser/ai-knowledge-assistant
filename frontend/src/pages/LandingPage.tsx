import { useState } from "react";
import { Link } from "react-router-dom";
import { LocaleSwitcher } from "../components/LocaleSwitcher";
import { Logo } from "../components/Logo";
import { ThemeSwitcher } from "../components/ThemeSwitcher";

type PreviewKey = "command" | "library" | "chat" | "agent";

interface PreviewTab {
  key: PreviewKey;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  metricLabel: string;
  metricValue: string;
}

const previewTabs: PreviewTab[] = [
  {
    key: "command",
    label: "Command Center",
    eyebrow: "KNOWLEDGE COMMAND CENTER",
    title: "See what your knowledge can do.",
    description:
      "Track indexed knowledge, retrieval health, grounded activity and workspace intelligence from one calm operating surface.",
    metricLabel: "Knowledge coverage",
    metricValue: "100%",
  },
  {
    key: "library",
    label: "Knowledge Library",
    eyebrow: "MASTEACON INDEX",
    title: "Bring scattered knowledge into one layer.",
    description:
      "Upload and organize PDF, DOCX and TXT content while Masteacon prepares it for semantic retrieval and grounded answers.",
    metricLabel: "Indexed documents",
    metricValue: "24",
  },
  {
    key: "chat",
    label: "Ask Masteacon",
    eyebrow: "GROUNDED ANSWERS",
    title: "Ask naturally. Verify every answer.",
    description:
      "Move beyond keyword search with contextual retrieval, source evidence and answers grounded in the knowledge you control.",
    metricLabel: "Source grounding",
    metricValue: "Active",
  },
  {
    key: "agent",
    label: "AI Agent",
    eyebrow: "AGENT EXECUTION",
    title: "Turn knowledge into action.",
    description:
      "Run intelligent workflows across documents and workspaces with visible tool traces and structured execution feedback.",
    metricLabel: "Tool trace",
    metricValue: "Visible",
  },
];

const withoutMasteacon = [
  "Knowledge scattered across documents and folders",
  "Keyword search misses meaning and context",
  "Teams repeat the same research",
  "AI answers arrive without evidence",
  "Important knowledge disappears inside silos",
];

const withMasteacon = [
  "One searchable intelligence layer",
  "Semantic retrieval beyond exact keywords",
  "Grounded answers with source evidence",
  "AI agents working across trusted knowledge",
  "Organized workspaces with controlled context",
];

export function LandingPage() {
  const [activePreview, setActivePreview] = useState<PreviewKey>("command");

  const selectedPreview =
    previewTabs.find((tab) => tab.key === activePreview) ?? previewTabs[0];

  return (
    <main className="masteacon-landing">
      <div className="masteacon-landing-ambient masteacon-landing-ambient-one" />
      <div className="masteacon-landing-ambient masteacon-landing-ambient-two" />

      <header className="masteacon-landing-header">
        <Link
          to="/"
          className="masteacon-landing-brand"
          aria-label="Masteacon home"
        >
          <Logo size={34} withWordmark />
        </Link>

        <nav className="masteacon-landing-nav" aria-label="Primary navigation">
          <a href="#product">Product</a>
          <a href="#solutions">Solutions</a>
          <a href="#how-it-works">How it works</a>
          <a href="#security">Security</a>
        </nav>

        <div className="masteacon-landing-actions">
          <div className="masteacon-landing-controls">
            <ThemeSwitcher />
            <LocaleSwitcher />
          </div>

          <Link to="/login" className="masteacon-landing-signin">
            Sign in
          </Link>

          <Link to="/register" className="masteacon-landing-cta-small">
            Get started
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </header>

      <section className="masteacon-landing-hero">
        <div className="masteacon-landing-hero-copy">
          <span className="masteacon-landing-eyebrow">
            <span className="masteacon-landing-eyebrow-dot" />
            KNOWLEDGE INTELLIGENCE · GROUNDED AI
          </span>

          <h1>
            Turn scattered knowledge into
            <span> trusted answers.</span>
          </h1>

          <p className="masteacon-landing-hero-description">
            Upload your knowledge. Ask naturally. Get grounded answers with
            traceable sources — powered by semantic search, RAG and AI agents.
          </p>

          <div className="masteacon-landing-hero-actions">
            <Link to="/register" className="masteacon-landing-primary">
              Start building
              <span aria-hidden="true">→</span>
            </Link>

            <a href="#product" className="masteacon-landing-secondary">
              Explore the platform
            </a>
          </div>

          <div className="masteacon-landing-trust-row">
            <span>Source grounded</span>
            <span>Semantic search</span>
            <span>Secure workspaces</span>
            <span>AI agents</span>
          </div>
        </div>

        <div
          className="masteacon-landing-hero-visual"
          aria-label="Masteacon knowledge intelligence preview"
        >
          <div className="masteacon-landing-radar">
            <div className="masteacon-landing-radar-ring ring-one" />
            <div className="masteacon-landing-radar-ring ring-two" />
            <div className="masteacon-landing-radar-ring ring-three" />

            <div className="masteacon-landing-radar-logo">
              <Logo size={112} mColor="#F5F1E8" />
            </div>
          </div>

          <div className="masteacon-landing-intelligence-card card-one">
            <span>Grounded answer</span>
            <strong>Evidence attached</strong>
            <small>3 source chunks matched</small>
          </div>

          <div className="masteacon-landing-intelligence-card card-two">
            <span>Knowledge health</span>
            <strong>Ready</strong>
            <small>Workspace indexed</small>
          </div>

          <div className="masteacon-landing-intelligence-card card-three">
            <span>Agent trace</span>
            <strong>4 tools</strong>
            <small>Execution observable</small>
          </div>
        </div>
      </section>

      <section
        id="product"
        className="masteacon-landing-section masteacon-product-showcase"
      >
        <div className="masteacon-landing-section-heading">
          <span>THE PLATFORM</span>

          <h2>
            One intelligence layer.
            <br />
            Four ways to work.
          </h2>

          <p>
            From ingestion to retrieval and execution, Masteacon keeps the
            experience connected to the knowledge behind every answer.
          </p>
        </div>

        <div className="masteacon-product-tabs" role="tablist">
          {previewTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activePreview === tab.key}
              className={activePreview === tab.key ? "active" : ""}
              onClick={() => setActivePreview(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="masteacon-product-window">
          <div className="masteacon-product-window-bar">
            <div className="masteacon-product-window-dots">
              <span />
              <span />
              <span />
            </div>

            <span className="masteacon-product-window-title">
              Masteacon / {selectedPreview.label}
            </span>

            <span className="masteacon-product-window-status">
              <i />
              Grounded
            </span>
          </div>

          <div className="masteacon-product-window-body">
            <aside className="masteacon-product-mini-sidebar">
              <Logo size={29} />

              <div className="masteacon-product-mini-nav">
                {previewTabs.map((tab) => (
                  <span
                    key={tab.key}
                    className={activePreview === tab.key ? "active" : ""}
                  >
                    {tab.label}
                  </span>
                ))}
              </div>
            </aside>

            <div className="masteacon-product-preview-content">
              <div className="masteacon-product-preview-copy">
                <span>{selectedPreview.eyebrow}</span>
                <h3>{selectedPreview.title}</h3>
                <p>{selectedPreview.description}</p>
              </div>

              <div className="masteacon-product-preview-grid">
                <article className="masteacon-product-preview-primary">
                  <span className="masteacon-preview-label">
                    Ask Masteacon
                  </span>

                  <h4>What does our knowledge say?</h4>

                  <div className="masteacon-preview-answer">
                    <div className="masteacon-preview-answer-mark">
                      <Logo size={26} />
                    </div>

                    <div>
                      <strong>Grounded response ready</strong>
                      <p>
                        Relevant context was retrieved and evaluated before the
                        answer was generated.
                      </p>
                    </div>
                  </div>

                  <div className="masteacon-preview-sources">
                    <span>01 · product-notes.txt</span>
                    <span>02 · company-policy.txt</span>
                  </div>
                </article>

                <div className="masteacon-product-preview-side">
                  <article>
                    <span>{selectedPreview.metricLabel}</span>
                    <strong>{selectedPreview.metricValue}</strong>
                    <small>Live workspace signal</small>
                  </article>

                  <article>
                    <span>Retrieval</span>
                    <strong>Semantic</strong>
                    <small>Context before generation</small>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="solutions"
        className="masteacon-landing-section masteacon-problem-section"
      >
        <div className="masteacon-problem-heading">
          <span>WHY MASTEACON</span>

          <h2>
            Your knowledge is everywhere.
            <br />
            <em>Your answers shouldn't be.</em>
          </h2>

          <p>
            Masteacon turns fragmented organizational knowledge into a trusted,
            searchable layer your team can actually use.
          </p>
        </div>

        <div className="masteacon-problem-grid">
          <article className="masteacon-problem-card without">
            <div className="masteacon-problem-card-heading">
              <span>Without Masteacon</span>
              <strong>Fragmented knowledge</strong>
            </div>

            <ul>
              {withoutMasteacon.map((item) => (
                <li key={item}>
                  <span aria-hidden="true">×</span>
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="masteacon-problem-card with">
            <div className="masteacon-problem-card-heading">
              <span>With Masteacon</span>
              <strong>Grounded intelligence</strong>
            </div>

            <ul>
              {withMasteacon.map((item) => (
                <li key={item}>
                  <span aria-hidden="true">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section
        id="how-it-works"
        className="masteacon-landing-section masteacon-how-section"
      >
        <div className="masteacon-how-intro">
          <span>HOW IT WORKS</span>
          <h2>From documents to dependable intelligence.</h2>
        </div>

        <div className="masteacon-how-grid">
          <article>
            <span>01</span>
            <h3>Bring your knowledge</h3>
            <p>Upload PDF, DOCX and TXT content into a focused workspace.</p>
          </article>

          <article>
            <span>02</span>
            <h3>Build intelligence</h3>
            <p>
              Masteacon chunks, embeds and indexes content for semantic
              retrieval.
            </p>
          </article>

          <article>
            <span>03</span>
            <h3>Ask. Verify. Act.</h3>
            <p>
              Get grounded answers, inspect sources and run intelligent
              workflows.
            </p>
          </article>
        </div>
      </section>

      <section className="masteacon-landing-section masteacon-capabilities-section">
        <div className="masteacon-capabilities-heading">
          <span>CORE CAPABILITIES</span>

          <div>
            <h2>
              Built for knowledge that
              <br />
              needs to stay useful.
            </h2>

            <p>
              Masteacon connects ingestion, semantic retrieval, grounded
              generation and agent execution in one focused intelligence
              platform.
            </p>
          </div>
        </div>

        <div className="masteacon-capabilities-grid">
          <article>
            <span>01</span>
            <strong>Knowledge Library</strong>
            <p>
              Organize trusted documents inside focused workspaces built for
              retrieval.
            </p>
            <small>PDF · DOCX · TXT</small>
          </article>

          <article>
            <span>02</span>
            <strong>Semantic Search</strong>
            <p>
              Find relevant context by meaning instead of relying on exact
              keyword matches.
            </p>
            <small>Vector retrieval</small>
          </article>

          <article>
            <span>03</span>
            <strong>Grounded Q&amp;A</strong>
            <p>
              Generate answers from retrieved evidence while keeping the
              supporting context visible.
            </p>
            <small>RAG · Source grounding</small>
          </article>

          <article>
            <span>04</span>
            <strong>AI Agent</strong>
            <p>
              Run knowledge-aware workflows with structured tool execution and
              visible traces.
            </p>
            <small>Tool calling</small>
          </article>

          <article>
            <span>05</span>
            <strong>Knowledge Workspaces</strong>
            <p>
              Keep documents, retrieval context and intelligent workflows
              organized around a clear scope.
            </p>
            <small>Controlled context</small>
          </article>

          <article>
            <span>06</span>
            <strong>Observability</strong>
            <p>
              Inspect retrieval and AI execution signals instead of treating
              intelligence as a black box.
            </p>
            <small>Traceable execution</small>
          </article>
        </div>
      </section>

      <section className="masteacon-landing-section masteacon-audience-section">
        <div className="masteacon-audience-intro">
          <span>BUILT FOR KNOWLEDGE-HEAVY WORK</span>

          <h2>
            One intelligence layer.
            <br />
            Different ways to use it.
          </h2>

          <p>
            Wherever teams depend on documents, internal knowledge and repeated
            research, Masteacon helps turn that information into something
            searchable and actionable.
          </p>
        </div>

        <div className="masteacon-audience-grid">
          <article>
            <span>PRODUCT</span>
            <h3>Product teams</h3>
            <p>
              Search requirements, product notes and internal decisions without
              losing the context behind them.
            </p>
          </article>

          <article>
            <span>ENGINEERING</span>
            <h3>Engineering teams</h3>
            <p>
              Retrieve technical knowledge, architecture notes and operational
              context through natural language.
            </p>
          </article>

          <article>
            <span>RESEARCH</span>
            <h3>Research teams</h3>
            <p>
              Explore document collections semantically and keep answers tied
              to supporting evidence.
            </p>
          </article>

          <article>
            <span>OPERATIONS</span>
            <h3>Operations</h3>
            <p>
              Turn policies, procedures and internal references into a
              searchable knowledge layer.
            </p>
          </article>
        </div>
      </section>

      <section
        id="security"
        className="masteacon-landing-section masteacon-trust-section"
      >
        <div className="masteacon-trust-copy">
          <span>TRUST &amp; CONTROL</span>

          <h2>
            AI is more useful when
            <em> you can see why.</em>
          </h2>

          <p>
            Masteacon is designed around controlled context, visible evidence
            and observable execution so teams can understand what the system
            used before acting on an answer.
          </p>

          <div className="masteacon-trust-signals">
            <span><i />Source evidence</span>
            <span><i />Workspace context</span>
            <span><i />Retrieval visibility</span>
            <span><i />Agent traces</span>
          </div>
        </div>

        <div className="masteacon-trust-visual">
          <div className="masteacon-trust-visual-top">
            <span>MASTEACON / GROUNDED EXECUTION</span>
            <strong>Evidence before generation</strong>
          </div>

          <div className="masteacon-trust-flow">
            <div>
              <span>01</span>
              <strong>Knowledge</strong>
              <small>Trusted workspace documents</small>
            </div>

            <i>→</i>

            <div>
              <span>02</span>
              <strong>Retrieval</strong>
              <small>Semantic context selection</small>
            </div>

            <i>→</i>

            <div>
              <span>03</span>
              <strong>Grounding</strong>
              <small>Evidence-aware generation</small>
            </div>
          </div>

          <div className="masteacon-trust-source">
            <Logo size={28} mColor="#F5F1E8" />

            <div>
              <span>Grounding status</span>
              <strong>Sources connected</strong>
            </div>

            <small>READY</small>
          </div>
        </div>
      </section>

      <section className="masteacon-landing-section masteacon-faq-section">
        <div className="masteacon-faq-heading">
          <span>FAQ</span>

          <h2>
            A few things worth
            <br />
            knowing first.
          </h2>
        </div>

        <div className="masteacon-faq-list">
          <details>
            <summary>
              <span>What is Masteacon?</span>
              <i>+</i>
            </summary>
            <p>
              Masteacon is a knowledge intelligence platform for organizing
              documents, retrieving relevant context and generating grounded
              answers from trusted information.
            </p>
          </details>

          <details>
            <summary>
              <span>How is this different from normal keyword search?</span>
              <i>+</i>
            </summary>
            <p>
              Semantic retrieval searches for contextual meaning, allowing
              related information to be found even when the exact wording in
              the document differs from the question.
            </p>
          </details>

          <details>
            <summary>
              <span>What does a grounded answer mean?</span>
              <i>+</i>
            </summary>
            <p>
              A grounded answer is generated using retrieved knowledge as
              context, with supporting sources kept visible so the result can
              be inspected.
            </p>
          </details>

          <details>
            <summary>
              <span>Which document formats are supported?</span>
              <i>+</i>
            </summary>
            <p>
              The current knowledge ingestion flow supports PDF, DOCX and TXT
              documents.
            </p>
          </details>

          <details>
            <summary>
              <span>What can the Masteacon AI Agent do?</span>
              <i>+</i>
            </summary>
            <p>
              The agent can execute supported knowledge and workspace tools,
              return structured results and expose the tool trace used during
              execution.
            </p>
          </details>
        </div>
      </section>

      <section
        id="final-cta"
        className="masteacon-landing-section masteacon-landing-final-cta"
      >
        <div>
          <span>TRUSTED KNOWLEDGE · GROUNDED INTELLIGENCE</span>
          <h2>Your knowledge already exists. Make it usable.</h2>
        </div>

        <Link to="/register">
          Build your workspace
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      <footer className="masteacon-landing-footer">
        <Logo size={32} withWordmark />

        <p>
          Knowledge intelligence for teams that need answers they can trust.
        </p>

        <div>
          <Link to="/login">Sign in</Link>
          <Link to="/register">Create account</Link>
        </div>
      </footer>
    </main>
  );
}

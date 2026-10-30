import { useRef, useState } from "react";
import { Link } from "react-router";
import { ask, type Answer } from "../lib/ask";
import { content } from "../lib/content";

type Message = { question: string; answer: Answer | null };

const SUGGESTIONS = ["What is a token?", "Why does the agent forget things?", "Difference between harness and agent"];

export function AskWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const log = useRef<HTMLDivElement>(null);

  const submit = (question: string) => {
    const q = question.trim();
    if (!q) return;
    setMessages((m) => [...m, { question: q, answer: ask(q) }]);
    setDraft("");
    requestAnimationFrame(() => log.current?.scrollTo({ top: log.current.scrollHeight }));
  };

  if (!open) {
    return (
      <button className="ask-fab" onClick={() => setOpen(true)} aria-label="Ask a question">
        <span aria-hidden>?</span>
        Ask
      </button>
    );
  }

  return (
    <section className="ask-panel" aria-label="Ask a question">
      <header className="ask-head">
        <div>
          <strong>Ask the dictionary</strong>
          <small>Answers come from the {Object.keys(content.entries).length} entries, no AI model.</small>
        </div>
        <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">×</button>
      </header>

      <div className="ask-log" ref={log}>
        {messages.length === 0 && (
          <div className="ask-empty">
            <p>Ask about a term. For example:</p>
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chip" onClick={() => submit(s)}>{s}</button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className="ask-turn">
            <p className="ask-q">{m.question}</p>
            {m.answer ? (
              <div className="ask-a">
                <p className="ask-term">
                  Term: <Link to={`/entry/${m.answer.entry.slug}`}>{m.answer.entry.title}</Link>
                  <span> · Section {m.answer.entry.section}</span>
                </p>
                <p>{m.answer.entry.description}</p>
                {m.answer.details.map((d) => <p key={d}>{d}</p>)}
                <p className="ask-more">
                  <Link to={`/entry/${m.answer.entry.slug}`}>Read the full entry →</Link>
                </p>
                {m.answer.related.length > 0 && (
                  <p className="ask-related">
                    Also see:{" "}
                    {m.answer.related.map((r, j) => (
                      <span key={r.slug}>{j > 0 && ", "}<Link to={`/entry/${r.slug}`}>{r.title}</Link></span>
                    ))}
                  </p>
                )}
              </div>
            ) : (
              <p className="ask-a">No term matches that. Try a word from the dictionary, such as “context window” or “tool call”.</p>
            )}
          </div>
        ))}
      </div>

      <form
        className="ask-form"
        onSubmit={(e) => {
          e.preventDefault();
          submit(draft);
        }}
      >
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder="Ask about a term…"
          aria-label="Your question"
        />
        <button className="btn primary" type="submit">Ask</button>
      </form>
    </section>
  );
}

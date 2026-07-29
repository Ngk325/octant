import { useEffect, useRef, useState } from "react";
import { useChatCtx } from "./ChatContext";
import { useChat, type Message, type ThreadSummary } from "./useChat";
import Markdown from "./Markdown";
import { suggestedPrompts } from "../engine/context";

const when = (ms: number) => new Date(ms).toLocaleString();

/** A one-line description of what the assistant currently knows you are reading. */
function contextLabel(kind: string, detail: string): string {
  return detail ? `${kind} · ${detail}` : kind;
}

/**
 * The docked assistant. Renders the launcher when closed and the thread when open —
 * the launcher is never hidden, at any width, because hiding it stranded people.
 */
export default function ChatRail() {
  const { context, open, setOpen } = useChatCtx();
  const { messages, streaming, error, send, stop, reset, listHistory, loadHistoryThread } = useChat(context);
  const [draft, setDraft] = useState("");
  const overlay = useMatchMedia("(max-width: 1180px)");
  const logRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<ThreadSummary[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<{ id: string; turns: Message[] } | null>(null);

  const openHistory = () => {
    setHistoryOpen(true);
    setViewing(null);
    setHistoryError(null);
    setHistory(null);
    void listHistory()
      .then(setHistory)
      .catch((e) => setHistoryError((e as Error).message));
  };

  const viewThread = (id: string) => {
    setViewing({ id, turns: [] });
    setHistoryError(null);
    void loadHistoryThread(id)
      .then((turns) => setViewing({ id, turns }))
      .catch((e) => {
        setHistoryError((e as Error).message);
        setViewing(null);
      });
  };

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  /* In overlay mode the rail covers the page, so the page must stop being a
     live thing underneath it: lock body scroll, and give the overlay the two
     standard exits — Escape, and clicking the scrim. Everything restores when
     the rail closes or the viewport grows past the breakpoint. */
  useEffect(() => {
    if (!(open && overlay)) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, overlay, setOpen]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [draft]);

  if (!open) {
    return (
      <button className="btn primary rail-launch" onClick={() => setOpen(true)}>
        Ask about this
      </button>
    );
  }

  /* Guarded, because Enter is bound to this. Without the check, pressing Enter
     while an answer was still streaming cleared the box and dropped the
     question on the floor — the send was refused but the draft was already
     gone. Nothing is cleared unless something is actually sent. */
  const submit = () => {
    const text = draft.trim();
    if (!text || streaming) return;
    setDraft("");
    void send(text);
  };

  const label = describe(context);

  return (
    <>
      {overlay && (
        <button
          className="rail-scrim"
          aria-label="Close assistant"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className="rail" aria-label="Assistant">
      <div className="rail-head">
        <h2>Ask</h2>
        <button
          className="btn ghost"
          onClick={historyOpen ? () => setHistoryOpen(false) : openHistory}
          title="Past conversations"
        >
          {historyOpen ? "Back" : "History"}
        </button>
        {messages.length > 0 && (
          <button
            className="btn ghost"
            onClick={() => { reset(); setHistoryOpen(false); }}
            title="Start a new conversation"
          >
            New
          </button>
        )}
        <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close assistant">
          ×
        </button>
      </div>

      <div className="rail-ctx">Reading: {contextLabel(label.kind, label.detail)}</div>

      {historyOpen ? (
        <div className="rail-log" ref={logRef}>
          {viewing ? (
            <>
              <button className="btn ghost" onClick={() => setViewing(null)} style={{ marginBottom: "var(--s2)" }}>
                ← All conversations
              </button>
              {viewing.turns.length === 0 && !historyError && <p className="small muted">Loading…</p>}
              {viewing.turns.map((m, i) => (
                <div key={i} className={`msg ${m.role === "user" ? "you" : "bot"}`}>
                  {m.role === "user" ? m.text : <Markdown text={m.text} />}
                </div>
              ))}
            </>
          ) : (
            <>
              <p className="small muted" style={{ margin: "0 0 var(--s3)" }}>
                Past conversations from this account, most recent first.
              </p>
              {historyError && <div className="msg err">{historyError}</div>}
              {history === null && !historyError && <p className="small muted">Loading…</p>}
              {history !== null && history.length === 0 && (
                <p className="small muted">No past conversations yet.</p>
              )}
              {history?.map((t) => (
                <button
                  key={t.threadId}
                  className="rail-history-item"
                  onClick={() => viewThread(t.threadId)}
                >
                  <div className="small" style={{ fontWeight: 600 }}>
                    {t.contexts[t.contexts.length - 1] ?? "Conversation"}
                  </div>
                  <div className="small muted">{t.preview || "…"}</div>
                  <div className="small muted" style={{ fontSize: "var(--t-xs)" }}>
                    {when(t.updated)} · {t.turns} messages
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      ) : (
      <div className="rail-log" ref={logRef}>
        {messages.length === 0 && (
          <>
            <p className="small" style={{ margin: 0 }}>
              Ask anything about what is on screen, or about how two people fit. Answers come from
              this app&rsquo;s own model — the stacks, the four sides, the exchange overlay and both
              directions of ease — not from generic type descriptions.
            </p>
            <p className="small muted" style={{ margin: "var(--s3) 0 0" }}>
              Conversations may be reviewed by the site owner.
            </p>
            <div className="rail-suggest">
              {suggestedPrompts(context).map((q) => (
                <button key={q} disabled={streaming} onClick={() => void send(q)}>{q}</button>
              ))}
            </div>
          </>
        )}

        {messages.map((m, i) => {
          const live = streaming && i === messages.length - 1;
          return (
            <div key={i} className={`msg ${m.role === "user" ? "you" : "bot"}`}>
              {m.role === "user" ? (
                m.text
              ) : live && !m.text ? (
                /* Nothing has come back yet. An empty bubble with a 2px blinking
                   bar in it read as a rendering fault, so say what is happening. */
                <Thinking />
              ) : (
                <>
                  <Markdown text={m.text} />
                  {live && <span className="caret" />}
                </>
              )}
            </div>
          );
        })}

        {error && <div className="msg err">{error}</div>}
      </div>
      )}

      {!historyOpen && (
      <div className="rail-form">
        <textarea
          ref={boxRef}
          rows={2}
          value={draft}
          placeholder="Ask a question…"
          aria-label="Your question"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div style={{ display: "flex", gap: "var(--s2)" }}>
          {streaming ? (
            <button className="btn" onClick={stop}>Stop</button>
          ) : (
            <button className="btn primary" onClick={submit} disabled={!draft.trim()}>
              Send
            </button>
          )}
          <span className="small muted" style={{ alignSelf: "center", fontSize: "var(--t-xs)" }}>
            Enter to send
          </span>
        </div>
      </div>
      )}
      </aside>
    </>
  );
}

/**
 * Shown between pressing Send and the first token arriving — which on the deep
 * model is several seconds of otherwise blank rail. `role="status"` announces it
 * to a screen reader once, without stealing focus.
 */
function Thinking() {
  return (
    <span className="thinking" role="status" aria-label="Thinking">
      <span className="thinking-dots" aria-hidden="true">
        <i /><i /><i />
      </span>
      Thinking…
    </span>
  );
}

/**
 * Tracks a media query without re-rendering on every resize — only when the
 * answer changes. SSR-safe: defaults to false where there is no window.
 */
function useMatchMedia(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

/** A short human label for whatever the reader has on screen, shown above the thread. */
function describe(c: ReturnType<typeof useChatCtx>["context"]): { kind: string; detail: string } {
  switch (c.kind) {
    case "type": return { kind: "type", detail: c.type };
    case "pair": return { kind: "pair", detail: `${c.a} and ${c.b}` };
    case "learn": return { kind: "course", detail: `${c.stage}. ${c.title}` };
    case "network": return { kind: "group", detail: `${c.members.length} people` };
    case "lexicon": return { kind: "lexicon", detail: c.term ?? "" };
    case "calculator": return { kind: "calculator", detail: c.best ?? "unresolved" };
    case "matrix": return { kind: "matrix", detail: "" };
    default: return { kind: "overview", detail: "" };
  }
}

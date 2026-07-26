import { useEffect, useRef, useState } from "react";
import { useChatCtx } from "./ChatContext";
import { useChat } from "./useChat";
import Markdown from "./Markdown";
import { suggestedPrompts } from "../engine/context";

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
  const { messages, streaming, error, send, stop, reset } = useChat(context);
  const [draft, setDraft] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

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
    <aside className="rail" aria-label="Assistant">
      <div className="rail-head">
        <h2>Ask</h2>
        {messages.length > 0 && (
          <button className="btn ghost" onClick={reset} title="Start a new thread">
            New
          </button>
        )}
        <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close assistant">
          ×
        </button>
      </div>

      <div className="rail-ctx">Reading: {contextLabel(label.kind, label.detail)}</div>

      <div className="rail-log" ref={logRef}>
        {messages.length === 0 && (
          <>
            <p className="small" style={{ margin: 0 }}>
              Ask anything about what is on screen, or about how two people fit. Answers come from
              this app&rsquo;s own model — the stacks, the four sides, the OPS overlay and both
              directions of ease — not from generic type descriptions.
            </p>
            <div className="rail-suggest">
              {suggestedPrompts(context).map((q) => (
                <button key={q} disabled={streaming} onClick={() => void send(q)}>{q}</button>
              ))}
            </div>
          </>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role === "user" ? "you" : "bot"}`}>
            {m.role === "user" ? (
              m.text
            ) : (
              <>
                <Markdown text={m.text} />
                {streaming && i === messages.length - 1 && <span className="caret" />}
              </>
            )}
          </div>
        ))}

        {error && <div className="msg err">{error}</div>}
      </div>

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
    </aside>
  );
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

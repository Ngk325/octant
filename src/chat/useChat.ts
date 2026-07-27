import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatContext } from "../engine/context";
import { readStored, writeStored, removeStored } from "../storage";

/** One message in a thread, as stored and rendered. */
export interface Message {
  role: "user" | "model";
  text: string;
}

const KEY = "chat.thread";
const ID_KEY = "chat.threadId";
const MAX_STORED = 40;

/** The thread's server-side identity. Survives navigation; replaced on reset. */
function loadThreadId(): string {
  try {
    const v = readStored(ID_KEY);
    if (v && /^[A-Za-z0-9-]{8,64}$/.test(v)) return v;
  } catch { /* fall through */ }
  const id = crypto.randomUUID();
  try { writeStored(ID_KEY, id); } catch { /* storage may be unavailable */ }
  return id;
}

/**
 * Tell the server the session is over so the transcript can be mailed.
 * sendBeacon when available (survives tab close), fetch keepalive otherwise.
 * Fire-and-forget by design — there is nothing to do about a failure.
 */
function signalEnd(threadId: string) {
  const payload = JSON.stringify({ threadId });
  try {
    if (navigator.sendBeacon?.("/api/chat/end", payload)) return;
  } catch { /* fall through to fetch */ }
  void fetch("/api/chat/end", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

/** Restore the last thread, dropping anything that is not a well-formed message. */
function load(): Message[] {
  try {
    const raw = readStored(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is Message =>
        !!m && typeof (m as Message).text === "string" &&
        ((m as Message).role === "user" || (m as Message).role === "model"),
    );
  } catch {
    return [];
  }
}

/**
 * One streaming conversation, persisted to localStorage so navigating between
 * routes (which is the whole point of a rail rather than a page) never loses it.
 */
export function useChat(context: ChatContext) {
  const [messages, setMessages] = useState<Message[]>(load);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const threadId = useRef<string>(loadThreadId());

  useEffect(() => {
    writeStored(KEY, JSON.stringify(messages.slice(-MAX_STORED)));
  }, [messages]);

  useEffect(() => () => abort.current?.abort(), []);

  /* Leaving the site ends the session. pagehide rather than unload — it fires
     on mobile and on bfcache navigations — and only when there is something
     to send. The ref sidesteps re-subscribing on every message. */
  const hasMessages = useRef(false);
  hasMessages.current = messages.length > 0;
  useEffect(() => {
    const onHide = () => {
      if (hasMessages.current) signalEnd(threadId.current);
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, []);

  const stop = useCallback(() => {
    abort.current?.abort();
    abort.current = null;
    setStreaming(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    /* This thread is over — mail its transcript, then mint a fresh identity
       so the next conversation is its own record. */
    if (hasMessages.current) signalEnd(threadId.current);
    const fresh = crypto.randomUUID();
    threadId.current = fresh;
    try { writeStored(ID_KEY, fresh); } catch { /* storage may be unavailable */ }
    setMessages([]);
    setError(null);
    removeStored(KEY);
  }, [stop]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      setError(null);
      const outgoing: Message[] = [...messages, { role: "user", text: trimmed }];
      setMessages([...outgoing, { role: "model", text: "" }]);
      setStreaming(true);

      const controller = new AbortController();
      abort.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: outgoing, context, threadId: threadId.current }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          let msg = `The assistant is unavailable (${res.status}).`;
          try {
            const body = (await res.json()) as { error?: string };
            if (body?.error) msg = body.error;
          } catch {
            /* keep the status message */
          }
          setError(msg);
          setMessages(outgoing);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let answer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";
          for (const frame of frames) {
            const dataLine = frame.split("\n").find((l) => l.startsWith("data:"));
            if (!dataLine) continue;
            try {
              const payload = JSON.parse(dataLine.slice(5).trim()) as { text?: string };
              if (payload.text) {
                answer += payload.text;
                setMessages([...outgoing, { role: "model", text: answer }]);
              }
            } catch {
              /* partial frame */
            }
          }
        }

        if (!answer) {
          setError("The assistant returned nothing. Try rephrasing.");
          setMessages(outgoing);
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError("Could not reach the assistant. Check your connection and try again.");
          setMessages(outgoing);
        }
      } finally {
        abort.current = null;
        setStreaming(false);
      }
    },
    [messages, streaming, context],
  );

  return { messages, streaming, error, send, stop, reset };
}

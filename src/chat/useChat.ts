import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatContext } from "../engine/context";

/** One message in a thread, as stored and rendered. */
export interface Message {
  role: "user" | "model";
  text: string;
}

const KEY = "stratfield.chat.thread";
const MAX_STORED = 40;

function load(): Message[] {
  try {
    const raw = localStorage.getItem(KEY);
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

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(messages.slice(-MAX_STORED)));
    } catch {
      /* private mode, or quota — the thread just will not survive a reload */
    }
  }, [messages]);

  useEffect(() => () => abort.current?.abort(), []);

  const stop = useCallback(() => {
    abort.current?.abort();
    abort.current = null;
    setStreaming(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setMessages([]);
    setError(null);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
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
          body: JSON.stringify({ messages: outgoing, context }),
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

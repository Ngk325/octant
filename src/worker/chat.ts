import { buildSystemInstruction, type ChatContext } from "../engine/context";

/* ------------------------------------------------------------------ *
 * /api/chat -- a thin, streaming proxy to Gemini.
 *
 * The API key lives in a Worker secret and never reaches the browser.
 * The client sends the conversation plus a description of what is on
 * screen; the system instruction is assembled HERE from the engine, so
 * a caller cannot talk the assistant out of its grounding by editing
 * the request.
 * ------------------------------------------------------------------ */

export interface Env {
  GEMINI_API_KEY?: string;
}

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

/** Allowlisted so a caller cannot bill an arbitrary model to this key. */
export const MODELS = {
  fast: "gemini-3.6-flash",
  deep: "gemini-3.1-pro-preview",
} as const;
/** The allowlisted models. A request naming anything else is rejected. */
export type ModelKey = keyof typeof MODELS;

const MAX_MESSAGES = 40;
const MAX_CHARS = 24_000;

/** One turn of conversation as it arrives from the client. */
export interface ChatTurn {
  role: "user" | "model";
  text: string;
}

interface ChatRequest {
  messages?: ChatTurn[];
  context?: ChatContext;
  model?: ModelKey;
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

/* --------------------------- rate limiting --------------------------- *
 * Per-isolate and therefore best-effort: Workers may run many isolates,
 * so this throttles a runaway client rather than a determined one. A KV
 * or Durable Object counter is the real fix if this endpoint ever gets
 * meaningful traffic -- see DEPLOY.md.
 * -------------------------------------------------------------------- */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, number[]>();

function rateLimited(ip: string, now: number): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5_000) hits.clear(); // crude ceiling on isolate memory
  return recent.length > MAX_PER_WINDOW;
}

/**
 * The /api/chat handler, and the app's entire server surface.
 *
 * Validates the request (method, body size, turn count, allowlisted model), calls
 * Gemini with the caller's grounding, and streams plain text back. The Worker and
 * the Vite dev server both call THIS function, so local and deployed behaviour
 * cannot drift apart. The API key is read from env and never reaches the client.
 */
export async function handleChat(request: Request, env: Env, now = Date.now()): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);

  /* The message names the actual command, because "see DEPLOY.md" sent at least
     one owner looking through the file and finding nothing — it was buried in a
     local-development subsection instead of being a step of its own. */
  if (!env.GEMINI_API_KEY) {
    return json(
      {
        error:
          "The assistant is not configured — no Gemini API key is set on this deployment. " +
          "Get a key at https://aistudio.google.com/apikey, then run " +
          "`npx wrangler secret put GEMINI_API_KEY` and redeploy. " +
          "Locally, put it in .dev.vars and restart the dev server. DEPLOY.md step 2 has the detail.",
      },
      503,
    );
  }

  const ip = request.headers.get("cf-connecting-ip") ?? "local";
  if (rateLimited(ip, now)) {
    return json({ error: "Too many messages in a short window. Give it a minute." }, 429);
  }

  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return json({ error: "Body must be JSON." }, 400);
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length) return json({ error: "No messages." }, 400);
  if (messages.length > MAX_MESSAGES) return json({ error: "Conversation too long — start a new thread." }, 413);

  const total = messages.reduce((n, m) => n + (typeof m.text === "string" ? m.text.length : 0), 0);
  if (total > MAX_CHARS) return json({ error: "Conversation too long — start a new thread." }, 413);

  const contents = messages
    .filter((m) => typeof m?.text === "string" && m.text.trim())
    .map((m) => ({
      role: m.role === "model" ? "model" : "user",
      parts: [{ text: m.text }],
    }));
  if (!contents.length) return json({ error: "No messages." }, 400);

  const model = MODELS[body.model as ModelKey] ?? MODELS.fast;
  const systemInstruction = buildSystemInstruction(body.context ?? { kind: "home" });

  let upstream: Response;
  try {
    upstream = await fetch(`${ENDPOINT}/${model}:streamGenerateContent?alt=sse`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: { temperature: 0.8, maxOutputTokens: 4096 },
      }),
    });
  } catch {
    return json({ error: "Could not reach the model. Try again." }, 502);
  }

  if (!upstream.ok || !upstream.body) {
    // Never surface the upstream body — it can echo request details.
    return json({ error: `The model returned ${upstream.status}.` }, 502);
  }

  return new Response(upstream.body.pipeThrough(toTextStream()), {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}

/**
 * Gemini's SSE frames carry a whole GenerateContentResponse each. Reduce them to
 * newline-delimited `{"text": "..."}` so the client only has to append strings.
 * Thought parts are dropped — they are not the answer.
 */
function toTextStream(): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const emit = (controller: TransformStreamDefaultController<Uint8Array>, payload: string) => {
    for (const raw of payload.split("\n")) {
      const trimmed = raw.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const parts = parsed?.candidates?.[0]?.content?.parts ?? [];
        const text = parts
          .filter((p: { thought?: boolean; text?: string }) => !p.thought && typeof p.text === "string")
          .map((p: { text: string }) => p.text)
          .join("");
        if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
      } catch {
        /* a partial frame — the next chunk completes it */
      }
    }
  };

  return new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      // SSE events are separated by a blank line; keep the trailing partial.
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      for (const ev of events) emit(controller, ev);
    },
    flush(controller) {
      if (buffer.trim()) emit(controller, buffer);
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
    },
  });
}

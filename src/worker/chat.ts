import { buildSystemInstruction, type ChatContext } from "../engine/context";
import {
  recordExchange, sweepIdle, validThreadId, type ChatLogEnv, type ChatWho,
} from "./chatlog";

/* ------------------------------------------------------------------ *
 * /api/chat -- a thin, streaming proxy to Gemini.
 *
 * The API key lives in a Worker secret and never reaches the browser.
 * The client sends the conversation plus a description of what is on
 * screen; the system instruction is assembled HERE from the engine, so
 * a caller cannot talk the assistant out of its grounding by editing
 * the request.
 * ------------------------------------------------------------------ */

export interface Env extends ChatLogEnv {
  GEMINI_API_KEY?: string;
}

/** How handleChat reports back to the runtime and the transcript log. */
export interface ChatHooks {
  /** Who is talking, from the session layer. Absent in tests/dev without auth. */
  who?: ChatWho;
  /** The caller's user agent, for the transcript metadata. */
  ua?: string;
  /** ExecutionContext.waitUntil, so logging outlives the streamed response. */
  waitUntil?(p: Promise<unknown>): void;
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

/* ------------------------- upstream failures ------------------------- *
 * Gemini's own 429 is the one people actually hit: the free tier meters
 * per MINUTE as well as per day, so a normal back-and-forth conversation
 * trips it and then clears on its own seconds later. The old code turned
 * every upstream failure into a bare "The model returned 429." — which
 * names Google's status code, blames "the model", and gives the reader
 * nothing to do about it.
 *
 * So: retry the transient ones ONCE, honouring Retry-After when Google
 * sends it, and translate whatever survives into an instruction.
 * -------------------------------------------------------------------- */

/** Upstream statuses where trying again a moment later plausibly helps. */
const TRANSIENT = new Set([429, 500, 502, 503, 504]);

/** Ceiling on the retry wait. Longer than this and the reader should be told instead. */
const MAX_RETRY_MS = 2_000;

/**
 * How long to wait before the single retry. Google sends `Retry-After` in
 * seconds on quota errors; anything absent, unparseable or longer than the
 * ceiling falls back to a fixed short pause.
 */
export function retryDelayMs(res: { headers: { get(n: string): string | null } }): number {
  const raw = res.headers.get("retry-after");
  const secs = raw ? Number(raw) : NaN;
  if (Number.isFinite(secs) && secs > 0) return Math.min(secs * 1000, MAX_RETRY_MS);
  return 900;
}

/**
 * What to tell the reader, in their terms rather than Google's. Every branch
 * says what happened AND what to do next; none of them leaks the upstream body,
 * which can echo the request back.
 */
export function upstreamMessage(status: number): string {
  if (status === 429) {
    return "The assistant is answering too many questions at once. Wait about a minute and ask again — " +
      "this clears on its own.";
  }
  if (status === 401 || status === 403) {
    return "The assistant's API key was rejected. Check that GEMINI_API_KEY is set correctly on this " +
      "deployment — DEPLOY.md step 2 has the detail.";
  }
  if (status === 404) {
    return "The assistant is configured with a model this key cannot reach. Check the model names in " +
      "src/worker/chat.ts against the ones your key is enabled for.";
  }
  if (status >= 500) return "The model is having trouble at its end. Try again in a moment.";
  return "The assistant could not answer that one. Try rephrasing it.";
}

/** One turn of conversation as it arrives from the client. */
export interface ChatTurn {
  role: "user" | "model";
  text: string;
}

interface ChatRequest {
  messages?: ChatTurn[];
  context?: ChatContext;
  model?: ModelKey;
  /** Client-generated thread id, for the transcript log. */
  threadId?: string;
}

/** A short human label of the screen a question was asked from, for the log. */
function contextLabel(ctx: ChatContext): string {
  switch (ctx.kind) {
    case "type": return `type ${ctx.type}`;
    case "pair": return `pair ${ctx.a}·${ctx.b}`;
    case "learn": return `course ${ctx.stage}: ${ctx.title}`;
    case "network": return `group of ${ctx.members.length}`;
    case "lexicon": return ctx.term ? `lexicon: ${ctx.term}` : "lexicon";
    case "calculator": return `calculator${ctx.best ? ` → ${ctx.best}` : ""}`;
    default: return ctx.kind;
  }
}

/** Pause between the first upstream attempt and its retry. */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A JSON response with the right content type. */
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

/** Per-isolate throttle. Slows a runaway client rather than a determined one. */
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
export async function handleChat(
  request: Request, env: Env, hooks: ChatHooks = {}, now = Date.now(),
): Promise<Response> {
  /* Piggyback the idle-transcript sweep on chat traffic. Fire-and-forget;
     with no CHAT_LOGS binding it is a no-op. */
  const defer = hooks.waitUntil ?? ((p: Promise<unknown>) => void p.catch(() => {}));
  defer(sweepIdle(env, now));
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

  const call = () => fetch(`${ENDPOINT}/${model}:streamGenerateContent?alt=sse`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": env.GEMINI_API_KEY!,
    },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: { temperature: 0.8, maxOutputTokens: 4096 },
    }),
  });

  let upstream: Response;
  try {
    upstream = await call();
    /* One retry, and only one. A per-minute quota clears in seconds, so this
       turns the most common failure into a pause the reader never sees; a real
       outage still surfaces rather than being hidden behind a retry storm. */
    if (!upstream.ok && TRANSIENT.has(upstream.status)) {
      await sleep(retryDelayMs(upstream));
      upstream = await call();
    }
  } catch {
    return json({ error: "Could not reach the model. Check your connection and try again." }, 502);
  }

  if (!upstream.ok || !upstream.body) {
    /* Pass 429 through as 429. The old code flattened everything to 502, which
       hid a quota problem behind a generic gateway error in the logs. */
    const status = upstream.status === 429 ? 429 : 502;
    return json({ error: upstreamMessage(upstream.status) }, status);
  }

  /* The transcript hook. The reply is accumulated by the stream transform as
     it passes through; when the stream finishes, the exchange — the user's
     last message plus the model's whole reply — is appended to the thread's
     KV record. waitUntil keeps that write alive past the response. */
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.text ?? "";
  const threadId = validThreadId(body.threadId) ? body.threadId : crypto.randomUUID();
  const onComplete = (fullReply: string) => {
    defer(recordExchange(
      env,
      threadId,
      hooks.who ?? { label: "unknown", kind: "code" },
      contextLabel(body.context ?? { kind: "home" }),
      lastUser,
      fullReply,
      now,
      hooks.ua,
    ));
  };

  return new Response(upstream.body.pipeThrough(toTextStream(onComplete)), {
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
 *
 * `onComplete` receives the fully-assembled reply when the stream ends — the
 * transform already parses every text chunk, so the transcript log rides along
 * for free instead of parsing the stream a second time.
 */
function toTextStream(onComplete?: (fullReply: string) => void): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  let assembled = "";

  /** Push one decoded text chunk to the client as it arrives from Gemini. */
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
        if (text) {
          assembled += text;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
        }
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
      onComplete?.(assembled);
    },
  });
}

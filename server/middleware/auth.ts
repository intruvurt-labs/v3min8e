// agentsApi.ts
import type { ZodSchema } from "zod";

/** Minimal Http contract your makeHttp() should satisfy */
export interface Http {
  post<TResp = unknown, TBody = unknown>(
    path: string,
    body?: TBody,
    opts?: { signal?: AbortSignal; headers?: Record<string, string>; timeoutMs?: number }
  ): Promise<TResp>;

  /** Stream bytes from server (SSE/NDJSON/line-delimited ok) */
  stream<TBody = unknown>(
    path: string,
    body: TBody,
    onChunk: (chunk: Uint8Array) => void,
    opts?: { signal?: AbortSignal; headers?: Record<string, string> }
  ): Promise<void>;
}

export type RunOpts<TIn, TOut> = {
  /** Cancel with AbortController */
  signal?: AbortSignal;
  /** Request headers */
  headers?: Record<string, string>;
  /** Fail fast after this timeout (ms). Implemented via AbortController wrapper. */
  timeoutMs?: number;
  /** Retries for 5xx/network errors (default 2) */
  retries?: number;
  /** Zod schemas for validation (optional but 🔥 in prod) */
  validate?: {
    input?: ZodSchema<TIn>;
    output?: ZodSchema<TOut>;
  };
};

export type StreamMode = "raw" | "ndjson" | "sse";

export type StreamOpts<TIn, TEvent = any> = {
  signal?: AbortSignal;
  headers?: Record<string, string>;
  /** "raw" forwards bytes; "ndjson" parses each line to JSON; "sse" parses `event:`/`data:` blocks */
  mode?: StreamMode;
  /** Called for each parsed message (or raw chunk if mode="raw") */
  onMessage?: (msg: TEvent) => void;
  /** Called for low-level chunks (even when using ndjson/sse) */
  onChunk?: (chunk: Uint8Array) => void;
  /** Optional input validation */
  validateInput?: ZodSchema<TIn>;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Internal: retry wrapper with exponential backoff */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  baseDelayMs = 250
): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status;
      const retriable =
        err?.code === "ECONNRESET" ||
        err?.code === "ETIMEDOUT" ||
        (typeof status === "number" && status >= 500 && status < 600);

      if (!retriable || attempt >= retries) throw err;
      await sleep(baseDelayMs * Math.pow(2, attempt)); // 250, 500, 1000...
      attempt++;
    }
  }
}

/** Simple SSE parser -> emits strings (you can JSON.parse in onMessage if you want) */
function parseSSE(
  chunk: Uint8Array,
  state: { buf: string },
  emit: (msg: string) => void
) {
  state.buf += new TextDecoder().decode(chunk, { stream: true });
  let idx: number;
  while ((idx = state.buf.indexOf("\n\n")) >= 0) {
    const block = state.buf.slice(0, idx).trimEnd();
    state.buf = state.buf.slice(idx + 2);
    // Only use data lines (ignore event:, id:, retry:)
    const dataLines = block
      .split("\n")
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).trimStart());
    if (dataLines.length) emit(dataLines.join("\n"));
  }
}

/** NDJSON parser */
function parseNDJSON(
  chunk: Uint8Array,
  state: { buf: string },
  emit: (line: string) => void
) {
  state.buf += new TextDecoder().decode(chunk, { stream: true });
  let idx: number;
  while ((idx = state.buf.indexOf("\n")) >= 0) {
    const line = state.buf.slice(0, idx).trim();
    state.buf = state.buf.slice(idx + 1);
    if (line) emit(line);
  }
}

export const agentsApi = (http: Http) => {
  /** Run an agent and return the full result. Strongly typed with generics. */
  async function run<TInput extends Record<string, any>, TOutput = unknown>(
    id: string,
    input: TInput,
    opts: RunOpts<TInput, TOutput> = {}
  ): Promise<TOutput> {
    if (!id) throw new Error("agent id is required");
    if (opts.validate?.input) input = opts.validate.input.parse(input);

    const controller = new AbortController();
    const timeout =
      typeof opts.timeoutMs === "number" && opts.timeoutMs > 0
        ? setTimeout(() => controller.abort(), opts.timeoutMs)
        : null;
    const signal = mergeSignals(controller.signal, opts.signal);

    try {
      const resp = await withRetry<TOutput>(
        () =>
          http.post<TOutput, { input: TInput }>(
            `/agents/${encodeURIComponent(id)}/run`,
            { input },
            { signal, headers: opts.headers, timeoutMs: opts.timeoutMs }
          ),
        opts.retries ?? 2
      );
      return opts.validate?.output ? opts.validate.output.parse(resp) : resp;
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  /**
   * Stream an agent run.
   * - mode="raw": onMessage receives Uint8Array chunks (unchanged)
   * - mode="ndjson": onMessage receives parsed JSON objects per line
   * - mode="sse": onMessage receives parsed strings from `data:` blocks (JSON.parse yourself)
   */
  async function streamRun<TInput extends Record<string, any>, TEvent = any>(
    id: string,
    input: TInput,
    { mode = "ndjson", onMessage, onChunk, signal, headers, validateInput }: StreamOpts<TInput, TEvent> = {}
  ): Promise<void> {
    if (!id) throw new Error("agent id is required");
    if (validateInput) input = validateInput.parse(input);

    const sseState = { buf: "" };
    const ndState = { buf: "" };

    return http.stream<{ input: TInput }>(
      `/agents/${encodeURIComponent(id)}/stream`,
      { input },
      (chunk) => {
        try {
          onChunk?.(chunk);
          if (!onMessage) return;

          if (mode === "raw") {
            // @ts-expect-error allow raw flow
            onMessage(chunk);
            return;
          }
          if (mode === "sse") {
            parseSSE(chunk, sseState, (data) => {
              try {
                // try to JSON.parse first; fallback to string
                onMessage(tryParseJSON(data));
              } catch {
                // already handled in tryParseJSON
              }
            });
            return;
          }
          // ndjson
          parseNDJSON(chunk, ndState, (line) => {
            onMessage(tryParseJSON(line));
          });
        } catch {
          // swallow per-chunk errors to avoid breaking stream
        }
      },
      { signal, headers }
    );
  }

  return { run, streamRun };
};

/* =========================
   Helpers
========================= */

function tryParseJSON<T = any>(s: string): T | string {
  try {
    return JSON.parse(s) as T;
  } catch {
    return s; // deliver raw if not JSON
  }
}

function mergeSignals(a: AbortSignal, b?: AbortSignal): AbortSignal {
  if (!b) return a;
  // Composite signal
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  if (a.aborted || b.aborted) ctrl.abort();
  else {
    a.addEventListener("abort", onAbort);
    b.addEventListener("abort", onAbort);
  }
  return ctrl.signal;
}

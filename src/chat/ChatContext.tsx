import {
  createContext, useContext, useMemo, useState, useCallback, useEffect, type ReactNode,
} from "react";
import type { ChatContext as Ctx } from "../engine/context";
import { readStored, writeStored } from "../storage";

interface ChatCtxValue {
  /** What the reader is currently looking at. Published by each view. */
  context: Ctx;
  setContext(c: Ctx): void;
  open: boolean;
  setOpen(v: boolean): void;
  toggle(): void;
}

const C = createContext<ChatCtxValue | null>(null);
const OPEN_KEY = "chat.open";

/**
 * Holds the assistant's open/closed state and whatever the current view has published
 * about what is on screen.
 */
/** Below this width the rail overlays the page instead of sitting beside it. */
const OVERLAY_MAX = 1180;

const isOverlay = () => typeof window !== "undefined" && window.innerWidth <= OVERLAY_MAX;

export function ChatProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<Ctx>({ kind: "home" });
  /* The stored open state is honoured only at desktop widths. Below 1180px
     the rail is a fixed overlay covering the page, and an overlay that opens
     itself on load is a wall, not an assistant — so it always starts closed
     there, and a phone session never overwrites the desktop preference. */
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (isOverlay()) return false;
    const stored = readStored(OPEN_KEY);
    if (stored !== null) return stored === "1";
    return true;
  });

  useEffect(() => {
    if (!isOverlay()) writeStored(OPEN_KEY, open ? "1" : "0");
  }, [open]);

  const toggle = useCallback(() => setOpen((o) => !o), []);
  const value = useMemo(
    () => ({ context, setContext, open, setOpen, toggle }),
    [context, open, toggle],
  );

  return <C.Provider value={value}>{children}</C.Provider>;
}

/** The assistant's shared state. Throws outside a ChatProvider. */
function useChatCtx(): ChatCtxValue {
  const v = useContext(C);
  if (!v) throw new Error("useChatCtx must be used inside ChatProvider");
  return v;
}

export { useChatCtx };

/**
 * Publish what this view is showing, so the assistant answers about the thing
 * on screen. `deps` is the identity of the context — pass the primitives it is
 * built from, not the object, or this re-fires every render.
 */
export function usePublishContext(build: () => Ctx, deps: unknown[]) {
  const { setContext } = useChatCtx();
  useEffect(() => {
    setContext(build());
    // biome-ignore lint/correctness/useExhaustiveDependencies: deps is the caller's identity list by design — see the contract above.
  }, deps);
}

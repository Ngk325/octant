import {
  createContext, useContext, useMemo, useState, useCallback, useEffect, type ReactNode,
} from "react";
import type { ChatContext as Ctx } from "../engine/context";

interface ChatCtxValue {
  /** What the reader is currently looking at. Published by each view. */
  context: Ctx;
  setContext(c: Ctx): void;
  open: boolean;
  setOpen(v: boolean): void;
  toggle(): void;
}

const C = createContext<ChatCtxValue | null>(null);
const OPEN_KEY = "stratfield.chat.open";

/**
 * Holds the assistant's open/closed state and whatever the current view has published
 * about what is on screen.
 */
export function ChatProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<Ctx>({ kind: "home" });
  const [open, setOpen] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(OPEN_KEY);
      if (stored !== null) return stored === "1";
    } catch {
      /* fall through to the width default */
    }
    return typeof window !== "undefined" && window.innerWidth > 1180;
  });

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_KEY, open ? "1" : "0");
    } catch {
      /* private mode */
    }
  }, [open]);

  const toggle = useCallback(() => setOpen((o) => !o), []);
  const value = useMemo(
    () => ({ context, setContext, open, setOpen, toggle }),
    [context, open, toggle],
  );

  return <C.Provider value={value}>{children}</C.Provider>;
}

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

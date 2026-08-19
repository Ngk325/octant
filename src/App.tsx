import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes, useLocation } from "react-router";
import Home from "./views/Home";
import Welcome, { ONBOARDING_DONE_KEY } from "./views/Welcome";
import Learn from "./views/Learn";
import Types from "./views/Types";
import TypeReader from "./views/TypeReader";
import Sides from "./views/Sides";
import Bonds from "./views/Bonds";
import PairReader from "./views/PairReader";
import Calculator from "./views/Calculator";
import Read from "./views/Read";
import Network from "./views/Network";
import Matrix from "./views/Matrix";
import Lexicon from "./views/Lexicon";
import Guide from "./views/Guide";
import Admin from "./views/Admin";
import ChatRail from "./chat/ChatRail";
import { useChatCtx } from "./chat/ChatContext";
import { usePalette } from "./components/Theme";
import { readStored } from "./storage";
import ErrorBoundary from "./components/ErrorBoundary";

const TABS: [string, string][] = [
  ["/learn", "Learn"],
  ["/calculator", "Find your type"],
  ["/read-someone", "Read someone"],
  ["/types", "All sixteen"],
  ["/type/ENTP", "A type"],
  ["/sides", "Four sides"],
  ["/bonds", "Bonds"],
  ["/pair/ENTP/INFJ", "A pair"],
  ["/network", "A group"],
  ["/matrix", "Matrix"],
  ["/lexicon", "Lexicon"],
  ["/guide", "Emoji guide"],
];

/** Highlight "A type" for any /type/* route, not just the one in the tab href. */
const sectionOf = (path: string) => "/" + (path.split("/")[1] ?? "");

/**
 * Routes, masthead and the assistant rail. Scrolls to the top on navigation unless the
 * URL names an anchor.
 */
export default function App() {
  const { pathname, hash } = useLocation();
  const [menu, setMenu] = useState(false);
  const { theme, toggle } = usePalette();
  const { open: chatOpen, toggle: toggleChat } = useChatCtx();

  /* Scroll to the top on navigation — EXCEPT when the URL names an anchor.
     The lexicon links to `/lexicon#gateway` and the course links into stages
     by id; forcing the top would silently discard the part of the link that
     said where to go. */
  /* The collapsed nav menu closes on Escape as well as on navigation. */
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menu]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger — this must re-run on every navigation, read or not.
  useEffect(() => {
    setMenu(false);
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) {
        el.scrollIntoView({ block: "start" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  /* Clears the session cookie server-side, then reloads — at which point the
     Worker's gate serves the access page. A hard reload rather than a route
     change, because the whole app is behind the wall and nothing in the bundle
     should try to render an unauthenticated state. */
  const signOut = () => {
    /* Redirect only when the server actually cleared the cookie. The old
       .finally() redirected regardless, which dressed a failed logout as a
       successful one — the reload came back signed in with no explanation. */
    void fetch("/api/auth/logout", { method: "POST" })
      .then((res) => {
        if (res.ok) window.location.assign("/");
        else console.error(`[octant] logout refused (${res.status}); staying signed in`);
      })
      .catch((err) => console.error("[octant] logout failed:", err));
  };

  /* The foundation gate gets its own bare shell — no tabs, no assistant rail
     — because showing the fully-loaded application is exactly the problem
     it exists to defer. Still inside .app/.main/.main-inner for the same
     canvas, padding and max-width as everywhere else. */
  if (pathname.startsWith("/welcome")) {
    return (
      <div className="app">
        <div className="main">
          <main className="main-inner">
            <ErrorBoundary>
              <Routes>
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/welcome/:step" element={<Welcome />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="main">
        <header className="masthead">
          <div className="masthead-inner">
            <Link to="/" className="wordmark">
              Octant <span>— read the wiring</span>
            </Link>

            <nav className={`tabs${menu ? " open" : ""}`}>
              {TABS.map(([to, label]) => (
                <NavLink
                  key={to}
                  to={to}
                  className={() => (sectionOf(pathname) === sectionOf(to) ? "on" : "")}
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="mast-actions">
              <button type="button"
                className="icon-btn"
                onClick={toggleChat}
                aria-pressed={chatOpen}
                aria-label={chatOpen ? "Close the assistant" : "Open the assistant"}
                title={chatOpen ? "Close the assistant" : "Ask about this page"}
              >
                ?
              </button>
              <button type="button"
                className="icon-btn"
                onClick={toggle}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              >
                {theme === "dark" ? "☀" : "☾"}
              </button>
              <button type="button"
                className="icon-btn"
                onClick={signOut}
                aria-label="Sign out"
                title="Sign out"
              >
                ⏻
              </button>
              <button type="button"
                className="icon-btn menu-toggle"
                onClick={() => setMenu((m) => !m)}
                aria-expanded={menu}
                aria-label="Menu"
              >
                ☰
              </button>
            </div>
          </div>
        </header>

        <main className="main-inner">
          {/* One boundary around the views and a second around the rail, so a
              fault in either leaves the other standing. */}
          <ErrorBoundary>
          <Routes>
            <Route
              path="/"
              element={readStored(ONBOARDING_DONE_KEY) === "1" ? <Home /> : <Navigate to="/welcome" replace />}
            />
            <Route path="/learn" element={<Learn />} />
            <Route path="/learn/:stage" element={<Learn />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/read-someone" element={<Read />} />
            <Route path="/types" element={<Types />} />
            <Route path="/type/:type" element={<TypeReader />} />
            <Route path="/sides" element={<Sides />} />
            <Route path="/sides/:type" element={<Sides />} />
            <Route path="/bonds" element={<Bonds />} />
            <Route path="/pair/:a/:b" element={<PairReader />} />
            <Route path="/network" element={<Network />} />
            <Route path="/matrix" element={<Matrix />} />
            <Route path="/lexicon" element={<Lexicon />} />
            <Route path="/lexicon/:id" element={<Lexicon />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/guide/:type" element={<Guide />} />
            {/* Unlisted in the nav on purpose — the API refuses non-owners, so this
                is the owner's door, not a page anyone else needs to see exists. */}
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </ErrorBoundary>
        </main>
      </div>

      <ErrorBoundary label="assistant">
        <ChatRail />
      </ErrorBoundary>
    </div>
  );
}

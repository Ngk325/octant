import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Home from "./views/Home";
import Learn from "./views/Learn";
import Types from "./views/Types";
import TypeReader from "./views/TypeReader";
import PairReader from "./views/PairReader";
import Calculator from "./views/Calculator";
import Network from "./views/Network";
import Matrix from "./views/Matrix";
import Lexicon from "./views/Lexicon";
import ChatRail from "./chat/ChatRail";
import { useChatCtx } from "./chat/ChatContext";
import { usePalette } from "./components/Theme";

const TABS: [string, string][] = [
  ["/learn", "Learn"],
  ["/calculator", "Find your type"],
  ["/types", "All sixteen"],
  ["/type/ENTP", "A type"],
  ["/pair/ENTP/INFJ", "A pair"],
  ["/network", "A group"],
  ["/matrix", "Matrix"],
  ["/lexicon", "Lexicon"],
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
    void fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      window.location.assign("/");
    });
  };

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
              <button
                className="icon-btn"
                onClick={toggleChat}
                aria-pressed={chatOpen}
                aria-label={chatOpen ? "Close the assistant" : "Open the assistant"}
                title={chatOpen ? "Close the assistant" : "Ask about this page"}
              >
                ?
              </button>
              <button
                className="icon-btn"
                onClick={toggle}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              >
                {theme === "dark" ? "☀" : "☾"}
              </button>
              <button
                className="icon-btn"
                onClick={signOut}
                aria-label="Sign out"
                title="Sign out"
              >
                ⏻
              </button>
              <button
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
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/learn/:stage" element={<Learn />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/types" element={<Types />} />
            <Route path="/type/:type" element={<TypeReader />} />
            <Route path="/pair/:a/:b" element={<PairReader />} />
            <Route path="/network" element={<Network />} />
            <Route path="/matrix" element={<Matrix />} />
            <Route path="/lexicon" element={<Lexicon />} />
            <Route path="/lexicon/:id" element={<Lexicon />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <ChatRail />
    </div>
  );
}

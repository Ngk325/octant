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

export default function App() {
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  const { theme, toggle } = usePalette();

  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app">
      <div className="main">
        <header className="masthead">
          <div className="masthead-inner">
            <Link to="/" className="wordmark">
              Stratfield <span>— read the wiring</span>
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
                onClick={toggle}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              >
                {theme === "dark" ? "☀" : "☾"}
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

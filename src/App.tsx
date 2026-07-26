import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import TypeReader from "./views/TypeReader";
import PairReader from "./views/PairReader";
import Calculator from "./views/Calculator";
import Network from "./views/Network";
import Matrix from "./views/Matrix";
import Lexicon from "./views/Lexicon";

const TABS: [string, string][] = [
  ["/calculator", "Determine"],
  ["/type/ENTP", "Read a type"],
  ["/pair/ENTP/ENFJ", "Read a pair"],
  ["/network", "Compose"],
  ["/matrix", "Matrix"],
  ["/lexicon", "Lexicon"],
];

export default function App() {
  return (
    <div className="shell">
      <header className="masthead">
        <div className="wordmark">Stratfield <span>— a typology instrument</span></div>
        <nav className="tabs">
          {TABS.map(([to, label]) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => (isActive ? "on" : undefined)}>
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Navigate to="/calculator" replace />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/type/:type" element={<TypeReader />} />
        <Route path="/pair/:a/:b" element={<PairReader />} />
        <Route path="/network" element={<Network />} />
        <Route path="/matrix" element={<Matrix />} />
        <Route path="/lexicon" element={<Lexicon />} />
        <Route path="/lexicon/:id" element={<Lexicon />} />
        <Route path="*" element={<Navigate to="/calculator" replace />} />
      </Routes>
    </div>
  );
}

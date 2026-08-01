import { Link, useNavigate, useParams } from "react-router";
import { stack, ease, type MbtiType } from "../engine/core";
import { ARCHETYPE, type Fn } from "../engine/data";
import { writeStored } from "../storage";
import FnIcon from "../components/glyphs/FnIcon";
import EightSet from "../components/glyphs/EightSet";
import AttitudeMark from "../components/glyphs/AttitudeMark";
import Agency from "../components/glyphs/Agency";
import TypeMolecule from "../components/glyphs/TypeMolecule";
import StackOrder from "../components/StackOrder";
import RelationLanding from "../components/RelationLanding";
import DivergingEase from "../components/DivergingEase";

/** Read by App.tsx to decide whether "/" should send a reader here first. */
export const ONBOARDING_DONE_KEY = "onboarding.done";

/* The app's own standing example everywhere else (Home's tiles, the nav
   tabs) — reusing it here means a reader who continues past onboarding
   keeps seeing the same two people, not a fresh pair to re-orient around. */
const EXAMPLE: MbtiType = "ENTP";
const PARTNER: MbtiType = "INFJ";

interface Screen {
  idea: string;
  figure: React.JSX.Element;
  unlock: string;
}

/** Eight screens, one idea each — the foundation gate from the design catalogue. */
function screens(): Screen[] {
  const st = stack(EXAMPLE);
  return [
    {
      idea: "There are eight basic ways of paying attention — and everyone uses all eight, just not equally.",
      figure: <EightSet />,
      unlock: "Four families, each with an outward version and an inward one. That's the two halves.",
    },
    {
      idea: "Every one of those eight either reaches outward, toward the world — or draws inward, toward something already settled.",
      figure: <AttitudeMark />,
      unlock: "That's the whole difference between Ne and Ni, say: same family, opposite direction.",
    },
    {
      idea: "Nobody has just four of the eight. Everyone has all eight — ranked, from the one they reach for first to the one they reach for last.",
      figure: <StackOrder type={EXAMPLE} />,
      unlock: "That order is what a type actually is — not a list of what you ‘have’.",
    },
    {
      idea: "The top four are yours to choose. The bottom four move on their own, faster than you can catch.",
      figure: <Agency />,
      unlock: "Not weaker — just not yours to time. You'll still see them; you just won't see them coming.",
    },
    {
      idea: "The top of the order is genuinely strong. The bottom is real too — it's just the one you're least practiced at defending.",
      figure: (
        <div style={{ display: "flex", gap: "var(--s7)", alignItems: "center", flexWrap: "wrap" }}>
          <BestOrSore fn={st[0]} label="Lead — your best" />
          <BestOrSore fn={st[3]} label="Cave — your sore spot" />
        </div>
      ),
      unlock: "You now know where to look for your own best move, and your own sore spot.",
    },
    {
      idea: "Sixteen four-letter codes are precise, but forgettable. So every type carries a few names too — not a box, just a way in.",
      figure: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--s3)" }}>
          <TypeMolecule type={EXAMPLE} size={96} />
          <p className="lede" style={{ margin: 0, textAlign: "center" }}>{ARCHETYPE[EXAMPLE].join(" · ")}</p>
        </div>
      ),
      unlock: "Three ways to picture the same wiring, not three different people.",
    },
    {
      idea: "When two people meet, each one's strongest move lands somewhere specific in the other's order — sometimes gently, sometimes not.",
      figure: <RelationLanding a={EXAMPLE} b={PARTNER} />,
      unlock: "Land high, and it's restful. Land low, and it costs something.",
    },
    {
      idea: "And it almost never lands the same way for both people. How easy this feels depends on which direction you're asking about.",
      figure: (
        <DivergingEase
          toward={ease(EXAMPLE, PARTNER)}
          from={ease(PARTNER, EXAMPLE)}
          labels={[`For ${EXAMPLE}`, `For ${PARTNER}`]}
        />
      ),
      unlock: "One number would have quietly picked a side. Now you know to ask which direction.",
    },
  ];
}

function BestOrSore({ fn, label }: { fn: Fn; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--s2)" }}>
      <FnIcon fn={fn} size={64} />
      <span className="small muted">{label}</span>
    </div>
  );
}

/** Clamp a raw `:step` URL param to a valid 1-indexed screen number, defaulting to 1. */
export function resolveStep(raw: string | undefined, count: number): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), 1), count) : 1;
}

/**
 * The foundation gate: eight screens, one idea and one figure each, before a
 * reader reaches the fully-loaded application. Skippable at every step and
 * re-enterable afterward (Home links back here) — never a quiz, nothing to
 * get wrong, and each screen has to survive being the only one someone reads.
 */
export default function Welcome() {
  const { step } = useParams();
  const nav = useNavigate();
  const SCREENS = screens();

  const n = resolveStep(step, SCREENS.length);
  const i = n - 1;
  const s = SCREENS[i];
  const isFirst = i === 0;
  const isLast = i === SCREENS.length - 1;

  const leave = () => {
    writeStored(ONBOARDING_DONE_KEY, "1");
    nav("/");
  };

  return (
    <div className="onboard">
      <div className="onboard-top">
        <span className="wordmark">Octant</span>
        <button type="button" className="btn ghost" onClick={leave}>Skip intro</button>
      </div>

      {/* biome-ignore lint/a11y/useSemanticElements: the dots are a labelled progress group; no HTML element says that without becoming a form control. */}
      <div className="onboard-progress" role="group" aria-label={`Part ${n} of ${SCREENS.length}`}>
        {SCREENS.map((_, idx) => (
          <span
            key={idx}
            className={`onboard-dot${idx < n ? " on" : ""}`}
            aria-current={idx === i ? "step" : undefined}
          />
        ))}
      </div>

      <div className="onboard-body">
        <h1 className="onboard-idea" style={{ maxWidth: "18ch" }}>{s.idea}</h1>
        <div className="onboard-figure">{s.figure}</div>
        <p className="small muted onboard-unlock">{s.unlock}</p>
      </div>

      <div className="onboard-nav">
        {isFirst ? <span /> : <Link to={`/welcome/${i}`} className="btn">← Back</Link>}
        {isLast ? (
          <button type="button" className="btn primary" onClick={leave}>Enter Octant →</button>
        ) : (
          <Link to={`/welcome/${i + 2}`} className="btn primary">Next →</Link>
        )}
      </div>
    </div>
  );
}

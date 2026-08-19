import { stack, isObserver, isExtraverted } from "../engine/core";
import { SLOT_NAMES, type MbtiType } from "../engine/data";
import { usePalette } from "./Theme";

/**
 * How four letters become a function stack — worked live for any type.
 *
 * Structure after the derivation sheet in the source batch
 * (docs/transcripts/INTJ-letters-to-stack.md), generalised from its INTJ
 * example to all sixteen and computed from the engine rather than authored,
 * so it cannot disagree with `stack()`.
 *
 * This is the step the app never explained: `stack()` takes (dominant,
 * auxiliary) as given, and the course asserted the letter mapping. It is also
 * the first question anyone arriving with "I'm an INTJ" actually has.
 */
export default function LettersToStack({ type }: { type: MbtiType }) {
  const p = usePalette();
  const st = stack(type);
  const [hero, parent, child, inferior] = st;

  const attitude = type[0] === "I" ? "intraverted" : "extraverted";
  const lastLetter = type[3] === "J" ? "Judger" : "Perceiver";
  const heroKind = isObserver(hero) ? "perceiving" : "judging";

  /* Step wording after the deck's decoder card (front-decode in
     src/cards/deck.ts): each step one heading, one line of reasoning. */
  const steps = [
    {
      letter: type[0],
      title: `${type[0]} — which way the strongest tool faces`,
      body: `You are ${attitude === "intraverted" ? "an Intravert" : "an Extravert"}: your strongest tool faces ${attitude === "intraverted" ? "inward" : "outward"}.`,
    },
    {
      letter: type[3],
      title: `${type[3]} — the tool shown to the world`,
      /* The two cases are genuinely different, and collapsing them makes the
         extravert version circular. The last letter always names the tool
         turned OUTWARD — deciding for J, perceiving for P. An Extravert
         shows their strongest, so the letter names it directly; an Intravert
         shows only their second, so the strongest is the other kind. */
      body: attitude === "extraverted"
        ? `The last letter names the tool you show the world — deciding for J, perceiving for P — and an ` +
          `Extravert shows their strongest. You are a ${lastLetter}, so your strongest tool is ` +
          `${heroKind}, and step 1 already said it faces outward.`
        : `The last letter names the tool you show the world — deciding for J, perceiving for P — and an ` +
          `Intravert shows their second, not their strongest. You are a ${lastLetter}, so the tool the ` +
          `world sees is ${type[3] === "J" ? "a judging one" : "a perceiving one"}; your strongest sits ` +
          `behind it, faces inward, and is the other kind: ${heroKind}.`,
      result: `Your strongest tool is ${hero}.`,
      fn: hero,
    },
    {
      letter: type[1] + type[2],
      title: `${type[1]}${type[2]} — the two tools in play`,
      body:
        `The middle letters name your perceiver and your decider. The one that is not your ` +
        `strongest is your second, and it faces the other way — ` +
        `${isExtraverted(hero) ? "outward first, inward second" : "inward first, outward second"}.`,
      result: `Your second tool is ${parent}.`,
      fn: parent,
    },
    {
      letter: "↕",
      title: "The mirror — the bottom two oppose the top two",
      body:
        `Your weakest tool is the exact opposite of your strongest — other kind, other direction — ` +
        `and your third opposes your second the same way. Seats 5–8 are these four, turned.`,
      result: `Third is ${child}; weakest is ${inferior}.`,
      fn: inferior,
    },
  ];

  return (
    <div>
      <div className="cluster" style={{ justifyContent: "center", marginBottom: "var(--s5)", gap: "var(--s2)" }}>
        {type.split("").map((l, i) => (
          <span
            key={i}
            className="mono"
            style={{
              display: "grid",
              placeItems: "center",
              width: 46,
              height: 46,
              fontSize: "var(--t-xl)",
              border: "1px solid var(--rule-strong)",
              borderRadius: "var(--radius)",
              background: "var(--surface-2)",
            }}
          >
            {l}
          </span>
        ))}
      </div>

      <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {steps.map((s, i) => (
          <li
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "44px 1fr",
              gap: "var(--s3)",
              padding: "var(--s3) 0",
              borderTop: i ? "1px solid var(--rule)" : "none",
              marginBottom: 0,
            }}
          >
            <b className="mono" style={{ fontSize: "var(--t-lg)", color: "var(--muted)" }}>{s.letter}</b>
            <div>
              <b style={{ fontFamily: "var(--sans)", fontSize: "var(--t-sm)" }}>{s.title}</b>
              <p className="small" style={{ margin: "4px 0 0" }}>{s.body}</p>
              {s.result && (
                <p style={{ margin: "6px 0 0", fontSize: "var(--t-base)" }}>
                  <b className="mono" style={{ color: p.fn(s.fn!) }}>{s.result}</b>
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div
        style={{
          marginTop: "var(--s4)",
          paddingTop: "var(--s4)",
          borderTop: "1px solid var(--rule)",
          display: "flex",
          gap: "var(--s4)",
          flexWrap: "wrap",
        }}
      >
        {st.slice(0, 4).map((fn, i) => (
          <div key={fn}>
            <b className="mono" style={{ color: p.fn(fn), fontSize: "var(--t-lg)" }}>{fn}</b>
            <div className="small muted">{SLOT_NAMES[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

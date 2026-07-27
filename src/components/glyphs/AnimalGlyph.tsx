import { type Animal, ANIMAL_DOES, ANIMAL_LABEL } from "../../engine/ops";
import { person, arrowhead } from "./geometry";

/**
 * The four animals as arrow signatures around one person:
 *
 *   Consume  arrows in, and a loop — takes in more than it shares
 *   Blast    a loop, and arrows out — shares more than it takes in
 *   Play     arrows in AND out — live exchange with the world
 *   Sleep    the closed loop only — processing alone, nothing crossing
 *
 * Chrome colours on purpose: an animal is a pairing of attitudes, not a
 * function, so it takes no function hue. The accent carries the motion.
 *
 * Original artwork.
 */
export default function AnimalGlyph({ animal }: { animal: Animal }) {
  const me = person(48, 58, 6.5);
  const cy = me.head.cy;

  const inflow = (
    <g>
      {[cy - 10, cy, cy + 10].map((y, i) => (
        <g key={i}>
          <line x1="4" y1={y} x2="30" y2={y} stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" />
          <path d={arrowhead(33, y, 1, 0, 6)} fill="var(--accent)" />
        </g>
      ))}
    </g>
  );

  const outflow = (
    <g>
      {[cy - 10, cy, cy + 10].map((y, i) => (
        <g key={i}>
          <line x1="66" y1={y} x2="88" y2={y} stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" />
          <path d={arrowhead(92, y, 1, 0, 6)} fill="var(--accent)" />
        </g>
      ))}
    </g>
  );

  /* the inner loop: a circular arrow around the head */
  const loop = (
    <g>
      <path
        d={`M 48 ${cy - 15} A 15 15 0 1 1 ${48 - 13} ${cy + 7}`}
        fill="none"
        stroke="var(--ink-2)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d={arrowhead(48 - 13.5, cy + 8.5, -0.5, 1, 5.5)} fill="var(--ink-2)" />
    </g>
  );

  return (
    <svg
      width="100%"
      viewBox="0 0 96 66"
      role="img"
      aria-label={`${ANIMAL_LABEL[animal]}: ${ANIMAL_DOES[animal]}`}
      style={{ display: "block", maxWidth: 132 }}
    >
      {(animal === "Consume" || animal === "Play") && inflow}
      {(animal === "Blast" || animal === "Play") && outflow}
      {(animal === "Consume" || animal === "Blast" || animal === "Sleep") && loop}

      <circle {...me.head} fill="var(--ink)" />
      <path d={me.shoulders} stroke="var(--ink)" strokeWidth="3.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

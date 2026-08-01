import type { ReactNode } from "react";
import { TYPES, ease, type MbtiType, type Quadra } from "../engine/core";
import type { Fn } from "../engine/data";
import { ops } from "../engine/ops";
import { wheelOf } from "../engine/octagram";
import RelationLanding from "../components/RelationLanding";
import DivergingEase from "../components/DivergingEase";
import WiringSchematic from "../components/WiringSchematic";
import FourSidesDiagram from "../components/FourSidesDiagram";
import GatewayPath from "../components/GatewayPath";
import SaviorDemonGrid from "../components/SaviorDemonGrid";
import AnimalStack from "../components/AnimalStack";
import ArchetypeGrid from "../components/ArchetypeGrid";
import InvolutionTable from "../components/InvolutionTable";
import QuadraFunctionGrid from "../components/QuadraFunctionGrid";
import OctagramWheel from "../components/OctagramWheel";
import OctagramMap from "../components/OctagramMap";
import TypeMolecule from "../components/glyphs/TypeMolecule";
import FnIcon from "../components/glyphs/FnIcon";
import AnimalGlyph from "../components/glyphs/AnimalGlyph";
import type { Animal } from "../engine/ops";

/* ------------------------------------------------------------------ *
 * FIGURES THE ASSISTANT CAN DRAW.
 *
 * The model may put `{{figure:NAME ARGS}}` on a line of its answer, and
 * the chat renderer swaps that line for the app's own diagram — the
 * real component, drawn by the engine, not an image. The menu of names
 * lives in two places that a test keeps in lockstep: this registry, and
 * the FIGURES section of MODEL_PRIMER in engine/context.ts.
 *
 * Every argument is validated. A directive that names an unknown figure
 * or an invalid type/function/quadra renders as muted plain text —
 * model output must never be able to throw inside the rail.
 * ------------------------------------------------------------------ */

const isType = (s: string | undefined): s is MbtiType =>
  !!s && (TYPES as readonly string[]).includes(s.toUpperCase()) ;
const asType = (s: string) => s.toUpperCase() as MbtiType;

const FNS: readonly string[] = ["Ne", "Ni", "Se", "Si", "Te", "Ti", "Fe", "Fi"];
const isFn = (s: string | undefined): s is Fn =>
  !!s && FNS.includes(s[0]?.toUpperCase() + s.slice(1).toLowerCase());
const asFn = (s: string) => (s[0].toUpperCase() + s.slice(1).toLowerCase()) as Fn;

const QUADRAS: readonly string[] = ["Alpha", "Beta", "Gamma", "Delta"];
const isQuadra = (s: string | undefined): s is Quadra =>
  !!s && QUADRAS.includes(s[0]?.toUpperCase() + s.slice(1).toLowerCase());
const asQuadra = (s: string) => (s[0].toUpperCase() + s.slice(1).toLowerCase()) as Quadra;

/** SVG diagrams keep their 14px floor in the narrow rail by scrolling, not shrinking. */
const Scroll = ({ minWidth, children }: { minWidth: number; children: ReactNode }) => (
  <div style={{ overflowX: "auto" }}>
    <div style={{ minWidth }}>{children}</div>
  </div>
);

/** name → arity check + renderer. Args arrive upper/lower-case tolerant. */
const FIGURES: Record<string, (args: string[]) => ReactNode | null> = {
  "relation-landing": ([a, b]) =>
    isType(a) && isType(b)
      ? <Scroll minWidth={480}><RelationLanding a={asType(a)} b={asType(b)} /></Scroll>
      : null,
  "diverging-ease": ([a, b]) =>
    isType(a) && isType(b)
      ? (
        <DivergingEase
          toward={ease(asType(a), asType(b))}
          from={ease(asType(b), asType(a))}
          labels={[`${asType(a)} being around ${asType(b)}`, `${asType(b)} being around ${asType(a)}`]}
        />
      )
      : null,
  wiring: ([t]) =>
    isType(t) ? <Scroll minWidth={560}><WiringSchematic type={asType(t)} showCorrespondence /></Scroll> : null,
  "four-sides": ([t]) => (isType(t) ? <FourSidesDiagram type={asType(t)} /> : null),
  "gateway-path": ([t]) => (isType(t) ? <GatewayPath type={asType(t)} /> : null),
  "savior-demon": ([t]) => (isType(t) ? <SaviorDemonGrid type={asType(t)} /> : null),
  "animal-stack": ([t]) => (isType(t) ? <AnimalStack sig={ops(asType(t))} /> : null),
  wheel: ([t]) =>
    isType(t) ? <Scroll minWidth={440}><OctagramWheel wheel={wheelOf(asType(t))} layout="tall" /></Scroll> : null,
  "archetype-grid": ([t]) =>
    t === undefined ? <ArchetypeGrid /> : isType(t) ? <ArchetypeGrid type={asType(t)} /> : null,
  "involution-table": ([f]) =>
    f === undefined ? <InvolutionTable /> : isFn(f) ? <InvolutionTable highlight={asFn(f)} /> : null,
  "quadra-grid": ([q]) =>
    q === undefined ? <QuadraFunctionGrid /> : isQuadra(q) ? <QuadraFunctionGrid highlight={asQuadra(q)} /> : null,
  "octagram-map": ([t]) =>
    t === undefined ? <Scroll minWidth={480}><OctagramMap /></Scroll>
      : isType(t) ? <Scroll minWidth={480}><OctagramMap highlight={asType(t)} /></Scroll> : null,

  /* The glyph language. */
  molecule: ([t]) => (isType(t) ? <TypeMolecule type={asType(t)} size={96} /> : null),
  "fn-icon": ([f]) => (isFn(f) ? <FnIcon fn={asFn(f)} size={56} /> : null),
  animal: ([a]) => {
    const name = a ? a[0].toUpperCase() + a.slice(1).toLowerCase() : "";
    return (["Play", "Blast", "Consume", "Sleep"] as const).includes(name as Animal)
      ? <div style={{ maxWidth: 140 }}><AnimalGlyph animal={name as Animal} /></div>
      : null;
  },
};

/** The directive names, for the primer-parity test. */
export const FIGURE_NAMES = Object.keys(FIGURES);

/** A COMPLETE directive line: `{{figure:name arg arg}}`. Partial lines stay text. */
export const DIRECTIVE = /^\{\{figure:([a-z-]+)((?:[ \t]+[^\s{}]+)*)[ \t]*\}\}$/;

/**
 * Render a directive line, or null when the line is not a complete directive.
 * An invalid but complete directive renders as muted text — visible, inert.
 */
export function chatFigure(line: string): ReactNode | null {
  const m = line.trim().match(DIRECTIVE);
  if (!m) return null;
  const [, name, rawArgs] = m;
  const args = rawArgs.trim() ? rawArgs.trim().split(/\s+/) : [];
  const node = FIGURES[name]?.(args) ?? null;
  return node
    ? <div className="chat-fig">{node}</div>
    : <p className="small muted">[figure unavailable: {name} {args.join(" ")}]</p>;
}

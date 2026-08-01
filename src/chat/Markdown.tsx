import { Fragment, type ReactNode } from "react";
import { chatFigure } from "./chat-figures";

/**
 * A deliberately small markdown renderer for assistant replies.
 *
 * It builds React elements rather than setting innerHTML, so model output can
 * never inject markup. It covers exactly what the assistant is asked to emit:
 * paragraphs, headings, bullet and numbered lists, bold, italic and code —
 * plus `{{figure:…}}` directive lines, which render the app's own diagrams
 * in place (see chat-figures.tsx). A directive only swaps in once complete,
 * so a still-streaming one shows as text and then snaps to the figure.
 */
export default function Markdown({ text }: { text: string }) {
  return <>{blocks(text)}</>;
}

/**
 * Split the model's markdown into renderable blocks. Deliberately small — headings,
 * lists, paragraphs and code — because the assistant is told to keep answers plain.
 */
function blocks(src: string): ReactNode[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out: ReactNode[] = [];
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  /** Close the paragraph being accumulated, if any. */
  const flushPara = () => {
    if (!para.length) return;
    out.push(<p key={`p${out.length}`}>{inline(para.join(" "))}</p>);
    para = [];
  };
  /** Close the list being accumulated, if any. */
  const flushList = () => {
    if (!list) return;
    const items = list.items.map((it, i) => <li key={i}>{inline(it)}</li>);
    out.push(list.ordered ? <ol key={`l${out.length}`}>{items}</ol> : <ul key={`l${out.length}`}>{items}</ul>);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }

    const figure = chatFigure(line);
    if (figure) {
      flushPara();
      flushList();
      out.push(<Fragment key={`f${out.length}`}>{figure}</Fragment>);
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushPara();
      flushList();
      out.push(<h4 key={`h${out.length}`}>{inline(heading[2])}</h4>);
      continue;
    }

    const bullet = line.match(/^\s*[-*+]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      flushPara();
      const ordered = !!numbered;
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push((bullet ?? numbered)![1]);
      continue;
    }

    flushList();
    para.push(line.trim());
  }

  flushPara();
  flushList();
  return out;
}

/** Bold, italic and inline code. Longest delimiters first so ** beats *. */
function inline(src: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*\n]+\*|_[^_\n]+_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  // biome-ignore lint/suspicious/noAssignInExpressions: the standard exec() loop — assignment IS the loop condition.
  while ((m = re.exec(src))) {
    if (m.index > last) parts.push(<Fragment key={key++}>{src.slice(last, m.index)}</Fragment>);
    const token = m[0];
    if (token.startsWith("**") || token.startsWith("__")) {
      parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      parts.push(<code key={key++}>{token.slice(1, -1)}</code>);
    } else {
      parts.push(<em key={key++}>{token.slice(1, -1)}</em>);
    }
    last = m.index + token.length;
  }
  if (last < src.length) parts.push(<Fragment key={key++}>{src.slice(last)}</Fragment>);
  return parts;
}

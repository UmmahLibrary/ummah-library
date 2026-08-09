/**
 * The typed block shape the blog article renderer maps over — mirrors the
 * Noor blog design prototype's data shape (`docs/design/noor-prototype-blog`),
 * produced from real Markdown by `parse-markdown.ts` instead of hand-written
 * JS. Kept as plain, JSON-serializable data (no functions) so it can cross
 * the server → client boundary as component props.
 */

/** One inline span within a paragraph, list item, or blockquote. */
export type InlinePart =
  | string
  | { bold: string }
  | { italic: string }
  | { code: string }
  /** An Arabic term with its transliteration, e.g. `:ar[قِبْلَة]{translit=qibla}`. */
  | { ar: string; translit: string };

export type Inline = InlinePart[];

export interface Heading {
  id: string;
  text: string;
}

export type Block =
  | { type: "p"; text: Inline }
  | { type: "h2"; text: string; id: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: Inline[] }
  | { type: "ol"; items: Inline[] }
  | { type: "quote"; text: Inline; cite?: string }
  | { type: "hr" }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "code"; lang: string; code: string }
  /** A Mermaid diagram — `code` is the raw Mermaid definition. */
  | { type: "diagram"; code: string; caption?: string };

/** Block types allowed to break out of the narrow prose measure (denser content). */
export const BREAKOUT_BLOCK_TYPES: ReadonlySet<Block["type"]> = new Set([
  "diagram",
  "table",
  "code",
]);

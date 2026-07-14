/**
 * Markdown → typed block pipeline (build-time only; see ADR 0037).
 *
 * Parses an article's Markdown body into the `Block[]` shape the blog
 * renderer expects. Runs once per article at build time via
 * `getStaticProps`/`generateStaticParams` — never at request time.
 */
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { toString as mdastToString } from "mdast-util-to-string";
import type { Blockquote, Heading, List, PhrasingContent, Root, RootContent, Table } from "mdast";
import { unified } from "unified";
import type { Block, Inline, InlinePart } from "./blocks";

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkDirective);

/** A directive node produced by `remark-directive` for `:ar[text]{translit=...}`. */
interface ArDirectiveNode {
  type: "textDirective";
  name: string;
  attributes?: Record<string, string | null | undefined> | null;
  children: PhrasingContent[];
}

function isArDirective(node: PhrasingContent): node is PhrasingContent & ArDirectiveNode {
  return node.type === "textDirective" && (node as { name?: string }).name === "ar";
}

/** Converts a run of inline mdast phrasing nodes into flat, serializable parts. */
function inlineFromChildren(children: readonly PhrasingContent[]): Inline {
  const parts: InlinePart[] = [];
  for (const node of children) {
    if (node.type === "text") {
      parts.push(node.value);
    } else if (node.type === "inlineCode") {
      parts.push({ code: node.value });
    } else if (node.type === "strong") {
      parts.push({ bold: mdastToString(node) });
    } else if (node.type === "emphasis") {
      parts.push({ italic: mdastToString(node) });
    } else if (isArDirective(node)) {
      const translit = node.attributes?.translit ?? "";
      parts.push({ ar: mdastToString(node), translit });
    } else if ("children" in node && Array.isArray(node.children)) {
      parts.push(...inlineFromChildren(node.children as PhrasingContent[]));
    } else if ("value" in node && typeof node.value === "string") {
      parts.push(node.value);
    }
  }
  return parts;
}

function headingId(text: string, index: number): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return `h-${index}-${slug}`;
}

/**
 * A blockquote's optional citation: a trailing paragraph starting with an
 * em dash (`— Cited work`), stripped from the quoted text itself. Documented
 * in `docs/articles/README.md`.
 */
function splitQuoteCite(node: Blockquote): { text: Inline; cite?: string } {
  const paragraphs = node.children.filter(
    (c): c is RootContent & { type: "paragraph" } => c.type === "paragraph",
  );
  const last = paragraphs.at(-1);
  const lastText = last ? mdastToString(last).trim() : "";
  const isCite = paragraphs.length > 1 && /^[—-]\s*/.test(lastText);
  const bodyParagraphs = isCite ? paragraphs.slice(0, -1) : paragraphs;
  const text = bodyParagraphs.flatMap((p) => inlineFromChildren(p.children));
  const cite = isCite ? lastText.replace(/^[—-]\s*/, "") : undefined;
  return cite ? { text, cite } : { text };
}

function listItemsOf(node: List): Inline[] {
  return node.children.map((item) => {
    const paragraphs = item.children.filter(
      (c): c is RootContent & { type: "paragraph" } => c.type === "paragraph",
    );
    return paragraphs.flatMap((p) => inlineFromChildren(p.children));
  });
}

const MERMAID_CAPTION_RE = /caption="([^"]*)"/;

function tableCellText(node: Table): string[][] {
  return node.children.map((row) => row.children.map((cell) => mdastToString(cell)));
}

/** Parses one article's Markdown body (frontmatter already stripped) into blocks. */
export function parseMarkdownToBlocks(markdown: string): Block[] {
  const tree = processor.parse(markdown) as Root;
  const blocks: Block[] = [];
  let headingIndex = 0;

  for (const node of tree.children) {
    if (node.type === "paragraph") {
      blocks.push({ type: "p", text: inlineFromChildren(node.children) });
    } else if (node.type === "heading") {
      const h = node as Heading;
      const text = mdastToString(h);
      if (h.depth === 2) {
        blocks.push({ type: "h2", text, id: headingId(text, headingIndex++) });
      } else if (h.depth === 3) {
        blocks.push({ type: "h3", text });
      }
      // Depth 1 (and >3) headings are ignored — the article title comes from
      // frontmatter, and the design defines only two prose heading levels.
    } else if (node.type === "list") {
      const items = listItemsOf(node);
      blocks.push(node.ordered ? { type: "ol", items } : { type: "ul", items });
    } else if (node.type === "blockquote") {
      blocks.push({ type: "quote", ...splitQuoteCite(node) });
    } else if (node.type === "thematicBreak") {
      blocks.push({ type: "hr" });
    } else if (node.type === "table") {
      const [head, ...rows] = tableCellText(node);
      blocks.push({ type: "table", head: head ?? [], rows });
    } else if (node.type === "code") {
      const lang = node.lang ?? "text";
      if (lang === "mermaid") {
        const caption = node.meta?.match(MERMAID_CAPTION_RE)?.[1];
        blocks.push({ type: "diagram", code: node.value, ...(caption ? { caption } : {}) });
      } else {
        blocks.push({ type: "code", lang, code: node.value });
      }
    }
    // Other node types (html, etc.) are not part of the supported block set
    // and are intentionally skipped rather than guessed at.
  }

  return blocks;
}

/** Extracts the h2-derived table of contents from a parsed article's blocks. */
export function headingsOf(blocks: readonly Block[]): { id: string; text: string }[] {
  return blocks
    .filter((b): b is Extract<Block, { type: "h2" }> => b.type === "h2")
    .map((b) => ({ id: b.id, text: b.text }));
}

const WPM = 200;

function inlineWordCount(text: Inline): number {
  return text.reduce((sum, part) => {
    const s = typeof part === "string" ? part : "ar" in part ? part.ar : Object.values(part)[0];
    return sum + String(s).split(/\s+/).filter(Boolean).length;
  }, 0);
}

/** Estimated reading time in minutes at ~200wpm, from the article's own block content. */
export function readingMinutesOf(blocks: readonly Block[]): number {
  let words = 0;
  for (const b of blocks) {
    if (b.type === "p" || b.type === "quote") words += inlineWordCount(b.text);
    else if (b.type === "h2" || b.type === "h3")
      words += b.text.split(/\s+/).filter(Boolean).length;
    else if (b.type === "ul" || b.type === "ol") {
      for (const item of b.items) words += inlineWordCount(item);
    } else if (b.type === "table") {
      words += b.head.join(" ").split(/\s+/).filter(Boolean).length;
      for (const row of b.rows) words += row.join(" ").split(/\s+/).filter(Boolean).length;
    }
  }
  return Math.max(1, Math.round(words / WPM));
}

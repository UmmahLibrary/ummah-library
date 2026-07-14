import { Fragment } from "react";
import { N } from "@ummahlibrary/ui";
import { BREAKOUT_BLOCK_TYPES, type Block, type Inline } from "../../lib/blog/blocks";
import { CodeBlock } from "./CodeBlock";
import { DiagramFrame } from "./DiagramFrame";

const serif = "var(--font-source-serif), Georgia, serif";

function ArTerm({ ar, translit }: { ar: string; translit: string }) {
  return (
    <bdi style={{ fontWeight: 600, color: N.fg, margin: "0 2px", fontFamily: N.ar }}>
      {ar}
      <span
        style={{
          fontFamily: N.ui,
          fontStyle: "italic",
          color: N.muted,
          fontWeight: 400,
          marginLeft: 5,
        }}
      >
        ({translit})
      </span>
    </bdi>
  );
}

function InlineCode({ children }: { children: string }) {
  return (
    <code
      style={{
        fontFamily: "ui-monospace, Menlo, monospace",
        fontSize: "0.82em",
        color: N.gold,
        background: N.goldSoft,
        borderRadius: 5,
        padding: "2px 6px",
      }}
    >
      {children}
    </code>
  );
}

function renderInline(text: Inline) {
  return text.map((part, i) => {
    if (typeof part === "string") return <Fragment key={i}>{part}</Fragment>;
    if ("ar" in part) return <ArTerm key={i} ar={part.ar} translit={part.translit} />;
    if ("code" in part) return <InlineCode key={i}>{part.code}</InlineCode>;
    if ("bold" in part) return <strong key={i}>{part.bold}</strong>;
    return <em key={i}>{part.italic}</em>;
  });
}

function ProseP({ text }: { text: Inline }) {
  return (
    <p
      style={{ fontSize: 19, lineHeight: 1.75, color: N.fg, margin: "0 0 26px", fontFamily: serif }}
    >
      {renderInline(text)}
    </p>
  );
}

function ProseH2({ text, id }: { text: string; id: string }) {
  return (
    <h2
      id={id}
      style={{
        fontSize: 26,
        fontWeight: 800,
        letterSpacing: -0.4,
        color: N.fg,
        fontFamily: N.ui,
        margin: "52px 0 18px",
        scrollMarginTop: 84,
      }}
    >
      {text}
    </h2>
  );
}

function ProseH3({ text }: { text: string }) {
  return (
    <h3
      style={{
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: -0.2,
        color: N.fg,
        fontFamily: N.ui,
        margin: "38px 0 14px",
      }}
    >
      {text}
    </h3>
  );
}

function ProseList({ items, ordered }: { items: Inline[]; ordered: boolean }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag
      style={{
        margin: "0 0 26px",
        padding: "0 0 0 24px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        fontFamily: serif,
      }}
    >
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 18, lineHeight: 1.65, color: N.fg }}>
          {renderInline(item)}
        </li>
      ))}
    </Tag>
  );
}

function ProseQuote({ text, cite }: { text: Inline; cite?: string }) {
  return (
    <blockquote
      style={{
        margin: "0 0 26px",
        padding: "20px 24px",
        background: N.bg2,
        borderLeft: `3px solid ${N.gold}`,
        borderRadius: "0 10px 10px 0",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 18.5,
          lineHeight: 1.65,
          color: N.muted,
          fontFamily: serif,
          fontStyle: "italic",
        }}
      >
        “{renderInline(text)}”
      </p>
      {cite && (
        <div
          style={{
            marginTop: 12,
            fontSize: 12.5,
            fontWeight: 700,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: N.faint,
            fontFamily: N.ui,
          }}
        >
          {cite}
        </div>
      )}
    </blockquote>
  );
}

function ProseHR() {
  return (
    <hr style={{ border: "none", borderTop: `1px solid ${N.borderSoft}`, margin: "36px 0" }} />
  );
}

function ProseTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div
      style={{
        margin: "0 0 24px",
        background: N.card,
        border: `1px solid ${N.border}`,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14.5 }}>
        <thead>
          <tr style={{ background: N.bg2 }}>
            {head.map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "11px 16px",
                  fontSize: 11.5,
                  fontWeight: 700,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  color: N.faint,
                  borderBottom: `1px solid ${N.border}`,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td
                  key={j}
                  style={{
                    padding: "12px 16px",
                    color: j === 0 ? N.fg : N.muted,
                    fontWeight: j === 0 ? 700 : 400,
                    borderTop: `1px solid ${N.borderSoft}`,
                    fontFamily: j === 0 ? "ui-monospace, Menlo, monospace" : N.ui,
                  }}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Maps a parsed article's blocks onto the prose component set (ADR 0037). */
export function ArticleBody({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        let node: React.ReactNode = null;
        if (b.type === "p") node = <ProseP text={b.text} />;
        else if (b.type === "h2") node = <ProseH2 text={b.text} id={b.id} />;
        else if (b.type === "h3") node = <ProseH3 text={b.text} />;
        else if (b.type === "ul") node = <ProseList items={b.items} ordered={false} />;
        else if (b.type === "ol") node = <ProseList items={b.items} ordered={true} />;
        else if (b.type === "quote") node = <ProseQuote text={b.text} cite={b.cite} />;
        else if (b.type === "hr") node = <ProseHR />;
        else if (b.type === "table") node = <ProseTable head={b.head} rows={b.rows} />;
        else if (b.type === "diagram") node = <DiagramFrame code={b.code} caption={b.caption} />;
        else if (b.type === "code") node = <CodeBlock lang={b.lang} code={b.code} />;

        if (!node) return null;
        return BREAKOUT_BLOCK_TYPES.has(b.type) ? (
          <Fragment key={i}>{node}</Fragment>
        ) : (
          <div key={i} className="ul-blog-textcol">
            {node}
          </div>
        );
      })}
    </>
  );
}

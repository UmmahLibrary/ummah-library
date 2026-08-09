"use client";
import { useState } from "react";
import { N } from "@ummahlibrary/ui";

type TokenKind = "plain" | "com" | "str" | "kw";
interface Token {
  kind: TokenKind;
  text: string;
}

const TOKEN_RE =
  /(\/\/[^\n]*|#[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b(?:import|export|from|const|let|var|function|return|if|else|interface|type|extends|implements|class|new|async|await|throw|try|catch|public|private|readonly|default|as|typeof|instanceof|for|while|of|in|true|false|null|undefined|module|exports)\b)/g;

/** A small regex tokenizer for keyword/string/comment coloring — no syntax-highlighter dependency. */
export function tokenizeCode(code: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((match = TOKEN_RE.exec(code))) {
    if (match.index > last) tokens.push({ kind: "plain", text: code.slice(last, match.index) });
    if (match[1]) tokens.push({ kind: "com", text: match[1] });
    else if (match[2]) tokens.push({ kind: "str", text: match[2] });
    else if (match[3]) tokens.push({ kind: "kw", text: match[3] });
    last = TOKEN_RE.lastIndex;
  }
  if (last < code.length) tokens.push({ kind: "plain", text: code.slice(last) });
  return tokens;
}

export function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const tokens = tokenizeCode(code);
  const colors: Record<TokenKind, string> = {
    plain: N.fg,
    com: N.faint,
    str: N.goldHi,
    kw: N.gold,
  };

  const copy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div
      style={{
        margin: "0 0 24px",
        borderRadius: 12,
        overflow: "hidden",
        border: `1px solid ${N.border}`,
        background: N.bg2,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "9px 14px",
          borderBottom: `1px solid ${N.borderSoft}`,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: N.faint,
            fontFamily: "ui-monospace, Menlo, monospace",
            textTransform: "uppercase",
            letterSpacing: 0.6,
          }}
        >
          {lang}
        </span>
        <button
          onClick={copy}
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: copied ? N.gold : N.faint,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: N.ui,
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre style={{ margin: 0, padding: "16px 18px", overflowX: "auto" }}>
        <code
          style={{
            fontFamily: "ui-monospace, Menlo, monospace",
            fontSize: 13.5,
            lineHeight: 1.7,
            whiteSpace: "pre",
          }}
        >
          {tokens.map((t, i) => (
            <span
              key={i}
              style={{ color: colors[t.kind], fontStyle: t.kind === "com" ? "italic" : "normal" }}
            >
              {t.text}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

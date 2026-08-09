/* Ummah Library — engineering blog kit. Editorial companion to the Noor app
   design: slim header, article index cards, and a full prose component set
   for the article body. Reuses N tokens, Btn, Icon, Logo, Khatam from the app
   kit — no new hardcoded colours. */

const { useState: useStateBlog } = React;

const card = { background: "var(--ul-card)", border: "1px solid var(--ul-border)", borderRadius: 16 };

// Editorial reading face — serif for long-form body copy, kept distinct from
// the app's all-Hanken-Grotesk UI chrome (headings/labels stay sans, matching
// the Medium-style contrast between headline sans and body serif).
const serif = "'Source Serif 4', Georgia, serif";

// ── Slim editorial header — no sidebar, no tool nav ───────────────────────────
function BlogHeader({ page = "blog", onNavigate, theme, onToggleTheme }) {
  const mode = THEME_MODE[theme] || "dark";
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 20, background: N.bg, borderBottom: `1px solid ${N.borderSoft}` }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", height: 64, display: "flex", alignItems: "center", gap: 28, padding: "0 28px" }}>
        <Logo scale={0.92} onClick={() => onNavigate && onNavigate("index")} />
        <div style={{ flex: 1 }} />
        <nav style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button className="ul-press ul-link" onClick={() => onNavigate && onNavigate("index")}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: N.ui, fontSize: 14, fontWeight: 700, padding: "8px 12px", borderRadius: 8, color: page === "blog" ? N.gold : N.muted }}>
            Blog
          </button>
          <a href="#" onClick={(e) => e.preventDefault()} className="ul-link"
            style={{ fontSize: 14, fontWeight: 600, padding: "8px 12px", borderRadius: 8, color: N.muted, textDecoration: "none" }}>
            Open the app
          </a>
        </nav>
        <a href="#" onClick={(e) => e.preventDefault()} title="RSS feed" className="ul-press ul-link"
          style={{ width: 36, height: 36, borderRadius: 10, background: N.card, border: `1px solid ${N.border}`, display: "grid", placeItems: "center", color: N.muted }}>
          <RssIcon size={15} color={N.muted} />
        </a>
        <button className="ul-press ul-link" onClick={onToggleTheme} title="Toggle theme"
          style={{ width: 36, height: 36, borderRadius: 10, background: N.card, border: `1px solid ${N.border}`, display: "grid", placeItems: "center", cursor: "pointer" }}>
          <Icon name={mode === "dark" ? "moon" : "sun"} size={16} color={N.muted} />
        </button>
      </div>
    </header>
  );
}

// ── Shared small pieces ────────────────────────────────────────────────────────
// A small RSS glyph — not in the app's icon set (app has no feed), drawn as a
// simple dot + two concentric arcs, matching the line-icon weight/style.
function RssIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="5.5" cy="18.5" r="1.8" fill={color} stroke="none" />
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4.5A15.5 15.5 0 0 1 19.5 20" />
    </svg>
  );
}

// Series is optional — renders nothing when the post has none (a standalone
// post is a first-class case, not a fallback).
function SeriesBadge({ series, size = "md" }) {
  if (!series) return null;
  const fs = size === "sm" ? 11.5 : 12.5;
  return (
    <span style={{ display: "inline-block", whiteSpace: "nowrap", fontSize: fs, fontWeight: 700, letterSpacing: 0.2, color: N.gold, background: N.goldSoft, border: `1px solid ${N.gold}`, borderRadius: 999, padding: size === "sm" ? "4px 10px" : "5px 12px" }}>
      {series}
    </span>
  );
}

const dateFmt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });
function PublishDate({ date, style }) {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date + "T00:00:00") : date;
  return <time dateTime={typeof date === "string" ? date : d.toISOString().slice(0, 10)} style={{ fontSize: 13, color: N.faint, whiteSpace: "nowrap", ...style }}>{dateFmt.format(d)}</time>;
}

function TagPill({ children }) {
  return (
    <span style={{ fontSize: 12, fontWeight: 600, color: N.muted, background: N.card, border: `1px solid ${N.border}`, borderRadius: 999, padding: "5px 11px", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

// ── Reading time ───────────────────────────────────────────────────────────────
// Estimated from the article's actual body word count (~200 wpm) — a
// computed fact, not a fabricated figure. Medium/dev.to/Substack all surface
// this as a lightweight signal of commitment before a reader clicks in.
function textWords(t) {
  if (!t) return 0;
  if (typeof t === "string") return t.split(/\s+/).filter(Boolean).length;
  return t.reduce((n, part) => n + (typeof part === "string" ? part.split(/\s+/).filter(Boolean).length : 1), 0);
}
function readMinutes(blocks) {
  let n = 0;
  blocks.forEach((b) => {
    if (b.type === "p" || b.type === "h2" || b.type === "h3") n += textWords(b.text);
    else if (b.type === "ul" || b.type === "ol") n += b.items.reduce((s, it) => s + textWords(it), 0);
    else if (b.type === "quote") n += textWords(b.text);
    else if (b.type === "table") n += b.head.reduce((s, h) => s + textWords(h), 0) + b.rows.reduce((s, r) => s + r.reduce((s2, c) => s2 + textWords(c), 0), 0);
  });
  return Math.max(1, Math.round(n / 200));
}

// One small, muted meta line: publish date · reading time. Either half is
// optional — an unpublished-in-demo post with no date just shows the minutes.
function PostMeta({ date, mins, style }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: N.faint, ...style }}>
      {date && <PublishDate date={date} />}
      {date && mins ? <span aria-hidden="true">·</span> : null}
      {mins ? <span>{mins} min read</span> : null}
    </div>
  );
}

// ── Index: article card ───────────────────────────────────────────────────────
function ArticleCard({ article, onOpen }) {
  const mins = readMinutes(article.body);
  return (
    <article onClick={() => onOpen(article.slug)} className="ul-press ul-link"
      style={{ ...card, padding: 24, display: "flex", flexDirection: "column", gap: 12, cursor: "pointer" }}>
      {article.series && <SeriesBadge series={article.series} size="sm" />}
      <div>
        <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.32, color: N.fg }}>{article.title}</h3>
        <p style={{ margin: "9px 0 0", fontSize: 14.5, lineHeight: 1.6, color: N.muted }}>{article.description}</p>
      </div>
      <div style={{ flex: 1 }} />
      <PostMeta date={article.date} mins={mins} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {article.tags.slice(0, 5).map((t) => <TagPill key={t}>{t}</TagPill>)}
      </div>
    </article>
  );
}

// ── Filtering — pill row for series, dropdown for tags (tags can grow large) ──
function FilterBar({ series, activeSeries, onSeries, tags, activeTag, onTag }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 28 }}>
      {series.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <button onClick={() => onSeries(null)} className="ul-press ul-link" style={{ fontSize: 12.5, fontWeight: 600, color: !activeSeries ? N.ink : N.muted, background: !activeSeries ? N.gold : N.card, border: `1px solid ${!activeSeries ? N.gold : N.border}`, borderRadius: 999, padding: "6px 13px", cursor: "pointer", fontFamily: N.ui }}>All</button>
          {series.map((s) => (
            <button key={s} onClick={() => onSeries(s)} className="ul-press ul-link" style={{ fontSize: 12.5, fontWeight: 600, color: activeSeries === s ? N.ink : N.muted, background: activeSeries === s ? N.gold : N.card, border: `1px solid ${activeSeries === s ? N.gold : N.border}`, borderRadius: 999, padding: "6px 13px", cursor: "pointer", fontFamily: N.ui, whiteSpace: "nowrap" }}>{s}</button>
          ))}
        </div>
      )}
      {tags.length > 0 && (
        <select value={activeTag || ""} onChange={(e) => onTag(e.target.value || null)}
          style={{ fontSize: 12.5, fontWeight: 600, color: N.fg, background: N.card, border: `1px solid ${N.border}`, borderRadius: 10, padding: "7px 12px", fontFamily: N.ui, cursor: "pointer", marginLeft: "auto" }}>
          <option value="">All tags</option>
          {tags.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      )}
    </div>
  );
}

function LoadMoreButton({ onClick, remaining, pageSize }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
      <Btn variant="ghost" onClick={onClick}>Load {Math.min(remaining, pageSize)} more</Btn>
    </div>
  );
}

// ── Prose components ──────────────────────────────────────────────────────────
const proseWidth = 680;

// Renders a paragraph's `text`, which may be a plain string or an array of
// (string | {ar, translit}) parts — the latter render as an inline Arabic term.
function ArTerm({ ar, translit }) {
  return (
    <bdi className="ul-ar" style={{ fontWeight: 600, color: N.fg, margin: "0 2px" }}>
      {ar}
      <span style={{ fontFamily: N.ui, fontStyle: "italic", color: N.muted, fontWeight: 400, marginLeft: 5 }}>({translit})</span>
    </bdi>
  );
}
function proseText(text) {
  if (typeof text === "string") return text;
  return text.map((part, i) => (typeof part === "string" ? <React.Fragment key={i}>{part}</React.Fragment> : <ArTerm key={i} ar={part.ar} translit={part.translit} />));
}

function ProseP({ children }) {
  return <p style={{ fontSize: 19, lineHeight: 1.75, color: N.fg, margin: "0 0 26px", fontFamily: serif, textWrap: "pretty" }}>{children}</p>;
}
function ProseH2({ children, id }) {
  return <h2 id={id} style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.4, color: N.fg, fontFamily: N.ui, margin: "52px 0 18px", scrollMarginTop: 84 }}>{children}</h2>;
}
function ProseH3({ children }) {
  return <h3 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.2, color: N.fg, fontFamily: N.ui, margin: "38px 0 14px" }}>{children}</h3>;
}
function ProseUL({ items }) {
  return (
    <ul style={{ margin: "0 0 26px", padding: "0 0 0 24px", display: "flex", flexDirection: "column", gap: 12, fontFamily: serif }}>
      {items.map((it, i) => <li key={i} style={{ fontSize: 18, lineHeight: 1.65, color: N.fg, textWrap: "pretty" }}>{it}</li>)}
    </ul>
  );
}
function ProseOL({ items }) {
  return (
    <ol style={{ margin: "0 0 26px", padding: "0 0 0 24px", display: "flex", flexDirection: "column", gap: 12, fontFamily: serif }}>
      {items.map((it, i) => <li key={i} style={{ fontSize: 18, lineHeight: 1.65, color: N.fg, textWrap: "pretty" }}>{it}</li>)}
    </ol>
  );
}
function InlineCode({ children }) {
  return <code style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: "0.82em", color: N.gold, background: N.goldSoft, borderRadius: 5, padding: "2px 6px" }}>{children}</code>;
}
function ProseQuote({ text, cite }) {
  return (
    <blockquote style={{ margin: "0 0 26px", padding: "20px 24px", background: N.bg2, borderLeft: `3px solid ${N.gold}`, borderRadius: "0 10px 10px 0" }}>
      <p style={{ margin: 0, fontSize: 18.5, lineHeight: 1.65, color: N.muted, fontFamily: serif, fontStyle: "italic" }}>“{text}”</p>
      {cite && <div style={{ marginTop: 12, fontSize: 12.5, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: N.faint, fontFamily: N.ui }}>{cite}</div>}
    </blockquote>
  );
}
function ProseHR() {
  return <hr style={{ border: "none", borderTop: `1px solid ${N.borderSoft}`, margin: "36px 0" }} />;
}
function ProseTable({ head, rows }) {
  return (
    <div style={{ margin: "0 0 24px", ...card, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14.5 }}>
        <thead>
          <tr style={{ background: N.bg2 }}>
            {head.map((h) => <th key={h} style={{ textAlign: "left", padding: "11px 16px", fontSize: 11.5, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: N.faint, borderBottom: `1px solid ${N.border}` }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => <td key={j} style={{ padding: "12px 16px", color: j === 0 ? N.fg : N.muted, fontWeight: j === 0 ? 700 : 400, borderTop: `1px solid ${N.borderSoft}`, fontFamily: j === 0 ? "ui-monospace, Menlo, monospace" : N.ui }}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Bordered diagram frame — chrome only; a Mermaid diagram would render inside.
function DiagramFrame({ caption }) {
  return (
    <div style={{ margin: "0 0 24px", ...card, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: N.faint }}>Diagram</span>
        <Icon name="grid" size={15} color={N.faint} />
      </div>
      <div style={{
        height: 180, borderRadius: 10, border: `1px dashed ${N.border}`,
        background: `repeating-linear-gradient(135deg, ${N.bg2} 0px, ${N.bg2} 10px, transparent 10px, transparent 20px)`,
        display: "grid", placeItems: "center", textAlign: "center", padding: 16,
      }}>
        <span style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12.5, color: N.faint }}>[ mermaid diagram — {caption} ]</span>
      </div>
    </div>
  );
}

// Simple regex-based highlighter — keywords/strings/comments only, coloured
// from theme tokens (no hardcoded syntax-theme hex).
function tokenizeCode(code) {
  const re = /(\/\/[^\n]*|#[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b(?:import|export|from|const|let|var|function|return|if|else|interface|type|extends|implements|class|new|async|await|throw|try|catch|public|private|readonly|default|as|typeof|instanceof|for|while|of|in|true|false|null|undefined|module|exports)\b)/g;
  let last = 0, out = [], m;
  while ((m = re.exec(code))) {
    if (m.index > last) out.push({ k: "plain", s: code.slice(last, m.index) });
    if (m[1]) out.push({ k: "com", s: m[1] });
    else if (m[2]) out.push({ k: "str", s: m[2] });
    else if (m[3]) out.push({ k: "kw", s: m[3] });
    last = re.lastIndex;
  }
  if (last < code.length) out.push({ k: "plain", s: code.slice(last) });
  return out;
}
function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useStateBlog(false);
  const tokens = tokenizeCode(code);
  const colors = { plain: N.fg, com: N.faint, str: N.goldHi, kw: N.gold };
  const copy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div style={{ margin: "0 0 24px", borderRadius: 12, overflow: "hidden", border: `1px solid ${N.border}`, background: N.bg2 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", borderBottom: `1px solid ${N.borderSoft}` }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: N.faint, fontFamily: "ui-monospace, Menlo, monospace", textTransform: "uppercase", letterSpacing: 0.6 }}>{lang}</span>
        <button onClick={copy} className="ul-press ul-link" style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: copied ? N.gold : N.faint, fontSize: 12, fontWeight: 600, fontFamily: N.ui }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M5 16a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2" /></svg>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre style={{ margin: 0, padding: "16px 18px", overflowX: "auto" }}>
        <code style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13.5, lineHeight: 1.7, whiteSpace: "pre" }}>
          {tokens.map((t, i) => <span key={i} style={{ color: colors[t.k], fontStyle: t.k === "com" ? "italic" : "normal" }}>{t.s}</span>)}
        </code>
      </pre>
    </div>
  );
}

// ── Table of contents — sticky rail, active section tracked by scroll ────────
function ArticleTOC({ headings }) {
  const [active, setActiveTOC] = useStateBlog(headings[0]?.id);
  React.useEffect(() => {
    const onScroll = () => {
      const probe = 120;
      let current = headings[0]?.id;
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (el && el.getBoundingClientRect().top - probe <= 0) current = h.id;
      }
      setActiveTOC(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [headings]);

  const jump = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.pageYOffset - 84;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <nav aria-label="Table of contents" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: N.faint, marginBottom: 10 }}>On this page</div>
      {headings.map((h) => (
        <button key={h.id} onClick={() => jump(h.id)} className="ul-press ul-link"
          style={{
            textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: N.ui,
            padding: "6px 0 6px 12px", borderLeft: `2px solid ${active === h.id ? N.gold : N.borderSoft}`,
            fontSize: 13, lineHeight: 1.4, fontWeight: active === h.id ? 700 : 500,
            color: active === h.id ? N.fg : N.faint,
          }}>
          {h.text}
        </button>
      ))}
    </nav>
  );
}

// ── End-of-article components ─────────────────────────────────────────────────
function ContributeCallout() {
  return (
    <div style={{ margin: "40px 0", borderRadius: 16, padding: 28, background: N.goldSoft, border: `1px solid ${N.gold}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <Khatam size={20} color={N.gold} sw={1.8} />
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: N.fg }}>Contribute to Ummah Library</h3>
      </div>
      <p style={{ margin: "0 0 18px", fontSize: 15, lineHeight: 1.65, color: N.muted, maxWidth: 560 }}>
        Ummah Library is open source. If this post left you with an opinion about the boundary, or you're looking for a good first issue, we'd welcome the pull request.
      </p>
      <Btn variant="gold" icon="arrowR" onClick={() => window.open("https://github.com/ummah-library/ummah-library/blob/main/CONTRIBUTING.md", "_blank")}>
        Read CONTRIBUTING.md
      </Btn>
    </div>
  );
}

// prev/next are each either an article or null — a missing neighbor renders
// no control at all (no dead link, no placeholder). If neither exists, only
// the "back to all posts" link shows.
function SeriesNav({ prev, next, onOpen, onIndex }) {
  return (
    <div style={{ margin: "8px 0 40px", display: "flex", flexDirection: "column", gap: 14 }}>
      {(prev || next) && (
        <div style={{ display: "flex", gap: 14 }}>
          {prev && (
            <button onClick={() => onOpen(prev.slug)} className="ul-press ul-link" style={{ ...card, flex: 1, textAlign: "left", padding: 16, background: N.card, border: `1px solid ${N.border}`, cursor: "pointer", display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: N.faint, textTransform: "uppercase", letterSpacing: 0.6 }}><Icon name="arrowL" size={13} color={N.faint} />Previous in series</span>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: N.fg }}>{prev.title}</span>
            </button>
          )}
          {next && (
            <button onClick={() => onOpen(next.slug)} className="ul-press ul-link" style={{ ...card, flex: 1, textAlign: "right", padding: 16, background: N.card, border: `1px solid ${N.border}`, cursor: "pointer", display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: N.faint, textTransform: "uppercase", letterSpacing: 0.6 }}>Next in series<Icon name="arrowR" size={13} color={N.faint} /></span>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: N.fg }}>{next.title}</span>
            </button>
          )}
        </div>
      )}
      <button onClick={onIndex} className="ul-press ul-link" style={{ alignSelf: "center", background: "none", border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: N.gold, fontFamily: N.ui }}>
        ← Back to all posts
      </button>
    </div>
  );
}

function BlogFooter() {
  return (
    <footer style={{ borderTop: `1px solid ${N.borderSoft}`, marginTop: 20 }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: N.faint }}>© {new Date().getFullYear()} Ummah Library · Open source</span>
        <div style={{ display: "flex", gap: 18 }}>
          <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 13, color: N.muted, textDecoration: "none" }}>GitHub</a>
          <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 13, color: N.muted, textDecoration: "none" }}>Open the app</a>
        </div>
      </div>
    </footer>
  );
}

// Thin reading-progress bar under the sticky header, filling as the reader
// scrolls the article — the same lightweight affordance Medium/Substack use.
function ScrollProgress() {
  const [pct, setPct] = useStateBlog(0);
  React.useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setPct(max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);
  return (
    <div style={{ position: "sticky", top: 64, zIndex: 19, height: 3, background: N.borderSoft }}>
      <div style={{ height: "100%", width: pct + "%", background: N.goldGrad, transition: "width 80ms linear" }} />
    </div>
  );
}

Object.assign(window, {
  BlogHeader, RssIcon, SeriesBadge, PublishDate, PostMeta, readMinutes, TagPill, ArticleCard, FilterBar, LoadMoreButton,
  ArTerm, proseText, proseWidth, serif,
  ProseP, ProseH2, ProseH3, ProseUL, ProseOL, InlineCode, ProseQuote, ProseHR,
  ProseTable, DiagramFrame, CodeBlock, ContributeCallout, SeriesNav, BlogFooter, ScrollProgress, ArticleTOC,
});

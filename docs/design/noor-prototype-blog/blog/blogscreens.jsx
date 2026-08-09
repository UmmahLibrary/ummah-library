/* Ummah Library — blog view composition: index (grid + filters + load-more)
   and article page, wired to a tiny hash router, the shared Noor theme
   toggle (Obsidian ⇄ Ivory), and a Tweaks-only "simulated publish state" so
   the growth states (2, 5, 20+ posts) can be previewed without waiting for
   real publish dates. The real product only ever shows posts with a `date`. */

const { useState: useStateScreens, useEffect: useEffectScreens } = React;

const PAGE_SIZE_DEFAULT = 8;

// Diagrams/tables/code are visually denser than prose, so they're allowed to
// "break out" of the 680px reading column to the wider measure (matches the
// editorial-site pattern of a narrow text column + wide media/data blocks).
const BREAKOUT_TYPES = new Set(["diagram", "table", "code"]);

function slugifyHeading(text, i) {
  return "h-" + i + "-" + String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
}

function ArticleBody({ blocks }) {
  return (
    <>
      {blocks.map((b, i) => {
        const wide = BREAKOUT_TYPES.has(b.type);
        let node = null;
        if (b.type === "p") node = <ProseP key={i}>{proseText(b.text)}</ProseP>;
        else if (b.type === "h2") node = <ProseH2 key={i} id={slugifyHeading(b.text, i)}>{b.text}</ProseH2>;
        else if (b.type === "h3") node = <ProseH3 key={i}>{b.text}</ProseH3>;
        else if (b.type === "ul") node = <ProseUL key={i} items={b.items} />;
        else if (b.type === "ol") node = <ProseOL key={i} items={b.items} />;
        else if (b.type === "quote") node = <ProseQuote key={i} text={b.text} cite={b.cite} />;
        else if (b.type === "hr") node = <ProseHR key={i} />;
        else if (b.type === "table") node = <ProseTable key={i} head={b.head} rows={b.rows} />;
        else if (b.type === "diagram") node = <DiagramFrame key={i} caption={b.caption} />;
        else if (b.type === "code") node = <CodeBlock key={i} lang={b.lang} code={b.code} />;
        if (!node) return null;
        return wide ? <React.Fragment key={"w" + i}>{node}</React.Fragment> : <div key={i} className="ul-textcol">{node}</div>;
      })}
    </>
  );
}

// TOC entries come straight from the article's own h2 blocks — no separate
// outline to keep in sync.
function articleHeadings(blocks) {
  return blocks.map((b, i) => (b.type === "h2" ? { id: slugifyHeading(b.text, i), text: b.text } : null)).filter(Boolean);
}

// A demo-only synthetic date for articles the Tweaks panel "simulates" as
// published (real unpublished posts have date: null and never appear here).
function demoDate(order) {
  const base = new Date("2026-07-13T00:00:00");
  base.setDate(base.getDate() + (order - 1) * 6);
  return base.toISOString().slice(0, 10);
}

// ── Index ──────────────────────────────────────────────────────────────────────
function BlogIndex({ onOpen, published, pageSize }) {
  const [activeSeries, setActiveSeries] = useStateScreens(null);
  const [activeTag, setActiveTag] = useStateScreens(null);
  const [shown, setShown] = useStateScreens(pageSize);

  const sorted = [...published].sort((a, b) => (a.date < b.date ? 1 : -1));
  const seriesList = [...new Set(sorted.map((a) => a.series).filter(Boolean))];
  const filtered = sorted.filter((a) => (!activeSeries || a.series === activeSeries) && (!activeTag || a.tags.includes(activeTag)));
  const tagList = [...new Set(filtered.length ? filtered.flatMap((a) => a.tags) : sorted.flatMap((a) => a.tags))].sort();
  const visible = filtered.slice(0, shown);
  const showFilters = sorted.length > 1 && (seriesList.length > 1 || tagList.length > 3);

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "56px 28px 80px" }}>
      <div style={{ marginBottom: 40, maxWidth: 680 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: N.gold, marginBottom: 12 }}>Blog</div>
        <h1 style={{ margin: "0 0 14px", fontSize: 38, fontWeight: 800, letterSpacing: -0.9, lineHeight: 1.1, color: N.fg }}>Building Ummah Library</h1>
        <p style={{ margin: 0, fontSize: 16.5, lineHeight: 1.65, color: N.muted }}>
          Ideas, architecture write-ups, and lessons from building Ummah Library in the open.
        </p>
      </div>
      {showFilters && (
        <FilterBar series={seriesList} activeSeries={activeSeries} onSeries={(s) => { setActiveSeries(s); setShown(pageSize); }}
          tags={tagList} activeTag={activeTag} onTag={(t) => { setActiveTag(t); setShown(pageSize); }} />
      )}
      {visible.length === 0 ? (
        <p style={{ fontSize: 15, color: N.muted }}>No posts match those filters.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
          {visible.map((a) => <ArticleCard key={a.slug} article={a} onOpen={onOpen} />)}
        </div>
      )}
      {shown < filtered.length && <LoadMoreButton remaining={filtered.length - shown} pageSize={pageSize} onClick={() => setShown((s) => s + pageSize)} />}
    </div>
  );
}

// ── Article ─────────────────────────────────────────────────────────────────────
function ArticlePage({ slug, onOpen, onIndex, published }) {
  const article = published.find((a) => a.slug === slug) || published[0];
  const mins = readMinutes(article.body);
  // Prev/next are computed within the SAME series, ordered by publish date —
  // a side with no neighbor (or a post with no series at all) simply hides.
  const siblings = article.series
    ? published.filter((a) => a.series === article.series).sort((a, b) => (a.date < b.date ? -1 : 1))
    : [];
  const idx = siblings.findIndex((a) => a.slug === article.slug);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
  const headings = articleHeadings(article.body);

  return (
    <>
      <ScrollProgress />
      <div className="ul-article-shell">
        <aside className="ul-toc-rail">
          {headings.length > 1 && <div><ArticleTOC headings={headings} /></div>}
        </aside>
        <div className="ul-article-measure">
          <div className="ul-textcol">
            <button onClick={onIndex} className="ul-press ul-link" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: N.muted, fontFamily: N.ui, marginBottom: 22, padding: 0 }}>
              <Icon name="arrowL" size={15} color={N.muted} /> All posts
            </button>
            {article.series && <div style={{ marginBottom: 14 }}><SeriesBadge series={article.series} /></div>}
            <h1 style={{ margin: "0 0 16px", fontSize: 36, fontWeight: 800, letterSpacing: -0.7, lineHeight: 1.15, color: N.fg, fontFamily: N.ui }}>{article.title}</h1>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 22, fontSize: 13.5, color: N.faint }}>
              <span style={{ whiteSpace: "nowrap", fontWeight: 600, color: N.muted }}>Ummah Library</span>
              <span aria-hidden="true">·</span>
              <PostMeta date={article.date} mins={mins} style={{ fontSize: 13.5 }} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 40 }}>
              {article.tags.map((t) => <TagPill key={t}>{t}</TagPill>)}
            </div>
          </div>
          <ArticleBody blocks={article.body} />
          <div className="ul-textcol">
            <ContributeCallout />
            <SeriesNav prev={prev} next={next} onOpen={onOpen} onIndex={onIndex} />
          </div>
        </div>
        <div className="ul-toc-gutter" aria-hidden="true" />
      </div>
    </>
  );
}

// ── App shell + tiny hash router ────────────────────────────────────────────────
function parseHash() {
  const h = (typeof location !== "undefined" && location.hash) || "";
  const m = h.match(/^#\/blog\/(.+)$/);
  if (m) return { view: "article", slug: decodeURIComponent(m[1]) };
  return { view: "index" };
}

function BlogApp() {
  const [route, setRoute] = useStateScreens(parseHash());
  const [theme, setTheme] = useStateScreens((typeof localStorage !== "undefined" && localStorage.getItem("ul.appTheme")) || "obsidian");
  const [t, setTweak] = useTweaks({ publishedCount: 2, pageSize: PAGE_SIZE_DEFAULT, extraTestPosts: 0 });

  useEffectScreens(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Real rule: a post is published iff it has a date. The Tweaks slider only
  // controls how many of the 12 *demo* articles simulate having one, so the
  // low-count launch states are easy to preview.
  const published = ARTICLES
    .filter((a) => a.order <= t.publishedCount)
    .map((a) => ({ ...a, date: a.date || demoDate(a.order) }))
    .concat(generateTestArticles(t.extraTestPosts));

  const goIndex = () => { location.hash = "#/blog"; window.scrollTo(0, 0); };
  const goArticle = (slug) => { location.hash = "#/blog/" + slug; window.scrollTo(0, 0); };
  const toggleTheme = () => {
    const next = THEME_MODE[theme] === "dark" ? "ivory" : "obsidian";
    applyAppTheme(next);
    setTheme(next);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: N.bg }}>
      <BlogHeader page="blog" onNavigate={(v) => (v === "index" ? goIndex() : null)} theme={theme} onToggleTheme={toggleTheme} />
      <div style={{ flex: 1 }}>
        {route.view === "index"
          ? <BlogIndex onOpen={goArticle} published={published} pageSize={t.pageSize} />
          : <ArticlePage slug={route.slug} onOpen={goArticle} onIndex={goIndex} published={published} />}
      </div>
      <BlogFooter />
      <TweaksPanel>
        <TweakSection label="Demo publish state" />
        <TweakSlider label="Posts published" value={t.publishedCount} min={1} max={12} step={1}
          onChange={(v) => setTweak("publishedCount", v)} />
        <TweakSlider label="Extra test posts" value={t.extraTestPosts} min={0} max={60} step={2}
          onChange={(v) => setTweak("extraTestPosts", v)} />
        <TweakSlider label="Posts per page" value={t.pageSize} min={2} max={12} step={1}
          onChange={(v) => setTweak("pageSize", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<BlogApp />);

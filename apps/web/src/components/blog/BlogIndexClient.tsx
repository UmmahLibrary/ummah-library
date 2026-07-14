"use client";
import { useMemo, useState } from "react";
import { Btn, N } from "@ummahlibrary/ui";
import type { Article } from "../../lib/blog/articles";
import { getSeriesList, getTagList } from "../../lib/blog/selectors";
import { ArticleCard } from "./ArticleCard";

const PAGE_SIZE = 8;

interface Props {
  /** Published articles, newest first. */
  articles: Article[];
}

export function BlogIndexClient({ articles }: Props) {
  const [activeSeries, setActiveSeries] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE_SIZE);

  const seriesList = useMemo(() => getSeriesList(articles), [articles]);

  const filtered = useMemo(
    () =>
      articles.filter(
        (a) =>
          (!activeSeries || a.series === activeSeries) &&
          (!activeTag || a.tags.includes(activeTag)),
      ),
    [articles, activeSeries, activeTag],
  );

  const tagList = useMemo(
    () => getTagList(filtered.length ? filtered : articles),
    [filtered, articles],
  );

  const showFilters = articles.length > 1 && (seriesList.length > 1 || tagList.length > 3);
  const visible = filtered.slice(0, shown);

  if (articles.length === 0) {
    return <p style={{ fontSize: 15, color: N.muted }}>No posts yet — check back soon.</p>;
  }

  return (
    <>
      {showFilters && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 10,
            marginBottom: 28,
          }}
        >
          {seriesList.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <button
                onClick={() => {
                  setActiveSeries(null);
                  setShown(PAGE_SIZE);
                }}
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: !activeSeries ? N.ink : N.muted,
                  background: !activeSeries ? N.gold : N.card,
                  border: `1px solid ${!activeSeries ? N.gold : N.border}`,
                  borderRadius: 999,
                  padding: "6px 13px",
                  cursor: "pointer",
                  fontFamily: N.ui,
                }}
              >
                All
              </button>
              {seriesList.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setActiveSeries(s);
                    setShown(PAGE_SIZE);
                  }}
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: activeSeries === s ? N.ink : N.muted,
                    background: activeSeries === s ? N.gold : N.card,
                    border: `1px solid ${activeSeries === s ? N.gold : N.border}`,
                    borderRadius: 999,
                    padding: "6px 13px",
                    cursor: "pointer",
                    fontFamily: N.ui,
                    whiteSpace: "nowrap",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {tagList.length > 0 && (
            <select
              value={activeTag ?? ""}
              onChange={(e) => {
                setActiveTag(e.target.value || null);
                setShown(PAGE_SIZE);
              }}
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: N.fg,
                background: N.card,
                border: `1px solid ${N.border}`,
                borderRadius: 10,
                padding: "7px 12px",
                fontFamily: N.ui,
                cursor: "pointer",
                marginLeft: "auto",
              }}
            >
              <option value="">All tags</option>
              {tagList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {visible.length === 0 ? (
        <p style={{ fontSize: 15, color: N.muted }}>No posts match those filters.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 18,
          }}
        >
          {visible.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      )}

      {shown < filtered.length && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
          <Btn variant="ghost" onClick={() => setShown((s) => s + PAGE_SIZE)}>
            Load {Math.min(filtered.length - shown, PAGE_SIZE)} more
          </Btn>
        </div>
      )}
    </>
  );
}

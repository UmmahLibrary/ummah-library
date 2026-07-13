import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { N } from "@ummahlibrary/ui";
import {
  getArticleBySlug,
  getPublishedArticles,
  getSeriesNeighbors,
} from "../../../lib/blog/articles";
import { SITE_URL } from "../../../lib/site";
import { ArticleBody } from "../../../components/blog/ArticleBody";
import { ArticleTOC } from "../../../components/blog/ArticleTOC";
import { ContributeCallout } from "../../../components/blog/ContributeCallout";
import { PostMeta } from "../../../components/blog/PostMeta";
import { ScrollProgress } from "../../../components/blog/ScrollProgress";
import { SeriesBadge } from "../../../components/blog/SeriesBadge";
import { SeriesNav } from "../../../components/blog/SeriesNav";
import { TagPill } from "../../../components/blog/TagPill";

// Only published articles (a real `date` AND `status: "published"`) ever get
// a page here — everything else has no static param and no route at all, so
// a draft can never be reached by URL, guessed or otherwise (ADR 0037).
export const dynamicParams = false;

export function generateStaticParams() {
  return getPublishedArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: "Not found" };
  const url = `/blog/${article.slug}`;
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: url },
    openGraph: { title: article.title, description: article.description, url, type: "article" },
    twitter: { card: "summary", title: article.title, description: article.description },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const published = getPublishedArticles();
  const { prev, next } = getSeriesNeighbors(article, published);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    author: { "@type": "Organization", name: "Ummah Library" },
    url: `${SITE_URL}/blog/${article.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ScrollProgress />
      <div className="ul-blog-article-shell">
        <aside className="ul-blog-toc-rail">
          {article.headings.length > 1 && (
            <div>
              <ArticleTOC headings={article.headings} />
            </div>
          )}
        </aside>
        <div className="ul-blog-article-measure">
          <div className="ul-blog-textcol">
            {article.series && (
              <div style={{ marginBottom: 14 }}>
                <SeriesBadge series={article.series} />
              </div>
            )}
            <h1
              style={{
                margin: "0 0 16px",
                fontSize: 36,
                fontWeight: 800,
                letterSpacing: -0.7,
                lineHeight: 1.15,
                color: N.fg,
                fontFamily: N.ui,
              }}
            >
              {article.title}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 22,
                fontSize: 13.5,
                color: N.faint,
              }}
            >
              <span style={{ whiteSpace: "nowrap", fontWeight: 600, color: N.muted }}>
                Ummah Library
              </span>
              <span aria-hidden="true">·</span>
              <PostMeta
                date={article.date!}
                mins={article.readingMinutes}
                style={{ fontSize: 13.5 }}
              />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 40 }}>
              {article.tags.map((t) => (
                <TagPill key={t}>{t}</TagPill>
              ))}
            </div>
          </div>
          <ArticleBody blocks={article.blocks} />
          <div className="ul-blog-textcol">
            <ContributeCallout />
            <SeriesNav prev={prev} next={next} />
          </div>
        </div>
        <div className="ul-blog-toc-gutter" aria-hidden="true" />
      </div>
    </>
  );
}

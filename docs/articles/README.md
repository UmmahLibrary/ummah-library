# Blog articles

Each file here is one post on the engineering blog at `/blog`. Add a new
`.md` file to publish a new post — see ADR [0037](../adr/0037-engineering-blog.md)
for how the pipeline works.

## Frontmatter

```yaml
---
title: "Anatomy of an Open-Source Quran Platform"
description: "A one- or two-sentence summary shown on the index card and in link previews."
tags: ["architecture", "typescript", "monorepo"]
series: "The Ummah Library engineering series" # or: null for a standalone post
order: 1 # your intended reading order within a series; also a tiebreak
date: null # "YYYY-MM-DD", or null until it's ready to go live
canonical_url: "anatomy-of-a-quran-platform" # the URL slug: /blog/<canonical_url>
status: "draft" # "draft" | "published"
---
```

## Publishing an article

**An article is public only once it has both a real `date` _and_
`status: "published"`.** Until then it has no route at all — not draft-with-a-banner,
not reachable by a guessed URL, simply absent from the build. To publish:
write the article with `status: "draft"` and `date: null`, get it reviewed,
then in one commit set `date` to the real publish date and `status` to
`"published"`. That single commit is the entire "go live" action.

`canonical_url` must be unique across every file in this directory — the build
fails loudly if two articles collide.

## Writing the body

The body below the frontmatter is plain Markdown, parsed into the blog's block
set: paragraphs, `##`/`###` headings, bulleted/numbered lists, blockquotes,
`---` rules, GitHub-flavored tables, and fenced code blocks. A few extras:

- **Inline Arabic term with transliteration** — `:ar[قِبْلَة]{translit=qibla}`
  renders as the Arabic word followed by its transliteration in parentheses.
- **Mermaid diagram** — a fenced code block tagged `mermaid`, optionally with a
  caption in the fence's info string:

  ````
  ```mermaid caption="apps → adapters → domain"
  graph TD; Apps --> Adapters --> Domain;
  ```
  ````

- **Blockquote citation** — an attributed quote is a blockquote whose last
  paragraph starts with an em dash:

  ```markdown
  > The dependency rule is the overriding rule that makes this architecture work.
  >
  > — Internal ADR-0003
  ```

Headings deeper than `##`/`###` (a lone `#` or `####`+) are ignored — the
article title comes from `title` in the frontmatter, not from the body.

## Series

`series` is optional, per-post metadata — not a fixed list maintained
elsewhere. Leave it `null` for a standalone post. Posts sharing the same
`series` string get "Previous/Next in series" navigation on the article page,
ordered by `date`; a post with no neighbor on one side (the first or latest in
its series) simply shows no control on that side.

## Content policy

Everything here is original engineering writing about this codebase — not
Quranic or Hadith text or interpretation. If a post does quote or discuss
Islamic content, follow the usual `needs-scholar-review` convention
(see the root `AGENTS.md`).

# Noor Design System — Conventions

## Theme & background

All Noor components assume a **dark host**. Always place components on the Obsidian background (`#0a0b0f`). The default theme is **Obsidian**; other themes (midnight, emerald, ocean, ivory, sepia, mint, rose) swap via the `data-theme` attribute on the root element.

```tsx
<div style={{ background: "#0a0b0f", minHeight: "100vh" }}>
  {/* your design */}
</div>
```

## Token vocabulary

Tokens are CSS custom properties exposed via the `N` object (string values, use as inline-style values):

| Token | Value (Obsidian) | Use for |
|---|---|---|
| `N.bg` | `var(--noor-bg)` `#0a0b0f` | page / root background |
| `N.bg2` | `var(--noor-bg2)` `#0e1017` | subtle surface |
| `N.card` | `var(--noor-card)` `#14171f` | card background |
| `N.cardHi` | `var(--noor-card-hi)` `#191d27` | elevated card |
| `N.border` | `var(--noor-border)` `#242a38` | divider / border |
| `N.borderSoft` | `var(--noor-border-soft)` `#1b2029` | subtle border |
| `N.fg` | `var(--noor-fg)` `#f4f1ea` | primary text |
| `N.muted` | `var(--noor-muted)` `#9aa0b2` | secondary text |
| `N.faint` | `var(--noor-faint)` `#5c6273` | placeholder / disabled text |
| `N.gold` | `var(--noor-gold)` `#e6b855` | accent / primary action |
| `N.goldHi` | `var(--noor-gold-hi)` `#f4d58a` | gold highlight / hover |
| `N.goldDim` | `var(--noor-gold-dim)` `#a98432` | gold pressed / muted accent |
| `N.goldSoft` | `var(--noor-gold-soft)` `rgba(230,184,85,0.12)` | gold tinted surface |

## Components at a glance

### `Btn` — button

```tsx
<Btn variant="gold" size="md" icon="bookmark" disabled={false}>
  Save Ayah
</Btn>
```

- `variant`: `"gold"` (primary) | `"ghost"` (outline) | `"soft"` (tinted) | `"quiet"` (text-only)
- `size`: `"sm"` | `"md"` (default) | `"lg"`
- `icon`: any `IconName` — rendered inline before the label
- `disabled`: reduces opacity, blocks interaction

### `Seg` — segmented control / tab strip

```tsx
<Seg
  options={["arabic", "translation", "both"]}
  value={value}
  onChange={setValue}
  size="md"
/>
```

- `options`: string array **or** `{ value: string; label: string }[]`
- `value` / `onChange`: controlled
- `size`: `"sm"` | `"md"` (default)
- Active tab: gold; inactive: muted

### `Icon` — single SVG icon

```tsx
<Icon name="bookmark" size={22} color={N.gold} />
```

- `name`: `IconName` (see full list in `Icon.d.ts`)
- `size`: number (px, square)
- `color`: any CSS color string — default `currentColor`

Available icon families: navigation (home, search, book, tafsir, compass, headphones, star, bookmark, heart, globe), actions (share, download, plus, minus, check, close, settings, more, layers, repeat), directional (chevL, chevR, chevD, arrowL, arrowR, menu, grid, type), media/theme (play, pause, moon, sun).

### `Khatam` — 8-point star ornament

```tsx
<Khatam size={64} color={N.gold} sw={1} fill={N.goldSoft} opacity={1} />
```

- `size`: px (square)
- `color`: stroke color
- `sw`: stroke width (relative to size; ~1 is default weight)
- `fill`: inner fill color (default transparent)
- `opacity`: 0–1

Common uses: section dividers, decorative flourishes, loading states at low opacity.

### `Logo` — Ummah Library wordmark

```tsx
<Logo scale={1} />
```

- `scale`: multiplier on default size (default `1`)
- Always place on a dark background — the wordmark uses light/gold tones

## Idiomatic screen skeleton

```tsx
<div style={{ background: N.bg, minHeight: "100vh", fontFamily: N.ui, color: N.fg }}>
  <header style={{ background: N.card, borderBottom: `1px solid ${N.border}`, padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>
    <Logo scale={0.8} />
    <Seg options={["Quran", "Hadith", "Tafsir"]} value={tab} onChange={setTab} size="sm" />
    <Btn variant="ghost" icon="search" size="sm">Search</Btn>
  </header>
  <main style={{ padding: 24 }}>
    {/* content */}
  </main>
</div>
```

/* Ummah Library — CANONICAL brand mark (Direction: Noor).
   Single source of truth for the Khatam star + wordmark across app / mobile / web.
   Load AFTER the design kit (so window.N exists) and before the screen scripts.
   Exports Khatam + Logo to window.

   Defaults read the live theme token window.N at render time, so the mark recolours
   with the app's Dark/Light palettes. Pass an explicit `color` to override.

   Brand color: gold #E6B855 (hi #F4D58A · dim #A98432 for light backgrounds).
   The mark = two overlapped 56×56 squares (8-point khatam seal) + center dot. */

// 8-point khatam star. stroke-only by default; filledDot for favicon/tiny sizes.
function Khatam({ size = 120, color, sw = 1, opacity = 1, fill = "none", filledDot = false, style }) {
  const c = color || (window.N && window.N.gold) || "#E6B855";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block", opacity, ...style }} aria-hidden="true">
      <rect x="22" y="22" width="56" height="56" fill={fill} stroke={c} strokeWidth={sw} />
      <rect x="22" y="22" width="56" height="56" fill={fill} stroke={c} strokeWidth={sw} transform="rotate(45 50 50)" />
      <circle cx="50" cy="50" r="11" fill={filledDot ? c : fill} stroke={c} strokeWidth={sw} />
    </svg>
  );
}

// Horizontal lockup: mark + "Ummah Library" wordmark.
function Logo({ scale = 1, color, text, onClick, style }) {
  const c = color || (window.N && window.N.gold) || "#E6B855";
  const t = text || (window.N && window.N.fg) || "#F4F1EA";
  return (
    <div className={onClick ? "ul-link" : ""} onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 10 * scale, ...style }}>
      <Khatam size={26 * scale} color={c} sw={2.2} />
      <span style={{ fontWeight: 700, fontSize: 17 * scale, color: t, letterSpacing: 0.2 }}>
        Ummah<span style={{ color: c, fontWeight: 600 }}> Library</span>
      </span>
    </div>
  );
}

Object.assign(window, { Khatam, Logo });

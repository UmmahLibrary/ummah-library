import { N } from "@ummahlibrary/ui";

/** Renders nothing when the post has no series — a standalone post is a first-class case, not a fallback. */
export function SeriesBadge({
  series,
  size = "md",
}: {
  series: string | null;
  size?: "sm" | "md";
}) {
  if (!series) return null;
  const fontSize = size === "sm" ? 11.5 : 12.5;
  return (
    <span
      style={{
        display: "inline-block",
        whiteSpace: "nowrap",
        fontSize,
        fontWeight: 700,
        letterSpacing: 0.2,
        color: N.gold,
        background: N.goldSoft,
        border: `1px solid ${N.gold}`,
        borderRadius: 999,
        padding: size === "sm" ? "4px 10px" : "5px 12px",
      }}
    >
      {series}
    </span>
  );
}

import { Khatam, N } from "@ummahlibrary/ui";

/**
 * A gold khatam-star āyah marker with the number inside — the Noor reader's
 * number motif, used in the continuous Reading and Mushaf flows. Presentational
 * (no client hooks), so it renders in the server juzʾ reader too.
 */
export function AyahStar({ n, size = 32 }: { n: number; size?: number }) {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-grid",
        placeItems: "center",
        width: size,
        height: size,
        margin: "0 0.3rem",
        verticalAlign: "middle",
      }}
    >
      <Khatam size={size} color={N.goldDim} sw={1.4} />
      <span
        style={{
          position: "absolute",
          fontSize: Math.round(size * 0.32),
          fontWeight: 700,
          color: N.gold,
          fontFamily: N.ui,
        }}
      >
        {n}
      </span>
    </span>
  );
}

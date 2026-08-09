import type { ReactNode } from "react";
import { N } from "@ummahlibrary/ui";

export function TagPill({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: N.muted,
        background: N.card,
        border: `1px solid ${N.border}`,
        borderRadius: 999,
        padding: "5px 11px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

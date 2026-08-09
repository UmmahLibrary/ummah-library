"use client";
import { useEffect, useId, useState } from "react";
import { Icon, N } from "@ummahlibrary/ui";

/**
 * Renders a Mermaid diagram inside the bordered "Diagram" chrome from the
 * Noor blog design. Mermaid is browser-only, so rendering happens client-side
 * in an effect; the dashed placeholder covers the loading state and the rare
 * render failure (a malformed diagram never breaks the surrounding page).
 */
export function DiagramFrame({ code, caption }: { code: string; caption?: string }) {
  const rawId = useId();
  const diagramId = `mermaid-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const mode = document.documentElement.dataset.mode === "light" ? "default" : "dark";
    import("mermaid")
      .then(async ({ default: mermaid }) => {
        mermaid.initialize({ startOnLoad: false, theme: mode, securityLevel: "strict" });
        const { svg: rendered } = await mermaid.render(diagramId, code);
        if (!cancelled) setSvg(rendered);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [code, diagramId]);

  return (
    <div
      style={{
        margin: "0 0 24px",
        background: N.card,
        border: `1px solid ${N.border}`,
        borderRadius: 16,
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: N.faint,
          }}
        >
          Diagram
        </span>
        <Icon name="grid" size={15} color={N.faint} />
      </div>
      {svg ? (
        <div
          role="img"
          aria-label={caption ?? "Diagram"}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div
          style={{
            height: 180,
            borderRadius: 10,
            border: `1px dashed ${N.border}`,
            background: `repeating-linear-gradient(135deg, ${N.bg2} 0px, ${N.bg2} 10px, transparent 10px, transparent 20px)`,
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            padding: 16,
          }}
        >
          <span
            style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12.5, color: N.faint }}
          >
            {failed
              ? `[ diagram unavailable — ${caption ?? "see source"} ]`
              : `[ rendering diagram${caption ? ` — ${caption}` : ""} ]`}
          </span>
        </div>
      )}
    </div>
  );
}

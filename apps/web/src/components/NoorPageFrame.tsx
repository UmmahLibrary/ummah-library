"use client";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { N, Icon } from "@ummahlibrary/ui";

interface Props {
  title: string;
  sub?: string;
  glyph?: string;
  back?: string;
  actions?: ReactNode;
  maxW?: number;
  children: ReactNode;
}

export function NoorPageFrame({ title, sub, glyph, back, actions, maxW = 920, children }: Props) {
  const router = useRouter();
  const handleBack = () => (back ? router.push(back) : router.back());

  return (
    <div
      className="noor-scroll"
      style={{ height: "100%", overflowY: "auto", overflowX: "hidden", position: "relative" }}
    >
      <div
        className="noor-rise"
        style={{
          maxWidth: maxW,
          margin: "0 auto",
          padding: "clamp(18px,3.5vw,30px) clamp(16px,4vw,36px) 48px",
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 22,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
            <button
              onClick={handleBack}
              style={{
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: 11,
                border: `1px solid ${N.border}`,
                background: N.card,
                color: N.muted,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <Icon name="arrowL" size={18} />
            </button>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {glyph && <span style={{ fontSize: 22 }}>{glyph}</span>}
                <h2
                  style={{
                    fontSize: "clamp(21px,3.4vw,26px)",
                    fontWeight: 800,
                    letterSpacing: -0.5,
                    margin: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontFamily: N.ui,
                    color: N.fg,
                  }}
                >
                  {title}
                </h2>
              </div>
              {sub && (
                <div style={{ fontSize: 13.5, color: N.muted, marginTop: 2, fontFamily: N.ui }}>
                  {sub}
                </div>
              )}
            </div>
          </div>
          {actions && <div style={{ flexShrink: 0 }}>{actions}</div>}
        </div>

        {children}
      </div>
    </div>
  );
}

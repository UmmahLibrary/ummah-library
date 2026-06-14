"use client";
import { N } from "./tokens";

type SegOption = string | { value: string; label: string };

interface SegProps {
  options: SegOption[];
  value: string;
  onChange: (value: string) => void;
  size?: "sm" | "md";
}

export function Seg({ options, value, onChange, size = "md" }: SegProps) {
  const pad = size === "sm" ? "6px 12px" : "8px 15px";
  const fs = size === "sm" ? 13 : 14;
  return (
    <div
      style={{
        display: "flex",
        borderRadius: 10,
        border: `1px solid ${N.border}`,
        overflow: "hidden",
        background: N.card,
      }}
    >
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const label = typeof o === "string" ? o : o.label;
        const active = v === value;
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            style={{
              padding: pad,
              fontSize: fs,
              fontFamily: N.ui,
              fontWeight: active ? 700 : 500,
              color: active ? N.ink : N.muted,
              background: active ? N.gold : "transparent",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "background .15s, color .15s",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

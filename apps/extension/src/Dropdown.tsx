import { useEffect, useRef, useState } from "react";
import { N } from "@ummahlibrary/ui";

export interface DropdownOption {
  value: string;
  label: string;
}

/**
 * A small custom dropdown. Native `<select>` popups are unreliable inside
 * browser-extension action popups (the OS menu can fail to open or steals focus
 * and closes the popup), so we render our own button + listbox instead.
 */
export function Dropdown({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: readonly DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onDocPointer(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          maxWidth: 160,
          background: N.bg2,
          color: N.muted,
          border: `1px solid ${N.border}`,
          borderRadius: 8,
          fontSize: 11,
          padding: "3px 8px",
          cursor: "pointer",
          fontFamily: N.ui,
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {current?.label ?? ariaLabel}
        </span>
        <span aria-hidden style={{ color: N.faint, fontSize: 9 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 4px)",
            zIndex: 20,
            listStyle: "none",
            margin: 0,
            padding: 4,
            minWidth: 160,
            maxHeight: 220,
            overflowY: "auto",
            background: N.card,
            border: `1px solid ${N.border}`,
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          }}
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={{
                  padding: "6px 8px",
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: "pointer",
                  color: selected ? N.gold : N.fg,
                  fontWeight: selected ? 700 : 400,
                  fontFamily: N.ui,
                }}
              >
                {option.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

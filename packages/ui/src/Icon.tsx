import type { CSSProperties } from "react";

const PATHS: Record<string, string> = {
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20 20l-3.6-3.6",
  heart:
    "M12 20s-7-4.3-9.2-8.4C1.2 8.3 2.6 5 6 5c2 0 3.2 1.3 4 2.5C10.8 6.3 12 5 14 5c3.4 0 4.8 3.3 3.2 6.6C19 15.7 12 20 12 20Z",
  bookmark: "M6 4h12v16l-6-4-6 4V4Z",
  share: "M16 6l-4-3-4 3M12 3v12M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7",
  settings:
    "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM19.4 13.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 6.8 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 6.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z",
  chevL: "M15 5l-7 7 7 7",
  chevR: "M9 5l7 7-7 7",
  chevD: "M5 9l7 7 7-7",
  arrowR: "M5 12h14M13 6l6 6-6 6",
  arrowL: "M19 12H5M11 6l-6 6 6 6",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
  moon: "M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1",
  book: "M4 5a2 2 0 0 1 2-2h6v16H6a2 2 0 0 0-2 2V5ZM20 5a2 2 0 0 0-2-2h-6v16h6a2 2 0 0 1 2 2V5Z",
  headphones:
    "M4 14v-2a8 8 0 0 1 16 0v2M4 14a2 2 0 0 1 2-2h0a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h0a2 2 0 0 1-2-2v-2ZM20 14a2 2 0 0 0-2-2h0a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h0a2 2 0 0 0 2-2v-2Z",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  check: "M5 12l4.5 4.5L19 7",
  compass: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM15.5 8.5l-2 5-5 2 2-5 5-2Z",
  layers: "M12 3l9 5-9 5-9-5 9-5ZM3 13l9 5 9-5",
  repeat: "M4 9V7a2 2 0 0 1 2-2h12l-3-3M20 15v2a2 2 0 0 1-2 2H6l3 3",
  download: "M12 3v12M8 11l4 4 4-4M5 21h14",
  home: "M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8Z",
  star: "M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9L12 3Z",
  tafsir: "M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3V4ZM9 8h7M9 12h7",
  globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20",
  type: "M5 7V5h14v2M9 19h6M12 5v14",
};

export type IconName = keyof typeof PATHS | "play" | "pause";

interface IconProps {
  name: IconName;
  size?: number;
  sw?: number;
  color?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 20, sw = 1.7, color = "currentColor", style }: IconProps) {
  // `color` is set in CSS so a `var(--…)` color resolves; shapes use currentColor.
  const base: CSSProperties = { width: size, height: size, display: "block", color, ...style };

  if (name === "play") {
    return (
      <svg viewBox="0 0 24 24" style={base} aria-hidden="true">
        <path d="M7 4.5v15l13-7.5-13-7.5Z" fill="currentColor" />
      </svg>
    );
  }
  if (name === "pause") {
    return (
      <svg viewBox="0 0 24 24" style={base} aria-hidden="true">
        <rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" />
        <rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" />
      </svg>
    );
  }

  const d = PATHS[name] ?? "";
  return (
    <svg
      viewBox="0 0 24 24"
      style={base}
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

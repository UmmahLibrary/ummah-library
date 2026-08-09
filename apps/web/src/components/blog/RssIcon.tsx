/** A small RSS glyph — not in the app's shared Icon set (the app has no other feed). */
export function RssIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="5.5" cy="18.5" r="1.8" fill={color} stroke="none" />
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4.5A15.5 15.5 0 0 1 19.5 20" />
    </svg>
  );
}

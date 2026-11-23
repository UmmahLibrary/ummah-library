/**
 * Scroll behaviour for programmatic scrolling. A JS `behavior: "smooth"` wins
 * over CSS `scroll-behavior`, so the Reduce motion comfort setting (and the
 * device's reduced-motion preference) must be honoured here explicitly.
 */
export function scrollBehavior(): ScrollBehavior {
  if (typeof document === "undefined") return "auto";
  if (document.documentElement.classList.contains("comfort-reduce-motion")) return "auto";
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "auto";
  } catch {
    /* matchMedia unavailable */
  }
  return "smooth";
}

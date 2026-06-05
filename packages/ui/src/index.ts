/**
 * @ummahlibrary/ui
 *
 * Shared, framework-light UI primitives and tokens reused across web (Next.js)
 * and mobile (Expo). Kept React-free in Phase 0 so the web (React 19) and
 * mobile (React 18) apps can share it without a version clash; React components
 * arrive once the reader UI is designed (Phase 2).
 */

/** Join truthy class name fragments into a single string. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

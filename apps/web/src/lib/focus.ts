const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Where keyboard focus should go once `item` (holding the focused control) is
 * removed: the first focusable element after it, else the last one before it.
 * Read it *before* removing the item, focus it after — otherwise focus falls to
 * `<body>` and a keyboard user starts again from the top (WCAG 2.4.3).
 */
export function focusTargetAfterRemoving(item: Element | null): HTMLElement | null {
  if (!item) return null;
  const all = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !item.contains(el),
  );
  const after = all.find(
    (el) => item.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
  if (after) return after;
  const before = all.filter(
    (el) => item.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING,
  );
  return before[before.length - 1] ?? null;
}

/** Focus `el` on the next frame, once React has removed the old item. */
export function focusSoon(el: HTMLElement | null): void {
  if (!el) return;
  requestAnimationFrame(() => {
    if (el.isConnected) el.focus();
  });
}

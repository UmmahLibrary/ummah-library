import type { KeyboardEvent } from "react";

/**
 * Keyboard behaviour for a `role="radiogroup"` of `role="radio"` buttons — the
 * ARIA radio pattern the role promises: one Tab stop (the checked option, see
 * {@link radioTabIndex}), and the arrow keys move to and select the
 * previous/next option, wrapping at the ends. Home/End jump to the first/last.
 * Selecting is a click on the target, so each group keeps its own onClick.
 */
export function onRadioGroupKeyDown(e: KeyboardEvent<HTMLElement>): void {
  const radios = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]'));
  const at = radios.indexOf(document.activeElement as HTMLElement);
  if (at < 0 || radios.length === 0) return;
  const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
  let next: number;
  switch (e.key) {
    case "ArrowDown":
      next = at + 1;
      break;
    case "ArrowUp":
      next = at - 1;
      break;
    case "ArrowRight":
      next = rtl ? at - 1 : at + 1;
      break;
    case "ArrowLeft":
      next = rtl ? at + 1 : at - 1;
      break;
    case "Home":
      next = 0;
      break;
    case "End":
      next = radios.length - 1;
      break;
    default:
      return;
  }
  e.preventDefault();
  const target = radios[(next + radios.length) % radios.length]!;
  target.focus();
  target.click();
}

/** Roving tab stop: the checked option is tabbable; if none is, the first. */
export function radioTabIndex(checked: boolean, index: number, anyChecked: boolean): 0 | -1 {
  return checked || (!anyChecked && index === 0) ? 0 : -1;
}

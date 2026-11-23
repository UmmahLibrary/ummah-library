/**
 * Web side of the Noor scale tokens (ADR 0042): the CSS custom properties
 * generated from `scale.ts`, and small helpers that return `var(--…)`
 * references for inline styles. Mobile uses `scale.ts` numbers directly.
 *
 * Font sizes and line heights are emitted in rem (16 px = 1 rem) so the
 * reader's browser text size and the large-screen scaling rule apply to
 * them; spacing and radius stay in px so layouts don't balloon.
 */
import type { CSSProperties } from "react";
import {
  elevation,
  iconSize,
  motion,
  quranType,
  radius,
  space,
  target,
  type,
  type ElevationLevel,
  type RadiusStep,
  type SpaceStep,
  type TypeRole,
} from "./scale";

const rem = (px: number) => `${+(px / 16).toFixed(5)}rem`;
/** CSS names are kebab-case: bodySm → body-sm. */
const kebab = (k: string) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
/** CSS-safe name for a space step: 0.5 → "0-5". */
const stepName = (k: string | number) => String(k).replace(".", "-");

/** `var(--noor-space-n)` for inline styles. */
export function sp(step: SpaceStep): string {
  return `var(--noor-space-${stepName(step)})`;
}

/** `var(--noor-radius-k)` for inline styles. */
export function rad(step: RadiusStep): string {
  return `var(--noor-radius-${step})`;
}

/** `var(--noor-shadow-k)` for inline styles. */
export function shadow(level: ElevationLevel): string {
  return `var(--noor-shadow-${level})`;
}

/** Font size, line height, weight (and tracking/case) of a type role. */
export function text(role: TypeRole): CSSProperties {
  const t = type[role] as (typeof type)[TypeRole] & { tracking?: number; upper?: boolean };
  return {
    fontSize: `var(--noor-text-${kebab(role)})`,
    lineHeight: `var(--noor-leading-${kebab(role)})`,
    fontWeight: t.weight,
    ...(t.tracking !== undefined && { letterSpacing: t.tracking }),
    ...(t.upper && { textTransform: "uppercase" }),
  };
}

/** The scale custom-property lines, in a stable order. */
export function scaleLines(): string[] {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(space).sort((a, b) => a[1] - b[1]))
    lines.push(`--noor-space-${stepName(k)}: ${v}px;`);
  for (const [k, v] of Object.entries(radius)) lines.push(`--noor-radius-${k}: ${v}px;`);
  for (const [k, v] of Object.entries(type)) {
    lines.push(`--noor-text-${kebab(k)}: ${rem(v.size)};`);
    lines.push(`--noor-leading-${kebab(k)}: ${rem(v.lineHeight)};`);
  }
  for (const [k, v] of Object.entries(quranType)) {
    lines.push(`--noor-quran-${k}: ${rem(v.size)};`);
    lines.push(`--noor-quran-leading-${k}: ${rem(v.lineHeight)};`);
  }
  for (const [k, v] of Object.entries(iconSize)) lines.push(`--noor-icon-${k}: ${v}px;`);
  for (const [k, v] of Object.entries(target)) lines.push(`--noor-target-${k}: ${v}px;`);
  for (const [k, v] of Object.entries(elevation)) {
    lines.push(
      `--noor-shadow-${k}: ${v.opacity === 0 ? "none" : `0 ${v.y}px ${v.blur}px rgba(0,0,0,${v.opacity})`};`,
    );
  }
  lines.push(`--noor-dur-fast: ${motion.fast}ms;`);
  lines.push(`--noor-dur-base: ${motion.base}ms;`);
  lines.push(`--noor-dur-slow: ${motion.slow}ms;`);
  lines.push(`--noor-ease: cubic-bezier(${motion.easing.join(",")});`);
  return lines.map((l) => `  ${l}`);
}

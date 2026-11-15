/**
 * Display-time translation for the English data the memorize area gets from
 * core (plan templates, a day's portion, validation messages, badges). Core
 * stays English and untouched; we map stable ids to `mem.*` keys and fall back
 * to the core text for anything unmapped (ADR 0040).
 */
import type { DayPortion, PlanTemplate } from "@ummahlibrary/core";
import { en as memEn } from "./ns/memorize";
import type { MessageKey } from "./messages";
import type { useIntl } from "./I18nProvider";

type Intl = ReturnType<typeof useIntl>;
type Unit = DayPortion["unit"];

function has(key: string): key is MessageKey {
  return Object.prototype.hasOwnProperty.call(memEn, key);
}

/** `t(key)` when the key exists, otherwise `fallback`. */
function lookup(intl: Intl, key: string, fallback: string): string {
  return has(key) ? intl.t(key) : fallback;
}

/** Every Latin digit in `s` rendered in the language's own digits (keeps padding). */
export function digits(intl: Intl, s: string): string {
  return s.replace(/[0-9]/g, (d) => intl.num(Number(d)));
}

export function planName(intl: Intl, tpl: PlanTemplate): string {
  if (tpl.id === "custom") return intl.t("mem.plan.custom.name");
  return lookup(intl, `mem.plan.${tpl.id}.name`, tpl.name);
}

export function planDesc(intl: Intl, tpl: PlanTemplate): string {
  return lookup(intl, `mem.plan.${tpl.id}.desc`, tpl.desc);
}

/** Tag ("30 days"); a custom plan's stored English "N days" is re-rendered. */
export function planTag(intl: Intl, tpl: PlanTemplate): string {
  const days = /^(\d+) days$/.exec(tpl.tag);
  if (tpl.id === "custom" && days) return intl.tf("mem.plan.daysTag", { n: Number(days[1]) });
  return lookup(intl, `mem.plan.${tpl.id}.tag`, tpl.tag);
}

/** Cadence ("Juzʾ a day"); a custom plan's stored "N pages a day" is re-rendered. */
export function planLen(intl: Intl, tpl: PlanTemplate): string {
  const pace = /^(≈ )?(\d+) pages a day$/.exec(tpl.len);
  if (tpl.id === "custom" && pace) {
    return intl.tf(pace[1] ? "mem.plan.approxPerDayLen" : "mem.plan.perDayLen", {
      n: Number(pace[2]),
    });
  }
  return lookup(intl, `mem.plan.${tpl.id}.len`, tpl.len);
}

/** "juzʾ" / "pages" … for a count of plan units. */
export function unitWord(intl: Intl, unit: Unit, count: number): string {
  return lookup(intl, `mem.unit.${unit}.${count === 1 ? "one" : "other"}`, unit);
}

/**
 * A day's portion label ("Juzʾ 5", "Pages 21–22"). A listed, non-contiguous
 * slice can't be rebuilt from the portion, so it keeps core's English label.
 */
export function portionLabel(intl: Intl, p: DayPortion): string {
  if (p.empty) return intl.t("mem.portion.none");
  if (p.unit === "ayah") {
    if (p.count !== 1) return p.label;
    return intl.tf("mem.portion.ayah.single", {
      ref: digits(intl, `${p.startRef.sura}:${p.startRef.aya}`),
    });
  }
  if (p.count === 1) {
    return lookup(intl, `mem.portion.${p.unit}.single`, p.label).replace(
      "{n}",
      intl.num(p.fromUnit),
    );
  }
  if (p.count === p.toUnit - p.fromUnit + 1) {
    return lookup(intl, `mem.portion.${p.unit}.range`, p.label)
      .replace("{from}", intl.num(p.fromUnit))
      .replace("{to}", intl.num(p.toUnit));
  }
  return p.label;
}

/** "~22 min" → localized. */
export function portionEst(intl: Intl, p: DayPortion): string {
  const m = /(\d+)/.exec(p.est);
  return m ? intl.tf("mem.portion.est", { n: Number(m[1]) }) : p.est;
}

const PLAN_ERRORS: Record<string, MessageKey> = {
  "Choose at least one portion to read.": "mem.plans.errPortion",
  "Read at least one unit per day.": "mem.plans.errUnit",
  "Pick a valid end date.": "mem.plans.errDate",
  "The end date can’t be before the start date.": "mem.plans.errOrder",
};

export function planError(intl: Intl, message: string): string {
  const key = PLAN_ERRORS[message];
  return key ? intl.t(key) : message;
}

/** A badge's display name by its stable id, falling back to core's English. */
export function badgeName(intl: Intl, badge: { id: string; name: string }): string {
  return lookup(intl, `mem.ach.${badge.id}`, badge.name);
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import {
  type HijriDate,
  type MonthlyIslamicEvent,
  gregorianToHijri,
  hijriMonth,
  hijriMonthLength,
  hijriToGregorian,
  islamicEventsForMonth,
} from "@ummahlibrary/core";
import { Icon } from "@ummahlibrary/ui";
import { KEYS, getString, setString } from "../storage";
import { useTheme, type Palette } from "../theme";
import { weekdayOfGregorian } from "../utils";
import { SunnahFastReminderToggle } from "../components/SunnahFastReminderToggle";
import { expoNotifier } from "../notifier";
import { notifyNotificationPermissionDenied } from "../notification-permission-alert";
import { readEventReminders, setEventReminder } from "../islamic-event-reminders";
import { onSyncApplied } from "../lib/sync/sync-events";
import { useIntl } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/messages";
import { HIJRI_MONTH_KEY, fmtCivilDateIn, fmtDaysUntil, uiDigits } from "../prayer-intl";

/** Interface-language names/notes for core's observances, by event id. */
const EVENT_NAME: Record<string, MessageKey> = {
  "islamic-new-year": "lr.ev.islamic-new-year",
  tasua: "lr.ev.tasua",
  ashura: "lr.ev.ashura",
  mawlid: "lr.ev.mawlid",
  "isra-miraj": "lr.ev.isra-miraj",
  "laylat-al-baraah": "lr.ev.laylat-al-baraah",
  "ramadan-begins": "lr.ev.ramadan-begins",
  "laylat-al-qadr": "lr.ev.laylat-al-qadr",
  "eid-al-fitr": "lr.ev.eid-al-fitr",
  "dhul-hijjah-begins": "lr.ev.dhul-hijjah-begins",
  tarwiyah: "lr.ev.tarwiyah",
  arafah: "lr.ev.arafah",
  "eid-al-adha": "lr.ev.eid-al-adha",
  tashriq: "lr.ev.tashriq",
};
const EVENT_NOTE: Record<string, MessageKey> = {
  "islamic-new-year": "lr.evNote.islamic-new-year",
  tasua: "lr.evNote.tasua",
  ashura: "lr.evNote.ashura",
  mawlid: "lr.evNote.mawlid",
  "isra-miraj": "lr.evNote.isra-miraj",
  "laylat-al-baraah": "lr.evNote.laylat-al-baraah",
  "ramadan-begins": "lr.evNote.ramadan-begins",
  "laylat-al-qadr": "lr.evNote.laylat-al-qadr",
  "eid-al-fitr": "lr.evNote.eid-al-fitr",
  "dhul-hijjah-begins": "lr.evNote.dhul-hijjah-begins",
  tarwiyah: "lr.evNote.tarwiyah",
  arafah: "lr.evNote.arafah",
  "eid-al-adha": "lr.evNote.eid-al-adha",
  tashriq: "lr.evNote.tashriq",
};

const ADJUST_OPTIONS = [-2, -1, 0, 1, 2] as const;

function todayGregorian() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

export function HijriCalendarScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, tf, num, locale, dir } = useIntl();
  // Sunday-first short weekday names in the interface language (2023-01-01 was a Sunday).
  const weekdays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        fmtCivilDateIn({ year: 2023, month: 1, day: 1 + i }, locale, { weekday: "short" }),
      ),
    [locale],
  );
  const eventName = (id: string, fallback: string) =>
    EVENT_NAME[id] ? t(EVENT_NAME[id]) : fallback;
  const eventNote = (id: string, fallback: string) =>
    EVENT_NOTE[id] ? t(EVENT_NOTE[id]) : fallback;
  const signed = (n: number) => (n > 0 ? `+${num(n)}` : num(n));

  const [adjust, setAdjust] = useState(0);
  const [today, setToday] = useState<HijriDate | null>(null);
  const [view, setView] = useState<{ year: number; month: number } | null>(null);
  const [reminders, setReminders] = useState<Record<string, boolean>>({});

  // Guards the same sync-reload-vs-local-write race this loop already found
  // and fixed in PrayerTrackerScreen/LibraryContext/SettingsContext/theme.tsx:
  // `ul.hijriAdjust` is synced, so a sync round or app-foreground can start
  // `loadAdjust()`'s read *before* a tap on a date-adjustment chip lands,
  // then resolve *after* — silently reverting the user's just-picked
  // adjustment back to whatever was in storage when the reload started.
  const writeGen = useRef(0);

  useEffect(() => {
    const loadAdjust = () => {
      const gen = writeGen.current;
      const currentGen = () => writeGen.current;
      void getString(KEYS.hijriAdjust).then((raw) => {
        const n = raw === null ? 0 : parseInt(raw, 10);
        const a = Number.isFinite(n) ? Math.max(-2, Math.min(2, n)) : 0;
        const t = gregorianToHijri(todayGregorian(), a);
        if (currentGen() !== gen) return; // a newer local pick already landed
        setAdjust(a);
        setToday(t);
        setView({ year: t.year, month: t.month });
        // Same write-back gap iterations 20/60 already found (and fixed) in
        // theme.tsx/ZakatScreen: an out-of-range or malformed stored value
        // gets corrected in memory every launch but was never persisted back,
        // so the raw bad value — and whatever a sync round pushes from it —
        // would live in storage forever. Persist once, only when clamping
        // actually changed something.
        if (raw !== null && raw !== String(a)) void setString(KEYS.hijriAdjust, String(a));
      });
    };
    loadAdjust();
    void readEventReminders().then(setReminders);
    // Reminders are per-device (not synced) — only the adjustment re-reads on sync.
    return onSyncApplied(loadAdjust);
  }, []);

  async function toggleReminder(eventId: string) {
    const on = !reminders[eventId];
    // Turning on requires the OS permission — if the user denies it, leave the
    // reminder off rather than showing "on" for one that will never fire.
    if (on && expoNotifier.permission() !== "granted") {
      await expoNotifier.requestPermission();
      if (expoNotifier.permission() !== "granted") {
        notifyNotificationPermissionDenied(t("lr.eventReminderLabel"), t);
        return;
      }
    }
    setReminders(await setEventReminder(eventId, on));
  }

  function changeAdjust(next: number) {
    writeGen.current++;
    setAdjust(next);
    void setString(KEYS.hijriAdjust, String(next));
    setToday(gregorianToHijri(todayGregorian(), next));
  }

  function step(delta: number) {
    setView((v) => {
      if (!v) return v;
      let month = v.month + delta;
      let year = v.year;
      if (month < 1) {
        month = 12;
        year -= 1;
      } else if (month > 12) {
        month = 1;
        year += 1;
      }
      return { year, month };
    });
  }

  const cells = useMemo(() => {
    if (!view) return [];
    const length = hijriMonthLength(view.year, view.month);
    const firstGreg = hijriToGregorian({ year: view.year, month: view.month, day: 1 }, adjust);
    const firstWeekday = weekdayOfGregorian(firstGreg.year, firstGreg.month, firstGreg.day);
    const out: ({ day: number; gregLabel: string } | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) out.push(null);
    for (let day = 1; day <= length; day++) {
      const g = hijriToGregorian({ year: view.year, month: view.month, day }, adjust);
      const label = fmtCivilDateIn(g, locale, { month: "short", day: "numeric" });
      out.push({ day, gregLabel: label });
    }
    return out;
  }, [view, adjust, locale]);

  // The viewed month's observances — one labelled source for the grid dots and
  // the panel below it.
  const monthly = useMemo<MonthlyIslamicEvent[]>(
    () => (view ? islamicEventsForMonth(view.year, view.month, todayGregorian(), adjust) : []),
    [view, adjust],
  );

  // A themed blank placeholder, not `null` — matches PlanDetailScreen's and
  // ReadingGoalsScreen's identical brief-load gate, avoiding a flash of the
  // navigator's unthemed background before this screen's own state (a local
  // storage read for the day-adjustment offset) resolves.
  if (!view || !today) return <View style={styles.screen} />;

  const month = hijriMonth(view.month);
  const eventDays = new Set(monthly.map((m) => m.event.day));
  const nextId = monthly
    .filter((m) => m.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)[0]?.event.id;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.nav}>
        <Pressable
          style={styles.navBtn}
          onPress={() => step(-1)}
          accessibilityLabel={t("lr.prevMonth")}
        >
          <Text style={styles.navArrow}>{dir === "rtl" ? "›" : "‹"}</Text>
        </Pressable>
        <View style={styles.navTitle}>
          <Text style={styles.monthEn}>
            {tf("lr.hijriMonthYear", {
              month: t(HIJRI_MONTH_KEY[view.month - 1] ?? "lr.hm1"),
              year: uiDigits(view.year, locale),
            })}
          </Text>
          <Text style={styles.monthAr}>{month.arabic}</Text>
        </View>
        <Pressable
          style={styles.navBtn}
          onPress={() => step(1)}
          accessibilityLabel={t("lr.nextMonth")}
        >
          <Text style={styles.navArrow}>{dir === "rtl" ? "‹" : "›"}</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {weekdays.map((w, i) => (
          <Text key={i} style={styles.weekday}>
            {w}
          </Text>
        ))}
        {cells.map((cell, i) => {
          if (cell === null) return <View key={`pad-${i}`} style={styles.cell} />;
          const isToday =
            today.year === view.year && today.month === view.month && today.day === cell.day;
          const isEvent = eventDays.has(cell.day);
          return (
            <View key={cell.day} style={[styles.cell, isToday && styles.cellToday]}>
              <Text
                style={[styles.dayNum, isToday && styles.dayNumToday]}
                maxFontSizeMultiplier={1.3}
              >
                {num(cell.day)}
              </Text>
              <Text
                style={[styles.gregLabel, isToday && styles.gregLabelToday]}
                maxFontSizeMultiplier={1.3}
              >
                {cell.gregLabel}
              </Text>
              {isEvent && !isToday && <View style={styles.eventDot} />}
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.legendDot} />
          <Text style={styles.legendText}>{t("lr.observance")}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendToday} />
          <Text style={styles.legendText}>{t("pr.today")}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>{t("lr.observancesMonth")}</Text>
      {monthly.length === 0 ? (
        <Text style={styles.note}>{t("lr.noObservances")}</Text>
      ) : (
        <View style={styles.monthList}>
          {monthly.map((m) => {
            const up = m.daysUntil >= 0;
            return (
              <View
                key={m.event.id}
                style={[styles.monthRow, m.event.id === nextId && styles.monthRowNext]}
              >
                <View style={styles.dayBadge}>
                  <Text style={styles.dayBadgeText}>{num(m.event.day)}</Text>
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.eventName}>{eventName(m.event.id, m.event.name)}</Text>
                  <Text style={styles.eventDate}>
                    {fmtCivilDateIn(m.gregorian, locale, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    · {eventNote(m.event.id, m.event.note)}
                  </Text>
                </View>
                {up && (
                  <Text style={styles.eventCountdown}>{fmtDaysUntil(m.daysUntil, t, tf)}</Text>
                )}
                <Pressable
                  onPress={() => void toggleReminder(m.event.id)}
                  hitSlop={8}
                  // Announced as a switch with its state, under one fixed name —
                  // it had no role, so it wasn't even read as a control.
                  accessibilityRole="switch"
                  accessibilityState={{ checked: !!reminders[m.event.id] }}
                  accessibilityLabel={tf("pr.reminderFor", {
                    name: eventName(m.event.id, m.event.name),
                  })}
                  style={[styles.bellBtn, reminders[m.event.id] && styles.bellBtnOn]}
                >
                  <Icon
                    name="bell"
                    size={16}
                    color={reminders[m.event.id] ? colors.accent : colors.faint}
                    sw={1.8}
                  />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.adjustSection}>
        <Text style={styles.adjustLabel}>
          {tf(Math.abs(adjust) === 1 ? "lr.dateAdjust1" : "lr.dateAdjustN", { n: signed(adjust) })}
        </Text>
        <View style={styles.chips}>
          {ADJUST_OPTIONS.map((n) => (
            <Pressable
              key={n}
              style={[styles.chip, n === adjust && styles.chipOn]}
              onPress={() => changeAdjust(n)}
            >
              <Text style={[styles.chipText, n === adjust && styles.chipTextOn]}>{signed(n)}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.note}>{t("lr.adjustNote")}</Text>
      </View>

      <View style={styles.sunnahSection}>
        <Text style={styles.sectionLabel}>{t("lr.sunnahFasting")}</Text>
        <SunnahFastReminderToggle adjust={adjust} />
      </View>
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { padding: 16, backgroundColor: c.bg },
    flex1: { flex: 1, minWidth: 0 },
    nav: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
    navBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    navArrow: { color: c.fg, fontSize: 18 },
    navTitle: { flex: 1, alignItems: "center", gap: 2 },
    monthEn: { color: c.fg, fontSize: 17, fontWeight: "700" },
    monthAr: { color: c.muted, fontSize: 15 },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 12,
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 12,
    },
    weekday: {
      width: "14.28%",
      textAlign: "center",
      color: c.faint,
      fontSize: 11,
      fontWeight: "700",
      paddingBottom: 8,
    },
    cell: {
      width: "14.28%",
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 9,
    },
    eventDot: {
      position: "absolute",
      bottom: 4,
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.accent,
    },
    cellToday: { backgroundColor: c.accent },
    dayNum: { color: c.fg, fontSize: 13, fontWeight: "600" },
    dayNumToday: { color: c.ink, fontWeight: "800" },
    gregLabel: { color: c.faint, fontSize: 8 },
    gregLabelToday: { color: c.ink },
    legend: { flexDirection: "row", gap: 18, alignItems: "center", marginBottom: 22 },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    legendDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent },
    legendToday: { width: 12, height: 12, borderRadius: 4, backgroundColor: c.accent },
    legendText: { color: c.faint, fontSize: 12 },
    sectionLabel: {
      color: c.faint,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 10,
    },
    monthList: { gap: 10, marginBottom: 24 },
    monthRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    monthRowNext: { borderColor: c.accent },
    dayBadge: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: c.accentSoft,
      borderWidth: 1,
      borderColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    dayBadgeText: { color: c.accent, fontSize: 15, fontWeight: "800" },
    eventName: { color: c.fg, fontSize: 15, fontWeight: "700" },
    eventDate: { color: c.faint, fontSize: 12, marginTop: 1 },
    eventCountdown: { color: c.accent, fontSize: 13, fontWeight: "700" },
    bellBtn: {
      width: 34,
      height: 34,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: c.border,
    },
    bellBtnOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    sunnahSection: { marginTop: 28 },
    adjustSection: { gap: 10 },
    adjustLabel: { color: c.fg, fontSize: 13, fontWeight: "600" },
    chips: { flexDirection: "row", gap: 8 },
    chip: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    chipText: { color: c.muted, fontSize: 13 },
    chipTextOn: { color: c.accent, fontWeight: "600" },
    note: { color: c.muted, fontSize: 12, lineHeight: 18 },
  });
}

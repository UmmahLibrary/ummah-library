import { useEffect, useMemo, useState } from "react";
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
import { readEventReminders, setEventReminder } from "../islamic-event-reminders";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const ADJUST_OPTIONS = [-2, -1, 0, 1, 2] as const;

/** "Today" / "Tomorrow" / "in N days" for an event countdown. */
function countdownLabel(daysUntil: number): string {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  return `in ${daysUntil} days`;
}

function gregorianFull(g: { year: number; month: number; day: number }): string {
  return new Date(Date.UTC(g.year, g.month - 1, g.day)).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function todayGregorian() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

export function HijriCalendarScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [adjust, setAdjust] = useState(0);
  const [today, setToday] = useState<HijriDate | null>(null);
  const [view, setView] = useState<{ year: number; month: number } | null>(null);
  const [reminders, setReminders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void getString(KEYS.hijriAdjust).then((raw) => {
      const n = raw === null ? 0 : parseInt(raw, 10);
      const a = Number.isFinite(n) ? Math.max(-2, Math.min(2, n)) : 0;
      const t = gregorianToHijri(todayGregorian(), a);
      setAdjust(a);
      setToday(t);
      setView({ year: t.year, month: t.month });
    });
    void readEventReminders().then(setReminders);
  }, []);

  async function toggleReminder(eventId: string) {
    const on = !reminders[eventId];
    // Turning on requires the OS permission — if the user denies it, leave the
    // reminder off rather than showing "on" for one that will never fire.
    if (on && expoNotifier.permission() !== "granted") {
      await expoNotifier.requestPermission();
      if (expoNotifier.permission() !== "granted") return;
    }
    setReminders(await setEventReminder(eventId, on));
  }

  function changeAdjust(next: number) {
    setAdjust(next);
    void setString(KEYS.hijriAdjust, String(next));
    setToday(gregorianToHijri(todayGregorian(), next));
  }

  function step(delta: number) {
    setView((v) => {
      if (!v) return v;
      let month = v.month + delta;
      let year = v.year;
      if (month < 1) { month = 12; year -= 1; }
      else if (month > 12) { month = 1; year += 1; }
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
      const label = new Date(Date.UTC(g.year, g.month - 1, g.day)).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
      out.push({ day, gregLabel: label });
    }
    return out;
  }, [view, adjust]);

  // The viewed month's observances — one labelled source for the grid dots and
  // the panel below it.
  const monthly = useMemo<MonthlyIslamicEvent[]>(
    () => (view ? islamicEventsForMonth(view.year, view.month, todayGregorian(), adjust) : []),
    [view, adjust],
  );

  if (!view || !today) return null;

  const month = hijriMonth(view.month);
  const eventDays = new Set(monthly.map((m) => m.event.day));
  const nextId = monthly
    .filter((m) => m.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)[0]?.event.id;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.nav}>
        <Pressable style={styles.navBtn} onPress={() => step(-1)} accessibilityLabel="Previous month">
          <Text style={styles.navArrow}>‹</Text>
        </Pressable>
        <View style={styles.navTitle}>
          <Text style={styles.monthEn}>{month.name} {view.year} AH</Text>
          <Text style={styles.monthAr}>{month.arabic}</Text>
        </View>
        <Pressable style={styles.navBtn} onPress={() => step(1)} accessibilityLabel="Next month">
          <Text style={styles.navArrow}>›</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={styles.weekday}>{w}</Text>
        ))}
        {cells.map((cell, i) => {
          if (cell === null) return <View key={`pad-${i}`} style={styles.cell} />;
          const isToday =
            today.year === view.year && today.month === view.month && today.day === cell.day;
          const isEvent = eventDays.has(cell.day);
          return (
            <View key={cell.day} style={[styles.cell, isToday && styles.cellToday]}>
              <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>{cell.day}</Text>
              <Text style={[styles.gregLabel, isToday && styles.gregLabelToday]}>{cell.gregLabel}</Text>
              {isEvent && !isToday && <View style={styles.eventDot} />}
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.legendDot} />
          <Text style={styles.legendText}>Observance</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendToday} />
          <Text style={styles.legendText}>Today</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Observances this month</Text>
      {monthly.length === 0 ? (
        <Text style={styles.note}>No major observances fall in this month.</Text>
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
                  <Text style={styles.dayBadgeText}>{m.event.day}</Text>
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.eventName}>{m.event.name}</Text>
                  <Text style={styles.eventDate}>{gregorianFull(m.gregorian)} · {m.event.note}</Text>
                </View>
                {up && <Text style={styles.eventCountdown}>{countdownLabel(m.daysUntil)}</Text>}
                <Pressable
                  onPress={() => void toggleReminder(m.event.id)}
                  hitSlop={8}
                  accessibilityLabel={`${reminders[m.event.id] ? "Turn off" : "Turn on"} reminder for ${m.event.name}`}
                  style={[styles.bellBtn, reminders[m.event.id] && styles.bellBtnOn]}
                >
                  <Icon name="bell" size={16} color={reminders[m.event.id] ? colors.accent : colors.faint} sw={1.8} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.adjustSection}>
        <Text style={styles.adjustLabel}>
          Date adjustment ({adjust > 0 ? `+${adjust}` : adjust} day{Math.abs(adjust) === 1 ? "" : "s"})
        </Text>
        <View style={styles.chips}>
          {ADJUST_OPTIONS.map((n) => (
            <Pressable
              key={n}
              style={[styles.chip, n === adjust && styles.chipOn]}
              onPress={() => changeAdjust(n)}
            >
              <Text style={[styles.chipText, n === adjust && styles.chipTextOn]}>
                {n > 0 ? `+${n}` : n}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.note}>
          The tabular calendar can sit a day either side of your local moon sighting. Nudge it to
          match; your choice is saved on this device.
        </Text>
      </View>

      <View style={styles.sunnahSection}>
        <Text style={styles.sectionLabel}>Sunnah fasting</Text>
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

import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import {
  type HijriDate,
  type UpcomingIslamicEvent,
  gregorianToHijri,
  hijriMonth,
  hijriMonthLength,
  hijriToGregorian,
  islamicEventsInMonth,
  upcomingIslamicEvents,
} from "@ummahlibrary/core";
import { KEYS, getString, setString } from "../storage";
import { useTheme, type Palette } from "../theme";
import { weekdayOfGregorian } from "../utils";

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

  useEffect(() => {
    void getString(KEYS.hijriAdjust).then((raw) => {
      const n = raw === null ? 0 : parseInt(raw, 10);
      const a = Number.isFinite(n) ? Math.max(-2, Math.min(2, n)) : 0;
      const t = gregorianToHijri(todayGregorian(), a);
      setAdjust(a);
      setToday(t);
      setView({ year: t.year, month: t.month });
    });
  }, []);

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

  const upcoming = useMemo<UpcomingIslamicEvent[]>(
    () => upcomingIslamicEvents(todayGregorian(), 5, adjust),
    [adjust],
  );

  if (!view || !today) return null;

  const month = hijriMonth(view.month);
  const eventDays = new Set(islamicEventsInMonth(view.month).map((e) => e.day));
  const nextEvent = upcoming[0];

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {nextEvent && (
        <View style={styles.upcoming}>
          <View style={styles.nextCard}>
            <Text style={styles.nextLabel}>Next observance</Text>
            <View style={styles.nextRow}>
              <View style={styles.flex1}>
                <Text style={styles.nextName}>{nextEvent.event.name}</Text>
                <Text style={styles.nextSub}>{gregorianFull(nextEvent.gregorian)}</Text>
              </View>
              <Text style={styles.nextCountdown}>{countdownLabel(nextEvent.daysUntil)}</Text>
            </View>
          </View>
          {upcoming.slice(1).map((u) => (
            <View key={u.event.id} style={styles.eventRow}>
              <View style={styles.flex1}>
                <Text style={styles.eventName}>{u.event.name}</Text>
                <Text style={styles.eventDate}>{gregorianFull(u.gregorian)}</Text>
              </View>
              <Text style={styles.eventCountdown}>{countdownLabel(u.daysUntil)}</Text>
            </View>
          ))}
        </View>
      )}

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
            <View key={cell.day} style={[styles.cell, isToday && styles.cellToday, isEvent && !isToday && styles.cellEvent]}>
              <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>{cell.day}</Text>
              <Text style={[styles.gregLabel, isToday && styles.gregLabelToday]}>{cell.gregLabel}</Text>
              {isEvent && !isToday && <View style={styles.eventDot} />}
            </View>
          );
        })}
      </View>

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
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { padding: 16, backgroundColor: c.bg },
    flex1: { flex: 1, minWidth: 0 },
    upcoming: { marginBottom: 20, gap: 10 },
    nextCard: {
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.accent,
      borderRadius: 14,
      padding: 16,
    },
    nextLabel: {
      color: c.faint,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    nextRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    nextName: { color: c.fg, fontSize: 18, fontWeight: "800" },
    nextSub: { color: c.muted, fontSize: 13, marginTop: 2 },
    nextCountdown: { color: c.accent, fontSize: 16, fontWeight: "800" },
    eventRow: {
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
    eventName: { color: c.fg, fontSize: 15, fontWeight: "700" },
    eventDate: { color: c.faint, fontSize: 12, marginTop: 1 },
    eventCountdown: { color: c.accent, fontSize: 13, fontWeight: "700" },
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
      marginBottom: 24,
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
    cellEvent: { backgroundColor: c.accentSoft },
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

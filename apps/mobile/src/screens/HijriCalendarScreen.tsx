import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import {
  type HijriDate,
  gregorianToHijri,
  hijriMonth,
  hijriMonthLength,
  hijriToGregorian,
} from "@ummahlibrary/core";
import { KEYS, getString, setString } from "../storage";
import { useTheme, type Palette } from "../theme";
import { weekdayOfGregorian } from "../utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const ADJUST_OPTIONS = [-2, -1, 0, 1, 2] as const;

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

  if (!view || !today) return null;

  const month = hijriMonth(view.month);

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
        {cells.map((cell, i) =>
          cell === null ? (
            <View key={`pad-${i}`} style={styles.cell} />
          ) : (
            <View
              key={cell.day}
              style={[
                styles.cell,
                today.year === view.year && today.month === view.month && today.day === cell.day
                  ? styles.cellToday
                  : null,
              ]}
            >
              <Text
                style={[
                  styles.dayNum,
                  today.year === view.year && today.month === view.month && today.day === cell.day
                    ? styles.dayNumToday
                    : null,
                ]}
              >
                {cell.day}
              </Text>
              <Text style={styles.gregLabel}>{cell.gregLabel}</Text>
            </View>
          ),
        )}
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
    grid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 24 },
    weekday: {
      width: "14.28%",
      textAlign: "center",
      color: c.muted,
      fontSize: 11,
      fontWeight: "600",
      paddingBottom: 6,
    },
    cell: { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center" },
    cellToday: { backgroundColor: c.accentSoft, borderRadius: 8 },
    dayNum: { color: c.fg, fontSize: 13, fontWeight: "600" },
    dayNumToday: { color: c.accent },
    gregLabel: { color: c.muted, fontSize: 8 },
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

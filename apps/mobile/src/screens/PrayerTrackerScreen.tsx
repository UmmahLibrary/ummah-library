import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import {
  OBLIGATORY_PRAYERS,
  PRAYER_LABELS,
  type PrayerStatus,
  type PrayerTrackerLog,
  longestStreak,
  nextPrayerStatus,
  onTimeRate,
  prayedCount,
  prayerStreak,
  recentDays,
  setPrayerStatus,
  statusFor,
} from "@ummahlibrary/core";
import { useTheme, type Palette } from "../theme";
import { KEYS, getJSON, setJSON } from "../storage";
import { localISODate } from "../utils";

const STATUS_LABEL: Record<PrayerStatus, string> = {
  none: "Not yet",
  ontime: "On time",
  late: "Late",
};

export function PrayerTrackerScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const LATE = "#c98a57";
  const statusColor = (s: PrayerStatus) =>
    s === "ontime" ? colors.accent : s === "late" ? LATE : colors.border;

  const [log, setLog] = useState<PrayerTrackerLog>({});
  const today = localISODate(new Date());

  useEffect(() => {
    void getJSON<PrayerTrackerLog>(KEYS.prayerLog, {}).then(setLog);
  }, []);

  function cycle(prayer: (typeof OBLIGATORY_PRAYERS)[number]) {
    setLog((prev) => {
      const next = setPrayerStatus(prev, today, prayer, nextPrayerStatus(statusFor(prev[today], prayer)));
      void setJSON(KEYS.prayerLog, next);
      return next;
    });
  }

  const todayLog = log[today];
  const days = recentDays(log, today, 7);
  const stats: [string, string][] = [
    [`${prayedCount(todayLog)}/5`, "Prayed today"],
    [`${prayerStreak(log, today)} 🔥`, "Day streak"],
    [`${onTimeRate(log, today)}%`, "On time (30d)"],
    [`${longestStreak(log)}`, "Best streak"],
  ];

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.statsRow}>
        {stats.slice(0, 2).map(([v, l]) => (
          <Stat key={l} value={v} label={l} colors={colors} />
        ))}
      </View>
      <View style={styles.statsRow}>
        {stats.slice(2).map(([v, l]) => (
          <Stat key={l} value={v} label={l} colors={colors} />
        ))}
      </View>

      <Text style={styles.sectionLabel}>Today · tap to log</Text>
      <View style={styles.todayRow}>
        {OBLIGATORY_PRAYERS.map((p) => {
          const st = statusFor(todayLog, p);
          const lit = st !== "none";
          return (
            <Pressable
              key={p}
              style={[styles.prayer, lit && { borderColor: statusColor(st), backgroundColor: colors.accentSoft }]}
              onPress={() => cycle(p)}
            >
              <View
                style={[
                  styles.dot,
                  st === "ontime"
                    ? { backgroundColor: colors.accent }
                    : { borderWidth: 1.5, borderColor: statusColor(st) },
                ]}
              >
                <Text style={[styles.dotMark, { color: st === "ontime" ? colors.ink : statusColor(st) }]}>
                  {st === "none" ? "" : "✓"}
                </Text>
              </View>
              <Text style={styles.prayerName}>{PRAYER_LABELS[p]}</Text>
              <Text style={[styles.prayerStatus, { color: lit ? colors.accent : colors.faint }]}>
                {STATUS_LABEL[st]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Last 7 days</Text>
      <View style={styles.legendRow}>
        <Legend color={colors.accent} label="On time" colors={colors} />
        <Legend color={LATE} label="Late" colors={colors} />
        <Legend color={colors.border} label="Missed" colors={colors} outline />
      </View>
      <View style={styles.grid}>
        {OBLIGATORY_PRAYERS.map((p, pi) => (
          <View key={p} style={styles.gridRow}>
            <Text style={styles.gridLabel}>{PRAYER_LABELS[p]}</Text>
            {days.map((d) => {
              const st = d.statuses[pi] ?? "none";
              return (
                <View
                  key={d.date}
                  style={[
                    styles.cell,
                    st === "none"
                      ? { borderWidth: 1, borderColor: colors.border }
                      : { backgroundColor: statusColor(st) },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Stat({ value, label, colors }: { value: string; label: string; colors: Palette }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Legend({
  color,
  label,
  colors,
  outline,
}: {
  color: string;
  label: string;
  colors: Palette;
  outline?: boolean;
}) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.legend}>
      <View
        style={[
          styles.legendSwatch,
          outline ? { borderWidth: 1, borderColor: color } : { backgroundColor: color },
        ]}
      />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { padding: 16, backgroundColor: c.bg, gap: 12, flexGrow: 1 },
    statsRow: { flexDirection: "row", gap: 12 },
    stat: {
      flex: 1,
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 15,
    },
    statValue: { color: c.accent, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
    statLabel: { color: c.faint, fontSize: 12.5, marginTop: 3 },
    sectionLabel: {
      color: c.faint,
      fontSize: 12,
      letterSpacing: 1,
      textTransform: "uppercase",
      fontWeight: "700",
      marginTop: 10,
    },
    todayRow: { flexDirection: "row", gap: 7 },
    prayer: {
      flex: 1,
      alignItems: "center",
      gap: 7,
      paddingVertical: 14,
      paddingHorizontal: 2,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    dot: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
    dotMark: { fontSize: 15, fontWeight: "800" },
    prayerName: { color: c.fg, fontSize: 12.5, fontWeight: "700" },
    prayerStatus: { fontSize: 10.5, fontWeight: "600" },
    legendRow: { flexDirection: "row", gap: 16 },
    legend: { flexDirection: "row", alignItems: "center", gap: 5 },
    legendSwatch: { width: 10, height: 10, borderRadius: 3 },
    legendText: { color: c.faint, fontSize: 11.5 },
    grid: { gap: 8 },
    gridRow: { flexDirection: "row", alignItems: "center", gap: 7 },
    gridLabel: { color: c.muted, fontSize: 12.5, fontWeight: "600", width: 56 },
    cell: { flex: 1, aspectRatio: 1, maxWidth: 34, borderRadius: 7 },
  });
}

import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Switch, Text, View } from "../Type";
import { Icon, type Palette } from "@ummahlibrary/ui";
import { type UpcomingSunnahFast, upcomingSunnahFasts } from "@ummahlibrary/core";
import { useTheme } from "../theme";
import { FONT } from "../fonts";
import { expoNotifier } from "../notifier";
import { readSunnahFastReminderOn, setSunnahFastReminderOn } from "../sunnah-fast-reminders";

const GLYPH: Record<UpcomingSunnahFast["kind"], string> = {
  "white-day": "🌕",
  monday: "🌙",
  thursday: "🌙",
};

function todayGregorian() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

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

/**
 * Opt-in reminder for the recommended (Sunnah) fasting days — Mondays &
 * Thursdays and the white days (Ayyām al-Bīḍ) — with the coming fasts listed.
 * The reminder fires the evening before; delivery is the OS scheduler. Needs no
 * location: the dates are pure Hijri/weekday arithmetic.
 */
export function SunnahFastReminderToggle({ adjust = 0 }: { adjust?: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void readSunnahFastReminderOn().then((o) => {
      setOn(o);
      setReady(true);
    });
  }, []);

  const fasts = useMemo<UpcomingSunnahFast[]>(
    () => upcomingSunnahFasts(todayGregorian(), 6, adjust),
    [adjust],
  );
  const next = fasts[0];

  async function toggle(nextOn: boolean) {
    // Turning on requires the OS permission — if the user denies it, leave the
    // switch off rather than showing "on" for a reminder that will never fire.
    if (nextOn && expoNotifier.permission() !== "granted") {
      await expoNotifier.requestPermission();
      if (expoNotifier.permission() !== "granted") return;
    }
    setOn(nextOn);
    await setSunnahFastReminderOn(nextOn);
  }

  if (!ready) return null;

  return (
    <View>
      <View style={styles.card}>
        <View style={styles.row}>
          <Icon name="bell" size={17} color={on ? colors.accent : colors.muted} sw={1.8} />
          <View style={styles.text}>
            <Text style={styles.title}>Sunnah-fast reminders</Text>
            <Text style={styles.note}>
              A nudge the evening before Mondays &amp; Thursdays and the white days (13–15).
            </Text>
          </View>
          <Switch
            value={on}
            onValueChange={(v) => void toggle(v)}
            trackColor={{ true: colors.accentSoft, false: colors.border }}
            thumbColor={on ? colors.accent : colors.faint}
          />
        </View>
        {on && next && (
          <Text style={styles.nextLine}>
            Next: {next.name} · {countdownLabel(next.daysUntil)}
          </Text>
        )}
      </View>

      <Text style={styles.sectionLabel}>Upcoming fasts</Text>
      <View style={styles.list}>
        {fasts.map((f) => (
          <View
            key={`${f.gregorian.year}-${f.gregorian.month}-${f.gregorian.day}`}
            style={[styles.fastRow, f === next && styles.fastRowNext]}
          >
            <View style={styles.badge}>
              <Text style={styles.badgeGlyph}>{GLYPH[f.kind]}</Text>
            </View>
            <View style={styles.flex1}>
              <Text style={styles.fastName}>{f.name}</Text>
              <Text style={styles.fastDate}>
                {gregorianFull(f.gregorian)} · {f.note}
              </Text>
            </View>
            <Text style={styles.countdown}>{countdownLabel(f.daysUntil)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    flex1: { flex: 1, minWidth: 0 },
    card: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 14,
      backgroundColor: c.bgElev,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 12 },
    text: { flex: 1 },
    title: { color: c.fg, fontFamily: FONT.semibold, fontSize: 14 },
    note: { color: c.muted, fontFamily: FONT.regular, fontSize: 12.5, marginTop: 2 },
    nextLine: { color: c.accent, fontFamily: FONT.semibold, fontSize: 12.5, marginTop: 10 },
    sectionLabel: {
      color: c.faint,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
      marginTop: 22,
      marginBottom: 10,
    },
    list: { gap: 10 },
    fastRow: {
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
    fastRowNext: { borderColor: c.accent },
    badge: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: c.accentSoft,
      borderWidth: 1,
      borderColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeGlyph: { fontSize: 18 },
    fastName: { color: c.fg, fontSize: 15, fontWeight: "700" },
    fastDate: { color: c.faint, fontSize: 12, marginTop: 1 },
    countdown: { color: c.accent, fontSize: 13, fontWeight: "700" },
  });
}

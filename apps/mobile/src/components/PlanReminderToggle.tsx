import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "../Type";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Icon, type Palette } from "@ummahlibrary/ui";
import { DEFAULT_PLAN_REMINDER_TIME } from "@ummahlibrary/core";
import { useTheme } from "../theme";
import { FONT } from "../fonts";
import { expoNotifier } from "../notifier";
import { readPlanReminderPref, setPlanReminderPref } from "../plan-reminders";

/** `"20:00"` → `"8:00 PM"`. */
function label(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const am = (h ?? 0) < 12;
  const h12 = (h ?? 0) % 12 === 0 ? 12 : (h ?? 0) % 12;
  return `${h12}:${String(m ?? 0).padStart(2, "0")} ${am ? "AM" : "PM"}`;
}

function timeToDate(time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h ?? 20, m ?? 0, 0, 0);
  return d;
}

function dateToTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Opt-in daily reminder for the active plan (#71). Delivery is the OS scheduler
 * (expo-notifications) so it fires even when the app is closed. Tap the time to
 * pick when.
 */
export function PlanReminderToggle() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [on, setOn] = useState(false);
  const [time, setTime] = useState(DEFAULT_PLAN_REMINDER_TIME);
  const [showPicker, setShowPicker] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void readPlanReminderPref().then((p) => {
      setOn(p.on);
      setTime(p.time);
      setReady(true);
    });
  }, []);

  async function toggle(next: boolean) {
    // Turning on requires the OS permission — if the user denies it, leave the
    // switch off rather than showing "on" for a reminder that will never fire.
    if (next && expoNotifier.permission() !== "granted") {
      await expoNotifier.requestPermission();
      if (expoNotifier.permission() !== "granted") return;
    }
    setOn(next);
    await setPlanReminderPref({ on: next, time });
  }

  function onPickTime(event: DateTimePickerEvent, date?: Date) {
    setShowPicker(false);
    if (event.type === "set" && date) {
      const next = dateToTime(date);
      setTime(next);
      void setPlanReminderPref({ on, time: next });
    }
  }

  if (!ready) return null;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Icon name="bell" size={17} color={on ? colors.accent : colors.muted} sw={1.8} />
        <View style={styles.text}>
          <Text style={styles.title}>Daily reminder</Text>
          <Text style={styles.note}>A gentle daily nudge for today's portion.</Text>
        </View>
        <Switch
          value={on}
          onValueChange={(v) => void toggle(v)}
          trackColor={{ true: colors.accentSoft, false: colors.border }}
          thumbColor={on ? colors.accent : colors.faint}
        />
      </View>

      {on && (
        <Pressable style={styles.timeRow} onPress={() => setShowPicker(true)} accessibilityRole="button">
          <Text style={styles.timeLabel}>Remind me at</Text>
          <View style={styles.timePill}>
            <Icon name="clock" size={13} color={colors.accent} sw={1.8} />
            <Text style={styles.timeValue}>{label(time)}</Text>
          </View>
        </Pressable>
      )}

      {showPicker && (
        <DateTimePicker value={timeToDate(time)} mode="time" is24Hour={false} onChange={onPickTime} />
      )}
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    card: {
      marginTop: 14,
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
    timeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    timeLabel: { color: c.muted, fontFamily: FONT.regular, fontSize: 13 },
    timePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 999,
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: c.cardHi,
    },
    timeValue: { color: c.fg, fontFamily: FONT.semibold, fontSize: 13 },
  });
}

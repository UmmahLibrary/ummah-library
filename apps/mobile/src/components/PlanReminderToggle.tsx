import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Switch, Text, View } from "../Type";
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

/**
 * Opt-in daily reminder for the active plan (#71). Delivery is the OS scheduler
 * (expo-notifications) so it fires even when the app is closed. Time is the
 * default for now; a picker is a follow-up.
 */
export function PlanReminderToggle() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [on, setOn] = useState(false);
  const [time, setTime] = useState(DEFAULT_PLAN_REMINDER_TIME);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void readPlanReminderPref().then((p) => {
      setOn(p.on);
      setTime(p.time);
      setReady(true);
    });
  }, []);

  async function toggle(next: boolean) {
    if (next && expoNotifier.permission() !== "granted") await expoNotifier.requestPermission();
    setOn(next);
    await setPlanReminderPref({ on: next, time });
  }

  if (!ready) return null;

  return (
    <View style={styles.card}>
      <Icon name="bell" size={17} color={on ? colors.accent : colors.muted} sw={1.8} />
      <View style={styles.text}>
        <Text style={styles.title}>Daily reminder</Text>
        <Text style={styles.note}>
          {on ? `A nudge at ${label(time)} for today's portion.` : "A gentle daily nudge for today's portion."}
        </Text>
      </View>
      <Switch
        value={on}
        onValueChange={(v) => void toggle(v)}
        trackColor={{ true: colors.accentSoft, false: colors.border }}
        thumbColor={on ? colors.accent : colors.faint}
      />
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    card: {
      marginTop: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 14,
      backgroundColor: c.bgElev,
    },
    text: { flex: 1 },
    title: { color: c.fg, fontFamily: FONT.semibold, fontSize: 14 },
    note: { color: c.muted, fontFamily: FONT.regular, fontSize: 12.5, marginTop: 2 },
  });
}

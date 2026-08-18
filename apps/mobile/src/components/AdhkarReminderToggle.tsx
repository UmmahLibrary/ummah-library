import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Switch, Text, View } from "../Type";
import { Icon, type Palette } from "@ummahlibrary/ui";
import { useTheme } from "../theme";
import { FONT } from "../fonts";
import { expoNotifier } from "../notifier";
import { mobilePrayerSettingsStore } from "../prayer-settings-store";
import { readAdhkarReminderOn, setAdhkarReminderOn } from "../adhkar-reminders";

/**
 * Opt-in reminder for morning/evening adhkar (#71), timed off the reader's prayer
 * times and delivered by the OS scheduler. A no-op without a saved location.
 */
export function AdhkarReminderToggle() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [on, setOn] = useState(false);
  const [hasCoords, setHasCoords] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void Promise.all([readAdhkarReminderOn(), mobilePrayerSettingsStore.read()]).then(([o, s]) => {
      setOn(o);
      setHasCoords(s.coords !== null);
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
    await setAdhkarReminderOn(next);
  }

  if (!ready) return null;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Icon name="bell" size={17} color={on ? colors.accent : colors.muted} sw={1.8} />
        <View style={styles.text}>
          <Text style={styles.title}>Reminders</Text>
          <Text style={styles.note}>Morning &amp; evening adhkar, timed off your prayer times.</Text>
        </View>
        <Switch
          value={on}
          onValueChange={(v) => void toggle(v)}
          trackColor={{ true: colors.accentSoft, false: colors.border }}
          thumbColor={on ? colors.accent : colors.faint}
        />
      </View>
      {on && !hasCoords && (
        <Text style={styles.hint}>Set your location on Prayer times so reminders know when Fajr and ʿAṣr are.</Text>
      )}
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
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
    hint: { color: c.faint, fontFamily: FONT.regular, fontSize: 12, marginTop: 10 },
  });
}

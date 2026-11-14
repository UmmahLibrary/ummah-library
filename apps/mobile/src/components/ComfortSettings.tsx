import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "../Type";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useSettings } from "../state/SettingsContext";
import { targetSize } from "../comfort";
import { SizeControls } from "./SizeControls";

function Switch({
  on,
  onChange,
  title,
  note,
  min,
  styles,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  title: string;
  note: string;
  min: number;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Pressable
      style={[styles.switchRow, { minHeight: Math.max(56, min) }]}
      onPress={() => onChange(!on)}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={title}
      accessibilityHint={note}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.note}>{note}</Text>
      </View>
      <View style={[styles.track, on && styles.trackOn]}>
        <View style={[styles.knob, on && styles.knobOn]} />
      </View>
    </Pressable>
  );
}

/**
 * Settings → Reading comfort (ADR 0041), mirroring web's ComfortSettings:
 * separate Arabic and translation sizes, translation emphasis,
 * transliteration, larger buttons, reduced motion, Easy mode, and gentle habit
 * tracking ("days in a row" off by default; pause any time).
 */
export function ComfortSettings() {
  const { colors } = useTheme();
  const { comfort, setComfort, transliteration, setTransliteration } = useSettings();
  const min = targetSize(comfort);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const sw = (title: string, note: string, on: boolean, onChange: (v: boolean) => void) => (
    <Switch
      key={title}
      title={title}
      note={note}
      on={on}
      onChange={onChange}
      min={min}
      styles={styles}
    />
  );

  return (
    <View style={styles.card}>
      <SizeControls />
      <View style={styles.group}>
        {sw(
          "Softer translation colour",
          "Make the translation quieter than the Arabic",
          comfort.trEmphasis === "soft",
          (v) => setComfort({ trEmphasis: v ? "soft" : "equal" }),
        )}
        {sw(
          "Show transliteration",
          "The Arabic sounds in Latin letters under each āyah",
          transliteration,
          setTransliteration,
        )}
        {sw(
          "Larger buttons",
          "Bigger targets everywhere, easier for shaky hands",
          comfort.largeButtons,
          (v) => setComfort({ largeButtons: v }),
        )}
        {sw("Reduce motion", "No sliding or animated scrolling", comfort.reduceMotion, (v) =>
          setComfort({ reduceMotion: v }),
        )}
      </View>

      <Text style={styles.sub}>Modes</Text>
      <View style={styles.group}>
        {sw(
          "Easy mode",
          "Three big buttons on Home — Continue, Listen, Choose a surah. Hold to leave.",
          comfort.mode === "easy",
          (v) => setComfort({ mode: v ? "easy" : "standard" }),
        )}
      </View>

      <Text style={styles.sub}>Daily habit</Text>
      <View style={styles.group}>
        {sw(
          "Show “days in a row”",
          "Off by default. Home shows how many days you read this week instead.",
          comfort.showStreaks,
          (v) => setComfort({ showStreaks: v }),
        )}
        {sw(
          "Pause tracking",
          "Take a break from habit tracking for any reason. Your progress is kept.",
          comfort.trackingPaused,
          (v) => setComfort({ trackingPaused: v }),
        )}
      </View>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 16,
      gap: 12,
    },
    group: { gap: 2 },
    sub: { color: c.fg, fontSize: 16, fontFamily: FONT.extrabold, marginTop: 6 },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSoft,
    },
    title: { color: c.fg, fontSize: 15.5, fontFamily: FONT.semibold },
    note: { color: c.muted, fontSize: 13.5, lineHeight: 19, marginTop: 2 },
    track: {
      width: 50,
      height: 30,
      borderRadius: 15,
      padding: 3,
      backgroundColor: c.border,
      justifyContent: "center",
    },
    trackOn: { backgroundColor: c.accent },
    knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: c.bg },
    knobOn: { alignSelf: "flex-end", backgroundColor: c.ink },
  });
}

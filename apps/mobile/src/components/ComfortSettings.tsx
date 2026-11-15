import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "../Type";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useSettings } from "../state/SettingsContext";
import { targetSize } from "../comfort";
import { SizeControls } from "./SizeControls";
import { useT } from "../i18n/I18nProvider";

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
  const t = useT();
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
        {sw(t("set.c.softTr"), t("set.c.softTrNote"), comfort.trEmphasis === "soft", (v) =>
          setComfort({ trEmphasis: v ? "soft" : "equal" }),
        )}
        {sw(t("set.c.translit"), t("set.c.translitNote"), transliteration, setTransliteration)}
        {sw(t("set.c.largeBtns"), t("set.c.largeBtnsNote"), comfort.largeButtons, (v) =>
          setComfort({ largeButtons: v }),
        )}
        {sw(t("set.c.reduceMotion"), t("set.c.reduceMotionNote"), comfort.reduceMotion, (v) =>
          setComfort({ reduceMotion: v }),
        )}
      </View>

      <Text style={styles.sub} accessibilityRole="header">
        {t("set.c.modes")}
      </Text>
      <View style={styles.group}>
        {sw(t("set.c.easy"), t("set.c.easyNote"), comfort.mode === "easy", (v) =>
          setComfort({ mode: v ? "easy" : "standard" }),
        )}
      </View>

      <Text style={styles.sub} accessibilityRole="header">
        {t("set.c.habit")}
      </Text>
      <View style={styles.group}>
        {sw(t("set.c.streaks"), t("set.c.streaksNote"), comfort.showStreaks, (v) =>
          setComfort({ showStreaks: v }),
        )}
        {sw(t("set.c.pause"), t("set.c.pauseNote"), comfort.trackingPaused, (v) =>
          setComfort({ trackingPaused: v }),
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

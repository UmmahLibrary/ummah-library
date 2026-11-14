import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "../Type";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useSettings } from "../state/SettingsContext";
import {
  AR_SCALE_MAX,
  AR_SCALE_MIN,
  TR_SCALE_MAX,
  TR_SCALE_MIN,
  stepScale,
  targetSize,
} from "../comfort";
import { SAMPLE_FATIHA_2 } from "../quran-samples";

/**
 * Separate Arabic and translation size steppers (ADR 0041) with a live sample.
 * Arabic size is the existing synced `scale` — a pure font-size multiplier
 * (line height scales with it; the Quran font and shaping never change).
 * Translation size is the comfort `trScale`.
 */
export function SizeControls({ sample = true }: { sample?: boolean }) {
  const { colors } = useTheme();
  const { scale, setScale, comfort, setComfort } = useSettings();
  const min = targetSize(comfort);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const stepper = (
    title: string,
    value: number,
    lo: number,
    hi: number,
    onStep: (delta: number) => void,
    what: string,
  ) => (
    <View style={styles.row}>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.stepper}>
        <Pressable
          style={[styles.step, { minHeight: min, minWidth: min }, value <= lo && styles.disabled]}
          disabled={value <= lo}
          onPress={() => onStep(-0.1)}
          accessibilityRole="button"
          accessibilityLabel={`Smaller ${what}`}
        >
          <Text style={styles.stepText}>−</Text>
        </Pressable>
        <Text style={styles.value} accessibilityLiveRegion="polite">
          {Math.round(value * 100)}%
        </Text>
        <Pressable
          style={[styles.step, { minHeight: min, minWidth: min }, value >= hi && styles.disabled]}
          disabled={value >= hi}
          onPress={() => onStep(0.1)}
          accessibilityRole="button"
          accessibilityLabel={`Bigger ${what}`}
        >
          <Text style={styles.stepText}>+</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.wrap}>
      {stepper(
        "Arabic size",
        scale,
        AR_SCALE_MIN,
        AR_SCALE_MAX,
        (d) => setScale((prev) => stepScale(prev, d, AR_SCALE_MIN, AR_SCALE_MAX)),
        "Arabic",
      )}
      {stepper(
        "Translation size",
        comfort.trScale,
        TR_SCALE_MIN,
        TR_SCALE_MAX,
        (d) => setComfort({ trScale: stepScale(comfort.trScale, d, TR_SCALE_MIN, TR_SCALE_MAX) }),
        "translation",
      )}
      {sample && (
        <View style={styles.sample}>
          {/* Quran text: the Quran font, explicit line height ≥ 1.9× and
              vertical padding so stacked marks never clip on Android. */}
          <Text
            style={[styles.sampleAr, { fontSize: 26 * scale, lineHeight: 52 * scale }]}
            allowFontScaling={false}
          >
            {SAMPLE_FATIHA_2.arabic}
          </Text>
          <Text
            style={[
              styles.sampleEn,
              comfort.trEmphasis === "soft" && styles.sampleEnSoft,
              { fontSize: 15 * comfort.trScale, lineHeight: 24 * comfort.trScale },
            ]}
          >
            {SAMPLE_FATIHA_2.english}
          </Text>
          <Text style={styles.sampleRef}>Al-Fātiḥah 1:2 · The Clear Quran, Mustafa Khattab</Text>
        </View>
      )}
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    wrap: { gap: 12 },
    row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    label: { color: c.fg, fontSize: 15.5, fontFamily: FONT.semibold, flexShrink: 1 },
    stepper: { flexDirection: "row", alignItems: "center", gap: 10 },
    step: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bg,
    },
    stepText: { color: c.fg, fontSize: 22, fontFamily: FONT.bold },
    value: {
      color: c.fg,
      fontSize: 15,
      minWidth: 52,
      textAlign: "center",
      fontFamily: FONT.semibold,
    },
    disabled: { opacity: 0.4 },
    sample: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: c.bg,
      gap: 4,
    },
    sampleAr: {
      color: c.fg,
      textAlign: "right",
      writingDirection: "rtl",
      fontFamily: FONT.arQuran,
      paddingVertical: 4,
    },
    sampleEn: { color: c.fg },
    sampleEnSoft: { color: c.muted },
    sampleRef: { color: c.muted, fontSize: 13 },
  });
}

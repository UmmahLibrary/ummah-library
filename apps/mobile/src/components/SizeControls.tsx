import { useMemo } from "react";
import { LTR_TEXT } from "../text-direction";
import { StyleSheet, Text, View } from "../Type";
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
import { Stepper } from "@ummahlibrary/ui";
import { useIntl } from "../i18n/I18nProvider";

/**
 * Separate Arabic and translation size steppers (ADR 0041) with a live sample.
 * Arabic size is the existing synced `scale` — a pure font-size multiplier
 * (line height scales with it; the Quran font and shaping never change).
 * Translation size is the comfort `trScale`.
 */
export function SizeControls({ sample = true }: { sample?: boolean }) {
  const { colors } = useTheme();
  const { scale, setScale, comfort, setComfort } = useSettings();
  const { t, tf, dir } = useIntl();
  const script = dir === "rtl" ? "arabic" : "latin";
  const min = targetSize(comfort);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <Stepper
        label={t("set.s.arabic")}
        value={tf("set.s.percent", { n: Math.round(scale * 100) })}
        onDecrease={() => setScale((prev) => stepScale(prev, -0.1, AR_SCALE_MIN, AR_SCALE_MAX))}
        onIncrease={() => setScale((prev) => stepScale(prev, 0.1, AR_SCALE_MIN, AR_SCALE_MAX))}
        canDecrease={scale > AR_SCALE_MIN}
        canIncrease={scale < AR_SCALE_MAX}
        decreaseLabel={t("set.s.arSmaller")}
        increaseLabel={t("set.s.arBigger")}
        size={min}
        script={script}
      />
      <Stepper
        label={t("set.s.translation")}
        value={tf("set.s.percent", { n: Math.round(comfort.trScale * 100) })}
        onDecrease={() =>
          setComfort({ trScale: stepScale(comfort.trScale, -0.1, TR_SCALE_MIN, TR_SCALE_MAX) })
        }
        onIncrease={() =>
          setComfort({ trScale: stepScale(comfort.trScale, 0.1, TR_SCALE_MIN, TR_SCALE_MAX) })
        }
        canDecrease={comfort.trScale > TR_SCALE_MIN}
        canIncrease={comfort.trScale < TR_SCALE_MAX}
        decreaseLabel={t("set.s.trSmaller")}
        increaseLabel={t("set.s.trBigger")}
        size={min}
        script={script}
      />
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
              LTR_TEXT,
              comfort.trEmphasis === "soft" && styles.sampleEnSoft,
              { fontSize: 15 * comfort.trScale, lineHeight: 24 * comfort.trScale },
            ]}
          >
            {SAMPLE_FATIHA_2.english}
          </Text>
          {/* Translation attribution stays as published. */}
          <Text style={styles.sampleRef}>
            {t("set.s.sampleRef")} · The Clear Quran, Mustafa Khattab
          </Text>
        </View>
      )}
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    wrap: { gap: 12 },
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
      direction: "ltr",
      paddingVertical: 4,
    },
    sampleEn: { color: c.fg },
    sampleEnSoft: { color: c.muted },
    sampleRef: { color: c.muted, fontSize: 13 },
  });
}

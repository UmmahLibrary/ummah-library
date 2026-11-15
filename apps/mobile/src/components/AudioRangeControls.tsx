/**
 * Playback speed + A→B range-repeat controls for the reciter (#136), shared by the
 * surah and juzʾ readers. A tap-to-cycle speed chip, plus a collapsible panel to
 * loop an āyah range A→B a chosen number of times. The playback logic lives in
 * {@link useSurahAudio}; this is only the UI over its `rate`/`setRate`/`playRange`.
 */
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "../Type";
import { cyclePlaybackRate, type VerseKey } from "@ummahlibrary/core";
import { useTheme, type Palette } from "../theme";
import type { SurahAudio } from "../audio/useSurahAudio";
import { useIntl } from "../i18n/I18nProvider";

const COUNTS = [Infinity, 2, 3, 5, 10];

export function AudioRangeControls({ audio, verses }: { audio: SurahAudio; verses: VerseKey[] }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, tf, num, dir } = useIntl();
  const countLabel = (n: number): string => (n === Infinity ? "∞" : tf("rd.times", { n }));
  const [open, setOpen] = useState(false);
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(Math.max(0, verses.length - 1));
  const [countIdx, setCountIdx] = useState(0);

  if (verses.length === 0) return null;

  const multiSurah = new Set(verses.map((v) => v.sura)).size > 1;
  const label = (v: VerseKey): string => (multiSurah ? `${num(v.sura)}:${num(v.aya)}` : num(v.aya));
  const clampIdx = (i: number): number => Math.min(verses.length - 1, Math.max(0, i));
  const from = verses[clampIdx(fromIdx)]!;
  const to = verses[clampIdx(toIdx)]!;
  const count = COUNTS[countIdx]!;

  const stepper = (
    value: string,
    onMinus: () => void,
    onPlus: () => void,
    a11yEarlier: string,
    a11yLater: string,
  ) => (
    <View style={styles.stepper}>
      <Pressable onPress={onMinus} style={styles.stepHit} accessibilityLabel={a11yEarlier}>
        <Text style={styles.stepBtn}>−</Text>
      </Pressable>
      <Text style={styles.stepVal}>{value}</Text>
      <Pressable onPress={onPlus} style={styles.stepHit} accessibilityLabel={a11yLater}>
        <Text style={styles.stepBtn}>+</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          onPress={() => audio.setRate(cyclePlaybackRate(audio.rate))}
          style={styles.chip}
          accessibilityLabel={tf("rd.speedA11y", { rate: audio.rate })}
        >
          <Text style={[styles.chipValue, audio.rate !== 1 && styles.chipTextOn]}>
            {tf("rd.times", { n: audio.rate })}
          </Text>
          <Text style={styles.chipText}>{t("rd.speed")}</Text>
        </Pressable>
        <Pressable
          onPress={() => setOpen((v) => !v)}
          style={[styles.chip, open && styles.chipOn]}
          accessibilityLabel={t("rd.range.a11y")}
          accessibilityState={{ expanded: open }}
        >
          <Text style={[styles.chipValue, open && styles.chipTextOn]}>A–B</Text>
          <Text style={styles.chipText}>{t("rd.range.label")}</Text>
        </Pressable>
      </View>
      {open && (
        <View style={styles.panel}>
          {stepper(
            label(from),
            () => setFromIdx((i) => clampIdx(i - 1)),
            () => setFromIdx((i) => clampIdx(i + 1)),
            t("rd.range.startEarlier"),
            t("rd.range.startLater"),
          )}
          <Text style={styles.arrow}>{dir === "rtl" ? "←" : "→"}</Text>
          {stepper(
            label(to),
            () => setToIdx((i) => clampIdx(i - 1)),
            () => setToIdx((i) => clampIdx(i + 1)),
            t("rd.range.endEarlier"),
            t("rd.range.endLater"),
          )}
          <Pressable
            onPress={() => setCountIdx((i) => (i + 1) % COUNTS.length)}
            style={styles.chip}
            accessibilityLabel={tf("rd.range.repeatA11y", { count: countLabel(count) })}
          >
            <Text style={styles.chipValue}>{countLabel(count)}</Text>
          </Pressable>
          <Pressable
            onPress={() => audio.playRange(verses, from, to, count)}
            style={styles.go}
            accessibilityLabel={t("rd.range.loopA11y")}
          >
            <Text style={styles.goText}>{t("rd.range.loop")}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    wrap: { gap: 8 },
    row: { flexDirection: "row", gap: 8 },
    // Labelled, 48dp-tall chips (ADR 0041): a value on top, a word beneath.
    chip: {
      minHeight: 48,
      minWidth: 56,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    chipOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    chipValue: { color: c.fg, fontSize: 15, fontWeight: "800" },
    chipText: { color: c.fg, fontSize: 13, fontWeight: "600" },
    chipTextOn: { color: c.fg },
    stepHit: { minWidth: 40, minHeight: 48, alignItems: "center", justifyContent: "center" },
    panel: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
    stepper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    stepBtn: { color: c.fg, fontSize: 20, fontWeight: "700", width: 16, textAlign: "center" },
    stepVal: { color: c.fg, fontSize: 14, fontWeight: "600", minWidth: 28, textAlign: "center" },
    arrow: { color: c.muted, fontSize: 14 },
    go: {
      minHeight: 48,
      justifyContent: "center",
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: c.accent,
    },
    // ≥ 18.66px bold counts as large text, where ink-on-gold clears 3:1 on every theme.
    goText: { color: c.ink, fontSize: 19, fontWeight: "700" },
  });
}

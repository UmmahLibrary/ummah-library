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

const COUNTS = [Infinity, 2, 3, 5, 10];
const countLabel = (n: number): string => (n === Infinity ? "∞" : `${n}×`);

export function AudioRangeControls({ audio, verses }: { audio: SurahAudio; verses: VerseKey[] }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(Math.max(0, verses.length - 1));
  const [countIdx, setCountIdx] = useState(0);

  if (verses.length === 0) return null;

  const multiSurah = new Set(verses.map((v) => v.sura)).size > 1;
  const label = (v: VerseKey): string => (multiSurah ? `${v.sura}:${v.aya}` : `${v.aya}`);
  const clampIdx = (i: number): number => Math.min(verses.length - 1, Math.max(0, i));
  const from = verses[clampIdx(fromIdx)]!;
  const to = verses[clampIdx(toIdx)]!;
  const count = COUNTS[countIdx]!;

  const stepper = (value: string, onMinus: () => void, onPlus: () => void, a11y: string) => (
    <View style={styles.stepper}>
      <Pressable onPress={onMinus} hitSlop={8} accessibilityLabel={`${a11y} earlier`}>
        <Text style={styles.stepBtn}>−</Text>
      </Pressable>
      <Text style={styles.stepVal}>{value}</Text>
      <Pressable onPress={onPlus} hitSlop={8} accessibilityLabel={`${a11y} later`}>
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
          accessibilityLabel={`Playback speed ${audio.rate}×`}
        >
          <Text style={[styles.chipText, audio.rate !== 1 && styles.chipTextOn]}>
            {audio.rate}×
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setOpen((v) => !v)}
          style={styles.chip}
          accessibilityLabel="Repeat an āyah range"
        >
          <Text style={[styles.chipText, open && styles.chipTextOn]}>A–B</Text>
        </Pressable>
      </View>
      {open && (
        <View style={styles.panel}>
          {stepper(
            label(from),
            () => setFromIdx((i) => clampIdx(i - 1)),
            () => setFromIdx((i) => clampIdx(i + 1)),
            "Range start",
          )}
          <Text style={styles.arrow}>→</Text>
          {stepper(
            label(to),
            () => setToIdx((i) => clampIdx(i - 1)),
            () => setToIdx((i) => clampIdx(i + 1)),
            "Range end",
          )}
          <Pressable
            onPress={() => setCountIdx((i) => (i + 1) % COUNTS.length)}
            style={styles.chip}
            accessibilityLabel={`Repeat ${countLabel(count)}`}
          >
            <Text style={styles.chipText}>{countLabel(count)}</Text>
          </Pressable>
          <Pressable
            onPress={() => audio.playRange(verses, from, to, count)}
            style={styles.go}
            accessibilityLabel="Loop the range"
          >
            <Text style={styles.goText}>Loop</Text>
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
    chip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    chipText: { color: c.muted, fontSize: 13, fontWeight: "600" },
    chipTextOn: { color: c.accent },
    panel: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
    stepper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    stepBtn: { color: c.accent, fontSize: 18, fontWeight: "700", width: 16, textAlign: "center" },
    stepVal: { color: c.fg, fontSize: 13, fontWeight: "600", minWidth: 28, textAlign: "center" },
    arrow: { color: c.muted, fontSize: 14 },
    go: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 8,
      backgroundColor: c.accent,
    },
    goText: { color: c.ink, fontSize: 13, fontWeight: "700" },
  });
}

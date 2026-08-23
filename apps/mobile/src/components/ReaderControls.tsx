import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "../Type";
import { useTheme, type Palette } from "../theme";
import { MAX_SCALE, MIN_SCALE, type ReadingMode } from "../types";

const MODES: { mode: ReadingMode; label: string }[] = [
  { mode: "translation", label: "Verse" },
  { mode: "reading", label: "Reading" },
  { mode: "reading-tr", label: "Translations" },
];

/** Reading-mode segmented control + font scale + Manage translations. */
export function ReaderControls({
  mode,
  onMode,
  scale,
  onScale,
  transliteration,
  onTransliteration,
  wordTransliteration,
  onWordTransliteration,
  tapToHear,
  onTapToHear,
  onManage,
}: {
  mode: ReadingMode;
  onMode: (m: ReadingMode) => void;
  scale: number;
  onScale: (n: number | ((prev: number) => number)) => void;
  transliteration: boolean;
  onTransliteration: (on: boolean) => void;
  wordTransliteration: boolean;
  onWordTransliteration: (on: boolean) => void;
  tapToHear: boolean;
  onTapToHear: (on: boolean) => void;
  onManage: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={styles.segment}>
        {MODES.map(({ mode: m, label }) => (
          <Pressable
            key={m}
            style={[styles.segItem, m === mode && styles.segItemOn]}
            onPress={() => onMode(m)}
          >
            <Text style={[styles.segText, m === mode && styles.segTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.rightRow}>
        <View style={styles.scale}>
          <Pressable
            style={styles.scaleBtn}
            disabled={scale <= MIN_SCALE}
            onPress={() => onScale((prev) => prev - 0.1)}
          >
            <Text style={styles.scaleText}>A−</Text>
          </Pressable>
          <Pressable
            style={styles.scaleBtn}
            disabled={scale >= MAX_SCALE}
            onPress={() => onScale((prev) => prev + 0.1)}
          >
            <Text style={styles.scaleText}>A+</Text>
          </Pressable>
        </View>
        <View style={styles.rightBtns}>
          <Pressable
            style={[styles.toggle, transliteration && styles.toggleOn]}
            onPress={() => onTransliteration(!transliteration)}
            accessibilityRole="switch"
            accessibilityState={{ checked: transliteration }}
            accessibilityLabel="Transliteration"
          >
            <Text style={[styles.toggleText, transliteration && styles.toggleTextOn]}>Aa Line</Text>
          </Pressable>
          <Pressable
            style={[styles.toggle, wordTransliteration && styles.toggleOn]}
            onPress={() => onWordTransliteration(!wordTransliteration)}
            accessibilityRole="switch"
            accessibilityState={{ checked: wordTransliteration }}
            accessibilityLabel="Word transliteration"
          >
            <Text style={[styles.toggleText, wordTransliteration && styles.toggleTextOn]}>
              Aa Word
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggle, tapToHear && styles.toggleOn]}
            onPress={() => onTapToHear(!tapToHear)}
            accessibilityRole="switch"
            accessibilityState={{ checked: tapToHear }}
            accessibilityLabel="Tap a word to hear"
          >
            <Text style={[styles.toggleText, tapToHear && styles.toggleTextOn]}>🔊 Word</Text>
          </Pressable>
          <Pressable style={styles.manage} onPress={onManage}>
            <Text style={styles.manageText}>⚙</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    wrap: { gap: 10, marginBottom: 14 },
    segment: {
      flexDirection: "row",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden",
    },
    segItem: { flex: 1, paddingVertical: 9, alignItems: "center", backgroundColor: c.bg },
    segItemOn: { backgroundColor: c.accentSoft },
    segText: { color: c.muted, fontSize: 13, fontWeight: "600" },
    segTextOn: { color: c.accent },
    rightRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      rowGap: 8,
    },
    rightBtns: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    scale: { flexDirection: "row", gap: 8 },
    scaleBtn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    scaleText: { color: c.fg, fontSize: 13, fontWeight: "600" },
    manage: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    manageText: { color: c.accent, fontSize: 13, fontWeight: "600" },
    toggle: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    toggleOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    toggleText: { color: c.muted, fontSize: 13, fontWeight: "600" },
    toggleTextOn: { color: c.accent },
  });
}

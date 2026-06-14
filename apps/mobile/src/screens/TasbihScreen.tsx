import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, Vibration, View } from "react-native";
import { DHIKR_PHRASES, TASBIH_TARGETS, tasbihState } from "@ummahlibrary/core";
import { KEYS, getJSON, setJSON } from "../storage";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";

interface Stored {
  total: number;
  target: number;
  phraseId: string;
}

const DEFAULT: Stored = { total: 0, target: 33, phraseId: "subhanallah" };

export function TasbihScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [state, setState] = useState<Stored>(DEFAULT);

  useEffect(() => {
    void getJSON<Stored>(KEYS.tasbih, DEFAULT).then(setState);
  }, []);

  function persist(next: Stored) {
    setState(next);
    void setJSON(KEYS.tasbih, next);
  }

  const view = tasbihState(state.total, state.target);
  const phrase = DHIKR_PHRASES.find((p) => p.id === state.phraseId) ?? DHIKR_PHRASES[0]!;
  const justLapped = view.count === 0 && state.total > 0;

  function tap() {
    persist({ ...state, total: state.total + 1 });
    Vibration.vibrate(view.count + 1 === state.target ? 60 : 12);
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.phraseBox}>
        <Text style={styles.arabic}>{phrase.arabic}</Text>
        <Text style={styles.translit}>
          {phrase.transliteration} — {phrase.meaning}
        </Text>
      </View>

      <Pressable
        style={[styles.dial, justLapped && styles.dialLapped]}
        onPress={tap}
        accessibilityRole="button"
        accessibilityLabel="Count"
      >
        <Text style={[styles.dialCount, justLapped && styles.dialCountLapped]}>
          {justLapped ? state.target : view.count}
        </Text>
        <Text style={styles.dialTarget}>/ {state.target}</Text>
      </Pressable>

      <Text style={styles.rounds}>
        {view.rounds} round{view.rounds === 1 ? "" : "s"} · {view.total} total
      </Text>

      <View style={styles.controls}>
        <View style={styles.pickerRow}>
          <Text style={styles.label}>Dhikr</Text>
          <View style={styles.chips}>
            {DHIKR_PHRASES.map((p) => (
              <Pressable
                key={p.id}
                style={[styles.chip, p.id === state.phraseId && styles.chipOn]}
                onPress={() => persist({ ...state, phraseId: p.id })}
              >
                <Text style={[styles.chipText, p.id === state.phraseId && styles.chipTextOn]}>
                  {p.transliteration}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.pickerRow}>
          <Text style={styles.label}>Target</Text>
          <View style={styles.chips}>
            {TASBIH_TARGETS.map((t) => (
              <Pressable
                key={t}
                style={[styles.chip, t === state.target && styles.chipOn]}
                onPress={() => persist({ ...state, target: t })}
              >
                <Text style={[styles.chipText, t === state.target && styles.chipTextOn]}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable style={styles.resetBtn} onPress={() => persist({ ...state, total: 0 })}>
          <Text style={styles.resetText}>Reset</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { padding: 20, backgroundColor: c.bg, flexGrow: 1, alignItems: "center" },
    phraseBox: { alignItems: "center", marginBottom: 32, gap: 6 },
    arabic: { color: c.fg, fontSize: 28, lineHeight: 44, writingDirection: "rtl", fontFamily: FONT.arSemibold },
    translit: { color: c.muted, fontSize: 14, textAlign: "center" },
    dial: {
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: c.bgElev,
      borderWidth: 3,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    dialLapped: { borderColor: c.accent, backgroundColor: c.accentSoft },
    dialCount: { color: c.fg, fontSize: 64, fontWeight: "700" },
    dialCountLapped: { color: c.accent },
    dialTarget: { color: c.muted, fontSize: 16 },
    rounds: { color: c.muted, fontSize: 14, marginBottom: 32 },
    controls: { width: "100%", gap: 16 },
    pickerRow: { gap: 6 },
    label: { color: c.muted, fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    chipOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    chipText: { color: c.muted, fontSize: 13 },
    chipTextOn: { color: c.accent, fontWeight: "600" },
    resetBtn: {
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
    },
    resetText: { color: c.fg, fontSize: 14 },
  });
}

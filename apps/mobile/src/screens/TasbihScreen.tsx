import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, Vibration, View } from "../Type";
import Svg, { Circle } from "react-native-svg";
import {
  DHIKR_PHRASES,
  TASBIH_TARGETS,
  type TasbihRecord,
  tasbihPhraseProgress,
  tasbihState,
} from "@ummahlibrary/core";
import { mobileTasbihStore as store } from "../tasbih-store";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";

const DEFAULT: TasbihRecord = { phraseId: "subhanallah", phrases: {} };

export function TasbihScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [state, setState] = useState<TasbihRecord>(DEFAULT);

  useEffect(() => {
    void store.read().then((s) => setState(s ?? DEFAULT));
  }, []);

  function persist(next: TasbihRecord) {
    setState(next);
    void store.write(next);
  }

  // Each phrase's own progress — switching the chip below never touches this.
  const progress = tasbihPhraseProgress(state, state.phraseId);
  const view = tasbihState(progress.total, progress.target);
  const phrase = DHIKR_PHRASES.find((p) => p.id === state.phraseId) ?? DHIKR_PHRASES[0]!;
  const justLapped = view.count === 0 && progress.total > 0;

  // Reads/writes via the functional setState form so rapid taps in the same
  // event-loop tick each see the latest count instead of racing on the same
  // stale `progress` closure (which would otherwise only ever apply +1).
  function tap() {
    setState((prev) => {
      const prog = tasbihPhraseProgress(prev, prev.phraseId);
      const next: TasbihRecord = {
        ...prev,
        phrases: { ...prev.phrases, [prev.phraseId]: { ...prog, total: prog.total + 1 } },
      };
      void store.write(next);
      Vibration.vibrate(prog.total + 1 === prog.target ? 60 : 12);
      return next;
    });
  }

  const ringR = 118;
  const ringC = 2 * Math.PI * ringR;
  const pct = Math.min(1, (justLapped ? progress.target : view.count) / progress.target);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {/* Dhikr selector — above the dial, per the mobile design */}
      <View style={styles.dhikrTop}>
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

      <View style={styles.dialWrap}>
        <Svg width={260} height={260} style={styles.ring}>
          <Circle cx={130} cy={130} r={ringR} stroke={colors.border} strokeWidth={10} fill="none" />
          <Circle
            cx={130}
            cy={130}
            r={ringR}
            stroke={colors.accent}
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={ringC}
            strokeDashoffset={ringC * (1 - pct)}
            transform="rotate(-90 130 130)"
          />
        </Svg>
        <Pressable style={styles.dial} onPress={tap} accessibilityRole="button" accessibilityLabel="Count">
          <Text style={styles.dialAr}>{phrase.arabic}</Text>
          <Text style={[styles.dialCount, justLapped && styles.dialCountLapped]}>
            {justLapped ? progress.target : view.count}
          </Text>
          <Text style={styles.dialTarget}>of {progress.target}</Text>
        </Pressable>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{view.rounds}</Text>
          <Text style={styles.statLabel}>Cycles complete</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{view.total}</Text>
          <Text style={styles.statLabel}>Total today</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <View style={styles.pickerRow}>
          <Text style={styles.label}>Target</Text>
          <View style={styles.chips}>
            {TASBIH_TARGETS.map((t) => (
              <Pressable
                key={t}
                style={[styles.chip, t === progress.target && styles.chipOn]}
                onPress={() =>
                  persist({
                    ...state,
                    phrases: { ...state.phrases, [state.phraseId]: { ...progress, target: t } },
                  })
                }
              >
                <Text style={[styles.chipText, t === progress.target && styles.chipTextOn]}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          style={styles.resetBtn}
          onPress={() =>
            persist({
              ...state,
              phrases: { ...state.phrases, [state.phraseId]: { ...progress, total: 0 } },
            })
          }
        >
          <Text style={styles.resetText}>Reset</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { padding: 20, backgroundColor: c.bg, flexGrow: 1, alignItems: "center" },
    dhikrTop: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 8,
      marginBottom: 4,
    },
    dialWrap: { width: 260, height: 260, alignItems: "center", justifyContent: "center", marginTop: 8 },
    ring: { position: "absolute" },
    dial: {
      width: 208,
      height: 208,
      borderRadius: 104,
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    dialAr: {
      color: c.accentHi,
      fontSize: 24,
      writingDirection: "rtl",
      fontFamily: FONT.arSemibold,
      marginBottom: 2,
    },
    dialCount: { color: c.fg, fontSize: 60, fontFamily: FONT.extrabold, letterSpacing: -2, lineHeight: 64 },
    dialCountLapped: { color: c.accent },
    dialTarget: { color: c.faint, fontSize: 13, marginTop: 2 },
    stats: { flexDirection: "row", gap: 44, marginVertical: 28 },
    stat: { alignItems: "center" },
    statValue: { color: c.accent, fontSize: 28, fontFamily: FONT.extrabold, letterSpacing: -1 },
    statLabel: { color: c.faint, fontSize: 12, marginTop: 2 },
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

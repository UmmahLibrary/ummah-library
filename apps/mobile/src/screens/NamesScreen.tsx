import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import type { DivineName } from "@ummahlibrary/core";
import { api } from "../api";
import { KEYS, getJSON, setJSON } from "../storage";
import { FONT } from "../fonts";
import { useTheme, type Palette } from "../theme";

export function NamesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [names, setNames] = useState<DivineName[]>([]);
  const [learned, setLearned] = useState<Record<number, true>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([
      api.listNames(),
      getJSON<Record<number, true>>(KEYS.asmaLearned, {}),
    ]).then(([fetched, saved]) => {
      if (!active) return;
      setNames(fetched);
      setLearned(saved);
      setLoading(false);
    }).catch(() => {
      if (active) { setError(true); setLoading(false); }
    });
    return () => { active = false; };
  }, []);

  function toggle(n: number) {
    setLearned((prev) => {
      const next = { ...prev };
      if (next[n]) delete next[n];
      else next[n] = true;
      void setJSON(KEYS.asmaLearned, next);
      return next;
    });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load names. Check your connection.</Text>
      </View>
    );
  }

  const count = Object.keys(learned).length;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.h1}>99 Names of Allah</Text>
      <Text style={styles.sub}>Asmāʾ al-Ḥusná</Text>

      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(count / names.length) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{count} / {names.length} marked</Text>
      </View>

      {names.map((n) => {
        const done = Boolean(learned[n.number]);
        return (
          <Pressable
            key={n.number}
            style={[styles.card, done && styles.cardDone]}
            onPress={() => toggle(n.number)}
            accessibilityRole="button"
            accessibilityState={{ selected: done }}
          >
            <View style={styles.cardHead}>
              <Text style={[styles.num, done && styles.numDone]}>{n.number}</Text>
              <Text style={[styles.arabic, done && styles.arabicDone]}>{n.arabic}</Text>
            </View>
            <Text style={[styles.translit, done && styles.mutedDone]}>{n.transliteration}</Text>
            <Text style={[styles.meaning, done && styles.mutedDone]}>{n.meaning}</Text>
            {n.description ? (
              <Text style={[styles.desc, done && styles.mutedDone]}>{n.description}</Text>
            ) : null}
            {n.references.length > 0 ? (
              <Text style={[styles.refs, done && styles.mutedDone]}>{n.references.join(" · ")}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { padding: 16, backgroundColor: c.bg, paddingBottom: 32 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.bg },
    errorText: { color: c.error, fontSize: 15, textAlign: "center", paddingHorizontal: 24 },
    h1: { color: c.fg, fontSize: 24, fontWeight: "700", marginBottom: 2 },
    sub: { color: c.muted, fontSize: 14, marginBottom: 16 },
    progressRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
    progressTrack: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.border,
      overflow: "hidden",
    },
    progressFill: { height: 6, borderRadius: 3, backgroundColor: c.accent },
    progressText: { color: c.muted, fontSize: 12, minWidth: 80, textAlign: "right" },
    card: {
      backgroundColor: c.bgElev,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
      marginBottom: 10,
    },
    cardDone: { borderColor: c.accent, backgroundColor: c.accentSoft },
    cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    num: { color: c.muted, fontSize: 13, fontWeight: "600" },
    numDone: { color: c.accent },
    arabic: {
      color: c.fg,
      fontSize: 22,
      lineHeight: 36,
      writingDirection: "rtl",
      fontFamily: FONT.arSemibold,
    },
    arabicDone: { color: c.accent },
    translit: { color: c.fg, fontSize: 15, fontWeight: "600", marginBottom: 2 },
    meaning: { color: c.fg, fontSize: 14, marginBottom: 4 },
    desc: { color: c.muted, fontSize: 13, lineHeight: 19, marginBottom: 4 },
    refs: { color: c.muted, fontSize: 12 },
    mutedDone: { color: c.accent },
  });
}

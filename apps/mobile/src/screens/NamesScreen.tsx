import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import type { DivineName } from "@ummahlibrary/core";
import { Khatam } from "@ummahlibrary/ui";
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
    void Promise.all([api.listNames(), getJSON<Record<number, true>>(KEYS.asmaLearned, {})])
      .then(([fetched, saved]) => {
        if (!active) return;
        setNames(fetched);
        setLearned(saved);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
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
  const featured = names[0];

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.h1}>The 99 Names</Text>
      <Text style={styles.sub}>Al-Asmāʾ al-Ḥusná · {count} of {names.length} learned</Text>

      {featured && (
        <View style={styles.featured}>
          <View style={styles.featuredWatermark} pointerEvents="none">
            <Khatam size={170} color={colors.accent} sw={1} opacity={0.07} />
          </View>
          <Text style={styles.featuredKicker}>1 OF 99</Text>
          <Text style={styles.featuredAr}>{featured.arabic}</Text>
          <Text style={styles.featuredTr}>{featured.transliteration}</Text>
          <Text style={styles.featuredMeaning}>{featured.meaning}</Text>
        </View>
      )}

      <View style={styles.grid}>
        {names.map((n) => {
          const done = Boolean(learned[n.number]);
          return (
            <Pressable
              key={n.number}
              style={[styles.gridCard, done && styles.gridCardDone]}
              onPress={() => toggle(n.number)}
              accessibilityRole="button"
              accessibilityState={{ selected: done }}
            >
              <View style={styles.gridHead}>
                <Text style={styles.num}>{n.number}</Text>
                <Text style={styles.gridAr}>{n.arabic}</Text>
              </View>
              <Text style={styles.translit} numberOfLines={1}>
                {n.transliteration}
              </Text>
              <Text style={styles.meaning} numberOfLines={2}>
                {n.meaning}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { padding: 18, backgroundColor: c.bg, paddingBottom: 32 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.bg },
    errorText: { color: c.error, fontSize: 15, textAlign: "center", paddingHorizontal: 24 },
    h1: { color: c.fg, fontSize: 26, fontFamily: FONT.extrabold, letterSpacing: -0.5, marginTop: 6 },
    sub: { color: c.muted, fontSize: 13.5, marginTop: 2, marginBottom: 18 },
    featured: {
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      overflow: "hidden",
      marginBottom: 18,
    },
    featuredWatermark: { position: "absolute", top: "50%", marginTop: -85 },
    featuredKicker: { color: c.faint, fontSize: 11.5, letterSpacing: 1 },
    featuredAr: { color: c.accentHi, fontSize: 50, fontFamily: FONT.arSemibold, marginVertical: 8 },
    featuredTr: { color: c.fg, fontSize: 22, fontFamily: FONT.extrabold },
    featuredMeaning: { color: c.muted, fontSize: 15, marginTop: 4 },
    grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    gridCard: {
      width: "48%",
      backgroundColor: c.bgElev,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
      marginBottom: 11,
    },
    gridCardDone: { borderColor: c.accent, backgroundColor: c.accentSoft },
    gridHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    num: { color: c.faint, fontSize: 11.5, fontFamily: FONT.bold },
    gridAr: { color: c.accent, fontSize: 22, writingDirection: "rtl", fontFamily: FONT.arSemibold },
    translit: { color: c.fg, fontSize: 14.5, fontFamily: FONT.bold },
    meaning: { color: c.faint, fontSize: 11.5, marginTop: 2, lineHeight: 16 },
  });
}

import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { type ReviewRating, reviewByRating } from "@ummahlibrary/core";
import { api } from "../api";
import { useTheme, type Palette } from "../theme";
import { useLibrary, type HifzRecord } from "../state/LibraryContext";

// Shared per-surah Arabic fetch so a review session makes ≤1 call per surah.
const arabicCache = new Map<number, Promise<Map<number, string>>>();
function loadSurahArabic(surah: number): Promise<Map<number, string>> {
  let pending = arabicCache.get(surah);
  if (!pending) {
    pending = api
      .getSurah(surah)
      .then((d) => new Map(d.ayahs.map((a) => [a.aya, a.text])))
      .catch(() => new Map<number, string>());
    arabicCache.set(surah, pending);
  }
  return pending;
}

const RATINGS: { rating: ReviewRating; label: string; color: keyof Palette }[] = [
  { rating: "again", label: "Again", color: "error" },
  { rating: "hard", label: "Hard", color: "muted" },
  { rating: "good", label: "Good", color: "accent" },
  { rating: "easy", label: "Easy", color: "accent" },
];

export function HifzScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { dueRecords, trackedCount, setHifzCard } = useLibrary();

  const [queue, setQueue] = useState<HifzRecord[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [arabic, setArabic] = useState<string | null>(null);

  // Snapshot the due queue once when the screen mounts.
  useEffect(() => {
    setQueue(dueRecords(new Date()));
    setIndex(0);
  }, []);

  const current = queue[index];

  useEffect(() => {
    if (!current) return;
    setArabic(null);
    let active = true;
    void loadSurahArabic(current.ref.sura).then((m) => {
      if (active) setArabic(m.get(current.ref.aya) ?? "");
    });
    return () => {
      active = false;
    };
  }, [current]);

  function rate(rating: ReviewRating) {
    if (!current) return;
    setHifzCard(current.ref, reviewByRating(current.card, rating, new Date()));
    setRevealed(false);
    setIndex((i) => i + 1);
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.h1}>Hifz</Text>

      {trackedCount === 0 ? (
        <Text style={styles.muted}>
          You aren’t memorizing any āyāt yet. Open a surah and tap ＋ Hifz on an āyah to start.
        </Text>
      ) : !current ? (
        <View style={styles.card}>
          <Text style={styles.doneTitle}>All caught up 🎉</Text>
          <Text style={styles.muted}>
            {trackedCount} āyah{trackedCount === 1 ? "" : "t"} tracked · nothing due right now.
          </Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.progress}>
            Reviewing {index + 1} / {queue.length} due · {trackedCount} tracked
          </Text>
          <Text style={styles.ref}>
            Surah {current.ref.sura} · Āyah {current.ref.aya}
          </Text>

          {revealed ? (
            <Text style={styles.arabic}>{arabic === null ? "…" : arabic}</Text>
          ) : (
            <Pressable style={styles.reveal} onPress={() => setRevealed(true)}>
              <Text style={styles.revealText}>Reveal āyah</Text>
            </Pressable>
          )}

          {revealed && (
            <View style={styles.ratings}>
              {RATINGS.map(({ rating, label, color }) => (
                <Pressable
                  key={rating}
                  style={[styles.rate, { borderColor: colors[color] }]}
                  onPress={() => rate(rating)}
                >
                  <Text style={[styles.rateText, { color: colors[color] }]}>{label}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { padding: 18, backgroundColor: c.bg, flexGrow: 1 },
    h1: { color: c.fg, fontSize: 24, fontWeight: "700", marginBottom: 16 },
    muted: { color: c.muted, fontSize: 15, lineHeight: 22 },
    card: {
      backgroundColor: c.bgElev,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      padding: 18,
    },
    doneTitle: { color: c.fg, fontSize: 18, fontWeight: "700", marginBottom: 6 },
    progress: { color: c.muted, fontSize: 13, marginBottom: 8 },
    ref: { color: c.accent, fontSize: 14, fontWeight: "600", marginBottom: 16 },
    arabic: {
      color: c.fg,
      fontSize: 28,
      lineHeight: 50,
      textAlign: "right",
      writingDirection: "rtl",
      marginVertical: 8,
    },
    reveal: {
      paddingVertical: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
    },
    revealText: { color: c.fg, fontSize: 15, fontWeight: "600" },
    ratings: { flexDirection: "row", gap: 8, marginTop: 16 },
    rate: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: "center",
    },
    rateText: { fontSize: 14, fontWeight: "600" },
  });
}

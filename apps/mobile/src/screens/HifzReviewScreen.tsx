import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { type ReviewRating, reviewByRating } from "@ummahlibrary/core";
import { api } from "../api";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useLibrary, type HifzRecord } from "../state/LibraryContext";
import type { HifzStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<HifzStackParamList, "HifzReview">;

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
  { rating: "easy", label: "Easy", color: "accentHi" },
];

export function HifzReviewScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { ready, dueRecords, trackedCount, setHifzCard, touchStreak } = useLibrary();

  const [queue, setQueue] = useState<HifzRecord[] | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [arabic, setArabic] = useState<string | null>(null);
  const streakTouched = useRef(false);

  // Snapshot the due queue once the local-first store has finished loading, so a
  // cold deep-link to the review screen doesn't capture an empty pre-load state.
  useEffect(() => {
    if (!ready || queue !== null) return;
    setQueue(dueRecords(new Date()));
    setIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const current = queue?.[index];

  useEffect(() => {
    if (!current) return;
    setArabic(null);
    setRevealed(false);
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
    if (!streakTouched.current) {
      touchStreak();
      streakTouched.current = true;
    }
    setIndex((i) => i + 1);
  }

  // ── Still loading the local-first store ───────────────────────────────────
  if (!ready || queue === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const progress = queue.length > 0 ? index / queue.length : 1;

  // ── Nothing tracked ───────────────────────────────────────────────────────
  if (trackedCount === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.doneTitle}>Nothing to review yet</Text>
        <Text style={styles.muted}>
          Open a surah and tap ＋ Hifz on an āyah to start memorizing.
        </Text>
      </View>
    );
  }

  // ── All due cards reviewed ────────────────────────────────────────────────
  if (!current) {
    return (
      <View style={styles.centered}>
        <Text style={styles.celebrate}>🎉</Text>
        <Text style={styles.doneTitle}>All caught up!</Text>
        <Text style={styles.muted}>
          {queue.length > 0
            ? `${queue.length} āyah${queue.length === 1 ? "" : "āt"} reviewed · `
            : ""}
          {trackedCount} tracked in total.
        </Text>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back to dashboard</Text>
        </Pressable>
      </View>
    );
  }

  // ── Active review card ────────────────────────────────────────────────────
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {index} / {queue.length}
        </Text>
      </View>

      <View style={styles.card}>
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
      </View>

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
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { padding: 18, backgroundColor: c.bg, flexGrow: 1, gap: 16 },
    centered: {
      flex: 1,
      backgroundColor: c.bg,
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
      gap: 12,
    },
    celebrate: { fontSize: 44 },
    doneTitle: { color: c.fg, fontSize: 20, fontWeight: "800" },
    muted: { color: c.muted, fontSize: 14.5, lineHeight: 22, textAlign: "center" },
    backBtn: {
      marginTop: 16,
      paddingVertical: 11,
      paddingHorizontal: 20,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: c.accent,
      backgroundColor: c.accentSoft,
    },
    backText: { color: c.accent, fontSize: 14.5, fontWeight: "700" },
    progressRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    progressTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: c.border, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 2, backgroundColor: c.accent },
    progressText: { color: c.faint, fontSize: 12.5 },
    card: {
      backgroundColor: c.bgElev,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      padding: 28,
      alignItems: "center",
      gap: 16,
    },
    ref: { color: c.faint, fontSize: 12.5, letterSpacing: 0.8 },
    arabic: {
      color: c.fg,
      fontSize: 30,
      lineHeight: 56,
      textAlign: "center",
      writingDirection: "rtl",
      fontFamily: FONT.ar,
    },
    reveal: {
      paddingVertical: 13,
      paddingHorizontal: 32,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bg,
    },
    revealText: { color: c.muted, fontSize: 15, fontWeight: "600" },
    ratings: { flexDirection: "row", gap: 8 },
    rate: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: "center",
    },
    rateText: { fontSize: 14, fontWeight: "700" },
  });
}

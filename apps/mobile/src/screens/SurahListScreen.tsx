import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "../Type";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { JUZ_STARTS, TOTAL_JUZ, type Surah } from "@ummahlibrary/core";
import { Icon } from "@ummahlibrary/ui";
import { api, ApiError } from "../api";
import { FONT } from "../fonts";
import { useTheme, type Palette } from "../theme";
import { AyahBadge } from "../components/AyahBadge";
import type { ReadStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<ReadStackParamList, "SurahList">;

/**
 * Normalise surah names for forgiving search. The dataset uses ASCII phonetic
 * spellings with doubled long vowels ("Al-Faatiha", "An-Nisaa"), so a user
 * typing "fatiha" / "nisa" wouldn't match. Lowercase, map any diacritics,
 * drop hamza/ʿayn/apostrophes, and collapse repeated vowels — all without
 * String.normalize (Hermes doesn't implement NFD).
 */
const fold = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[āáàâ]/g, "a")
    .replace(/[īíìî]/g, "i")
    .replace(/[ūúùû]/g, "u")
    .replace(/[ēéè]/g, "e")
    .replace(/[ōóò]/g, "o")
    .replace(/ḥ/g, "h")
    .replace(/ḍ/g, "d")
    .replace(/ṣ/g, "s")
    .replace(/ṭ/g, "t")
    .replace(/ẓ/g, "z")
    .replace(/ṇ/g, "n")
    .replace(/[ʿʾʼʻ'’]/g, "")
    .replace(/([aeiou])\1+/g, "$1")
    .trim();

type Tab = "surah" | "juz" | "rev";
type Row =
  | { kind: "surah"; surah: Surah }
  | { kind: "section"; label: string }
  | { kind: "juz"; juz: number };

/** The last surah a juzʾ touches — the next juzʾ starts at aya 1 of a new surah,
 * or mid-surah (mirrors the web /juz index so the two show the same span). */
function juzEndSura(n: number): number {
  if (n >= TOTAL_JUZ) return 114;
  const next = JUZ_STARTS[n]!;
  return next.aya > 1 ? next.sura : next.sura - 1;
}

/** The Qur'ān index — the Read tab's landing (the home dashboard lives on Home). */
export function SurahListScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [surahs, setSurahs] = useState<Surah[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("surah");

  const load = useCallback(() => {
    setError(null);
    api
      .listSurahs()
      .then(setSurahs)
      .catch((e: unknown) =>
        setError(e instanceof ApiError ? e : new ApiError("Failed", { isNetworkError: true })),
      );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const errorMessage = error
    ? error.isNetworkError
      ? "Couldn't load surahs. Check your connection."
      : error.status && error.status >= 500
        ? "The server is starting up. Try again in a moment."
        : "Couldn't load surahs."
    : null;

  // Fold diacritics so "fatiha" matches "Al-Fātiḥah", "baqarah" matches
  // "Al-Baqarah", etc. — users type surah names without the macrons/dots.
  const q = fold(query);
  // Vowel-collapsing folds any run of a single repeated vowel ("aaa...a") down
  // to one character, however long the run — a 1-character substring is too
  // low-information to filter a ~114-item list and would otherwise match
  // almost everything. Require at least 2 folded characters before doing
  // text substring matching; the numeric surah-number prefix match is exempt
  // since single-digit searches (e.g. "1") are legitimate.
  const textQuery = q.length >= 2 ? q : null;
  const filtered = useMemo(() => {
    const list = surahs ?? [];
    if (!q) return list;
    return list.filter(
      (s) =>
        String(s.number).startsWith(q) ||
        (textQuery !== null &&
          (fold(s.transliteration).includes(textQuery) || fold(s.englishName).includes(textQuery))),
    );
  }, [surahs, q, textQuery]);

  // The list rows depend on the active tab: a flat surah list, the 30 juzʾ, or
  // surahs grouped by place of revelation (Meccan / Medinan).
  const rows = useMemo<Row[]>(() => {
    if (tab === "juz") {
      const all = Array.from({ length: TOTAL_JUZ }, (_, i) => i + 1);
      if (!q) return all.map((juz) => ({ kind: "juz", juz }));
      // The search box promises "surah, juz or verse" — a juzʾ matches by its own
      // number (like a surah does) or by containing a surah that matches the text
      // query, so searching a surah name also surfaces the juzʾ(s) it spans.
      const filteredNumbers = new Set(filtered.map((s) => s.number));
      return all
        .filter((juz) => {
          if (String(juz).startsWith(q)) return true;
          const start = JUZ_STARTS[juz - 1]!.sura;
          const end = juzEndSura(juz);
          for (let n = start; n <= end; n++) if (filteredNumbers.has(n)) return true;
          return false;
        })
        .map((juz) => ({ kind: "juz", juz }));
    }
    if (tab === "rev") {
      const out: Row[] = [];
      const meccan = filtered.filter((s) => s.revelationPlace === "meccan");
      const medinan = filtered.filter((s) => s.revelationPlace === "medinan");
      if (meccan.length) {
        out.push({ kind: "section", label: "Meccan" });
        meccan.forEach((s) => out.push({ kind: "surah", surah: s }));
      }
      if (medinan.length) {
        out.push({ kind: "section", label: "Medinan" });
        medinan.forEach((s) => out.push({ kind: "surah", surah: s }));
      }
      return out;
    }
    return filtered.map((s) => ({ kind: "surah", surah: s }));
  }, [tab, filtered, q]);

  // Surah lookup for the juzʾ tab's span labels ("Al-Fātiḥah – Al-Baqarah").
  const byNumber = useMemo(() => new Map((surahs ?? []).map((s) => [s.number, s])), [surahs]);

  const open = (surah: number) => navigation.navigate("SurahReader", { surah });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FlatList
        data={rows}
        keyExtractor={(r) =>
          r.kind === "surah" ? `s${r.surah.number}` : r.kind === "juz" ? `j${r.juz}` : `h${r.label}`
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <Text style={styles.h1}>Qur'ān</Text>
              <Pressable
                onPress={() => navigation.navigate("Search")}
                hitSlop={10}
                accessibilityLabel="Search verses, names, and adhkār"
              >
                <Icon name="search" size={22} color={colors.accent} sw={1.8} />
              </Pressable>
            </View>
            <TextInput
              style={styles.search}
              placeholder="Search surah, juz or verse"
              placeholderTextColor={colors.faint}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
            />
            <View style={styles.seg}>
              {([
                { v: "surah", l: "Surah" },
                { v: "juz", l: "Juzʾ" },
                { v: "rev", l: "Revelation" },
              ] as const).map((o) => (
                <Pressable
                  key={o.v}
                  style={[styles.segItem, tab === o.v && styles.segItemOn]}
                  onPress={() => setTab(o.v)}
                >
                  <Text style={[styles.segText, tab === o.v && styles.segTextOn]}>{o.l}</Text>
                </Pressable>
              ))}
            </View>
            {error && tab === "surah" && (
              <View style={styles.errorRow}>
                <Text style={styles.error}>{errorMessage}</Text>
                <Pressable style={styles.chip} onPress={load}>
                  <Text style={styles.chipText}>Try again</Text>
                </Pressable>
              </View>
            )}
            {!surahs && !error && <ActivityIndicator color={colors.accent} style={styles.spinner} />}
          </View>
        }
        ListEmptyComponent={
          surahs && q ? (
            <Text style={styles.muted}>
              No {tab === "juz" ? "juzʾ" : "surahs"} match “{query}”.
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          if (item.kind === "section") {
            return <Text style={styles.sectionLabel}>{item.label}</Text>;
          }
          if (item.kind === "juz") {
            const start = JUZ_STARTS[item.juz - 1]!;
            const first = byNumber.get(start.sura);
            const lastSura = juzEndSura(item.juz);
            const last = byNumber.get(lastSura);
            const span = !first
              ? "Read continuously"
              : lastSura === start.sura
                ? first.transliteration
                : `${first.transliteration} – ${last?.transliteration ?? ""}`;
            return (
              <Pressable
                style={styles.row}
                onPress={() => navigation.navigate("JuzReader", { juz: item.juz })}
              >
                <View style={styles.juzBadge}>
                  <Text style={styles.juzBadgeText}>{item.juz}</Text>
                </View>
                <View style={styles.rowMeta}>
                  <Text style={styles.rowTitle}>Juzʾ {item.juz}</Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {span}
                  </Text>
                </View>
              </Pressable>
            );
          }
          const s = item.surah;
          return (
            <Pressable style={styles.row} onPress={() => open(s.number)}>
              <AyahBadge n={s.number} size={40} />
              <View style={styles.rowMeta}>
                <Text style={styles.rowTitle}>{s.transliteration}</Text>
                <Text style={styles.rowSub}>
                  {s.revelationPlace === "meccan" ? "Meccan" : "Medinan"} · {s.ayahCount} verses
                </Text>
              </View>
              <Text style={styles.rowArabic}>{s.name}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    listContent: { paddingHorizontal: 18, paddingBottom: 32 },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 8,
      marginBottom: 14,
    },
    h1: { color: c.fg, fontSize: 30, fontFamily: FONT.extrabold, letterSpacing: -0.6 },
    search: {
      backgroundColor: c.bgElev,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      color: c.fg,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      marginBottom: 14,
    },
    seg: {
      flexDirection: "row",
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      padding: 3,
      marginBottom: 6,
    },
    segItem: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: "center" },
    segItemOn: { backgroundColor: c.accent },
    segText: { color: c.muted, fontSize: 13, fontFamily: FONT.semibold },
    segTextOn: { color: c.ink, fontFamily: FONT.bold },
    sectionLabel: {
      color: c.faint,
      fontSize: 12,
      letterSpacing: 1,
      textTransform: "uppercase",
      fontFamily: FONT.bold,
      marginTop: 18,
      marginBottom: 4,
    },
    error: { color: c.error, flexShrink: 1 },
    errorRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      marginTop: 12,
    },
    chip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipText: { color: c.muted, fontSize: 13 },
    muted: { color: c.muted, marginTop: 16, fontSize: 14 },
    spinner: { marginTop: 32 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 13,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSoft,
    },
    rowMeta: { flex: 1, minWidth: 0 },
    rowTitle: { color: c.fg, fontSize: 16, fontFamily: FONT.bold },
    rowSub: { color: c.faint, fontSize: 13, marginTop: 2 },
    rowArabic: { color: c.accentHi, fontSize: 22, writingDirection: "rtl", fontFamily: FONT.arSemibold },
    juzBadge: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: c.accentSoft,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    juzBadgeText: { color: c.accent, fontSize: 15, fontFamily: FONT.bold },
  });
}

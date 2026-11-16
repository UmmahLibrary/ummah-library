import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "../Type";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { JUZ_STARTS, TOTAL_JUZ, type Surah } from "@ummahlibrary/core";
import { Chip, Icon, ListRow, NumberBadge, Seg } from "@ummahlibrary/ui";
import { QURAN_LINKS, goTo } from "../navigation/routes";
import { api, ApiError } from "../api";
import { FONT } from "../fonts";
import { useTheme, type Palette } from "../theme";
import type { ReadStackParamList } from "../navigation/types";
import { useIntl } from "../i18n/I18nProvider";

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
  const { t, tf, num, dir, locale, script } = useIntl();
  const rtl = dir === "rtl";
  // Shared rows lay out right to left (and use the Arabic face) in Arabic/Urdu.
  const rowScript = script;
  // Rows become cards from 700dp (adaptive ListRow); phone rows keep a small edge.
  const wide = useWindowDimensions().width >= 700;
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
      ? t("rd.list.errNetwork")
      : error.status && error.status >= 500
        ? t("rd.errServer")
        : t("rd.list.err")
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
        out.push({ kind: "section", label: t("rd.meccan") });
        meccan.forEach((s) => out.push({ kind: "surah", surah: s }));
      }
      if (medinan.length) {
        out.push({ kind: "section", label: t("rd.medinan") });
        medinan.forEach((s) => out.push({ kind: "surah", surah: s }));
      }
      return out;
    }
    return filtered.map((s) => ({ kind: "surah", surah: s }));
  }, [tab, filtered, q, t]);

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
              <Text style={[styles.h1, rtl && styles.noTrack]}>{t("rd.list.title")}</Text>
              <Pressable
                onPress={() => navigation.navigate("Search")}
                hitSlop={10}
                accessibilityLabel={t("rd.list.searchA11y")}
              >
                <Icon name="search" size={22} color={colors.accent} sw={1.8} />
              </Pressable>
            </View>
            {/* The rest of the Quran group, as on web (ADR 0042). */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.links}
            >
              {QURAN_LINKS.map((l) => (
                <Chip
                  key={l.screen}
                  icon={l.icon}
                  script={rowScript}
                  onPress={() => goTo(navigation, l.screen)}
                >
                  {t(l.title)}
                </Chip>
              ))}
            </ScrollView>
            <TextInput
              style={styles.search}
              placeholder={t("rd.list.searchPh")}
              placeholderTextColor={colors.faint}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
            />
            <View style={styles.seg}>
              <Seg
                script={script}
                value={tab}
                onChange={(v) => setTab(v as typeof tab)}
                options={[
                  { value: "surah", label: t("rd.surah") },
                  { value: "juz", label: t("rd.juz") },
                  { value: "rev", label: t("rd.list.revelation") },
                ]}
              />
            </View>
            {error && tab === "surah" && (
              <View style={styles.errorRow}>
                <Text style={styles.error}>{errorMessage}</Text>
                <Pressable style={styles.chip} onPress={load}>
                  <Text style={styles.chipText}>{t("rd.tryAgain")}</Text>
                </Pressable>
              </View>
            )}
            {!surahs && !error && (
              <ActivityIndicator color={colors.accent} style={styles.spinner} />
            )}
          </View>
        }
        ListEmptyComponent={
          surahs && q ? (
            <Text style={styles.muted}>
              {tf(tab === "juz" ? "rd.list.noJuz" : "rd.list.noSurahs", { q: query })}
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          if (item.kind === "section") {
            return <Text style={[styles.sectionLabel, rtl && styles.noTrack]}>{item.label}</Text>;
          }
          if (item.kind === "juz") {
            const start = JUZ_STARTS[item.juz - 1]!;
            const first = byNumber.get(start.sura);
            const lastSura = juzEndSura(item.juz);
            const last = byNumber.get(lastSura);
            const span = !first
              ? t("rd.list.readContinuously")
              : lastSura === start.sura
                ? first.transliteration
                : `${first.transliteration} – ${last?.transliteration ?? ""}`;
            return (
              <ListRow
                surface="adaptive"
                truncate
                style={wide ? undefined : styles.listRow}
                script={rowScript}
                onPress={() => navigation.navigate("JuzReader", { juz: item.juz })}
                leading={
                  <View style={styles.juzBadge}>
                    <Text style={styles.juzBadgeText}>{num(item.juz)}</Text>
                  </View>
                }
                title={tf("rd.juzN", { n: item.juz })}
                subtitle={span}
              />
            );
          }
          const s = item.surah;
          return (
            <ListRow
              surface="adaptive"
              truncate
              style={wide ? undefined : styles.listRow}
              script={rowScript}
              onPress={() => open(s.number)}
              leading={<NumberBadge n={num(s.number)} />}
              title={s.transliteration}
              subtitle={[
                locale === "en" ? s.englishName : null,
                tf("rd.versesCount", { n: s.ayahCount }),
                s.revelationPlace === "meccan" ? t("rd.meccan") : t("rd.medinan"),
              ]
                .filter(Boolean)
                .join(" · ")}
              trailing={<Text style={styles.rowArabic}>{s.name}</Text>}
            />
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
    links: { gap: 8, paddingBottom: 12 },
    // The shared Seg draws its own track; this only spaces it.
    seg: { marginBottom: 6 },
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
    // The list already has the screen gutter; rows keep a small inner edge.
    listRow: { paddingHorizontal: 4 },
    rowArabic: {
      color: c.accentHi,
      fontSize: 22,
      writingDirection: "rtl",
      fontFamily: FONT.arSemibold,
    },
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
    // Arabic/Urdu interface text must not be letter-spaced (it breaks the joins).
    noTrack: { letterSpacing: 0 },
  });
}

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { searchText, type Surah } from "@ummahlibrary/core";
import { api } from "../api";
import { useTheme, type Palette } from "../theme";
import { KEYS, getJSON, setJSON } from "../storage";
import type { ReadStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<ReadStackParamList, "Search">;

const ENGLISH_URL =
  "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/eng-mustafakhattaba.min.json";
const MAX_HISTORY = 6;
const TOPICS = ["mercy", "patience", "Mulk", "forgiveness", "knowledge", "guidance", "light"];

type ResultType = "ayah" | "surah" | "name" | "adhkar";

interface SearchItem {
  type: ResultType;
  text: string; // haystack core's searchText folds
  title: string;
  ar?: string;
  sub?: string;
  ref: string;
  surah?: number; // ayah / surah navigation target
}

const TYPE_LABEL: Record<ResultType, string> = {
  ayah: "Verse",
  surah: "Surah",
  name: "Name of Allah",
  adhkar: "Adhkār",
};

const FILTERS: { key: "all" | ResultType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "ayah", label: "Quran" },
  { key: "name", label: "Names" },
  { key: "adhkar", label: "Adhkār" },
];

// The unified index is large (~6k āyāt × 2 languages); build it once per session.
let indexCache: Promise<SearchItem[]> | null = null;

async function buildIndex(surahs: Surah[]): Promise<SearchItem[]> {
  const labelFor = new Map(surahs.map((s) => [s.number, `${s.transliteration} · ${s.englishName}`]));
  const items: SearchItem[] = [];

  for (const s of surahs) {
    items.push({
      type: "surah",
      text: `${s.transliteration} ${s.englishName} surah ${s.number}`,
      title: s.transliteration,
      ar: s.name,
      sub: `${s.englishName} · ${s.ayahCount} āyāt`,
      ref: `Surah ${s.number}`,
      surah: s.number,
    });
  }

  const [arabic, english, names, adhkar] = await Promise.all([
    api.getSearchCorpus().catch(() => [] as { s: number; a: number; t: string }[]),
    fetch(ENGLISH_URL)
      .then((r) =>
        r.ok
          ? (r.json() as Promise<{ quran: { chapter: number; verse: number; text: string }[] }>)
          : null,
      )
      .catch(() => null),
    api.listNames().catch(() => []),
    api.listAdhkar().catch(() => []),
  ]);

  for (const v of arabic) {
    items.push({
      type: "ayah",
      text: v.t,
      title: "",
      ar: v.t,
      ref: `${labelFor.get(v.s) ?? `Surah ${v.s}`} · ${v.s}:${v.a}`,
      surah: v.s,
    });
  }
  for (const v of english?.quran ?? []) {
    items.push({
      type: "ayah",
      text: v.text,
      title: v.text,
      ref: `${labelFor.get(v.chapter) ?? `Surah ${v.chapter}`} · ${v.chapter}:${v.verse}`,
      surah: v.chapter,
    });
  }
  for (const n of names) {
    items.push({
      type: "name",
      text: `${n.transliteration} ${n.meaning}`,
      title: n.transliteration,
      ar: n.arabic,
      sub: n.meaning,
      ref: `Name ${n.number} of 99`,
    });
  }
  for (const d of adhkar) {
    items.push({
      type: "adhkar",
      text: `${d.translation} ${d.transliteration}`,
      title: d.translation,
      ar: d.arabic,
      sub: d.occasions.map((o) => o[0]?.toUpperCase() + o.slice(1)).join(" · ") || "Adhkār",
      ref: "Adhkār",
    });
  }

  return items;
}

export function SearchScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | ResultType>("all");
  const [results, setResults] = useState<(SearchItem & { score: number })[]>([]);
  const [indexReady, setIndexReady] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const indexRef = useRef<SearchItem[] | null>(null);
  const queryRef = useRef("");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void getJSON<string[]>(KEYS.searchHistory, []).then(setHistory);
    if (!indexCache) indexCache = api.listSurahs().then(buildIndex);
    let active = true;
    void indexCache.then((items) => {
      if (!active) return;
      indexRef.current = items;
      setIndexReady(true);
      // The user may have typed before the index finished — search now.
      const pending = queryRef.current.trim();
      if (pending.length >= 2) setResults(searchText(items, pending, 60));
    });
    return () => {
      active = false;
    };
  }, []);

  const q = query.trim();

  function run(value: string) {
    setQuery(value);
    queryRef.current = value;
    setFilter("all");
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      const index = indexRef.current;
      setResults(index && value.trim().length >= 2 ? searchText(index, value, 60) : []);
    }, 160);
  }

  function remember(value: string) {
    const trimmed = value.trim();
    if (trimmed.length < 2) return;
    const next = [trimmed, ...history.filter((h) => h !== trimmed)].slice(0, MAX_HISTORY);
    setHistory(next);
    void setJSON(KEYS.searchHistory, next);
  }

  function openResult(r: SearchItem) {
    remember(q);
    if ((r.type === "ayah" || r.type === "surah") && r.surah) {
      navigation.navigate("SurahReader", { surah: r.surah });
    } else if (r.type === "name") {
      navigation.getParent()?.navigate("Names");
    } else if (r.type === "adhkar") {
      navigation.getParent()?.navigate("Tools", { screen: "Adhkar" });
    }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: results.length };
    for (const r of results) {
      const k = r.type === "surah" ? "ayah" : r.type;
      c[k] = (c[k] ?? 0) + 1;
    }
    return c;
  }, [results]);

  const filtered =
    filter === "all"
      ? results
      : results.filter((r) => r.type === filter || (filter === "ayah" && r.type === "surah"));

  return (
    <View style={styles.screen}>
      <View style={styles.field}>
        <Text style={styles.fieldIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder="Search verses, names, adhkār…"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={run}
          onBlur={() => remember(query)}
          autoFocus
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable onPress={() => run("")} hitSlop={8}>
            <Text style={styles.clear}>✕</Text>
          </Pressable>
        )}
      </View>

      {q.length >= 2 && (
        <View style={styles.filters}>
          {FILTERS.map((f) => {
            const count = counts[f.key] ?? 0;
            if (f.key !== "all" && !count) return null;
            const on = filter === f.key;
            return (
              <Pressable
                key={f.key}
                style={[styles.pill, on && styles.pillOn]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={[styles.pillText, on && styles.pillTextOn]}>
                  {f.label} {count}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {q.length < 2 ? (
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {history.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Recent</Text>
              <View style={styles.chipWrap}>
                {history.map((h) => (
                  <Pressable key={h} style={styles.chip} onPress={() => run(h)}>
                    <Text style={styles.chipText}>↺ {h}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
          <Text style={styles.sectionLabel}>Try a topic</Text>
          <View style={styles.chipWrap}>
            {TOPICS.map((t) => (
              <Pressable key={t} style={styles.chip} onPress={() => run(t)}>
                <Text style={styles.chipText}>{t}</Text>
              </Pressable>
            ))}
          </View>
          {!indexReady && (
            <View style={styles.indexing}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.muted}>Building search index…</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.resultMeta}>
            {!indexReady
              ? "Searching…"
              : `${filtered.length} result${filtered.length !== 1 ? "s" : ""} for “${q}”`}
          </Text>
          {filtered.map((r, i) => (
            <Pressable key={`${r.type}:${r.ref}:${i}`} style={styles.card} onPress={() => openResult(r)}>
              <View style={styles.cardHead}>
                <Text style={styles.badge}>{TYPE_LABEL[r.type]}</Text>
                <Text style={styles.cardRef}>{r.ref}</Text>
              </View>
              {r.ar ? (
                <Text style={[styles.cardAr, r.type === "name" && styles.cardArName]}>{r.ar}</Text>
              ) : null}
              {r.title ? (
                <Text style={[styles.cardTitle, r.type === "name" && styles.cardTitleName]} numberOfLines={3}>
                  {r.title}
                </Text>
              ) : null}
              {r.sub ? <Text style={styles.cardSub}>{r.sub}</Text> : null}
            </Pressable>
          ))}
          {indexReady && filtered.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nothing found</Text>
              <Text style={styles.muted}>Try another word, or a topic like “mercy”.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg, padding: 16 },
    field: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      paddingHorizontal: 16,
      height: 52,
    },
    fieldIcon: { fontSize: 16 },
    input: { flex: 1, color: c.fg, fontSize: 16 },
    clear: { color: c.faint, fontSize: 16, paddingHorizontal: 4 },
    filters: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
    pill: {
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    pillOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    pillText: { color: c.muted, fontSize: 13 },
    pillTextOn: { color: c.accent, fontWeight: "700" },
    body: { paddingTop: 16, paddingBottom: 40, gap: 10 },
    sectionLabel: {
      color: c.faint,
      fontSize: 12,
      letterSpacing: 1,
      textTransform: "uppercase",
      fontWeight: "700",
      marginTop: 8,
    },
    chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
    chip: {
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 15,
    },
    chipText: { color: c.fg, fontSize: 14 },
    indexing: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 24 },
    resultMeta: { color: c.muted, fontSize: 13.5, marginBottom: 4 },
    card: {
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 16,
    },
    cardHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    badge: {
      color: c.accent,
      fontSize: 11.5,
      fontWeight: "700",
      backgroundColor: c.accentSoft,
      borderWidth: 1,
      borderColor: c.accent,
      borderRadius: 999,
      paddingVertical: 2,
      paddingHorizontal: 9,
      overflow: "hidden",
    },
    cardRef: { color: c.accent, fontSize: 12.5, fontWeight: "600", flexShrink: 1, textAlign: "right" },
    cardAr: { color: c.fg, fontSize: 21, lineHeight: 38, textAlign: "right", writingDirection: "rtl" },
    cardArName: { fontSize: 26, marginBottom: 2 },
    cardTitle: { color: c.muted, fontSize: 15, lineHeight: 23, marginTop: 8 },
    cardTitleName: { color: c.accent, fontWeight: "700", marginTop: 2 },
    cardSub: { color: c.faint, fontSize: 12.5, marginTop: 6 },
    empty: { alignItems: "center", paddingVertical: 50, gap: 6 },
    emptyTitle: { color: c.fg, fontSize: 17, fontWeight: "700" },
    muted: { color: c.muted, fontSize: 14 },
  });
}

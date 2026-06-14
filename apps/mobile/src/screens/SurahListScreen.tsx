import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "../Type";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { TOTAL_JUZ, TOTAL_SURAHS, type Surah } from "@ummahlibrary/core";
import { Icon } from "@ummahlibrary/ui";
import { api } from "../api";
import { FONT } from "../fonts";
import { useTheme, type Palette } from "../theme";
import { useLibrary } from "../state/LibraryContext";
import type { ReadStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<ReadStackParamList, "SurahList">;

export function SurahListScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { lastRead, bookmarks } = useLibrary();
  const [surahs, setSurahs] = useState<Surah[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api
      .listSurahs()
      .then(setSurahs)
      .catch(() => setError(true));
  }, []);

  const byNumber = useMemo(() => new Map((surahs ?? []).map((s) => [s.number, s])), [surahs]);
  const last = lastRead !== null ? byNumber.get(lastRead) : undefined;

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    const list = surahs ?? [];
    if (!q) return list;
    return list.filter(
      (s) =>
        String(s.number).startsWith(q) ||
        s.transliteration.toLowerCase().includes(q) ||
        s.englishName.toLowerCase().includes(q),
    );
  }, [surahs, q]);

  const open = (surah: number) => navigation.navigate("SurahReader", { surah });

  return (
    <View style={styles.screen}>
      <FlatList
        data={filtered}
        keyExtractor={(s) => String(s.number)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <Text style={styles.h1}>Ummah Library</Text>
            <Text style={styles.subtitle}>Read the Quran · {TOTAL_SURAHS} surahs</Text>

            <Pressable style={styles.searchBar} onPress={() => navigation.navigate("Search")}>
              <Icon name="search" size={18} color={colors.muted} sw={1.8} />
              <Text style={styles.searchBarText}>Search verses, names, adhkār…</Text>
            </Pressable>

            <Pressable style={styles.savedLink} onPress={() => navigation.navigate("Collections")}>
              <Text style={styles.savedText}>★ Saved verses & collections</Text>
              <Text style={styles.savedArrow}>›</Text>
            </Pressable>

            {last && (
              <Pressable style={styles.continue} onPress={() => open(last.number)}>
                <Text style={styles.continueLabel}>Continue reading</Text>
                <Text style={styles.continueSurah}>
                  {last.transliteration} · {last.englishName}
                </Text>
              </Pressable>
            )}

            {bookmarks.length > 0 && (
              <View style={styles.bookmarks}>
                <Text style={styles.shelfLabel}>Bookmarked surahs</Text>
                <View style={styles.chipRow}>
                  {bookmarks.map((n) => {
                    const s = byNumber.get(n);
                    return s ? (
                      <Pressable key={n} style={styles.chip} onPress={() => open(n)}>
                        <Text style={styles.chipText}>{s.transliteration}</Text>
                      </Pressable>
                    ) : null;
                  })}
                </View>
              </View>
            )}

            <View style={styles.juzBlock}>
              <Text style={styles.shelfLabel}>Browse by Juzʾ</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {Array.from({ length: TOTAL_JUZ }, (_, i) => i + 1).map((j) => (
                  <Pressable
                    key={j}
                    style={styles.juzChip}
                    onPress={() => navigation.navigate("JuzReader", { juz: j })}
                  >
                    <Text style={styles.chipText}>{j}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <TextInput
              style={styles.search}
              placeholder="Filter this list by name or number…"
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
            />
            {error && <Text style={styles.error}>Couldn’t load surahs. Check your connection.</Text>}
            {!surahs && !error && <ActivityIndicator color={colors.accent} style={styles.spinner} />}
          </View>
        }
        ListEmptyComponent={
          surahs && q ? <Text style={styles.muted}>No surahs match “{query}”.</Text> : null
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => open(item.number)}>
            <View style={styles.num}>
              <Text style={styles.numText}>{item.number}</Text>
            </View>
            <View style={styles.rowMeta}>
              <Text style={styles.rowTitle}>{item.transliteration}</Text>
              <Text style={styles.rowSub}>
                {item.englishName} · {item.ayahCount} āyāt
              </Text>
            </View>
            <Text style={styles.rowArabic}>{item.name}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    listContent: { paddingHorizontal: 18, paddingBottom: 32 },
    h1: { color: c.fg, fontSize: 26, fontFamily: FONT.extrabold, marginTop: 8 },
    subtitle: { color: c.muted, fontSize: 14, marginBottom: 14 },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: c.bgElev,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 14,
    },
    searchBarIcon: { fontSize: 15 },
    searchBarText: { color: c.muted, fontSize: 15 },
    savedLink: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
      marginBottom: 14,
    },
    savedText: { color: c.fg, fontSize: 14.5, fontWeight: "600" },
    savedArrow: { color: c.muted, fontSize: 18 },
    continue: {
      backgroundColor: c.bgElev,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    continueLabel: { color: c.accent, fontSize: 12, fontWeight: "600", marginBottom: 4 },
    continueSurah: { color: c.fg, fontSize: 16, fontWeight: "600" },
    bookmarks: { marginBottom: 14 },
    shelfLabel: { color: c.muted, fontSize: 12, fontWeight: "600", marginBottom: 8 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipText: { color: c.fg, fontSize: 13 },
    juzBlock: { marginBottom: 14 },
    juzChip: {
      minWidth: 38,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
    },
    search: {
      backgroundColor: c.bgElev,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      color: c.fg,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 15,
      marginBottom: 12,
    },
    error: { color: c.error, marginTop: 12 },
    muted: { color: c.muted, marginTop: 16, fontSize: 14 },
    spinner: { marginTop: 32 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    num: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: c.bgElev,
      alignItems: "center",
      justifyContent: "center",
    },
    numText: { color: c.accent, fontSize: 13 },
    rowMeta: { flex: 1 },
    rowTitle: { color: c.fg, fontSize: 16, fontFamily: FONT.semibold },
    rowSub: { color: c.muted, fontSize: 12 },
    rowArabic: { color: c.fg, fontSize: 22, writingDirection: "rtl", fontFamily: FONT.arSemibold },
  });
}

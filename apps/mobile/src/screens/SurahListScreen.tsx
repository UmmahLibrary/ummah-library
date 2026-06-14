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
import { Icon, type IconName } from "@ummahlibrary/ui";
import { api } from "../api";
import { FONT } from "../fonts";
import { useTheme, type Palette } from "../theme";
import { useLibrary } from "../state/LibraryContext";
import type { ReadStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<ReadStackParamList, "SurahList">;

/** A small curated set rotated daily for "Verse of the day". */
const VERSES: { ar: string; en: string; ref: string }[] = [
  {
    ar: "ٱلَّذِينَ ءَامَنُوا۟ وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ ٱللَّهِ ۗ أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ",
    en: "Those who believe and whose hearts find rest in the remembrance of Allah. Verily, in the remembrance of Allah do hearts find rest.",
    ref: "Ar-Raʿd 13:28",
  },
  {
    ar: "فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا",
    en: "For indeed, with hardship comes ease.",
    ref: "Ash-Sharḥ 94:5",
  },
  {
    ar: "وَمَن يَتَّقِ ٱللَّهَ يَجْعَل لَّهُۥ مَخْرَجًا",
    en: "And whoever is mindful of Allah, He will make for them a way out.",
    ref: "Aṭ-Ṭalāq 65:2",
  },
  {
    ar: "وَقُل رَّبِّ زِدْنِى عِلْمًا",
    en: "And say, “My Lord, increase me in knowledge.”",
    ref: "Ṭā-Hā 20:114",
  },
  {
    ar: "إِنَّ ٱللَّهَ مَعَ ٱلصَّـٰبِرِينَ",
    en: "Indeed, Allah is with the patient.",
    ref: "Al-Baqara 2:153",
  },
];

function verseOfToday() {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
  return VERSES[dayOfYear % VERSES.length]!;
}

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
  const vod = verseOfToday();

  const quickTools: { label: string; icon: IconName; onPress: () => void }[] = [
    { label: "Tafsir", icon: "tafsir", onPress: () => navigation.navigate("Tafsir") },
    { label: "Mushaf", icon: "book", onPress: () => navigation.navigate("MushafPage", { page: 1 }) },
    {
      label: "Prayer",
      icon: "home",
      onPress: () => navigation.getParent()?.navigate("Tools", { screen: "PrayerTimes" }),
    },
    {
      label: "Qibla",
      icon: "compass",
      onPress: () => navigation.getParent()?.navigate("Tools", { screen: "Qibla" }),
    },
  ];

  return (
    <View style={styles.screen}>
      <FlatList
        data={filtered}
        keyExtractor={(s) => String(s.number)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <Text style={styles.greeting}>As-salāmu ʿalaykum 🌙</Text>
            <Text style={styles.h1}>Ummah Library</Text>
            <Text style={styles.subtitle}>Read the Quran · {TOTAL_SURAHS} surahs</Text>

            <Pressable style={styles.searchBar} onPress={() => navigation.navigate("Search")}>
              <Icon name="search" size={18} color={colors.muted} sw={1.8} />
              <Text style={styles.searchBarText}>Search verses, names, adhkār…</Text>
            </Pressable>

            <View style={styles.quickRow}>
              <Pressable style={styles.quickLink} onPress={() => navigation.navigate("Collections")}>
                <Icon name="bookmark" size={17} color={colors.accent} sw={1.8} />
                <Text style={styles.quickText}>Saved verses</Text>
              </Pressable>
              <Pressable style={styles.quickLink} onPress={() => navigation.navigate("ReadingGoals")}>
                <Icon name="check" size={17} color={colors.accent} sw={1.8} />
                <Text style={styles.quickText}>Reading goals</Text>
              </Pressable>
            </View>

            {last && (
              <Pressable style={styles.continue} onPress={() => open(last.number)}>
                <View style={styles.continueLeft}>
                  <Text style={styles.continueLabel}>Continue reading</Text>
                  <Text style={styles.continueSurah}>{last.transliteration}</Text>
                  <Text style={styles.continueSub}>
                    {last.englishName} · {last.ayahCount} āyāt · Resume →
                  </Text>
                </View>
                <Text style={styles.continueAr}>{last.name}</Text>
              </Pressable>
            )}

            <View style={styles.vodCard}>
              <Text style={styles.vodLabel}>Verse of the day</Text>
              <Text style={styles.vodAr}>{vod.ar}</Text>
              <Text style={styles.vodEn}>{vod.en}</Text>
              <Text style={styles.vodRef}>{vod.ref}</Text>
            </View>

            <View style={styles.toolsStrip}>
              {quickTools.map((t) => (
                <Pressable key={t.label} style={styles.toolCard} onPress={t.onPress}>
                  <Icon name={t.icon} size={18} color={colors.accent} sw={1.8} />
                  <Text style={styles.toolLabel}>{t.label}</Text>
                </Pressable>
              ))}
            </View>

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
    quickRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
    quickLink: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    quickText: { color: c.fg, fontSize: 14, fontFamily: FONT.semibold },
    greeting: { color: c.muted, fontSize: 13.5, marginTop: 8, marginBottom: 2 },
    continue: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: c.bgElev,
      borderRadius: 14,
      padding: 18,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    continueLeft: { flex: 1, minWidth: 0 },
    continueLabel: {
      color: c.faint,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: "uppercase",
      fontFamily: FONT.bold,
      marginBottom: 6,
    },
    continueSurah: { color: c.fg, fontSize: 20, fontFamily: FONT.extrabold, letterSpacing: -0.5 },
    continueSub: { color: c.muted, fontSize: 13, marginTop: 3 },
    continueAr: { color: c.accentHi, fontSize: 32, marginLeft: 12 },
    vodCard: {
      backgroundColor: c.bgElev,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      padding: 18,
      marginBottom: 12,
      gap: 8,
    },
    vodLabel: {
      color: c.accent,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: "uppercase",
      fontFamily: FONT.bold,
    },
    vodAr: { color: c.fg, fontSize: 22, lineHeight: 40, textAlign: "right", writingDirection: "rtl" },
    vodEn: { color: c.muted, fontSize: 14, lineHeight: 21 },
    vodRef: { color: c.accent, fontSize: 13, fontFamily: FONT.semibold },
    toolsStrip: { flexDirection: "row", gap: 8, marginBottom: 14 },
    toolCard: {
      flex: 1,
      alignItems: "center",
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    toolLabel: { color: c.fg, fontSize: 12, fontFamily: FONT.semibold },
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

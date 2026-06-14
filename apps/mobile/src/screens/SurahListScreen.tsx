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
import { TOTAL_JUZ, type Surah } from "@ummahlibrary/core";
import { api } from "../api";
import { FONT } from "../fonts";
import { useTheme, type Palette } from "../theme";
import { AyahBadge } from "../components/AyahBadge";
import type { ReadStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<ReadStackParamList, "SurahList">;

/** The Qur'ān index — the Read tab's landing (the home dashboard lives on Home). */
export function SurahListScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [surahs, setSurahs] = useState<Surah[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api
      .listSurahs()
      .then(setSurahs)
      .catch(() => setError(true));
  }, []);

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
            <Text style={styles.h1}>Qur'ān</Text>
            <TextInput
              style={styles.search}
              placeholder="Search surah, juz or verse"
              placeholderTextColor={colors.faint}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
            />
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
            {error && <Text style={styles.error}>Couldn’t load surahs. Check your connection.</Text>}
            {!surahs && !error && <ActivityIndicator color={colors.accent} style={styles.spinner} />}
          </View>
        }
        ListEmptyComponent={
          surahs && q ? <Text style={styles.muted}>No surahs match “{query}”.</Text> : null
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => open(item.number)}>
            <AyahBadge n={item.number} size={40} />
            <View style={styles.rowMeta}>
              <Text style={styles.rowTitle}>{item.transliteration}</Text>
              <Text style={styles.rowSub}>
                {item.revelationPlace === "meccan" ? "Meccan" : "Medinan"} · {item.ayahCount} verses
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
    h1: { color: c.fg, fontSize: 30, fontFamily: FONT.extrabold, letterSpacing: -0.6, marginTop: 8, marginBottom: 14 },
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
    juzBlock: { marginBottom: 10 },
    shelfLabel: {
      color: c.faint,
      fontSize: 12,
      letterSpacing: 1,
      textTransform: "uppercase",
      fontFamily: FONT.bold,
      marginBottom: 8,
    },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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
    chipText: { color: c.fg, fontSize: 13 },
    error: { color: c.error, marginTop: 12 },
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
  });
}

import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import { TOTAL_SURAHS, type Surah, type TafsirEntry } from "@ummahlibrary/core";
import { api, type TafsirMeta } from "../api";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useSettings } from "../state/SettingsContext";

/** Standalone tafsir browser: pick an edition and a surah, read it per āyah. */
export function TafsirScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tafsirId } = useSettings();

  const [tafsirs, setTafsirs] = useState<TafsirMeta[]>([]);
  const [edition, setEdition] = useState<string>(tafsirId);
  const [surah, setSurah] = useState(1);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [entries, setEntries] = useState<TafsirEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    void api
      .listTafsirs()
      .then((t) => {
        setTafsirs(t);
        if (!t.some((x) => x.id === edition) && t[0]) setEdition(t[0].id);
      })
      .catch(() => undefined);
    void api.listSurahs().then(setSurahs).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!edition) return;
    setEntries(null);
    setError(false);
    let active = true;
    api
      .getTafsir(surah, edition)
      .then((e) => active && setEntries(e))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [surah, edition]);

  const meta = surahs.find((s) => s.number === surah);
  const editionName = tafsirs.find((t) => t.id === edition)?.name ?? "Tafsir";

  return (
    <View style={styles.screen}>
      <View style={styles.controls}>
        <Text style={styles.label}>Edition</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {tafsirs.map((t) => (
            <Pressable
              key={t.id}
              style={[styles.chip, t.id === edition && styles.chipOn]}
              onPress={() => setEdition(t.id)}
            >
              <Text style={[styles.chipText, t.id === edition && styles.chipTextOn]}>{t.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.label}>Surah</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {Array.from({ length: TOTAL_SURAHS }, (_, i) => i + 1).map((n) => (
            <Pressable
              key={n}
              style={[styles.numChip, n === surah && styles.chipOn]}
              onPress={() => setSurah(n)}
            >
              <Text style={[styles.chipText, n === surah && styles.chipTextOn]}>{n}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.surahTitle}>
          {meta ? `${meta.transliteration} · ${meta.englishName}` : `Surah ${surah}`}
        </Text>
        <Text style={styles.editionName}>{editionName}</Text>

        {error ? (
          <Text style={styles.muted}>Couldn’t load this tafsir. Try another edition.</Text>
        ) : entries === null ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
        ) : entries.length === 0 ? (
          <Text style={styles.muted}>No tafsir available for this surah in this edition.</Text>
        ) : (
          entries.map((e) => (
            <View key={e.aya} style={styles.entry}>
              <Text style={styles.ayaRef}>
                {surah}:{e.aya}
              </Text>
              {e.text
                .split("\n")
                .filter((p) => p.trim())
                .map((p, i) => (
                  <Text key={i} style={styles.para}>
                    {p}
                  </Text>
                ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    controls: {
      paddingTop: 12,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      gap: 6,
    },
    label: {
      color: c.faint,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: "uppercase",
      fontFamily: FONT.bold,
      paddingHorizontal: 16,
      marginTop: 4,
    },
    chipRow: { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
    chip: {
      paddingVertical: 7,
      paddingHorizontal: 13,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    numChip: {
      minWidth: 40,
      paddingVertical: 7,
      paddingHorizontal: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
      alignItems: "center",
    },
    chipOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    chipText: { color: c.muted, fontSize: 13 },
    chipTextOn: { color: c.accent, fontFamily: FONT.semibold },
    body: { padding: 18, paddingBottom: 40 },
    surahTitle: { color: c.fg, fontSize: 18, fontFamily: FONT.bold },
    editionName: { color: c.accent, fontSize: 13, marginTop: 2, marginBottom: 12 },
    muted: { color: c.muted, fontSize: 14, marginTop: 20, lineHeight: 21 },
    entry: {
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: 14,
      marginTop: 14,
      gap: 8,
    },
    ayaRef: { color: c.accent, fontSize: 13, fontFamily: FONT.bold },
    para: { color: c.fg, fontSize: 15, lineHeight: 24 },
  });
}

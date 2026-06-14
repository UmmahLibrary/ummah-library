import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  TOTAL_PAGES_MADANI,
  ayahCountOf,
  isValidPageNumber,
  juzNumberOf,
  pageRange,
  type Ayah,
} from "@ummahlibrary/core";
import { api } from "../api";
import { BISMILLAH, toArabicDigits } from "../format";
import { recordMushafPage } from "../reading-goals";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useSettings } from "../state/SettingsContext";
import type { ReadStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<ReadStackParamList, "MushafPage">;

interface Section {
  sura: number;
  transliteration: string;
  showBismillah: boolean;
  ayahs: Ayah[];
}

export function MushafPageScreen({ navigation, route }: Props) {
  // Deep links (page/:page) deliver the param as a string; in-app navigation
  // passes a number — coerce so both work.
  const n = Number(route.params.page);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { scale } = useSettings();
  const [sections, setSections] = useState<Section[] | null>(null);
  const [error, setError] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: `Page ${n}` });
  }, [navigation, n]);

  useEffect(() => {
    if (!isValidPageNumber(n)) {
      setError(true);
      return;
    }
    setSections(null);
    setError(false);
    const { start, end } = pageRange(n);
    let active = true;
    void (async () => {
      try {
        const result: Section[] = [];
        for (let sura = start.sura; sura <= end.sura; sura++) {
          const ayaStart = sura === start.sura ? start.aya : 1;
          const ayaEnd = sura === end.sura ? end.aya : ayahCountOf(sura);
          const d = await api.getSurah(sura);
          result.push({
            sura,
            transliteration: d.surah.transliteration,
            showBismillah: d.surah.hasBismillah && sura !== 1 && ayaStart === 1,
            ayahs: d.ayahs.filter((a) => a.aya >= ayaStart && a.aya <= ayaEnd),
          });
        }
        if (active) setSections(result);
      } catch {
        if (active) setError(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [n]);

  // Count this page towards the reading goal / khatma once it has loaded.
  useEffect(() => {
    if (sections) void recordMushafPage(n);
  }, [sections, n]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Couldn’t load page {n}.</Text>
      </View>
    );
  }
  if (!sections) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const juz = juzNumberOf(pageRange(n).start);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageMeta}>
          Juzʾ {juz} · Page {n} / {TOTAL_PAGES_MADANI}
        </Text>
        <View style={styles.page}>
          {sections.map((s, i) => (
            <View key={s.sura} style={[styles.section, i > 0 && styles.sectionDivider]}>
              <Text style={styles.surahHeader}>{s.transliteration}</Text>
              {s.showBismillah && (
                <Text style={[styles.basmala, { fontSize: 22 * scale }]}>{BISMILLAH}</Text>
              )}
              <Text style={[styles.mushaf, { fontSize: 26 * scale, lineHeight: 52 * scale }]}>
                {s.ayahs.map((a) => (
                  <Text key={a.aya}>
                    {a.text}
                    <Text style={styles.endMarker}> ﴿{toArabicDigits(a.aya)}﴾ </Text>
                  </Text>
                ))}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.nav}>
          {n > 1 ? (
            <Pressable onPress={() => navigation.replace("MushafPage", { page: n - 1 })}>
              <Text style={styles.navText}>← Previous</Text>
            </Pressable>
          ) : (
            <View />
          )}
          {n < TOTAL_PAGES_MADANI ? (
            <Pressable onPress={() => navigation.replace("MushafPage", { page: n + 1 })}>
              <Text style={styles.navText}>Next →</Text>
            </Pressable>
          ) : (
            <View />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    center: { flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" },
    error: { color: c.error, fontSize: 15 },
    content: { paddingHorizontal: 18, paddingBottom: 40, paddingTop: 8 },
    pageMeta: { color: c.faint, fontSize: 12.5, textAlign: "center", marginBottom: 12 },
    // The Madani-Mushaf page frame — mirrors the web `.mushaf-page` so the
    // printed-page look is consistent across web and mobile.
    page: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      backgroundColor: c.bgElev,
      padding: 22,
      marginTop: 4,
    },
    section: {},
    sectionDivider: {
      borderTopWidth: 1,
      borderTopColor: c.border,
      marginTop: 22,
      paddingTop: 18,
    },
    surahHeader: {
      color: c.accent,
      fontSize: 15,
      fontFamily: FONT.bold,
      textAlign: "center",
      marginBottom: 4,
    },
    basmala: {
      color: c.fg,
      textAlign: "center",
      writingDirection: "rtl",
      marginVertical: 10,
      fontFamily: FONT.ar,
    },
    mushaf: { color: c.fg, textAlign: "justify", writingDirection: "rtl", fontFamily: FONT.ar },
    endMarker: { color: c.accent, fontSize: 18, fontFamily: FONT.ar },
    nav: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 24,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    navText: { color: c.accent, fontSize: 15, fontFamily: FONT.semibold },
  });
}

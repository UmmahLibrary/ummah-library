import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { JUZ_STARTS, TOTAL_JUZ, resolveActiveTranslation, type VerseKey } from "@ummahlibrary/core";
import { api } from "../api";
import { RECITER, RECITERS } from "../plugins";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useSettings } from "../state/SettingsContext";
import { useSurahAudio, verseKeyOf } from "../audio/useSurahAudio";
import { DEFAULT_EDITION } from "../types";
import type { ReadStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<ReadStackParamList, "JuzReader">;

interface Line {
  sura: number;
  aya: number;
  arabic: string;
  translation: string;
  surahHeader?: string;
}

/** The surahs and per-surah ayah bounds that make up a juzʾ. */
function juzRange(juz: number): { sura: number; from: number; toExclusive: number | null }[] {
  const start: VerseKey = JUZ_STARTS[juz - 1]!;
  const end: VerseKey | null = juz < TOTAL_JUZ ? JUZ_STARTS[juz]! : null;
  const lastSura = end ? end.sura : 114;
  const parts: { sura: number; from: number; toExclusive: number | null }[] = [];
  for (let s = start.sura; s <= lastSura; s++) {
    parts.push({
      sura: s,
      from: s === start.sura ? start.aya : 1,
      toExclusive: end && s === end.sura ? end.aya : null,
    });
  }
  return parts;
}

export function JuzReaderScreen({ route }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { editions, readingTranslation, reciterId, scale } = useSettings();
  const reciter = RECITERS.find((r) => r.id === reciterId) ?? RECITER;
  const audio = useSurahAudio(reciter);

  const juz = route.params.juz;
  const edition = resolveActiveTranslation(editions, readingTranslation, DEFAULT_EDITION);
  const [lines, setLines] = useState<Line[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLines(null);
    setError(false);
    const parts = juzRange(juz);
    Promise.all(
      parts.map(async (p) => {
        const [surah, tr] = await Promise.all([
          api.getSurah(p.sura),
          api.getCatalogTranslation(edition, p.sura).catch(() => []),
        ]);
        const trByAya = new Map(tr.map((t) => [t.aya, t.text]));
        const inRange = surah.ayahs.filter(
          (a) => a.aya >= p.from && (p.toExclusive === null || a.aya < p.toExclusive),
        );
        return inRange.map((a, i): Line => ({
          sura: p.sura,
          aya: a.aya,
          arabic: a.text,
          translation: trByAya.get(a.aya) ?? "",
          surahHeader: i === 0 ? `${surah.surah.transliteration} · ${surah.surah.englishName}` : undefined,
        }));
      }),
    )
      .then((groups) => {
        if (active) setLines(groups.flat());
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
      audio.stop();
    };
  }, [juz, edition]);

  const verses = useMemo(
    () => (lines ?? []).map((l) => ({ sura: l.sura, aya: l.aya })),
    [lines],
  );

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Couldn’t load this juzʾ.</Text>
      </View>
    );
  }
  if (!lines) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.audioBar}>
        <Pressable
          style={styles.audioPlay}
          onPress={() =>
            audio.playingKey ? audio.stop() : verses[0] && audio.playFrom(verses, verses[0], true)
          }
        >
          <Text style={styles.audioPlayText}>
            {!audio.playingKey ? "▶ Play juzʾ" : audio.buffering ? "■ Loading…" : "■ Stop"}
          </Text>
        </Pressable>
        <Text style={styles.audioStatus} numberOfLines={1}>
          {audio.playingKey ? `Playing ${audio.playingKey}` : reciter.name}
        </Text>
        <Pressable
          style={[styles.loopBtn, audio.loop && styles.loopBtnOn]}
          onPress={() => audio.setLoop(!audio.loop)}
        >
          <Text style={[styles.loopText, audio.loop && styles.loopTextOn]}>🔁 Loop</Text>
        </Pressable>
      </View>

      {lines.map((l) => {
        const key = verseKeyOf(l);
        const playing = audio.playingKey === key;
        return (
          <View key={key}>
            {l.surahHeader && <Text style={styles.surahHeader}>{l.surahHeader}</Text>}
            <Pressable
              style={[styles.ayah, playing && styles.ayahPlaying]}
              onPress={() => audio.playFrom(verses, l, true)}
            >
              <Text style={[styles.arabic, { fontSize: 24 * scale, lineHeight: 44 * scale }]}>
                {l.arabic} <Text style={styles.marker}>﴿{l.aya}﴾</Text>
              </Text>
              {l.translation ? (
                <Text style={[styles.tr, { fontSize: 15 * scale, lineHeight: 23 * scale }]}>
                  {l.translation}
                </Text>
              ) : null}
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    center: { flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" },
    error: { color: c.error, fontSize: 15 },
    content: { paddingHorizontal: 18, paddingBottom: 40 },
    audioBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
    audioPlay: {
      paddingVertical: 8,
      paddingHorizontal: 18,
      borderRadius: 20,
      backgroundColor: c.accentSoft,
      borderWidth: 1,
      borderColor: c.accent,
    },
    audioPlayText: { color: c.accent, fontSize: 14, fontWeight: "700" },
    audioStatus: { color: c.muted, fontSize: 13, flex: 1 },
    loopBtn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    loopBtnOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    loopText: { color: c.muted, fontSize: 13, fontWeight: "600" },
    loopTextOn: { color: c.accent },
    surahHeader: {
      color: c.accent,
      fontSize: 15,
      fontWeight: "700",
      marginTop: 18,
      marginBottom: 4,
    },
    ayah: {
      paddingVertical: 14,
      paddingHorizontal: 10,
      marginHorizontal: -10,
      borderRadius: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    ayahPlaying: { backgroundColor: c.bgElev, borderBottomColor: "transparent" },
    arabic: { color: c.fg, textAlign: "right", writingDirection: "rtl", fontFamily: FONT.ar },
    marker: { color: c.accent, fontSize: 17, fontFamily: FONT.ar },
    tr: { color: c.fg, marginTop: 10 },
  });
}

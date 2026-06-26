import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  JUZ_STARTS,
  TOTAL_JUZ,
  resolveActiveTranslation,
  revealAyah,
  revealWord,
  totalWords,
  type VerseKey,
} from "@ummahlibrary/core";
import { api } from "../api";
import { RECITER, RECITERS } from "../plugins";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useSettings } from "../state/SettingsContext";
import { useSurahAudio, verseKeyOf } from "../audio/useSurahAudio";
import { AudioRangeControls } from "../components/AudioRangeControls";
import { MemorizeBar } from "../components/MemorizeBar";
import { DEFAULT_EDITION, TRANSLIT_EDITION } from "../types";
import { fetchSurahWordTranslit } from "../word-translit";
import type { ReadStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<ReadStackParamList, "JuzReader">;

interface Line {
  sura: number;
  aya: number;
  arabic: string;
  translation: string;
  /** Latin transliteration line (#150); empty when the toggle is off. */
  transliteration: string;
  /** Per-word transliteration (#144); empty when the toggle is off. */
  translitWords: string[];
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
  const {
    editions,
    readingTranslation,
    reciterId,
    scale,
    transliteration,
    wordTransliteration,
    tapToHear,
  } = useSettings();
  const reciter = RECITERS.find((r) => r.id === reciterId) ?? RECITER;
  const audio = useSurahAudio(reciter);

  const juz = route.params.juz;
  const edition = resolveActiveTranslation(editions, readingTranslation, DEFAULT_EDITION);
  const [lines, setLines] = useState<Line[] | null>(null);
  const [error, setError] = useState(false);

  // Memorize / hide-and-peek (#134) — ephemeral, so a juzʾ never opens hidden.
  const [peek, setPeek] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const [peekExtra, setPeekExtra] = useState<Set<number>>(new Set());
  const [hideTr, setHideTr] = useState(false);

  useEffect(() => {
    let active = true;
    setLines(null);
    setError(false);
    if (!Number.isInteger(Number(juz)) || Number(juz) < 1 || Number(juz) > TOTAL_JUZ) {
      setError(true);
      return () => {
        active = false;
        audio.stop();
      };
    }
    const parts = juzRange(Number(juz));
    Promise.all(
      parts.map(async (p) => {
        const [surah, tr, translit, wordTranslit] = await Promise.all([
          api.getSurah(p.sura),
          api.getCatalogTranslation(edition, p.sura).catch(() => []),
          transliteration
            ? api.getCatalogTranslation(TRANSLIT_EDITION, p.sura).catch(() => [])
            : Promise.resolve([]),
          wordTransliteration
            ? fetchSurahWordTranslit(p.sura).catch(() => new Map<number, string[]>())
            : Promise.resolve(new Map<number, string[]>()),
        ]);
        const trByAya = new Map(tr.map((t) => [t.aya, t.text]));
        const translitByAya = new Map(translit.map((t) => [t.aya, t.text]));
        const inRange = surah.ayahs.filter(
          (a) => a.aya >= p.from && (p.toExclusive === null || a.aya < p.toExclusive),
        );
        return inRange.map(
          (a, i): Line => ({
            sura: p.sura,
            aya: a.aya,
            arabic: a.text,
            translation: trByAya.get(a.aya) ?? "",
            transliteration: translitByAya.get(a.aya) ?? "",
            translitWords: wordTranslit.get(a.aya) ?? [],
            surahHeader:
              i === 0 ? `${surah.surah.transliteration} · ${surah.surah.englishName}` : undefined,
          }),
        );
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
  }, [juz, edition, transliteration, wordTransliteration]);

  const verses = useMemo(() => (lines ?? []).map((l) => ({ sura: l.sura, aya: l.aya })), [lines]);

  // Peek geometry: per-āyah words and the global index each āyah starts at, so the
  // shared reveal cursor maps onto every word in reading order.
  const peekWords = useMemo(() => (lines ?? []).map((l) => l.arabic.split(" ")), [lines]);
  const wordsPerAyah = useMemo(() => peekWords.map((w) => w.length), [peekWords]);
  const peekStarts = useMemo(() => {
    const starts: number[] = [];
    let acc = 0;
    for (const c of wordsPerAyah) {
      starts.push(acc);
      acc += c;
    }
    return starts;
  }, [wordsPerAyah]);
  const peekTotal = useMemo(() => totalWords(wordsPerAyah), [wordsPerAyah]);

  const onPeekWord = useCallback((gi: number) => setPeekExtra((p) => new Set(p).add(gi)), []);
  const togglePeek = useCallback(() => {
    setPeek((p) => {
      const next = !p;
      setRevealed(0);
      setPeekExtra(new Set());
      if (!next) setHideTr(false);
      return next;
    });
  }, []);

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
      <View style={styles.audioExtras}>
        <AudioRangeControls audio={audio} verses={verses} />
      </View>
      <View style={styles.memorize}>
        <MemorizeBar
          on={peek}
          hideTr={hideTr}
          onToggle={togglePeek}
          onPeekWord={() => setRevealed((r) => revealWord(r, peekTotal))}
          onRevealAyah={() => setRevealed((r) => revealAyah(r, wordsPerAyah))}
          onShowAll={() => {
            setRevealed(peekTotal);
            setPeekExtra(new Set());
          }}
          onHideAll={() => {
            setRevealed(0);
            setPeekExtra(new Set());
          }}
          onToggleTr={() => setHideTr((v) => !v)}
        />
      </View>

      {lines.map((l, i) => {
        const key = verseKeyOf(l);
        const playing = audio.playingKey === key;
        const showWbw = ((wordTransliteration && l.translitWords.length > 0) || tapToHear) && !peek;
        return (
          <View key={key}>
            {l.surahHeader && <Text style={styles.surahHeader}>{l.surahHeader}</Text>}
            <Pressable
              style={[styles.ayah, playing && styles.ayahPlaying]}
              onPress={peek || showWbw ? undefined : () => audio.playFrom(verses, l, true)}
            >
              {showWbw ? (
                <View style={styles.wbwRow}>
                  {peekWords[i]!.map((w, wi) => (
                    <Pressable
                      key={wi}
                      style={styles.wbwUnit}
                      onPress={() =>
                        tapToHear ? audio.playWord(l, wi) : audio.playFrom(verses, l, true)
                      }
                    >
                      <Text
                        style={[styles.wbwAr, { fontSize: 24 * scale, lineHeight: 38 * scale }]}
                      >
                        {w}
                      </Text>
                      {l.translitWords[wi] ? (
                        <Text style={[styles.wbwTr, { fontSize: 11 * scale }]}>
                          {l.translitWords[wi]}
                        </Text>
                      ) : null}
                    </Pressable>
                  ))}
                  <Text style={styles.marker}>﴿{l.aya}﴾</Text>
                </View>
              ) : (
                <Text style={[styles.arabic, { fontSize: 24 * scale, lineHeight: 44 * scale }]}>
                  {peek
                    ? peekWords[i].map((w, wi) => {
                        const gi = peekStarts[i]! + wi;
                        const shown = gi < revealed || peekExtra.has(gi);
                        return (
                          <Text
                            key={wi}
                            onPress={() => onPeekWord(gi)}
                            style={shown ? undefined : styles.wordHidden}
                          >
                            {w}
                            {wi < peekWords[i]!.length - 1 ? " " : ""}
                          </Text>
                        );
                      })
                    : l.arabic}{" "}
                  <Text style={styles.marker}>﴿{l.aya}﴾</Text>
                </Text>
              )}
              {l.transliteration && !hideTr ? (
                <Text style={[styles.translit, { fontSize: 14 * scale, lineHeight: 22 * scale }]}>
                  {l.transliteration}
                </Text>
              ) : null}
              {l.translation && !hideTr ? (
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
    audioExtras: { marginBottom: 12 },
    memorize: { marginBottom: 14 },
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
    wordHidden: { color: "transparent", backgroundColor: c.borderSoft },
    marker: { color: c.accent, fontSize: 17, fontFamily: FONT.ar },
    translit: { color: c.faint, marginTop: 10, fontStyle: "italic" },
    tr: { color: c.fg, marginTop: 10 },
    // Word-by-word transliteration (#144): RTL flow of stacked word units.
    wbwRow: {
      flexDirection: "row-reverse",
      flexWrap: "wrap",
      alignItems: "flex-start",
      justifyContent: "flex-start",
      gap: 11,
    },
    wbwUnit: { alignItems: "center" },
    wbwAr: { color: c.fg, fontFamily: FONT.ar, textAlign: "center" },
    wbwTr: { color: c.faint, marginTop: 2, fontFamily: FONT.medium, textAlign: "center" },
  });
}

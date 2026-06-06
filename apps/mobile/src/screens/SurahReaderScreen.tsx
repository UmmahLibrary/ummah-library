import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  TOTAL_SURAHS,
  resolveActiveTranslation,
  type Ayah,
  type Surah,
  type Translation,
} from "@ummahlibrary/core";
import { api } from "../api";
import { RECITER, RECITERS } from "../plugins";
import { BISMILLAH, toArabicDigits } from "../format";
import { useTheme, type Palette } from "../theme";
import { useSettings } from "../state/SettingsContext";
import { useLibrary } from "../state/LibraryContext";
import { useSurahAudio, verseKeyOf } from "../audio/useSurahAudio";
import { DEFAULT_EDITION } from "../types";
import { ReaderControls } from "../components/ReaderControls";
import { ReadingTranslationPicker } from "../components/ReadingTranslationPicker";
import { TranslationManager } from "../components/TranslationManager";
import { AyahView, type TrLine } from "../components/AyahView";
import type { ReadStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<ReadStackParamList, "SurahReader">;

export function SurahReaderScreen({ navigation, route }: Props) {
  const n = route.params.surah;
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const settings = useSettings();
  const {
    editions,
    readingMode,
    readingTranslation,
    reciterId,
    scale,
    catalogue,
    setEditions,
    setReadingMode,
    setReadingTranslation,
    setScale,
  } = settings;
  const { setLastRead, isBookmarked, toggleBookmark } = useLibrary();

  const reciter = RECITERS.find((r) => r.id === reciterId) ?? RECITER;
  const audio = useSurahAudio(reciter);

  const [meta, setMeta] = useState<Surah | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[] | null>(null);
  const [trMap, setTrMap] = useState<Map<string, Map<number, string>>>(new Map());
  const [error, setError] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);

  useLayoutEffect(() => {
    if (meta) navigation.setOptions({ title: meta.transliteration });
  }, [navigation, meta]);

  // Mark continue-reading and stop audio when leaving the surah.
  useEffect(() => {
    setLastRead(n);
    return () => audio.stop();
  }, [n]);

  useEffect(() => {
    setError(false);
    api
      .getSurah(n)
      .then((d) => {
        setMeta(d.surah);
        setAyahs(d.ayahs);
      })
      .catch(() => setError(true));
  }, [n]);

  // Fetch every selected edition's text for this surah.
  useEffect(() => {
    let active = true;
    Promise.all(
      editions.map((id) =>
        api
          .getTranslation(n, id)
          .then((rows) => [id, new Map(rows.map((t) => [t.aya, t.text]))] as const)
          .catch(() => [id, new Map<number, string>()] as const),
      ),
    ).then((pairs) => {
      if (active) setTrMap(new Map(pairs));
    });
    return () => {
      active = false;
    };
  }, [n, editions]);

  const verses = useMemo(() => (ayahs ?? []).map((a) => ({ sura: n, aya: a.aya })), [ayahs, n]);
  const metaById = useMemo(() => new Map(catalogue.map((e) => [e.id, e])), [catalogue]);

  const trLineFor = (id: string, aya: number): TrLine | null => {
    const text = trMap.get(id)?.get(aya);
    if (!text) return null;
    const m: Translation | undefined = metaById.get(id);
    return { id, name: m?.name ?? id, text, direction: m?.direction ?? "ltr", language: m?.language ?? "en" };
  };

  // Stable per-ayah view-models so non-playing rows skip re-render during audio.
  const rows = useMemo(
    () =>
      (ayahs ?? []).map((a) => ({
        aya: a.aya,
        key: verseKeyOf({ sura: n, aya: a.aya }),
        arabic: a.text,
        words: a.text.split(" "),
        translations: editions
          .map((id) => trLineFor(id, a.aya))
          .filter((x): x is TrLine => x !== null),
      })),
    [ayahs, editions, trMap, metaById, n],
  );

  const playFrom = (aya: number) => audio.playFrom(verses, { sura: n, aya }, true);
  const playOne = (aya: number) => audio.playFrom(verses, { sura: n, aya }, false);

  const shortlist = useMemo(
    () => editions.map((id) => metaById.get(id)).filter((x): x is Translation => Boolean(x)),
    [editions, metaById],
  );
  const activeTr = resolveActiveTranslation(editions, readingTranslation, DEFAULT_EDITION);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Couldn’t load this surah.</Text>
      </View>
    );
  }
  if (!meta || !ayahs) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const showBismillah = meta.hasBismillah && meta.number !== 1;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <Text style={styles.nameAr}>{meta.name}</Text>
          <Text style={styles.nameEn}>
            {meta.transliteration} · {meta.englishName}
          </Text>
          <Text style={styles.sub}>
            Surah {meta.number} · {meta.ayahCount} āyāt ·{" "}
            {meta.revelationPlace === "meccan" ? "Meccan" : "Medinan"}
          </Text>
          <Pressable style={styles.bookmark} onPress={() => toggleBookmark(n)}>
            <Text style={styles.bookmarkText}>
              {isBookmarked(n) ? "★ Bookmarked" : "☆ Bookmark"}
            </Text>
          </Pressable>
        </View>

        <ReaderControls
          mode={readingMode}
          onMode={setReadingMode}
          scale={scale}
          onScale={setScale}
          onManage={() => setManagerOpen(true)}
        />

        <View style={styles.audioBar}>
          <Pressable
            style={styles.audioPlay}
            onPress={() =>
              audio.playingKey ? audio.stop() : verses[0] && audio.playFrom(verses, verses[0], true)
            }
          >
            <Text style={styles.audioPlayText}>
              {!audio.playingKey ? "▶ Play" : audio.buffering ? "■ Loading…" : "■ Stop"}
            </Text>
          </Pressable>
          <Text style={styles.audioStatus} numberOfLines={1}>
            {audio.playingKey ? `Playing ${audio.playingKey}` : reciter.name}
          </Text>
        </View>

        {readingMode === "reading-tr" && (
          <ReadingTranslationPicker
            shortlist={shortlist}
            activeId={activeTr}
            onPick={setReadingTranslation}
            onManage={() => setManagerOpen(true)}
          />
        )}

        {showBismillah && readingMode !== "reading-tr" && (
          <Text style={[styles.basmala, { fontSize: 22 * scale }]}>{BISMILLAH}</Text>
        )}

        {readingMode === "translation" &&
          rows.map((r) => (
            <AyahView
              key={r.key}
              sura={n}
              aya={r.aya}
              arabic={r.arabic}
              words={r.words}
              translations={r.translations}
              activeWord={audio.playingKey === r.key ? audio.activeWord : -1}
              playing={audio.playingKey === r.key}
              scale={scale}
              onPlayFrom={playFrom}
              onPlayOne={playOne}
            />
          ))}

        {readingMode === "reading" && (
          <Text style={[styles.mushaf, { fontSize: 26 * scale, lineHeight: 52 * scale }]}>
            {ayahs.map((a) => (
              <Text key={a.aya} onPress={() => playFrom(a.aya)}>
                {a.text}
                <Text style={styles.endMarker}> ﴿{toArabicDigits(a.aya)}﴾ </Text>
              </Text>
            ))}
          </Text>
        )}

        {readingMode === "reading-tr" && (
          <Text style={[styles.flow, { fontSize: 17 * scale, lineHeight: 30 * scale }]}>
            {ayahs.map((a) => {
              const text = trMap.get(activeTr)?.get(a.aya);
              return text ? (
                <Text key={a.aya}>
                  <Text style={styles.flowNum}>{a.aya}. </Text>
                  {text}{"  "}
                </Text>
              ) : null;
            })}
          </Text>
        )}

        <View style={styles.nav}>
          {n > 1 ? (
            <Pressable onPress={() => navigation.replace("SurahReader", { surah: n - 1 })}>
              <Text style={styles.navText}>← Previous</Text>
            </Pressable>
          ) : (
            <View />
          )}
          {n < TOTAL_SURAHS ? (
            <Pressable onPress={() => navigation.replace("SurahReader", { surah: n + 1 })}>
              <Text style={styles.navText}>Next →</Text>
            </Pressable>
          ) : (
            <View />
          )}
        </View>
      </ScrollView>

      <TranslationManager
        visible={managerOpen}
        catalogue={catalogue}
        selected={editions}
        onChange={setEditions}
        onClose={() => setManagerOpen(false)}
      />
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    center: { flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" },
    error: { color: c.error, fontSize: 15 },
    content: { paddingHorizontal: 18, paddingBottom: 40 },
    head: { alignItems: "center", paddingVertical: 12 },
    nameAr: { color: c.fg, fontSize: 30, writingDirection: "rtl" },
    nameEn: { color: c.fg, fontSize: 16, fontWeight: "600", marginTop: 6 },
    sub: { color: c.muted, fontSize: 13, marginTop: 4 },
    bookmark: {
      marginTop: 10,
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    bookmarkText: { color: c.accent, fontSize: 13, fontWeight: "600" },
    audioBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
      marginBottom: 8,
    },
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
    basmala: { color: c.fg, textAlign: "center", writingDirection: "rtl", marginVertical: 12 },
    mushaf: { color: c.fg, textAlign: "right", writingDirection: "rtl", marginTop: 8 },
    endMarker: { color: c.accent, fontSize: 18 },
    flow: { color: c.fg, marginTop: 4 },
    flowNum: { color: c.accent, fontWeight: "700" },
    nav: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 28,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    navText: { color: c.accent, fontSize: 15, fontWeight: "600" },
  });
}

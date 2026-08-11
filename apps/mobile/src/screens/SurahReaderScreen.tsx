import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "../Type";
import type { ViewToken } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  TOTAL_SURAHS,
  pageNumberOf,
  resolveActiveTranslation,
  revealAyah,
  revealWord,
  totalWords,
  type Ayah,
  type Surah,
  type Translation,
} from "@ummahlibrary/core";
import { Khatam, Icon } from "@ummahlibrary/ui";
import { api } from "../api";
import { RECITER, RECITERS } from "../plugins";
import { BISMILLAH, toArabicDigits } from "../format";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useSettings } from "../state/SettingsContext";
import { useLibrary } from "../state/LibraryContext";
import { useSurahAudio, verseKeyOf } from "../audio/useSurahAudio";
import { DEFAULT_EDITION, TRANSLIT_EDITION } from "../types";
import { fetchSurahWordTranslit } from "../word-translit";
import { fetchSurahIndopak } from "../indopak";
import { ReaderControls } from "../components/ReaderControls";
import { AudioRangeControls } from "../components/AudioRangeControls";
import { DownloadButton } from "../components/DownloadButton";
import { MemorizeBar } from "../components/MemorizeBar";
import { ReadingTranslationPicker } from "../components/ReadingTranslationPicker";
import { TranslationManager } from "../components/TranslationManager";
import { AyahView, type TrLine } from "../components/AyahView";
import { recordMushafPage } from "../reading-goals";
import { readActivePlan, todayProgress, todayStr, type ActivePlan } from "../plans";
import type { ReadStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<ReadStackParamList, "SurahReader">;

export function SurahReaderScreen({ navigation, route }: Props) {
  // Deep links (surah/:surah) deliver the param as a string; in-app navigation
  // passes a number — coerce so core helpers (which require integers) are safe.
  const n = Number(route.params.surah);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const settings = useSettings();
  const {
    editions,
    readingMode,
    readingTranslation,
    reciterId,
    scale,
    transliteration,
    wordTransliteration,
    tapToHear,
    script,
    catalogue,
    setEditions,
    setReadingMode,
    setReadingTranslation,
    setScale,
    setTransliteration,
    setWordTransliteration,
    setTapToHear,
  } = settings;
  const { setLastRead, isBookmarked, toggleBookmark } = useLibrary();

  const reciter = RECITERS.find((r) => r.id === reciterId) ?? RECITER;
  const audio = useSurahAudio(reciter);

  const [meta, setMeta] = useState<Surah | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[] | null>(null);
  const [trMap, setTrMap] = useState<Map<string, Map<number, string>>>(new Map());
  const [translitMap, setTranslitMap] = useState<Map<number, string>>(new Map());
  const [wordTranslitMap, setWordTranslitMap] = useState<Map<number, string[]>>(new Map());
  const [indopakMap, setIndopakMap] = useState<Map<number, string[]>>(new Map());
  const [error, setError] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);

  // Memorize / hide-and-peek (#134) — ephemeral, so a surah never opens hidden.
  const [peek, setPeek] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const [peekExtra, setPeekExtra] = useState<Set<number>>(new Set());
  const [hideTr, setHideTr] = useState(false);

  // Track the topmost visible āyah so "open in Mushaf" lands on the right page.
  // Per-āyah offsets are only known in translation mode (discrete rows); the
  // continuous reading modes fall back to the surah's first āyah.
  const topAyaRef = useRef(1);
  // n via a ref so the stable viewability callback (which RN forbids changing)
  // always reads the current sūrah.
  const nRef = useRef(n);
  nRef.current = n;
  const lastPageRef = useRef(0);
  const [activePlan, setActivePlan] = useState<ActivePlan | null>(null);
  useEffect(() => {
    topAyaRef.current = 1;
    lastPageRef.current = 0;
    void readActivePlan().then(setActivePlan);
  }, [n]);

  // Madani page of the topmost visible āyah. The visible āyah is tracked via the
  // list's viewability in translation mode; the continuous reading modes have no
  // discrete rows and fall back to the sūrah's first āyah.
  const currentPage = useCallback(() => pageNumberOf({ sura: n, aya: topAyaRef.current }), [n]);

  const openMushaf = useCallback(() => {
    navigation.navigate("MushafPage", { page: currentPage() });
  }, [navigation, currentPage]);

  // Reading-plan auto-advance (#69): record the furthest Madani page reached and
  // refresh the plan so the floating chip ticks up as the reader scrolls.
  const recordPage = useCallback((page: number) => {
    if (page <= 0 || page === lastPageRef.current) return;
    lastPageRef.current = page;
    void recordMushafPage(page).then(() => readActivePlan().then(setActivePlan));
  }, []);

  // Count the opening page so short sūrahs (no scroll) still register.
  useEffect(() => {
    if (ayahs?.length && n >= 1 && n <= TOTAL_SURAHS) {
      recordPage(pageNumberOf({ sura: n, aya: ayahs[0]?.aya ?? 1 }));
    }
  }, [ayahs, n, recordPage]);

  useLayoutEffect(() => {
    if (!meta) return;
    navigation.setOptions({
      title: meta.transliteration,
      headerRight: () => (
        <Pressable onPress={openMushaf} hitSlop={10} accessibilityLabel="Open in Mushaf page view">
          <Icon name="layers" size={22} color={colors.accent} sw={1.8} />
        </Pressable>
      ),
    });
  }, [navigation, meta, colors, openMushaf]);

  // Mark continue-reading and stop audio when leaving the surah.
  useEffect(() => {
    setLastRead(n);
    return () => audio.stop();
  }, [n]);

  useEffect(() => {
    setError(false);
    // Clear the previous surah's data immediately so a rapid surah→surah
    // navigation never pairs a new `n` with stale `ayahs` (which would feed an
    // out-of-range ref to pageNumberOf and throw).
    setMeta(null);
    setAyahs(null);
    if (!Number.isInteger(n) || n < 1 || n > TOTAL_SURAHS) {
      setError(true);
      return;
    }
    // `active` guards against an in-flight fetch for a previous surah resolving
    // after `n` has already changed and writing its ayahs onto the new surah.
    let active = true;
    api
      .getSurah(n)
      .then((d) => {
        if (!active) return;
        setMeta(d.surah);
        setAyahs(d.ayahs);
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [n]);

  // Fetch every selected edition's text for this surah.
  useEffect(() => {
    let active = true;
    Promise.all(
      editions.map((id) =>
        api
          .getCatalogTranslation(id, n)
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

  // Fetch the transliteration edition for this surah only while the toggle is on.
  useEffect(() => {
    if (!transliteration) {
      setTranslitMap(new Map());
      return;
    }
    let active = true;
    api
      .getCatalogTranslation(TRANSLIT_EDITION, n)
      .then((rows) => {
        if (active) setTranslitMap(new Map(rows.map((t) => [t.aya, t.text])));
      })
      .catch(() => active && setTranslitMap(new Map()));
    return () => {
      active = false;
    };
  }, [n, transliteration]);

  // Fetch per-word transliteration (#144) for this surah only while enabled.
  useEffect(() => {
    if (!wordTransliteration) {
      setWordTranslitMap(new Map());
      return;
    }
    let active = true;
    fetchSurahWordTranslit(n)
      .then((map) => {
        if (active) setWordTranslitMap(map);
      })
      .catch(() => active && setWordTranslitMap(new Map()));
    return () => {
      active = false;
    };
  }, [n, wordTransliteration]);

  // Fetch IndoPak verse text (ADR 0035) for this surah only while selected.
  // Display-only, live from quran.com (not bundled — see indopak.ts).
  useEffect(() => {
    if (script !== "indopak") {
      setIndopakMap(new Map());
      return;
    }
    let active = true;
    fetchSurahIndopak(n)
      .then((map) => {
        if (active) setIndopakMap(map);
      })
      .catch(() => active && setIndopakMap(new Map()));
    return () => {
      active = false;
    };
  }, [n, script]);

  const verses = useMemo(() => (ayahs ?? []).map((a) => ({ sura: n, aya: a.aya })), [ayahs, n]);
  const metaById = useMemo(() => new Map(catalogue.map((e) => [e.id, e])), [catalogue]);

  const trLineFor = (id: string, aya: number): TrLine | null => {
    const text = trMap.get(id)?.get(aya);
    if (!text) return null;
    const m: Translation | undefined = metaById.get(id);
    return {
      id,
      name: m?.name ?? id,
      text,
      direction: m?.direction ?? "ltr",
      language: m?.language ?? "en",
    };
  };

  // Stable per-ayah view-models so non-playing rows skip re-render during audio.
  const rows = useMemo(
    () =>
      (ayahs ?? []).map((a) => {
        // IndoPak (ADR 0035): quran.com's numbered words when loaded — they align
        // 1:1 with the audio segments and the per-word transliteration, so
        // highlighting / tap-to-hear / the translit row all work. Falls back to
        // the Uthmani text (space-split) until the IndoPak fetch resolves.
        const ipk = script === "indopak" ? (indopakMap.get(a.aya) ?? null) : null;
        return {
          aya: a.aya,
          key: verseKeyOf({ sura: n, aya: a.aya }),
          arabic: ipk ? ipk.join(" ") : a.text,
          words: ipk ?? a.text.split(" "),
          transliteration: transliteration ? (translitMap.get(a.aya) ?? null) : null,
          translitWords: wordTransliteration ? (wordTranslitMap.get(a.aya) ?? null) : null,
          translations: editions
            .map((id) => trLineFor(id, a.aya))
            .filter((x): x is TrLine => x !== null),
        };
      }),
    [
      ayahs,
      editions,
      trMap,
      metaById,
      n,
      transliteration,
      translitMap,
      wordTransliteration,
      wordTranslitMap,
      script,
      indopakMap,
    ],
  );

  // Peek geometry: each āyah's word count and the global index of its first word,
  // so AyahView can map the shared reveal cursor onto its own words.
  const wordsPerAyah = useMemo(() => rows.map((r) => r.words.length), [rows]);
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
      // Peek needs the per-word verse layout; switch to it on enter.
      if (next) setReadingMode("translation");
      else setHideTr(false);
      return next;
    });
  }, [setReadingMode]);

  // Stable so the memoized AyahView only re-renders the playing āyah as the
  // recitation moves word to word — an inline arrow would change identity every
  // render and defeat the memo, re-rendering the whole surah on each word.
  const { playFrom: playAudio, playWord, playingKey, activeWord } = audio;
  const playFrom = useCallback(
    (aya: number) => playAudio(verses, { sura: n, aya }, true),
    [playAudio, verses, n],
  );
  const playOne = useCallback(
    (aya: number) => playAudio(verses, { sura: n, aya }, false),
    [playAudio, verses, n],
  );
  const playWordAt = useCallback(
    (aya: number, wordIndex: number) => playWord({ sura: n, aya }, wordIndex),
    [playWord, n],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: (typeof rows)[number]; index: number }) => (
      <AyahView
        sura={n}
        aya={item.aya}
        arabic={item.arabic}
        words={item.words}
        translations={item.translations}
        transliteration={item.transliteration}
        translitWords={item.translitWords}
        tapToHear={tapToHear}
        indopak={script === "indopak"}
        onPlayWord={playWordAt}
        activeWord={playingKey === item.key ? activeWord : -1}
        playing={playingKey === item.key}
        scale={scale}
        onPlayFrom={playFrom}
        onPlayOne={playOne}
        peek={peek}
        peekStart={peekStarts[index] ?? 0}
        peekRevealed={revealed}
        peekExtra={peekExtra}
        peekHideTr={hideTr}
        onPeekWord={onPeekWord}
      />
    ),
    [
      n,
      playingKey,
      activeWord,
      scale,
      playFrom,
      playOne,
      playWordAt,
      tapToHear,
      script,
      peek,
      peekStarts,
      revealed,
      peekExtra,
      hideTr,
      onPeekWord,
    ],
  );

  // Track the topmost visible āyah for "open in Mushaf" and reading-plan
  // auto-advance. Kept in a ref because RN forbids changing the handler.
  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const aya = (viewableItems[0]?.item as { aya?: number } | undefined)?.aya;
    const s = nRef.current;
    if (aya != null && s >= 1 && s <= TOTAL_SURAHS) {
      topAyaRef.current = aya;
      recordPage(pageNumberOf({ sura: s, aya }));
    }
  }).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 10 }).current;

  // Auto-scroll: keep the playing āyah in view as the recitation advances. Only
  // applies to the virtualized translation list; the index may not be measured
  // yet (it's off-screen) so onScrollToIndexFailed retries after a beat.
  const listRef = useRef<FlatList<(typeof rows)[number]>>(null);
  const indexOfKey = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r, i) => m.set(r.key, i));
    return m;
  }, [rows]);
  useEffect(() => {
    if (readingMode !== "translation" || !playingKey) return;
    const index = indexOfKey.get(playingKey);
    if (index == null) return;
    try {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
    } catch {
      /* list not ready */
    }
  }, [playingKey, readingMode, indexOfKey]);

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

  const header = (
    <>
      <View style={styles.head}>
        <View style={styles.crest}>
          <Khatam size={94} color={colors.accent} sw={1} opacity={0.5} />
          <Text style={styles.crestAr}>{meta.name}</Text>
        </View>
        <Text style={styles.nameEn}>
          {meta.transliteration} · {meta.englishName}
        </Text>
        <Text style={styles.sub}>
          Surah {meta.number} · {meta.ayahCount} verses ·{" "}
          {meta.revelationPlace === "meccan" ? "Meccan" : "Medinan"}
        </Text>
        <Pressable style={styles.bookmark} onPress={() => toggleBookmark(n)}>
          <Icon
            name="bookmark"
            size={14}
            color={isBookmarked(n) ? colors.accent : colors.muted}
            sw={1.8}
          />
          <Text style={[styles.bookmarkText, isBookmarked(n) && styles.bookmarkTextOn]}>
            {isBookmarked(n) ? "Bookmarked" : "Bookmark surah"}
          </Text>
        </Pressable>
      </View>

      <ReaderControls
        mode={readingMode}
        onMode={setReadingMode}
        scale={scale}
        onScale={setScale}
        transliteration={transliteration}
        onTransliteration={setTransliteration}
        wordTransliteration={wordTransliteration}
        onWordTransliteration={setWordTransliteration}
        tapToHear={tapToHear}
        onTapToHear={setTapToHear}
        onManage={() => setManagerOpen(true)}
      />

      <View style={styles.audioBar}>
        <Pressable
          style={styles.audioPlay}
          onPress={() =>
            audio.playingKey ? audio.stop() : verses[0] && audio.playFrom(verses, verses[0], true)
          }
          accessibilityLabel={audio.playingKey ? "Stop" : "Play surah"}
        >
          <Icon name={audio.playingKey ? "pause" : "play"} size={18} color={colors.ink} />
        </Pressable>
        <Text style={styles.audioStatus} numberOfLines={1}>
          {audio.playingKey
            ? audio.buffering
              ? "Loading…"
              : `Playing ${audio.playingKey}`
            : reciter.name}
        </Text>
        <Pressable onPress={() => audio.setLoop(!audio.loop)} hitSlop={8} accessibilityLabel="Loop">
          <Icon
            name="repeat"
            size={20}
            color={audio.loop ? colors.accent : colors.muted}
            sw={1.8}
          />
        </Pressable>
        <DownloadButton audio={audio} surahs={[n]} colors={colors} />
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
    </>
  );

  const footer = (
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
  );

  return (
    <View style={styles.screen}>
      {readingMode === "translation" ? (
        // Virtualized so a long sūrah renders only the visible āyāt; combined
        // with the stable callbacks above, a word-tick re-renders just the
        // playing āyah instead of the whole list.
        <FlatList
          ref={listRef}
          data={rows}
          keyExtractor={(r) => r.key}
          renderItem={renderItem}
          extraData={`${playingKey ?? ""}:${activeWord}:${scale}:${peek}:${revealed}:${peekExtra.size}:${hideTr}:${transliteration}:${translitMap.size}:${wordTransliteration}:${wordTranslitMap.size}:${tapToHear}:${script}:${indopakMap.size}`}
          contentContainerStyle={styles.content}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={viewabilityConfig}
          onScrollToIndexFailed={(info) => {
            // Target āyah isn't measured yet — settle, then retry once.
            setTimeout(() => {
              try {
                listRef.current?.scrollToIndex({
                  index: info.index,
                  animated: true,
                  viewPosition: 0.3,
                });
              } catch {
                /* give up quietly */
              }
            }, 350);
          }}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={11}
          removeClippedSubviews
          ListHeaderComponent={
            <>
              {header}
              {showBismillah && (
                <Text style={[styles.basmala, { fontSize: 22 * scale }]}>{BISMILLAH}</Text>
              )}
            </>
          }
          ListFooterComponent={footer}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {header}

          {readingMode === "reading-tr" && (
            <ReadingTranslationPicker
              shortlist={shortlist}
              activeId={activeTr}
              onPick={setReadingTranslation}
              onManage={() => setManagerOpen(true)}
            />
          )}

          {showBismillah && readingMode === "reading" && (
            <Text style={[styles.basmala, { fontSize: 22 * scale }]}>{BISMILLAH}</Text>
          )}

          {readingMode === "reading" && (
            <Text
              style={[
                styles.mushaf,
                script === "indopak" && { fontFamily: FONT.arIndopak },
                { fontSize: 26 * scale, lineHeight: (script === "indopak" ? 66 : 52) * scale },
              ]}
            >
              {ayahs.map((a) => {
                const ipk = script === "indopak" ? indopakMap.get(a.aya) : null;
                return (
                  <Text key={a.aya} onPress={() => playFrom(a.aya)}>
                    {ipk ? ipk.join(" ") : a.text}
                    <Text style={styles.endMarker}> ﴿{toArabicDigits(a.aya)}﴾ </Text>
                  </Text>
                );
              })}
            </Text>
          )}

          {readingMode === "reading-tr" && (
            <Text style={[styles.flow, { fontSize: 17 * scale, lineHeight: 30 * scale }]}>
              {ayahs.map((a) => {
                const text = trMap.get(activeTr)?.get(a.aya);
                return text ? (
                  <Text key={a.aya}>
                    <Text style={styles.flowNum}>{a.aya}. </Text>
                    {text}
                    {"  "}
                  </Text>
                ) : null;
              })}
            </Text>
          )}

          {footer}
        </ScrollView>
      )}

      {activePlan && !activePlan.pausedOn && (
        <View style={styles.chipWrap} pointerEvents="none">
          <PlanChip plan={activePlan} styles={styles} colors={colors} />
        </View>
      )}

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

const UNIT_LABEL: Record<string, string> = {
  juz: "juzʾ",
  hizb: "ḥizb",
  page: "pages",
  surah: "sūrahs",
  ayah: "ayahs",
};

/**
 * Slim floating chip shown while a plan is active — "Plan · 2 of 3 pages today"
 * — that advances as the reader scrolls (the plan is subscribed to the page
 * signal, #69). Renders nothing once there's no portion left to read.
 */
function PlanChip({
  plan,
  styles,
  colors,
}: {
  plan: ActivePlan;
  styles: ReturnType<typeof makeStyles>;
  colors: Palette;
}) {
  const { done, total } = todayProgress(plan, todayStr());
  if (total === 0) return null;
  const complete = done >= total;
  const unit = UNIT_LABEL[plan.template.range.unit] ?? "units";
  return (
    <View style={[styles.chip, complete && styles.chipDone]}>
      {complete ? (
        <>
          <Icon name="check" size={13} color={colors.accent} sw={2} />
          <Text style={[styles.chipText, styles.chipTextDone]}>Today’s portion done</Text>
        </>
      ) : (
        <Text style={styles.chipText}>
          <Text style={styles.chipLabel}>Plan</Text> · {done} of {total} {unit} today
        </Text>
      )}
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    center: { flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" },
    error: { color: c.error, fontSize: 15 },
    content: { paddingHorizontal: 18, paddingBottom: 40 },
    head: { alignItems: "center", paddingVertical: 14 },
    crest: {
      width: 94,
      height: 94,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    crestAr: {
      position: "absolute",
      color: c.accentHi,
      fontSize: 30,
      writingDirection: "rtl",
      fontFamily: FONT.arSemibold,
    },
    nameEn: { color: c.fg, fontSize: 16, fontFamily: FONT.bold, marginTop: 6 },
    sub: { color: c.faint, fontSize: 13, marginTop: 4 },
    bookmark: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      marginTop: 12,
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    bookmarkText: { color: c.muted, fontSize: 13, fontFamily: FONT.semibold },
    bookmarkTextOn: { color: c.accent },
    audioBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 12,
      marginBottom: 4,
    },
    audioExtras: { marginBottom: 10 },
    memorize: { marginBottom: 12 },
    audioPlay: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    audioStatus: { color: c.muted, fontSize: 13.5, flex: 1, fontFamily: FONT.medium },
    basmala: {
      color: c.fg,
      textAlign: "center",
      writingDirection: "rtl",
      marginVertical: 12,
      fontFamily: FONT.ar,
    },
    mushaf: {
      color: c.fg,
      textAlign: "right",
      writingDirection: "rtl",
      marginTop: 8,
      fontFamily: FONT.ar,
    },
    endMarker: { color: c.accent, fontSize: 18, fontFamily: FONT.ar },
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
    chipWrap: { position: "absolute", top: 12, left: 0, right: 0, alignItems: "center" },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 999,
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    chipDone: { backgroundColor: c.accentSoft, borderColor: c.accent },
    chipText: { color: c.muted, fontSize: 12.5, fontFamily: FONT.semibold },
    chipTextDone: { color: c.accent },
    chipLabel: { color: c.accent, fontFamily: FONT.bold },
  });
}

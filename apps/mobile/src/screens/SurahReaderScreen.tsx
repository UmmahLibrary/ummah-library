import { TranslationNotice } from "../components/TranslationNotice";
import { textDir } from "../text-direction";
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
  juzNumberOf,
  pageNumberOf,
  resolveActiveTranslation,
  revealAyah,
  revealWord,
  totalWords,
  type Ayah,
  type GoToSurahName,
  type GoToTarget,
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
import { ReciteToggle, ReciteTray } from "../components/MemorizeBar";
import { BackToRow, ReaderDock } from "../components/ReaderDock";
import { GoToSheet } from "../components/GoToSheet";
import { goToNames, planGoTo } from "../goto-nav";
import { ReadingTranslationPicker } from "../components/ReadingTranslationPicker";
import { TranslationManager } from "../components/TranslationManager";
import { AyahView, type TrLine } from "../components/AyahView";
import { recordMushafPage } from "../reading-goals";
import { readActivePlan, todayProgress, todayStr, type ActivePlan } from "../plans";
import type { ReadStackParamList } from "../navigation/types";
import { useIntl } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/messages";

type Props = NativeStackScreenProps<ReadStackParamList, "SurahReader">;

export function SurahReaderScreen({ navigation, route }: Props) {
  // Deep links (surah/:surah) deliver the param as a string; in-app navigation
  // passes a number — coerce so core helpers (which require integers) are safe.
  const n = Number(route.params.surah);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, tf, num, dir, locale } = useIntl();
  const rtl = dir === "rtl";
  const settings = useSettings();
  const {
    editions,
    readingMode,
    readingTranslation,
    reciterId,
    setReciterId,
    scale,
    comfort,
    transliteration,
    wordTransliteration,
    tapToHear,
    script,
    catalogue,
    setEditions,
    setReadingMode,
    setReadingTranslation,
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

  // Go to (ADR 0041): the title opens the sheet; a jump inside this surah
  // offers "Back to" where the reader was, in the dock.
  const [gotoOpen, setGotoOpen] = useState(false);
  const [backTo, setBackTo] = useState<number | null>(null);
  const [names, setNames] = useState<GoToSurahName[]>([]);
  useEffect(() => {
    let active = true;
    void api
      .listSurahs()
      .then((list) => active && setNames(goToNames(list)))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  // The āyah the reader is on (topmost visible in verse mode), for the title,
  // the dock's position label, the start of play and the resume position.
  const [currentAya, setCurrentAya] = useState(0);
  const animated = !comfort.reduceMotion;

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
    setCurrentAya(0);
    setBackTo(null);
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
    // A failed load (e.g. a malformed deep link's out-of-range surah number)
    // must clear a previous surah's title/action instead of leaving them
    // stranded above the "Couldn't load this surah" body — setOptions only
    // runs from the `meta` branch below, so without this the header would
    // keep showing whichever surah was open before the bad navigation.
    if (error) {
      navigation.setOptions({ title: "", headerRight: undefined });
      return;
    }
    if (!meta) return;
    navigation.setOptions({
      // The title is a button: it opens Go to (ADR 0041).
      headerTitle: () => (
        <Pressable
          onPress={() => setGotoOpen(true)}
          style={styles.titleBtn}
          accessibilityRole="button"
          accessibilityLabel={tf("rd.reader.titleA11y", {
            name: meta.transliteration,
            surah: meta.number,
            n: currentAya || 1,
            total: meta.ayahCount,
          })}
        >
          <View style={styles.titleRow}>
            <Text style={styles.titleText} numberOfLines={1}>
              {num(meta.number)} · {meta.transliteration}
            </Text>
            <Icon name="chevD" size={16} color={colors.fg} sw={2} />
          </View>
          <Text style={styles.titleSub} numberOfLines={1}>
            {tf("rd.ayahOf", { n: currentAya || 1, total: meta.ayahCount })}
          </Text>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable
          onPress={openMushaf}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel={t("rd.reader.mushafA11y")}
        >
          <Icon name="layers" size={20} color={colors.accent} sw={1.8} />
          <Text style={styles.headerBtnText}>{t("rd.reader.mushaf")}</Text>
        </Pressable>
      ),
    });
  }, [navigation, meta, colors, styles, openMushaf, error, currentAya, t, tf, num]);

  // Mark continue-reading and stop audio when leaving the surah. Guarded the
  // same way as the fetch effect below — an out-of-range `n` (a malformed
  // deep link, e.g. ummahlibrary://surah/9999) must not poison the stored
  // "continue reading" surah with a number no surah list will ever match.
  useEffect(() => {
    if (Number.isInteger(n) && n >= 1 && n <= TOTAL_SURAHS) setLastRead(n);
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
        trScale={comfort.trScale}
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
      comfort.trScale,
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
  // The āyah actually at the top of the list, as measured (not as intended).
  const viewTopRef = useRef(0);
  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const aya = (viewableItems[0]?.item as { aya?: number } | undefined)?.aya;
    const s = nRef.current;
    if (aya != null) viewTopRef.current = aya;
    if (aya != null && s >= 1 && s <= TOTAL_SURAHS) {
      topAyaRef.current = aya;
      setCurrentAya(aya);
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
      listRef.current?.scrollToIndex({ index, animated, viewPosition: 0.3 });
    } catch {
      /* list not ready */
    }
  }, [playingKey, readingMode, indexOfKey, animated]);

  // Remember the āyah reached (debounced to the settled position) so Home's
  // Continue resumes here — web-compatible `ul.lastRead` {surah, aya}.
  useEffect(() => {
    if (currentAya <= 0 || !Number.isInteger(n) || n < 1 || n > TOTAL_SURAHS) return;
    const id = setTimeout(() => setLastRead(n, currentAya), 700);
    return () => clearTimeout(id);
  }, [currentAya, n, setLastRead]);

  // Scroll an āyah to the top of the verse list. The continuous reading modes
  // have no per-āyah rows to measure, so a jump switches to verse-by-verse.
  const pendingJump = useRef<number | null>(null);
  const jumpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (jumpTimer.current) clearTimeout(jumpTimer.current);
    },
    [],
  );
  const scrollToAya = useCallback(
    (aya: number) => {
      const index = indexOfKey.get(verseKeyOf({ sura: n, aya }));
      if (readingMode !== "translation" || index == null) {
        pendingJump.current = aya;
        if (readingMode !== "translation") setReadingMode("translation");
        return;
      }
      pendingJump.current = null;
      topAyaRef.current = aya;
      setCurrentAya(aya);
      // Rows have different heights and aren't measured until rendered, so the
      // first scroll to a far āyah lands near it, not on it. Check where it
      // actually landed and correct until the target āyah is at the top.
      if (jumpTimer.current) clearTimeout(jumpTimer.current);
      let tries = 0;
      const attempt = () => {
        try {
          listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0.05 });
        } catch {
          /* retried by onScrollToIndexFailed */
        }
        jumpTimer.current = setTimeout(() => {
          const off = viewTopRef.current - aya;
          if (off !== 0 && off !== -1 && tries < 6) {
            tries++;
            attempt();
          }
        }, 450);
      };
      attempt();
    },
    [indexOfKey, n, readingMode, setReadingMode, animated],
  );
  // Finish a jump queued while the rows / verse mode were still coming up.
  useEffect(() => {
    if (pendingJump.current == null || readingMode !== "translation" || rows.length === 0) return;
    const aya = pendingJump.current;
    const id = setTimeout(() => scrollToAya(aya), 60);
    return () => clearTimeout(id);
  }, [readingMode, rows.length, scrollToAya]);

  // Opening at a given āyah (Home "Continue", Go to from another surah) and
  // Home's "Listen instead", which starts the recitation there.
  const openedFor = useRef<string | null>(null);
  const routeAya = Number(route.params.aya) || 0;
  const routeListen = route.params.listen === true;
  useEffect(() => {
    if (!ayahs || ayahs.length === 0 || verses.length === 0) return;
    const tag = `${n}:${routeAya}:${routeListen}`;
    if (openedFor.current === tag) return;
    openedFor.current = tag;
    const aya = routeAya >= 1 && routeAya <= ayahs.length ? routeAya : 0;
    // Only verse-by-verse has per-āyah rows; the reading modes open at the top
    // rather than silently switching the reader's chosen mode.
    if (aya > 1 && readingMode === "translation") {
      pendingJump.current = aya;
      setTimeout(() => scrollToAya(aya), 120);
    }
    if (routeListen) playAudio(verses, { sura: n, aya: aya || 1 }, true);
  }, [ayahs, n, routeAya, routeListen, scrollToAya, playAudio, verses, readingMode]);

  const onGoTo = useCallback(
    (t: GoToTarget) => {
      const plan = planGoTo(t, n, currentAya || topAyaRef.current);
      if (plan.type === "navigate") {
        navigation.replace("SurahReader", { surah: plan.sura, aya: plan.aya });
        return;
      }
      setBackTo(plan.backTo);
      scrollToAya(plan.aya);
    },
    [n, currentAya, navigation, scrollToAya],
  );

  const shortlist = useMemo(
    () => editions.map((id) => metaById.get(id)).filter((x): x is Translation => Boolean(x)),
    [editions, metaById],
  );
  const activeTr = resolveActiveTranslation(editions, readingTranslation, DEFAULT_EDITION);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{t("rd.reader.loadErr")}</Text>
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
          {/* Decorative — the same name is fully readable, and scales normally,
              a few lines below as `nameEn`. Left scaling, a large system font
              setting overflows this fixed 94x94 ornament and breaks the crest. */}
          <Text style={styles.crestAr} allowFontScaling={false}>
            {meta.name}
          </Text>
        </View>
        <Pressable
          onPress={() => setGotoOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t("rd.reader.gotoA11y")}
          style={styles.nameBtn}
        >
          <Text style={styles.nameEn}>
            {meta.transliteration}
            {locale === "en" ? ` · ${meta.englishName}` : ""}
          </Text>
        </Pressable>
        <Text style={styles.sub}>
          {tf("rd.search.surahRef", { n: meta.number })} ·{" "}
          {tf("rd.versesCount", { n: meta.ayahCount })} ·{" "}
          {meta.revelationPlace === "meccan" ? t("rd.meccan") : t("rd.medinan")}
        </Text>
      </View>

      <ReaderControls
        mode={readingMode}
        onMode={setReadingMode}
        transliteration={transliteration}
        onTransliteration={setTransliteration}
        wordTransliteration={wordTransliteration}
        onWordTransliteration={setWordTransliteration}
        tapToHear={tapToHear}
        onTapToHear={setTapToHear}
        onManage={() => setManagerOpen(true)}
        reciterId={reciterId}
        onReciter={setReciterId}
        saved={isBookmarked(n)}
        onSave={() => toggleBookmark(n)}
      />
    </>
  );

  const footer = (
    <View style={styles.nav}>
      {n > 1 ? (
        <Pressable
          style={styles.navBtn}
          onPress={() => navigation.replace("SurahReader", { surah: n - 1 })}
          accessibilityRole="button"
          accessibilityLabel={t("rd.reader.prevSurah")}
        >
          <Text style={styles.navText}>
            {rtl ? "→" : "←"} {t("rd.reader.prevSurah")}
          </Text>
        </Pressable>
      ) : (
        <View />
      )}
      {n < TOTAL_SURAHS ? (
        <Pressable
          style={styles.navBtn}
          onPress={() => navigation.replace("SurahReader", { surah: n + 1 })}
          accessibilityRole="button"
          accessibilityLabel={t("rd.reader.nextSurah")}
        >
          <Text style={styles.navText}>
            {t("rd.reader.nextSurah")} {rtl ? "←" : "→"}
          </Text>
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
          extraData={`${playingKey ?? ""}:${activeWord}:${scale}:${comfort.trScale}:${comfort.trEmphasis}:${comfort.largeButtons}:${peek}:${revealed}:${peekExtra.size}:${hideTr}:${transliteration}:${translitMap.size}:${wordTransliteration}:${wordTranslitMap.size}:${tapToHear}:${script}:${indopakMap.size}`}
          contentContainerStyle={styles.content}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={viewabilityConfig}
          onScrollToIndexFailed={(info) => {
            // Target āyah isn't measured yet — get close by the average row
            // height so it renders, settle, then retry once.
            listRef.current?.scrollToOffset({
              offset: info.averageItemLength * info.index,
              animated: false,
            });
            setTimeout(() => {
              try {
                listRef.current?.scrollToIndex({
                  index: info.index,
                  animated,
                  viewPosition: 0.05,
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
              <TranslationNotice onChange={() => setManagerOpen(true)} />
              {showBismillah && (
                <Text style={[styles.basmala, { fontSize: 22 * scale, lineHeight: 44 * scale }]}>
                  {BISMILLAH}
                </Text>
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
            <Text style={[styles.basmala, { fontSize: 22 * scale, lineHeight: 44 * scale }]}>
              {BISMILLAH}
            </Text>
          )}

          {readingMode === "reading" && (
            <Text
              style={[
                styles.mushaf,
                script === "indopak" && { fontFamily: FONT.arIndopak, direction: "ltr" },
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
            <Text
              style={[
                styles.flow,
                textDir(metaById.get(activeTr)?.direction),
                comfort.trEmphasis === "soft" && styles.flowSoft,
                { fontSize: 17 * comfort.trScale, lineHeight: 30 * comfort.trScale },
              ]}
            >
              {ayahs.map((a) => {
                const text = trMap.get(activeTr)?.get(a.aya);
                return text ? (
                  <Text key={a.aya}>
                    <Text style={styles.flowNum}>{num(a.aya)}. </Text>
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

      {/* The dock sits below the list in the column layout — it never covers
          the Quran text. Back to, the plan chip and the Recite tray stack
          above its main row. */}
      <ReaderDock
        audio={audio}
        verses={verses}
        surah={n}
        reciterName={reciter.name}
        positionLabel={`${tf("rd.ayahOf", { n: currentAya || 1, total: meta.ayahCount })} · ${tf("rd.juzN", { n: safeJuz(n, currentAya || 1) })}`}
        startVerse={() =>
          readingMode === "translation" && currentAya > 0 ? { sura: n, aya: currentAya } : null
        }
        trailing={<ReciteToggle on={peek} onToggle={togglePeek} />}
        above={
          <>
            {backTo != null && (
              <BackToRow
                label={tf("rd.backTo", { ref: `${num(n)}:${num(backTo)}` })}
                onBack={() => {
                  const to = backTo;
                  setBackTo(null);
                  scrollToAya(to);
                }}
                onDismiss={() => setBackTo(null)}
              />
            )}
            {activePlan && !activePlan.pausedOn && (
              <PlanChip plan={activePlan} styles={styles} colors={colors} />
            )}
            {peek && (
              <ReciteTray
                hideTr={hideTr}
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
            )}
          </>
        }
      />

      <GoToSheet
        visible={gotoOpen}
        onClose={() => setGotoOpen(false)}
        names={names}
        currentSurah={n}
        onGo={onGoTo}
      />

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

function safeJuz(sura: number, aya: number): number {
  try {
    return juzNumberOf({ sura, aya });
  } catch {
    return 1;
  }
}

const UNIT_LABEL: Record<string, MessageKey> = {
  juz: "rd.unit.juz",
  hizb: "rd.unit.hizb",
  page: "rd.unit.page",
  surah: "rd.unit.surah",
  ayah: "rd.unit.ayah",
};

/**
 * Slim chip shown in the dock while a plan is active — "Plan · 2 of 3 pages today"
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
  const { t, tf } = useIntl();
  const { done, total } = todayProgress(plan, todayStr());
  if (total === 0) return null;
  const complete = done >= total;
  const unitKey = UNIT_LABEL[plan.template.range.unit];
  const unit = unitKey ? t(unitKey) : t("rd.unit.units");
  return (
    <View style={[styles.chip, complete && styles.chipDone]}>
      {complete ? (
        <>
          <Icon name="check" size={13} color={colors.accent} sw={2} />
          <Text style={[styles.chipText, styles.chipTextDone]}>{t("rd.plan.done")}</Text>
        </>
      ) : (
        <Text style={styles.chipText}>
          <Text style={styles.chipLabel}>{t("rd.plan")}</Text> ·{" "}
          {tf("rd.plan.progress", { done, total, unit })}
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
    nameBtn: { minHeight: 48, justifyContent: "center", paddingHorizontal: 8 },
    titleBtn: { minHeight: 48, justifyContent: "center", maxWidth: 230 },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    titleText: { color: c.fg, fontSize: 16, fontFamily: FONT.bold, flexShrink: 1 },
    titleSub: { color: c.muted, fontSize: 13, fontFamily: FONT.medium },
    headerBtn: {
      minHeight: 48,
      minWidth: 48,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    headerBtnText: { color: c.fg, fontSize: 13, fontFamily: FONT.semibold },
    basmala: {
      paddingVertical: 4,
      color: c.fg,
      textAlign: "center",
      writingDirection: "rtl",
      marginVertical: 12,
      fontFamily: FONT.arQuran,
      direction: "ltr",
    },
    mushaf: {
      paddingVertical: 4,
      color: c.fg,
      textAlign: "right",
      writingDirection: "rtl",
      marginTop: 8,
      fontFamily: FONT.arQuran,
      direction: "ltr",
    },
    endMarker: { color: c.accent, fontSize: 18, fontFamily: FONT.arQuran, direction: "ltr" },
    flow: { color: c.fg, marginTop: 4 },
    flowSoft: { color: c.muted },
    flowNum: { color: c.accent, fontWeight: "700" },
    nav: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 28,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    navBtn: { minHeight: 48, justifyContent: "center", paddingHorizontal: 4 },
    navText: { color: c.fg, fontSize: 15, fontWeight: "600" },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      minHeight: 32,
      paddingHorizontal: 14,
      borderRadius: 999,
      backgroundColor: c.bg,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipDone: { backgroundColor: c.accentSoft, borderColor: c.accent },
    chipText: { color: c.muted, fontSize: 13.5, fontFamily: FONT.semibold },
    chipTextDone: { color: c.fg },
    chipLabel: { color: c.fg, fontFamily: FONT.bold },
  });
}

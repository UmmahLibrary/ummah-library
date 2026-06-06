import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import {
  TOTAL_SURAHS,
  reciterAudioUrl,
  type Ayah,
  type ReciterPlugin,
  type Surah,
  type TranslatedAyah,
} from "@ummahlibrary/core";

const API = "https://app.ummahlibrary.org/api/v1";
const TRANSLATION = "eng-khattab";

// The single bundled reciter. Mobile only depends on `core`, so rather than
// reach into the data-package plugin registry we carry the manifest here and
// build URLs with the pure `reciterAudioUrl` helper (the same logic the web
// reader uses). Mirrors packages/data/plugins/reciters/alafasy.json.
const RECITER: ReciterPlugin = {
  kind: "reciter",
  id: "alafasy",
  name: "Mishary Rashid Alafasy",
  language: "ar",
  style: "Murattal",
  audioUrlTemplate: "https://everyayah.com/data/Alafasy_128kbps/{surah:3}{ayah:3}.mp3",
  quranComId: 7,
};

type Screen = { kind: "list" } | { kind: "reader"; surah: number };

interface ReaderAyah {
  aya: number;
  arabic: string;
  english: string;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>({ kind: "list" });
  return (
    <View style={styles.app}>
      <StatusBar style="light" />
      {screen.kind === "list" ? (
        <SurahList onOpen={(surah) => setScreen({ kind: "reader", surah })} />
      ) : (
        <SurahReader surah={screen.surah} onBack={() => setScreen({ kind: "list" })} />
      )}
    </View>
  );
}

function SurahList({ onOpen }: { onOpen: (surah: number) => void }) {
  const [surahs, setSurahs] = useState<Surah[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getJson<{ surahs: Surah[] }>(`${API}/surahs`)
      .then((d) => setSurahs(d.surahs))
      .catch(() => setError(true));
  }, []);

  return (
    <View style={styles.screen}>
      <Text style={styles.h1}>Ummah Library</Text>
      <Text style={styles.subtitle}>Read the Quran · {TOTAL_SURAHS} surahs</Text>
      {error && <Text style={styles.error}>Couldn’t load surahs. Check your connection.</Text>}
      {!surahs && !error && <ActivityIndicator color="#3fae7d" style={styles.spinner} />}
      <FlatList
        data={surahs ?? []}
        keyExtractor={(s) => String(s.number)}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => onOpen(item.number)}>
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

function SurahReader({ surah, onBack }: { surah: number; onBack: () => void }) {
  const [meta, setMeta] = useState<Surah | null>(null);
  const [ayahs, setAyahs] = useState<ReaderAyah[] | null>(null);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);

  // Token cancels a stale playback sequence; the current player is released on
  // every transition so only one ayah ever plays at a time.
  const playerRef = useRef<AudioPlayer | null>(null);
  const tokenRef = useRef(0);

  useEffect(() => {
    Promise.all([
      getJson<{ surah: Surah; ayahs: Ayah[] }>(`${API}/surahs/${surah}`),
      getJson<{ ayahs: TranslatedAyah[] }>(`${API}/surahs/${surah}/translations/${TRANSLATION}`),
    ])
      .then(([ar, tr]) => {
        const english = new Map(tr.ayahs.map((a) => [a.aya, a.text]));
        setMeta(ar.surah);
        setAyahs(
          ar.ayahs.map((a) => ({ aya: a.aya, arabic: a.text, english: english.get(a.aya) ?? "" })),
        );
      })
      .catch(() => setError(true));
  }, [surah]);

  useEffect(() => {
    // Keep audio audible when the iOS ringer is silenced.
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  const release = useCallback((player: AudioPlayer | null) => {
    if (player) {
      try {
        player.remove();
      } catch {
        /* already released */
      }
    }
  }, []);

  const stop = useCallback(() => {
    tokenRef.current += 1;
    setPlaying(null);
    const player = playerRef.current;
    playerRef.current = null;
    release(player);
  }, [release]);

  // Stop playback when the surah changes or the screen unmounts.
  useEffect(() => {
    return () => {
      stop();
    };
  }, [surah, stop]);

  const playFrom = useCallback(
    async (startAya: number) => {
      const list = ayahs;
      if (!list) return;
      const token = ++tokenRef.current;
      release(playerRef.current);
      playerRef.current = null;

      for (const a of list.filter((x) => x.aya >= startAya)) {
        if (tokenRef.current !== token) return;
        setPlaying(a.aya);
        const player = createAudioPlayer({
          uri: reciterAudioUrl(RECITER, { sura: surah, aya: a.aya }),
        });
        playerRef.current = player;
        player.play();
        await new Promise<void>((resolve) => {
          const sub = player.addListener("playbackStatusUpdate", (status) => {
            if (status.didJustFinish) {
              sub.remove();
              resolve();
            }
          });
        });
        release(player);
        if (tokenRef.current !== token) return;
      }
      if (tokenRef.current === token) setPlaying(null);
    },
    [ayahs, surah, release],
  );

  const isPlaying = playing !== null;

  return (
    <View style={styles.screen}>
      <Pressable onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>‹ All surahs</Text>
      </Pressable>
      {meta && (
        <View style={styles.readerHead}>
          <Text style={styles.readerArabic}>{meta.name}</Text>
          <Text style={styles.readerTitle}>
            {meta.transliteration} · {meta.englishName}
          </Text>
          {ayahs && (
            <Pressable
              style={styles.playSurah}
              onPress={() => (isPlaying ? stop() : playFrom(ayahs[0]?.aya ?? 1))}
            >
              <Text style={styles.playSurahText}>
                {isPlaying ? "■ Stop" : "▶ Play surah"} · {RECITER.name}
              </Text>
            </Pressable>
          )}
        </View>
      )}
      {error && <Text style={styles.error}>Couldn’t load this surah.</Text>}
      {!ayahs && !error && <ActivityIndicator color="#3fae7d" style={styles.spinner} />}
      <ScrollView>
        {(ayahs ?? []).map((a) => (
          <Pressable
            key={a.aya}
            style={[styles.ayah, playing === a.aya && styles.ayahActive]}
            onPress={() => (playing === a.aya ? stop() : playFrom(a.aya))}
          >
            <Text style={styles.ayahArabic}>
              {a.arabic} <Text style={styles.ayahMark}>﴿{a.aya}﴾</Text>
            </Text>
            {a.english ? <Text style={styles.ayahEn}>{a.english}</Text> : null}
          </Pressable>
        ))}
        <View style={styles.foot} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: "#0b0f0e", paddingTop: 56 },
  screen: { flex: 1, paddingHorizontal: 18 },
  h1: { color: "#e7efe9", fontSize: 26, fontWeight: "700" },
  subtitle: { color: "#9fb3a6", fontSize: 14, marginBottom: 16 },
  spinner: { marginTop: 40 },
  error: { color: "#ff8a7e", marginTop: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2a27",
  },
  num: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#16241d",
    alignItems: "center",
    justifyContent: "center",
  },
  numText: { color: "#3fae7d", fontSize: 13 },
  rowMeta: { flex: 1 },
  rowTitle: { color: "#e7efe9", fontSize: 16, fontWeight: "600" },
  rowSub: { color: "#9fb3a6", fontSize: 12 },
  rowArabic: { color: "#e7efe9", fontSize: 22, writingDirection: "rtl" },
  back: { paddingVertical: 8 },
  backText: { color: "#3fae7d", fontSize: 15 },
  readerHead: { alignItems: "center", paddingVertical: 16 },
  readerArabic: { color: "#e7efe9", fontSize: 34, writingDirection: "rtl" },
  readerTitle: { color: "#9fb3a6", fontSize: 14, marginTop: 4 },
  playSurah: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#16241d",
  },
  playSurahText: { color: "#3fae7d", fontSize: 13, fontWeight: "600" },
  ayah: {
    paddingVertical: 16,
    paddingHorizontal: 10,
    marginHorizontal: -10,
    borderRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2a27",
  },
  ayahActive: { backgroundColor: "#16241d", borderBottomColor: "transparent" },
  ayahArabic: {
    color: "#e7efe9",
    fontSize: 26,
    lineHeight: 46,
    textAlign: "right",
    writingDirection: "rtl",
  },
  ayahMark: { color: "#3fae7d", fontSize: 18 },
  ayahEn: { color: "#9fb3a6", fontSize: 15, marginTop: 10, lineHeight: 23 },
  foot: { height: 60 },
});

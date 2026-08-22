/**
 * Offline downloads manager (#202, mobile parity with `apps/web`'s `/downloads`):
 * lists the reciter audio saved on this device (`expo-file-system`), with size
 * and delete. Reads the `AudioStore` directly — a client/device concern, same as
 * the web adapter.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import { useFocusEffect } from "@react-navigation/native";
import { ayahCountOf, type DownloadedSurah } from "@ummahlibrary/core";
import { Icon } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { api } from "../api";
import { RECITERS } from "../plugins";
import { mobileAudioStore } from "../audio/audio-store";

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

const RECITER_NAMES: Record<string, string> = Object.fromEntries(
  RECITERS.map((r) => [r.id, r.name]),
);

export function DownloadsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [items, setItems] = useState<DownloadedSurah[] | null>(null);
  const [surahNames, setSurahNames] = useState<Record<number, string>>({});

  const refresh = useCallback(() => {
    void mobileAudioStore.savedSurahs().then((saved) => setItems([...saved]));
  }, []);

  // Re-read on every focus, not just on mount — a download started from a surah
  // reader and finished elsewhere shouldn't leave this screen showing stale
  // (or "nothing downloaded yet") state when the user navigates back to it.
  useFocusEffect(refresh);

  useEffect(() => {
    void api
      .listSurahs()
      .then((list) => setSurahNames(Object.fromEntries(list.map((s) => [s.number, s.transliteration]))))
      .catch(() => {
        /* names are cosmetic — the list still renders by number */
      });
  }, []);

  if (items === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const total = items.reduce((n, i) => n + i.bytes, 0);

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Icon name="download" size={40} color={colors.faint} sw={1.5} />
        <Text style={styles.emptyTitle}>Nothing downloaded yet</Text>
        <Text style={styles.emptyDesc}>
          Open a surah and tap the download button in the audio bar to save it for offline
          listening. Saved recitations play with no connection.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.summary}>
        {items.length} download{items.length === 1 ? "" : "s"} · {fmtBytes(total)} on this device
      </Text>
      {items.map((it) => {
        const full = ayahCountOf(it.surah);
        const partial = it.ayahCount < full;
        return (
          <View key={`${it.reciterId}:${it.surah}`} style={styles.card}>
            <View style={styles.info}>
              <Text style={styles.title}>{surahNames[it.surah] ?? `Surah ${it.surah}`}</Text>
              <Text style={styles.sub}>
                {RECITER_NAMES[it.reciterId] ?? it.reciterId} · {it.ayahCount}/{full} āyāt ·{" "}
                {fmtBytes(it.bytes)}
                {partial ? <Text style={styles.partial}> · incomplete</Text> : null}
              </Text>
            </View>
            <Pressable
              style={styles.deleteBtn}
              onPress={async () => {
                await mobileAudioStore.removeSurah(it.reciterId, it.surah);
                refresh();
              }}
              accessibilityLabel={`Delete ${surahNames[it.surah] ?? `Surah ${it.surah}`} download`}
              hitSlop={8}
            >
              <Icon name="close" size={16} color={colors.muted} sw={1.8} />
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { padding: 16, gap: 10 },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
      gap: 10,
      backgroundColor: c.bg,
    },
    emptyTitle: { color: c.fg, fontSize: 16, fontFamily: FONT.semibold, marginTop: 4 },
    emptyDesc: { color: c.muted, fontSize: 13.5, textAlign: "center", lineHeight: 20 },
    summary: { color: c.faint, fontSize: 12.5 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: c.bgElev,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
    },
    info: { flex: 1, gap: 3 },
    title: { color: c.fg, fontSize: 15, fontFamily: FONT.semibold },
    sub: { color: c.faint, fontSize: 12.5 },
    partial: { color: c.accent },
    deleteBtn: {
      width: 34,
      height: 34,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}

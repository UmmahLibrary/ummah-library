/**
 * Offline downloads manager (#202, mobile parity with `apps/web`'s `/downloads`):
 * lists the reciter audio saved on this device (`expo-file-system`), with size
 * and delete. Reads the `AudioStore` directly — a client/device concern, same as
 * the web adapter.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import { useFocusEffect } from "@react-navigation/native";
import { ayahCountOf, type DownloadedSurah } from "@ummahlibrary/core";
import { Icon } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { api } from "../api";
import { RECITERS } from "../plugins";
import { mobileAudioStore } from "../audio/audio-store";
import { useIntl } from "../i18n/I18nProvider";

/** Size with the interface language's digits; the unit symbols stay international. */
function fmtBytes(b: number, num: (n: number) => string): string {
  if (b < 1024) return `${num(b)} B`;
  if (b < 1024 * 1024) return `${num(Math.round(b / 1024))} KB`;
  return `${num(Math.round((b / 1024 / 1024) * 10) / 10)} MB`;
}

const RECITER_NAMES: Record<string, string> = Object.fromEntries(
  RECITERS.map((r) => [r.id, r.name]),
);

export function DownloadsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, tf, num } = useIntl();
  const nameOf = (n: number) => surahNames[n] ?? tf("rd.search.surahRef", { n });
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
      .then((list) =>
        setSurahNames(Object.fromEntries(list.map((s) => [s.number, s.transliteration]))),
      )
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
        <Text style={styles.emptyTitle}>{t("rd.downloads.empty")}</Text>
        <Text style={styles.emptyDesc}>{t("rd.downloads.emptyHint")}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.summary}>
        {tf(items.length === 1 ? "rd.downloads.summary1" : "rd.downloads.summaryN", {
          n: items.length,
          size: fmtBytes(total, num),
        })}
      </Text>
      {items.map((it) => {
        const full = ayahCountOf(it.surah);
        const partial = it.ayahCount < full;
        return (
          <View key={`${it.reciterId}:${it.surah}`} style={styles.card}>
            <View style={styles.info}>
              <Text style={styles.title}>{nameOf(it.surah)}</Text>
              <Text style={styles.sub}>
                {RECITER_NAMES[it.reciterId] ?? it.reciterId} ·{" "}
                {tf("rd.downloads.ayahs", { done: it.ayahCount, total: full })} ·{" "}
                {fmtBytes(it.bytes, num)}
                {partial ? (
                  <Text style={styles.partial}> · {t("rd.downloads.incomplete")}</Text>
                ) : null}
              </Text>
            </View>
            <Pressable
              style={styles.deleteBtn}
              onPress={() => {
                Alert.alert(
                  t("rd.downloads.deleteTitle"),
                  tf("rd.downloads.deleteMsg", { name: nameOf(it.surah) }),
                  [
                    { text: t("rd.cancel"), style: "cancel" },
                    {
                      text: t("rd.delete"),
                      style: "destructive",
                      onPress: async () => {
                        await mobileAudioStore.removeSurah(it.reciterId, it.surah);
                        refresh();
                      },
                    },
                  ],
                );
              }}
              accessibilityLabel={tf("rd.downloads.deleteA11y", { name: nameOf(it.surah) })}
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

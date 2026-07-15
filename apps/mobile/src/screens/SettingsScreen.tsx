import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import type { QuranScript } from "@ummahlibrary/core";
import { noorThemes } from "@ummahlibrary/ui";
import { useTheme, THEMES, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useSettings } from "../state/SettingsContext";
import { RECITER, RECITERS } from "../plugins";
import { MAX_SCALE, MIN_SCALE } from "../types";
import { clearCache, getCacheStats } from "../offlineCache";

/** "1.2 MB", "845 KB", "0 B" — for the cached-content size shown in Settings. */
function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Arabic script options (ADR 0035). */
const SCRIPTS: { id: QuranScript; label: string; sub: string }[] = [
  { id: "uthmani", label: "Uthmani", sub: "Madinah mushaf (default)" },
  { id: "indopak", label: "IndoPak", sub: "South Asian script" },
];

export function SettingsScreen() {
  const { colors, themeKey, setTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { scale, setScale, reciterId, tafsirId, tafsirs, setTafsirId, script, setScript } =
    useSettings();
  const reciter = RECITERS.find((r) => r.id === reciterId) ?? RECITER;

  const [cacheStats, setCacheStats] = useState<{ sizeBytes: number; entryCount: number } | null>(
    null,
  );
  const refreshCacheStats = useCallback(() => {
    void getCacheStats().then(setCacheStats);
  }, []);
  useEffect(refreshCacheStats, [refreshCacheStats]);

  function confirmClearCache() {
    Alert.alert(
      "Clear cached content",
      "Removes offline copies of surahs, translations, tafsir, and hadith you've opened. They'll be re-downloaded next time you're online.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => void clearCache().then(refreshCacheStats),
        },
      ],
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>Appearance</Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Theme</Text>
        <View style={styles.swatchRow}>
          {THEMES.map((t) => {
            const on = t.key === themeKey;
            return (
              <Pressable
                key={t.key}
                onPress={() => setTheme(t.key)}
                style={[
                  styles.swatch,
                  { backgroundColor: noorThemes[t.key].bg, borderColor: on ? colors.accent : colors.border },
                ]}
                accessibilityLabel={t.label}
              >
                <View style={[styles.swatchDot, { backgroundColor: noorThemes[t.key].accent }]} />
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={styles.sectionLabel}>Reading</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Font size</Text>
          <View style={styles.scale}>
            <Pressable
              style={[styles.scaleBtn, scale <= MIN_SCALE && styles.disabled]}
              disabled={scale <= MIN_SCALE}
              onPress={() => setScale(scale - 0.1)}
            >
              <Text style={styles.scaleText}>A−</Text>
            </Pressable>
            <Text style={styles.scaleValue}>{Math.round(scale * 100)}%</Text>
            <Pressable
              style={[styles.scaleBtn, scale >= MAX_SCALE && styles.disabled]}
              disabled={scale >= MAX_SCALE}
              onPress={() => setScale(scale + 0.1)}
            >
              <Text style={styles.scaleText}>A+</Text>
            </Pressable>
          </View>
        </View>
        <View style={[styles.row, styles.rowLast]}>
          <Text style={styles.rowLabel}>Reciter</Text>
          <Text style={styles.value}>{reciter.name}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Arabic script</Text>
      <View style={styles.card}>
        {SCRIPTS.map((s, i) => {
          const on = s.id === script;
          return (
            <Pressable
              key={s.id}
              style={[styles.pickRow, i < SCRIPTS.length - 1 && styles.rowDivider]}
              onPress={() => setScript(s.id)}
            >
              <View style={[styles.radio, on && styles.radioOn]}>
                {on && <View style={styles.radioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.pickText, on && styles.pickTextOn]}>{s.label}</Text>
                <Text style={styles.pickSub}>{s.sub}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Tafsir edition</Text>
      <View style={styles.card}>
        {tafsirs.length === 0 ? (
          <Text style={styles.muted}>Loading tafsir editions…</Text>
        ) : (
          tafsirs.map((t, i) => {
            const on = t.id === tafsirId;
            return (
              <Pressable
                key={t.id}
                style={[styles.pickRow, i < tafsirs.length - 1 && styles.rowDivider]}
                onPress={() => setTafsirId(t.id)}
              >
                <View style={[styles.radio, on && styles.radioOn]}>
                  {on && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pickText, on && styles.pickTextOn]}>{t.name}</Text>
                  <Text style={styles.pickSub}>{t.author}</Text>
                </View>
              </Pressable>
            );
          })
        )}
      </View>

      <Text style={styles.sectionLabel}>Data</Text>
      <View style={styles.card}>
        <View style={[styles.row, styles.rowLast]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Cached content</Text>
            <Text style={styles.pickSub}>
              Surahs, translations, tafsir, and hadith you've opened stay readable offline.
            </Text>
          </View>
          <Text style={styles.value}>
            {cacheStats === null
              ? "…"
              : cacheStats.entryCount === 0
                ? "Empty"
                : `${formatBytes(cacheStats.sizeBytes)} · ${cacheStats.entryCount}`}
          </Text>
        </View>
        <Pressable
          style={[styles.clearBtn, (!cacheStats || cacheStats.entryCount === 0) && styles.disabled]}
          disabled={!cacheStats || cacheStats.entryCount === 0}
          onPress={confirmClearCache}
        >
          <Text style={styles.clearBtnText}>Clear cached content</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>About</Text>
      <Text style={styles.muted}>
        Arabic text: Tanzil (CC-BY 3.0). Translations, tafsir, and hadith via Ummah Library
        datasets and their respective sources. Recitation by {RECITER.name}.
      </Text>
      <Text style={styles.version}>Ummah Library · v1.0.0</Text>
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 18, paddingBottom: 32 },
    sectionLabel: {
      color: c.faint,
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      fontFamily: FONT.bold,
      marginTop: 22,
      marginBottom: 11,
    },
    card: {
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 16,
    },
    cardLabel: { color: c.fg, fontSize: 14.5, fontFamily: FONT.semibold, marginBottom: 13 },
    swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },
    swatch: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    swatchDot: { width: 13, height: 13, borderRadius: 7 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSoft,
    },
    rowLast: { borderBottomWidth: 0, paddingBottom: 0 },
    rowLabel: { color: c.fg, fontSize: 15.5, fontFamily: FONT.semibold },
    value: { color: c.muted, fontSize: 15 },
    scale: { flexDirection: "row", alignItems: "center", gap: 12 },
    scaleBtn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bg,
    },
    disabled: { opacity: 0.4 },
    scaleText: { color: c.fg, fontSize: 14, fontFamily: FONT.semibold },
    scaleValue: { color: c.muted, fontSize: 14, minWidth: 44, textAlign: "center" },
    muted: { color: c.muted, fontSize: 14, lineHeight: 22 },
    pickRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
    rowDivider: { borderBottomWidth: 1, borderBottomColor: c.borderSoft },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: c.faint,
      alignItems: "center",
      justifyContent: "center",
    },
    radioOn: { borderColor: c.accent },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent },
    pickText: { color: c.fg, fontSize: 15, fontFamily: FONT.medium },
    pickTextOn: { color: c.accent, fontFamily: FONT.semibold },
    pickSub: { color: c.faint, fontSize: 12, marginTop: 2 },
    clearBtn: {
      marginTop: 13,
      paddingVertical: 11,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bg,
      alignItems: "center",
    },
    clearBtnText: { color: c.fg, fontSize: 14.5, fontFamily: FONT.semibold },
    version: { color: c.faint, fontSize: 13, marginTop: 16 },
  });
}

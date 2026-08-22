import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import Constants from "expo-constants";
import type { MergeStrategy, QuranScript } from "@ummahlibrary/core";
import { noorThemes } from "@ummahlibrary/ui";
import { useTheme, THEMES, type Palette } from "../theme";
import { useI18n } from "../i18n/I18nProvider";
import { LOCALES } from "../i18n/config";
import { FONT } from "../fonts";
import { useSettings } from "../state/SettingsContext";
import { RECITER, RECITERS } from "../plugins";
import { MAX_SCALE, MIN_SCALE } from "../types";
import { clearCache, getCacheStats } from "../offlineCache";
import { clearAllData, exportBackup, importBackup, itemCount } from "../backup";
import { SyncSection } from "../components/SyncSection";

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
  const { locale, setLocale, t } = useI18n();
  const {
    scale,
    setScale,
    reciterId,
    setReciterId,
    tafsirId,
    tafsirs,
    setTafsirId,
    script,
    setScript,
  } = useSettings();

  // Local data backup (parity with the web Settings → Data section).
  const [strategy, setStrategy] = useState<MergeStrategy>("replace");
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    itemCount().then((n) => active && setCount(n));
    return () => {
      active = false;
    };
  }, [status]);

  const onExport = async () => {
    setBusy(true);
    const res = await exportBackup();
    setBusy(false);
    if (res.message) setStatus(res);
  };

  const onImport = async () => {
    setBusy(true);
    const res = await importBackup(strategy);
    setBusy(false);
    // importBackup writes AsyncStorage directly, bypassing the settings/theme/
    // library contexts' own setters, so an already-open screen won't reflect
    // the restored values (e.g. theme, reciter) until the app restarts —
    // same caveat web's Data section states explicitly (DataBackup.tsx).
    if (res.message) {
      setStatus({ ...res, message: res.ok ? `${res.message} Restart the app to see it fully applied.` : res.message });
    }
  };

  const onErase = () => {
    Alert.alert(
      "Erase all data?",
      "This removes every bookmark, note, prayer log and setting on this device. It can’t be undone. Restart the app afterwards to see the reset fully applied.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Erase",
          style: "destructive",
          onPress: async () => {
            const n = await clearAllData();
            // clearAllData wipes AsyncStorage directly, bypassing the settings/
            // theme/library contexts' own setters, so this screen (and others)
            // keep showing the erased values until the app restarts — mirrors
            // web's "Cleared N items. Reload to start fresh." (DataBackup.tsx).
            setStatus({
              ok: true,
              message: `Cleared ${n} item${n === 1 ? "" : "s"}. Restart the app to start fresh.`,
            });
          },
        },
      ],
    );
  };

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

      <Text style={styles.sectionLabel}>{t("common.language")}</Text>
      <View style={styles.card}>
        <Text style={styles.pickSub}>{t("settings.languageHint")}</Text>
        <View style={[styles.swatchRow, { marginTop: 13 }]}>
          {LOCALES.map((l) => {
            const on = l.code === locale;
            return (
              <Pressable
                key={l.code}
                onPress={() => setLocale(l.code)}
                style={[styles.langPill, on && styles.langPillOn]}
                accessibilityLabel={l.label}
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.pillText, on && styles.pillTextOn]}>{l.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={styles.sectionLabel}>Reading</Text>
      <View style={styles.card}>
        <View style={[styles.row, styles.rowLast]}>
          <Text style={styles.rowLabel}>Font size</Text>
          <View style={styles.scale}>
            <Pressable
              style={[styles.scaleBtn, scale <= MIN_SCALE && styles.disabled]}
              disabled={scale <= MIN_SCALE}
              onPress={() => setScale((prev) => prev - 0.1)}
            >
              <Text style={styles.scaleText}>A−</Text>
            </Pressable>
            <Text style={styles.scaleValue}>{Math.round(scale * 100)}%</Text>
            <Pressable
              style={[styles.scaleBtn, scale >= MAX_SCALE && styles.disabled]}
              disabled={scale >= MAX_SCALE}
              onPress={() => setScale((prev) => prev + 0.1)}
            >
              <Text style={styles.scaleText}>A+</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Reciter</Text>
      <View style={styles.card}>
        {RECITERS.map((r, i) => {
          const on = r.id === reciterId;
          return (
            <Pressable
              key={r.id}
              style={[styles.pickRow, i < RECITERS.length - 1 && styles.rowDivider]}
              onPress={() => setReciterId(r.id)}
            >
              <View style={[styles.radio, on && styles.radioOn]}>
                {on && <View style={styles.radioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.pickText, on && styles.pickTextOn]}>{r.name}</Text>
                <Text style={styles.pickSub}>{r.style}</Text>
              </View>
            </Pressable>
          );
        })}
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

      <Text style={styles.dataDesc}>
        Everything stays on this device — no account, no server. Export a backup to move your data
        to another device or keep it safe; import it to restore.
      </Text>
      <View style={styles.card}>
        <View style={styles.btnRow}>
          <Pressable
            style={[styles.primaryBtn, busy && styles.disabled]}
            disabled={busy}
            onPress={onExport}
          >
            <Text style={styles.primaryBtnText}>Export my data</Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryBtn, busy && styles.disabled]}
            disabled={busy}
            onPress={onImport}
          >
            <Text style={styles.secondaryBtnText}>Import a backup</Text>
          </Pressable>
          {busy && <ActivityIndicator color={colors.accent} />}
        </View>

        <Text style={styles.onImportLabel}>On import</Text>
        <View style={styles.pillRow}>
          {(
            [
              { v: "replace", l: "Replace my data" },
              { v: "keep-mine", l: "Keep mine on conflict" },
            ] as const
          ).map((o) => {
            const on = strategy === o.v;
            return (
              <Pressable
                key={o.v}
                style={[styles.pill, on && styles.pillOn]}
                onPress={() => setStrategy(o.v)}
              >
                <Text style={[styles.pillText, on && styles.pillTextOn]}>{o.l}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.pillHint}>
          {strategy === "replace"
            ? "The backup fully restores your data, overwriting what’s here."
            : "The backup only fills in things you don’t already have."}
        </Text>

        {status && (
          <Text style={[styles.status, status.ok ? styles.statusOk : styles.statusErr]}>
            {status.message}
          </Text>
        )}

        <View style={styles.dataFoot}>
          <Text style={styles.countText}>
            {count ?? "—"} item{count === 1 ? "" : "s"} on this device
          </Text>
          <Pressable onPress={onErase} hitSlop={8}>
            <Text style={styles.eraseText}>Erase all</Text>
          </Pressable>
        </View>
      </View>

      <SyncSection />

      <Text style={styles.sectionLabel}>About</Text>
      <Text style={styles.muted}>
        Arabic text: Tanzil (CC-BY 3.0). Translations, tafsir, and hadith via Ummah Library
        datasets and their respective sources. Recitation by {RECITER.name}.
      </Text>
      <Text style={styles.version}>
        Ummah Library · v{Constants.expoConfig?.version ?? "—"}
      </Text>
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
    langPill: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bg,
    },
    langPillOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
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
    dataDesc: { color: c.muted, fontSize: 13.5, lineHeight: 21, marginBottom: 12 },
    btnRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10 },
    primaryBtn: {
      paddingVertical: 11,
      paddingHorizontal: 18,
      borderRadius: 11,
      backgroundColor: c.accent,
    },
    primaryBtnText: { color: c.ink, fontSize: 14.5, fontFamily: FONT.bold },
    secondaryBtn: {
      paddingVertical: 11,
      paddingHorizontal: 18,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bg,
    },
    secondaryBtnText: { color: c.fg, fontSize: 14.5, fontFamily: FONT.semibold },
    onImportLabel: {
      color: c.faint,
      fontSize: 12,
      letterSpacing: 1,
      textTransform: "uppercase",
      fontFamily: FONT.bold,
      marginTop: 20,
      marginBottom: 10,
    },
    pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    pill: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
    },
    pillOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    pillText: { color: c.muted, fontSize: 13, fontFamily: FONT.semibold },
    pillTextOn: { color: c.accent },
    pillHint: { color: c.faint, fontSize: 12.5, lineHeight: 19, marginTop: 12 },
    status: { fontSize: 13.5, marginTop: 14 },
    statusOk: { color: c.accent },
    statusErr: { color: c.error },
    dataFoot: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 18,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: c.borderSoft,
    },
    countText: { color: c.faint, fontSize: 13 },
    eraseText: { color: c.error, fontSize: 13.5, fontFamily: FONT.semibold },
  });
}

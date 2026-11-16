import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "../Type";
import Constants from "expo-constants";
import type { MergeStrategy, QuranScript } from "@ummahlibrary/core";
import { noorThemes, SectionHeader, type IconName } from "@ummahlibrary/ui";
import { useTheme, THEMES, type Palette } from "../theme";
import { useI18n, useIntl } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/messages";
import { LOCALES, localeDir } from "../i18n/config";
import { FONT } from "../fonts";
import { useSettings } from "../state/SettingsContext";
import { RECITER, RECITERS } from "../plugins";
import { clearCache, getCacheStats } from "../offlineCache";
import { clearAllData, exportBackup, importBackup, itemCount } from "../backup";
import { SyncSection } from "../components/SyncSection";
import { ComfortSettings } from "../components/ComfortSettings";

/** "1.2 MB", "845 KB", "0 B" — for the cached-content size shown in Settings. */
function formatBytes(bytes: number, num: (n: number) => string): string {
  if (bytes <= 0) return `${num(0)} B`;
  if (bytes < 1024) return `${num(bytes)} B`;
  if (bytes < 1024 * 1024) return `${num(Math.round(bytes / 1024))} KB`;
  return `${num(Number((bytes / (1024 * 1024)).toFixed(1)))} MB`;
}

/** Arabic script options (ADR 0035). */
const SCRIPTS: { id: QuranScript; label: string; sub: MessageKey }[] = [
  { id: "uthmani", label: "Uthmani", sub: "set.script.uthmaniSub" },
  { id: "indopak", label: "IndoPak", sub: "set.script.indopakSub" },
];

export function SettingsScreen() {
  const { colors, themeKey, setTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { locale, setLocale, t } = useI18n();
  const { tf, num } = useIntl();
  const { reciterId, setReciterId, tafsirId, tafsirs, setTafsirId, script, setScript } =
    useSettings();

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
      setStatus({
        ...res,
        message: res.ok ? `${res.message} ${t("set.restartSuffix")}` : res.message,
      });
    }
  };

  const onErase = () => {
    Alert.alert(t("set.eraseTitle"), t("set.eraseMsg"), [
      { text: t("set.cancel"), style: "cancel" },
      {
        text: t("set.erase"),
        style: "destructive",
        onPress: async () => {
          const n = await clearAllData();
          // clearAllData wipes AsyncStorage directly, bypassing the settings/
          // theme/library contexts' own setters, so this screen (and others)
          // keep showing the erased values until the app restarts — mirrors
          // web's "Cleared N items. Reload to start fresh." (DataBackup.tsx).
          setStatus({
            ok: true,
            message: tf(n === 1 ? "set.clearedOne" : "set.clearedOther", { n }),
          });
        },
      },
    ]);
  };

  const [cacheStats, setCacheStats] = useState<{ sizeBytes: number; entryCount: number } | null>(
    null,
  );
  const refreshCacheStats = useCallback(() => {
    void getCacheStats().then(setCacheStats);
  }, []);
  useEffect(refreshCacheStats, [refreshCacheStats]);

  function confirmClearCache() {
    Alert.alert(t("set.clearCache"), t("set.clearCacheMsg"), [
      { text: t("set.cancel"), style: "cancel" },
      {
        text: t("set.clear"),
        style: "destructive",
        onPress: () => void clearCache().then(refreshCacheStats),
      },
    ]);
  }

  // Shared section heading (ADR 0042): icon tile, title and purpose, the
  // same anatomy as the web Settings sections.
  const uiScript = localeDir(locale) === "rtl" ? "arabic" : "latin";
  const header = (icon: IconName, title: MessageKey, note?: MessageKey) => (
    <View style={styles.sectionHead}>
      <SectionHeader
        icon={icon}
        title={t(title)}
        note={note ? t(note) : undefined}
        script={uiScript}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={[styles.card, styles.firstSection]}>
          {header("globe", "common.language", "set.note.language")}
          <Text style={[styles.pickSub, { writingDirection: localeDir(locale) }]}>
            {t("settings.languageHint")}
          </Text>
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

        <View style={[styles.card, styles.section]}>
          {header("sun", "set.appearance", "set.note.appearance")}
          <Text style={styles.cardLabel}>{t("set.theme")}</Text>
          <View style={styles.swatchRow}>
            {THEMES.map((th) => {
              const on = th.key === themeKey;
              return (
                <Pressable
                  key={th.key}
                  onPress={() => setTheme(th.key)}
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: noorThemes[th.key].bg,
                      borderColor: on ? colors.accent : colors.border,
                    },
                  ]}
                  accessibilityLabel={t(`set.theme.${th.key}` as MessageKey)}
                  accessibilityState={{ selected: on }}
                >
                  <View
                    style={[styles.swatchDot, { backgroundColor: noorThemes[th.key].accent }]}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        <ComfortSettings header={header("type", "set.comfort", "set.note.comfort")} />

        <View style={[styles.card, styles.section]}>
          {header("book", "set.script", "set.note.script")}
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
                  <Text style={styles.pickSub}>{t(s.sub)}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.card, styles.section]}>
          {header("headphones", "set.reciter", "set.note.reciter")}
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

        <View style={[styles.card, styles.section]}>
          {header("tafsir", "set.tafsir", "set.note.tafsir")}
          {tafsirs.length === 0 ? (
            <Text style={styles.muted}>{t("set.tafsirLoading")}</Text>
          ) : (
            tafsirs.map((ed, i) => {
              const on = ed.id === tafsirId;
              return (
                <Pressable
                  key={ed.id}
                  style={[styles.pickRow, i < tafsirs.length - 1 && styles.rowDivider]}
                  onPress={() => setTafsirId(ed.id)}
                >
                  <View style={[styles.radio, on && styles.radioOn]}>
                    {on && <View style={styles.radioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickText, on && styles.pickTextOn]}>{ed.name}</Text>
                    <Text style={styles.pickSub}>{ed.author}</Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        <View style={[styles.card, styles.section]}>
          {header("download", "set.data", "set.note.data")}
          <View style={[styles.row, styles.rowLast]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{t("set.cached")}</Text>
              <Text style={styles.pickSub}>{t("set.cachedNote")}</Text>
            </View>
            <Text style={styles.value}>
              {cacheStats === null
                ? "…"
                : cacheStats.entryCount === 0
                  ? t("set.cacheEmpty")
                  : `${formatBytes(cacheStats.sizeBytes, num)} · ${num(cacheStats.entryCount)}`}
            </Text>
          </View>
          <Pressable
            style={[
              styles.clearBtn,
              (!cacheStats || cacheStats.entryCount === 0) && styles.disabled,
            ]}
            disabled={!cacheStats || cacheStats.entryCount === 0}
            onPress={confirmClearCache}
          >
            <Text style={styles.clearBtnText}>{t("set.clearCache")}</Text>
          </Pressable>
        </View>

        <Text style={styles.dataDesc}>{t("set.dataDesc")}</Text>
        <View style={styles.card}>
          <View style={styles.btnRow}>
            <Pressable
              style={[styles.primaryBtn, busy && styles.disabled]}
              disabled={busy}
              onPress={onExport}
            >
              <Text style={styles.primaryBtnText}>{t("set.export")}</Text>
            </Pressable>
            <Pressable
              style={[styles.secondaryBtn, busy && styles.disabled]}
              disabled={busy}
              onPress={onImport}
            >
              <Text style={styles.secondaryBtnText}>{t("set.import")}</Text>
            </Pressable>
            {busy && <ActivityIndicator color={colors.accent} />}
          </View>

          <Text style={styles.onImportLabel}>{t("set.onImport")}</Text>
          <View style={styles.pillRow}>
            {(
              [
                { v: "replace", l: t("set.replace") },
                { v: "keep-mine", l: t("set.keepMine") },
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
            {strategy === "replace" ? t("set.replaceHint") : t("set.keepMineHint")}
          </Text>

          {status && (
            <Text style={[styles.status, status.ok ? styles.statusOk : styles.statusErr]}>
              {status.message}
            </Text>
          )}

          <View style={styles.dataFoot}>
            <Text style={styles.countText}>
              {count === null
                ? tf("set.itemsOther", { n: "—" })
                : tf(count === 1 ? "set.itemsOne" : "set.itemsOther", { n: count })}
            </Text>
            <Pressable onPress={onErase} hitSlop={8}>
              <Text style={styles.eraseText}>{t("set.eraseAll")}</Text>
            </Pressable>
          </View>
        </View>

        <SyncSection />

        <View style={styles.section}>{header("heart", "set.about")}</View>
        <Text style={styles.muted}>{tf("set.aboutText", { reciter: RECITER.name })}</Text>
        <Text style={styles.version}>Ummah Library · v{Constants.expoConfig?.version ?? "—"}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 18, paddingBottom: 32 },
    firstSection: { marginTop: 4 },
    section: { marginTop: 20 },
    sectionHead: { marginBottom: 14 },
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
    disabled: { opacity: 0.4 },
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

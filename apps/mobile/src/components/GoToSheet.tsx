import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "../Type";
import {
  AYAH_COUNTS,
  HIZB_STARTS,
  JUZ_STARTS,
  PAGE_STARTS,
  matchSurahNames,
  parseGoTo,
  type GoToSurahName,
  type GoToTarget,
} from "@ummahlibrary/core";
import { Icon } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useSettings } from "../state/SettingsContext";
import { targetSize } from "../comfort";
import { useIntl } from "../i18n/I18nProvider";

type Tab = "surah" | "juz" | "hizb" | "page";

// Labels are built at render time so they follow the interface language.
interface Cell {
  key: string;
  n: number;
  sura: number;
  aya: number;
  target: GoToTarget;
}

const JUZ_CELLS: Cell[] = JUZ_STARTS.map((v, i) => ({
  key: `j${i}`,
  n: i + 1,
  sura: v.sura,
  aya: v.aya,
  target: { kind: "juz", sura: v.sura, aya: v.aya, n: i + 1 },
}));
const HIZB_CELLS: Cell[] = HIZB_STARTS.map((v, i) => ({
  key: `h${i}`,
  n: i + 1,
  sura: v.sura,
  aya: v.aya,
  target: { kind: "hizb", sura: v.sura, aya: v.aya, n: i + 1 },
}));
const PAGE_CELLS: Cell[] = PAGE_STARTS.map((v, i) => ({
  key: `p${i}`,
  n: i + 1,
  sura: v.sura,
  aya: v.aya,
  target: { kind: "page", sura: v.sura, aya: v.aya, n: i + 1 },
}));

/**
 * "Go to" (ADR 0041) — one box that understands `2:255`, a bare āyah number in
 * the open surah, `baqarah 255`, Arabic names and digits, `juz 15` / `para 15`,
 * `page 300`, `hizb 30` (parser in core), with Surah / Juz / Hizb / Page
 * pickers underneath for people who'd rather tap than type.
 */
export function GoToSheet({
  visible,
  onClose,
  names,
  currentSurah,
  onGo,
}: {
  visible: boolean;
  onClose: () => void;
  names: readonly GoToSurahName[];
  currentSurah?: number;
  onGo: (target: GoToTarget) => void;
}) {
  const { colors } = useTheme();
  const { comfort } = useSettings();
  const { t, tf, num, dir } = useIntl();
  const min = targetSize(comfort);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("surah");
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setQuery("");
    setTried(false);
  }, [visible]);

  const target = useMemo(
    () => parseGoTo(query, names, { currentSurah }),
    [query, names, currentSurah],
  );
  const surahList = useMemo(() => {
    const q = query.replace(/[\d٠-٩۰-۹:.\s]+$/, "").trim();
    return q ? matchSurahNames(q, names) : [...names];
  }, [query, names]);

  const go = (dest: GoToTarget) => {
    onGo(dest);
    onClose();
  };
  const submit = () => {
    setTried(true);
    if (target) go(target);
  };

  const cells = tab === "juz" ? JUZ_CELLS : tab === "hizb" ? HIZB_CELLS : PAGE_CELLS;

  return (
    <Modal
      visible={visible}
      transparent
      animationType={comfort.reduceMotion ? "none" : "slide"}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable
          style={styles.scrim}
          onPress={onClose}
          accessibilityLabel={t("rd.goto.closeA11y")}
        />
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.head}>
            <Text style={styles.title} accessibilityRole="header">
              {t("rd.goto.title")}
            </Text>
            <Pressable
              style={[styles.close, { minHeight: min }]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t("rd.close")}
            >
              <Icon name="close" size={18} color={colors.fg} />
              <Text style={styles.closeText}>{t("rd.close")}</Text>
            </Pressable>
          </View>

          <View style={styles.form}>
            <TextInput
              style={[styles.input, { minHeight: min }]}
              value={query}
              onChangeText={(v) => {
                setQuery(v);
                setTried(false);
              }}
              onSubmitEditing={submit}
              placeholder={
                currentSurah
                  ? tf("rd.goto.phInSurah", { examples: "2:255, kahf, juz 15" })
                  : "2:255, kahf, juz 15, page 300…"
              }
              placeholderTextColor={colors.muted}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="go"
              accessibilityLabel={t("rd.goto.inputA11y")}
            />
            <Pressable
              style={[styles.goBtn, { minHeight: min, minWidth: min }, !target && styles.disabled]}
              disabled={!target}
              onPress={submit}
              accessibilityRole="button"
              accessibilityLabel={t("rd.goto.go")}
            >
              <Text style={styles.goText}>{t("rd.goto.go")}</Text>
            </Pressable>
          </View>

          <View accessibilityLiveRegion="polite" style={styles.preview}>
            {target ? (
              <Pressable
                style={[styles.match, { minHeight: min }]}
                onPress={() => go(target)}
                accessibilityRole="button"
              >
                <Icon name={dir === "rtl" ? "arrowL" : "arrowR"} size={16} color={colors.accent} />
                <Text style={styles.matchText}>{describeTarget(tf, target, names)}</Text>
              </Pressable>
            ) : tried && query ? (
              <Text style={styles.hintText}>
                {tf("rd.goto.notFound", { examples: "“2:255”, “kahf 10”, “juz 15”, “page 300”" })}
              </Text>
            ) : (
              <Text style={styles.hintText}>
                {t("rd.goto.also")} baqarah 255 · ٢:٢٥٥ · para 15 · page 300 · hizb 30
              </Text>
            )}
          </View>

          <View style={styles.tabs} accessibilityRole="tablist">
            {(
              [
                ["surah", "rd.surah"],
                ["juz", "rd.juz"],
                ["hizb", "rd.hizb"],
                ["page", "rd.page"],
              ] as const
            ).map(([k, label]) => (
              <Pressable
                key={k}
                style={[styles.tab, { minHeight: min }, tab === k && styles.tabOn]}
                onPress={() => setTab(k)}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === k }}
              >
                <Text style={[styles.tabText, tab === k && styles.tabTextOn]}>{t(label)}</Text>
              </Pressable>
            ))}
          </View>

          {tab === "surah" ? (
            <FlatList
              key="surah"
              style={styles.list}
              data={surahList}
              keyExtractor={(s) => String(s.number)}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={14}
              renderItem={({ item: s }) => (
                <Pressable
                  style={[
                    styles.row,
                    { minHeight: Math.max(56, min) },
                    s.number === currentSurah && styles.rowCurrent,
                  ]}
                  onPress={() => go({ kind: "surah", sura: s.number, aya: 1 })}
                  accessibilityRole="button"
                  accessibilityLabel={`${num(s.number)}, ${s.transliteration}, ${s.englishName}`}
                >
                  <Text style={styles.num}>{num(s.number)}</Text>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {s.transliteration}
                    </Text>
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {s.englishName} · {tf("rd.ayahCount", { n: AYAH_COUNTS[s.number - 1] ?? 0 })}
                    </Text>
                  </View>
                  <Text style={styles.rowAr}>{s.name}</Text>
                </Pressable>
              )}
            />
          ) : (
            <FlatList
              key={tab}
              style={styles.list}
              data={cells}
              numColumns={tab === "page" ? 4 : 3}
              keyExtractor={(c) => c.key}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={30}
              columnWrapperStyle={styles.gridRow}
              renderItem={({ item: c }) => {
                const label =
                  tab === "juz"
                    ? tf("rd.juzN", { n: c.n })
                    : tab === "hizb"
                      ? tf("rd.hizbN", { n: c.n })
                      : num(c.n);
                const sub = `${num(c.sura)}:${num(c.aya)}`;
                return (
                  <Pressable
                    style={[styles.cell, { minHeight: Math.max(56, min) }]}
                    onPress={() => go(c.target)}
                    accessibilityRole="button"
                    accessibilityLabel={tf("rd.goto.cellA11y", {
                      label: tab === "page" ? tf("rd.pageN", { n: c.n }) : label,
                      ref: sub,
                    })}
                  >
                    <Text style={styles.cellLabel}>{label}</Text>
                    <Text style={styles.cellSub}>{sub}</Text>
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, justifyContent: "flex-end" },
    scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
    sheet: {
      height: "86%",
      backgroundColor: c.bgElev,
      borderTopStartRadius: 20,
      borderTopEndRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 8,
      gap: 10,
    },
    head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    title: { color: c.fg, fontSize: 20, fontFamily: FONT.extrabold },
    close: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    closeText: { color: c.fg, fontSize: 14, fontFamily: FONT.semibold },
    form: { flexDirection: "row", gap: 8 },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      color: c.fg,
      backgroundColor: c.bg,
      fontSize: 17,
    },
    goBtn: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
      borderRadius: 12,
      backgroundColor: c.accent,
    },
    goText: { color: c.ink, fontSize: 19, fontFamily: FONT.bold },
    disabled: { opacity: 0.45 },
    preview: { minHeight: 24 },
    match: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.accent,
      backgroundColor: c.accentSoft,
    },
    matchText: { color: c.fg, fontSize: 15, fontFamily: FONT.semibold, flexShrink: 1 },
    hintText: { color: c.muted, fontSize: 13.5, lineHeight: 20 },
    tabs: { flexDirection: "row", gap: 6 },
    tab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bg,
    },
    tabOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    tabText: { color: c.muted, fontSize: 14.5, fontFamily: FONT.semibold },
    tabTextOn: { color: c.fg, fontFamily: FONT.bold },
    list: { flex: 1 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 6,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSoft,
    },
    rowCurrent: { backgroundColor: c.accentSoft },
    num: { color: c.muted, fontSize: 14, fontFamily: FONT.bold, width: 30, textAlign: "center" },
    rowTitle: { color: c.fg, fontSize: 16, fontFamily: FONT.bold },
    rowSub: { color: c.muted, fontSize: 13 },
    // Surah name (not Quranic verse text): the Arabic UI face, explicit line height.
    rowAr: {
      color: c.fg,
      fontSize: 20,
      lineHeight: 38,
      writingDirection: "rtl",
      fontFamily: FONT.ar,
    },
    gridRow: { gap: 8, marginBottom: 8 },
    cell: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bg,
      paddingVertical: 6,
    },
    cellLabel: { color: c.fg, fontSize: 15, fontFamily: FONT.bold },
    cellSub: { color: c.muted, fontSize: 13 },
  });
}

/** The Go-to preview in the interface language (core's describeGoTo is English). */
function describeTarget(
  tf: (
    key: "rd.goto.ayah" | "rd.goto.juz" | "rd.goto.hizb" | "rd.goto.page",
    vars: Record<string, string | number>,
  ) => string,
  t: GoToTarget,
  names: readonly GoToSurahName[],
): string {
  const surah = names.find((s) => s.number === t.sura)?.transliteration ?? String(t.sura);
  const key = `${t.sura}:${t.aya}`;
  switch (t.kind) {
    case "surah":
      return surah;
    case "ayah":
      return tf("rd.goto.ayah", { surah, aya: t.aya });
    case "juz":
      return tf("rd.goto.juz", { n: t.n ?? 0, surah, key });
    case "hizb":
      return tf("rd.goto.hizb", { n: t.n ?? 0, surah, key });
    case "page":
      return tf("rd.goto.page", { n: t.n ?? 0, surah, key });
  }
}

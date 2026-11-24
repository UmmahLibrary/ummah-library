import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import Svg, { Circle } from "react-native-svg";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  TOTAL_PAGES_MADANI,
  type KhatmaPlan,
  addDays,
  computeStreak,
  daysThisWeek,
  daysBetween,
  goalMet,
  khatmaDailyTarget,
  progressFraction,
} from "@ummahlibrary/core";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useSettings } from "../state/SettingsContext";
import {
  clearKhatma,
  readReadingState,
  todayStr,
  writeGoal,
  writeKhatma,
  type ReadingState,
} from "../reading-goals";
import type { ReadStackParamList } from "../navigation/types";
import { useIntl } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/messages";

type Props = NativeStackScreenProps<ReadStackParamList, "ReadingGoals">;

const DAY_LABELS: MessageKey[] = [
  "mem.goals.dow0",
  "mem.goals.dow1",
  "mem.goals.dow2",
  "mem.goals.dow3",
  "mem.goals.dow4",
  "mem.goals.dow5",
  "mem.goals.dow6",
];
const GOAL_OPTIONS = [2, 4, 8, 16, 20];

function lastSevenDays(log: Record<string, number>) {
  const out: { label: MessageKey; date: Date; pages: number; isToday: boolean }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    out.push({
      label: DAY_LABELS[d.getDay()]!,
      date: d,
      pages: log[todayStr(d)] ?? 0,
      isToday: i === 0,
    });
  }
  return out;
}

export function ReadingGoalsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [state, setState] = useState<ReadingState | null>(null);
  const { comfort } = useSettings();
  const { t, tf, num, locale } = useIntl();

  const refresh = useCallback(() => {
    void readReadingState().then(setState);
  }, []);
  useFocusEffect(refresh);

  if (!state) return <View style={styles.screen} />;

  const { goal, log, active, khatma, pagesToday } = state;
  const today = todayStr();
  const streak = computeStreak(active, today);
  const pct = Math.min(1, goal > 0 ? pagesToday / goal : 0);
  const done = goalMet(pagesToday, goal);
  const remaining = Math.max(0, goal - pagesToday);
  const week = lastSevenDays(log);
  const maxWeek = Math.max(1, ...week.map((d) => d.pages));
  const khatmaPct = khatma
    ? Math.round(progressFraction(khatma.currentPage, khatma.totalPages) * 100)
    : 0;
  const resumePage = khatma ? Math.min(khatma.totalPages, khatma.currentPage + 1) : 1;

  const openMushafPage = (page: number) =>
    navigation.getParent()?.navigate("Read", { screen: "MushafPage", params: { page } } as never);

  const R = 78;
  const C = 2 * Math.PI * R;

  const changeGoal = (next: number) => void writeGoal(next).then(refresh);
  const startKhatma = (days: number) => {
    setState((prev) => {
      if (!prev) return prev;
      const plan: KhatmaPlan = {
        totalPages: TOTAL_PAGES_MADANI,
        currentPage: prev.khatma?.currentPage ?? 0,
        targetDate: addDays(today, days),
      };
      void writeKhatma(plan);
      return { ...prev, khatma: plan };
    });
  };
  // Updates via the functional setState form (and persists as a side effect,
  // rather than reading the prior page from the closure and re-fetching
  // after the write) so rapid +1/-1 taps each apply on top of the latest
  // page instead of racing on a stale `khatma` snapshot — see the identical
  // Qada-tracker fix (55adba5) this mirrors.
  const adjustKhatma = (delta: number) => {
    setState((prev) => {
      if (!prev?.khatma) return prev;
      const currentPage = Math.min(
        prev.khatma.totalPages,
        Math.max(0, prev.khatma.currentPage + delta),
      );
      const plan: KhatmaPlan = { ...prev.khatma, currentPage };
      void writeKhatma(plan);
      return { ...prev, khatma: plan };
    });
  };
  const clearKhatmaAndRefresh = () => {
    setState((prev) => (prev ? { ...prev, khatma: null } : prev));
    void clearKhatma();
  };

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.h1}>{t("mem.goals.title")}</Text>
      <Text style={styles.subtitle}>{t("mem.goals.subtitle")}</Text>

      <View style={styles.ringCard}>
        <View style={styles.ringWrap}>
          <Svg width={180} height={180}>
            <Circle cx={90} cy={90} r={R} stroke={colors.border} strokeWidth={14} fill="none" />
            <Circle
              cx={90}
              cy={90}
              r={R}
              stroke={colors.accent}
              strokeWidth={14}
              fill="none"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct)}
              strokeLinecap="round"
              transform="rotate(-90 90 90)"
            />
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={styles.ringNum}>{num(pagesToday)}</Text>
            <Text style={styles.ringLabel}>{tf("mem.goals.ofPages", { n: goal })}</Text>
          </View>
        </View>
        <Text style={styles.ringStatus}>
          {done
            ? t("mem.goals.met")
            : tf(remaining === 1 ? "mem.goals.remainingOne" : "mem.goals.remainingOther", {
                n: remaining,
              })}
        </Text>
      </View>

      <View style={styles.row2}>
        <View style={styles.statCard}>
          {/* Gentle consistency (ADR 0041): days this week by default; a
              "days in a row" count only if the reader opted in. */}
          <Text style={styles.statValue}>
            {comfort.trackingPaused
              ? t("mem.goals.paused")
              : comfort.showStreaks
                ? streak > 0
                  ? num(streak)
                  : "—"
                : tf("mem.hifz.weekValue", { n: daysThisWeek(active, today) })}
          </Text>
          <Text style={styles.statLabel}>
            {comfort.trackingPaused
              ? t("mem.goals.kept")
              : comfort.showStreaks
                ? t("mem.hifz.statStreak")
                : t("mem.hifz.statWeek")}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{khatma ? `${num(khatmaPct)}%` : "—"}</Text>
          <Text style={styles.statLabel}>
            {khatma ? t("mem.goals.toKhatm") : t("mem.goals.noKhatma")}
          </Text>
        </View>
      </View>

      <View style={styles.weekCard}>
        <Text style={styles.sectionLabel}>{t("mem.goals.thisWeek")}</Text>
        <View style={styles.weekRow}>
          {week.map((d, i) => (
            <View
              key={i}
              style={styles.weekCol}
              // The day initials repeat (T, S) and the bar height isn't read
              // aloud — name each column with its date and page count.
              accessible
              accessibilityLabel={`${d.date.toLocaleDateString(locale, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}: ${tf("mem.goals.pages", { n: num(d.pages) })}`}
            >
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(4, (d.pages / maxWeek) * 70),
                    backgroundColor: d.isToday ? colors.accent : colors.border,
                  },
                ]}
              />
              <Text style={[styles.weekLabel, d.isToday && { color: colors.accent }]}>
                {t(d.label)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.sectionLabel}>{t("mem.goals.daily")}</Text>
      <View style={styles.pills}>
        {GOAL_OPTIONS.map((g) => (
          <Pressable
            key={g}
            style={[styles.pill, g === goal && styles.pillOn]}
            onPress={() => changeGoal(g)}
          >
            <Text style={[styles.pillText, g === goal && styles.pillTextOn]}>
              {tf("mem.goals.pages", { n: g })}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>{t("mem.goals.khatma")}</Text>
      {!khatma ? (
        <View style={styles.pills}>
          {[30, 60, 90].map((dys) => (
            <Pressable key={dys} style={styles.pill} onPress={() => startKhatma(dys)}>
              <Text style={styles.pillText}>{tf("mem.goals.days", { n: dys })}</Text>
            </Pressable>
          ))}
        </View>
      ) : khatma.currentPage >= khatma.totalPages ? (
        <View style={styles.khatmaBox}>
          <Text style={styles.khatmaComplete}>{t("mem.goals.complete")}</Text>
          <View style={styles.pills}>
            <Pressable
              style={styles.pill}
              accessibilityLabel={t("mem.goals.minusA11y")}
              onPress={() => adjustKhatma(-1)}
            >
              <Text style={styles.pillText}>−{num(1)}</Text>
            </Pressable>
            <Pressable style={styles.pill} onPress={clearKhatmaAndRefresh}>
              <Text style={styles.pillText}>{t("mem.goals.newKhatm")}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.khatmaBox}>
          <Text style={styles.khatmaInfo}>
            {tf("mem.goals.info", {
              page: khatma.currentPage,
              total: khatma.totalPages,
              left: Math.max(0, daysBetween(today, khatma.targetDate)),
              perDay: khatmaDailyTarget(khatma, today),
            })}
          </Text>
          <View style={styles.pills}>
            <Pressable
              style={[styles.pill, styles.pillOn]}
              onPress={() => openMushafPage(resumePage)}
            >
              <Text style={styles.pillTextOn}>{tf("mem.goals.resume", { n: resumePage })}</Text>
            </Pressable>
            <Pressable
              style={styles.pill}
              accessibilityLabel={t("mem.goals.plusA11y")}
              onPress={() => adjustKhatma(1)}
            >
              <Text style={styles.pillText}>+{num(1)}</Text>
            </Pressable>
            <Pressable
              style={styles.pill}
              accessibilityLabel={t("mem.goals.minusA11y")}
              onPress={() => adjustKhatma(-1)}
            >
              <Text style={styles.pillText}>−{num(1)}</Text>
            </Pressable>
            <Pressable style={styles.pill} onPress={clearKhatmaAndRefresh}>
              <Text style={styles.pillText}>{t("mem.goals.clear")}</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Pressable style={styles.openBtn} onPress={() => openMushafPage(resumePage)}>
        <Text style={styles.openBtnText}>{t("mem.goals.open")}</Text>
      </Pressable>
      <Text style={styles.foot}>{t("mem.goals.foot")}</Text>
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { padding: 18, backgroundColor: c.bg, gap: 12, flexGrow: 1 },
    h1: { color: c.fg, fontSize: 26, fontFamily: FONT.extrabold, letterSpacing: -0.5 },
    subtitle: { color: c.muted, fontSize: 14, marginTop: -6, marginBottom: 2 },
    ringCard: {
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 22,
      alignItems: "center",
      gap: 14,
    },
    ringWrap: { width: 180, height: 180, alignItems: "center", justifyContent: "center" },
    ringCenter: { position: "absolute", alignItems: "center" },
    ringNum: { color: c.accent, fontSize: 40, fontFamily: FONT.extrabold, letterSpacing: -1.5 },
    ringLabel: { color: c.faint, fontSize: 13 },
    ringStatus: { color: c.muted, fontSize: 14, textAlign: "center" },
    row2: { flexDirection: "row", gap: 12 },
    statCard: {
      flex: 1,
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 16,
    },
    statValue: { color: c.accent, fontSize: 24, fontFamily: FONT.extrabold },
    statLabel: { color: c.faint, fontSize: 12.5, marginTop: 3 },
    weekCard: {
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 18,
    },
    weekRow: { flexDirection: "row", alignItems: "flex-end", gap: 10, height: 92, marginTop: 12 },
    weekCol: { flex: 1, alignItems: "center", gap: 8, justifyContent: "flex-end" },
    bar: { width: "70%", borderRadius: 5 },
    weekLabel: { color: c.faint, fontSize: 11.5 },
    sectionLabel: {
      color: c.faint,
      fontSize: 12,
      letterSpacing: 1,
      textTransform: "uppercase",
      fontFamily: FONT.bold,
      marginTop: 8,
    },
    pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    pill: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    pillOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    pillText: { color: c.muted, fontSize: 13, fontFamily: FONT.semibold },
    pillTextOn: { color: c.accent, fontSize: 13, fontFamily: FONT.bold },
    khatmaBox: { gap: 10 },
    khatmaInfo: { color: c.muted, fontSize: 13, lineHeight: 19 },
    khatmaComplete: { color: c.accent, fontSize: 13, fontWeight: "700" },
    openBtn: {
      marginTop: 8,
      backgroundColor: c.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
    },
    openBtnText: { color: c.ink, fontSize: 15, fontFamily: FONT.extrabold },
    foot: { color: c.faint, fontSize: 12.5, lineHeight: 18, marginTop: 4 },
  });
}

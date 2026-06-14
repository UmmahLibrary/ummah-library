import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import Svg, { Circle } from "react-native-svg";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Icon, Khatam } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import {
  PLANS,
  type DayTarget,
  type PlanProgress,
  type ReadingPlan,
  clearPlan,
  currentDay,
  planById,
  planPercent,
  readPlanProgress,
  startPlan,
  toggleDay,
} from "../plans";
import type { ReadStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<ReadStackParamList, "Plans">;
type Nav = Props["navigation"];

function openTarget(navigation: Nav, target: DayTarget) {
  if (target.kind === "juz") navigation.navigate("JuzReader", { juz: target.juz });
  else navigation.navigate("SurahReader", { surah: target.surah });
}

/** A window of up to seven plan days centred on today, for the strip. */
function weekWindow(plan: ReadingPlan, day: number) {
  const len = plan.days.length;
  const size = Math.min(7, len);
  let start = day - 3;
  if (start < 1) start = 1;
  if (start + size - 1 > len) start = len - size + 1;
  return Array.from({ length: size }, (_, i) => start + i); // 1-based day numbers
}

export function PlansScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [progress, setProgress] = useState<PlanProgress | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    void readPlanProgress().then((p) => {
      setProgress(p);
      setReady(true);
    });
  }, []);
  useFocusEffect(refresh);

  const active = progress ? planById(progress.planId) : undefined;
  const day = active && progress ? currentDay(active, progress) : 0;
  const todayDay = active ? active.days[day - 1] : undefined;
  const pct = active && progress ? planPercent(active, progress) : 0;

  const R = 33;
  const C = 2 * Math.PI * R;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.h1}>Reading plans</Text>
      <Text style={styles.subtitle}>Structured journeys through the Book</Text>

      {ready && active && progress && todayDay ? (
        <>
          <View style={styles.activeCard}>
            <View style={styles.watermark} pointerEvents="none">
              <Khatam size={150} color={colors.accent} sw={1.1} opacity={0.07} />
            </View>
            <View style={styles.activeTop}>
              <View style={styles.ringWrap}>
                <Svg width={78} height={78}>
                  <Circle cx={39} cy={39} r={R} stroke={colors.border} strokeWidth={7} fill="none" />
                  <Circle
                    cx={39}
                    cy={39}
                    r={R}
                    stroke={colors.accent}
                    strokeWidth={7}
                    fill="none"
                    strokeDasharray={C}
                    strokeDashoffset={C * (1 - pct / 100)}
                    strokeLinecap="round"
                    transform="rotate(-90 39 39)"
                  />
                </Svg>
                <Text style={styles.ringPct}>{pct}%</Text>
              </View>
              <View style={styles.activeMeta}>
                <Text style={styles.activeKicker}>
                  Active · Day {day} of {active.days.length}
                </Text>
                <Text style={styles.activeName}>{active.name}</Text>
                <Text style={styles.activeToday}>
                  Today: <Text style={styles.activeTodayStrong}>{todayDay.label}</Text> · {todayDay.est}
                </Text>
              </View>
            </View>
            <Pressable style={styles.readBtn} onPress={() => openTarget(navigation, todayDay.target)}>
              <Icon name="book" size={15} color={colors.ink} sw={1.8} />
              <Text style={styles.readBtnText}>Read today</Text>
            </Pressable>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={[styles.pill, progress.completed.includes(day - 1) && styles.pillOn]}
              onPress={() => void toggleDay(day - 1).then(refresh)}
            >
              <Text style={[styles.pillText, progress.completed.includes(day - 1) && styles.pillTextOn]}>
                {progress.completed.includes(day - 1) ? "✓ Day done" : `Mark Day ${day} done`}
              </Text>
            </Pressable>
            <Pressable style={styles.pill} onPress={() => void clearPlan().then(refresh)}>
              <Text style={styles.pillText}>Leave plan</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Your days</Text>
          <View style={styles.week}>
            {weekWindow(active, day).map((n) => {
              const done = progress.completed.includes(n - 1);
              const isToday = n === day;
              return (
                <View
                  key={n}
                  style={[styles.dayCell, isToday && styles.dayCellToday]}
                >
                  <Text style={[styles.dayCellLabel, isToday && styles.dayCellLabelToday]}>D{n}</Text>
                  <View style={[styles.dayDot, done && styles.dayDotDone]}>
                    {done ? (
                      <Icon name="check" size={12} color={colors.ink} sw={2} />
                    ) : (
                      <Text style={styles.dayDotNum}>{n}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </>
      ) : ready ? (
        <View style={styles.empty}>
          <Khatam size={56} color={colors.accent} sw={1.1} opacity={0.5} />
          <Text style={styles.emptyText}>No active plan yet. Choose one below to begin a journey.</Text>
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>Browse plans</Text>
      <View style={styles.library}>
        {PLANS.map((pl) => {
          const isActive = active?.id === pl.id;
          const plPct = isActive ? pct : 0;
          return (
            <Pressable
              key={pl.id}
              style={styles.libCard}
              onPress={() => {
                if (isActive && todayDay) openTarget(navigation, todayDay.target);
                else void startPlan(pl.id).then(refresh);
              }}
            >
              <View style={styles.libHead}>
                <Text style={styles.tag}>{pl.tag}</Text>
                <Text style={styles.len}>{pl.len}</Text>
              </View>
              <Text style={styles.libName}>{pl.name}</Text>
              <Text style={styles.libDesc}>{pl.desc}</Text>
              {isActive ? (
                <View style={styles.progressWrap}>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${plPct}%` }]} />
                  </View>
                  <View style={styles.progressMeta}>
                    <Text style={styles.inProgress}>In progress</Text>
                    <Text style={styles.continue}>Continue →</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.startRow}>
                  <Icon name="plus" size={15} color={colors.accent} sw={2} />
                  <Text style={styles.startText}>Start plan</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { padding: 18, backgroundColor: c.bg, paddingBottom: 36, gap: 4 },
    h1: { color: c.fg, fontSize: 26, fontFamily: FONT.extrabold, letterSpacing: -0.5 },
    subtitle: { color: c.muted, fontSize: 14, marginTop: -4, marginBottom: 10 },

    activeCard: {
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 20,
      overflow: "hidden",
    },
    watermark: { position: "absolute", right: -36, top: -42 },
    activeTop: { flexDirection: "row", alignItems: "center", gap: 16 },
    ringWrap: { width: 78, height: 78, alignItems: "center", justifyContent: "center" },
    ringPct: { position: "absolute", color: c.accent, fontSize: 16, fontFamily: FONT.extrabold },
    activeMeta: { flex: 1, minWidth: 0 },
    activeKicker: {
      color: c.faint,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      fontFamily: FONT.bold,
    },
    activeName: { color: c.fg, fontSize: 19, fontFamily: FONT.extrabold, letterSpacing: -0.4, marginVertical: 3 },
    activeToday: { color: c.muted, fontSize: 13 },
    activeTodayStrong: { color: c.fg, fontFamily: FONT.semibold },
    readBtn: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 8,
      marginTop: 16,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: c.accent,
    },
    readBtnText: { color: c.ink, fontSize: 13.5, fontFamily: FONT.bold },

    actions: { flexDirection: "row", gap: 8, marginTop: 12 },
    pill: {
      paddingVertical: 9,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    pillOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    pillText: { color: c.muted, fontSize: 13, fontFamily: FONT.semibold },
    pillTextOn: { color: c.accent, fontFamily: FONT.bold },

    sectionLabel: {
      color: c.faint,
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      fontFamily: FONT.bold,
      marginTop: 22,
      marginBottom: 11,
    },
    week: { flexDirection: "row", gap: 7 },
    dayCell: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 11,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
      gap: 7,
    },
    dayCellToday: { borderColor: c.accent, backgroundColor: c.accentSoft },
    dayCellLabel: { color: c.faint, fontSize: 11, fontFamily: FONT.bold },
    dayCellLabelToday: { color: c.accent },
    dayDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: c.border,
    },
    dayDotDone: { backgroundColor: c.accent, borderColor: c.accent },
    dayDotNum: { color: c.faint, fontSize: 11 },

    empty: {
      alignItems: "center",
      gap: 12,
      paddingVertical: 28,
      paddingHorizontal: 16,
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
    },
    emptyText: { color: c.muted, fontSize: 14, textAlign: "center", lineHeight: 21 },

    library: { gap: 12 },
    libCard: {
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 18,
    },
    libHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
    tag: {
      color: c.accent,
      fontSize: 11,
      fontFamily: FONT.bold,
      backgroundColor: c.accentSoft,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 999,
      paddingVertical: 3,
      paddingHorizontal: 10,
      overflow: "hidden",
    },
    len: { color: c.faint, fontSize: 12 },
    libName: { color: c.fg, fontSize: 16, fontFamily: FONT.bold },
    libDesc: { color: c.muted, fontSize: 13, lineHeight: 20, marginTop: 5 },
    progressWrap: { marginTop: 14 },
    track: { height: 5, borderRadius: 3, backgroundColor: c.border, overflow: "hidden" },
    fill: { height: "100%", backgroundColor: c.accent },
    progressMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: 7 },
    inProgress: { color: c.faint, fontSize: 12 },
    continue: { color: c.accent, fontSize: 12, fontFamily: FONT.semibold },
    startRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 },
    startText: { color: c.accent, fontSize: 13, fontFamily: FONT.semibold },
  });
}

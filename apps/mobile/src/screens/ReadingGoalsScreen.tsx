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
  daysBetween,
  goalMet,
  khatmaDailyTarget,
  progressFraction,
} from "@ummahlibrary/core";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import {
  clearKhatma,
  readReadingState,
  todayStr,
  writeGoal,
  writeKhatma,
  type ReadingState,
} from "../reading-goals";
import type { ReadStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<ReadStackParamList, "ReadingGoals">;

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const GOAL_OPTIONS = [2, 4, 8, 16, 20];

function lastSevenDays(log: Record<string, number>) {
  const out: { label: string; pages: number; isToday: boolean }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    out.push({ label: DAY_LABELS[d.getDay()]!, pages: log[todayStr(d)] ?? 0, isToday: i === 0 });
  }
  return out;
}

export function ReadingGoalsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [state, setState] = useState<ReadingState | null>(null);

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
  const khatmaPct = khatma ? Math.round(progressFraction(khatma.currentPage, khatma.totalPages) * 100) : 0;
  const resumePage = khatma ? Math.min(khatma.totalPages, khatma.currentPage + 1) : 1;

  const R = 78;
  const C = 2 * Math.PI * R;

  const changeGoal = (next: number) => void writeGoal(next).then(refresh);
  const startKhatma = (days: number) => {
    const plan: KhatmaPlan = {
      totalPages: TOTAL_PAGES_MADANI,
      currentPage: khatma?.currentPage ?? 0,
      targetDate: addDays(today, days),
    };
    void writeKhatma(plan).then(refresh);
  };
  const adjustKhatma = (delta: number) => {
    if (!khatma) return;
    const currentPage = Math.min(khatma.totalPages, Math.max(0, khatma.currentPage + delta));
    void writeKhatma({ ...khatma, currentPage }).then(refresh);
  };

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.h1}>Reading goals</Text>
      <Text style={styles.subtitle}>Build a daily Quran habit</Text>

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
            <Text style={styles.ringNum}>{pagesToday}</Text>
            <Text style={styles.ringLabel}>of {goal} pages today</Text>
          </View>
        </View>
        <Text style={styles.ringStatus}>
          {done
            ? "Today’s goal met — māshāʾAllāh ✓"
            : `${remaining} page${remaining === 1 ? "" : "s"} to reach today’s goal`}
        </Text>
      </View>

      <View style={styles.row2}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{streak > 0 ? `${streak} 🔥` : "—"}</Text>
          <Text style={styles.statLabel}>Day streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{khatma ? `${khatmaPct}%` : "—"}</Text>
          <Text style={styles.statLabel}>{khatma ? "to khatm" : "no khatma"}</Text>
        </View>
      </View>

      <View style={styles.weekCard}>
        <Text style={styles.sectionLabel}>This week</Text>
        <View style={styles.weekRow}>
          {week.map((d, i) => (
            <View key={i} style={styles.weekCol}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(4, (d.pages / maxWeek) * 70),
                    backgroundColor: d.isToday ? colors.accent : colors.border,
                  },
                ]}
              />
              <Text style={[styles.weekLabel, d.isToday && { color: colors.accent }]}>{d.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.sectionLabel}>Daily goal</Text>
      <View style={styles.pills}>
        {GOAL_OPTIONS.map((g) => (
          <Pressable key={g} style={[styles.pill, g === goal && styles.pillOn]} onPress={() => changeGoal(g)}>
            <Text style={[styles.pillText, g === goal && styles.pillTextOn]}>{g} pages</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Khatma</Text>
      {!khatma ? (
        <View style={styles.pills}>
          {[30, 60, 90].map((dys) => (
            <Pressable key={dys} style={styles.pill} onPress={() => startKhatma(dys)}>
              <Text style={styles.pillText}>{dys} days</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.khatmaBox}>
          <Text style={styles.khatmaInfo}>
            Page {khatma.currentPage}/{khatma.totalPages} ·{" "}
            {Math.max(0, daysBetween(today, khatma.targetDate))}d left ·{" "}
            {khatmaDailyTarget(khatma, today)}/day
          </Text>
          <View style={styles.pills}>
            <Pressable
              style={[styles.pill, styles.pillOn]}
              onPress={() => navigation.navigate("MushafPage", { page: resumePage })}
            >
              <Text style={styles.pillTextOn}>Resume p{resumePage}</Text>
            </Pressable>
            <Pressable style={styles.pill} onPress={() => adjustKhatma(1)}>
              <Text style={styles.pillText}>+1</Text>
            </Pressable>
            <Pressable style={styles.pill} onPress={() => adjustKhatma(-1)}>
              <Text style={styles.pillText}>−1</Text>
            </Pressable>
            <Pressable style={styles.pill} onPress={() => void clearKhatma().then(refresh)}>
              <Text style={styles.pillText}>Clear</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Pressable style={styles.openBtn} onPress={() => navigation.navigate("MushafPage", { page: resumePage })}>
        <Text style={styles.openBtnText}>▶ Open the Mushaf</Text>
      </Pressable>
      <Text style={styles.foot}>Pages you read in the Mushaf view count towards your goal automatically.</Text>
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

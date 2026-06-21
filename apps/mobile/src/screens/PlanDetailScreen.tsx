import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import Svg, { Circle } from "react-native-svg";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Icon, Khatam } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import {
  type ActivePlan,
  type DayPortion,
  clearPlan,
  computeTodayPortion,
  currentDay,
  daysAheadBehind,
  effectiveToday,
  extendPlanBy,
  isDayComplete,
  isPaused,
  isPlanComplete,
  pausePlan,
  percentComplete,
  planDuration,
  planEndDate,
  readActivePlan,
  rebalancePlan,
  resumePlan,
  startPlan,
  todayStr,
} from "../plans";
import { PlanCompletionCard } from "../components/PlanCompletionCard";
import { PlanReminderToggle } from "../components/PlanReminderToggle";
import type { ReadStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<ReadStackParamList, "PlanDetail">;
type Nav = Props["navigation"];

function openTarget(navigation: Nav, portion: DayPortion) {
  const t = portion.target;
  if (t.kind === "juz") navigation.navigate("JuzReader", { juz: t.juz });
  else if (t.kind === "surah") navigation.navigate("SurahReader", { surah: t.surah });
  else navigation.navigate("SurahReader", { surah: portion.startRef.sura });
}

export function PlanDetailScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [plan, setPlan] = useState<ActivePlan | null>(null);
  const [ready, setReady] = useState(false);
  const [confirmAbandon, setConfirmAbandon] = useState(false);

  const refresh = useCallback(() => {
    void readActivePlan().then((p) => {
      setPlan(p);
      setReady(true);
    });
  }, []);
  useFocusEffect(refresh);

  const R = 46;
  const C = 2 * Math.PI * R;

  if (!ready) return <View style={styles.screen} />;
  if (!plan) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.muted}>No active plan.</Text>
      </View>
    );
  }

  const paused = isPaused(plan);
  const complete = isPlanComplete(plan);
  const today = effectiveToday(plan, todayStr());
  const total = planDuration(plan);
  const day = currentDay(plan, today);
  const pct = percentComplete(plan);
  const behind = daysAheadBehind(plan, today);
  const portion = computeTodayPortion(plan, today);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {complete && (
        <View style={{ marginBottom: 18 }}>
          <PlanCompletionCard plan={plan} onStart={(id) => void startPlan(id).then(refresh)} />
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.ringWrap}>
          <Svg width={104} height={104}>
            <Circle cx={52} cy={52} r={R} stroke={colors.border} strokeWidth={9} fill="none" />
            <Circle
              cx={52}
              cy={52}
              r={R}
              stroke={colors.accent}
              strokeWidth={9}
              fill="none"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct / 100)}
              strokeLinecap="round"
              transform="rotate(-90 52 52)"
            />
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={styles.ringPct}>{pct}%</Text>
            <Text style={styles.ringDay}>
              Day {day}/{total}
            </Text>
          </View>
        </View>
        <View style={styles.headMeta}>
          <View style={styles.nameRow}>
            <Khatam size={22} color={colors.accent} sw={1} opacity={0.7} />
            <Text style={styles.name}>{plan.template.name}</Text>
          </View>
          <Text style={styles.endText}>
            {plan.template.tag} · ends {planEndDate(plan)}
          </Text>
          {paused && (
            <View style={styles.pausedPill}>
              <Text style={styles.pausedPillText}>⏸ Paused</Text>
            </View>
          )}
        </View>
      </View>

      {paused ? (
        <View style={styles.pausedCard}>
          <Text style={styles.pausedNote}>Paused on {plan.pausedOn}. Your place is held — resume any time.</Text>
          <Pressable style={styles.resumeBtn} onPress={() => void resumePlan().then(refresh)}>
            <Icon name="play" size={14} color={colors.ink} />
            <Text style={styles.resumeText}>Resume</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.todayCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.todayKicker}>Today</Text>
            <Text style={styles.todayLabel}>{portion.label}</Text>
          </View>
          <Pressable style={styles.readBtn} onPress={() => openTarget(navigation, portion)}>
            <Icon name="book" size={14} color={colors.ink} sw={1.8} />
            <Text style={styles.readText}>Read now</Text>
          </Pressable>
        </View>
      )}

      {!complete && <PlanReminderToggle />}

      {!paused && behind < 0 && (
        <Text style={styles.behindNote}>
          You’re {Math.abs(behind)} {Math.abs(behind) === 1 ? "day" : "days"} behind — re-pace below to catch up
          gently.
        </Text>
      )}

      <Text style={styles.sectionLabel}>Your days</Text>
      <View style={styles.heat}>
        {Array.from({ length: total }, (_, i) => i + 1).map((d) => {
          const done = isDayComplete(plan, d);
          const isToday = d === day;
          const missed = d < day && !done;
          return (
            <View
              key={d}
              style={[
                styles.heatCell,
                done && styles.heatDone,
                missed && styles.heatMissed,
                isToday && styles.heatToday,
              ]}
            />
          );
        })}
      </View>
      <View style={styles.legend}>
        <Legend styles={styles} colors={colors} kind="done" label="Done" />
        <Legend styles={styles} colors={colors} kind="missed" label="Missed" />
        <Legend styles={styles} colors={colors} kind="upcoming" label="Upcoming" />
      </View>

      <Text style={styles.sectionLabel}>Manage</Text>
      <View style={styles.manage}>
        <Pressable style={styles.pill} onPress={() => void rebalancePlan().then(refresh)}>
          <Icon name="repeat" size={13} color={colors.fg} sw={1.8} />
          <Text style={styles.pillText}>Re-pace</Text>
        </Pressable>
        <Pressable style={styles.pill} onPress={() => void extendPlanBy(7).then(refresh)}>
          <Icon name="plus" size={13} color={colors.fg} sw={2} />
          <Text style={styles.pillText}>Extend +1wk</Text>
        </Pressable>
        {paused ? (
          <Pressable style={styles.pill} onPress={() => void resumePlan().then(refresh)}>
            <Icon name="play" size={13} color={colors.fg} />
            <Text style={styles.pillText}>Resume</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.pill} onPress={() => void pausePlan().then(refresh)}>
            <Icon name="pause" size={13} color={colors.fg} />
            <Text style={styles.pillText}>Pause</Text>
          </Pressable>
        )}
        {confirmAbandon ? (
          <>
            <Pressable
              style={[styles.pill, styles.pillDanger]}
              onPress={() => void clearPlan().then(() => navigation.goBack())}
            >
              <Text style={styles.pillText}>Yes, abandon</Text>
            </Pressable>
            <Pressable style={styles.pill} onPress={() => setConfirmAbandon(false)}>
              <Text style={styles.pillText}>Keep</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.pill} onPress={() => setConfirmAbandon(true)}>
            <Icon name="close" size={13} color={colors.muted} sw={1.8} />
            <Text style={styles.pillTextMuted}>Abandon</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

function Legend({
  styles,
  colors,
  kind,
  label,
}: {
  styles: ReturnType<typeof makeStyles>;
  colors: Palette;
  kind: "done" | "missed" | "upcoming";
  label: string;
}) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendSwatch,
          kind === "done" && { backgroundColor: colors.accent, borderColor: colors.accent },
          kind === "missed" && { backgroundColor: colors.bgElev },
        ]}
      />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { padding: 18, paddingBottom: 40, backgroundColor: c.bg },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    muted: { color: c.muted, fontSize: 14 },

    header: { flexDirection: "row", alignItems: "center", gap: 16 },
    ringWrap: { width: 104, height: 104, alignItems: "center", justifyContent: "center" },
    ringCenter: { position: "absolute", alignItems: "center" },
    ringPct: { color: c.fg, fontSize: 22, fontFamily: FONT.extrabold },
    ringDay: { color: c.faint, fontSize: 11, marginTop: 1 },
    headMeta: { flex: 1, minWidth: 0 },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    name: { color: c.fg, fontSize: 20, fontFamily: FONT.extrabold, letterSpacing: -0.4, flexShrink: 1 },
    endText: { color: c.muted, fontSize: 13, marginTop: 5 },
    pausedPill: {
      alignSelf: "flex-start",
      marginTop: 10,
      paddingVertical: 3,
      paddingHorizontal: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    pausedPillText: { color: c.muted, fontSize: 12, fontFamily: FONT.bold },

    pausedCard: {
      marginTop: 18,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    pausedNote: { color: c.muted, fontSize: 13, flex: 1, lineHeight: 19 },
    resumeBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 9,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: c.accent,
    },
    resumeText: { color: c.ink, fontSize: 13, fontFamily: FONT.bold },

    todayCard: {
      marginTop: 18,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.accent,
      backgroundColor: c.accentSoft,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    todayKicker: {
      color: c.accent,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: "uppercase",
      fontFamily: FONT.bold,
    },
    todayLabel: { color: c.fg, fontSize: 15, fontFamily: FONT.semibold, marginTop: 3 },
    readBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 10,
      backgroundColor: c.accent,
    },
    readText: { color: c.ink, fontSize: 13, fontFamily: FONT.bold },

    behindNote: { color: c.muted, fontSize: 13, marginTop: 12, lineHeight: 19 },

    sectionLabel: {
      color: c.faint,
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      fontFamily: FONT.bold,
      marginTop: 26,
      marginBottom: 11,
    },
    heat: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    heatCell: {
      width: 24,
      height: 24,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: "transparent",
    },
    heatDone: { backgroundColor: c.accent, borderColor: c.accent },
    heatMissed: { backgroundColor: c.bgElev },
    heatToday: { borderColor: c.accent, borderWidth: 2 },
    legend: { flexDirection: "row", gap: 16, marginTop: 12 },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    legendSwatch: { width: 11, height: 11, borderRadius: 3, borderWidth: 1, borderColor: c.border },
    legendLabel: { color: c.faint, fontSize: 11.5 },

    manage: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingVertical: 9,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    pillDanger: { backgroundColor: c.bg },
    pillText: { color: c.fg, fontSize: 13, fontFamily: FONT.semibold },
    pillTextMuted: { color: c.muted, fontSize: 13, fontFamily: FONT.semibold },
  });
}

import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "../Type";
import Svg, { Circle } from "react-native-svg";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Icon, Khatam } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import {
  type ActivePlan,
  type DayPortion,
  type PlanTemplate,
  type ScheduleStrategy,
  PLAN_TEMPLATES,
  activatePlan,
  addDays,
  catchUpPortion,
  clearPlan,
  computeTodayPortion,
  currentDay,
  daysAheadBehind,
  extendPlanBy,
  isDayComplete,
  isPlanComplete,
  percentComplete,
  planDuration,
  planEndDate,
  planWeekWindow,
  rangeOfPages,
  readActivePlan,
  rebalancePlan,
  resumePlan,
  startCustomPlan,
  startPlan,
  todayStr,
  toggleDay,
  validatePlanDraft,
} from "../plans";
import { PlanCompletionCard } from "../components/PlanCompletionCard";
import type { ReadStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<ReadStackParamList, "Plans">;
type Nav = Props["navigation"];

function openTarget(navigation: Nav, portion: DayPortion) {
  const t = portion.target;
  if (t.kind === "juz") navigation.navigate("JuzReader", { juz: t.juz });
  else if (t.kind === "surah") navigation.navigate("SurahReader", { surah: t.surah });
  else navigation.navigate("SurahReader", { surah: portion.startRef.sura });
}

export function PlansScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [plan, setPlan] = useState<ActivePlan | null>(null);
  const [ready, setReady] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [mode, setMode] = useState<"pace" | "duration">("pace");
  const [perDay, setPerDay] = useState("2");
  const [days, setDays] = useState("90");

  const refresh = useCallback(() => {
    void readActivePlan().then((p) => {
      setPlan(p);
      setReady(true);
    });
  }, []);
  useFocusEffect(refresh);

  const today = todayStr();
  // Frozen at the pause day while paused (#68), so a break never reads as behind.
  const viewToday = plan?.pausedOn ?? today;
  const paused = !!plan?.pausedOn;
  const complete = plan ? isPlanComplete(plan) : false;
  const totalDays = plan ? planDuration(plan) : 0;
  const day = plan ? currentDay(plan, viewToday) : 0;
  const portion = plan ? computeTodayPortion(plan, viewToday) : undefined;
  const pct = plan ? percentComplete(plan) : 0;
  const behind = plan ? daysAheadBehind(plan, viewToday) : 0;
  const catchUp = plan ? catchUpPortion(plan, viewToday) : undefined;

  // Custom plan draft — whole Quran by pages, by pace or by days-to-finish.
  const customRange = rangeOfPages(1, 604);
  const customSchedule: ScheduleStrategy =
    mode === "pace"
      ? { kind: "fixed", unitsPerDay: Number(perDay) || 0 }
      : { kind: "targetDate", endDate: addDays(today, Math.max(0, Math.floor(Number(days) || 0))) };
  const customErrors = validatePlanDraft({ range: customRange, schedule: customSchedule, startDate: today });
  const customDraft =
    customErrors.length === 0
      ? activatePlan({ id: "custom", name: "", tag: "", len: "", desc: "", range: customRange, schedule: customSchedule }, today)
      : null;
  const customDays = customDraft ? planDuration(customDraft) : 0;
  const customEnd = customDraft ? planEndDate(customDraft) : "";
  const customPerDay = customDays ? Math.ceil(customRange.units.length / customDays) : 0;

  function createCustom() {
    if (!customDraft) return;
    const template: PlanTemplate = {
      id: "custom",
      name: "Your plan",
      tag: `${customDays} days`,
      len: mode === "pace" ? `${perDay} pages a day` : `≈ ${customPerDay} pages a day`,
      desc:
        mode === "pace"
          ? `${perDay} pages a day through the whole Quran.`
          : `Finish the Quran by ${customEnd}.`,
      range: customRange,
      schedule: customSchedule,
    };
    void startCustomPlan(template).then(() => {
      setCustomOpen(false);
      refresh();
    });
  }

  const R = 33;
  const C = 2 * Math.PI * R;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.h1}>Reading plans</Text>
      <Text style={styles.subtitle}>Structured journeys through the Book</Text>

      {ready && plan && complete ? (
        <PlanCompletionCard plan={plan} onStart={(id) => void startPlan(id).then(refresh)} />
      ) : ready && plan && portion ? (
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
                  {paused ? "⏸ Paused" : "Active"} · Day {day} of {totalDays}
                </Text>
                <Text style={styles.activeName}>{plan.template.name}</Text>
                <Text style={styles.activeToday}>
                  Today: <Text style={styles.activeTodayStrong}>{portion.label}</Text> · {portion.est}
                </Text>
              </View>
            </View>
            <Pressable style={styles.readBtn} onPress={() => openTarget(navigation, portion)}>
              <Icon name="book" size={15} color={colors.ink} sw={1.8} />
              <Text style={styles.readBtnText}>Read today</Text>
            </Pressable>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={[styles.pill, isDayComplete(plan, day) && styles.pillOn]}
              onPress={() => void toggleDay(day).then(refresh)}
            >
              <Text style={[styles.pillText, isDayComplete(plan, day) && styles.pillTextOn]}>
                {isDayComplete(plan, day) ? "✓ Day done" : `Mark Day ${day} done`}
              </Text>
            </Pressable>
            <Pressable style={styles.pill} onPress={() => void clearPlan().then(refresh)}>
              <Text style={styles.pillText}>Leave plan</Text>
            </Pressable>
            {paused && (
              <Pressable style={[styles.pill, styles.pillOn]} onPress={() => void resumePlan().then(refresh)}>
                <Text style={styles.pillTextOn}>▶ Resume</Text>
              </Pressable>
            )}
            <Pressable
              style={styles.pill}
              onPress={() => navigation.navigate("PlanDetail", { id: plan.template.id })}
            >
              <Text style={styles.pillText}>Details</Text>
            </Pressable>
          </View>

          {behind < 0 && catchUp ? (
            <View style={styles.behindCard}>
              <Text style={styles.behindTitle}>
                You’re {Math.abs(behind)} {Math.abs(behind) === 1 ? "day" : "days"} behind
              </Text>
              <Text style={styles.behindSub}>Catch up, re-pace to keep your finish date, or take more time.</Text>
              <View style={styles.behindActions}>
                <Pressable style={styles.behindPrimary} onPress={() => openTarget(navigation, catchUp)}>
                  <Icon name="book" size={14} color={colors.ink} sw={1.8} />
                  <Text style={styles.behindPrimaryText}>Catch up</Text>
                </Pressable>
                <Pressable style={styles.pill} onPress={() => void rebalancePlan().then(refresh)}>
                  <Text style={styles.pillText}>Rebalance</Text>
                </Pressable>
                <Pressable style={styles.pill} onPress={() => void extendPlanBy(7).then(refresh)}>
                  <Text style={styles.pillText}>Extend +1wk</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>Your days</Text>
          <View style={styles.week}>
            {planWeekWindow(plan, day).map((n) => {
              const done = isDayComplete(plan, n);
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
        {PLAN_TEMPLATES.map((pl) => {
          const isActive = plan?.template.id === pl.id;
          const plPct = isActive ? pct : 0;
          return (
            <Pressable
              key={pl.id}
              style={styles.libCard}
              onPress={() => {
                if (isActive && portion) openTarget(navigation, portion);
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

      <Text style={styles.sectionLabel}>Create your own</Text>
      {!customOpen ? (
        <Pressable style={styles.createBtn} onPress={() => setCustomOpen(true)}>
          <Icon name="plus" size={16} color={colors.accent} sw={2} />
          <Text style={styles.createText}>Create a custom plan</Text>
        </Pressable>
      ) : (
        <View style={styles.customCard}>
          <View style={styles.seg}>
            {([
              { v: "pace", l: "Pages a day" },
              { v: "duration", l: "Finish in…" },
            ] as const).map((o) => (
              <Pressable
                key={o.v}
                onPress={() => setMode(o.v)}
                style={[styles.segItem, mode === o.v && styles.segItemOn]}
              >
                <Text style={[styles.segText, mode === o.v && styles.segTextOn]}>{o.l}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.customLabel}>{mode === "pace" ? "Pages a day" : "Days to finish"}</Text>
          <TextInput
            value={mode === "pace" ? perDay : days}
            onChangeText={mode === "pace" ? setPerDay : setDays}
            keyboardType="number-pad"
            style={styles.input}
            placeholderTextColor={colors.faint}
          />
          <Text style={styles.previewText}>
            {customDraft
              ? mode === "pace"
                ? `≈ ${customDays} days · finishes ${customEnd}`
                : `≈ ${customPerDay} pages a day · ${customDays} days`
              : customErrors[0]}
          </Text>
          <View style={styles.customActions}>
            <Pressable
              style={[styles.startCustomBtn, !customDraft && styles.startCustomBtnOff]}
              disabled={!customDraft}
              onPress={createCustom}
            >
              <Text style={[styles.startCustomText, !customDraft && styles.startCustomTextOff]}>Start plan</Text>
            </Pressable>
            <Pressable style={styles.pill} onPress={() => setCustomOpen(false)}>
              <Text style={styles.pillText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}
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

    behindCard: {
      marginTop: 12,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.accent,
      backgroundColor: c.accentSoft,
    },
    behindTitle: { color: c.fg, fontSize: 14, fontFamily: FONT.bold },
    behindSub: { color: c.muted, fontSize: 13, marginTop: 4, marginBottom: 12, lineHeight: 19 },
    behindActions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    behindPrimary: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 9,
      paddingHorizontal: 14,
      borderRadius: 999,
      backgroundColor: c.accent,
    },
    behindPrimaryText: { color: c.ink, fontSize: 13, fontFamily: FONT.bold },

    createBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      borderStyle: "dashed",
      backgroundColor: c.bgElev,
    },
    createText: { color: c.accent, fontSize: 14, fontFamily: FONT.semibold },
    customCard: {
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    customLabel: { color: c.muted, fontSize: 13, marginTop: 14 },
    seg: {
      flexDirection: "row",
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      padding: 3,
    },
    segItem: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: "center" },
    segItemOn: { backgroundColor: c.accent },
    segText: { color: c.muted, fontSize: 13, fontFamily: FONT.semibold },
    segTextOn: { color: c.ink, fontFamily: FONT.bold },
    input: {
      marginTop: 6,
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bg,
      color: c.fg,
      fontSize: 16,
      fontFamily: FONT.semibold,
    },
    previewText: { color: c.muted, fontSize: 13, marginTop: 12, minHeight: 18 },
    customActions: { flexDirection: "row", gap: 8, marginTop: 14 },
    startCustomBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 11, backgroundColor: c.accent },
    startCustomBtnOff: { backgroundColor: c.bg, borderWidth: 1, borderColor: c.border },
    startCustomText: { color: c.ink, fontSize: 14, fontFamily: FONT.bold },
    startCustomTextOff: { color: c.faint },
  });
}

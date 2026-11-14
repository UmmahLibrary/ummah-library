import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "../Type";
import {
  computeStreak,
  homeAction,
  juzNumberOf,
  lastSevenDays,
  type Surah,
} from "@ummahlibrary/core";
import { Icon, type IconName } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useSettings } from "../state/SettingsContext";
import { targetSize } from "../comfort";
import { weekdayLabel } from "../goto-nav";

export interface HomeReading {
  pagesToday: number;
  goal: number;
  activeDates: string[];
}

/**
 * The top of Home (ADR 0041): one card that says what to do now — Continue
 * (with "Listen instead"), a welcome back after a gap (never a count of missed
 * days), "Today's portion is done", or a gentle start — then "N of 7 days this
 * week". A "days in a row" count appears only if the reader opts in.
 */
export function HomeToday({
  surahs,
  lastRead,
  lastReadAya,
  reading,
  today,
  onRead,
  onListen,
  onGoals,
}: {
  surahs: readonly Surah[] | null;
  lastRead: number | null;
  lastReadAya: number | null;
  reading: HomeReading;
  today: string;
  onRead: (sura: number, aya?: number) => void;
  onListen: (sura: number, aya?: number) => void;
  onGoals: () => void;
}) {
  const { colors } = useTheme();
  const { comfort } = useSettings();
  const min = targetSize(comfort);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const resumeSurah = lastRead != null ? surahs?.find((s) => s.number === lastRead) : undefined;
  const resume = resumeSurah ? { sura: resumeSurah.number, aya: lastReadAya ?? 1 } : null;
  const portionDone = reading.goal > 0 && reading.pagesToday >= reading.goal;
  const action = homeAction({
    resume,
    activeDates: reading.activeDates,
    today,
    portionDone,
  });
  const week = lastSevenDays(reading.activeDates, today);
  const weekCount = week.filter((d) => d.active).length;
  const paused = comfort.trackingPaused;

  const btn = (icon: IconName | null, label: string, onPress: () => void, primary = false) => (
    <Pressable
      key={label}
      style={({ pressed }) => [
        styles.btn,
        { minHeight: Math.max(52, min) },
        primary && styles.btnPrimary,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
    >
      {icon && <Icon name={icon} size={20} color={primary ? colors.ink : colors.fg} sw={1.8} />}
      <Text style={[styles.btnText, primary && styles.btnTextPrimary]}>{label}</Text>
    </Pressable>
  );

  const heading =
    action.kind === "continue"
      ? action.welcomeBack
        ? "Welcome back"
        : "Continue reading"
      : action.kind === "done"
        ? "Today’s portion is done"
        : "Begin here";

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.heading} accessibilityRole="header">
          {heading}
        </Text>

        {action.kind === "continue" && resumeSurah && (
          <>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{resumeSurah.transliteration}</Text>
              <Text style={styles.nameAr}>{resumeSurah.name}</Text>
            </View>
            <Text style={styles.meta}>
              Āyah {action.at.aya} of {resumeSurah.ayahCount} · Juz{" "}
              {safeJuz(action.at.sura, action.at.aya)} · {resumeSurah.englishName}
            </Text>
            <View
              style={styles.track}
              accessibilityRole="progressbar"
              accessibilityLabel="Progress through the surah"
              accessibilityValue={{
                min: 0,
                max: 100,
                now: Math.round((action.at.aya / resumeSurah.ayahCount) * 100),
              }}
            >
              <View
                style={[
                  styles.fill,
                  { width: `${Math.min(100, (action.at.aya / resumeSurah.ayahCount) * 100)}%` },
                ]}
              />
            </View>
            <View style={styles.btnRow}>
              {btn("book", "Continue", () => onRead(action.at.sura, action.at.aya), true)}
              {btn("headphones", "Listen instead", () => onListen(action.at.sura, action.at.aya))}
            </View>
          </>
        )}

        {action.kind === "done" && (
          <>
            <Text style={styles.body}>
              You read {reading.pagesToday} {reading.pagesToday === 1 ? "page" : "pages"} today. You
              can stop here.
            </Text>
            <View style={styles.btnRow}>
              {action.at &&
                btn(null, "Read a little more", () => onRead(action.at!.sura, action.at!.aya))}
              {btn(null, "Change my daily portion", onGoals)}
            </View>
          </>
        )}

        {action.kind === "start" && (
          <>
            <Text style={styles.body}>Start with the opening surah, or listen to a short one.</Text>
            <View style={styles.btnRow}>
              {btn("book", "Read Al-Fātiḥah", () => onRead(1), true)}
              {btn("headphones", "Listen to Al-Ikhlāṣ", () => onListen(112))}
            </View>
          </>
        )}
      </View>

      <Pressable
        style={({ pressed }) => [styles.weekCard, pressed && styles.pressed]}
        onPress={onGoals}
        accessibilityRole="button"
        accessibilityLabel={
          paused
            ? "Tracking paused. Open reading goals"
            : `Today ${Math.min(reading.pagesToday, reading.goal)} of ${reading.goal} pages. ${weekCount} of 7 days this week. Open reading goals`
        }
      >
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text style={styles.weekTitle}>
            Today: {Math.min(reading.pagesToday, reading.goal)} of {reading.goal}{" "}
            {reading.goal === 1 ? "page" : "pages"}
          </Text>
          <Text style={styles.weekSub}>
            {paused
              ? "Tracking paused — your progress is kept."
              : `${weekCount} of 7 days this week${
                  comfort.showStreaks
                    ? ` · ${computeStreak(reading.activeDates, today)} days in a row`
                    : ""
                }`}
          </Text>
        </View>
        {!paused && (
          <View style={styles.week} importantForAccessibility="no-hide-descendants">
            {week.map((d) => (
              <View key={d.date} style={styles.day}>
                <View
                  style={[styles.dot, d.active && styles.dotOn, d.isToday && styles.dotToday]}
                />
                <Text style={[styles.dayText, d.isToday && styles.dayTextToday]}>
                  {weekdayLabel(d.date).slice(0, 1)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Pressable>
    </View>
  );
}

function safeJuz(sura: number, aya: number): number {
  try {
    return juzNumberOf({ sura, aya });
  } catch {
    return 1;
  }
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    wrap: { gap: 14 },
    card: {
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.accent,
      borderRadius: 18,
      padding: 18,
      gap: 10,
    },
    heading: { color: c.fg, fontSize: 15, fontFamily: FONT.bold },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
    },
    name: { color: c.fg, fontSize: 24, fontFamily: FONT.extrabold, flexShrink: 1 },
    // Surah name (UI Arabic face, not verse text) with an explicit line height.
    nameAr: {
      color: c.accentHi,
      fontSize: 28,
      lineHeight: 52,
      writingDirection: "rtl",
      fontFamily: FONT.ar,
    },
    meta: { color: c.muted, fontSize: 15 },
    body: { color: c.fg, fontSize: 16, lineHeight: 24 },
    track: { height: 8, borderRadius: 8, backgroundColor: c.bg, overflow: "hidden" },
    fill: { height: "100%", backgroundColor: c.accent },
    btnRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 },
    btn: {
      flexGrow: 1,
      flexBasis: 140,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bg,
    },
    btnPrimary: { backgroundColor: c.accent, borderColor: c.accent },
    pressed: { opacity: 0.8 },
    btnText: { color: c.fg, fontSize: 16, fontFamily: FONT.bold },
    // ≥ 18.66px bold is large text: ink on gold clears 3:1 on every theme.
    btnTextPrimary: { color: c.ink, fontSize: 19 },
    weekCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 16,
      minHeight: 48,
    },
    weekTitle: { color: c.fg, fontSize: 15.5, fontFamily: FONT.bold },
    weekSub: { color: c.muted, fontSize: 14 },
    week: { flexDirection: "row", gap: 6 },
    day: { alignItems: "center", gap: 3 },
    dot: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.bg,
    },
    dotOn: { backgroundColor: c.accent, borderColor: c.accent },
    dotToday: { borderColor: c.fg, borderWidth: 2 },
    dayText: { color: c.muted, fontSize: 13 },
    dayTextToday: { color: c.fg, fontFamily: FONT.bold },
  });
}

import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "../Type";
import {
  computeStreak,
  homeAction,
  juzNumberOf,
  lastSevenDays,
  type Surah,
} from "@ummahlibrary/core";
import { Icon, nativeText, radius, space, type IconName } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useSettings } from "../state/SettingsContext";
import { targetSize } from "../comfort";
import { useIntl } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/messages";

/** One-letter weekday initials, Sunday first (UTC weekday of a civil date). */
const WEEKDAY_KEYS: readonly MessageKey[] = [
  "home.wd.0",
  "home.wd.1",
  "home.wd.2",
  "home.wd.3",
  "home.wd.4",
  "home.wd.5",
  "home.wd.6",
];

function weekdayKey(date: string): MessageKey {
  return WEEKDAY_KEYS[new Date(`${date}T00:00:00Z`).getUTCDay()] ?? "home.wd.0";
}

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
  const { t, tf, locale } = useIntl();
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
        ? t("home.welcomeBack")
        : t("home.continueReading")
      : action.kind === "done"
        ? t("home.portionDone")
        : t("home.beginHere");
  const shownToday = Math.min(reading.pagesToday, reading.goal);
  const pageVars = { done: shownToday, goal: reading.goal };

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
              {tf("home.meta", {
                aya: action.at.aya,
                count: resumeSurah.ayahCount,
                juz: safeJuz(action.at.sura, action.at.aya),
              })}
              {/* The English surah meaning is English-only data; shown in English. */}
              {locale === "en" ? ` · ${resumeSurah.englishName}` : ""}
            </Text>
            <View
              style={styles.track}
              accessibilityRole="progressbar"
              accessibilityLabel={t("home.progressA11y")}
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
              {btn("book", t("home.continue"), () => onRead(action.at.sura, action.at.aya), true)}
              {btn("headphones", t("home.listenInstead"), () =>
                onListen(action.at.sura, action.at.aya),
              )}
            </View>
          </>
        )}

        {action.kind === "done" && (
          <>
            <Text style={styles.body}>
              {tf(reading.pagesToday === 1 ? "home.readPagesOne" : "home.readPagesOther", {
                n: reading.pagesToday,
              })}
            </Text>
            <View style={styles.btnRow}>
              {action.at &&
                btn(null, t("home.readMore"), () => onRead(action.at!.sura, action.at!.aya))}
              {btn(null, t("home.changePortion"), onGoals)}
            </View>
          </>
        )}

        {action.kind === "start" && (
          <>
            <Text style={styles.body}>{t("home.startBody")}</Text>
            <View style={styles.btnRow}>
              {btn("book", t("home.readFatiha"), () => onRead(1), true)}
              {btn("headphones", t("home.listenIkhlas"), () => onListen(112))}
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
            ? t("home.pausedA11y")
            : tf(reading.goal === 1 ? "home.weekA11yOne" : "home.weekA11yOther", {
                ...pageVars,
                days: weekCount,
                total: 7,
              })
        }
      >
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text style={styles.weekTitle}>
            {tf(reading.goal === 1 ? "home.todayPagesOne" : "home.todayPagesOther", pageVars)}
          </Text>
          <Text style={styles.weekSub}>
            {paused
              ? t("home.paused")
              : `${tf("home.weekDays", { days: weekCount, total: 7 })}${
                  comfort.showStreaks
                    ? ` · ${tf("home.streak", { n: computeStreak(reading.activeDates, today) })}`
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
                  {t(weekdayKey(d.date))}
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
      // Shared card surface (ADR 0042), as web's .nf-card.
      borderRadius: radius.lg,
      padding: space[4],
      gap: space[2.5],
    },
    heading: { color: c.accent, fontSize: 15, fontFamily: FONT.bold },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
    },
    name: { color: c.fg, ...nativeText("title"), fontFamily: FONT.extrabold, flexShrink: 1 },
    // Surah name (UI Arabic face, not verse text) with an explicit line height.
    nameAr: {
      color: c.accentHi,
      fontSize: 32,
      lineHeight: 56,
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
      borderRadius: radius.lg,
      paddingVertical: space[3.5],
      paddingHorizontal: space[4],
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

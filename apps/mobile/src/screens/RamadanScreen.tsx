import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  DEFAULT_CALCULATION_METHOD,
  type Coordinates,
  type Madhab,
  type PrayerTimings,
  gregorianToHijri,
  keptFastDays,
  migrateRamadanFasts,
  pagesReadBetween,
  ramadanDateRange,
  ramadanYearFor,
  toggleRamadanFast,
} from "@ummahlibrary/core";
import { Khatam, Icon, type IconName } from "@ummahlibrary/ui";
import { api } from "../api";
import { KEYS, getJSON, getString, isObjectRecord, setJSON, setString } from "../storage";
import { FONT } from "../fonts";
import { useTheme, type Palette } from "../theme";
import { ignoreStale, localISODate } from "../utils";
import { useIntl } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/messages";
import { HIJRI_MONTH_KEY, fmtCountdownIn, fmtPrayerTimeIn, uiDigits } from "../prayer-intl";
import type { PrayerStackParamList } from "../navigation/types";
import { onSyncApplied } from "../lib/sync/sync-events";

type Props = NativeStackScreenProps<PrayerStackParamList, "Ramadan">;

const WORSHIP: { key: string; label: MessageKey; icon: IconName }[] = [
  { key: "suhur", label: "pr.w.suhur", icon: "sun" },
  { key: "fajr", label: "pr.w.fajr", icon: "moon" },
  { key: "quran", label: "pr.w.quran", icon: "book" },
  { key: "tarawih", label: "pr.w.tarawih", icon: "moon" },
];

function todayGreg() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

export function RamadanScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, tf, num, locale } = useIntl();
  const today = localISODate(new Date());

  const [now, setNow] = useState(() => new Date());
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [hasCoords, setHasCoords] = useState(false);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [fasts, setFasts] = useState<Record<string, true>>({});
  const [worship, setWorship] = useState<Record<string, true>>({});
  const [readingLog, setReadingLog] = useState<Record<string, number>>({});
  const [hijriAdjust, setHijriAdjust] = useState(0);

  // Guards the same sync-reload-vs-local-write race this loop already fixed
  // in PrayerTrackerScreen/LibraryContext/SettingsContext/theme.tsx/
  // HijriCalendarScreen: ul.ramadanFasts and ul.ramadanWorship are both
  // synced, so a sync round or app-foreground can start loadRamadanData()'s
  // read before a fast/worship toggle lands, then resolve after — silently
  // reverting the tap. toggleFast/toggleWorship bump this on every tap; a
  // reload in flight when that happens discards its own fasts/worship
  // result instead of overwriting the newer local toggle.
  const writeGen = useRef(0);

  const hijri = gregorianToHijri(todayGreg(), hijriAdjust);
  const isRamadan = hijri.month === 9;
  const ramadanDay = isRamadan ? hijri.day : null;
  // The grid is one Ramaḍān's: this year's from Ramaḍān on, else the one just gone
  // (fasts are keyed "<hijriYear>:<day>" so they don't carry into the next year).
  const fastYear = ramadanYearFor(hijri);
  const kept = keptFastDays(migrateRamadanFasts(fasts), fastYear);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const loadAdjust = () =>
      void getString(KEYS.hijriAdjust).then((raw) => {
        const n = Number(raw);
        if (!Number.isFinite(n)) return;
        const a = Math.max(-2, Math.min(2, n));
        setHijriAdjust(a);
        // Same write-back gap iterations 20/60 found in theme.tsx/ZakatScreen,
        // and this cycle's own iteration 99 in HijriCalendarScreen's copy of
        // this exact clamp — persist a corrected out-of-range value once
        // rather than silently re-healing the same raw bad value forever.
        if (raw !== null && raw !== String(a)) void setString(KEYS.hijriAdjust, String(a));
      });
    loadAdjust();
    return onSyncApplied(loadAdjust);
  }, []);

  useEffect(() => {
    function loadRamadanData() {
      const gen = writeGen.current;
      const currentGen = () => writeGen.current;
      void getJSON<Record<string, true>>(KEYS.ramadanFasts, {}, isObjectRecord).then(
        ignoreStale(currentGen, gen, setFasts),
      );
      void getJSON<Record<string, Record<string, true>>>(
        KEYS.ramadanWorship,
        {},
        isObjectRecord,
      ).then((m) => ignoreStale(currentGen, gen, setWorship)(m[today] ?? {}));
      void getJSON<Record<string, number>>(KEYS.readingLog, {}, isObjectRecord).then(setReadingLog);
      void (async () => {
        const c = await getJSON<Coordinates | null>(KEYS.prayerCoords, null);
        if (!c) return;
        setHasCoords(true);
        setCoords(c);
        const method = (await getString(KEYS.prayerMethod)) ?? DEFAULT_CALCULATION_METHOD;
        const madhab = ((await getString(KEYS.prayerMadhab)) as Madhab) || "shafi";
        try {
          const t = await api.getPrayerTimes({
            lat: c.latitude,
            lng: c.longitude,
            date: today,
            method,
            madhab,
          });
          setTimings(t as PrayerTimings);
        } catch {
          /* leave timings null */
        }
      })();
    }
    loadRamadanData();
    return onSyncApplied(loadRamadanData);
  }, []);

  function toggleFast(day: number) {
    writeGen.current++;
    setFasts((prev) => {
      const next = toggleRamadanFast(migrateRamadanFasts(prev), fastYear, day);
      void setJSON(KEYS.ramadanFasts, next);
      return next;
    });
  }

  function toggleWorship(key: string) {
    writeGen.current++;
    setWorship((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      void getJSON<Record<string, Record<string, true>>>(
        KEYS.ramadanWorship,
        {},
        isObjectRecord,
      ).then((m) => setJSON(KEYS.ramadanWorship, { ...m, [today]: next }));
      return next;
    });
  }

  const fastsKept = kept.size;
  const worshipDone = Object.keys(worship).length;
  // Khatm progress is the shown Ramaḍān's reading only (its first to last day),
  // not every page logged since it began.
  const pagesRead = pagesReadBetween(readingLog, ramadanDateRange(fastYear, hijriAdjust));
  const khatmPct = Math.min(100, Math.round((pagesRead / 604) * 100));
  const monthName = t(HIJRI_MONTH_KEY[hijri.month - 1] ?? "lr.hm1");

  const iftar = timings ? new Date(timings.maghrib) : null;
  const suhurEnd = timings ? new Date(timings.fajr) : null;
  const beforeIftar = iftar ? now < iftar : false;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.hijri}>
        {tf("lr.hijriDate", {
          day: hijri.day,
          month: monthName,
          year: uiDigits(hijri.year, locale),
        })}
      </Text>

      {/* Ifṭār countdown */}
      <View style={styles.hero}>
        <View style={styles.heroWatermark} pointerEvents="none">
          <Khatam size={220} color={colors.accent} sw={0.9} opacity={0.06} />
        </View>
        {iftar ? (
          <>
            <Text style={styles.heroLabel}>
              {beforeIftar ? t("pr.iftarUntil") : t("pr.iftarBegun")}
            </Text>
            <Text style={styles.heroCountdown}>
              {beforeIftar ? fmtCountdownIn(iftar, now, tf) : t("pr.iftarMubarak")}
            </Text>
            <View style={styles.heroBarRow}>
              <Text style={styles.heroBarLabel}>
                {tf("pr.suhurAt", {
                  time: suhurEnd ? fmtPrayerTimeIn(timings!.fajr, coords, locale) : "—",
                })}
              </Text>
              <Text style={styles.heroBarLabel}>
                {tf("pr.iftarAt", { time: fmtPrayerTimeIn(timings!.maghrib, coords, locale) })}
              </Text>
            </View>
            <View style={styles.heroTrack}>
              <View
                style={[
                  styles.heroFill,
                  {
                    width: `${
                      suhurEnd && iftar
                        ? Math.max(
                            0,
                            Math.min(
                              100,
                              ((now.getTime() - suhurEnd.getTime()) /
                                (iftar.getTime() - suhurEnd.getTime())) *
                                100,
                            ),
                          )
                        : 0
                    }%`,
                  },
                ]}
              />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.heroLabel}>{t("pr.iftarCountdown")}</Text>
            <Text style={styles.heroMuted}>
              {hasCoords ? t("pr.loadingTimes") : t("pr.setLocationHint")}
            </Text>
            {!hasCoords && (
              <Pressable style={styles.heroBtn} onPress={() => navigation.navigate("PrayerTimes")}>
                <Text style={styles.heroBtnText}>{t("pr.setLocation")}</Text>
              </Pressable>
            )}
          </>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Stat value={`${num(fastsKept)}/${num(30)}`} label={t("pr.fastsKept")} colors={colors} />
        <Stat
          value={isRamadan && ramadanDay !== null ? `${num(ramadanDay)}/${num(30)}` : "—"}
          label={t("pr.dayOfRamadan")}
          colors={colors}
        />
      </View>
      <View style={styles.statsRow}>
        <Stat value={tf("pr.pct", { n: khatmPct })} label={t("pr.khatmProgress")} colors={colors} />
        <Stat
          value={isRamadan ? `${num(worshipDone)}/${num(4)}` : "—"}
          label={t("pr.todaysWorship")}
          colors={colors}
        />
      </View>

      {/* Fasting grid */}
      <Text style={styles.sectionLabel}>
        {t("pr.fastingRamadan")} {uiDigits(fastYear, locale)}
      </Text>
      <View style={styles.fastGrid}>
        {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
          const done = kept.has(d);
          const isToday = ramadanDay === d;
          return (
            <Pressable
              key={d}
              style={[
                styles.fastCell,
                done && styles.fastCellOn,
                isToday && !done && styles.fastCellToday,
              ]}
              onPress={() => toggleFast(d)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done }}
              accessibilityLabel={tf("pr.fastDayA11y", { n: d })}
            >
              <Text
                style={[
                  styles.fastNum,
                  done && styles.fastNumOn,
                  isToday && !done && styles.fastNumToday,
                ]}
              >
                {num(d)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Today's worship — suhūr, tarāwīḥ… only mean something in Ramaḍān. */}
      {isRamadan && (
        <>
          <View style={styles.worshipHead}>
            <Text style={styles.sectionLabel}>{t("pr.todaysWorship")}</Text>
            <Text style={styles.worshipCount}>{`${num(worshipDone)}/${num(4)}`}</Text>
          </View>
          <View style={styles.worshipGrid}>
            {WORSHIP.map((w) => {
              const on = Boolean(worship[w.key]);
              return (
                <Pressable
                  key={w.key}
                  style={[styles.worshipItem, on && styles.worshipItemOn]}
                  onPress={() => toggleWorship(w.key)}
                >
                  <View style={[styles.worshipDot, on && styles.worshipDotOn]}>
                    <Icon
                      name={on ? "check" : w.icon}
                      size={13}
                      color={on ? colors.ink : colors.faint}
                      sw={2}
                    />
                  </View>
                  <Text style={[styles.worshipLabel, on && styles.worshipLabelOn]}>
                    {t(w.label)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function Stat({ value, label, colors }: { value: string; label: string; colors: Palette }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { padding: 18, backgroundColor: c.bg, gap: 12, paddingBottom: 32 },
    hijri: { color: c.muted, fontSize: 13.5, textAlign: "center" },
    hero: {
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      overflow: "hidden",
    },
    heroWatermark: { position: "absolute", top: "50%", marginTop: -110 },
    heroLabel: {
      color: c.accent,
      fontSize: 12,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      fontFamily: FONT.bold,
    },
    heroCountdown: {
      color: c.fg,
      fontSize: 46,
      fontFamily: FONT.extrabold,
      letterSpacing: -1.5,
      marginVertical: 6,
    },
    heroMuted: { color: c.muted, fontSize: 14, textAlign: "center", marginTop: 8 },
    heroBtn: {
      marginTop: 14,
      backgroundColor: c.accent,
      borderRadius: 11,
      paddingVertical: 11,
      paddingHorizontal: 22,
    },
    heroBtnText: { color: c.ink, fontSize: 14.5, fontFamily: FONT.bold },
    heroBarRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      marginTop: 14,
    },
    heroBarLabel: { color: c.muted, fontSize: 12 },
    heroTrack: {
      height: 7,
      borderRadius: 4,
      backgroundColor: c.border,
      overflow: "hidden",
      width: "100%",
      marginTop: 6,
    },
    heroFill: { height: 7, borderRadius: 4, backgroundColor: c.accent },
    statsRow: { flexDirection: "row", gap: 12 },
    stat: {
      flex: 1,
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 15,
    },
    statValue: { color: c.accent, fontSize: 22, fontFamily: FONT.extrabold, letterSpacing: -0.5 },
    statLabel: { color: c.faint, fontSize: 12.5, marginTop: 3 },
    sectionLabel: {
      color: c.faint,
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      fontFamily: FONT.bold,
      marginTop: 8,
    },
    fastGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 12,
    },
    fastCell: {
      width: "8.7%",
      aspectRatio: 1,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.borderSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    fastCellOn: { backgroundColor: c.accent, borderColor: "transparent" },
    fastCellToday: { borderColor: c.accent },
    fastNum: { color: c.faint, fontSize: 11.5, fontFamily: FONT.bold },
    fastNumOn: { color: c.ink },
    fastNumToday: { color: c.accent },
    worshipHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 8,
    },
    worshipCount: { color: c.accent, fontSize: 12.5, fontFamily: FONT.bold },
    worshipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    worshipItem: {
      width: "48%",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    worshipItemOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    worshipDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    worshipDotOn: { backgroundColor: c.accent, borderColor: "transparent" },
    worshipLabel: { color: c.muted, fontSize: 12.5, fontFamily: FONT.semibold, flex: 1 },
    worshipLabelOn: { color: c.fg },
  });
}

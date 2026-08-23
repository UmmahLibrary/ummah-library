import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import * as Location from "expo-location";
import {
  CALCULATION_METHODS,
  type Coordinates,
  DEFAULT_CALCULATION_METHOD,
  DEFAULT_HIGH_LATITUDE_RULE,
  type ExtendedPrayerTimings,
  HIGH_LATITUDE_RULES,
  type HighLatitudeRuleId,
  type Madhab,
  MADHABS,
  OBLIGATORY_PRAYERS,
  PRAYER_LABELS,
  type PrayerName,
  SUPPLEMENTARY_TIMING_LABELS,
  SUPPLEMENTARY_TIMING_NAMES,
  TIMING_NAMES,
  nextPrayer,
} from "@ummahlibrary/core";
import { Khatam, Icon, type IconName } from "@ummahlibrary/ui";
import { api } from "../api";
import { KEYS, getJSON, getString, setJSON, setString } from "../storage";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { fmtCountdown, fmtPrayerTime, localISODate } from "../utils";
import { expoNotifier } from "../notifier";
import { type PrayerReminderPrefs, readPrayerReminderPrefs, setPrayerReminder } from "../prayer-reminders";

type Status = "idle" | "locating" | "loading" | "ready" | "error" | "denied";

const PRAYER_AR: Record<PrayerName, string> = {
  fajr: "الفجر",
  sunrise: "الشروق",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};
const PRAYER_ICON: Record<PrayerName, IconName> = {
  fajr: "moon",
  sunrise: "sun",
  dhuhr: "sun",
  asr: "sun",
  maghrib: "moon",
  isha: "moon",
};

export function PrayerTimesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [method, setMethod] = useState(DEFAULT_CALCULATION_METHOD);
  const [madhab, setMadhab] = useState<Madhab>("shafi");
  const [highLat, setHighLat] = useState<HighLatitudeRuleId>(DEFAULT_HIGH_LATITUDE_RULE);
  const [timings, setTimings] = useState<ExtendedPrayerTimings | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [now, setNow] = useState(() => new Date());
  const [reminders, setReminders] = useState<PrayerReminderPrefs>({});
  const reqId = useRef(0);

  const fetchTimings = useCallback(
    async (c: Coordinates, m: string, mad: Madhab, hlr: HighLatitudeRuleId) => {
      const id = ++reqId.current;
      setStatus("loading");
      try {
        const t = await api.getPrayerTimes({
          lat: c.latitude,
          lng: c.longitude,
          date: localISODate(new Date()),
          method: m,
          madhab: mad,
          hlr,
        });
        if (id !== reqId.current) return;
        setTimings(t as ExtendedPrayerTimings);
        setStatus("ready");
      } catch {
        if (id === reqId.current) setStatus("error");
      }
    },
    [],
  );

  useEffect(() => {
    void Promise.all([
      getString(KEYS.prayerMethod),
      getString(KEYS.prayerMadhab),
      getString(KEYS.prayerHighLat),
      getJSON<Coordinates | null>(KEYS.prayerCoords, null),
    ]).then(([savedMethod, savedMadhab, savedHighLat, savedCoords]) => {
      const m = savedMethod ?? DEFAULT_CALCULATION_METHOD;
      const mad = (savedMadhab as Madhab) || "shafi";
      const hlr =
        savedHighLat && HIGH_LATITUDE_RULES.some((r) => r.id === savedHighLat)
          ? (savedHighLat as HighLatitudeRuleId)
          : DEFAULT_HIGH_LATITUDE_RULE;
      setMethod(m);
      setMadhab(mad);
      setHighLat(hlr);
      if (savedCoords) {
        setCoords(savedCoords);
        void fetchTimings(savedCoords, m, mad, hlr);
      }
    });
    void readPrayerReminderPrefs().then(setReminders);
  }, [fetchTimings]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  async function locate() {
    setStatus("locating");
    const { status: perm } = await Location.requestForegroundPermissionsAsync();
    if (perm !== "granted") { setStatus("denied"); return; }
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const c: Coordinates = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setCoords(c);
      void setJSON(KEYS.prayerCoords, c);
      void fetchTimings(c, method, madhab, highLat);
    } catch {
      setStatus("error");
    }
  }

  function changeMethod(m: string) {
    setMethod(m);
    void setString(KEYS.prayerMethod, m);
    if (coords) void fetchTimings(coords, m, madhab, highLat);
  }

  function changeMadhab(m: Madhab) {
    setMadhab(m);
    void setString(KEYS.prayerMadhab, m);
    if (coords) void fetchTimings(coords, method, m, highLat);
  }

  function changeHighLat(r: HighLatitudeRuleId) {
    setHighLat(r);
    void setString(KEYS.prayerHighLat, r);
    if (coords) void fetchTimings(coords, method, madhab, r);
  }

  async function toggleReminder(name: PrayerName) {
    const turningOn = !reminders[name];
    // Turning on requires the OS permission — if the user denies it, leave the
    // reminder off rather than showing "on" for one that will never fire.
    if (turningOn && expoNotifier.permission() !== "granted") {
      await expoNotifier.requestPermission();
      if (expoNotifier.permission() !== "granted") return;
    }
    setReminders(await setPrayerReminder(name, turningOn));
  }

  const upcoming = timings ? nextPrayer(timings, now) : null;
  const next: { name: PrayerName; at: Date } | null =
    upcoming ?? (timings ? { name: "fajr", at: new Date(new Date(timings.fajr).getTime() + 86400000) } : null);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {!coords && status !== "locating" && (
        <View style={styles.cta}>
          <Text style={styles.ctaText}>
            See accurate prayer times for where you are. Your location stays on this device.
          </Text>
          <Pressable style={styles.ctaBtn} onPress={locate}>
            <Text style={styles.ctaBtnText}>📍 Use my location</Text>
          </Pressable>
        </View>
      )}

      {status === "locating" && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.muted}>Getting your location…</Text>
        </View>
      )}

      {status === "denied" && (
        <View style={styles.cta}>
          <Text style={styles.ctaText}>Location permission was denied. Enable it in Settings.</Text>
          <Pressable style={styles.chip} onPress={locate}>
            <Text style={styles.chipText}>Try again</Text>
          </Pressable>
        </View>
      )}

      {status === "error" && (
        <Text style={styles.muted}>Couldn't load prayer times. Check your connection.</Text>
      )}

      {status === "loading" && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}

      {timings && (
        <>
          {next && (
            <View style={styles.hero}>
              <View style={styles.heroWatermark} pointerEvents="none">
                <Khatam size={220} color={colors.accent} sw={0.9} opacity={0.06} />
              </View>
              <Text style={styles.heroLabel}>Next · {PRAYER_LABELS[next.name]}</Text>
              <Text style={styles.heroCountdown}>{fmtCountdown(next.at, now)}</Text>
              <Text style={styles.heroSub}>
                until {PRAYER_LABELS[next.name]} at {fmtPrayerTime(next.at, coords)}
              </Text>
            </View>
          )}

          <View style={styles.list}>
            {TIMING_NAMES.map((name, i) => {
              const isNext = upcoming?.name === name && OBLIGATORY_PRAYERS.includes(name);
              return (
                <View
                  key={name}
                  style={[
                    styles.row,
                    i < TIMING_NAMES.length - 1 && styles.rowDivider,
                    isNext && styles.rowNext,
                  ]}
                >
                  <Icon
                    name={PRAYER_ICON[name]}
                    size={20}
                    color={isNext ? colors.accent : colors.muted}
                    sw={1.8}
                  />
                  <Text style={[styles.prayerName, isNext && styles.prayerNameNext]}>
                    {PRAYER_LABELS[name]}
                  </Text>
                  <Text style={[styles.prayerAr, isNext && styles.prayerArNext]}>{PRAYER_AR[name]}</Text>
                  <Text style={[styles.prayerTime, isNext && styles.prayerTimeNext]}>
                    {fmtPrayerTime(timings[name], coords)}
                  </Text>
                  {OBLIGATORY_PRAYERS.includes(name) && (
                    <Pressable
                      onPress={() => void toggleReminder(name)}
                      hitSlop={10}
                      accessibilityRole="switch"
                      accessibilityState={{ checked: !!reminders[name] }}
                    >
                      <Icon name="bell" size={17} color={reminders[name] ? colors.accent : colors.faint} sw={1.8} />
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Night</Text>
          <View style={styles.list}>
            {SUPPLEMENTARY_TIMING_NAMES.map((name, i) => (
              <View
                key={name}
                style={[styles.row, i < SUPPLEMENTARY_TIMING_NAMES.length - 1 && styles.rowDivider]}
              >
                <Icon name="moon" size={20} color={colors.muted} sw={1.8} />
                <Text style={styles.prayerName}>{SUPPLEMENTARY_TIMING_LABELS[name]}</Text>
                <Text style={styles.prayerTime}>
                  {timings[name] ? fmtPrayerTime(timings[name], coords) : "—"}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.controls}>
            <View style={styles.pickerRow}>
              <Text style={styles.label}>Method</Text>
              <View style={styles.chips}>
                {CALCULATION_METHODS.map((m) => (
                  <Pressable
                    key={m.id}
                    style={[styles.chip, m.id === method && styles.chipOn]}
                    onPress={() => changeMethod(m.id)}
                  >
                    <Text style={[styles.chipText, m.id === method && styles.chipTextOn]}>
                      {m.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.pickerRow}>
              <Text style={styles.label}>Asr (madhab)</Text>
              <View style={styles.chips}>
                {MADHABS.map((m) => (
                  <Pressable
                    key={m.id}
                    style={[styles.chip, m.id === madhab && styles.chipOn]}
                    onPress={() => changeMadhab(m.id)}
                  >
                    <Text style={[styles.chipText, m.id === madhab && styles.chipTextOn]}>
                      {m.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.pickerRow}>
              <Text style={styles.label}>High-latitude rule</Text>
              <View style={styles.chips}>
                {HIGH_LATITUDE_RULES.map((r) => (
                  <Pressable
                    key={r.id}
                    style={[styles.chip, r.id === highLat && styles.chipOn]}
                    onPress={() => changeHighLat(r.id)}
                  >
                    <Text style={[styles.chipText, r.id === highLat && styles.chipTextOn]}>
                      {r.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable style={styles.chip} onPress={locate}>
              <Text style={styles.chipText}>📍 Update location</Text>
            </Pressable>
          </View>
          <Text style={styles.foot}>Times computed on the server · {localISODate(now)}</Text>
        </>
      )}
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { padding: 16, backgroundColor: c.bg, gap: 16, paddingBottom: 32 },
    center: { alignItems: "center", gap: 10, paddingTop: 40 },
    muted: { color: c.muted, fontSize: 14, textAlign: "center" },
    cta: {
      backgroundColor: c.bgElev,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
      gap: 14,
      alignItems: "center",
    },
    ctaText: { color: c.fg, fontSize: 15, textAlign: "center", lineHeight: 22 },
    ctaBtn: {
      backgroundColor: c.accent,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    ctaBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
    hero: {
      backgroundColor: c.bgElev,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 26,
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
      fontSize: 48,
      fontFamily: FONT.extrabold,
      letterSpacing: -1.5,
      marginVertical: 6,
    },
    heroSub: { color: c.muted, fontSize: 14 },
    sectionLabel: {
      color: c.fg,
      fontSize: 15,
      fontFamily: FONT.bold,
      marginBottom: -6,
    },
    list: {
      backgroundColor: c.bgElev,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    rowDivider: { borderBottomWidth: 1, borderBottomColor: c.borderSoft },
    rowNext: { backgroundColor: c.accentSoft },
    prayerName: { color: c.fg, fontSize: 16, fontFamily: FONT.semibold, flex: 1 },
    prayerNameNext: { color: c.accent, fontFamily: FONT.bold },
    prayerAr: { color: c.faint, fontSize: 17, writingDirection: "rtl", fontFamily: FONT.ar },
    prayerArNext: { color: c.accentHi },
    prayerTime: { color: c.muted, fontSize: 16, fontFamily: FONT.semibold, width: 78, textAlign: "right" },
    prayerTimeNext: { color: c.accent },
    controls: { gap: 16 },
    pickerRow: { gap: 8 },
    label: { color: c.muted, fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: c.border },
    chipOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    chipText: { color: c.muted, fontSize: 13 },
    chipTextOn: { color: c.accent, fontWeight: "600" },
    foot: { color: c.muted, fontSize: 11, textAlign: "center" },
  });
}

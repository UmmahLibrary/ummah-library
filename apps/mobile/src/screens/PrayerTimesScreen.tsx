import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import * as Location from "expo-location";
import {
  CALCULATION_METHODS,
  type Coordinates,
  DEFAULT_CALCULATION_METHOD,
  type Madhab,
  MADHABS,
  OBLIGATORY_PRAYERS,
  PRAYER_LABELS,
  type PrayerName,
  type PrayerTimings,
  TIMING_NAMES,
  nextPrayer,
} from "@ummahlibrary/core";
import { api } from "../api";
import { KEYS, getJSON, getString, setJSON, setString } from "../storage";
import { useTheme, type Palette } from "../theme";
import { fmtCountdown, fmtTime, localISODate } from "../utils";

type Status = "idle" | "locating" | "loading" | "ready" | "error" | "denied";

export function PrayerTimesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [method, setMethod] = useState(DEFAULT_CALCULATION_METHOD);
  const [madhab, setMadhab] = useState<Madhab>("shafi");
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [now, setNow] = useState(() => new Date());
  const reqId = useRef(0);

  const fetchTimings = useCallback(async (c: Coordinates, m: string, mad: Madhab) => {
    const id = ++reqId.current;
    setStatus("loading");
    try {
      const t = await api.getPrayerTimes({
        lat: c.latitude,
        lng: c.longitude,
        date: localISODate(new Date()),
        method: m,
        madhab: mad,
      });
      if (id !== reqId.current) return;
      setTimings(t as PrayerTimings);
      setStatus("ready");
    } catch {
      if (id === reqId.current) setStatus("error");
    }
  }, []);

  useEffect(() => {
    void Promise.all([
      getString(KEYS.prayerMethod),
      getString(KEYS.prayerMadhab),
      getJSON<Coordinates | null>(KEYS.prayerCoords, null),
    ]).then(([savedMethod, savedMadhab, savedCoords]) => {
      const m = savedMethod ?? DEFAULT_CALCULATION_METHOD;
      const mad = (savedMadhab as Madhab) || "shafi";
      setMethod(m);
      setMadhab(mad);
      if (savedCoords) {
        setCoords(savedCoords);
        void fetchTimings(savedCoords, m, mad);
      }
    });
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
      void fetchTimings(c, method, madhab);
    } catch {
      setStatus("error");
    }
  }

  function changeMethod(m: string) {
    setMethod(m);
    void setString(KEYS.prayerMethod, m);
    if (coords) void fetchTimings(coords, m, madhab);
  }

  function changeMadhab(m: Madhab) {
    setMadhab(m);
    void setString(KEYS.prayerMadhab, m);
    if (coords) void fetchTimings(coords, method, m);
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
            <View style={styles.nextBox}>
              <Text style={styles.nextLabel}>Next prayer</Text>
              <Text style={styles.nextName}>{PRAYER_LABELS[next.name]}</Text>
              <Text style={styles.nextIn}>
                {fmtTime(next.at)} · in {fmtCountdown(next.at, now)}
              </Text>
            </View>
          )}

          <View style={styles.list}>
            {TIMING_NAMES.map((name) => {
              const isNext = upcoming?.name === name && OBLIGATORY_PRAYERS.includes(name);
              return (
                <View key={name} style={[styles.row, isNext && styles.rowNext]}>
                  <Text style={[styles.prayerName, isNext && styles.prayerNameNext]}>
                    {PRAYER_LABELS[name]}
                  </Text>
                  <Text style={[styles.prayerTime, isNext && styles.prayerTimeNext]}>
                    {fmtTime(timings[name])}
                  </Text>
                </View>
              );
            })}
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
    nextBox: {
      backgroundColor: c.bgElev,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.accent,
      padding: 16,
      gap: 4,
    },
    nextLabel: { color: c.muted, fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
    nextName: { color: c.accent, fontSize: 24, fontWeight: "700" },
    nextIn: { color: c.muted, fontSize: 14 },
    list: {
      backgroundColor: c.bgElev,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    rowNext: { backgroundColor: c.accentSoft },
    prayerName: { color: c.fg, fontSize: 15 },
    prayerNameNext: { color: c.accent, fontWeight: "600" },
    prayerTime: { color: c.muted, fontSize: 15 },
    prayerTimeNext: { color: c.accent, fontWeight: "600" },
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

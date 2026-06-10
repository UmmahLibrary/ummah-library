import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";
import { type Coordinates, compassPoint, qiblaDirection } from "@ummahlibrary/core";
import { KEYS, getJSON, setJSON } from "../storage";
import { useTheme, type Palette } from "../theme";

type Status = "idle" | "locating" | "ready" | "denied" | "error";

/** Smallest angular gap between two bearings, 0–180°. */
function angularGap(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/** Compass heading from raw magnetometer x/y (device held flat). */
function magnetometerHeading(x: number, y: number): number {
  let h = Math.atan2(-y, x) * (180 / Math.PI);
  if (h < 0) h += 360;
  return h;
}

export function QiblaScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [heading, setHeading] = useState<number | null>(null);

  const dialRotation = useRef(new Animated.Value(0)).current;

  // Restore shared location (same key as prayer times).
  useEffect(() => {
    void getJSON<Coordinates | null>(KEYS.prayerCoords, null).then((saved) => {
      if (saved) { setCoords(saved); setStatus("ready"); }
    });
  }, []);

  // Live magnetometer compass.
  useEffect(() => {
    Magnetometer.setUpdateInterval(100);
    const sub = Magnetometer.addListener(({ x, y }) => {
      const h = magnetometerHeading(x, y);
      setHeading(h);
      Animated.timing(dialRotation, {
        toValue: -h,
        duration: 100,
        useNativeDriver: true,
      }).start();
    });
    return () => sub.remove();
  }, [dialRotation]);

  async function locate() {
    setStatus("locating");
    const { status: perm } = await Location.requestForegroundPermissionsAsync();
    if (perm !== "granted") { setStatus("denied"); return; }
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const c: Coordinates = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setCoords(c);
      void setJSON(KEYS.prayerCoords, c);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  const bearing = coords ? qiblaDirection(coords) : null;
  const aligned = heading !== null && bearing !== null && angularGap(bearing, heading) < 5;
  const dialDeg = dialRotation.interpolate({ inputRange: [-360, 360], outputRange: ["-360deg", "360deg"] });

  return (
    <View style={styles.screen}>
      {!coords && status !== "locating" && (
        <View style={styles.cta}>
          <Text style={styles.ctaText}>
            Find the direction of the Kaaba from where you are. Your location stays on this device.
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
        <Text style={[styles.muted, { padding: 20 }]}>
          Couldn't get your location. Check your settings.
        </Text>
      )}

      {bearing !== null && (
        <View style={styles.compassWrap}>
          <Animated.View
            style={[styles.dial, aligned && styles.dialAligned, { transform: [{ rotate: dialDeg }] }]}
          >
            <Text style={[styles.cardinal, styles.cardinalN]}>N</Text>
            <Text style={[styles.cardinal, styles.cardinalE]}>E</Text>
            <Text style={[styles.cardinal, styles.cardinalS]}>S</Text>
            <Text style={[styles.cardinal, styles.cardinalW]}>W</Text>
            {/* The Kaaba needle is fixed inside the rotating dial so it always points at the bearing */}
            <View style={[styles.needle, { transform: [{ rotate: `${bearing}deg` }] }]}>
              <Text style={styles.kaaba}>🕋</Text>
            </View>
          </Animated.View>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Qibla direction</Text>
            <Text style={styles.infoValue}>
              {Math.round(bearing)}° {compassPoint(bearing)}
            </Text>
            <Text style={styles.infoSub}>
              {heading === null
                ? "Compass not available — bearing is measured clockwise from true North."
                : aligned
                  ? "You're facing the qibla 🕋"
                  : "Turn until the 🕋 points straight up. Hold device flat."}
            </Text>
          </View>

          <Pressable style={styles.chip} onPress={locate}>
            <Text style={styles.chipText}>📍 Update location</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg, padding: 20, alignItems: "center", justifyContent: "center" },
    center: { alignItems: "center", gap: 10 },
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
    compassWrap: { alignItems: "center", gap: 24, width: "100%" },
    dial: {
      width: 240,
      height: 240,
      borderRadius: 120,
      borderWidth: 3,
      borderColor: c.border,
      backgroundColor: c.bgElev,
      alignItems: "center",
      justifyContent: "center",
    },
    dialAligned: { borderColor: c.accent },
    cardinal: { position: "absolute", color: c.muted, fontSize: 14, fontWeight: "700" },
    cardinalN: { top: 10 },
    cardinalS: { bottom: 10 },
    cardinalE: { right: 10 },
    cardinalW: { left: 10 },
    needle: { position: "absolute", alignItems: "center", justifyContent: "flex-start", height: "100%" },
    kaaba: { fontSize: 28, marginTop: 8 },
    infoBox: { alignItems: "center", gap: 4 },
    infoLabel: { color: c.muted, fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
    infoValue: { color: c.accent, fontSize: 26, fontWeight: "700" },
    infoSub: { color: c.muted, fontSize: 13, textAlign: "center", maxWidth: 260 },
    chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: c.border },
    chipText: { color: c.muted, fontSize: 13 },
  });
}

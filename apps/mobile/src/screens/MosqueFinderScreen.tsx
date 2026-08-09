import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import * as Location from "expo-location";
import { type Coordinates, type Place, directionsUrl, distanceKm, formatDistanceKm } from "@ummahlibrary/core";
import { Icon } from "@ummahlibrary/ui";
import { api } from "../api";
import { KEYS, getJSON, setJSON } from "../storage";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";

type Status = "idle" | "locating" | "loading" | "ready" | "denied" | "error";

const RADIUS_OPTIONS = [
  { meters: 2000, label: "2 km" },
  { meters: 5000, label: "5 km" },
  { meters: 10000, label: "10 km" },
  { meters: 20000, label: "20 km" },
];

export function MosqueFinderScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [places, setPlaces] = useState<readonly Place[]>([]);
  const [radius, setRadius] = useState(5000);
  const reqId = useRef(0);

  const fetchNearby = useCallback(async (c: Coordinates, radiusMeters: number) => {
    const id = ++reqId.current;
    setStatus("loading");
    try {
      const data = await api.getNearbyMosques({ lat: c.latitude, lng: c.longitude, radius: radiusMeters });
      if (id !== reqId.current) return;
      setPlaces(data.places);
      setStatus("ready");
    } catch {
      if (id === reqId.current) setStatus("error");
    }
  }, []);

  // Restore the shared location (same key as prayer times / qibla).
  useEffect(() => {
    void getJSON<Coordinates | null>(KEYS.prayerCoords, null).then((saved) => {
      if (saved) {
        setCoords(saved);
        void fetchNearby(saved, radius);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchNearby]);

  async function locate() {
    setStatus("locating");
    const { status: perm } = await Location.requestForegroundPermissionsAsync();
    if (perm !== "granted") {
      setStatus("denied");
      return;
    }
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const c: Coordinates = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setCoords(c);
      void setJSON(KEYS.prayerCoords, c);
      void fetchNearby(c, radius);
    } catch {
      setStatus("error");
    }
  }

  function changeRadius(meters: number) {
    setRadius(meters);
    if (coords) void fetchNearby(coords, meters);
  }

  const radiusLabel = RADIUS_OPTIONS.find((r) => r.meters === radius)?.label ?? `${radius}m`;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {!coords && status !== "locating" && (
        <View style={styles.cta}>
          <Text style={styles.ctaText}>
            Find mosques near you. Your location stays on this device — it's only sent to
            OpenStreetMap to search.
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
        <View style={styles.cta}>
          <Text style={styles.ctaText}>Couldn't load nearby mosques. Check your connection.</Text>
          <Pressable style={styles.chip} onPress={() => coords && fetchNearby(coords, radius)}>
            <Text style={styles.chipText}>Try again</Text>
          </Pressable>
        </View>
      )}

      {coords && (status === "ready" || status === "loading") && (
        <>
          <View style={styles.radiusRow}>
            {RADIUS_OPTIONS.map((r) => (
              <Pressable
                key={r.meters}
                style={[styles.chip, r.meters === radius && styles.chipOn]}
                onPress={() => changeRadius(r.meters)}
              >
                <Text style={[styles.chipText, r.meters === radius && styles.chipTextOn]}>
                  {r.label}
                </Text>
              </Pressable>
            ))}
            <Pressable style={styles.chip} onPress={locate}>
              <Text style={styles.chipText}>📍 Update</Text>
            </Pressable>
          </View>

          {status === "loading" && (
            <View style={styles.center}>
              <ActivityIndicator color={colors.accent} />
            </View>
          )}

          {status === "ready" && places.length === 0 && (
            <Text style={styles.muted}>No mosques found within {radiusLabel}. Try a wider radius.</Text>
          )}

          {status === "ready" && places.length > 0 && (
            <View style={styles.list}>
              {places.map((p, i) => (
                <View key={p.id} style={[styles.row, i < places.length - 1 && styles.rowDivider]}>
                  <Icon name="route" size={20} color={colors.muted} sw={1.8} />
                  <View style={styles.rowText}>
                    <Text style={styles.placeName}>{p.name}</Text>
                    <Text style={styles.placeSub}>
                      {formatDistanceKm(distanceKm(coords, p.coordinates))}
                      {p.address ? ` · ${p.address}` : ""}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.directionsBtn}
                    onPress={() => void Linking.openURL(directionsUrl(p.coordinates))}
                    accessibilityRole="button"
                    accessibilityLabel={`Directions to ${p.name}`}
                  >
                    <Text style={styles.directionsBtnText}>Directions</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      <Text style={styles.attribution}>
        Mosque data © OpenStreetMap contributors, published under the Open Database License (ODbL).
      </Text>
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { padding: 16, backgroundColor: c.bg, gap: 16, paddingBottom: 32 },
    center: { alignItems: "center", gap: 10, paddingTop: 20 },
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
    ctaBtn: { backgroundColor: c.accent, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
    ctaBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
    radiusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
    chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: c.border },
    chipOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    chipText: { color: c.muted, fontSize: 13 },
    chipTextOn: { color: c.accent, fontWeight: "600" },
    list: {
      backgroundColor: c.bgElev,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden",
    },
    row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
    rowDivider: { borderBottomWidth: 1, borderBottomColor: c.borderSoft },
    rowText: { flex: 1, gap: 2, minWidth: 0 },
    placeName: { color: c.fg, fontSize: 15, fontFamily: FONT.semibold },
    placeSub: { color: c.muted, fontSize: 12.5 },
    directionsBtn: {
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    directionsBtnText: { color: c.accent, fontSize: 12.5, fontFamily: FONT.semibold },
    attribution: { color: c.faint, fontSize: 11, textAlign: "center", marginTop: 4 },
  });
}

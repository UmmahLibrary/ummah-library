import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import * as Location from "expo-location";
import { type Coordinates, type Place, directionsUrl, distanceKm } from "@ummahlibrary/core";
import { Icon } from "@ummahlibrary/ui";
import { api } from "../api";
import { KEYS, getJSON, setJSON } from "../storage";
import { withTimeout } from "../utils";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { onSyncApplied } from "../lib/sync/sync-events";
import { useIntl } from "../i18n/I18nProvider";

type Status = "idle" | "locating" | "loading" | "ready" | "denied" | "error";

function sameCoords(a: Coordinates | null, b: Coordinates | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.latitude === b.latitude && a.longitude === b.longitude;
}

const RADIUS_OPTIONS = [2000, 5000, 10000, 20000] as const;

export function MosqueFinderScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, tf } = useIntl();
  // Same rounding as core's `formatDistanceKm`, in the interface language.
  const fmtDistance = (km: number) => {
    if (!Number.isFinite(km) || km < 0) return "—";
    if (km < 1) return tf("pr.m", { n: Math.round(km * 1000) });
    return tf("pr.km", { n: Number(km.toFixed(km < 10 ? 1 : 0)) });
  };
  // The places adapter falls back to "Mosque" for an unnamed mosque.
  const placeName = (name: string) => (name === "Mosque" ? t("pr.mosque") : name);

  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [places, setPlaces] = useState<readonly Place[]>([]);
  const [radius, setRadius] = useState(5000);
  const reqId = useRef(0);
  const coordsRef = useRef(coords);
  const radiusRef = useRef(radius);
  coordsRef.current = coords;
  radiusRef.current = radius;

  const fetchNearby = useCallback(async (c: Coordinates, radiusMeters: number) => {
    const id = ++reqId.current;
    setStatus("loading");
    try {
      const data = await api.getNearbyMosques({
        lat: c.latitude,
        lng: c.longitude,
        radius: radiusMeters,
      });
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

  // `onSyncApplied` is a single whole-app signal (mobile has no per-key sync
  // events like web), so this only refetches — hitting our own /nearby
  // endpoint, backed by Overpass — when the location actually changed, not on
  // every unrelated synced key (a hifz review, a prayer log entry, ...).
  useEffect(
    () =>
      onSyncApplied(() => {
        void getJSON<Coordinates | null>(KEYS.prayerCoords, null).then((saved) => {
          if (saved && !sameCoords(saved, coordsRef.current)) {
            setCoords(saved);
            void fetchNearby(saved, radiusRef.current);
          }
        });
      }),
    [fetchNearby],
  );

  async function locate() {
    setStatus("locating");
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== "granted") {
        setStatus("denied");
        return;
      }
      const pos = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
        15000,
      );
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

  const radiusLabel = fmtDistance(radius / 1000);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {!coords && status !== "locating" && (
        <View style={styles.cta}>
          <Text style={styles.ctaText}>{t("pr.mosqueIntro")}</Text>
          <Pressable style={styles.ctaBtn} onPress={locate}>
            <Text style={styles.ctaBtnText}>{t("pr.useLocation")}</Text>
          </Pressable>
        </View>
      )}

      {status === "locating" && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.muted}>{t("pr.locating")}</Text>
        </View>
      )}

      {status === "denied" && (
        <View style={styles.cta}>
          <Text style={styles.ctaText}>{t("pr.denied")}</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable style={styles.chip} onPress={locate}>
              <Text style={styles.chipText}>{t("pr.tryAgain")}</Text>
            </Pressable>
            <Pressable
              style={styles.chip}
              onPress={() => void Linking.openSettings().catch(() => {})}
            >
              <Text style={styles.chipText}>{t("pr.openSettings")}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {status === "error" && (
        <View style={styles.cta}>
          <Text style={styles.ctaText}>{t("pr.mosqueError")}</Text>
          <Pressable style={styles.chip} onPress={() => coords && fetchNearby(coords, radius)}>
            <Text style={styles.chipText}>{t("pr.tryAgain")}</Text>
          </Pressable>
        </View>
      )}

      {coords && (status === "ready" || status === "loading") && (
        <>
          <View style={styles.radiusRow}>
            {RADIUS_OPTIONS.map((meters) => (
              <Pressable
                key={meters}
                style={[styles.chip, meters === radius && styles.chipOn]}
                onPress={() => changeRadius(meters)}
              >
                <Text style={[styles.chipText, meters === radius && styles.chipTextOn]}>
                  {fmtDistance(meters / 1000)}
                </Text>
              </Pressable>
            ))}
            <Pressable style={styles.chip} onPress={locate}>
              <Text style={styles.chipText}>{t("pr.update")}</Text>
            </Pressable>
          </View>

          {status === "loading" && (
            <View style={styles.center}>
              <ActivityIndicator color={colors.accent} />
            </View>
          )}

          {status === "ready" && places.length === 0 && (
            <View style={styles.center}>
              <Text style={styles.muted}>{tf("pr.noMosques", { radius: radiusLabel })}</Text>
              <Pressable style={styles.chip} onPress={() => fetchNearby(coords, radius)}>
                <Text style={styles.chipText}>{t("pr.searchAgain")}</Text>
              </Pressable>
            </View>
          )}

          {status === "ready" && places.length > 0 && (
            <View style={styles.list}>
              {places.map((p, i) => (
                <View key={p.id} style={[styles.row, i < places.length - 1 && styles.rowDivider]}>
                  <Icon name="route" size={20} color={colors.muted} sw={1.8} />
                  <View style={styles.rowText}>
                    <Text style={styles.placeName}>{placeName(p.name)}</Text>
                    <Text style={styles.placeSub}>
                      {fmtDistance(distanceKm(coords, p.coordinates))}
                      {p.address ? ` · ${p.address}` : ""}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.directionsBtn}
                    onPress={() => void Linking.openURL(directionsUrl(p.coordinates))}
                    accessibilityRole="button"
                    accessibilityLabel={tf("pr.directionsTo", { name: placeName(p.name) })}
                  >
                    <Text style={styles.directionsBtnText}>{t("pr.directions")}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      <Text style={styles.attribution}>{t("pr.osmAttribution")}</Text>
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
    ctaBtn: {
      backgroundColor: c.accent,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    ctaBtnText: { color: c.ink, fontSize: 15, fontWeight: "700" },
    radiusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
    chip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
    },
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
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
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

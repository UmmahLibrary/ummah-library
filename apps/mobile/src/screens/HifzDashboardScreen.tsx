import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { TOTAL_AYAHS, type Surah } from "@ummahlibrary/core";
import { Khatam } from "@ummahlibrary/ui";
import { api } from "../api";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useLibrary } from "../state/LibraryContext";
import { AyahBadge } from "../components/AyahBadge";
import { relativeDue, surahProgressMap, type SurahProgress } from "../hifz";
import type { HifzStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<HifzStackParamList, "HifzDashboard">;

interface QueueItem extends SurahProgress {
  transliteration: string;
  name: string;
  ayahCount: number;
}

export function HifzDashboardScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { ready, allRecords, trackedCount, dueRecords, streak } = useLibrary();

  const [surahs, setSurahs] = useState<Surah[] | null>(null);

  useEffect(() => {
    let active = true;
    void api.listSurahs().then((s) => active && setSurahs(s)).catch(() => active && setSurahs([]));
    return () => {
      active = false;
    };
  }, []);

  const now = new Date();
  const dueCount = dueRecords(now).length;

  const queue = useMemo<QueueItem[]>(() => {
    if (!surahs) return [];
    const byNum = new Map(surahs.map((s) => [s.number, s]));
    const items: QueueItem[] = [];
    for (const [num, p] of surahProgressMap(allRecords(), now)) {
      const meta = byNum.get(num);
      if (!meta) continue;
      items.push({
        ...p,
        transliteration: meta.transliteration,
        name: meta.name,
        ayahCount: meta.ayahCount,
      });
    }
    items.sort((a, b) => b.dueCount - a.dueCount || a.surahNumber - b.surahNumber);
    return items;
    // trackedCount changes whenever the hifz store mutates — recompute then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahs, trackedCount]);

  const memorizedPct =
    trackedCount === 0 ? "0%" : `${Math.round((trackedCount / TOTAL_AYAHS) * 100)}%`;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.h1}>Hifz</Text>
      <Text style={styles.subtitle}>Memorize the Quran with spaced repetition</Text>

      {!ready ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : trackedCount === 0 ? (
        <View style={styles.empty}>
          <Khatam size={72} color={colors.accent} sw={1.2} opacity={0.5} />
          <Text style={styles.emptyTitle}>Begin your ḥifẓ journey</Text>
          <Text style={styles.emptyBody}>
            Open a surah and tap <Text style={styles.accentInline}>＋ Hifz</Text> on any āyah — it
            will appear here on a spaced-repetition schedule tuned to your recall.
          </Text>
        </View>
      ) : (
        <>
          {/* Stats */}
          <View style={styles.statsRow}>
            <Stat value={memorizedPct} label="Memorized" colors={colors} />
            <Stat value={String(dueCount)} label="Due today" colors={colors} />
          </View>
          <View style={styles.statsRow}>
            <Stat value={streak.count > 0 ? `${streak.count} 🔥` : "—"} label="Day streak" colors={colors} />
            <Stat value={String(trackedCount)} label="Āyāt tracked" colors={colors} />
          </View>

          {/* CTA */}
          {dueCount > 0 && (
            <View style={styles.cta}>
              <View style={styles.ctaText}>
                <Text style={styles.ctaTitle}>
                  {dueCount} āyah{dueCount !== 1 ? "āt" : ""} ready for review
                </Text>
                <Text style={styles.ctaSub}>Keep your streak alive — a few minutes is all it takes.</Text>
              </View>
              <Pressable style={styles.ctaBtn} onPress={() => navigation.navigate("HifzReview")}>
                <Text style={styles.ctaBtnText}>▶ Start review</Text>
              </Pressable>
            </View>
          )}

          {/* Queue */}
          <Text style={styles.sectionLabel}>Review queue</Text>
          {surahs === null ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 12 }} />
          ) : (
            <View style={{ gap: 10 }}>
              {queue.map((item) => (
                <View key={item.surahNumber} style={styles.queueRow}>
                  <AyahBadge n={item.surahNumber} size={38} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.queueName}>{item.transliteration}</Text>
                    <View style={styles.strengthRow}>
                      <View style={styles.strengthTrack}>
                        <View
                          style={[
                            styles.strengthFill,
                            { width: `${Math.round(item.avgStrength * 100)}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.queueMeta}>
                        {item.trackedCount}/{item.ayahCount} · {Math.round(item.avgStrength * 100)}%
                      </Text>
                    </View>
                  </View>
                  {item.dueCount > 0 ? (
                    <Text style={styles.dueBadge}>{item.dueCount} due</Text>
                  ) : (
                    <Text style={styles.nextDue}>{relativeDue(item.nextDue, now)}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
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
    screen: { padding: 18, backgroundColor: c.bg, gap: 12, flexGrow: 1 },
    h1: { color: c.fg, fontSize: 26, fontFamily: FONT.extrabold, letterSpacing: -0.5 },
    subtitle: { color: c.muted, fontSize: 14, marginTop: -6, marginBottom: 4 },
    empty: { alignItems: "center", paddingVertical: 48, gap: 14 },
    emptyTitle: { color: c.fg, fontSize: 20, fontWeight: "800" },
    emptyBody: { color: c.muted, fontSize: 14.5, lineHeight: 23, textAlign: "center", maxWidth: 360 },
    accentInline: { color: c.accent, fontWeight: "700" },
    statsRow: { flexDirection: "row", gap: 12 },
    stat: {
      flex: 1,
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 16,
    },
    statValue: { color: c.accent, fontSize: 24, fontFamily: FONT.extrabold, letterSpacing: -1 },
    statLabel: { color: c.faint, fontSize: 12.5, marginTop: 3 },
    cta: {
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 18,
      gap: 14,
      marginTop: 4,
    },
    ctaText: { gap: 4 },
    ctaTitle: { color: c.fg, fontSize: 16.5, fontFamily: FONT.extrabold },
    ctaSub: { color: c.muted, fontSize: 13, lineHeight: 19 },
    ctaBtn: {
      backgroundColor: c.accent,
      borderRadius: 11,
      paddingVertical: 12,
      alignItems: "center",
    },
    ctaBtnText: { color: c.ink, fontSize: 15, fontFamily: FONT.extrabold },
    sectionLabel: {
      color: c.faint,
      fontSize: 12,
      letterSpacing: 1,
      textTransform: "uppercase",
      fontWeight: "700",
      marginTop: 12,
    },
    queueRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 14,
    },
    badge: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
    badgeNum: { position: "absolute", color: c.accent, fontSize: 11.5, fontWeight: "700" },
    badgeNumSmall: { fontSize: 9 },
    queueName: { color: c.fg, fontSize: 15, fontWeight: "700" },
    strengthRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
    strengthTrack: {
      flex: 1,
      maxWidth: 100,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      overflow: "hidden",
    },
    strengthFill: { height: "100%", borderRadius: 2, backgroundColor: c.accent },
    queueMeta: { color: c.faint, fontSize: 12 },
    dueBadge: {
      color: c.accent,
      fontSize: 12.5,
      fontWeight: "700",
      backgroundColor: c.accentSoft,
      borderWidth: 1,
      borderColor: c.accent,
      borderRadius: 8,
      paddingVertical: 3,
      paddingHorizontal: 9,
      overflow: "hidden",
    },
    nextDue: { color: c.faint, fontSize: 12.5, fontWeight: "600" },
  });
}

import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  ADHKAR_OCCASIONS,
  type AdhkarOccasion,
  type Dhikr,
  filterByOccasion,
  isDhikrComplete,
  nextTally,
  sessionProgress,
} from "@ummahlibrary/core";
import { api } from "../api";
import { KEYS, getJSON, setJSON } from "../storage";
import { useTheme, type Palette } from "../theme";
import { adhkarToday } from "../utils";

interface Stored {
  date: string;
  counts: Record<string, number>;
}

async function loadCounts(): Promise<Record<string, number>> {
  const stored = await getJSON<Stored>(KEYS.adhkar, { date: "", counts: {} });
  return stored.date === adhkarToday() ? stored.counts : {};
}

async function saveCounts(counts: Record<string, number>): Promise<void> {
  await setJSON(KEYS.adhkar, { date: adhkarToday(), counts });
}

export function AdhkarScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [dhikr, setDhikr] = useState<Dhikr[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [occasion, setOccasion] = useState<AdhkarOccasion>("morning");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    Promise.all([api.listAdhkar(), loadCounts()])
      .then(([fetched, saved]) => {
        if (!active) return;
        setDhikr(fetched);
        setCounts(saved);
        setStatus("ready");
      })
      .catch(() => active && setStatus("error"));
    return () => { active = false; };
  }, []);

  function tap(d: Dhikr) {
    setCounts((prev) => {
      const next = { ...prev, [d.id]: nextTally(prev[d.id] ?? 0, d.repeat) };
      void saveCounts(next);
      return next;
    });
  }

  function reset() {
    setCounts((prev) => {
      const next = { ...prev };
      for (const d of items) delete next[d.id];
      void saveCounts(next);
      return next;
    });
  }

  const items = useMemo(() => filterByOccasion(dhikr, occasion), [dhikr, occasion]);
  const progress = sessionProgress(items, counts);
  const allDone = progress.total > 0 && progress.completed === progress.total;

  if (status === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (status === "error") {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load adhkar. Check your connection.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.tabs} accessibilityRole="tablist">
        {ADHKAR_OCCASIONS.map((o) => (
          <Pressable
            key={o.id}
            style={[styles.tab, o.id === occasion && styles.tabOn]}
            onPress={() => setOccasion(o.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: o.id === occasion }}
          >
            <Text style={[styles.tabText, o.id === occasion && styles.tabTextOn]}>{o.label}</Text>
            <Text style={[styles.tabAr, o.id === occasion && styles.tabTextOn]}>{o.arabic}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.progressRow, allDone && styles.progressRowDone]}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress.total ? (progress.completed / progress.total) * 100 : 0}%` },
            ]}
          />
        </View>
        <Text style={[styles.progressText, allDone && styles.progressTextDone]}>
          {allDone ? "Completed for today 🤍" : `${progress.completed} / ${progress.total} done`}
        </Text>
        <Pressable style={styles.resetChip} onPress={reset}>
          <Text style={styles.resetChipText}>Reset</Text>
        </Pressable>
      </View>

      {items.map((d, i) => {
        const count = counts[d.id] ?? 0;
        const done = isDhikrComplete(count, d.repeat);
        return (
          <Pressable
            key={d.id}
            style={[styles.card, done && styles.cardDone]}
            onPress={() => tap(d)}
            accessibilityLabel={`${d.transliteration}, tap to count, ${count} of ${d.repeat}`}
          >
            <View style={styles.cardHead}>
              <Text style={[styles.cardNum, done && styles.accentText]}>{i + 1}</Text>
              <Text style={[styles.counter, done && styles.accentText]}>
                {count} / {d.repeat}{done ? " ✓" : ""}
              </Text>
            </View>
            <Text style={styles.arabic}>{d.arabic}</Text>
            <Text style={styles.translit}>{d.transliteration}</Text>
            <Text style={styles.translation}>{d.translation}</Text>
            {(d.virtue || d.source) && (
              <Text style={styles.meta}>
                {[d.virtue, d.source].filter(Boolean).join(" · ")}
              </Text>
            )}
          </Pressable>
        );
      })}

      <Text style={styles.foot}>
        Tap a dhikr to count · progress resets each day · adhkar from Ḥiṣn al-Muslim
      </Text>
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { padding: 16, backgroundColor: c.bg, gap: 10, paddingBottom: 32 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.bg },
    errorText: { color: c.error, fontSize: 15, textAlign: "center", paddingHorizontal: 24 },
    tabs: { flexDirection: "row", gap: 8, marginBottom: 4 },
    tab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      gap: 2,
    },
    tabOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    tabText: { color: c.muted, fontSize: 14, fontWeight: "600" },
    tabAr: { color: c.muted, fontSize: 12 },
    tabTextOn: { color: c.accent },
    progressRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 10,
      borderRadius: 10,
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
    },
    progressRowDone: { borderColor: c.accent, backgroundColor: c.accentSoft },
    progressTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: c.border, overflow: "hidden" },
    progressFill: { height: 4, borderRadius: 2, backgroundColor: c.accent },
    progressText: { color: c.muted, fontSize: 12 },
    progressTextDone: { color: c.accent },
    resetChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: c.border },
    resetChipText: { color: c.muted, fontSize: 12 },
    card: {
      backgroundColor: c.bgElev,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
      gap: 6,
    },
    cardDone: { borderColor: c.accent, backgroundColor: c.accentSoft },
    cardHead: { flexDirection: "row", justifyContent: "space-between" },
    cardNum: { color: c.muted, fontSize: 12, fontWeight: "600" },
    counter: { color: c.muted, fontSize: 12, fontWeight: "600" },
    accentText: { color: c.accent },
    arabic: { color: c.fg, fontSize: 20, lineHeight: 34, writingDirection: "rtl" },
    translit: { color: c.fg, fontSize: 14, fontWeight: "600" },
    translation: { color: c.fg, fontSize: 13, lineHeight: 20 },
    meta: { color: c.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
    foot: { color: c.muted, fontSize: 11, textAlign: "center", marginTop: 8 },
  });
}

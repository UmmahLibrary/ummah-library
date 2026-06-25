import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "../Type";
import { api } from "../api";
import { TAFSIRS } from "../plugins";
import { useTheme, type Palette } from "../theme";
import { useSettings } from "../state/SettingsContext";

// One shared fetch per (tafsir, surah); every āyah/column toggle reuses it.
const cache = new Map<string, Promise<Map<number, string>>>();
function loadSurahTafsir(tafsirId: string, surah: number): Promise<Map<number, string>> {
  const key = `${tafsirId}:${surah}`;
  let pending = cache.get(key);
  if (!pending) {
    pending = api
      .getTafsir(surah, tafsirId)
      .then((entries) => new Map(entries.map((e) => [e.aya, e.text])))
      .catch(() => new Map<number, string>());
    cache.set(key, pending);
  }
  return pending;
}

// Arabic/Urdu/Persian tafsir reads right-to-left; everything else left-to-right.
const isRtl = (id: string) => /^(ar|ur|fa|ps|ckb)-/.test(id);

interface Loaded {
  state: "loading" | "ready" | "empty";
  text: string;
}

/**
 * Collapsible per-āyah tafsīr with side-by-side comparison (#141): chips pick the
 * editions and each selected edition is shown stacked (the phone-friendly form of
 * "parallel columns"). The selection persists (`ul.tafsirCompare`); an empty set
 * falls back to the single chosen tafsir — the original one-edition behaviour.
 */
export function AyahTafsir({ sura, aya }: { sura: number; aya: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tafsirId, tafsirCompare, tafsirs, setTafsirCompare } = useSettings();

  const allTafsirs = tafsirs.length > 0 ? tafsirs : TAFSIRS;
  const nameOf = (id: string) => allTafsirs.find((t) => t.id === id)?.name ?? "Tafsir";

  // The editions to show: the explicit comparison set (validated), else the primary.
  const editions = useMemo(() => {
    const valid = new Set(allTafsirs.map((t) => t.id));
    const sel = tafsirCompare.filter((id) => valid.has(id));
    return sel.length > 0 ? sel : tafsirId ? [tafsirId] : [];
  }, [tafsirCompare, tafsirId, allTafsirs]);

  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState<Record<string, Loaded>>({});

  useEffect(() => {
    if (!open) return;
    let active = true;
    editions.forEach((id) => {
      setLoaded((d) => (d[id] ? d : { ...d, [id]: { state: "loading", text: "" } }));
      void loadSurahTafsir(id, sura).then((byAya) => {
        if (!active) return;
        const entry = byAya.get(aya);
        setLoaded((d) => ({ ...d, [id]: { state: entry ? "ready" : "empty", text: entry ?? "" } }));
      });
    });
    return () => {
      active = false;
    };
  }, [open, editions, sura, aya]);

  function toggle(id: string) {
    const set = new Set(editions);
    if (set.has(id)) {
      if (set.size === 1) return; // keep at least one edition visible
      set.delete(id);
    } else {
      set.add(id);
    }
    // Preserve manifest order so the sections stay stable.
    setTafsirCompare(allTafsirs.filter((t) => set.has(t.id)).map((t) => t.id));
  }

  const header =
    editions.length > 1 ? `Tafsir · comparing ${editions.length}` : `Tafsir · ${nameOf(editions[0] ?? "")}`;

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => setOpen((o) => !o)}>
        <Text style={styles.toggle}>
          {open ? "▾" : "▸"} {header}
        </Text>
      </Pressable>
      {open && (
        <View style={styles.body}>
          {allTafsirs.length > 1 && (
            <View style={styles.chips}>
              {allTafsirs.map((t) => {
                const on = editions.includes(t.id);
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => toggle(t.id)}
                    style={[styles.chip, on && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{t.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {editions.map((id) => {
            const d = loaded[id];
            return (
              <View key={id} style={editions.length > 1 ? styles.section : undefined}>
                {editions.length > 1 && <Text style={styles.sectionName}>{nameOf(id)}</Text>}
                {(!d || d.state === "loading") && <ActivityIndicator color={colors.accent} />}
                {d?.state === "empty" && <Text style={styles.muted}>No tafsir for this āyah.</Text>}
                {d?.state === "ready" &&
                  d.text
                    .split("\n")
                    .filter((p) => p.trim())
                    .map((p, i) => (
                      <Text key={i} style={[styles.para, isRtl(id) && styles.rtl]}>
                        {p}
                      </Text>
                    ))}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    wrap: { marginTop: 10 },
    toggle: { color: c.accent, fontSize: 13, fontWeight: "600" },
    body: { marginTop: 8, gap: 8 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
    chip: {
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bg,
    },
    chipOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    chipText: { color: c.muted, fontSize: 12.5, fontWeight: "600" },
    chipTextOn: { color: c.accent },
    section: {
      borderWidth: 1,
      borderColor: c.borderSoft,
      borderRadius: 12,
      padding: 12,
      gap: 6,
    },
    sectionName: { color: c.fg, fontSize: 13, fontWeight: "700", marginBottom: 2 },
    muted: { color: c.muted, fontSize: 14 },
    para: { color: c.fg, fontSize: 15, lineHeight: 23 },
    rtl: { writingDirection: "rtl", textAlign: "right" },
  });
}

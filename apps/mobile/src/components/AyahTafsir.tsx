import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "../Type";
import { api } from "../api";
import { TAFSIRS } from "../plugins";
import { useTheme, type Palette } from "../theme";
import { useSettings } from "../state/SettingsContext";

// One shared fetch per (tafsir, surah); every ayah toggle reuses it.
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

/** Collapsible per-ayah tafsir (commentary) in the selected edition. */
export function AyahTafsir({ sura, aya }: { sura: number; aya: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tafsirId, tafsirs } = useSettings();
  const tafsirName =
    tafsirs.find((t) => t.id === tafsirId)?.name ??
    TAFSIRS.find((t) => t.id === tafsirId)?.name ??
    "Tafsir";
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "empty">("idle");
  const [text, setText] = useState("");

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setState("loading");
    const byAya = await loadSurahTafsir(tafsirId, sura);
    const entry = byAya.get(aya);
    setText(entry ?? "");
    setState(entry ? "ready" : "empty");
  }

  return (
    <View style={styles.wrap}>
      <Pressable onPress={toggle}>
        <Text style={styles.toggle}>
          {open ? "▾" : "▸"} Tafsir · {tafsirName}
        </Text>
      </Pressable>
      {open && (
        <View style={styles.body}>
          {state === "loading" && <ActivityIndicator color={colors.accent} />}
          {state === "empty" && <Text style={styles.muted}>No tafsir for this āyah.</Text>}
          {state === "ready" &&
            text
              .split("\n")
              .filter((p) => p.trim())
              .map((p, i) => (
                <Text key={i} style={styles.para}>
                  {p}
                </Text>
              ))}
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
    muted: { color: c.muted, fontSize: 14 },
    para: { color: c.fg, fontSize: 15, lineHeight: 23 },
  });
}

import { useMemo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { createCard } from "@ummahlibrary/core";
import { useTheme, type Palette } from "../theme";
import { useLibrary } from "../state/LibraryContext";

/** Toggle whether an ayah is tracked for Hifz (SM-2) review. */
export function HifzButton({ sura, aya }: { sura: number; aya: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { isTracked, setHifzCard, removeHifzCard } = useLibrary();
  const ref = { sura, aya };
  const tracked = isTracked(ref);

  return (
    <Pressable
      style={[styles.btn, tracked && styles.btnOn]}
      onPress={() => (tracked ? removeHifzCard(ref) : setHifzCard(ref, createCard(new Date())))}
    >
      <Text style={[styles.text, tracked && styles.textOn]}>{tracked ? "✓ Hifz" : "＋ Hifz"}</Text>
    </Pressable>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    btn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    btnOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    text: { color: c.muted, fontSize: 13 },
    textOn: { color: c.accent, fontWeight: "600" },
  });
}

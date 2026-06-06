import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Translation } from "@ummahlibrary/core";
import { useTheme, type Palette } from "../theme";

/**
 * Single-choice translation picker for the "Reading → Translations" view: pick
 * one of the shortlisted editions, or open the manager to change the shortlist.
 */
export function ReadingTranslationPicker({
  shortlist,
  activeId,
  onPick,
  onManage,
}: {
  shortlist: Translation[];
  activeId: string;
  onPick: (id: string) => void;
  onManage: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  const active = shortlist.find((e) => e.id === activeId);

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.trigger} onPress={() => setOpen((o) => !o)}>
        <Text style={styles.triggerText}>Translation: {active?.name ?? "—"} ▾</Text>
      </Pressable>
      {open && (
        <View style={styles.menu}>
          <Text style={styles.menuHead}>My Translations</Text>
          {shortlist.map((e) => (
            <Pressable
              key={e.id}
              style={styles.item}
              onPress={() => {
                onPick(e.id);
                setOpen(false);
              }}
            >
              <Text style={[styles.itemText, e.id === activeId && styles.itemOn]}>
                {e.id === activeId ? "● " : "○ "}
                {e.name}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={styles.manage}
            onPress={() => {
              setOpen(false);
              onManage();
            }}
          >
            <Text style={styles.manageText}>⚙ Select translations</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    wrap: { marginBottom: 16 },
    trigger: {
      alignSelf: "flex-start",
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    triggerText: { color: c.fg, fontSize: 14, fontWeight: "600" },
    menu: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      backgroundColor: c.bgElev,
      overflow: "hidden",
    },
    menuHead: {
      color: c.muted,
      fontSize: 12,
      fontWeight: "700",
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: 4,
    },
    item: { paddingVertical: 10, paddingHorizontal: 14 },
    itemText: { color: c.fg, fontSize: 15 },
    itemOn: { color: c.accent, fontWeight: "600" },
    manage: { paddingVertical: 10, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: c.border },
    manageText: { color: c.accent, fontSize: 14, fontWeight: "600" },
  });
}

import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  createCollection,
  isInCollection,
  toggleAyah,
  type VerseKey,
} from "@ummahlibrary/core";
import { useTheme, type Palette } from "../theme";
import { useLibrary, newCollectionId } from "../state/LibraryContext";

/**
 * Per-ayah "Save" affordance: toggles the ayah into one or more bookmark
 * collections (ayah-level, separate from surah bookmarks). Mirrors the web
 * reader's ☆ Save flow.
 */
export function SaveToCollection({ sura, aya }: { sura: number; aya: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { collections, updateCollections } = useLibrary();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const ref: VerseKey = { sura, aya };
  const saved = collections.some((c) => isInCollection(c, ref));

  function toggle(id: string) {
    updateCollections(toggleAyah(collections, id, ref));
  }

  function addCollection() {
    const name = newName.trim();
    if (!name) return;
    const id = newCollectionId();
    // Create, then add this ayah to the new collection.
    updateCollections(toggleAyah(createCollection(collections, id, name), id, ref));
    setNewName("");
  }

  return (
    <>
      <Pressable style={[styles.btn, saved && styles.btnOn]} onPress={() => setOpen(true)}>
        <Text style={[styles.btnText, saved && styles.btnTextOn]}>{saved ? "★ Saved" : "☆ Save"}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.title}>Save āyah {sura}:{aya}</Text>

            <ScrollView style={{ maxHeight: 280 }} keyboardShouldPersistTaps="handled">
              {collections.length === 0 ? (
                <Text style={styles.muted}>No collections yet — create one below.</Text>
              ) : (
                collections.map((c) => {
                  const on = isInCollection(c, ref);
                  return (
                    <Pressable key={c.id} style={styles.row} onPress={() => toggle(c.id)}>
                      <Text style={[styles.check, on && styles.checkOn]}>{on ? "☑" : "☐"}</Text>
                      <Text style={styles.rowName}>{c.name}</Text>
                      <Text style={styles.rowCount}>{c.ayahs.length}</Text>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>

            <View style={styles.newRow}>
              <TextInput
                style={styles.input}
                placeholder="New collection…"
                placeholderTextColor={colors.muted}
                value={newName}
                onChangeText={setNewName}
                onSubmitEditing={addCollection}
                returnKeyType="done"
              />
              <Pressable style={styles.addBtn} onPress={addCollection}>
                <Text style={styles.addText}>Add</Text>
              </Pressable>
            </View>

            <Pressable style={styles.done} onPress={() => setOpen(false)}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
    btnText: { color: c.muted, fontSize: 13 },
    btnTextOn: { color: c.accent, fontWeight: "600" },
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: c.bgElev,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
      gap: 12,
    },
    title: { color: c.fg, fontSize: 17, fontWeight: "700" },
    muted: { color: c.muted, fontSize: 14, paddingVertical: 10 },
    row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11 },
    check: { color: c.muted, fontSize: 20 },
    checkOn: { color: c.accent },
    rowName: { color: c.fg, fontSize: 15, flex: 1 },
    rowCount: { color: c.faint, fontSize: 13 },
    newRow: { flexDirection: "row", gap: 8, alignItems: "center" },
    input: {
      flex: 1,
      backgroundColor: c.bg,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      color: c.fg,
      paddingHorizontal: 12,
      paddingVertical: 9,
      fontSize: 14,
    },
    addBtn: {
      paddingVertical: 9,
      paddingHorizontal: 16,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.accent,
      backgroundColor: c.accentSoft,
    },
    addText: { color: c.accent, fontSize: 14, fontWeight: "700" },
    done: {
      marginTop: 4,
      paddingVertical: 12,
      borderRadius: 11,
      backgroundColor: c.accent,
      alignItems: "center",
    },
    doneText: { color: c.ink, fontSize: 15, fontWeight: "700" },
  });
}

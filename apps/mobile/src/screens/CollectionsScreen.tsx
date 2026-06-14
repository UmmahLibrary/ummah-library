import { useMemo } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "../Type";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ayahKey,
  deleteCollection,
  renameCollection,
  toggleAyah,
} from "@ummahlibrary/core";
import { Khatam } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";
import { useLibrary, newCollectionId } from "../state/LibraryContext";
import type { ReadStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<ReadStackParamList, "Collections">;

export function CollectionsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { collections, notes, updateCollections } = useLibrary();

  function addCollection() {
    updateCollections([
      ...collections,
      { id: newCollectionId(), name: `Collection ${collections.length + 1}`, ayahs: [] },
    ]);
  }

  function confirmDelete(id: string, name: string) {
    Alert.alert("Delete collection", `Delete “${name}”? Saved āyāt in it will be removed.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => updateCollections(deleteCollection(collections, id)) },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <View style={styles.head}>
        <Text style={styles.h1}>Bookmarks</Text>
        <Pressable style={styles.newBtn} onPress={addCollection}>
          <Text style={styles.newText}>＋ New</Text>
        </Pressable>
      </View>
      <Text style={styles.subtitle}>Your saved verses and collections</Text>

      {collections.length === 0 ? (
        <View style={styles.empty}>
          <Khatam size={64} color={colors.accent} sw={1.2} opacity={0.5} />
          <Text style={styles.emptyTitle}>No bookmarks yet</Text>
          <Text style={styles.emptyBody}>
            Open any surah, tap <Text style={styles.accentInline}>☆ Save</Text> under an āyah, and
            group your favourite verses into collections here.
          </Text>
          <Pressable style={styles.emptyBtn} onPress={addCollection}>
            <Text style={styles.emptyBtnText}>Create a collection</Text>
          </Pressable>
        </View>
      ) : (
        collections.map((c) => (
          <View key={c.id} style={styles.collection}>
            <View style={styles.collHead}>
              <TextInput
                style={styles.collName}
                value={c.name}
                onChangeText={(t) => updateCollections(renameCollection(collections, c.id, t))}
              />
              <Text style={styles.collCount}>{c.ayahs.length}</Text>
              <Pressable onPress={() => confirmDelete(c.id, c.name)} hitSlop={8}>
                <Text style={styles.delete}>Delete</Text>
              </Pressable>
            </View>

            {c.ayahs.length === 0 ? (
              <Text style={styles.muted}>Empty — save āyāt to it from the reader.</Text>
            ) : (
              c.ayahs.map((ref) => {
                const key = ayahKey(ref);
                return (
                  <View key={key} style={styles.ayahRow}>
                    <Pressable
                      style={styles.ayahRef}
                      onPress={() => navigation.navigate("SurahReader", { surah: ref.sura })}
                    >
                      <Text style={styles.ayahRefText}>{key}</Text>
                      {notes[key] ? <Text style={styles.note}>{notes[key]}</Text> : null}
                    </Pressable>
                    <Pressable onPress={() => updateCollections(toggleAyah(collections, c.id, ref))} hitSlop={8}>
                      <Text style={styles.remove}>✕</Text>
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { padding: 18, backgroundColor: c.bg, gap: 8, flexGrow: 1 },
    head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    h1: { color: c.fg, fontSize: 26, fontWeight: "800" },
    newBtn: {
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.accent,
      backgroundColor: c.accentSoft,
    },
    newText: { color: c.accent, fontSize: 14, fontWeight: "700" },
    subtitle: { color: c.muted, fontSize: 14, marginBottom: 10 },
    empty: { alignItems: "center", paddingVertical: 44, gap: 14 },
    emptyTitle: { color: c.fg, fontSize: 18, fontWeight: "700" },
    emptyBody: { color: c.muted, fontSize: 14.5, lineHeight: 23, textAlign: "center", maxWidth: 360 },
    accentInline: { color: c.accent, fontWeight: "700" },
    emptyBtn: {
      marginTop: 6,
      paddingVertical: 11,
      paddingHorizontal: 20,
      borderRadius: 11,
      backgroundColor: c.accent,
    },
    emptyBtnText: { color: c.ink, fontSize: 14.5, fontWeight: "700" },
    collection: {
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 14,
      marginTop: 10,
      gap: 6,
    },
    collHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
    collName: {
      flex: 1,
      color: c.fg,
      fontSize: 16,
      fontWeight: "700",
      paddingVertical: 2,
    },
    collCount: {
      color: c.accent,
      fontSize: 12.5,
      fontWeight: "700",
      backgroundColor: c.accentSoft,
      borderRadius: 999,
      paddingVertical: 2,
      paddingHorizontal: 9,
      overflow: "hidden",
    },
    delete: { color: c.faint, fontSize: 13 },
    muted: { color: c.muted, fontSize: 13.5, paddingVertical: 4 },
    ayahRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 9,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    ayahRef: { flex: 1 },
    ayahRefText: { color: c.accent, fontSize: 15, fontWeight: "600" },
    note: { color: c.faint, fontSize: 13, marginTop: 2 },
    remove: { color: c.faint, fontSize: 16 },
  });
}

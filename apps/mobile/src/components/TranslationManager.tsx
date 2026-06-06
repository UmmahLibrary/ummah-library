import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  type Translation,
  filterTranslations,
  groupTranslationsByLanguage,
} from "@ummahlibrary/core";
import { useTheme, type Palette } from "../theme";
import { DEFAULT_EDITION } from "../types";

/**
 * "Manage translations" sheet: search + language-grouped checklist + a "My
 * Translations" summary. Grouping/filtering are the pure `core` helpers; this
 * only owns the UI and never allows zero selected.
 */
export function TranslationManager({
  visible,
  catalogue,
  selected,
  onChange,
  onClose,
}: {
  visible: boolean;
  catalogue: Translation[];
  selected: string[];
  onChange: (next: string[]) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [query, setQuery] = useState("");

  const matches = useMemo(() => filterTranslations(catalogue, query), [catalogue, query]);
  const groups = useMemo(() => groupTranslationsByLanguage(matches), [matches]);
  const chosen = useMemo(
    () => catalogue.filter((e) => selected.includes(e.id)),
    [catalogue, selected],
  );

  function toggle(id: string) {
    const set = new Set(selected);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    if (set.size === 0) set.add(DEFAULT_EDITION); // never hide everything
    onChange([...set]);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.head}>
            <Text style={styles.title}>Translations</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <TextInput
            style={styles.search}
            placeholder="Search by name, author, or language…"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />

          <ScrollView keyboardShouldPersistTaps="handled">
            {chosen.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.groupTitle}>My Translations</Text>
                <View style={styles.pillRow}>
                  {chosen.map((e) => (
                    <Pressable key={e.id} style={styles.pill} onPress={() => toggle(e.id)}>
                      <Text style={styles.pillText}>{e.name} ✕</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {groups.length === 0 && (
              <Text style={styles.muted}>No translations match “{query}”.</Text>
            )}
            {groups.map((group) => (
              <View key={group.code} style={styles.section}>
                <Text style={styles.groupTitle}>
                  {group.english}
                  {group.native !== group.english ? `  ·  ${group.native}` : ""}
                </Text>
                {group.translations.map((t) => {
                  const on = selected.includes(t.id);
                  return (
                    <View key={t.id} style={styles.editionRow}>
                      <View style={styles.editionMeta}>
                        <Text style={styles.editionName}>{t.name}</Text>
                        <Text style={styles.editionAuthor}>{t.author}</Text>
                      </View>
                      <Switch
                        value={on}
                        onValueChange={() => toggle(t.id)}
                        trackColor={{ true: colors.accent, false: colors.border }}
                        thumbColor={colors.bg}
                      />
                    </View>
                  );
                })}
              </View>
            ))}
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    panel: {
      backgroundColor: c.bg,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingHorizontal: 18,
      paddingTop: 16,
      maxHeight: "85%",
    },
    head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    title: { color: c.fg, fontSize: 20, fontWeight: "700" },
    close: { color: c.muted, fontSize: 20 },
    search: {
      backgroundColor: c.bgElev,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      color: c.fg,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 15,
      marginVertical: 12,
    },
    section: { marginBottom: 18 },
    groupTitle: { color: c.accent, fontSize: 13, fontWeight: "700", marginBottom: 10 },
    pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    pill: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: c.accentSoft,
      borderWidth: 1,
      borderColor: c.accent,
    },
    pillText: { color: c.accent, fontSize: 13 },
    muted: { color: c.muted, fontSize: 14, marginBottom: 16 },
    editionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    editionMeta: { flex: 1, paddingRight: 12 },
    editionName: { color: c.fg, fontSize: 15 },
    editionAuthor: { color: c.muted, fontSize: 12 },
  });
}

import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import type { HadithSection } from "@ummahlibrary/core";
import { api } from "../api";
import { HADITH_COLLECTIONS } from "../plugins";
import { useTheme, type Palette } from "../theme";

export function HadithScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [collectionId, setCollectionId] = useState<string>(HADITH_COLLECTIONS[0].id);
  const [section, setSection] = useState(1);
  const [data, setData] = useState<HadithSection | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    setStatus("loading");
    api
      .getHadithSection(collectionId, section)
      .then((d) => {
        if (active) {
          setData(d);
          setStatus("ready");
        }
      })
      .catch(() => active && setStatus("error"));
    return () => {
      active = false;
    };
  }, [collectionId, section]);

  return (
    <View style={styles.screen}>
      <View style={styles.controls}>
        <View style={styles.collections}>
          {HADITH_COLLECTIONS.map((c) => (
            <Pressable
              key={c.id}
              style={[styles.collBtn, c.id === collectionId && styles.collBtnOn]}
              onPress={() => {
                setCollectionId(c.id);
                setSection(1);
              }}
            >
              <Text style={[styles.collText, c.id === collectionId && styles.collTextOn]}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.nav}>
          <Pressable
            style={[styles.chip, section <= 1 && styles.chipDisabled]}
            disabled={section <= 1}
            onPress={() => setSection((s) => Math.max(1, s - 1))}
          >
            <Text style={styles.chipText}>‹ Prev</Text>
          </Pressable>
          <Text style={styles.sectionLabel} numberOfLines={1}>
            Book {section}
            {data?.name ? ` · ${data.name}` : ""}
          </Text>
          <Pressable style={styles.chip} onPress={() => setSection((s) => s + 1)}>
            <Text style={styles.chipText}>Next ›</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {status === "loading" && <ActivityIndicator color={colors.accent} style={styles.spinner} />}
        {status === "error" && (
          <Text style={styles.muted}>
            Couldn’t load this book. You may have reached the end of the collection.
          </Text>
        )}
        {status === "ready" &&
          data?.hadiths.map((h) => (
            <View key={h.number} style={styles.hadith}>
              <Text style={styles.meta}>
                #{h.number}
                {h.grades.length > 0 ? ` · ${h.grades.join(" · ")}` : ""}
              </Text>
              <Text style={styles.text}>{h.text}</Text>
            </View>
          ))}
      </ScrollView>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    controls: {
      paddingHorizontal: 18,
      paddingTop: 8,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      gap: 12,
    },
    collections: { flexDirection: "row", gap: 8 },
    collBtn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
    },
    collBtnOn: { backgroundColor: c.accentSoft, borderColor: c.accent },
    collText: { color: c.muted, fontSize: 13, fontWeight: "600" },
    collTextOn: { color: c.accent },
    nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
    chip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    chipDisabled: { opacity: 0.4 },
    chipText: { color: c.fg, fontSize: 13 },
    sectionLabel: { color: c.muted, fontSize: 12, flex: 1, textAlign: "center" },
    list: { paddingHorizontal: 18, paddingVertical: 16 },
    spinner: { marginTop: 32 },
    muted: { color: c.muted, fontSize: 14, marginTop: 24 },
    hadith: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: c.border, paddingBottom: 16 },
    meta: { color: c.accent, fontSize: 12, marginBottom: 6 },
    text: { color: c.fg, fontSize: 15, lineHeight: 24 },
  });
}

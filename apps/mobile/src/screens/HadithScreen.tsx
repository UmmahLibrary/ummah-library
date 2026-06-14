import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import type { HadithSection } from "@ummahlibrary/core";
import { api } from "../api";
import { HADITH_COLLECTIONS } from "../plugins";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";

const GRADE_GOOD = "#5bbf8a";

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

  const collectionName =
    HADITH_COLLECTIONS.find((c) => c.id === collectionId)?.name ?? "Hadith";

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
            <View key={h.number} style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardCol} numberOfLines={1}>
                  {collectionName}
                  {data?.name ? <Text style={styles.cardBook}> · {data.name}</Text> : null}
                </Text>
                {h.grades[0] ? <Text style={styles.grade}>{h.grades[0]}</Text> : null}
              </View>
              <Text style={styles.text}>{h.text}</Text>
              <View style={styles.cardFoot}>
                <Text style={styles.ref}>
                  {collectionName} {h.number}
                </Text>
              </View>
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
    list: { paddingHorizontal: 18, paddingVertical: 16, gap: 12 },
    spinner: { marginTop: 32 },
    muted: { color: c.muted, fontSize: 14, marginTop: 24 },
    card: {
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 18,
    },
    cardHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      marginBottom: 12,
    },
    cardCol: { color: c.muted, fontSize: 12, fontFamily: FONT.semibold, flex: 1 },
    cardBook: { color: c.faint, fontFamily: FONT.regular },
    grade: {
      color: GRADE_GOOD,
      fontSize: 11,
      fontFamily: FONT.bold,
      borderWidth: 1,
      borderColor: GRADE_GOOD,
      borderRadius: 6,
      paddingVertical: 3,
      paddingHorizontal: 8,
      overflow: "hidden",
    },
    text: { color: c.muted, fontSize: 15, lineHeight: 24 },
    cardFoot: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.borderSoft },
    ref: { color: c.accent, fontSize: 12.5, fontFamily: FONT.semibold },
  });
}

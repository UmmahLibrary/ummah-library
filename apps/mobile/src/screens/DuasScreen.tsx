import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "../Type";
import { Khatam } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { DUAS, DUA_CATEGORIES, duaOfToday } from "../duas";

export function DuasScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const featured = duaOfToday();

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {/* Duʿā of the day */}
      <View style={styles.featured}>
        <View style={styles.featuredWatermark} pointerEvents="none">
          <Khatam size={140} color={colors.accent} sw={1.1} opacity={0.06} />
        </View>
        <Text style={styles.featuredKicker}>Duʿā of the day</Text>
        <Text style={styles.featuredAr}>{featured.ar}</Text>
        <Text style={styles.featuredEn}>“{featured.en}”</Text>
        <Text style={styles.featuredRef}>{featured.ref}</Text>
      </View>

      {DUA_CATEGORIES.map((cat) => {
        const list = DUAS.filter((d) => d.category === cat);
        if (list.length === 0) return null;
        return (
          <View key={cat}>
            <Text style={styles.sectionLabel}>{cat}</Text>
            {list.map((d) => (
              <View key={d.ref} style={styles.card}>
                <Text style={styles.cardAr}>{d.ar}</Text>
                <Text style={styles.cardEn}>{d.en}</Text>
                <Text style={styles.cardRef}>{d.ref}</Text>
              </View>
            ))}
          </View>
        );
      })}

      <Text style={styles.foot}>
        Qurʾānic supplications · recite with presence of heart and certainty of response.
      </Text>
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { padding: 18, backgroundColor: c.bg, paddingBottom: 32 },
    featured: {
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 20,
      overflow: "hidden",
      marginBottom: 8,
      gap: 12,
    },
    featuredWatermark: { position: "absolute", right: -36, top: -40 },
    featuredKicker: {
      color: c.accent,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      fontFamily: FONT.bold,
    },
    featuredAr: { color: c.fg, fontSize: 25, lineHeight: 48, textAlign: "right", writingDirection: "rtl" },
    featuredEn: { color: c.muted, fontSize: 14.5, lineHeight: 23 },
    featuredRef: { color: c.accent, fontSize: 13, fontFamily: FONT.semibold },
    sectionLabel: {
      color: c.faint,
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      fontFamily: FONT.bold,
      marginTop: 22,
      marginBottom: 11,
    },
    card: {
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
      gap: 10,
    },
    cardAr: { color: c.fg, fontSize: 22, lineHeight: 42, textAlign: "right", writingDirection: "rtl" },
    cardEn: { color: c.muted, fontSize: 14, lineHeight: 22 },
    cardRef: { color: c.accent, fontSize: 12.5, fontFamily: FONT.semibold },
    foot: { color: c.faint, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 16 },
  });
}

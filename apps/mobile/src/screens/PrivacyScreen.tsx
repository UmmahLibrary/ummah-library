import { useMemo } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "../Type";
import { PRIVACY_INTRO, PRIVACY_SECTIONS, PRIVACY_UPDATED } from "@ummahlibrary/core";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";

const EMAIL_RE = /([\w.+-]+@[\w.-]+\.\w+)/;

/**
 * Privacy policy — renders the shared core policy (same source as the web
 * `/privacy` page, so the two can't drift). `**bold**` marks emphasis; emails
 * become mailto links.
 */
export function PrivacyScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const inline = (text: string, k: string) =>
    text.split(/(\*\*[^*]+\*\*)/g).flatMap((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return [
          <Text key={`${k}-b${i}`} style={styles.bold}>
            {part.slice(2, -2)}
          </Text>,
        ];
      }
      return part.split(EMAIL_RE).map((seg, j) =>
        EMAIL_RE.test(seg) ? (
          <Text
            key={`${k}-${i}-${j}`}
            style={styles.link}
            onPress={() => Linking.openURL(`mailto:${seg}`)}
          >
            {seg}
          </Text>
        ) : (
          <Text key={`${k}-${i}-${j}`}>{seg}</Text>
        ),
      );
    });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>{inline(PRIVACY_INTRO, "intro")}</Text>

      {PRIVACY_SECTIONS.map((section, s) => (
        <View key={section.heading} style={styles.section}>
          <Text style={styles.heading}>{section.heading}</Text>
          {section.body.map((p, i) => (
            <Text key={i} style={styles.body}>
              {inline(p, `s${s}-p${i}`)}
            </Text>
          ))}
          {section.list?.map((li, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{inline(li, `s${s}-l${i}`)}</Text>
            </View>
          ))}
        </View>
      ))}

      <Text style={styles.updated}>Last updated {PRIVACY_UPDATED}.</Text>
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 20, paddingBottom: 40 },
    intro: { color: c.muted, fontSize: 14.5, lineHeight: 23 },
    section: { marginTop: 24 },
    heading: { color: c.fg, fontSize: 16.5, fontFamily: FONT.bold, marginBottom: 9 },
    body: { color: c.muted, fontSize: 14, lineHeight: 22, marginBottom: 4 },
    bold: { color: c.fg, fontFamily: FONT.semibold },
    link: { color: c.accent },
    bulletRow: { flexDirection: "row", gap: 8, marginTop: 8, paddingRight: 4 },
    bulletDot: { color: c.accent, fontSize: 14, lineHeight: 22 },
    bulletText: { flex: 1, color: c.muted, fontSize: 14, lineHeight: 22 },
    updated: { color: c.faint, fontSize: 12.5, marginTop: 28 },
  });
}

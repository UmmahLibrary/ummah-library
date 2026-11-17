import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import { SafeAreaView } from "react-native-safe-area-context";
import { Khatam } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useT } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/messages";
import { TranslationChoice } from "../components/TranslationChoice";

const SLIDES: readonly { title: MessageKey; body: MessageKey }[] = [
  { title: "home.onb.1.title", body: "home.onb.1.body" },
  { title: "home.onb.2.title", body: "home.onb.2.body" },
  { title: "home.onb.3.title", body: "home.onb.3.body" },
];

/** First-run intro. Shown until the user finishes; `onDone` persists the flag. */
export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useT();
  const [i, setI] = useState(0);
  // After the slides, one question (ADR 0041): which translation, or none.
  const [askTranslation, setAskTranslation] = useState(false);
  const slide = SLIDES[i]!;
  const last = i === SLIDES.length - 1;

  if (askTranslation) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={{ paddingVertical: 24, gap: 14 }}>
          <Text style={[styles.title, { textAlign: undefined, fontSize: 26, lineHeight: 32 }]}>
            {t("tr.choose")}
          </Text>
          <Text style={[styles.body, { textAlign: undefined, maxWidth: undefined }]}>
            {t("tr.chooseNote")}
          </Text>
          <TranslationChoice />
        </ScrollView>
        <View style={styles.footer}>
          <Pressable style={styles.btn} onPress={onDone} accessibilityRole="button">
            <Text style={styles.btnText}>{t("onb.start")}</Text>
          </Pressable>
          <Pressable onPress={onDone} hitSlop={8} accessibilityRole="button">
            <Text style={styles.skip}>{t("onb.skip")}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.art}>
          <Khatam size={184} color={colors.accent} sw={1.1} opacity={0.9} />
          <View style={styles.artInner}>
            <Khatam size={104} color={colors.accentHi} sw={1.4} opacity={0.5} />
          </View>
        </View>
        <Text style={styles.title}>{t(slide.title)}</Text>
        <Text style={styles.body}>{t(slide.body)}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, d) => (
            <View key={d} style={[styles.dot, d === i && styles.dotOn]} />
          ))}
        </View>
        <Pressable
          style={styles.btn}
          onPress={() => (last ? setAskTranslation(true) : setI(i + 1))}
          accessibilityRole="button"
        >
          <Text style={styles.btnText}>
            {last ? t("home.onb.getStarted") : t("home.onb.continue")}
          </Text>
        </Pressable>
        <Pressable onPress={onDone} hitSlop={8} accessibilityRole="button" disabled={last}>
          <Text style={styles.skip}>{last ? " " : t("onb.skip")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg, paddingHorizontal: 30 },
    content: { flex: 1, alignItems: "center", justifyContent: "center" },
    art: { alignItems: "center", justifyContent: "center", marginBottom: 40 },
    artInner: { position: "absolute" },
    title: {
      color: c.fg,
      fontSize: 30,
      fontFamily: FONT.extrabold,
      letterSpacing: -0.6,
      textAlign: "center",
      lineHeight: 36,
      marginBottom: 14,
    },
    body: {
      color: c.muted,
      fontSize: 16,
      lineHeight: 25,
      textAlign: "center",
      maxWidth: 320,
    },
    footer: { paddingBottom: 16, gap: 16, alignItems: "center" },
    dots: { flexDirection: "row", gap: 7 },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: c.border },
    dotOn: { width: 22, backgroundColor: c.accent },
    btn: {
      width: "100%",
      height: 54,
      borderRadius: 14,
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    btnText: { color: c.ink, fontSize: 16.5, fontFamily: FONT.extrabold },
    skip: { color: c.muted, fontSize: 14.5, paddingVertical: 4 },
  });
}

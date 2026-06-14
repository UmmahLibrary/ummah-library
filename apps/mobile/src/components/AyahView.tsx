import { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme, type Palette } from "../theme";
import { useLibrary } from "../state/LibraryContext";
import { toArabicDigits } from "../format";
import { HifzButton } from "./HifzButton";
import { SaveToCollection } from "./SaveToCollection";
import { AyahActions } from "./AyahActions";
import { AyahTafsir } from "./AyahTafsir";

export interface TrLine {
  id: string;
  name: string;
  text: string;
  direction: "ltr" | "rtl";
  language: string;
}

interface Props {
  sura: number;
  aya: number;
  arabic: string;
  words: string[];
  translations: TrLine[];
  activeWord: number;
  playing: boolean;
  scale: number;
  onPlayFrom: (aya: number) => void;
  onPlayOne: (aya: number) => void;
}

/**
 * One verse-by-verse ayah: highlightable Arabic words, the selected
 * translations, and the action row (play, Hifz, copy/share, tafsir). Memoized so
 * only the playing ayah re-renders as the recitation moves word to word.
 */
function AyahViewImpl({
  sura,
  aya,
  arabic,
  words,
  translations,
  activeWord,
  playing,
  scale,
  onPlayFrom,
  onPlayOne,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { isTracked } = useLibrary();
  const memorized = isTracked({ sura, aya });

  return (
    <View style={[styles.ayah, memorized && styles.ayahMemorized, playing && styles.ayahPlaying]}>
      {memorized && (
        <Text style={styles.memorizedTag} accessibilityLabel="Memorizing this āyah">
          ✦ Memorizing
        </Text>
      )}
      <Text style={[styles.arabic, { fontSize: 26 * scale, lineHeight: 46 * scale }]}>
        {words.map((w, i) => (
          <Text key={i} style={playing && i === activeWord ? styles.wordActive : undefined}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </Text>
        ))}{" "}
        <Text style={styles.marker} onPress={() => onPlayFrom(aya)}>
          ﴿{toArabicDigits(aya)}﴾
        </Text>
      </Text>

      {translations.map((t) => (
        <View key={t.id} style={styles.tr}>
          <Text style={styles.trName}>{t.name}</Text>
          <Text
            style={[
              styles.trText,
              { fontSize: 15 * scale, lineHeight: 23 * scale },
              t.direction === "rtl" && styles.rtl,
            ]}
          >
            {t.text}
          </Text>
        </View>
      ))}

      <View style={styles.actions}>
        <Pressable style={styles.playBtn} onPress={() => onPlayOne(aya)}>
          <Text style={styles.playText}>▶ Play</Text>
        </Pressable>
        <HifzButton sura={sura} aya={aya} />
        <SaveToCollection sura={sura} aya={aya} />
        <AyahActions sura={sura} aya={aya} arabic={arabic} translations={translations.map((t) => t.text)} />
      </View>
      <AyahTafsir sura={sura} aya={aya} />
    </View>
  );
}

export const AyahView = memo(AyahViewImpl);

function makeStyles(c: Palette) {
  return StyleSheet.create({
    ayah: {
      paddingVertical: 16,
      paddingHorizontal: 10,
      marginHorizontal: -10,
      borderRadius: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    ayahPlaying: { backgroundColor: c.bgElev, borderBottomColor: "transparent" },
    ayahMemorized: {
      borderLeftWidth: 2,
      borderLeftColor: c.accent,
      backgroundColor: c.accentSoft,
      borderBottomColor: "transparent",
    },
    memorizedTag: {
      color: c.accent,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    arabic: { color: c.fg, textAlign: "right", writingDirection: "rtl" },
    wordActive: { color: c.accent },
    marker: { color: c.accent, fontSize: 18 },
    tr: { marginTop: 12 },
    trName: { color: c.muted, fontSize: 12, marginBottom: 2 },
    trText: { color: c.fg },
    rtl: { textAlign: "right", writingDirection: "rtl" },
    actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 12 },
    playBtn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    playText: { color: c.accent, fontSize: 13, fontWeight: "600" },
  });
}

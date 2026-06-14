import { memo, useMemo } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "../Type";
import { createCard } from "@ummahlibrary/core";
import { Icon } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useLibrary } from "../state/LibraryContext";
import { AyahBadge } from "./AyahBadge";
import { SaveToCollection } from "./SaveToCollection";
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
 * One verse-by-verse āyah in the Noor reader layout: a khatam number badge and
 * an icon action row (play · memorize · save · share) on top, then the
 * highlightable Arabic, the translations, and collapsible tafsīr. Memoized so
 * only the playing āyah re-renders as the recitation moves word to word.
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
  const { isTracked, setHifzCard, removeHifzCard } = useLibrary();
  const ref = { sura, aya };
  const memorized = isTracked(ref);

  const share = () => {
    const block = [arabic, ...translations.map((t) => t.text), `— ${sura}:${aya}`]
      .filter(Boolean)
      .join("\n");
    const link = `https://app.ummahlibrary.org/surah/${sura}#${sura}:${aya}`;
    void Share.share({ message: `${block}\n${link}` });
  };

  return (
    <View style={[styles.ayah, playing && styles.ayahPlaying]}>
      <View style={styles.head}>
        <AyahBadge n={aya} size={30} />
        <View style={styles.actions}>
          <Pressable onPress={() => onPlayOne(aya)} hitSlop={8} accessibilityLabel="Play āyah">
            <Icon name="play" size={17} color={playing ? colors.accent : colors.faint} />
          </Pressable>
          <Pressable
            onPress={() => (memorized ? removeHifzCard(ref) : setHifzCard(ref, createCard(new Date())))}
            hitSlop={8}
            accessibilityLabel={memorized ? "Stop memorizing" : "Memorize āyah"}
          >
            <Icon name="star" size={17} color={memorized ? colors.accent : colors.faint} sw={1.8} />
          </Pressable>
          <SaveToCollection sura={sura} aya={aya} asIcon />
          <Pressable onPress={share} hitSlop={8} accessibilityLabel="Share āyah">
            <Icon name="share" size={17} color={colors.faint} sw={1.8} />
          </Pressable>
        </View>
      </View>

      <Text
        style={[styles.arabic, { fontSize: 26 * scale, lineHeight: 50 * scale }]}
        onPress={() => onPlayFrom(aya)}
      >
        {words.map((w, i) => (
          <Text key={i} style={playing && i === activeWord ? styles.wordActive : undefined}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </Text>
        ))}
      </Text>

      {translations.map((t) => (
        <View key={t.id} style={styles.tr}>
          <Text style={styles.trName}>{t.name}</Text>
          <Text
            style={[
              styles.trText,
              { fontSize: 15 * scale, lineHeight: 24 * scale },
              t.direction === "rtl" && styles.rtl,
            ]}
          >
            {t.text}
          </Text>
        </View>
      ))}

      <AyahTafsir sura={sura} aya={aya} />
    </View>
  );
}

export const AyahView = memo(AyahViewImpl);

function makeStyles(c: Palette) {
  return StyleSheet.create({
    ayah: {
      paddingVertical: 18,
      paddingHorizontal: 10,
      marginHorizontal: -10,
      borderRadius: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSoft,
    },
    ayahPlaying: { backgroundColor: c.bgElev, borderBottomColor: "transparent" },
    head: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    actions: { flexDirection: "row", alignItems: "center", gap: 20 },
    arabic: { color: c.fg, textAlign: "right", writingDirection: "rtl", fontFamily: FONT.ar },
    wordActive: { color: c.accent },
    tr: { marginTop: 12 },
    trName: { color: c.faint, fontSize: 12, marginBottom: 3, fontFamily: FONT.medium },
    trText: { color: c.muted },
    rtl: { textAlign: "right", writingDirection: "rtl" },
  });
}

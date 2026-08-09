import { memo, useEffect, useMemo, useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "../Type";
import * as Clipboard from "expo-clipboard";
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
  /** Latin transliteration line shown under the Arabic (#150); null when off. */
  transliteration?: string | null;
  /** Per-word Latin transliteration (#144); when present, words stack over it. */
  translitWords?: string[] | null;
  /** Tap-a-word-to-hear (#145): render words as tap targets that play that word. */
  tapToHear?: boolean;
  /** Render the Arabic in the IndoPak Nastaʿlīq face (ADR 0035). */
  indopak?: boolean;
  onPlayWord?: (aya: number, wordIndex: number) => void;
  activeWord: number;
  playing: boolean;
  scale: number;
  onPlayFrom: (aya: number) => void;
  onPlayOne: (aya: number) => void;
  /** Memorize / hide-and-peek (#134). */
  peek?: boolean;
  /** Global word index of this āyah's first word, for the shared reveal cursor. */
  peekStart?: number;
  /** How many words (globally, in reading order) are revealed. */
  peekRevealed?: number;
  /** Global indices of words revealed ad-hoc by tapping. */
  peekExtra?: ReadonlySet<number>;
  /** Also conceal the translation while memorizing. */
  peekHideTr?: boolean;
  onPeekWord?: (globalIndex: number) => void;
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
  transliteration,
  translitWords,
  tapToHear = false,
  indopak = false,
  onPlayWord,
  activeWord,
  playing,
  scale,
  onPlayFrom,
  onPlayOne,
  peek = false,
  peekStart = 0,
  peekRevealed = 0,
  peekExtra,
  peekHideTr = false,
  onPeekWord,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { isTracked, setHifzCard, removeHifzCard } = useLibrary();
  const ref = { sura, aya };
  const memorized = isTracked(ref);

  // On web, Share.share() rejects when the browser has no navigator.share
  // (react-native-web's default) — fall back to the clipboard so the tap still
  // does something, with a brief inline confirmation since Alert.alert() is a
  // no-op on web too.
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const share = async () => {
    const block = [arabic, ...translations.map((t) => t.text), `— ${sura}:${aya}`]
      .filter(Boolean)
      .join("\n");
    const link = `https://ummahlibrary.org/surah/${sura}#${sura}:${aya}`;
    const message = `${block}\n${link}`;
    try {
      await Share.share({ message });
    } catch {
      await Clipboard.setStringAsync(message);
      setCopied(true);
    }
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
            onPress={() =>
              memorized ? removeHifzCard(ref) : setHifzCard(ref, createCard(new Date()))
            }
            hitSlop={8}
            accessibilityLabel={memorized ? "Stop memorizing" : "Memorize āyah"}
          >
            <Icon name="star" size={17} color={memorized ? colors.accent : colors.faint} sw={1.8} />
          </Pressable>
          <SaveToCollection sura={sura} aya={aya} asIcon />
          <View>
            <Pressable onPress={() => void share()} hitSlop={8} accessibilityLabel="Share āyah">
              <Icon name="share" size={17} color={colors.faint} sw={1.8} />
            </Pressable>
            {copied && (
              <View style={styles.copiedBubble} pointerEvents="none">
                <Text style={styles.copiedText}>Copied</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {((translitWords && translitWords.length > 0) || tapToHear) && !peek ? (
        // Word-by-word view (#144 transliteration + #145 tap-to-hear): each word
        // is a tap target stacked over its Latin reading. A tap plays just that
        // word when tap-to-hear is on, else it plays from the āyah.
        <View style={styles.wbwRow}>
          {words.map((w, i) => (
            <Pressable
              key={i}
              style={styles.wbwUnit}
              onPress={() => (tapToHear && onPlayWord ? onPlayWord(aya, i) : onPlayFrom(aya))}
            >
              <Text
                style={[
                  styles.wbwAr,
                  indopak && styles.arabicIndopak,
                  { fontSize: 26 * scale, lineHeight: (indopak ? 52 : 40) * scale },
                ]}
              >
                {w}
              </Text>
              {translitWords?.[i] ? (
                <Text style={[styles.wbwTr, { fontSize: 12 * scale }]}>{translitWords[i]}</Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : (
        <Text
          style={[
            styles.arabic,
            indopak && styles.arabicIndopak,
            { fontSize: 26 * scale, lineHeight: (indopak ? 64 : 50) * scale },
          ]}
          onPress={peek ? undefined : () => onPlayFrom(aya)}
        >
          {/* In peek mode every word is a tappable span — concealed until the
            reveal cursor reaches it or it's tapped. Otherwise only the playing
            āyah splits into per-word spans (for highlighting); every other āyah
            renders as a single text node, which keeps long surahs cheap to scroll. */}
          {peek
            ? words.map((w, i) => {
                const gi = peekStart + i;
                const shown = gi < peekRevealed || peekExtra?.has(gi);
                return (
                  <Text
                    key={i}
                    onPress={() => onPeekWord?.(gi)}
                    style={shown ? undefined : styles.wordHidden}
                  >
                    {w}
                    {i < words.length - 1 ? " " : ""}
                  </Text>
                );
              })
            : playing
              ? words.map((w, i) => (
                  <Text key={i} style={i === activeWord ? styles.wordActive : undefined}>
                    {w}
                    {i < words.length - 1 ? " " : ""}
                  </Text>
                ))
              : arabic}
        </Text>
      )}

      {transliteration && !peekHideTr ? (
        <Text style={[styles.translit, { fontSize: 14 * scale, lineHeight: 22 * scale }]}>
          {transliteration}
        </Text>
      ) : null}

      {!peekHideTr &&
        translations.map((t) => (
          <View key={t.id} style={styles.tr}>
            {translations.length > 1 && <Text style={styles.trName}>{t.name}</Text>}
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
    copiedBubble: {
      position: "absolute",
      bottom: 24,
      right: -8,
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    copiedText: { color: c.fg, fontSize: 11, fontFamily: FONT.medium },
    arabic: { color: c.fg, textAlign: "right", writingDirection: "rtl", fontFamily: FONT.ar },
    // IndoPak Nastaʿlīq face (ADR 0035) — applied over `arabic`/`wbwAr`.
    arabicIndopak: { fontFamily: FONT.arIndopak },
    wordActive: { color: c.accent },
    // Concealed word: keep its footprint (a hint of length) but hide the glyphs.
    wordHidden: { color: "transparent", backgroundColor: c.borderSoft },
    translit: { color: c.faint, marginTop: 10, fontStyle: "italic", fontFamily: FONT.medium },
    // Word-by-word transliteration (#144): RTL flow of stacked word units.
    wbwRow: {
      flexDirection: "row-reverse",
      flexWrap: "wrap",
      alignItems: "flex-start",
      justifyContent: "flex-start",
      gap: 12,
    },
    wbwUnit: { alignItems: "center" },
    wbwAr: { color: c.fg, fontFamily: FONT.ar, textAlign: "center" },
    wbwTr: { color: c.faint, marginTop: 2, fontFamily: FONT.medium, textAlign: "center" },
    tr: { marginTop: 12 },
    trName: { color: c.faint, fontSize: 12, marginBottom: 3, fontFamily: FONT.medium },
    trText: { color: c.muted },
    rtl: { textAlign: "right", writingDirection: "rtl" },
  });
}

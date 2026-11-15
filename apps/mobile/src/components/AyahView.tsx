import { useIntl } from "../i18n/I18nProvider";
import { LTR_TEXT, textDir } from "../text-direction";
import { memo, useEffect, useMemo, useState } from "react";
import type { IconName } from "@ummahlibrary/ui";
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
import { useSettings } from "../state/SettingsContext";
import { targetSize } from "../comfort";

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
  /** Arabic size multiplier (font size + proportional line height only). */
  scale: number;
  /** Translation / transliteration size multiplier, independent of the Arabic. */
  trScale?: number;
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
  trScale = 1,
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
  const { comfort } = useSettings();
  const { t, tf, num, dir } = useIntl();
  const min = targetSize(comfort);
  const softTr = comfort.trEmphasis === "soft";

  // A labelled per-āyah action (ADR 0041): icon + 14sp word, ≥ 48dp tall.
  const action = (
    icon: IconName,
    label: string,
    onPress: () => void,
    on: boolean,
    a11y: string,
  ) => (
    <Pressable
      style={({ pressed }) => [
        styles.act,
        { minHeight: min, minWidth: min },
        on && styles.actOn,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
    >
      <Icon name={icon} size={18} color={on ? colors.accent : colors.fg} sw={1.8} />
      <Text style={styles.actText}>{label}</Text>
    </Pressable>
  );
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
        <AyahBadge n={num(aya)} size={30} />
        <View style={styles.actions}>
          {action(
            "play",
            t("ayah.play"),
            () => onPlayOne(aya),
            playing,
            tf("rd.ayah.playA11y", { n: aya }),
          )}
          {action(
            "star",
            memorized ? t("ayah.memorizing") : t("ayah.memorize"),
            () => (memorized ? removeHifzCard(ref) : setHifzCard(ref, createCard(new Date()))),
            memorized,
            memorized ? tf("rd.ayah.stopMemA11y", { n: aya }) : tf("rd.ayah.memA11y", { n: aya }),
          )}
          <SaveToCollection
            sura={sura}
            aya={aya}
            trigger={(open, saved) =>
              action(
                "bookmark",
                saved ? t("ayah.saved") : t("ayah.save"),
                open,
                saved,
                tf("rd.ayah.saveA11y", { n: aya }),
              )
            }
          />
          <View>
            {action(
              "share",
              t("ayah.share"),
              () => void share(),
              false,
              tf("rd.ayah.shareA11y", { n: aya }),
            )}
            {copied && (
              <View style={styles.copiedBubble} pointerEvents="none">
                <Text style={styles.copiedText}>{t("rd.copied")}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {((translitWords && translitWords.length > 0) || tapToHear) && !peek ? (
        // Word-by-word view (#144 transliteration + #145 tap-to-hear): each word
        // is a tap target stacked over its Latin reading. A tap plays just that
        // word when tap-to-hear is on, else it plays from the āyah.
        // Under an RTL interface (ar/ur) Yoga flips row-reverse to left-to-right, so
        // the Arabic word order is kept right-to-left by switching to "row" there.
        <View style={[styles.wbwRow, dir === "rtl" && { flexDirection: "row" }]}>
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
                  { fontSize: 26 * scale, lineHeight: (indopak ? 64 : 50) * scale },
                ]}
              >
                {w}
              </Text>
              {translitWords?.[i] ? (
                <Text style={[styles.wbwTr, { fontSize: 13 * trScale, lineHeight: 18 * trScale }]}>
                  {translitWords[i]}
                </Text>
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
        <Text
          style={[styles.translit, LTR_TEXT, { fontSize: 14 * trScale, lineHeight: 22 * trScale }]}
        >
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
                { fontSize: 16 * trScale, lineHeight: 26 * trScale },
                softTr && styles.trSoft,
                textDir(t.direction),
                t.direction === "rtl" && { fontSize: 18 * trScale, lineHeight: 34 * trScale },
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
    actions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      flexWrap: "wrap",
      gap: 4,
      flexShrink: 1,
    },
    act: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 12,
      gap: 1,
    },
    actOn: { backgroundColor: c.accentSoft },
    pressed: { opacity: 0.7 },
    actText: { color: c.fg, fontSize: 14, fontFamily: FONT.medium },
    copiedBubble: {
      position: "absolute",
      bottom: 52,
      end: 0,
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    copiedText: { color: c.fg, fontSize: 13, fontFamily: FONT.medium },
    // Quran text: the Quran face, explicit line height (≥ 1.9× the size, set
    // inline) and vertical padding so stacked marks never clip on Android.
    arabic: {
      color: c.fg,
      textAlign: "right",
      writingDirection: "rtl",
      fontFamily: FONT.arQuran,
      direction: "ltr",
      paddingVertical: 4,
    },
    // IndoPak Nastaʿlīq face (ADR 0035) — applied over `arabic`/`wbwAr`.
    arabicIndopak: { fontFamily: FONT.arIndopak, direction: "ltr" },
    wordActive: { color: c.accent },
    // Concealed word: keep its footprint (a hint of length) but hide the glyphs.
    wordHidden: { color: "transparent", backgroundColor: c.borderSoft },
    translit: { color: c.muted, marginTop: 10, fontStyle: "italic", fontFamily: FONT.medium },
    // Word-by-word transliteration (#144): RTL flow of stacked word units.
    wbwRow: {
      flexDirection: "row-reverse",
      flexWrap: "wrap",
      alignItems: "flex-start",
      justifyContent: "flex-start",
      gap: 12,
    },
    wbwUnit: { alignItems: "center" },
    wbwAr: {
      color: c.fg,
      fontFamily: FONT.arQuran,
      direction: "ltr",
      textAlign: "center",
      paddingVertical: 2,
    },
    wbwTr: { color: c.muted, marginTop: 2, fontFamily: FONT.medium, textAlign: "center" },
    tr: { marginTop: 12 },
    trName: { color: c.muted, fontSize: 13, marginBottom: 3, fontFamily: FONT.medium },
    // Equal emphasis by default; "softer" (Reading comfort) quiets it to muted.
    trText: { color: c.fg },
    trSoft: { color: c.muted },
    rtl: { textAlign: "right", writingDirection: "rtl" },
  });
}

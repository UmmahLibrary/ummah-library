import { useIntl } from "../i18n/I18nProvider";
import { LTR_TEXT } from "../text-direction";
import { memo, useEffect, useMemo, useState } from "react";
import type { IconName } from "@ummahlibrary/ui";
import { Modal, Pressable, Share, StyleSheet, Text, View } from "../Type";
import * as Clipboard from "expo-clipboard";
import { createCard, editionLangCode } from "@ummahlibrary/core";
import { AyahBlock, Icon, ListRow, quranType } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useLibrary } from "../state/LibraryContext";
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
 * One verse-by-verse āyah, laid out like the web reader (ADR 0042): the
 * highlightable Arabic ending in its ﴿n﴾ marker, the translations, then a
 * labelled action row (play · memorize · save · share) and collapsible tafsīr. Memoized so
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
  const { t, tf, dir, script } = useIntl();
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
      <Icon name={icon} size={16} color={on ? colors.accent : colors.fg} sw={1.8} />
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
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const copyVerse = async () => {
    const block = [arabic, ...translations.map((tr) => tr.text), `— ${sura}:${aya}`]
      .filter(Boolean)
      .join("\n");
    await Clipboard.setStringAsync(block);
    setCopied(true);
  };

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

  // End-of-āyah marker ﴿n﴾, as in the web reader: a tappable number that plays
  // from this āyah. It is interface, not Quran text, so it sits in its own span.
  const marker = (
    <Text
      style={[styles.marker, { fontSize: 18 * scale }]}
      onPress={() => onPlayFrom(aya)}
      accessibilityRole="button"
      accessibilityLabel={tf("rd.ayah.playA11y", { n: aya })}
    >
      {" \uFD3F" + toArabicDigits(aya) + "\uFD3E"}
    </Text>
  );

  return (
    // Shared āyah frame (ADR 0042), in the web reader's order: Arabic with its
    // marker, transliteration, translations, then the labelled action row.
    <AyahBlock
      highlighted={playing}
      label={tf("rd.ayah.label", { n: aya })}
      arabic={
        <>
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
                    <Text
                      style={[styles.wbwTr, { fontSize: 13 * trScale, lineHeight: 18 * trScale }]}
                    >
                      {translitWords[i]}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
              <Pressable style={styles.wbwUnit} onPress={() => onPlayFrom(aya)}>
                {marker}
              </Pressable>
            </View>
          ) : (
            <Text
              style={[
                styles.arabic,
                indopak && styles.arabicIndopak,
                {
                  fontSize: quranType.verse.size * scale,
                  lineHeight: (indopak ? 74 : quranType.verse.lineHeight) * scale,
                },
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
              {marker}
            </Text>
          )}
        </>
      }
      below={
        <>
          {transliteration && !peekHideTr ? (
            <Text
              style={[
                styles.translit,
                LTR_TEXT,
                { fontSize: 14 * trScale, lineHeight: 22 * trScale },
              ]}
            >
              {transliteration}
            </Text>
          ) : null}
        </>
      }
      translations={
        peekHideTr
          ? []
          : translations.map((tr) => ({
              key: tr.id,
              label: tr.name,
              text: tr.text,
              // Catalogue names ("Urdu") → codes ("ur"), so each gets its own face.
              lang: editionLangCode(tr.language) ?? tr.language,
              dir: tr.direction,
            }))
      }
      translationTone={softTr ? "muted" : "fg"}
      translationScale={trScale}
      actions={
        <>
          {action(
            "play",
            t("ayah.play"),
            () => onPlayOne(aya),
            playing,
            tf("rd.ayah.playA11y", { n: aya }),
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
          {action(
            "tafsir",
            t("ayah.tafsir"),
            () => setTafsirOpen((o) => !o),
            tafsirOpen,
            t("ayah.tafsir"),
          )}
          <View>
            {action("more", t("ayah.more"), () => setMoreOpen(true), false, t("ayah.more"))}
            {copied && (
              <View style={styles.copiedBubble} pointerEvents="none">
                <Text style={styles.copiedText}>{t("rd.copied")}</Text>
              </View>
            )}
          </View>
          <Modal
            visible={moreOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setMoreOpen(false)}
          >
            <Pressable style={styles.scrim} onPress={() => setMoreOpen(false)}>
              <View style={styles.sheet} accessibilityViewIsModal>
                {(
                  [
                    ["share", t("ayah.share"), () => void share()],
                    ["layers", t("ayah.copyVerse"), () => void copyVerse()],
                    [
                      "star",
                      memorized ? t("ayah.stopMemorize") : t("ayah.memorize"),
                      () =>
                        memorized ? removeHifzCard(ref) : setHifzCard(ref, createCard(new Date())),
                    ],
                  ] as const
                ).map(([icon, label, run]) => (
                  <ListRow
                    key={icon}
                    divider
                    script={script}
                    leading={<Icon name={icon} size={20} color={colors.accent} sw={1.8} />}
                    title={label}
                    onPress={() => {
                      setMoreOpen(false);
                      run();
                    }}
                  />
                ))}
              </View>
            </Pressable>
          </Modal>
        </>
      }
      footer={<AyahTafsir sura={sura} aya={aya} open={tafsirOpen} />}
    />
  );
}

export const AyahView = memo(AyahViewImpl);

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
/** Āyah numbers in the marker use Arabic-Indic digits in every language, as on web. */
function toArabicDigits(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => ARABIC_DIGITS[Number(d)]!);
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    // Icon beside its word, as in the web reader's action row (ADR 0042).
    act: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
      borderRadius: 12,
      gap: 6,
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
    scrim: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
    sheet: {
      backgroundColor: c.bgElev,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 8,
      paddingBottom: 28,
      paddingHorizontal: 8,
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
    // ﴿n﴾ marker: accent, in the Quran face's companion (as web pins Amiri).
    marker: { color: c.accent, fontFamily: FONT.arQuran },
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
    // Equal emphasis by default; "softer" (Reading comfort) quiets it to muted.
  });
}

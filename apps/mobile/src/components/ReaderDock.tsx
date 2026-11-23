import { useMemo, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "../Type";
import type { VerseKey } from "@ummahlibrary/core";
import { Icon } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import type { SurahAudio } from "../audio/useSurahAudio";
import { LabelButton } from "./LabelButton";
import { AudioRangeControls } from "./AudioRangeControls";
import { useIntl } from "../i18n/I18nProvider";

/**
 * The surah reader's bottom dock (ADR 0041) — the web reader's `ReadingAudio`
 * "dock" variant. It sits *below* the verse list in the screen's column
 * layout, so nothing ever floats over the Quran text: the Back-to chip, the
 * reading-plan chip, the Recite tray and the audio options all stack above the
 * main row, inside the dock. Every control carries a visible word.
 */
export function ReaderDock({
  audio,
  verses,
  surah,
  reciterName,
  positionLabel,
  startVerse,
  trailing,
  above,
}: {
  audio: SurahAudio;
  verses: VerseKey[];
  surah: number;
  reciterName: string;
  /** "Āyah 10 of 110 · Juz 15" — shown while not playing. */
  positionLabel: string;
  /** Where ▶ starts: the āyah the reader is on. */
  startVerse: () => VerseKey | null;
  /** Extra labelled buttons in the main row (e.g. Recite). */
  trailing?: ReactNode;
  /** Rows stacked above the main row (Back to, plan chip, Recite tray). */
  above?: ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, tf } = useIntl();
  const [showOptions, setShowOptions] = useState(false);

  const playing = audio.playingKey !== null;
  const allSaved = audio.savedSurahs.has(surah);
  const dl = audio.downloadProgress;
  const dlPct = dl ? Math.round((dl.done / Math.max(1, dl.total)) * 100) : 0;
  const pos = playing ? verses.findIndex((v) => `${v.sura}:${v.aya}` === audio.playingKey) : -1;
  const pct = pos >= 0 && verses.length > 0 ? ((pos + 1) / verses.length) * 100 : 0;
  const playingAya = audio.playingKey ? Number(audio.playingKey.split(":")[1]) : null;

  const toggle = () => {
    if (playing) {
      audio.stop();
      return;
    }
    const start = startVerse() ?? verses[0];
    if (start) audio.playFrom(verses, start, true);
  };

  const status = playing
    ? audio.buffering
      ? t("rd.loading")
      : playingAya
        ? tf("rd.dock.playing", { reciter: reciterName, n: playingAya })
        : reciterName
    : positionLabel;

  return (
    <View style={styles.dock}>
      {above}
      {showOptions && (
        <View style={styles.options}>
          <AudioRangeControls audio={audio} verses={verses} />
          <View style={styles.optRow}>
            <LabelButton
              icon="repeat"
              label={t("rd.dock.repeatSurah")}
              active={audio.loop}
              onPress={() => audio.setLoop(!audio.loop)}
              accessibilityRole="switch"
            />
            <LabelButton
              icon={allSaved ? "check" : "download"}
              label={
                allSaved
                  ? t("rd.dock.savedOffline")
                  : dl
                    ? tf("rd.dock.saving", { pct: dlPct })
                    : audio.downloadError
                      ? t("rd.dock.retrySave")
                      : t("rd.dock.saveOffline")
              }
              active={allSaved}
              disabled={dl !== null || allSaved}
              onPress={() => audio.downloadSurahs([surah])}
            >
              {dl ? <ActivityIndicator size="small" color={colors.accent} /> : undefined}
            </LabelButton>
          </View>
        </View>
      )}
      <View style={styles.row}>
        <Pressable
          style={styles.play}
          onPress={toggle}
          accessibilityRole="button"
          accessibilityLabel={playing ? t("rd.dock.pauseA11y") : t("rd.dock.playA11y")}
        >
          <Icon name={playing ? "pause" : "play"} size={20} color={colors.ink} />
        </Pressable>
        <Pressable style={styles.info} onPress={toggle} accessible={false}>
          <Text style={styles.infoTitle}>
            {playing ? t("rd.dock.listening") : t("rd.dock.listen")}
          </Text>
          <Text style={styles.infoSub} numberOfLines={1}>
            {status}
          </Text>
          {playing && (
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct}%` }]} />
            </View>
          )}
        </Pressable>
        {trailing}
        <LabelButton
          icon="settings"
          label={t("rd.dock.options")}
          active={showOptions}
          onPress={() => setShowOptions((v) => !v)}
          accessibilityLabel={showOptions ? t("rd.dock.optionsHideA11y") : t("rd.dock.optionsA11y")}
        />
      </View>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    dock: {
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.bgElev,
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 8,
      gap: 8,
    },
    options: { gap: 8 },
    optRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    row: { flexDirection: "row", alignItems: "center", gap: 8 },
    play: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    info: { flex: 1, minWidth: 0, minHeight: 48, justifyContent: "center" },
    infoTitle: { color: c.fg, fontSize: 15, fontFamily: FONT.bold },
    infoSub: { color: c.muted, fontSize: 13.5, fontFamily: FONT.medium },
    track: { height: 3, borderRadius: 2, backgroundColor: c.border, marginTop: 5 },
    fill: { height: "100%", borderRadius: 2, backgroundColor: c.accent },
  });
}

/** One row above the dock's main row: Back to · Dismiss. */
export function BackToRow({
  label,
  onBack,
  onDismiss,
}: {
  label: string;
  onBack: () => void;
  onDismiss: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeBackStyles(colors), [colors]);
  const { t, dir } = useIntl();
  return (
    <View style={styles.row}>
      <Pressable
        style={styles.back}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Icon name={dir === "rtl" ? "arrowR" : "arrowL"} size={18} color={colors.fg} />
        <Text style={styles.backText}>{label}</Text>
      </Pressable>
      <Pressable
        style={styles.dismiss}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={t("rd.dismiss")}
      >
        <Text style={styles.dismissText}>{t("rd.dismiss")}</Text>
      </Pressable>
    </View>
  );
}

function makeBackStyles(c: Palette) {
  return StyleSheet.create({
    row: { flexDirection: "row", gap: 8 },
    back: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minHeight: 48,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.accent,
      backgroundColor: c.accentSoft,
    },
    backText: { color: c.fg, fontSize: 15, fontFamily: FONT.bold },
    dismiss: {
      minHeight: 48,
      justifyContent: "center",
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    dismissText: { color: c.fg, fontSize: 14, fontFamily: FONT.semibold },
  });
}

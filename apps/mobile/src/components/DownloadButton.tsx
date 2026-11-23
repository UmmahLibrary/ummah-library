/**
 * Offline download button (#202) for the audio dock — shared by the surah and
 * juzʾ readers. Downloads every listed surah's audio for the current reciter via
 * {@link useSurahAudio}'s `downloadSurahs`, showing progress while in flight and a
 * checkmark once every listed surah is fully saved.
 */
import { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "../Type";
import { Icon } from "@ummahlibrary/ui";
import type { Palette } from "../theme";
import type { SurahAudio } from "../audio/useSurahAudio";
import { useIntl } from "../i18n/I18nProvider";

export function DownloadButton({
  audio,
  surahs,
  colors,
}: {
  audio: SurahAudio;
  surahs: number[];
  colors: Palette;
}) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, tf } = useIntl();
  if (surahs.length === 0) return null;

  const allSaved = surahs.every((s) => audio.savedSurahs.has(s));
  const pct = audio.downloadProgress
    ? Math.round((audio.downloadProgress.done / Math.max(1, audio.downloadProgress.total)) * 100)
    : 0;
  const label = audio.downloadProgress
    ? tf("rd.dl.progress", { pct })
    : allSaved
      ? t("rd.dl.saved")
      : audio.downloadError
        ? t("rd.dl.failed")
        : t("rd.dl.download");

  return (
    <Pressable
      onPress={() => audio.downloadSurahs(surahs)}
      disabled={audio.downloadProgress !== null || allSaved}
      // 19px icon + hitSlop reaches the 44×44dp minimum touch target.
      hitSlop={13}
      accessibilityLabel={label}
      style={styles.btn}
    >
      {audio.downloadProgress ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : (
        <Icon
          name={allSaved ? "check" : "download"}
          size={19}
          color={allSaved ? colors.accent : colors.muted}
          sw={1.8}
        />
      )}
      {audio.downloadProgress && <Text style={styles.pct}>{tf("rd.pct", { pct })}</Text>}
    </Pressable>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    btn: { flexDirection: "row", alignItems: "center", gap: 4 },
    pct: { color: c.accent, fontSize: 12, fontWeight: "700" },
  });
}

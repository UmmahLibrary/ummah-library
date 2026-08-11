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
  if (surahs.length === 0) return null;

  const allSaved = surahs.every((s) => audio.savedSurahs.has(s));
  const pct = audio.downloadProgress
    ? Math.round((audio.downloadProgress.done / Math.max(1, audio.downloadProgress.total)) * 100)
    : 0;
  const label = audio.downloadProgress
    ? `Downloading ${pct}%`
    : allSaved
      ? "Saved for offline listening"
      : "Download for offline listening";

  return (
    <Pressable
      onPress={() => audio.downloadSurahs(surahs)}
      disabled={audio.downloadProgress !== null || allSaved}
      hitSlop={8}
      accessibilityLabel={label}
      style={styles.btn}
    >
      {audio.downloadProgress ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : (
        <Icon name={allSaved ? "check" : "download"} size={19} color={allSaved ? colors.accent : colors.muted} sw={1.8} />
      )}
      {audio.downloadProgress && <Text style={styles.pct}>{pct}%</Text>}
    </Pressable>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    btn: { flexDirection: "row", alignItems: "center", gap: 4 },
    pct: { color: c.accent, fontSize: 12, fontWeight: "700" },
  });
}

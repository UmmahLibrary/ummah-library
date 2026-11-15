import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "../Type";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useSettings } from "../state/SettingsContext";
import { targetSize } from "../comfort";
import { LabelButton } from "./LabelButton";
import { useT } from "../i18n/I18nProvider";

interface TrayProps {
  hideTr: boolean;
  onPeekWord: () => void;
  onRevealAyah: () => void;
  onShowAll: () => void;
  onHideAll: () => void;
  onToggleTr: () => void;
}

/** The labelled Recite on/off button (lives in the reader's bottom dock). */
export function ReciteToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const t = useT();
  return (
    <LabelButton
      icon="eye"
      label={t("rd.recite")}
      active={on}
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityLabel={on ? t("rd.recite.onA11y") : t("rd.recite.offA11y")}
    />
  );
}

/** Recitation-testing controls shown while Recite is on (#134). */
export function ReciteTray({
  hideTr,
  onPeekWord,
  onRevealAyah,
  onShowAll,
  onHideAll,
  onToggleTr,
}: TrayProps) {
  const { colors } = useTheme();
  const t = useT();
  const { comfort } = useSettings();
  const min = targetSize(comfort);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const ctl = (label: string, onPress: () => void, active = false, a11y?: string) => (
    <Pressable
      key={label}
      style={[styles.ctl, { minHeight: min }, active && styles.ctlOn]}
      onPress={onPress}
      accessibilityRole={a11y ? "switch" : "button"}
      accessibilityState={a11y ? { checked: active } : undefined}
      accessibilityLabel={a11y ?? label}
    >
      <Text style={[styles.ctlText, active && styles.ctlTextOn]}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={styles.tray}>
      {ctl(t("rd.recite.peekWord"), onPeekWord)}
      {ctl(t("rd.recite.revealAyah"), onRevealAyah)}
      {ctl(t("rd.recite.showAll"), onShowAll)}
      {ctl(t("rd.recite.hideAll"), onHideAll)}
      {ctl(t("rd.recite.hideTr"), onToggleTr, hideTr, t("rd.recite.hideTr"))}
    </View>
  );
}

/**
 * Recite — hide & peek controls (#134) for an inline placement (the juzʾ
 * reader): the labelled Recite button, and the tray beneath it while on. The
 * surah reader places the two pieces in its bottom dock instead. State lives
 * in the screen — this is presentation only.
 */
export function MemorizeBar({
  on,
  onToggle,
  ...tray
}: TrayProps & { on: boolean; onToggle: () => void }) {
  return (
    <View style={{ gap: 8, alignItems: "flex-start" }}>
      <ReciteToggle on={on} onToggle={onToggle} />
      {on && <ReciteTray {...tray} />}
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    tray: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
      alignSelf: "stretch",
    },
    ctl: {
      justifyContent: "center",
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bg,
    },
    ctlOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    ctlText: { color: c.fg, fontSize: 14, fontFamily: FONT.semibold },
    ctlTextOn: { fontFamily: FONT.bold },
  });
}

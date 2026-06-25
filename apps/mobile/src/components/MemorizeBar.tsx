import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "../Type";
import { Icon } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";

/**
 * Recite — hide & peek controls (#134) for the mobile readers. Collapsed it
 * is a single "Recite" pill; expanded it reveals the recitation testing
 * controls. State lives in the screen — this is the presentation only, so the
 * surah and juzʾ readers share one bar.
 */
export function MemorizeBar({
  on,
  hideTr,
  onToggle,
  onPeekWord,
  onRevealAyah,
  onShowAll,
  onHideAll,
  onToggleTr,
}: {
  on: boolean;
  hideTr: boolean;
  onToggle: () => void;
  onPeekWord: () => void;
  onRevealAyah: () => void;
  onShowAll: () => void;
  onHideAll: () => void;
  onToggleTr: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!on) {
    return (
      <Pressable style={styles.pill} onPress={onToggle} accessibilityLabel="Recite mode">
        <Icon name="eye" size={15} color={colors.accent} />
        <Text style={styles.pillText}>Recite</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.tray}>
      <View style={styles.row}>
        <Pressable
          style={[styles.pill, styles.pillOn]}
          onPress={onToggle}
          accessibilityLabel="Exit recite mode"
        >
          <Icon name="eye" size={15} color={colors.ink} />
          <Text style={[styles.pillText, styles.pillTextOn]}>Recite</Text>
        </Pressable>
        <Pressable
          style={[styles.ctl, hideTr && styles.ctlOn]}
          onPress={onToggleTr}
          accessibilityLabel="Hide translation"
        >
          <Text style={[styles.ctlText, hideTr && styles.ctlTextOn]}>Translation</Text>
        </Pressable>
      </View>
      <View style={styles.row}>
        <Ctl styles={styles} label="Peek word" onPress={onPeekWord} />
        <Ctl styles={styles} label="Reveal āyah" onPress={onRevealAyah} />
        <Ctl styles={styles} label="Show all" onPress={onShowAll} />
        <Ctl styles={styles} label="Hide all" onPress={onHideAll} />
      </View>
    </View>
  );
}

function Ctl({
  styles,
  label,
  onPress,
}: {
  styles: ReturnType<typeof makeStyles>;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.ctl} onPress={onPress}>
      <Text style={styles.ctlText}>{label}</Text>
    </Pressable>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      alignSelf: "flex-start",
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    pillOn: { borderColor: c.accent, backgroundColor: c.accent },
    pillText: { color: c.accent, fontSize: 13.5, fontWeight: "700" },
    pillTextOn: { color: c.ink },
    tray: {
      gap: 8,
      padding: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    row: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
    ctl: {
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bg,
    },
    ctlOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    ctlText: { color: c.fg, fontSize: 13, fontWeight: "600" },
    ctlTextOn: { color: c.accent },
  });
}

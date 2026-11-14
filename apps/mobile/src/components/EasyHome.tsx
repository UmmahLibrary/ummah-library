import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import type { Surah } from "@ummahlibrary/core";
import { Icon, type IconName } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useSettings } from "../state/SettingsContext";
import { HoldButton } from "./HoldButton";

/**
 * Easy mode Home (ADR 0041), after Apple's Assistive Access: three large,
 * labelled tiles — Continue, Listen, Choose a surah — and nothing else to
 * decide. Targets are 64dp+. Leaving is a deliberate press-and-hold.
 */
export function EasyHome({
  surahs,
  lastRead,
  lastReadAya,
  nextPrayer,
  onRead,
  onListen,
  onChoose,
}: {
  surahs: readonly Surah[] | null;
  lastRead: number | null;
  lastReadAya: number | null;
  /** "Maghrib at 4:52 PM", when a location is saved. */
  nextPrayer: string | null;
  onRead: (sura: number, aya?: number) => void;
  onListen: (sura: number, aya?: number) => void;
  onChoose: () => void;
}) {
  const { colors } = useTheme();
  const { setComfort } = useSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const surah = lastRead != null ? surahs?.find((s) => s.number === lastRead) : undefined;
  const aya = lastReadAya ?? 1;

  const tile = (icon: IconName, title: string, sub: string, onPress: () => void) => (
    <Pressable
      key={title}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${sub}`}
    >
      <View style={styles.ic}>
        <Icon name={icon} size={30} color={colors.accent} sw={1.8} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.tileTitle}>{title}</Text>
        <Text style={styles.tileSub}>{sub}</Text>
      </View>
    </Pressable>
  );

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.hello} accessibilityRole="header">
        As-salāmu ʿalaykum
      </Text>
      {nextPrayer && <Text style={styles.prayer}>Next prayer: {nextPrayer}</Text>}
      {tile(
        "book",
        surah ? "Continue" : "Read",
        surah ? `${surah.transliteration} · āyah ${aya}` : "Al-Fātiḥah",
        () => (surah ? onRead(surah.number, aya) : onRead(1)),
      )}
      {tile("headphones", "Listen", "Recitation with translation", () =>
        surah ? onListen(surah.number, aya) : onListen(1),
      )}
      {tile("grid", "Choose a surah", "All 114, in a big list", onChoose)}
      <View style={styles.leave}>
        <HoldButton
          label="Hold to leave Easy mode"
          onHold={() => setComfort({ mode: "standard" })}
        />
      </View>
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    body: { paddingHorizontal: 20, paddingBottom: 32, gap: 16 },
    hello: { color: c.fg, fontSize: 28, fontFamily: FONT.extrabold },
    prayer: { color: c.fg, fontSize: 19 },
    tile: {
      flexDirection: "row",
      alignItems: "center",
      gap: 18,
      minHeight: 96,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    pressed: { opacity: 0.8, borderColor: c.accent },
    ic: {
      width: 64,
      height: 64,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.accentSoft,
    },
    tileTitle: { color: c.fg, fontSize: 24, fontFamily: FONT.extrabold },
    tileSub: { color: c.muted, fontSize: 17, marginTop: 2 },
    leave: { marginTop: 12 },
  });
}

import { StyleSheet, Text, View } from "../Type";
import { Khatam } from "@ummahlibrary/ui";
import { useTheme } from "../theme";
import { FONT } from "../fonts";

/**
 * The Noor signature number badge: a dim-gold khatam star with the surah/āyah
 * number centred in gold. Used for surah and āyah numbers across the app
 * (matches the mobile design's `AyahBadge`).
 *
 * `maxFontSizeMultiplier` caps how far the number grows with the OS's
 * accessibility text-scale setting — at the full multiplier (measured up to
 * 2x on Android) the number overflows this fixed-size decorative badge. The
 * number is a secondary ordinal marker (the surah/āyah's real name/text sits
 * next to it and scales freely); capping it keeps the badge intact while
 * still growing the number somewhat rather than freezing it at 1x.
 */
export function AyahBadge({ n, size = 40 }: { n: number | string; size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Khatam size={size} color={colors.accent} sw={1.2} opacity={0.55} />
      <Text
        style={[styles.num, { fontSize: size * 0.32, color: colors.accent }]}
        maxFontSizeMultiplier={1.3}
      >
        {n}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", flexShrink: 0 },
  num: { position: "absolute", fontFamily: FONT.bold },
});

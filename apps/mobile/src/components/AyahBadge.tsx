import { StyleSheet, Text, View } from "../Type";
import { Khatam } from "@ummahlibrary/ui";
import { useTheme } from "../theme";
import { FONT } from "../fonts";

/**
 * The Noor signature number badge: a dim-gold khatam star with the surah/āyah
 * number centred in gold. Used for surah and āyah numbers across the app
 * (matches the mobile design's `AyahBadge`).
 */
export function AyahBadge({ n, size = 40 }: { n: number | string; size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Khatam size={size} color={colors.accent} sw={1.2} opacity={0.55} />
      <Text style={[styles.num, { fontSize: size * 0.32, color: colors.accent }]}>{n}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", flexShrink: 0 },
  num: { position: "absolute", fontFamily: FONT.bold },
});

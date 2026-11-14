import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "../Type";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useSettings } from "../state/SettingsContext";
import { targetSize } from "../comfort";

/** How long the press must be held (ms). */
export const HOLD_MS = 2000;

/**
 * A deliberate press-and-hold (ADR 0041) — used to leave Easy mode so a stray
 * tap can't. A bar fills while held (a static "Keep holding…" with Reduce
 * motion); letting go early cancels.
 */
export function HoldButton({ label, onHold }: { label: string; onHold: () => void }) {
  const { colors } = useTheme();
  const { comfort } = useSettings();
  const min = targetSize(comfort);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const progress = useRef(new Animated.Value(0)).current;
  const [holding, setHolding] = useState(false);

  useEffect(() => () => progress.stopAnimation(), [progress]);

  const start = () => {
    setHolding(true);
    if (comfort.reduceMotion) return;
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: HOLD_MS, useNativeDriver: false }).start();
  };
  const cancel = () => {
    setHolding(false);
    progress.stopAnimation();
    progress.setValue(0);
  };

  return (
    <Pressable
      style={[styles.btn, { minHeight: min }]}
      onPressIn={start}
      onPressOut={cancel}
      delayLongPress={HOLD_MS}
      onLongPress={() => {
        cancel();
        onHold();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Press and hold for two seconds"
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View
          style={[
            styles.fill,
            {
              width: progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
            },
          ]}
        />
      </View>
      <Text style={styles.text}>{holding ? "Keep holding…" : label}</Text>
    </Pressable>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    btn: {
      justifyContent: "center",
      alignSelf: "flex-start",
      paddingHorizontal: 18,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
      overflow: "hidden",
    },
    fill: { height: "100%", backgroundColor: c.accentSoft },
    text: { color: c.fg, fontSize: 16, fontFamily: FONT.semibold },
  });
}

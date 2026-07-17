import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "../Type";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Khatam } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "NotFound">;

/** Shown for any URL/deep link that doesn't match a known route (#246). */
export function NotFoundScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.screen}>
      <Khatam size={72} color={colors.accent} sw={1.1} opacity={0.5} />
      <Text style={styles.title}>Page not found</Text>
      <Text style={styles.body}>Couldn’t find what you were looking for.</Text>
      <Pressable style={styles.btn} onPress={() => navigation.navigate("Tabs", { screen: "Home" })}>
        <Text style={styles.btnText}>Go to Today</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24, backgroundColor: c.bg },
    title: { color: c.fg, fontSize: 20, fontFamily: FONT.bold, marginTop: 8 },
    body: { color: c.muted, fontSize: 14.5, textAlign: "center" },
    btn: {
      marginTop: 10,
      paddingVertical: 12,
      paddingHorizontal: 22,
      borderRadius: 11,
      backgroundColor: c.accent,
    },
    btnText: { color: c.ink, fontSize: 15, fontFamily: FONT.bold },
  });
}

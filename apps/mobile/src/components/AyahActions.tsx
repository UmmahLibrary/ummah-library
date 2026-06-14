import { useMemo, useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "../Type";
import * as Clipboard from "expo-clipboard";
import { useTheme, type Palette } from "../theme";

/**
 * Per-ayah actions: copy the ayah (Arabic + visible translations), copy a deep
 * link to the web reader, and the OS share sheet. Mirrors the web AyahActions.
 */
export function AyahActions({
  sura,
  aya,
  arabic,
  translations,
}: {
  sura: number;
  aya: number;
  arabic: string;
  translations: string[];
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [copied, setCopied] = useState<"text" | "link" | null>(null);

  const blockText = [arabic, ...translations, `— ${sura}:${aya}`].filter(Boolean).join("\n");
  const link = `https://app.ummahlibrary.org/surah/${sura}#${sura}:${aya}`;

  function flash(which: "text" | "link") {
    setCopied(which);
    setTimeout(() => setCopied(null), 1200);
  }

  async function copyText() {
    await Clipboard.setStringAsync(blockText);
    flash("text");
  }

  async function copyLink() {
    await Clipboard.setStringAsync(link);
    flash("link");
  }

  return (
    <View style={styles.row}>
      <Pressable style={styles.btn} onPress={copyText}>
        <Text style={styles.btnText}>{copied === "text" ? "Copied ✓" : "Copy"}</Text>
      </Pressable>
      <Pressable style={styles.btn} onPress={copyLink}>
        <Text style={styles.btnText}>{copied === "link" ? "Link ✓" : "🔗 Link"}</Text>
      </Pressable>
      <Pressable
        style={styles.btn}
        onPress={() => Share.share({ message: `${blockText}\n${link}` })}
      >
        <Text style={styles.btnText}>↗ Share</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
    btn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    btnText: { color: c.muted, fontSize: 13 },
  });
}

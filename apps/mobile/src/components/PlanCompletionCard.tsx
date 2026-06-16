import { useMemo } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "../Type";
import { Khatam, Icon } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { type ActivePlan, PLAN_TEMPLATES, planDuration, totalUnits, unitWord } from "../plans";

/**
 * Completion milestone for a finished plan (#63), mirroring the web card: a
 * celebration, a text share (mobile has no canvas, so the image card is
 * web-only), and a nudge to begin the next journey.
 */
export function PlanCompletionCard({
  plan,
  onStart,
}: {
  plan: ActivePlan;
  onStart: (templateId: string) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const unit = plan.template.range.unit;
  const total = totalUnits(plan.template.range);
  const days = planDuration(plan);
  const name = plan.template.name;
  const suggestions = PLAN_TEMPLATES.filter((t) => t.id !== plan.template.id).slice(0, 2);

  function share() {
    void Share.share({
      message: `${name} complete — ${total} ${unitWord(unit, total)} over ${days} days. Alhamdulillah. · Ummah Library`,
    });
  }

  return (
    <View style={styles.card}>
      <View style={styles.crest}>
        <Khatam size={72} color={colors.accent} sw={1} opacity={0.85} />
      </View>
      <Text style={styles.kicker}>Plan complete</Text>
      <Text style={styles.title}>Alhamdulillah — you finished {name}</Text>
      <Text style={styles.sub}>
        {total} {unitWord(unit, total)} over {days} {days === 1 ? "day" : "days"}. May Allah accept it.
      </Text>

      <Pressable style={styles.shareBtn} onPress={share}>
        <Icon name="share" size={15} color={colors.ink} sw={1.8} />
        <Text style={styles.shareText}>Share your achievement</Text>
      </Pressable>

      {suggestions.length > 0 && (
        <View style={styles.next}>
          <Text style={styles.nextLabel}>Begin a new journey</Text>
          <View style={styles.suggestions}>
            {suggestions.map((t) => (
              <Pressable key={t.id} style={styles.suggestion} onPress={() => onStart(t.id)}>
                <Text style={styles.suggestionName}>{t.name}</Text>
                <Text style={styles.suggestionMeta}>
                  {t.tag} · {t.len}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    card: {
      borderRadius: 18,
      padding: 22,
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.accent,
      backgroundColor: c.accentSoft,
    },
    crest: { marginBottom: 2 },
    kicker: {
      color: c.accent,
      fontSize: 11,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      fontFamily: FONT.extrabold,
    },
    title: { color: c.fg, fontSize: 19, fontFamily: FONT.extrabold, textAlign: "center", marginTop: 6, letterSpacing: -0.3 },
    sub: { color: c.muted, fontSize: 13.5, textAlign: "center", marginTop: 8, lineHeight: 20 },
    shareBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 18,
      paddingVertical: 11,
      paddingHorizontal: 18,
      borderRadius: 11,
      backgroundColor: c.accent,
    },
    shareText: { color: c.ink, fontSize: 13.5, fontFamily: FONT.bold },
    next: { marginTop: 22, alignSelf: "stretch" },
    nextLabel: {
      color: c.faint,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      fontFamily: FONT.bold,
      textAlign: "center",
    },
    suggestions: { flexDirection: "row", gap: 10, marginTop: 12, justifyContent: "center", flexWrap: "wrap" },
    suggestion: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    suggestionName: { color: c.fg, fontSize: 13, fontFamily: FONT.bold },
    suggestionMeta: { color: c.faint, fontSize: 11, marginTop: 2 },
  });
}

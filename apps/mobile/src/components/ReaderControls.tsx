import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { RECITERS } from "../plugins";
import { useSettings } from "../state/SettingsContext";
import { targetSize } from "../comfort";
import type { ReadingMode } from "../types";
import { LabelButton } from "./LabelButton";
import { SizeControls } from "./SizeControls";

const MODES: { mode: ReadingMode; label: string }[] = [
  { mode: "translation", label: "Verse by verse" },
  { mode: "reading", label: "Reading" },
  { mode: "reading-tr", label: "Translation" },
];

/**
 * The reader's tool row (ADR 0041): every control is an icon with a word —
 * Text (sizes + transliteration), Reciter, Translation, Save — then the reading
 * modes spelled out in full. 48dp+ targets, labels ≥ 13sp in fg/muted.
 */
export function ReaderControls({
  mode,
  onMode,
  transliteration,
  onTransliteration,
  wordTransliteration,
  onWordTransliteration,
  tapToHear,
  onTapToHear,
  onManage,
  reciterId,
  onReciter,
  saved,
  onSave,
}: {
  mode: ReadingMode;
  onMode: (m: ReadingMode) => void;
  transliteration: boolean;
  onTransliteration: (on: boolean) => void;
  wordTransliteration: boolean;
  onWordTransliteration: (on: boolean) => void;
  tapToHear: boolean;
  onTapToHear: (on: boolean) => void;
  onManage: () => void;
  reciterId: string;
  onReciter: (id: string) => void;
  saved: boolean;
  onSave: () => void;
}) {
  const { colors } = useTheme();
  const { comfort } = useSettings();
  const min = targetSize(comfort);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [textOpen, setTextOpen] = useState(false);
  const [reciterOpen, setReciterOpen] = useState(false);

  const switchRow = (label: string, note: string, on: boolean, set: (v: boolean) => void) => (
    <Pressable
      key={label}
      style={[styles.switchRow, { minHeight: min }]}
      onPress={() => set(!on)}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.switchTitle}>{label}</Text>
        <Text style={styles.switchNote}>{note}</Text>
      </View>
      <View style={[styles.knobTrack, on && styles.knobTrackOn]}>
        <View style={[styles.knob, on && styles.knobOn]} />
      </View>
    </Pressable>
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.tools}>
        <LabelButton
          icon="type"
          label="Text"
          active={textOpen}
          onPress={() => setTextOpen((v) => !v)}
          accessibilityLabel={textOpen ? "Hide text settings" : "Text size and transliteration"}
          style={styles.tool}
        />
        <LabelButton
          icon="headphones"
          label="Reciter"
          onPress={() => setReciterOpen(true)}
          accessibilityLabel="Choose reciter"
          style={styles.tool}
        />
        <LabelButton
          icon="globe"
          label="Translation"
          onPress={onManage}
          accessibilityLabel="Choose translations"
          style={styles.tool}
        />
        <LabelButton
          icon="bookmark"
          label={saved ? "Saved" : "Save"}
          active={saved}
          onPress={onSave}
          accessibilityLabel={saved ? "Saved — remove bookmark" : "Bookmark this surah"}
          style={styles.tool}
        />
      </View>

      {textOpen && (
        <View style={styles.panel}>
          <SizeControls sample={false} />
          {switchRow(
            "Transliteration",
            "The Arabic sounds in Latin letters under each āyah",
            transliteration,
            onTransliteration,
          )}
          {switchRow(
            "Word by word",
            "Latin reading under every Arabic word",
            wordTransliteration,
            onWordTransliteration,
          )}
          {switchRow("Tap a word to hear it", "Plays just that word", tapToHear, onTapToHear)}
        </View>
      )}

      <View style={styles.segment} accessibilityRole="tablist">
        {MODES.map(({ mode: m, label }) => (
          <Pressable
            key={m}
            style={[styles.segItem, { minHeight: min }, m === mode && styles.segItemOn]}
            onPress={() => onMode(m)}
            accessibilityRole="tab"
            accessibilityState={{ selected: m === mode }}
          >
            <Text style={[styles.segText, m === mode && styles.segTextOn]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Modal
        visible={reciterOpen}
        transparent
        animationType={comfort.reduceMotion ? "none" : "fade"}
        onRequestClose={() => setReciterOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setReciterOpen(false)}
          accessibilityLabel="Close"
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle} accessibilityRole="header">
              Reciter
            </Text>
            <ScrollView style={{ maxHeight: 420 }}>
              {RECITERS.map((r) => {
                const on = r.id === reciterId;
                return (
                  <Pressable
                    key={r.id}
                    style={[styles.pick, { minHeight: Math.max(56, min) }, on && styles.pickOn]}
                    onPress={() => {
                      onReciter(r.id);
                      setReciterOpen(false);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                  >
                    <View style={[styles.radio, on && styles.radioOn]}>
                      {on && <View style={styles.radioDot} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickText}>{r.name}</Text>
                      <Text style={styles.pickSub}>{r.style}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable
              style={[styles.done, { minHeight: min }]}
              onPress={() => setReciterOpen(false)}
              accessibilityRole="button"
            >
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    wrap: { gap: 10, marginBottom: 14 },
    tools: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between" },
    tool: { flexGrow: 1 },
    panel: {
      gap: 6,
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElev,
    },
    switchRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
    switchTitle: { color: c.fg, fontSize: 15, fontFamily: FONT.semibold },
    switchNote: { color: c.muted, fontSize: 13 },
    knobTrack: {
      width: 46,
      height: 28,
      borderRadius: 14,
      padding: 3,
      backgroundColor: c.border,
      justifyContent: "center",
    },
    knobTrackOn: { backgroundColor: c.accent },
    knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: c.bg },
    knobOn: { alignSelf: "flex-end", backgroundColor: c.ink },
    segment: {
      flexDirection: "row",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden",
    },
    segItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
      backgroundColor: c.bg,
    },
    segItemOn: { backgroundColor: c.accentSoft },
    segText: { color: c.muted, fontSize: 14, fontFamily: FONT.semibold },
    segTextOn: { color: c.fg, fontFamily: FONT.bold },
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      padding: 20,
    },
    sheet: {
      backgroundColor: c.bgElev,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      gap: 8,
    },
    sheetTitle: { color: c.fg, fontSize: 19, fontFamily: FONT.extrabold, marginBottom: 4 },
    pick: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
    pickOn: { backgroundColor: c.accentSoft },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: c.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    radioOn: { borderColor: c.accent },
    radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: c.accent },
    pickText: { color: c.fg, fontSize: 15.5, fontFamily: FONT.semibold },
    pickSub: { color: c.muted, fontSize: 13 },
    done: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      marginTop: 4,
    },
    doneText: { color: c.fg, fontSize: 15, fontFamily: FONT.bold },
  });
}

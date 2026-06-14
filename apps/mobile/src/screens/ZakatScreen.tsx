import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from "../Type";
import {
  type NisabBasis,
  ZAKAT_ASSET_CATEGORIES,
  calculateZakat,
} from "@ummahlibrary/core";
import { Khatam } from "@ummahlibrary/ui";
import { KEYS, getJSON, setJSON } from "../storage";
import { FONT } from "../fonts";
import { useTheme, type Palette } from "../theme";

interface ZakatState {
  currency: string;
  goldPricePerGram: string;
  silverPricePerGram: string;
  nisabBasis: NisabBasis;
  assets: Record<string, string>;
  liabilities: string;
}

const EMPTY_ASSETS = Object.fromEntries(ZAKAT_ASSET_CATEGORIES.map((c) => [c.id, ""]));

const DEFAULT: ZakatState = {
  currency: "$",
  goldPricePerGram: "",
  silverPricePerGram: "",
  nisabBasis: "silver",
  assets: { ...EMPTY_ASSETS },
  liabilities: "",
};

function toNum(s: string): number {
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function ZakatScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [state, setState] = useState<ZakatState>(DEFAULT);

  useEffect(() => {
    void getJSON<Partial<ZakatState>>(KEYS.zakat, {}).then((saved) => {
      setState({
        ...DEFAULT,
        ...saved,
        assets: { ...EMPTY_ASSETS, ...(saved.assets ?? {}) },
      });
    });
  }, []);

  function update(patch: Partial<ZakatState>) {
    setState((prev) => {
      const next = { ...prev, ...patch };
      void setJSON(KEYS.zakat, next);
      return next;
    });
  }

  function setAsset(id: string, value: string) {
    update({ assets: { ...state.assets, [id]: value } });
  }

  const result = useMemo(
    () =>
      calculateZakat({
        assets: Object.fromEntries(ZAKAT_ASSET_CATEGORIES.map((c) => [c.id, toNum(state.assets[c.id] ?? "")])),
        liabilities: toNum(state.liabilities),
        nisabBasis: state.nisabBasis,
        goldPricePerGram: toNum(state.goldPricePerGram),
        silverPricePerGram: toNum(state.silverPricePerGram),
      }),
    [state],
  );

  const havePrices = toNum(state.goldPricePerGram) > 0 && toNum(state.silverPricePerGram) > 0;

  function money(n: number) {
    return `${state.currency}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.screen}>
        <View style={styles.hero}>
          <View style={styles.heroWatermark} pointerEvents="none">
            <Khatam size={150} color={colors.accent} sw={1.1} opacity={0.08} />
          </View>
          <Text style={styles.heroLabel}>Zakat due (2.5%)</Text>
          <Text style={styles.heroValue}>{havePrices ? money(result.zakatDue) : "—"}</Text>
          <Text style={styles.heroNote}>
            {!havePrices
              ? "Enter the current gold and silver prices to set the niṣāb."
              : result.meetsNisab
                ? `Net wealth ${money(result.netWealth)} is above the ${state.nisabBasis} niṣāb.`
                : `Net wealth ${money(result.netWealth)} is below the ${state.nisabBasis} niṣāb — no zakat due.`}
          </Text>
          <View style={styles.heroDivider} />
          <SummaryItem label="Total assets" value={money(result.totalAssets)} colors={colors} />
          <SummaryItem label="Net wealth" value={money(result.netWealth)} colors={colors} strong />
          <SummaryItem
            label={`Niṣāb (${state.nisabBasis})`}
            value={havePrices ? money(result.nisab) : "—"}
            colors={colors}
          />
        </View>

        <Text style={styles.disclaimer}>
          An educational estimate, not a fatwa. Covers cash, gold, silver, investments, and business
          assets at 2.5% once above the niṣāb for a lunar year. Confirm your situation with a
          qualified scholar.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Niṣāb prices</Text>
          <Row label="Currency">
            <TextInput
              style={styles.input}
              value={state.currency}
              onChangeText={(v) => update({ currency: v })}
              maxLength={4}
            />
          </Row>
          <Row label="Gold per gram">
            <TextInput
              style={styles.input}
              value={state.goldPricePerGram}
              onChangeText={(v) => update({ goldPricePerGram: v })}
              keyboardType="decimal-pad"
              placeholder="e.g. 75"
              placeholderTextColor={colors.muted}
            />
          </Row>
          <Row label="Silver per gram">
            <TextInput
              style={styles.input}
              value={state.silverPricePerGram}
              onChangeText={(v) => update({ silverPricePerGram: v })}
              keyboardType="decimal-pad"
              placeholder="e.g. 0.85"
              placeholderTextColor={colors.muted}
            />
          </Row>
          <View style={styles.basisRow}>
            <Text style={styles.label}>Threshold basis</Text>
            <View style={styles.chips}>
              {(["silver", "gold"] as NisabBasis[]).map((b) => (
                <Pressable
                  key={b}
                  style={[styles.chip, b === state.nisabBasis && styles.chipOn]}
                  onPress={() => update({ nisabBasis: b })}
                >
                  <Text style={[styles.chipText, b === state.nisabBasis && styles.chipTextOn]}>
                    {b === "silver" ? "Silver (lower)" : "Gold (higher)"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zakatable assets</Text>
          {ZAKAT_ASSET_CATEGORIES.map((c) => (
            <Row key={c.id} label={c.label} hint={c.hint}>
              <TextInput
                style={styles.input}
                value={state.assets[c.id] ?? ""}
                onChangeText={(v) => setAsset(c.id, v)}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.muted}
              />
            </Row>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deductions</Text>
          <Row label="Liabilities" hint="Immediate debts and bills due now">
            <TextInput
              style={styles.input}
              value={state.liabilities}
              onChangeText={(v) => update({ liabilities: v })}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.muted}
            />
          </Row>
        </View>

        <Pressable style={styles.resetBtn} onPress={() => update({ ...DEFAULT, currency: state.currency })}>
          <Text style={styles.resetText}>Reset amounts</Text>
        </Pressable>
        <Text style={styles.foot}>Calculated on your device — nothing you enter leaves this app.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  const s = useMemo(() => rowStyles(colors), [colors]);
  return (
    <View style={s.row}>
      <View style={s.labelWrap}>
        <Text style={s.label}>{label}</Text>
        {hint && <Text style={s.hint}>{hint}</Text>}
      </View>
      {children}
    </View>
  );
}

function SummaryItem({
  label,
  value,
  colors,
  strong,
}: {
  label: string;
  value: string;
  colors: Palette;
  strong?: boolean;
}) {
  const s = useMemo(() => summaryStyles(colors), [colors]);
  return (
    <View style={s.item}>
      <Text style={[s.dt, strong && s.dtStrong]}>{label}</Text>
      <Text style={[s.dd, strong && s.ddStrong]}>{value}</Text>
    </View>
  );
}

function rowStyles(c: Palette) {
  return StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
    labelWrap: { flex: 1, gap: 2 },
    label: { color: c.fg, fontSize: 14 },
    hint: { color: c.muted, fontSize: 11 },
  });
}

function summaryStyles(c: Palette) {
  return StyleSheet.create({
    item: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
    dt: { color: c.muted, fontSize: 14 },
    dtStrong: { color: c.fg, fontFamily: FONT.semibold, fontSize: 15 },
    dd: { color: c.fg, fontSize: 14, fontFamily: FONT.semibold },
    ddStrong: { color: c.fg, fontFamily: FONT.extrabold, fontSize: 15.5 },
  });
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { padding: 16, backgroundColor: c.bg, gap: 16, paddingBottom: 40 },
    disclaimer: { color: c.muted, fontSize: 12, lineHeight: 18 },
    section: {
      backgroundColor: c.bgElev,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
      gap: 4,
    },
    sectionTitle: { color: c.fg, fontSize: 14, fontWeight: "700", marginBottom: 4 },
    input: {
      color: c.fg,
      fontSize: 14,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 10,
      minWidth: 100,
      textAlign: "right",
    },
    basisRow: { gap: 6, marginTop: 4 },
    label: { color: c.muted, fontSize: 12, fontWeight: "600" },
    chips: { flexDirection: "row", gap: 8 },
    chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: c.border },
    chipOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    chipText: { color: c.muted, fontSize: 13 },
    chipTextOn: { color: c.accent, fontWeight: "600" },
    hero: {
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 22,
      overflow: "hidden",
    },
    heroWatermark: { position: "absolute", right: -34, bottom: -40 },
    heroLabel: {
      color: c.faint,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: "uppercase",
      fontFamily: FONT.bold,
    },
    heroValue: { color: c.accent, fontSize: 44, fontFamily: FONT.extrabold, letterSpacing: -1.5, marginVertical: 6 },
    heroNote: { color: c.muted, fontSize: 13.5, lineHeight: 19 },
    heroDivider: { height: 1, backgroundColor: c.borderSoft, marginVertical: 16 },
    resetBtn: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: c.border, alignItems: "center" },
    resetText: { color: c.fg, fontSize: 14 },
    foot: { color: c.muted, fontSize: 11, textAlign: "center" },
  });
}

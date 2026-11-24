import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from "../Type";
import {
  type NisabBasis,
  ZAKAT_ASSET_CATEGORIES,
  calculateZakat,
  parseAmount,
  sanitizeAmountInput,
} from "@ummahlibrary/core";
import { Khatam } from "@ummahlibrary/ui";
import { KEYS, getJSON, isObjectRecord, setJSON } from "../storage";
import { FONT } from "../fonts";
import { useTheme, type Palette } from "../theme";
import { useIntl } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/messages";

/** Interface-language label/hint per core zakat asset category id. */
const ASSET_LABEL: Record<string, MessageKey> = {
  cash: "lr.zk.cash",
  gold: "lr.zk.gold",
  silver: "lr.zk.silver",
  investments: "lr.zk.investments",
  business: "lr.zk.business",
  receivables: "lr.zk.receivables",
};
const ASSET_HINT: Record<string, MessageKey> = {
  cash: "lr.zkHint.cash",
  gold: "lr.zkHint.gold",
  silver: "lr.zkHint.silver",
  investments: "lr.zkHint.investments",
  business: "lr.zkHint.business",
  receivables: "lr.zkHint.receivables",
};

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

// Typed amounts in any interface language: "10,000", "1.000,50", "١٠٠٠٠".
const toNum = parseAmount;

/** Digits (Western or Arabic-Indic), "." and "," while typing; no minus sign.
 *  An Arabic/Urdu keyboard's ١٢٣ used to be wiped out entirely. */
const sanitizeDecimal = sanitizeAmountInput;

/** Strip digits from the currency symbol field — a symbol/code ("$", "AED") never
 *  contains one, and allowing digits here let a stray one silently fuse into the
 *  displayed totals (money() concatenates currency + amount with no separator). */
function sanitizeCurrency(s: string): string {
  return s.replace(/[0-9٠-٩۰-۹]/g, "");
}

export function ZakatScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, tf, locale } = useIntl();

  const [state, setState] = useState<ZakatState>(DEFAULT);

  useEffect(() => {
    void getJSON<Partial<ZakatState>>(KEYS.zakat, {}, isObjectRecord).then((saved) => {
      const healed: ZakatState = {
        ...DEFAULT,
        ...saved,
        // Self-heal a currency value saved before sanitizeCurrency existed —
        // a stray digit in it used to silently fuse into the displayed totals.
        currency: sanitizeCurrency(saved.currency ?? DEFAULT.currency) || DEFAULT.currency,
        // Same self-heal for the decimal fields: onChangeText only sanitizes
        // what's *typed* on this device, so a value arriving another way
        // (synced from another device, hand-edited storage, a future bug)
        // could reach here raw — e.g. a stray "-" or a second "." — and
        // display as-is until next edited. calculateZakat() already guards
        // the maths against this (sumValues/liabilities both discard a
        // negative), but the displayed field shouldn't show a value the UI
        // itself would never let you type.
        goldPricePerGram: sanitizeDecimal(saved.goldPricePerGram ?? DEFAULT.goldPricePerGram),
        silverPricePerGram: sanitizeDecimal(saved.silverPricePerGram ?? DEFAULT.silverPricePerGram),
        liabilities: sanitizeDecimal(saved.liabilities ?? DEFAULT.liabilities),
        assets: Object.fromEntries(
          Object.entries({ ...EMPTY_ASSETS, ...(saved.assets ?? {}) }).map(([id, v]) => [
            id,
            sanitizeDecimal(v),
          ]),
        ),
      };
      setState(healed);
      // Unlike the currency self-heal above (already re-sanitized on every
      // change), a healed value was never written back on its own — every
      // launch re-read the same raw value and re-healed it in memory,
      // correct on screen but silently perpetuating the raw value in
      // storage (and in whatever a sync round pushes) forever, the same gap
      // iteration 20 found and fixed for theme.tsx. Persist once, only when
      // healing actually changed something.
      if (JSON.stringify(healed) !== JSON.stringify({ ...DEFAULT, ...saved })) {
        void setJSON(KEYS.zakat, healed);
      }
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
    // Deliberately not update({ assets: { ...state.assets, [id]: value } }):
    // that reads the outer `state.assets` snapshot at call time, so two
    // different asset fields edited within the same tick (before a re-render
    // lands) would each patch from the same stale `assets` object and the
    // second field's update would wholesale-overwrite the first field's
    // value back to its old one. Deriving from `prev` inside the updater —
    // the same pattern the qada/tasbih/khatm steppers already use — keeps
    // each edit correctly layered on the other's output.
    setState((prev) => {
      const next = { ...prev, assets: { ...prev.assets, [id]: value } };
      void setJSON(KEYS.zakat, next);
      return next;
    });
  }

  // "Reset amounts" clears what it says — the entered wealth figures — and
  // leaves currency, gold/silver prices, and the niṣāb basis alone; a user
  // recalculating for a new scenario shouldn't lose prices they looked up.
  function reset() {
    update({ assets: { ...EMPTY_ASSETS }, liabilities: "" });
  }

  const result = useMemo(
    () =>
      calculateZakat({
        assets: Object.fromEntries(
          ZAKAT_ASSET_CATEGORIES.map((c) => [c.id, toNum(state.assets[c.id] ?? "")]),
        ),
        liabilities: toNum(state.liabilities),
        nisabBasis: state.nisabBasis,
        goldPricePerGram: toNum(state.goldPricePerGram),
        silverPricePerGram: toNum(state.silverPricePerGram),
      }),
    [state],
  );

  const basis = t(state.nisabBasis === "gold" ? "lr.basis.gold" : "lr.basis.silver");

  const havePrices =
    state.nisabBasis === "gold"
      ? toNum(state.goldPricePerGram) > 0
      : toNum(state.silverPricePerGram) > 0;

  function money(n: number) {
    // Sanitize defensively even here — a value written by another route (e.g. a
    // synced payload from another device) could still carry a stray digit, and
    // a bare concatenation would silently fuse it into the total.
    const symbol = sanitizeCurrency(state.currency) || DEFAULT.currency;
    let amount: string;
    try {
      amount = n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch {
      amount = n.toFixed(2);
    }
    return `${symbol}${amount}`;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.screen}>
        <View style={styles.hero}>
          <View style={styles.heroWatermark} pointerEvents="none">
            <Khatam size={150} color={colors.accent} sw={1.1} opacity={0.08} />
          </View>
          <Text style={styles.heroLabel}>{t("lr.zakatDue")}</Text>
          <Text style={styles.heroValue}>{havePrices ? money(result.zakatDue) : "—"}</Text>
          <Text style={styles.heroNote}>
            {!havePrices
              ? t("lr.enterPrices")
              : tf(result.meetsNisab ? "lr.aboveNisab" : "lr.belowNisab", {
                  amount: money(result.netWealth),
                  basis,
                })}
          </Text>
          <View style={styles.heroDivider} />
          <SummaryItem
            label={t("lr.totalAssets")}
            value={money(result.totalAssets)}
            colors={colors}
          />
          <SummaryItem
            label={t("lr.netWealth")}
            value={money(result.netWealth)}
            colors={colors}
            strong
          />
          <SummaryItem
            label={tf("lr.nisabOf", { basis })}
            value={havePrices ? money(result.nisab) : "—"}
            colors={colors}
          />
        </View>

        <Text style={styles.disclaimer}>{t("lr.zakatDisclaimer")}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("lr.nisabPrices")}</Text>
          <Row label={t("lr.currency")}>
            <TextInput
              style={styles.input}
              value={state.currency}
              onChangeText={(v) => update({ currency: sanitizeCurrency(v) })}
              maxLength={4}
              accessibilityLabel={t("lr.currency")}
            />
          </Row>
          <Row label={t("lr.goldPerGram")}>
            <TextInput
              style={styles.input}
              value={state.goldPricePerGram}
              onChangeText={(v) => update({ goldPricePerGram: sanitizeDecimal(v) })}
              keyboardType="decimal-pad"
              placeholder={t("lr.egGold")}
              accessibilityLabel={t("lr.goldPerGram")}
              placeholderTextColor={colors.muted}
            />
          </Row>
          <Row label={t("lr.silverPerGram")}>
            <TextInput
              style={styles.input}
              value={state.silverPricePerGram}
              onChangeText={(v) => update({ silverPricePerGram: sanitizeDecimal(v) })}
              keyboardType="decimal-pad"
              placeholder={t("lr.egSilver")}
              accessibilityLabel={t("lr.silverPerGram")}
              placeholderTextColor={colors.muted}
            />
          </Row>
          <View style={styles.basisRow}>
            <Text style={styles.label}>{t("lr.basisLabel")}</Text>
            <View style={styles.chips}>
              {(["silver", "gold"] as NisabBasis[]).map((b) => (
                <Pressable
                  key={b}
                  style={[styles.chip, b === state.nisabBasis && styles.chipOn]}
                  onPress={() => update({ nisabBasis: b })}
                >
                  <Text style={[styles.chipText, b === state.nisabBasis && styles.chipTextOn]}>
                    {b === "silver" ? t("lr.silverLower") : t("lr.goldHigher")}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("lr.zakatable")}</Text>
          {ZAKAT_ASSET_CATEGORIES.map((c) => (
            <Row
              key={c.id}
              label={ASSET_LABEL[c.id] ? t(ASSET_LABEL[c.id]!) : c.label}
              hint={ASSET_HINT[c.id] ? t(ASSET_HINT[c.id]!) : c.hint}
            >
              <TextInput
                style={styles.input}
                value={state.assets[c.id] ?? ""}
                onChangeText={(v) => setAsset(c.id, sanitizeDecimal(v))}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.muted}
              />
            </Row>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("lr.deductions")}</Text>
          <Row label={t("lr.liabilities")} hint={t("lr.liabilitiesHint")}>
            <TextInput
              style={styles.input}
              value={state.liabilities}
              onChangeText={(v) => update({ liabilities: sanitizeDecimal(v) })}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.muted}
            />
          </Row>
        </View>

        <Pressable style={styles.resetBtn} onPress={reset}>
          <Text style={styles.resetText}>{t("lr.resetAmounts")}</Text>
        </Pressable>
        <Text style={styles.foot}>{t("lr.zakatFoot")}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
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
    chip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
    },
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
    heroWatermark: { position: "absolute", end: -34, bottom: -40 },
    heroLabel: {
      color: c.faint,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: "uppercase",
      fontFamily: FONT.bold,
    },
    heroValue: {
      color: c.accent,
      fontSize: 44,
      fontFamily: FONT.extrabold,
      letterSpacing: -1.5,
      marginVertical: 6,
    },
    heroNote: { color: c.muted, fontSize: 13.5, lineHeight: 19 },
    heroDivider: { height: 1, backgroundColor: c.borderSoft, marginVertical: 16 },
    resetBtn: {
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
    },
    resetText: { color: c.fg, fontSize: 14 },
    foot: { color: c.muted, fontSize: 11, textAlign: "center" },
  });
}

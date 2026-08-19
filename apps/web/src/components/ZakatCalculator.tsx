"use client";

import { useEffect, useMemo, useState } from "react";
import { type NisabBasis, ZAKAT_ASSET_CATEGORIES, calculateZakat } from "@ummahlibrary/core";
import { N, Khatam } from "@ummahlibrary/ui";
import { readZakat, writeZakat } from "../lib/zakat-store";

const lcard = { background: N.card, border: `1px solid ${N.border}`, borderRadius: 16 } as const;

interface State {
  currency: string;
  goldPricePerGram: string;
  silverPricePerGram: string;
  nisabBasis: NisabBasis;
  assets: Record<string, string>;
  liabilities: string;
}

const EMPTY_ASSETS = Object.fromEntries(ZAKAT_ASSET_CATEGORIES.map((c) => [c.id, ""]));

const DEFAULT_STATE: State = {
  currency: "$",
  goldPricePerGram: "",
  silverPricePerGram: "",
  nisabBasis: "silver",
  assets: { ...EMPTY_ASSETS },
  liabilities: "",
};

function num(s: string): number {
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

/** Strip digits from the currency symbol field — a symbol/code ("$", "AED") never
 *  contains one, and allowing digits here let a stray one silently fuse into the
 *  displayed totals (money() concatenates currency + amount with no separator). */
function sanitizeCurrency(s: string): string {
  return s.replace(/[0-9]/g, "");
}

/** Strip anything but digits and a single decimal point from an amount field.
 *  Wealth/price amounts can't be negative — `sumValues`/the niṣāb math already
 *  treat a negative entry as if the field were blank, so accepting the "-"
 *  keystroke just let a mistyped value vanish from the totals with no
 *  explanation. Blocking it at input time (like the currency field already
 *  blocks digits) is the same fix in the same spot. */
function sanitizeAmount(s: string): string {
  const cleaned = s.replace(/[^0-9.]/g, "");
  const dot = cleaned.indexOf(".");
  if (dot === -1) return cleaned;
  return cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, "");
}

const sectionLabel = {
  fontSize: 12,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: N.faint,
  fontWeight: 700,
  fontFamily: N.ui,
} as const;

function Field({
  label,
  hint,
  prefix,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  prefix?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13.5,
          color: N.muted,
          marginBottom: 6,
          gap: 8,
          fontFamily: N.ui,
        }}
      >
        <span>{label}</span>
        {hint && <span style={{ color: N.faint, fontSize: 12, textAlign: "right" }}>{hint}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, ...lcard, padding: "0 14px", height: 46 }}>
        {prefix && <span style={{ color: N.faint, fontSize: 15 }}>{prefix}</span>}
        <input
          inputMode="decimal"
          placeholder={placeholder ?? "0"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            background: "none",
            border: "none",
            outline: "none",
            color: N.fg,
            fontFamily: N.ui,
            fontSize: 16,
            width: "100%",
          }}
        />
      </div>
    </div>
  );
}

function Row({ k, val, strong, faint }: { k: string; val: string; strong?: boolean; faint?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 0",
        fontSize: strong ? 16 : 14,
        color: faint ? N.faint : N.muted,
        fontFamily: N.ui,
      }}
    >
      <span>{k}</span>
      <span style={{ fontWeight: strong ? 800 : 600, color: strong ? N.fg : faint ? N.faint : N.fg }}>
        {val}
      </span>
    </div>
  );
}

export function ZakatCalculator() {
  const [state, setState] = useState<State>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = readZakat() as Partial<State> | null;
    if (saved) {
      setState({
        ...DEFAULT_STATE,
        ...saved,
        // Self-heal a currency value saved before sanitizeCurrency existed — a
        // stray digit in it used to silently fuse into the displayed totals.
        currency: sanitizeCurrency(saved.currency ?? DEFAULT_STATE.currency) || DEFAULT_STATE.currency,
        assets: { ...EMPTY_ASSETS, ...(saved.assets ?? {}) },
      });
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    writeZakat(state);
  }, [state, loaded]);

  const result = useMemo(
    () =>
      calculateZakat({
        assets: Object.fromEntries(
          ZAKAT_ASSET_CATEGORIES.map((c) => [c.id, num(state.assets[c.id] ?? "")]),
        ),
        liabilities: num(state.liabilities),
        nisabBasis: state.nisabBasis,
        goldPricePerGram: num(state.goldPricePerGram),
        silverPricePerGram: num(state.silverPricePerGram),
      }),
    [state],
  );

  const money = (n: number) => {
    const symbol = sanitizeCurrency(state.currency) || DEFAULT_STATE.currency;
    return `${symbol}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const havePrices = num(state.goldPricePerGram) > 0 && num(state.silverPricePerGram) > 0;

  function setAsset(id: string, value: string) {
    setState((s) => ({ ...s, assets: { ...s.assets, [id]: sanitizeAmount(value) } }));
  }
  // "Reset amounts" clears what it says — the entered wealth figures — and
  // leaves currency, gold/silver prices, and the niṣāb basis alone; a user
  // recalculating for a new scenario shouldn't lose prices they looked up.
  function reset() {
    setState((s) => ({ ...s, assets: { ...EMPTY_ASSETS }, liabilities: "" }));
  }

  return (
    <div>
      {/* Educational disclaimer */}
      <div
        style={{
          ...lcard,
          borderLeft: `3px solid ${N.gold}`,
          padding: "16px 18px",
          marginBottom: 24,
          fontSize: 13.5,
          lineHeight: 1.65,
          color: N.muted,
          fontFamily: N.ui,
        }}
      >
        <strong style={{ color: N.fg }}>An educational estimate, not a fatwa.</strong> This
        calculates zakat al-māl on common <em>monetary</em> wealth (cash, gold, silver, investments,
        business assets) using the method agreed across the four Sunni schools — 2.5% once your net
        wealth has stayed above the niṣāb for a lunar year. It does <em>not</em> cover agricultural
        produce, livestock, or Shia khums, and edge cases (pensions, mixed assets, debts) vary.
        Please confirm your situation with a qualified scholar.
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px,1fr))",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* Inputs */}
        <div>
          <div style={{ ...sectionLabel, marginBottom: 14 }}>Niṣāb</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px,1fr))", gap: 10 }}>
            <Field
              label="Currency"
              value={state.currency}
              onChange={(v) => setState((s) => ({ ...s, currency: sanitizeCurrency(v).slice(0, 4) }))}
              placeholder="$"
            />
            <Field
              label="Gold / gram"
              placeholder="e.g. 75"
              value={state.goldPricePerGram}
              onChange={(v) => setState((s) => ({ ...s, goldPricePerGram: sanitizeAmount(v) }))}
            />
            <Field
              label="Silver / gram"
              placeholder="e.g. 0.85"
              value={state.silverPricePerGram}
              onChange={(v) => setState((s) => ({ ...s, silverPricePerGram: sanitizeAmount(v) }))}
            />
          </div>
          <div style={{ fontSize: 13.5, color: N.muted, margin: "2px 0 8px", fontFamily: N.ui }}>
            Threshold basis
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            {(["silver", "gold"] as NisabBasis[]).map((b) => {
              const active = b === state.nisabBasis;
              return (
                <button
                  key={b}
                  onClick={() => setState((s) => ({ ...s, nisabBasis: b }))}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 999,
                    border: `1px solid ${active ? N.gold : N.border}`,
                    background: active ? N.goldSoft : "transparent",
                    color: active ? N.gold : N.muted,
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: N.ui,
                  }}
                >
                  {b === "silver" ? "Silver (lower)" : "Gold (higher)"}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 12.5, color: N.faint, lineHeight: 1.6, margin: "0 0 20px", fontFamily: N.ui }}>
            Most charities use the <strong>silver</strong> niṣāb so more people give; some prefer
            gold. It only changes the result if your wealth sits between the two thresholds.
          </p>

          <div style={{ ...sectionLabel, margin: "0 0 14px" }}>Zakatable assets</div>
          {ZAKAT_ASSET_CATEGORIES.map((c) => (
            <Field
              key={c.id}
              label={c.label}
              hint={c.hint}
              prefix={state.currency}
              value={state.assets[c.id] ?? ""}
              onChange={(v) => setAsset(c.id, v)}
            />
          ))}

          <div style={{ ...sectionLabel, margin: "20px 0 14px" }}>Deductions</div>
          <Field
            label="Liabilities"
            hint="Immediate debts & bills due now"
            prefix={state.currency}
            value={state.liabilities}
            onChange={(v) => setState((s) => ({ ...s, liabilities: sanitizeAmount(v) }))}
          />
        </div>

        {/* Sticky summary */}
        <div style={{ position: "sticky", top: 0 }}>
          <div
            style={{
              ...lcard,
              padding: 26,
              background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", right: -34, bottom: -40, pointerEvents: "none" }}>
              <Khatam size={150} color={N.gold} opacity={0.08} sw={1.1} />
            </div>
            <div style={{ ...sectionLabel }}>Zakat due (2.5%)</div>
            <div style={{ fontSize: 46, fontWeight: 800, color: N.gold, letterSpacing: -1.5, margin: "8px 0 4px", fontFamily: N.ui }}>
              {havePrices ? money(result.zakatDue) : "—"}
            </div>
            <div style={{ fontSize: 13.5, color: result.meetsNisab ? N.muted : N.faint, fontFamily: N.ui, lineHeight: 1.5 }}>
              {!havePrices
                ? "Enter the current gold and silver prices per gram to set the niṣāb."
                : result.meetsNisab
                  ? "Payable on your net zakatable wealth."
                  : `Net wealth is below the ${state.nisabBasis} niṣāb — no zakat due.`}
            </div>
            <div style={{ height: 1, background: N.borderSoft, margin: "20px 0" }} />
            <Row k="Total assets" val={money(result.totalAssets)} />
            <Row k="Less liabilities" val={`– ${money(num(state.liabilities))}`} />
            <Row k="Net zakatable" val={money(result.netWealth)} strong />
            <Row k={`Niṣāb (${state.nisabBasis})`} val={havePrices ? money(result.nisab) : "—"} faint />
            <button
              onClick={reset}
              style={{
                marginTop: 18,
                width: "100%",
                padding: "10px 14px",
                borderRadius: 11,
                background: N.bg,
                border: `1px solid ${N.borderSoft}`,
                color: N.muted,
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: N.ui,
              }}
            >
              Reset amounts
            </button>
            <p style={{ fontSize: 12, color: N.faint, lineHeight: 1.5, margin: "14px 0 0", fontFamily: N.ui }}>
              Calculated on your device — nothing you enter leaves this browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

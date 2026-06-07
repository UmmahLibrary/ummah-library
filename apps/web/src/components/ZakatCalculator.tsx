"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type NisabBasis,
  ZAKAT_ASSET_CATEGORIES,
  calculateZakat,
} from "@ummahlibrary/core";

const STORAGE_KEY = "ul.zakat";

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

export function ZakatCalculator() {
  const [state, setState] = useState<State>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<State>;
        setState({
          ...DEFAULT_STATE,
          ...saved,
          assets: { ...EMPTY_ASSETS, ...(saved.assets ?? {}) },
        });
      }
    } catch {
      /* ignore corrupt storage */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
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

  const money = (n: number) =>
    `${state.currency}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const havePrices = num(state.goldPricePerGram) > 0 && num(state.silverPricePerGram) > 0;

  function setAsset(id: string, value: string) {
    setState((s) => ({ ...s, assets: { ...s.assets, [id]: value } }));
  }

  function reset() {
    setState({ ...DEFAULT_STATE, currency: state.currency });
  }

  return (
    <div className="zakat">
      <div className="zakat-note">
        <strong>An educational estimate, not a fatwa.</strong> This calculates zakat al-māl on
        common <em>monetary</em> wealth (cash, gold, silver, investments, business assets) using the
        method agreed across the four Sunni schools — 2.5% once your net wealth has stayed above the
        niṣāb for a lunar year. It does <em>not</em> cover agricultural produce, livestock, or Shia
        khums, and edge cases (pensions, mixed assets, debts) vary. Please confirm your situation
        with a qualified scholar.
      </div>

      <fieldset className="zakat-group">
        <legend>Niṣāb</legend>
        <div className="zakat-prices">
          <label>
            <span className="prayer-control-label">Currency</span>
            <input
              className="zakat-input"
              value={state.currency}
              onChange={(e) => setState((s) => ({ ...s, currency: e.target.value }))}
              maxLength={4}
            />
          </label>
          <label>
            <span className="prayer-control-label">Gold price / gram</span>
            <input
              className="zakat-input"
              inputMode="decimal"
              placeholder="e.g. 75"
              value={state.goldPricePerGram}
              onChange={(e) => setState((s) => ({ ...s, goldPricePerGram: e.target.value }))}
            />
          </label>
          <label>
            <span className="prayer-control-label">Silver price / gram</span>
            <input
              className="zakat-input"
              inputMode="decimal"
              placeholder="e.g. 0.85"
              value={state.silverPricePerGram}
              onChange={(e) => setState((s) => ({ ...s, silverPricePerGram: e.target.value }))}
            />
          </label>
        </div>
        <div className="zakat-basis">
          <span className="prayer-control-label">Threshold basis</span>
          <div className="hijri-adjust-row">
            {(["silver", "gold"] as NisabBasis[]).map((b) => (
              <button
                key={b}
                type="button"
                className={b === state.nisabBasis ? "chip chip--active" : "chip"}
                onClick={() => setState((s) => ({ ...s, nisabBasis: b }))}
              >
                {b === "silver" ? "Silver (lower)" : "Gold (higher)"}
              </button>
            ))}
          </div>
          <p className="hifz-muted zakat-basis-note">
            Most charities use the <strong>silver</strong> niṣāb so more people give; some prefer
            gold. It only changes the result if your wealth sits between the two thresholds.
          </p>
        </div>
      </fieldset>

      <fieldset className="zakat-group">
        <legend>Zakatable assets</legend>
        {ZAKAT_ASSET_CATEGORIES.map((c) => (
          <label key={c.id} className="zakat-row">
            <span className="zakat-row-label">
              {c.label}
              <span className="zakat-hint">{c.hint}</span>
            </span>
            <input
              className="zakat-input"
              inputMode="decimal"
              placeholder="0"
              value={state.assets[c.id] ?? ""}
              onChange={(e) => setAsset(c.id, e.target.value)}
            />
          </label>
        ))}
      </fieldset>

      <fieldset className="zakat-group">
        <legend>Deductions</legend>
        <label className="zakat-row">
          <span className="zakat-row-label">
            Liabilities
            <span className="zakat-hint">Immediate debts and bills due now</span>
          </span>
          <input
            className="zakat-input"
            inputMode="decimal"
            placeholder="0"
            value={state.liabilities}
            onChange={(e) => setState((s) => ({ ...s, liabilities: e.target.value }))}
          />
        </label>
      </fieldset>

      <div className="prayer-next zakat-result">
        <span className="prayer-next-label">Zakat due (2.5%)</span>
        <span className="prayer-next-name">{havePrices ? money(result.zakatDue) : "—"}</span>
        <span className="prayer-next-in">
          {!havePrices
            ? "Enter the current gold and silver prices per gram to set the niṣāb."
            : result.meetsNisab
              ? `Net wealth ${money(result.netWealth)} is above the ${state.nisabBasis} niṣāb of ${money(result.nisab)}.`
              : `Net wealth ${money(result.netWealth)} is below the ${state.nisabBasis} niṣāb of ${money(result.nisab)} — no zakat due.`}
        </span>
      </div>

      <dl className="zakat-summary">
        <div>
          <dt>Total assets</dt>
          <dd>{money(result.totalAssets)}</dd>
        </div>
        <div>
          <dt>Net wealth</dt>
          <dd>{money(result.netWealth)}</dd>
        </div>
        <div>
          <dt>Niṣāb ({state.nisabBasis})</dt>
          <dd>{havePrices ? money(result.nisab) : "—"}</dd>
        </div>
      </dl>

      <div className="prayer-controls">
        <button type="button" className="chip" onClick={reset}>
          Reset amounts
        </button>
      </div>
      <p className="foot">Calculated on your device — nothing you enter leaves this browser.</p>
    </div>
  );
}

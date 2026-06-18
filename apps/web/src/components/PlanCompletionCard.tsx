"use client";

import { useState } from "react";
import Link from "next/link";
import { type ActivePlan, PLAN_TEMPLATES, planDuration, totalUnits, unitWord } from "@ummahlibrary/core";
import { N, Khatam, Icon } from "@ummahlibrary/ui";

/**
 * Completion milestone for a finished plan (#63): a celebration, a shareable
 * progress card (reusing the ayah image renderer), and a nudge to begin the next
 * journey. Shown in place of the active-plan card once every unit is read.
 */
export function PlanCompletionCard({ plan }: { plan: ActivePlan }) {
  const [busy, setBusy] = useState(false);

  const unit = plan.template.range.unit;
  const total = totalUnits(plan.template.range);
  const days = planDuration(plan);
  const name = plan.template.name;
  const suggestions = PLAN_TEMPLATES.filter((t) => t.id !== plan.template.id).slice(0, 2);

  async function share() {
    setBusy(true);
    try {
      // Loaded on demand so the canvas image-renderer stays out of the
      // initial bundle — it's only needed when this button is pressed.
      const { renderPlanCardImage, shareOrDownload } = await import("../lib/share-image");
      const blob = await renderPlanCardImage({
        heading: "Quran journey complete",
        arabic: "ٱلْحَمْدُ لِلّٰهِ",
        subtitle: `${name} · ${total} ${unitWord(unit, total)} · ${days} days`,
      });
      if (blob) await shareOrDownload(blob, `plan-${plan.template.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        borderRadius: 18,
        padding: 28,
        textAlign: "center",
        border: `1px solid ${N.gold}`,
        background: `linear-gradient(135deg, ${N.goldSoft}, ${N.card})`,
      }}
    >
      <div style={{ display: "grid", placeItems: "center" }}>
        <Khatam size={84} color={N.gold} sw={1} opacity={0.85} />
      </div>
      <div style={{ fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: N.gold, fontWeight: 800, fontFamily: N.ui }}>
        Plan complete
      </div>
      <h2 style={{ margin: "8px 0 0", fontSize: 25, fontWeight: 800, color: N.fg, fontFamily: N.ui }}>
        Alhamdulillah — you finished {name}
      </h2>
      <p style={{ margin: "8px 0 0", color: N.muted, fontSize: 14, fontFamily: N.ui }}>
        {total} {unitWord(unit, total)} over {days} {days === 1 ? "day" : "days"}. May Allah accept it.
      </p>

      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 20 }}>
        <button
          type="button"
          className="noor-press"
          disabled={busy}
          onClick={() => void share()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 18px",
            borderRadius: 12,
            border: "none",
            background: N.goldGrad,
            color: N.ink,
            fontWeight: 700,
            fontSize: 14,
            fontFamily: N.ui,
            cursor: busy ? "default" : "pointer",
            opacity: busy ? 0.7 : 1,
          }}
        >
          <Icon name="share" size={16} color={N.ink} sw={1.8} /> {busy ? "Preparing…" : "Share your achievement"}
        </button>
      </div>

      {suggestions.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: N.faint, fontWeight: 700, fontFamily: N.ui }}>
            Begin a new journey
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            {suggestions.map((t) => (
              <Link
                key={t.id}
                href={`/plans/${t.id}`}
                className="noor-press"
                style={{
                  display: "inline-flex",
                  flexDirection: "column",
                  gap: 2,
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: `1px solid ${N.border}`,
                  background: N.card,
                  color: N.fg,
                  textDecoration: "none",
                  fontFamily: N.ui,
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 13.5 }}>{t.name}</span>
                <span style={{ fontSize: 11.5, color: N.faint }}>
                  {t.tag} · {t.len}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

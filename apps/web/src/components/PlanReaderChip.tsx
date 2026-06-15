"use client";

import { useEffect, useState } from "react";
import { type ActivePlan, todayProgress } from "@ummahlibrary/core";
import { N, Icon } from "@ummahlibrary/ui";
import { READING_PLAN_EVENT, readActivePlan, todayStr } from "../lib/reading-plan";

const UNIT_LABEL: Record<string, string> = {
  juz: "juzʾ",
  hizb: "ḥizb",
  page: "pages",
  surah: "sūrahs",
  ayah: "ayahs",
};

/**
 * A slim floating chip shown in the reader while a plan is active —
 * "Plan · 2 of 3 pages today" — that advances as you read, because the plan is
 * subscribed to the reader's page signal (#69). Renders nothing with no plan.
 */
export function PlanReaderChip() {
  const [plan, setPlan] = useState<ActivePlan | null>(null);

  useEffect(() => {
    const refresh = () => void readActivePlan().then(setPlan);
    refresh();
    window.addEventListener(READING_PLAN_EVENT, refresh);
    return () => window.removeEventListener(READING_PLAN_EVENT, refresh);
  }, []);

  if (!plan || plan.pausedOn) return null; // hidden while the plan is paused (#68)
  const { done, total } = todayProgress(plan, todayStr());
  if (total === 0) return null;
  const complete = done >= total;
  const unit = UNIT_LABEL[plan.template.range.unit] ?? "units";

  return (
    <div
      style={{
        position: "fixed",
        top: 60,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "6px 14px",
        borderRadius: 999,
        background: complete ? N.goldSoft : N.cardHi,
        border: `1px solid ${complete ? N.gold : N.border}`,
        color: complete ? N.gold : N.muted,
        fontSize: 12.5,
        fontWeight: 600,
        fontFamily: N.ui,
        boxShadow: "0 6px 18px rgba(0,0,0,.3)",
        whiteSpace: "nowrap",
      }}
    >
      {complete ? (
        <>
          <Icon name="check" size={14} color={N.gold} sw={2} /> Today’s portion done
        </>
      ) : (
        <>
          <span style={{ color: N.gold, fontWeight: 700 }}>Plan</span> · {done} of {total} {unit} today
        </>
      )}
    </div>
  );
}

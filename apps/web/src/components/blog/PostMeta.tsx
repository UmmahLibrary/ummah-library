import type { CSSProperties } from "react";
import { N } from "@ummahlibrary/ui";

const dateFmt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });

export function PublishDate({ date, style }: { date: string; style?: CSSProperties }) {
  const d = new Date(`${date}T00:00:00`);
  return (
    <time dateTime={date} style={{ fontSize: 13, color: N.faint, whiteSpace: "nowrap", ...style }}>
      {dateFmt.format(d)}
    </time>
  );
}

/** One small, muted meta line: publish date · reading time. */
export function PostMeta({
  date,
  mins,
  style,
}: {
  date: string;
  mins: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        fontSize: 13,
        color: N.faint,
        ...style,
      }}
    >
      <PublishDate date={date} />
      <span aria-hidden="true">·</span>
      <span>{mins} min read</span>
    </div>
  );
}

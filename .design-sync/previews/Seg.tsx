import { useState } from "react";
import { Seg } from "@ummahlibrary/ui";

export const ReadingModes = () => {
  const [v, setV] = useState("arabic");
  return (
    <div style={{ padding: "20px 24px" }}>
      <Seg
        options={["arabic", "translation", "both"]}
        value={v}
        onChange={setV}
      />
    </div>
  );
};

export const ThemeSizes = () => {
  const [v, setV] = useState("md");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "20px 24px" }}>
      <Seg options={["sm", "md", "lg"]} value={v} onChange={setV} size="sm" />
      <Seg options={["sm", "md", "lg"]} value={v} onChange={setV} size="md" />
    </div>
  );
};

export const LabeledOptions = () => {
  const [v, setV] = useState("daily");
  return (
    <div style={{ padding: "20px 24px" }}>
      <Seg
        options={[
          { value: "daily", label: "Today" },
          { value: "weekly", label: "This Week" },
          { value: "monthly", label: "This Month" },
        ]}
        value={v}
        onChange={setV}
      />
    </div>
  );
};

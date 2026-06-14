import { Icon, type IconName } from "@ummahlibrary/ui";

const Grid = ({ icons, color = "#e6b855" }: { icons: IconName[]; color?: string }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 16, padding: "20px 24px", background: "#0a0b0f", borderRadius: 8 }}>
    {icons.map((name) => (
      <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <Icon name={name} size={22} color={color} />
        <span style={{ fontSize: 10, color: "#9aa0b2", fontFamily: "system-ui" }}>{name}</span>
      </div>
    ))}
  </div>
);

export const Navigation = () => (
  <div style={{ padding: 16 }}>
    <Grid icons={["home", "search", "book", "tafsir", "compass", "headphones", "star", "bookmark", "heart", "globe"]} />
  </div>
);

export const Actions = () => (
  <div style={{ padding: 16 }}>
    <Grid icons={["share", "download", "plus", "minus", "check", "close", "settings", "more", "layers", "repeat"]} />
  </div>
);

export const Directional = () => (
  <div style={{ padding: 16 }}>
    <Grid icons={["chevL", "chevR", "chevD", "arrowL", "arrowR", "menu", "grid", "type"]} />
  </div>
);

export const MediaAndTheme = () => (
  <div style={{ padding: 16 }}>
    <Grid icons={["play", "pause", "moon", "sun"]} color="#f4d58a" />
  </div>
);

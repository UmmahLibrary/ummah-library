import { Khatam } from "@ummahlibrary/ui";

const Dark = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: "#0a0b0f", padding: "24px 32px", display: "inline-flex", gap: 32, alignItems: "center", borderRadius: 8 }}>
    {children}
  </div>
);

export const Sizes = () => (
  <div style={{ padding: 16 }}>
    <Dark>
      <Khatam size={32} color="#e6b855" sw={2} />
      <Khatam size={64} color="#e6b855" sw={1.4} />
      <Khatam size={120} color="#e6b855" sw={1} />
    </Dark>
  </div>
);

export const Filled = () => (
  <div style={{ padding: 16 }}>
    <Dark>
      <Khatam size={80} color="#e6b855" fill="rgba(230,184,85,0.12)" sw={1} />
      <Khatam size={80} color="#e6b855" fill="#e6b855" sw={0} opacity={0.9} />
    </Dark>
  </div>
);

export const Subtle = () => (
  <div style={{ padding: 16 }}>
    <Dark>
      <Khatam size={100} color="#e6b855" sw={0.6} opacity={0.15} />
      <Khatam size={100} color="#e6b855" sw={0.6} opacity={0.4} />
      <Khatam size={100} color="#e6b855" sw={0.6} opacity={1} />
    </Dark>
  </div>
);

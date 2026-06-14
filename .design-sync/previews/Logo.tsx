import { Logo } from "@ummahlibrary/ui";

const Dark = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: "#0a0b0f", padding: "20px 24px", display: "inline-block", borderRadius: 8 }}>
    {children}
  </div>
);

export const Default = () => (
  <div style={{ padding: 16 }}>
    <Dark><Logo /></Dark>
  </div>
);

export const Large = () => (
  <div style={{ padding: 16 }}>
    <Dark><Logo scale={1.6} /></Dark>
  </div>
);

export const Small = () => (
  <div style={{ padding: 16 }}>
    <Dark><Logo scale={0.75} /></Dark>
  </div>
);

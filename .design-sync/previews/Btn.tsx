import { Btn } from "@ummahlibrary/ui";

export const GoldSizes = () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "20px 24px" }}>
    <Btn size="sm" variant="gold">Small</Btn>
    <Btn size="md" variant="gold">Medium</Btn>
    <Btn size="lg" variant="gold">Large</Btn>
  </div>
);

export const AllVariants = () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "20px 24px" }}>
    <Btn variant="gold">Gold</Btn>
    <Btn variant="ghost">Ghost</Btn>
    <Btn variant="soft">Soft</Btn>
    <Btn variant="quiet">Quiet</Btn>
  </div>
);

export const WithIcon = () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "20px 24px" }}>
    <Btn variant="gold" icon="bookmark">Save Ayah</Btn>
    <Btn variant="ghost" icon="share">Share</Btn>
    <Btn variant="soft" icon="heart">Favourite</Btn>
  </div>
);

export const DisabledState = () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "20px 24px" }}>
    <Btn variant="gold" disabled>Disabled Gold</Btn>
    <Btn variant="ghost" disabled>Disabled Ghost</Btn>
  </div>
);

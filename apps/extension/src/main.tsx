import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// All Noor themes (generated from packages/ui/src/themes.ts — ADR 0027).
import "@ummahlibrary/ui/noor-themes.css";
import "./styles.css";
import { Popup } from "./Popup";
import { applyTheme, readThemeSync } from "./lib/theme";

// Apply the saved theme before the first paint to avoid a flash; the Popup
// reconciles with synced storage on mount.
applyTheme(readThemeSync());

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Popup />
    </StrictMode>,
  );
}

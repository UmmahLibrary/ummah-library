import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@ummahlibrary/ui/noor-tokens.css";
import "./styles.css";
import { Popup } from "./Popup";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Popup />
    </StrictMode>,
  );
}

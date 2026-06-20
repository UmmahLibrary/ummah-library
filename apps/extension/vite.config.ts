import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Build the extension popup. Output goes to `dist/` together with the static
 * `public/` payload (manifest.json + icons), which is the unpacked extension
 * you load into Chrome/Firefox.
 *
 * `base: "./"` makes asset URLs relative so they resolve from the extension
 * root (`chrome-extension://<id>/…`). `modulePreload.polyfill: false` keeps the
 * popup free of an inline bootstrap script, which the default MV3 CSP forbids.
 */
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: { index: "index.html" },
    },
  },
});

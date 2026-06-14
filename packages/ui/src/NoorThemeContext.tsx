"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { Palette } from "./themes";

const Ctx = createContext<Palette | null>(null);

/**
 * Wrap your app (or a subtree) with this provider so Noor components can read
 * the active palette.  On mobile, call this from ThemeProvider after resolving
 * the active Noor theme.  On web, CSS variables handle theming automatically
 * and this provider is not required (but harmless if you add it).
 */
export function NoorThemeProvider({
  theme,
  children,
}: {
  theme: Palette;
  children: ReactNode;
}) {
  return <Ctx.Provider value={theme}>{children}</Ctx.Provider>;
}

/** Read the active Noor palette.  Must be used inside NoorThemeProvider. */
export function useNoorTheme(): Palette {
  const palette = useContext(Ctx);
  if (!palette) throw new Error("useNoorTheme must be used inside NoorThemeProvider");
  return palette;
}

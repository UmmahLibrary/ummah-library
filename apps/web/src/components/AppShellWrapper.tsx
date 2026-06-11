"use client";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "./shell/AppShell";

/** Routes that render full-screen with their own layout (no shell). */
const SHELL_EXCLUDED = ["/landing", "/surah"];

interface Props {
  children: ReactNode;
}

export function AppShellWrapper({ children }: Props) {
  const pathname = usePathname();
  const noShell = SHELL_EXCLUDED.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (noShell) return <>{children}</>;
  return <AppShell>{children}</AppShell>;
}

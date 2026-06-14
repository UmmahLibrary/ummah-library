"use client";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { TabBar } from "./TabBar";
import { SearchProvider } from "./SearchContext";
import { N } from "@ummahlibrary/ui";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <SearchProvider>
      <div
        style={{
          width: "100%",
          height: "100dvh",
          display: "flex",
          overflow: "hidden",
          background: N.bg,
        }}
      >
        {/* Sidebar — desktop only */}
        <div className="noor-sidebar">
          <Sidebar />
        </div>

        {/* Main column */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <TopBar />
          <main
            id="main"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            {children}
          </main>
          {/* TabBar — mobile only */}
          <div className="noor-tabbar">
            <TabBar />
          </div>
        </div>
      </div>
    </SearchProvider>
  );
}

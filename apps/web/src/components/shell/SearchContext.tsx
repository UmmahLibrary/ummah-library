"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface SearchValue {
  query: string;
  setQuery: (q: string) => void;
}

const SearchCtx = createContext<SearchValue | null>(null);

/**
 * App-level search state shared between the top bar and the Hub surah index —
 * mirrors the design where typing in the top search filters the home surah list.
 * Lives in the shell so it survives navigation between shell routes.
 */
export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  return <SearchCtx.Provider value={{ query, setQuery }}>{children}</SearchCtx.Provider>;
}

export function useSearch(): SearchValue {
  const ctx = useContext(SearchCtx);
  if (!ctx) return { query: "", setQuery: () => {} };
  return ctx;
}

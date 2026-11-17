import { createContext } from "react";
import type { Locale } from "./config";

/**
 * The interface language for low-level text rendering (Type.tsx), kept in its
 * own module so Type.tsx needn't import the provider. Set by I18nProvider.
 */
export const UiLocaleContext = createContext<Locale>("en");

/**
 * Noor-typed re-export of react-native. Everything passes through unchanged
 * except Text and TextInput, which are wrapped to pick the correct Hanken (UI)
 * or IBM Plex Sans Arabic family for their weight / writing direction.
 *
 * Why: React Native won't synthesise a bold face from a single custom-font file
 * (each weight is its own family), and React 19 ignores the old
 * `Text.defaultProps` trick — so screens import RN through here and get the
 * right Noor font everywhere, on web and on device. See src/fonts.ts.
 *
 * Only the *outermost* Text injects a family; nested Text inherits its parent's
 * font (the native RN behaviour) so Arabic word-spans aren't forced back to the
 * Latin face. A caller can always override with an explicit `fontFamily`.
 */
import { createContext, forwardRef, useContext, type ComponentRef } from "react";
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
} from "react-native";
import { FONT } from "./fonts";

export * from "react-native";

const InsideText = createContext(false);

function familyFor(style: TextProps["style"] | TextInputProps["style"]): string {
  const f = StyleSheet.flatten(style) as
    | { fontWeight?: string | number; writingDirection?: string }
    | undefined;
  const w = String(f?.fontWeight ?? "400");
  const heavy = w === "700" || w === "800" || w === "900" || w === "bold";
  if (f?.writingDirection === "rtl") {
    return heavy ? FONT.arBold : w === "600" ? FONT.arSemibold : w === "500" ? FONT.arMedium : FONT.ar;
  }
  if (w === "800" || w === "900") return FONT.extrabold;
  if (heavy) return FONT.bold;
  if (w === "600") return FONT.semibold;
  if (w === "500") return FONT.medium;
  return FONT.regular;
}

const Text = forwardRef<ComponentRef<typeof RNText>, TextProps>(function Text({ style, ...rest }, ref) {
  const nested = useContext(InsideText);
  const injected = nested ? null : { fontFamily: familyFor(style) };
  return (
    <InsideText.Provider value={true}>
      <RNText ref={ref} {...rest} style={[injected, style]} />
    </InsideText.Provider>
  );
});

const TextInput = forwardRef<ComponentRef<typeof RNTextInput>, TextInputProps>(function TextInput(
  { style, ...rest },
  ref,
) {
  return <RNTextInput ref={ref} {...rest} style={[{ fontFamily: familyFor(style) }, style]} />;
});

export { Text, TextInput };

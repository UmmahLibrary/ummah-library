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
 *
 * Urdu (ADR 0042): text that contains Urdu's own letters is set in Nastaʿlīq
 * with room for its slope, as on web, whatever face the style named — except
 * the Quran faces, which are never changed. Arabic uses different code points
 * for those letters (ي ه ك), so Arabic text, duʿās included, keeps its face.
 */
import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  type ComponentRef,
  type ReactNode,
} from "react";
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from "react-native";
import { FONT } from "./fonts";
import { UiLocaleContext } from "./i18n/ui-locale";

export * from "react-native";

const InsideText = createContext(false);

function familyFor(style: TextProps["style"] | TextInputProps["style"]): string {
  const f = StyleSheet.flatten(style) as
    | { fontWeight?: string | number; writingDirection?: string }
    | undefined;
  const w = String(f?.fontWeight ?? "400");
  const heavy = w === "700" || w === "800" || w === "900" || w === "bold";
  if (f?.writingDirection === "rtl") {
    return heavy
      ? FONT.arBold
      : w === "600"
        ? FONT.arSemibold
        : w === "500"
          ? FONT.arMedium
          : FONT.ar;
  }
  if (w === "800" || w === "900") return FONT.extrabold;
  if (heavy) return FONT.bold;
  if (w === "600") return FONT.semibold;
  if (w === "500") return FONT.medium;
  return FONT.regular;
}

/** Letters only Urdu (and Persian) use: ٹ ڈ ڑ ں ھ ہ ۃ ی ے ۓ ک گ ۔ */
const URDU = /[ٹڈڑںھہۃیےۓکگ۔]/;
const ARABIC_SCRIPT = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
const QURAN_FACES = new Set<string>([FONT.arQuran, FONT.arIndopak]);
/** Faces a style names on purpose for Arabic content (e.g. surah names). */
const ARABIC_FACES = new Set<string>([FONT.ar, FONT.arMedium, FONT.arSemibold, FONT.arBold]);

/** Whether the text (or any nested text) matches a pattern. */
function contains(children: ReactNode, pattern: RegExp): boolean {
  let found = false;
  const visit = (node: ReactNode) => {
    if (found || node == null || typeof node === "boolean") return;
    if (typeof node === "string") {
      found = pattern.test(node);
      return;
    }
    if (Array.isArray(node)) return node.forEach(visit);
    if (isValidElement<{ children?: ReactNode }>(node)) visit(node.props.children);
  };
  Children.forEach(children, visit);
  return found;
}

/** The Nastaʿlīq face and taller line for Urdu text, or null to leave it. */
function urduOverride(
  style: TextProps["style"],
  injected: string | null,
  children: ReactNode,
  urduInterface: boolean,
): TextStyle | null {
  const f = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const family = (f.fontFamily as string | undefined) ?? injected ?? undefined;
  if (family && QURAN_FACES.has(family)) return null;
  // Urdu letters anywhere → Nastaʿlīq. In the Urdu interface, any
  // Arabic-script text in an interface face is Urdu too (as web sets the
  // whole Urdu interface in Nastaʿlīq) — except text that names an Arabic
  // face on purpose, such as a surah's Arabic name.
  const urdu =
    contains(children, URDU) ||
    (urduInterface &&
      !(family && ARABIC_FACES.has(family) && f.fontFamily) &&
      contains(children, ARABIC_SCRIPT));
  if (!urdu) return null;
  const name = family ?? "";
  const w = String(f.fontWeight ?? "");
  const weight =
    /700|800|900/.test(name) || /700|800|900|bold/.test(w)
      ? FONT.urBold
      : /600/.test(name) || w === "600"
        ? FONT.urSemibold
        : /500/.test(name) || w === "500"
          ? FONT.urMedium
          : FONT.ur;
  const size = f.fontSize ?? 14;
  return {
    fontFamily: weight,
    lineHeight: Math.max(
      typeof f.lineHeight === "number" ? f.lineHeight : 0,
      Math.round(size * 1.9),
    ),
    letterSpacing: 0,
    textTransform: "none",
  };
}

/** Latin runs (words, numbers, punctuation between them) inside Urdu text. */
const LATIN_RUN = /([A-Za-z][A-Za-z0-9'’\-.,:;()/ ]*[A-Za-z0-9).])|([A-Za-z])/g;

/** The Hanken face matching a Nastaʿlīq weight. */
const LATIN_FOR: Record<string, string> = {
  [FONT.ur]: FONT.regular,
  [FONT.urMedium]: FONT.medium,
  [FONT.urSemibold]: FONT.semibold,
  [FONT.urBold]: FONT.bold,
};

/**
 * Nastaʿlīq has no Latin letters of its own, so in mixed Urdu text ("The
 * Opening · ۷ آیات") Latin runs get the Hanken face — what the browser's font
 * fallback does on web.
 */
function withLatinRuns(children: ReactNode, urduFamily: string): ReactNode {
  const latin = LATIN_FOR[urduFamily] ?? FONT.regular;
  const split = (text: string, k: number): ReactNode => {
    if (!/[A-Za-z]/.test(text)) return text;
    const out: ReactNode[] = [];
    let last = 0;
    for (const m of text.matchAll(LATIN_RUN)) {
      const i = m.index ?? 0;
      if (i > last) out.push(text.slice(last, i));
      out.push(
        <RNText key={`${k}-${i}`} style={{ fontFamily: latin }}>
          {m[0]}
        </RNText>,
      );
      last = i + m[0].length;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
  };
  return Children.map(children, (c, k) => (typeof c === "string" ? split(c, k) : c));
}

const Text = forwardRef<ComponentRef<typeof RNText>, TextProps>(function Text(
  { style, children, ...rest },
  ref,
) {
  const nested = useContext(InsideText);
  const injected = nested ? null : familyFor(style);
  const urduInterface = useContext(UiLocaleContext) === "ur";
  const urdu = urduOverride(style, injected, children, urduInterface);
  return (
    <InsideText.Provider value={true}>
      <RNText ref={ref} {...rest} style={[injected ? { fontFamily: injected } : null, style, urdu]}>
        {urdu ? withLatinRuns(children, urdu.fontFamily as string) : children}
      </RNText>
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

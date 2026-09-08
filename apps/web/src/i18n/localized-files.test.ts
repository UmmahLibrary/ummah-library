import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import ts from "typescript";

/**
 * The i18n ratchet (#208, ADR 0040).
 *
 * Localizing the UI is a long incremental sweep — ~170 components, done a screen
 * at a time. The risk is not the sweep, it's the drift behind it: a file gets its
 * strings extracted, then three PRs later someone adds a hardcoded label to it
 * and nobody notices until a reader switches to Urdu.
 *
 * So the sweep ratchets. A file joins `LOCALIZED` when its strings move into the
 * catalogue, and from then on this test fails if any *visible* literal text
 * reappears in it — either as JSX text or in one of the user-facing attributes
 * below. Files not yet swept are simply absent; this never blocks work on them.
 *
 * Scope: it checks the files claimed to be done, not the ones that aren't. It is
 * a ratchet, not a coverage metric.
 *
 * Known blind spot: it sees JSX text and user-facing JSX attributes, so a string
 * living in a **data array** — `const GROUPS = [{ label: "Dark" }]`, a theme
 * description, an options list — passes even though a reader still sees English.
 * That is not hypothetical: the theme picker's group labels and palette
 * descriptions were missed exactly this way and had to be caught by eye. Widening
 * the check to every string literal would flag ids, CSS values and test data, so
 * the honest position is that this catches the common case and a human still
 * reads the screen once. Anything found by eye should be added to a file's
 * coverage here so it cannot regress.
 */

/** Files whose user-visible strings have been extracted into `messages.ts`. */
const LOCALIZED = [
  "components/shell/Sidebar.tsx",
  "components/shell/TabBar.tsx",
  "components/shell/TopBar.tsx",
  "app/tools/page.tsx",
  "components/ToolsPrayerCard.tsx",
  "components/ToolsQiblaCard.tsx",
  "components/ThemePicker.tsx",
  "components/DataBackup.tsx",
  "components/SyncSettings.tsx",
  "components/LanguagePicker.tsx",
];

/** Attributes that reach the user as prose and must therefore be translated. */
const TEXT_ATTRIBUTES = new Set(["placeholder", "title", "aria-label", "alt", "aria-description"]);

/**
 * Literal text that is deliberately not translated, with the reason. Keyed by
 * file, then by the exact literal. Keep this list short and argued — every entry
 * is a string a reader in another language still sees in English.
 */
const ALLOWED: Record<string, Record<string, string>> = {
  "components/shell/TopBar.tsx": {
    "⌘K": "keyboard glyph, not prose — the same symbol in every language",
    A: "placeholder avatar initial, not a word",
  },
  "components/ToolsPrayerCard.tsx": {
    "🕌": "decorative emoji",
  },
};

interface Finding {
  file: string;
  line: number;
  text: string;
  kind: "jsx-text" | "attribute";
}

function scan(relative: string): Finding[] {
  const absolute = join(__dirname, "..", relative);
  const source = ts.createSourceFile(
    absolute,
    readFileSync(absolute, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const allowed = ALLOWED[relative] ?? {};
  const findings: Finding[] = [];

  const lineOf = (node: ts.Node) =>
    source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;

  const visit = (node: ts.Node): void => {
    if (ts.isJsxText(node)) {
      // JSX collapses whitespace-only text; only real prose counts.
      const text = node.text.trim();
      if (text && !(text in allowed)) {
        findings.push({ file: relative, line: lineOf(node), text, kind: "jsx-text" });
      }
    }

    // A user-facing attribute given a bare string literal, e.g. title="Read the
    // blog". The same attribute fed an expression — title={t("…")} — is fine.
    if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
      const name = node.name.getText(source);
      const text = node.initializer.text.trim();
      if (TEXT_ATTRIBUTES.has(name) && text && !(text in allowed)) {
        findings.push({
          file: relative,
          line: lineOf(node),
          text: `${name}="${text}"`,
          kind: "attribute",
        });
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(source);
  return findings;
}

describe("i18n ratchet — already-localized files stay localized", () => {
  for (const file of LOCALIZED) {
    it(`${file} has no untranslated user-visible text`, () => {
      const findings = scan(file);
      const report = findings.map((f) => `${f.file}:${f.line} [${f.kind}] ${f.text}`);
      expect(
        report,
        `Hardcoded text found in a file listed as localized. Move it into ` +
          `i18n/messages.ts and read it with t(), or — if it genuinely should not ` +
          `be translated — add it to ALLOWED in this test with a reason.\n  ` +
          report.join("\n  "),
      ).toEqual([]);
    });
  }

  it("every listed file exists", () => {
    for (const file of LOCALIZED) {
      expect(() => readFileSync(join(__dirname, "..", file), "utf8")).not.toThrow();
    }
  });
});
